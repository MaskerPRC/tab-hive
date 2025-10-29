const { app, BaseWindow, WebContentsView, ipcMain, screen } = require('electron')
const path = require('path')
const fs = require('fs')

console.log('[Electron Main] ========== 启动应用 ==========')

// 开发环境热更新支持
try {
  if (process.env.NODE_ENV === 'development') {
    require('electron-reloader')(module, {
      debug: true,
      watchRenderer: true,
      // 监控 electron 目录和 preload 脚本
      ignore: ['node_modules/**', 'dist/**', 'release/**', 'src/**']
    })
    console.log('[Electron Main] 热更新已启用')
  }
} catch (err) {
  console.log('[Electron Main] 热更新加载失败（可能在生产环境）:', err.message)
}

// 设置用户数据目录（确保有写权限）
const userDataPath = path.join(app.getPath('appData'), 'tab-hive')
if (!fs.existsSync(userDataPath)) {
  fs.mkdirSync(userDataPath, { recursive: true })
}
app.setPath('userData', userDataPath)
console.log('[Electron Main] 用户数据目录:', userDataPath)

// 设置缓存目录
const cachePath = path.join(userDataPath, 'Cache')
if (!fs.existsSync(cachePath)) {
  fs.mkdirSync(cachePath, { recursive: true })
}
console.log('[Electron Main] 缓存目录:', cachePath)

// 设置 User-Agent
app.userAgentFallback = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Safari/537.36'

// 完全禁用CORS和安全策略
app.commandLine.appendSwitch('disable-web-security')
app.commandLine.appendSwitch('disable-features', 'OutOfBlinkCors')
app.commandLine.appendSwitch('disable-site-isolation-trials')

// 设置缓存路径（解决缓存权限问题）
app.commandLine.appendSwitch('disk-cache-dir', cachePath)
app.commandLine.appendSwitch('disk-cache-size', '104857600') // 100MB

// 全局变量
let mainWindow = null
let controlView = null // 控制界面的 View
const websiteViews = new Map() // 存储所有网站的 WebContentsView

// WebContentsView 管理器
class WebContentsViewManager {
  constructor(window, controlView) {
    this.window = window
    this.controlView = controlView // 保存控制视图引用
    this.views = new Map()
    this.viewOrder = [] // 保持视图的 z-index 顺序
  }

  /**
   * 确保控制视图在最上层
   */
  ensureControlViewOnTop() {
    if (this.controlView) {
      // 移除并重新添加控制视图，使其在最上层
      try {
        this.window.contentView.removeChildView(this.controlView)
        this.window.contentView.addChildView(this.controlView)
        console.log('[ViewManager] 控制视图已提升到最上层')
      } catch (error) {
        console.error('[ViewManager] 提升控制视图失败:', error)
      }
    }
  }

  /**
   * 创建或更新一个网站视图
   * @param {string} id - 视图ID
   * @param {object} options - 配置选项
   * @returns {WebContentsView}
   */
  createOrUpdateView(id, options) {
    console.log(`[ViewManager] 创建/更新视图: ${id}`, options)
    
    let view = this.views.get(id)
    
    if (!view) {
      // 创建新视图
      view = new WebContentsView({
        webPreferences: {
          nodeIntegration: false,
          contextIsolation: true,
          webSecurity: false,
          allowRunningInsecureContent: true,
          sandbox: false,
          // 允许跨域请求
          webviewTag: false
        }
      })

      // 设置 CORS 和 Cookie 处理
      this.setupCorsAndCookies(view)

      // 处理新窗口打开
      view.webContents.setWindowOpenHandler(({ url }) => {
        console.log(`[ViewManager] 视图 ${id} 尝试打开新窗口:`, url)
        // 在当前视图中导航
        view.webContents.loadURL(url)
        return { action: 'deny' }
      })

      this.views.set(id, view)
      this.viewOrder.push(id)
      
      // 先添加 WebContentsView（在底层）
      this.window.contentView.addChildView(view)
      
      // 确保控制视图在最上层
      this.ensureControlViewOnTop()
      
      console.log(`[ViewManager] ✓ 新视图创建完成: ${id}`)
    }

    // 设置视图位置和大小
    if (options.bounds) {
      view.setBounds(options.bounds)
    }

    // 设置视图可见性
    if (options.visible !== undefined) {
      view.setVisible(options.visible)
    }

    // 加载 URL
    if (options.url && view.webContents.getURL() !== options.url) {
      console.log(`[ViewManager] 加载 URL: ${options.url}`)
      view.webContents.loadURL(options.url).catch(err => {
        console.error(`[ViewManager] 加载 URL 失败:`, err)
      })
    }

    return view
  }

