const { app, BrowserWindow, ipcMain } = require('electron')
const path = require('path')
const fs = require('fs')

console.log('[Electron Main] ========== 开始加载注入脚本 ==========')
console.log('[Electron Main] 当前目录:', __dirname)

// 读取注入脚本
try {
  console.log('[Electron Main] 1/4 读取 window-open-handler.js...')
  const windowOpenHandlerPath = path.join(__dirname, 'scripts/window-open-handler.js')
  console.log('[Electron Main] 路径:', windowOpenHandlerPath)
  const windowOpenHandlerScript = fs.readFileSync(windowOpenHandlerPath, 'utf8')
  console.log('[Electron Main] ✓ window-open-handler.js 读取成功 (', windowOpenHandlerScript.length, 'bytes)')

  console.log('[Electron Main] 2/4 读取 iframe-inject.js...')
  const iframeInjectPath = path.join(__dirname, 'scripts/iframe-inject.js')
  console.log('[Electron Main] 路径:', iframeInjectPath)
  const iframeInjectScript = fs.readFileSync(iframeInjectPath, 'utf8')
  console.log('[Electron Main] ✓ iframe-inject.js 读取成功 (', iframeInjectScript.length, 'bytes)')

  console.log('[Electron Main] 3/4 读取 check-iframe-id.js...')
  const checkIframeIdPath = path.join(__dirname, 'scripts/check-iframe-id.js')
  console.log('[Electron Main] 路径:', checkIframeIdPath)
  const checkIframeIdScript = fs.readFileSync(checkIframeIdPath, 'utf8')
  console.log('[Electron Main] ✓ check-iframe-id.js 读取成功 (', checkIframeIdScript.length, 'bytes)')

  console.log('[Electron Main] 4/4 读取 execute-in-iframe.js...')
  const executeInIframePath = path.join(__dirname, 'scripts/execute-in-iframe.js')
  console.log('[Electron Main] 路径:', executeInIframePath)
  const executeInIframeScript = fs.readFileSync(executeInIframePath, 'utf8')
  console.log('[Electron Main] ✓ execute-in-iframe.js 读取成功 (', executeInIframeScript.length, 'bytes)')

  console.log('[Electron Main] ========== 所有脚本加载完成 ==========')
  
  // 导出脚本供后续使用
  global.windowOpenHandlerScript = windowOpenHandlerScript
  global.iframeInjectScript = iframeInjectScript
  global.checkIframeIdScript = checkIframeIdScript
  global.executeInIframeScript = executeInIframeScript
} catch (error) {
  console.error('[Electron Main] ✗ 脚本读取失败:', error.message)
  console.error('[Electron Main] 错误详情:', error)
  process.exit(1)
}

// 设置 User-Agent
app.userAgentFallback = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36'

// 完全禁用CORS和安全策略
app.commandLine.appendSwitch('disable-web-security')
app.commandLine.appendSwitch('disable-features', 'OutOfBlinkCors')
app.commandLine.appendSwitch('disable-site-isolation-trials')

let mainWindow

