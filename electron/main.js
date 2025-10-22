const { app, BrowserWindow, ipcMain } = require('electron')
const path = require('path')

// 设置 User-Agent
app.userAgentFallback = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36'

// 完全禁用CORS和安全策略
app.commandLine.appendSwitch('disable-web-security')
app.commandLine.appendSwitch('disable-features', 'OutOfBlinkCors')
app.commandLine.appendSwitch('disable-site-isolation-trials')

let mainWindow

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 800,
    minHeight: 600,
    icon: path.join(__dirname, '../public/256x256.ico'),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: false, // 禁用web安全策略
      allowRunningInsecureContent: true,
      webviewTag: true,
      preload: path.join(__dirname, 'preload.js')
    },
    backgroundColor: '#f5f5f5',
    show: false,
    autoHideMenuBar: true // 隐藏菜单栏，但保留原生标题栏
  })

  // 开发模式加载开发服务器，生产模式加载构建文件
  if (process.env.NODE_ENV === 'development') {
    console.log('[Electron Main] 开发模式，加载 http://localhost:3000')
    mainWindow.loadURL('http://localhost:3000')
    mainWindow.webContents.openDevTools()
  } else {
    console.log('[Electron Main] 生产模式，加载本地文件')
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'))
  }

  // 监听页面加载完成
  mainWindow.webContents.on('did-finish-load', () => {
    console.log('[Electron Main] 页面加载完成')
  })

  // 禁用所有iframe的CORS限制，并转发 Cookie
  mainWindow.webContents.session.webRequest.onBeforeSendHeaders(
    { urls: ['*://*/*'] },
    async (details, callback) => {
      const requestHeaders = { ...details.requestHeaders }

      // 获取当前域名的所有 cookies
      try {
        const url = new URL(details.url)
        const cookies = await mainWindow.webContents.session.cookies.get({
          domain: url.hostname
        })

        // 如果有 cookie，添加到请求头中
        if (cookies.length > 0) {
          const cookieString = cookies.map(c => `${c.name}=${c.value}`).join('; ')
          requestHeaders['Cookie'] = cookieString
          console.log(`[Cookie] 为 ${url.hostname} 添加 Cookie:`, cookieString.substring(0, 100))
        }
      } catch (e) {
        // 忽略错误，继续请求
      }

      callback({ requestHeaders })
    }
  )

  mainWindow.webContents.session.webRequest.onHeadersReceived(
    { urls: ['*://*/*'] },
    (details, callback) => {
      const responseHeaders = { ...details.responseHeaders }

      // 移除阻止iframe加载的headers
      delete responseHeaders['x-frame-options']
      delete responseHeaders['X-Frame-Options']
      delete responseHeaders['content-security-policy']
      delete responseHeaders['Content-Security-Policy']

      // 添加允许CORS的headers
      responseHeaders['Access-Control-Allow-Origin'] = ['*']
      responseHeaders['Access-Control-Allow-Methods'] = ['GET, POST, PUT, DELETE, OPTIONS']
      responseHeaders['Access-Control-Allow-Headers'] = ['*']
      responseHeaders['Access-Control-Allow-Credentials'] = ['true']

      // 修改 Set-Cookie 的 SameSite 属性，使其在 iframe 中也能工作
      if (responseHeaders['set-cookie']) {
        responseHeaders['set-cookie'] = responseHeaders['set-cookie'].map(cookie => {
          // 移除 SameSite=Lax 或 SameSite=Strict
          let modifiedCookie = cookie.replace(/;\s*SameSite=(Lax|Strict)/gi, '')
          // 添加 SameSite=None 和 Secure（iframe 中必需）
          if (!modifiedCookie.includes('SameSite=None')) {
            modifiedCookie += '; SameSite=None'
          }
          if (!modifiedCookie.includes('Secure')) {
            modifiedCookie += '; Secure'
          }
          return modifiedCookie
        })
      }
      if (responseHeaders['Set-Cookie']) {
        responseHeaders['Set-Cookie'] = responseHeaders['Set-Cookie'].map(cookie => {
          let modifiedCookie = cookie.replace(/;\s*SameSite=(Lax|Strict)/gi, '')
          if (!modifiedCookie.includes('SameSite=None')) {
            modifiedCookie += '; SameSite=None'
          }
          if (!modifiedCookie.includes('Secure')) {
            modifiedCookie += '; Secure'
          }
          return modifiedCookie
        })
      }

      callback({ responseHeaders })
    }
  )

  mainWindow.once('ready-to-show', () => {
    mainWindow.show()
  })

  mainWindow.on('closed', () => {
    mainWindow = null
  })
}

app.whenReady().then(() => {
  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

// 处理在iframe中执行JavaScript的请求
ipcMain.handle('execute-in-iframe', async (event, iframeId, code) => {
  try {
    console.log('[Electron Main] 收到execute-in-iframe请求:', iframeId)

    if (!mainWindow || mainWindow.isDestroyed()) {
      console.error('[Electron Main] mainWindow不可用')
      return { success: false, error: 'Window not available' }
    }

    // 在主窗口的渲染进程中执行代码
    const result = await mainWindow.webContents.executeJavaScript(`
      (function() {
        try {
          console.log('[Electron Renderer] 查找iframe:', '${iframeId}');
          const iframe = document.querySelector('iframe[data-iframe-id="${iframeId}"]');
          
          if (!iframe) {
            console.error('[Electron Renderer] 未找到iframe');
            return { success: false, error: 'Iframe not found' };
          }
          
          if (!iframe.contentWindow) {
            console.error('[Electron Renderer] iframe.contentWindow不可用');
            return { success: false, error: 'Iframe contentWindow not available' };
          }
          
          console.log('[Electron Renderer] 正在执行代码...');
          
          // 在iframe的context中执行代码
          const result = iframe.contentWindow.eval(\`${code.replace(/`/g, '\\`').replace(/\$/g, '\\$')}\`);
          
          console.log('[Electron Renderer] 代码执行成功');
          return { success: true, result: result };
        } catch (e) {
          console.error('[Electron Renderer] 执行失败:', e.message);
          return { success: false, error: e.message };
        }
      })()
    `)

    console.log('[Electron Main] 执行结果:', result)
    return result
  } catch (error) {
    console.error('[Electron Main] IPC处理错误:', error.message)
    return { success: false, error: error.message }
  }
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