  /**
   * 设置 CORS 和 Cookie 处理
   */
  setupCorsAndCookies(view) {
    const requestOrigins = new Map()

    view.webContents.session.webRequest.onBeforeSendHeaders(
      { urls: ['*://*/*'] },
      async (details, callback) => {
        const requestHeaders = { ...details.requestHeaders }

        // 存储请求的 Origin 头
        if (requestHeaders['Origin'] || requestHeaders['origin']) {
          const origin = requestHeaders['Origin'] || requestHeaders['origin']
          requestOrigins.set(details.url, origin)
          
          setTimeout(() => {
            requestOrigins.delete(details.url)
          }, 5000)
        }

        // 获取并添加 cookies
        try {
          const url = new URL(details.url)
          const cookies = await view.webContents.session.cookies.get({
            domain: url.hostname
          })

          if (cookies.length > 0) {
            const cookieString = cookies.map(c => `${c.name}=${c.value}`).join('; ')
            requestHeaders['Cookie'] = cookieString
          }
        } catch (e) {
          // 忽略错误
        }

        callback({ requestHeaders })
      }
    )

    view.webContents.session.webRequest.onHeadersReceived(
      { urls: ['*://*/*'] },
      (details, callback) => {
        const responseHeaders = { ...details.responseHeaders }

        // 移除阻止iframe加载的headers
        delete responseHeaders['x-frame-options']
        delete responseHeaders['X-Frame-Options']
        delete responseHeaders['content-security-policy']
        delete responseHeaders['Content-Security-Policy']

        // 处理 CORS 头
        const storedOrigin = requestOrigins.get(details.url)

        if (storedOrigin) {
          responseHeaders['Access-Control-Allow-Origin'] = [storedOrigin]
          responseHeaders['Access-Control-Allow-Methods'] = ['GET, POST, PUT, DELETE, OPTIONS, PATCH']
          responseHeaders['Access-Control-Allow-Headers'] = ['*']
          responseHeaders['Access-Control-Allow-Credentials'] = ['true']
          responseHeaders['Access-Control-Expose-Headers'] = ['*']
          responseHeaders['Vary'] = ['Origin']
        } else {
          try {
            const urlObj = new URL(details.url)
            const requestOrigin = `${urlObj.protocol}//${urlObj.host}`
            responseHeaders['Access-Control-Allow-Origin'] = [requestOrigin]
            responseHeaders['Access-Control-Allow-Methods'] = ['GET, POST, PUT, DELETE, OPTIONS, PATCH']
            responseHeaders['Access-Control-Allow-Headers'] = ['*']
            responseHeaders['Access-Control-Allow-Credentials'] = ['true']
            responseHeaders['Access-Control-Expose-Headers'] = ['*']
          } catch (e) {
            responseHeaders['Access-Control-Allow-Origin'] = ['*']
            responseHeaders['Access-Control-Allow-Methods'] = ['GET, POST, PUT, DELETE, OPTIONS, PATCH']
            responseHeaders['Access-Control-Allow-Headers'] = ['*']
          }
        }

        // 修改 Set-Cookie 的 SameSite 属性
        if (responseHeaders['set-cookie']) {
          responseHeaders['set-cookie'] = responseHeaders['set-cookie'].map(cookie => {
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
  }

  /**
   * 删除视图
   */
  removeView(id) {
    const view = this.views.get(id)
    if (view) {
      console.log(`[ViewManager] 删除视图: ${id}`)
      this.window.contentView.removeChildView(view)
      view.webContents.close()
      this.views.delete(id)
      this.viewOrder = this.viewOrder.filter(vid => vid !== id)
    }
  }

  /**
   * 获取视图
   */
  getView(id) {
    return this.views.get(id)
  }

  /**
   * 隐藏所有视图除了指定的
   */
  hideAllExcept(exceptId) {
    for (const [id, view] of this.views.entries()) {
      if (id !== exceptId) {
        view.setVisible(false)
      }
    }
  }

  /**
   * 显示所有视图
   */
  showAll() {
    for (const view of this.views.values()) {
      view.setVisible(true)
    }
  }

  /**
   * 清空所有视图
   */
  clear() {
    for (const [id, view] of this.views.entries()) {
      this.window.contentView.removeChildView(view)
      view.webContents.close()
    }
    this.views.clear()
    this.viewOrder = []
  }

  /**
   * 刷新视图
   */
  refreshView(id) {
    const view = this.views.get(id)
    if (view) {
      console.log(`[ViewManager] 刷新视图: ${id}`)
      view.webContents.reload()
    }
  }

  /**
   * 在视图中执行 JavaScript
   */
  async executeJavaScript(id, code) {
    const view = this.views.get(id)
    if (view) {
      try {
        return await view.webContents.executeJavaScript(code)
      } catch (error) {
        console.error(`[ViewManager] 执行 JavaScript 失败 (${id}):`, error)
        throw error
      }
    }
    throw new Error(`View not found: ${id}`)
  }
}

let viewManager = null

function createWindow() {
  console.log('[Electron Main] ========== 创建主窗口 ==========')

  // 获取屏幕尺寸
  const { width: screenWidth, height: screenHeight } = screen.getPrimaryDisplay().workAreaSize

  // 创建 BaseWindow
  mainWindow = new BaseWindow({
    width: Math.min(1400, screenWidth),
    height: Math.min(900, screenHeight),
    minWidth: 800,
    minHeight: 600,
    icon: path.join(__dirname, '../public/256x256.ico'),
    backgroundColor: '#f5f5f5',
    show: false,
    autoHideMenuBar: true
  })

  console.log('[Electron Main] BaseWindow 创建完成')

  // 注意：先不创建视图管理器，等控制视图加载完成后再创建

  // 创建控制界面视图
  // 注意：控制视图需要在最后添加，以确保在所有 WebContentsView 之上
  controlView = new WebContentsView({
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: false,
      preload: path.join(__dirname, 'preload.js'),
      // 设置透明背景
      transparent: true,
      backgroundThrottling: false
    }
  })
  
  // 设置 WebContentsView 的背景为透明
  controlView.setBackgroundColor('#00000000') // 完全透明

  // 注意：WebContentsView 没有 setIgnoreMouseEvents 方法
  // 我们需要在主窗口级别控制，或者通过 CSS pointer-events
  console.log('[Electron Main] 控制视图背景已设置为透明')

  // 先不添加控制视图，等待页面加载后再添加
  // 这样可以确保控制视图始终在最上层
  
  // 设置控制视图的大小和位置（全屏覆盖）
  const bounds = mainWindow.getBounds()
  controlView.setBounds({ x: 0, y: 0, width: bounds.width, height: bounds.height })

  // 加载控制界面
  if (process.env.NODE_ENV === 'development') {
    console.log('[Electron Main] 开发模式，加载 http://localhost:3000')
    controlView.webContents.loadURL('http://localhost:3000')
    
    // 等待页面加载完成后打开 DevTools 和显示窗口
    controlView.webContents.once('did-finish-load', () => {
      console.log('[Electron Main] 控制界面加载完成')
      
      // 在页面加载完成后添加控制视图（确保在所有 WebContentsView 之上）
      mainWindow.contentView.addChildView(controlView)
      console.log('[Electron Main] 控制视图已添加到窗口（最上层）')
      
      // 现在创建视图管理器，传入控制视图引用
      viewManager = new WebContentsViewManager(mainWindow, controlView)
      console.log('[Electron Main] 视图管理器已创建')
      
      controlView.webContents.openDevTools()
      
      // 显示窗口
      if (!mainWindow.isVisible()) {
        console.log('[Electron Main] 显示窗口')
        mainWindow.show()
      }
    })
  } else {
    console.log('[Electron Main] 生产模式，加载本地文件')
    const indexPath = path.join(__dirname, '../dist/index.html')
    console.log('[Electron Main] 文件路径:', indexPath)
    controlView.webContents.loadFile(indexPath)
    
    // 生产模式也需要监听加载完成
    controlView.webContents.once('did-finish-load', () => {
      console.log('[Electron Main] 控制界面加载完成')
      
      // 在页面加载完成后添加控制视图（确保在所有 WebContentsView 之上）
      mainWindow.contentView.addChildView(controlView)
      console.log('[Electron Main] 控制视图已添加到窗口（最上层）')
      
      // 现在创建视图管理器，传入控制视图引用
      viewManager = new WebContentsViewManager(mainWindow, controlView)
      console.log('[Electron Main] 视图管理器已创建')
      
      if (!mainWindow.isVisible()) {
        console.log('[Electron Main] 显示窗口')
        mainWindow.show()
      }
    })
  }

  // 监听窗口大小变化
  mainWindow.on('resize', () => {
    const bounds = mainWindow.getBounds()
    if (controlView) {
      controlView.setBounds({ x: 0, y: 0, width: bounds.width, height: bounds.height })
    }
    // 通知渲染进程窗口大小变化
    if (controlView && controlView.webContents) {
      controlView.webContents.send('window-resized', bounds)
    }
  })

  // BaseWindow 没有 ready-to-show 事件，直接在加载完成后显示
  // 备用方案：如果 did-finish-load 没有触发，3秒后强制显示
  setTimeout(() => {
    if (mainWindow && !mainWindow.isVisible()) {
      console.log('[Electron Main] 超时后强制显示窗口')
      mainWindow.show()
    }
  }, 3000)

  mainWindow.on('closed', () => {
    console.log('[Electron Main] 窗口已关闭')
    if (viewManager) {
      viewManager.clear()
    }
    mainWindow = null
    controlView = null
    viewManager = null
  })

  // 监听控制视图的加载失败
  controlView.webContents.on('did-fail-load', (event, errorCode, errorDescription) => {
    console.error('[Electron Main] 控制界面加载失败:', errorCode, errorDescription)
    // 即使加载失败也显示窗口，方便调试
    if (!mainWindow.isVisible()) {
      mainWindow.show()
    }
  })

  console.log('[Electron Main] ========== 主窗口创建流程完成 ==========')
}

// IPC 事件处理
ipcMain.handle('create-website-view', async (event, { id, url, bounds, visible = true }) => {
  console.log(`[IPC] 创建/更新网站视图:`, { id, url, bounds, visible })
  
  try {
    if (!viewManager) {
      throw new Error('ViewManager not initialized')
    }

    viewManager.createOrUpdateView(id, { url, bounds, visible })
    
    return { success: true }
  } catch (error) {
    console.error('[IPC] 创建视图失败:', error)
    return { success: false, error: error.message }
  }
})

ipcMain.handle('update-website-view', async (event, { id, bounds, visible, url }) => {
  console.log(`[IPC] 更新网站视图:`, { id, bounds, visible, url })
  
  try {
    if (!viewManager) {
      throw new Error('ViewManager not initialized')
    }

    const view = viewManager.getView(id)
    if (!view) {
      throw new Error(`View not found: ${id}`)
    }

    if (bounds !== undefined) {
      view.setBounds(bounds)
    }

    if (visible !== undefined) {
      view.setVisible(visible)
    }

    if (url !== undefined && view.webContents.getURL() !== url) {
      await view.webContents.loadURL(url)
    }

    return { success: true }
  } catch (error) {
    console.error('[IPC] 更新视图失败:', error)
    return { success: false, error: error.message }
  }
})

ipcMain.handle('remove-website-view', async (event, { id }) => {
  console.log(`[IPC] 删除网站视图: ${id}`)
  
  try {
    if (!viewManager) {
      throw new Error('ViewManager not initialized')
    }

    viewManager.removeView(id)
    
    return { success: true }
  } catch (error) {
    console.error('[IPC] 删除视图失败:', error)
    return { success: false, error: error.message }
  }
})

ipcMain.handle('refresh-website-view', async (event, { id }) => {
  console.log(`[IPC] 刷新网站视图: ${id}`)
  
  try {
    if (!viewManager) {
      throw new Error('ViewManager not initialized')
    }

    viewManager.refreshView(id)
    
    return { success: true }
  } catch (error) {
    console.error('[IPC] 刷新视图失败:', error)
    return { success: false, error: error.message }
  }
})

ipcMain.handle('execute-in-view', async (event, { id, code }) => {
  console.log(`[IPC] 在视图中执行 JavaScript: ${id}`)
  
  try {
    if (!viewManager) {
      throw new Error('ViewManager not initialized')
    }

    const result = await viewManager.executeJavaScript(id, code)
    
    return { success: true, result }
  } catch (error) {
    console.error('[IPC] 执行 JavaScript 失败:', error)
    return { success: false, error: error.message }
  }
})

ipcMain.handle('hide-all-views-except', async (event, { id }) => {
  console.log(`[IPC] 隐藏除 ${id} 外的所有视图`)
  
  try {
    if (!viewManager) {
      throw new Error('ViewManager not initialized')
    }

    viewManager.hideAllExcept(id)
    
    return { success: true }
  } catch (error) {
    console.error('[IPC] 隐藏视图失败:', error)
    return { success: false, error: error.message }
  }
})

ipcMain.handle('show-all-views', async (event) => {
  console.log(`[IPC] 显示所有视图`)
  
  try {
    if (!viewManager) {
      throw new Error('ViewManager not initialized')
    }

    viewManager.showAll()
    
    return { success: true }
  } catch (error) {
    console.error('[IPC] 显示视图失败:', error)
    return { success: false, error: error.message }
  }
})

ipcMain.handle('get-window-bounds', async (event) => {
  if (!mainWindow) {
    throw new Error('Window not initialized')
  }
  return mainWindow.getBounds()
})

// 注意：我们不再使用 setIgnoreMouseEvents，完全依赖 CSS pointer-events 控制穿透

console.log('[Electron Main] 等待应用就绪...')

app.whenReady().then(() => {
  console.log('[Electron Main] ========== 应用已就绪 ==========')
  createWindow()

  app.on('activate', () => {
    console.log('[Electron Main] activate事件触发')
    if (!mainWindow) {
      console.log('[Electron Main] 没有窗口，创建新窗口')
      createWindow()
    }
  })

  console.log('[Electron Main] 事件监听器已设置')
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