function createWindow() {
  console.log('[Electron Main] ========== 开始创建主窗口 ==========')
  
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 800,
    minHeight: 600,
    icon: path.join(__dirname, '../public/256x256.ico'),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: false, // 禁用沙箱以允许访问iframe
      webSecurity: false, // 禁用web安全策略
      allowRunningInsecureContent: true,
      webviewTag: true,
      preload: path.join(__dirname, 'preload.js')
    },
    backgroundColor: '#f5f5f5',
    show: false,
    autoHideMenuBar: true // 隐藏菜单栏，但保留原生标题栏
  })

  console.log('[Electron Main] 主窗口创建完成，准备加载内容')
  
  // 开发模式加载开发服务器，生产模式加载构建文件
  if (process.env.NODE_ENV === 'development') {
    console.log('[Electron Main] 开发模式，加载 http://localhost:3000')
    mainWindow.loadURL('http://localhost:3000')
    mainWindow.webContents.openDevTools()
  } else {
    console.log('[Electron Main] 生产模式，加载本地文件')
    const indexPath = path.join(__dirname, '../dist/index.html')
    console.log('[Electron Main] 文件路径:', indexPath)
    mainWindow.loadFile(indexPath)
  }
  
  console.log('[Electron Main] 页面加载已启动')
  
  // 添加心跳日志，用于检测是否卡死
  let heartbeatCount = 0
  const heartbeatInterval = setInterval(() => {
    heartbeatCount++
    if (heartbeatCount <= 10) { // 只输出前10次，避免刷屏
      console.log('[Electron Main] ❤️ 心跳', heartbeatCount, '- 主进程运行正常')
    }
    if (heartbeatCount === 10) {
      console.log('[Electron Main] 心跳日志已达到10次，停止输出（主进程正常）')
      clearInterval(heartbeatInterval)
    }
  }, 2000) // 每2秒一次


  // 拦截新窗口打开 - 在macOS全屏时不跳转到新窗口
  // 策略：创建新窗口但立即关闭，然后通知主页面在iframe中导航
  mainWindow.webContents.setWindowOpenHandler(({ url, frameName, disposition }) => {
    console.log('[Window Open Guard] 拦截新窗口打开:', { url, frameName, disposition })
    
    try {
      // 发送消息到渲染进程，让它在最近点击的iframe中导航
      const escapedUrl = url.replace(/\\/g, '\\\\').replace(/'/g, "\\'")
      const scriptToExecute = global.windowOpenHandlerScript.replace('URL_TO_OPEN', escapedUrl)
      console.log('[Window Open Guard] 准备执行脚本，URL长度:', escapedUrl.length)
      
      mainWindow.webContents.executeJavaScript(scriptToExecute).then(() => {
        console.log('[Window Open Guard] ✓ 脚本执行成功')
      }).catch(err => {
        console.log('[Window Open Guard] ✗ 执行失败:', err.message)
      })
    } catch (error) {
      console.error('[Window Open Guard] ✗ 处理失败:', error.message)
    }
    
    // 阻止打开新窗口
    return { action: 'deny' }
  })

  // 监听所有 frame 的创建，用于在 iframe 中注入代码
  mainWindow.webContents.on('did-frame-navigate', (event, url, httpResponseCode, httpStatusText, isMainFrame, frameProcessId, frameRoutingId) => {
    if (!isMainFrame) {
      console.log('[Iframe Inject] ========== iframe 导航完成 ==========')
      console.log('[Iframe Inject] URL:', url)
      console.log('[Iframe Inject] HTTP状态:', httpResponseCode, httpStatusText)
      console.log('[Iframe Inject] PID:', frameProcessId, 'RoutingID:', frameRoutingId)
      
      try {
        // 查找对应的 frame
        console.log('[Iframe Inject] 查找对应的frame...')
        const frame = mainWindow.webContents.mainFrame.framesInSubtree.find(
          f => f.processId === frameProcessId && f.routingId === frameRoutingId
        )
        
        if (frame) {
          console.log('[Iframe Inject] ✓ 找到frame，准备注入代码')
          console.log('[Iframe Inject] 注入脚本大小:', global.iframeInjectScript.length, 'bytes')
          
          // 在 iframe 中注入代码
          setTimeout(() => {
            console.log('[Iframe Inject] 开始执行注入...')
            frame.executeJavaScript(global.iframeInjectScript).then(() => {
              console.log('[Iframe Inject] ✓ 代码注入成功')
            }).catch(err => {
              console.error('[Iframe Inject] ✗ iframe代码注入失败:', err.message)
              console.error('[Iframe Inject] 错误堆栈:', err.stack)
            })
          }, 100)
        } else {
          console.warn('[Iframe Inject] ✗ 未找到对应的frame')
        }
      } catch (error) {
        console.error('[Iframe Inject] ✗ 处理iframe导航失败:', error.message)
        console.error('[Iframe Inject] 错误堆栈:', error.stack)
      }
    }
  })

  // 监听页面加载完成
  mainWindow.webContents.on('did-finish-load', () => {
    console.log('[Electron Main] 页面加载完成')
  })

  console.log('[Electron Main] 设置CORS和Cookie处理')
  
  // 存储请求的 Origin，用于 CORS 响应
  const requestOrigins = new Map()

  // 禁用所有iframe的CORS限制，并转发 Cookie
  mainWindow.webContents.session.webRequest.onBeforeSendHeaders(
    { urls: ['*://*/*'] },
    async (details, callback) => {
      // console.log('[CORS] onBeforeSendHeaders:', details.url.substring(0, 100))
      const requestHeaders = { ...details.requestHeaders }

      // 存储请求的 Origin 头，用于后续的 CORS 响应
      if (requestHeaders['Origin'] || requestHeaders['origin']) {
        const origin = requestHeaders['Origin'] || requestHeaders['origin']
        requestOrigins.set(details.url, origin)
        // console.log(`[CORS] 存储请求 Origin: ${origin} for ${details.url}`)
        
        // 5秒后清理，避免内存泄漏
        setTimeout(() => {
          requestOrigins.delete(details.url)
        }, 5000)
      }

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
          // console.log(`[Cookie] 为 ${url.hostname} 添加 Cookie:`, cookieString.substring(0, 100))
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

      // 处理 CORS 头
      // 如果之前存储了这个请求的 Origin，使用它；否则使用请求URL的 origin
      const storedOrigin = requestOrigins.get(details.url)
      
      if (storedOrigin) {
        // 有明确的请求 Origin，使用它并允许凭证
        // console.log(`[CORS] 使用存储的 Origin: ${storedOrigin}`)
        responseHeaders['Access-Control-Allow-Origin'] = [storedOrigin]
        responseHeaders['Access-Control-Allow-Methods'] = ['GET, POST, PUT, DELETE, OPTIONS, PATCH']
        responseHeaders['Access-Control-Allow-Headers'] = ['*']
        responseHeaders['Access-Control-Allow-Credentials'] = ['true']
        responseHeaders['Access-Control-Expose-Headers'] = ['*']
        responseHeaders['Vary'] = ['Origin']
      } else {
        // 没有明确的 Origin（可能是同源请求或导航请求）
        // 使用请求URL的 origin 并允许凭证
        try {
          const urlObj = new URL(details.url)
          const requestOrigin = `${urlObj.protocol}//${urlObj.host}`
          
          // console.log(`[CORS] 使用请求URL的 origin: ${requestOrigin}`)
          responseHeaders['Access-Control-Allow-Origin'] = [requestOrigin]
          responseHeaders['Access-Control-Allow-Methods'] = ['GET, POST, PUT, DELETE, OPTIONS, PATCH']
          responseHeaders['Access-Control-Allow-Headers'] = ['*']
          responseHeaders['Access-Control-Allow-Credentials'] = ['true']
          responseHeaders['Access-Control-Expose-Headers'] = ['*']
        } catch (e) {
          // 如果无法解析 URL，使用宽松设置（但不带凭证以避免冲突）
          // console.log(`[CORS] URL 解析失败，使用通配符`)
          responseHeaders['Access-Control-Allow-Origin'] = ['*']
          responseHeaders['Access-Control-Allow-Methods'] = ['GET, POST, PUT, DELETE, OPTIONS, PATCH']
          responseHeaders['Access-Control-Allow-Headers'] = ['*']
        }
      }

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
    console.log('[Electron Main] 窗口准备完成，显示窗口')
    mainWindow.show()
  })

  mainWindow.on('closed', () => {
    console.log('[Electron Main] 窗口已关闭')
    mainWindow = null
  })
  
  console.log('[Electron Main] ========== 主窗口创建流程完成 ==========')
}

