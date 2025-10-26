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

  // 监听所有 frame 的创建，用于在 iframe 中注入代码
  mainWindow.webContents.on('did-frame-navigate', (event, url, httpResponseCode, httpStatusText, isMainFrame, frameProcessId, frameRoutingId) => {
    if (!isMainFrame) {
      console.log('[Electron Main] iframe 导航完成:', url)
      
      // 查找对应的 frame
      const frame = mainWindow.webContents.mainFrame.framesInSubtree.find(
        f => f.processId === frameProcessId && f.routingId === frameRoutingId
      )
      
      if (frame) {
        // 在 iframe 中注入代码
        setTimeout(() => {
          frame.executeJavaScript(`
            (function() {
              console.log('[Tab Hive iframe] 注入代码执行监听器');
              
              // ===========================================
              // iframe反检测 - 让网站认为不在iframe中
              // ===========================================
              
              console.log('[Tab Hive Anti-Detection] 开始应用反检测措施');
              
              // 方法1: 覆盖 window.top
              try {
                Object.defineProperty(window, 'top', {
                  get: function() {
                    return window.self;
                  },
                  configurable: false
                });
                console.log('[Tab Hive Anti-Detection] ✓ window.top 已重定向');
              } catch (e) {
                console.log('[Tab Hive Anti-Detection] ✗ window.top 覆盖失败:', e.message);
              }
              
              // 方法2: 覆盖 window.parent
              try {
                Object.defineProperty(window, 'parent', {
                  get: function() {
                    return window.self;
                  },
                  configurable: false
                });
                console.log('[Tab Hive Anti-Detection] ✓ window.parent 已重定向');
              } catch (e) {
                console.log('[Tab Hive Anti-Detection] ✗ window.parent 覆盖失败:', e.message);
              }
              
              // 方法3: 覆盖 window.frameElement
              try {
                Object.defineProperty(window, 'frameElement', {
                  get: function() {
                    return null;
                  },
                  configurable: false
                });
                console.log('[Tab Hive Anti-Detection] ✓ window.frameElement 已设置为 null');
              } catch (e) {
                console.log('[Tab Hive Anti-Detection] ✗ window.frameElement 覆盖失败:', e.message);
              }
              
              // 方法4: 伪造 window.location.ancestorOrigins
              try {
                if (window.location.ancestorOrigins) {
                  Object.defineProperty(window.location, 'ancestorOrigins', {
                    get: function() {
                      return {
                        length: 0,
                        item: function() { return null; },
                        contains: function() { return false; }
                      };
                    }
                  });
                  console.log('[Tab Hive Anti-Detection] ✓ ancestorOrigins 已伪造');
                }
              } catch (e) {
                console.log('[Tab Hive Anti-Detection] ✗ ancestorOrigins 覆盖失败:', e.message);
              }
              
              console.log('[Tab Hive Anti-Detection] 反检测措施应用完成');
              
              // ===========================================
              // window.open 拦截
              // ===========================================
              
              // 保存原始的window.open
              const originalOpen = window.open;
              
              // 重写window.open
              window.open = function(url, target, features) {
                console.log('[Tab Hive iframe] window.open被调用:', url, target);
                
                // 如果是_blank或新窗口，改为在当前页面打开
                if (!target || target === '_blank' || target === '_new') {
                  console.log('[Tab Hive iframe] 重定向到当前iframe:', url);
                  window.location.href = url;
                  return window;
                }
                
                // 其他情况也在当前页面打开
                window.location.href = url;
                return window;
              };
              
              // 添加 postMessage 监听器用于执行代码（选择器功能）
              window.addEventListener('message', function(e) {
                if (e.data && e.data.type === 'exec-code') {
                  console.log('[Tab Hive iframe] 收到代码执行请求');
                  try {
                    const result = eval(e.data.code);
                    window.parent.postMessage({
                      type: 'exec-result',
                      messageId: e.data.messageId,
                      result: { success: true, result: result }
                    }, '*');
                  } catch (error) {
                    console.error('[Tab Hive iframe] 代码执行失败:', error);
                    window.parent.postMessage({
                      type: 'exec-result',
                      messageId: e.data.messageId,
                      result: { success: false, error: error.message }
                    }, '*');
                  }
                }
              });
              
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
              
              console.log('[Tab Hive iframe] 代码注入完成 ✓');
            })();
          `).catch(err => {
            console.error('[Electron Main] iframe 代码注入失败:', err.message)
          })
        }, 100)
      }
    }
  })

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

    // 首先尝试使用 frame API 直接执行
    try {
      console.log('[Electron Main] 尝试使用 frame API')
      
      // 遍历所有 frames 查找目标 iframe
      const frames = mainWindow.webContents.mainFrame.framesInSubtree
      console.log('[Electron Main] 找到', frames.length, '个 frames')
      
      for (const frame of frames) {
        try {
          // 检查是否是目标 iframe
          const frameIframeId = await frame.executeJavaScript(`
            (function() {
              if (window.frameElement) {
                return window.frameElement.getAttribute('data-iframe-id');
              }
              return null;
            })()
          `).catch(() => null)
          
          if (frameIframeId === iframeId) {
            console.log('[Electron Main] 找到目标 iframe，直接执行代码')
            const result = await frame.executeJavaScript(code)
            console.log('[Electron Main] 代码执行成功')
            return { success: true, result: result }
          }
        } catch (e) {
          // 忽略单个 frame 的错误，继续查找
          console.log('[Electron Main] frame 检查失败:', e.message)
        }
      }
      
      console.log('[Electron Main] 未通过 frame API 找到目标 iframe')
    } catch (e) {
      console.error('[Electron Main] frame API 失败:', e.message)
    }

    // 如果 frame API 失败，使用 postMessage 方法
    console.log('[Electron Main] 使用 postMessage 后备方法')
    
    const result = await mainWindow.webContents.executeJavaScript(`
      (function() {
        return new Promise((resolve) => {
          try {
            console.log('[Electron Renderer] 查找iframe:', '${iframeId}');
            const iframe = document.querySelector('iframe[data-iframe-id="${iframeId}"]');
            
            if (!iframe) {
              console.error('[Electron Renderer] 未找到iframe');
              resolve({ success: false, error: 'Iframe not found' });
              return;
            }
            
            if (!iframe.contentWindow) {
              console.error('[Electron Renderer] iframe.contentWindow不可用');
              resolve({ success: false, error: 'Iframe contentWindow not available' });
              return;
            }
            
            console.log('[Electron Renderer] 使用 postMessage 发送代码...');
            
            // 使用 postMessage 与 iframe 通信
            const messageId = 'exec-' + Date.now() + '-' + Math.random();
            
            const handleMessage = (e) => {
              if (e.data && e.data.type === 'exec-result' && e.data.messageId === messageId) {
                window.removeEventListener('message', handleMessage);
                resolve(e.data.result);
              }
            };
            
            window.addEventListener('message', handleMessage);
            
            // 5秒超时
            setTimeout(() => {
              window.removeEventListener('message', handleMessage);
              resolve({ success: false, error: 'Execution timeout' });
            }, 5000);
            
            // 发送执行请求
            iframe.contentWindow.postMessage({
              type: 'exec-code',
              messageId: messageId,
              code: \`${code.replace(/`/g, '\\`').replace(/\$/g, '\\$')}\`
            }, '*');
            
          } catch (e) {
            console.error('[Electron Renderer] 执行失败:', e.message);
            resolve({ success: false, error: e.message });
          }
        });
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

