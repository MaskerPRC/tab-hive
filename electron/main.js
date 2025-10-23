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


  // 拦截新窗口打开 - 在macOS全屏时不跳转到新窗口
  // 策略：创建新窗口但立即关闭，然后通知主页面在iframe中导航
  mainWindow.webContents.setWindowOpenHandler(({ url, frameName, disposition }) => {
    console.log('[Window Open Guard] 拦截新窗口打开:', { url, frameName, disposition })
    
    // 发送消息到渲染进程，让它在最近点击的iframe中导航
    mainWindow.webContents.executeJavaScript(`
      (function() {
        console.log('[Window Open Guard] 尝试在iframe中打开:', '${url.replace(/'/g, "\\'")}');
        
        // 查找最近获得焦点的iframe
        const activeElement = document.activeElement;
        if (activeElement && activeElement.tagName === 'IFRAME') {
          console.log('[Window Open Guard] 找到活动iframe，在其中导航');
          try {
            activeElement.contentWindow.location.href = '${url.replace(/'/g, "\\'")}';
            return true;
          } catch (e) {
            console.log('[Window Open Guard] 导航失败:', e.message);
          }
        }
        
        // 如果没有找到活动iframe，尝试在最后一个iframe中打开
        const iframes = document.querySelectorAll('iframe');
        if (iframes.length > 0) {
          const lastIframe = iframes[iframes.length - 1];
          console.log('[Window Open Guard] 在最后一个iframe中导航');
          try {
            lastIframe.contentWindow.location.href = '${url.replace(/'/g, "\\'")}';
            return true;
          } catch (e) {
            console.log('[Window Open Guard] 导航失败:', e.message);
          }
        }
        
        console.log('[Window Open Guard] 未找到可用iframe');
        return false;
      })();
    `).catch(err => {
      console.log('[Window Open Guard] 执行失败:', err.message)
    })
    
    // 阻止打开新窗口
    return { action: 'deny' }
  })

  // 监听页面加载完成
  mainWindow.webContents.on('did-finish-load', () => {
    console.log('[Electron Main] 页面加载完成')
    
    // 注入JavaScript来处理iframe中的链接和window.open
    mainWindow.webContents.executeJavaScript(`
      (function() {
        console.log('[Link Handler] 初始化iframe链接和window.open处理器');
        
        // 处理iframe的函数
        const setupIframe = (iframe) => {
          console.log('[Link Handler] 设置iframe:', iframe.src);
          
          const injectCode = () => {
            try {
              if (!iframe.contentWindow) {
                console.log('[Link Handler] contentWindow不可用');
                return;
              }
              
              // 重写window.open - 让它在当前iframe中导航而不是打开新窗口
              const script = \`
                (function() {
                  console.log('[Link Handler] 注入iframe window.open拦截器');
                  
                  // 保存原始的window.open
                  const originalOpen = window.open;
                  
                  // 重写window.open
                  window.open = function(url, target, features) {
                    console.log('[Link Handler] window.open被调用:', url, target);
                    
                    // 如果是_blank或新窗口，改为在当前页面打开
                    if (!target || target === '_blank' || target === '_new') {
                      console.log('[Link Handler] 重定向到当前iframe:', url);
                      window.location.href = url;
                      return window;
                    }
                    
                    // 其他情况也在当前页面打开
                    window.location.href = url;
                    return window;
                  };
                  
                  // 修改所有target="_blank"的链接
                  const modifyLinks = () => {
                    const links = document.querySelectorAll('a[target="_blank"]');
                    links.forEach(link => {
                      link.setAttribute('target', '_self');
                    });
                  };
                  
                  // 立即执行
                  modifyLinks();
                  
                  // 监听DOM变化
                  if (document.body) {
                    const observer = new MutationObserver(modifyLinks);
                    observer.observe(document.body, {
                      childList: true,
                      subtree: true,
                      attributes: true,
                      attributeFilter: ['target']
                    });
                  }
                  
                  console.log('[Link Handler] window.open拦截器安装完成');
                })();
              \`;
              
              iframe.contentWindow.eval(script);
              console.log('[Link Handler] ✅ 成功注入到iframe');
            } catch (e) {
              console.log('[Link Handler] ❌ 注入失败（可能是跨域）:', e.message);
            }
          };
          
          // 立即尝试注入
          injectCode();
          
          // 监听load事件，在加载完成后注入
          iframe.addEventListener('load', () => {
            console.log('[Link Handler] iframe加载完成，重新注入');
            setTimeout(injectCode, 0);
            setTimeout(injectCode, 50);
            setTimeout(injectCode, 200);
          });
        };
        
        // 监听iframe的创建
        const observer = new MutationObserver((mutations) => {
          mutations.forEach((mutation) => {
            mutation.addedNodes.forEach((node) => {
              if (node.tagName === 'IFRAME') {
                console.log('[Link Handler] 检测到新iframe');
                setupIframe(node);
              }
            });
          });
        });
        
        // 开始监听DOM变化
        if (document.body) {
          observer.observe(document.body, {
            childList: true,
            subtree: true
          });
          
          // 处理现有的iframe
          document.querySelectorAll('iframe').forEach(setupIframe);
        } else {
          // 如果body还未加载，等待DOMContentLoaded
          document.addEventListener('DOMContentLoaded', () => {
            observer.observe(document.body, {
              childList: true,
              subtree: true
            });
            document.querySelectorAll('iframe').forEach(setupIframe);
          });
        }
        
        console.log('[Link Handler] 初始化完成');
      })();
    `).catch(err => {
      console.error('[Electron Main] 注入链接处理器失败:', err)
    })
  })

  // Cookie 缓存，避免在请求拦截器中使用 async
  const cookieCache = new Map()
  const COOKIE_CACHE_TTL = 5000 // 缓存 5 秒

  // 异步更新 cookie 缓存
  const updateCookieCache = async (hostname) => {
    try {
      const cookies = await mainWindow.webContents.session.cookies.get({
        domain: hostname
      })
      cookieCache.set(hostname, {
        cookies,
        timestamp: Date.now()
      })
    } catch (e) {
      console.error(`[Cookie] 获取 ${hostname} 的 cookies 失败:`, e.message)
    }
  }

  // 禁用所有iframe的CORS限制，并转发 Cookie
  mainWindow.webContents.session.webRequest.onBeforeSendHeaders(
    { urls: ['*://*/*'] },
    (details, callback) => {
      const requestHeaders = { ...details.requestHeaders }

      // 获取当前域名的 cookies（使用缓存）
      try {
        const url = new URL(details.url)
        const hostname = url.hostname
        
        // 检查缓存
        const cached = cookieCache.get(hostname)
        const now = Date.now()
        
        // 异步更新缓存（不阻塞当前请求）
        if (!cached || (now - cached.timestamp) > COOKIE_CACHE_TTL) {
          updateCookieCache(hostname)
        }

        // 如果有缓存的 cookie，添加到请求头中
        if (cached && cached.cookies.length > 0) {
          const cookieString = cached.cookies.map(c => `${c.name}=${c.value}`).join('; ')
          requestHeaders['Cookie'] = cookieString
          console.log(`[Cookie] 为 ${hostname} 注入 Cookie (${cached.cookies.length} 个)`)
        }
      } catch (e) {
        // 忽略错误，继续请求
      }

      callback({ requestHeaders })
    }
  )

  // 监听 cookie 变化，更新缓存
  mainWindow.webContents.session.cookies.on('changed', (event, cookie, cause, removed) => {
    if (!removed && cookie.domain) {
      const hostname = cookie.domain.startsWith('.') 
        ? cookie.domain.substring(1) 
        : cookie.domain
      console.log(`[Cookie] Cookie 变化，更新缓存: ${hostname}`)
      updateCookieCache(hostname)
    }
  })

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