console.log('[Electron Main] 等待应用就绪...')

app.whenReady().then(() => {
  console.log('[Electron Main] ========== 应用已就绪 ==========')
  createWindow()

  app.on('activate', () => {
    console.log('[Electron Main] activate事件触发')
    if (BrowserWindow.getAllWindows().length === 0) {
      console.log('[Electron Main] 没有窗口，创建新窗口')
      createWindow()
    }
  })
  
  console.log('[Electron Main] 事件监听器已设置')
})

// 处理在iframe中执行JavaScript的请求
ipcMain.handle('execute-in-iframe', async (event, iframeId, code) => {
  console.log('[IPC Execute] ========== 收到execute-in-iframe请求 ==========')
  console.log('[IPC Execute] iframe ID:', iframeId)
  console.log('[IPC Execute] 代码长度:', code.length, 'bytes')
  
  try {
    if (!mainWindow || mainWindow.isDestroyed()) {
      console.error('[IPC Execute] ✗ mainWindow不可用')
      return { success: false, error: 'Window not available' }
    }

    console.log('[IPC Execute] mainWindow状态: OK')

    // 首先尝试使用 frame API 直接执行
    try {
      console.log('[IPC Execute] 方法1: 尝试使用 frame API 直接执行')
      
      // 遍历所有 frames 查找目标 iframe
      const frames = mainWindow.webContents.mainFrame.framesInSubtree
      console.log('[IPC Execute] 找到', frames.length, '个 frames，开始遍历...')
      
      let frameIndex = 0
      for (const frame of frames) {
        frameIndex++
        console.log('[IPC Execute] 检查frame', frameIndex + '/' + frames.length)
        
        try {
          // 检查是否是目标 iframe
          console.log('[IPC Execute] 执行check-iframe-id脚本...')
          const frameIframeId = await frame.executeJavaScript(global.checkIframeIdScript).catch((err) => {
            console.log('[IPC Execute] check失败:', err.message)
            return null
          })
          
          console.log('[IPC Execute] frame', frameIndex, '的ID:', frameIframeId)
          
          if (frameIframeId === iframeId) {
            console.log('[IPC Execute] ✓ 找到目标iframe (frame', frameIndex + ')，直接执行代码')
            const result = await frame.executeJavaScript(code)
            console.log('[IPC Execute] ✓ 代码执行成功，结果:', result)
            return { success: true, result: result }
          }
        } catch (e) {
          // 忽略单个 frame 的错误，继续查找
          console.log('[IPC Execute] frame', frameIndex, '检查失败:', e.message)
        }
      }
      
      console.log('[IPC Execute] ✗ 未通过 frame API 找到目标 iframe')
    } catch (e) {
      console.error('[IPC Execute] ✗ frame API 方法失败:', e.message)
      console.error('[IPC Execute] 错误堆栈:', e.stack)
    }

    // 如果 frame API 失败，使用 postMessage 方法
    console.log('[IPC Execute] 方法2: 使用 postMessage 后备方法')
    
    console.log('[IPC Execute] 准备脚本替换...')
    const scriptToExecute = global.executeInIframeScript
      .replace('IFRAME_ID', iframeId)
      .replace('CODE_TO_EXECUTE', code.replace(/`/g, '\\`').replace(/\$/g, '\\$'))
    
    console.log('[IPC Execute] 脚本准备完成，长度:', scriptToExecute.length, 'bytes')
    console.log('[IPC Execute] 开始执行postMessage脚本...')
    
    const result = await mainWindow.webContents.executeJavaScript(scriptToExecute)

    console.log('[IPC Execute] ✓ postMessage方法执行完成')
    console.log('[IPC Execute] 结果:', result)
    return result
    
  } catch (error) {
    console.error('[IPC Execute] ✗ IPC处理错误:', error.message)
    console.error('[IPC Execute] 错误堆栈:', error.stack)
    return { success: false, error: error.message }
  }
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

