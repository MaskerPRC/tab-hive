const { app, BrowserWindow, ipcMain, net, shell, session } = require('electron')
const path = require('path')
const fs = require('fs')
const os = require('os')

console.log('[Electron Main] ========== Tab Hive 启动 (Webview 架构) ==========')

// 设置 User-Agent
app.userAgentFallback = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/141.0.0.0 (KHTML, like Gecko) Safari/537.36'

let mainWindow
// 多窗口管理
const windows = new Map() // key: windowId, value: BrowserWindow
let windowIdCounter = 1

// Chrome 扩展管理
const loadedExtensions = new Map() // 存储已加载的扩展 {id: {name, path, version}}

// 存储已注册的 webview
// key: webviewId, value: { processId, frameId, webContents }
const registeredWebviews = new Map()

// 更新下载状态
let currentDownload = {
  url: null,
  savePath: null,
  totalBytes: 0,
  downloadedBytes: 0,
  status: 'idle', // idle, downloading, completed, failed
  error: null
}

function createWindow(windowId = null, options = {}) {
  const wid = windowId || windowIdCounter++
  console.log('[Electron Main] ========== 创建窗口 ==========')
  console.log('[Electron Main] 窗口 ID:', wid)

  const window = new BrowserWindow({
    width: options.width || 1400,
    height: options.height || 900,
    minWidth: 800,
    minHeight: 600,
    x: options.x,
    y: options.y,
    icon: path.join(__dirname, '../public/256x256.ico'),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: false,
      webSecurity: false,
      allowRunningInsecureContent: true,
      webviewTag: true, // 启用 webview 标签支持
      preload: path.join(__dirname, 'preload.js'),
      // 为每个窗口创建独立的 session partition
      partition: `persist:window-${wid}`
    },
    backgroundColor: '#f5f5f5',
    show: false,
    autoHideMenuBar: true,
    title: `Tab Hive - 窗口 ${wid}`
  })

  // 将窗口 ID 附加到窗口对象
  window.windowId = wid
  
  // 保存窗口引用
  windows.set(wid, window)
  
  // 如果是第一个窗口，设置为主窗口
  if (!mainWindow) {
    mainWindow = window
  }

  console.log('[Electron Main] ✓ 窗口创建完成')

  // 加载页面，带上窗口 ID
  if (process.env.NODE_ENV === 'development') {
    console.log('[Electron Main] 开发模式,加载 http://localhost:3000')
    window.loadURL(`http://localhost:3000?windowId=${wid}`)
    window.webContents.openDevTools()
  } else {
    console.log('[Electron Main] 生产模式,加载本地文件')
    const indexPath = path.join(__dirname, '../dist/index.html')
    console.log('[Electron Main] 文件路径:', indexPath)
    window.loadFile(indexPath, { query: { windowId: wid.toString() } })
  }

  console.log('[Electron Main] ========== 设置 CORS 和 Cookie 处理 ==========')

  window.once('ready-to-show', () => {
    console.log('[Electron Main] ✓ 窗口准备完成,显示窗口')
    window.show()
  })

  window.on('closed', () => {
    console.log('[Electron Main] 窗口已关闭, ID:', wid)
    windows.delete(wid)
    
    // 如果关闭的是主窗口，重新指定主窗口
    if (window === mainWindow) {
      mainWindow = windows.values().next().value || null
    }
  })

  console.log('[Electron Main] ========== 窗口创建流程完成 ==========')
  
  return { windowId: wid, window }
}

// ========== IPC 处理器 ==========

// ========== 窗口管理 ==========

/**
 * 创建新窗口
 */
ipcMain.handle('create-new-window', (event) => {
  console.log('[窗口管理] 创建新窗口')
  
  // 获取当前窗口的位置，新窗口稍微偏移
  const currentWindow = BrowserWindow.fromWebContents(event.sender)
  const bounds = currentWindow.getBounds()
  
  const result = createWindow(null, {
    x: bounds.x + 30,
    y: bounds.y + 30,
    width: bounds.width,
    height: bounds.height
  })
  
  console.log('[窗口管理] ✓ 新窗口已创建, ID:', result.windowId)
  
  return { 
    success: true, 
    windowId: result.windowId,
    totalWindows: windows.size
  }
})

/**
 * 获取所有窗口列表
 */
ipcMain.handle('get-all-windows', () => {
  const windowList = []
  windows.forEach((window, windowId) => {
    windowList.push({
      id: windowId,
      title: window.getTitle(),
      isFocused: window.isFocused()
    })
  })
  
  console.log('[窗口管理] 获取所有窗口:', windowList.length)
  return { success: true, windows: windowList }
})

/**
 * 聚焦到指定窗口
 */
ipcMain.handle('focus-window', (event, windowId) => {
  console.log('[窗口管理] 聚焦窗口:', windowId)
  
  const window = windows.get(windowId)
  if (window) {
    if (window.isMinimized()) {
      window.restore()
    }
    window.focus()
    console.log('[窗口管理] ✓ 窗口已聚焦')
    return { success: true }
  }
  
  console.warn('[窗口管理] ⚠ 窗口不存在:', windowId)
  return { success: false, error: '窗口不存在' }
})

/**
 * 获取当前窗口 ID
 */
ipcMain.handle('get-window-id', (event) => {
  const window = BrowserWindow.fromWebContents(event.sender)
  const windowId = window ? window.windowId : 1
  console.log('[窗口管理] 获取当前窗口 ID:', windowId)
  return { success: true, windowId }
})

// Webview 注册
ipcMain.handle('webview-register', (event, webviewId) => {
  console.log('[IPC] ========== Webview 注册 ==========')
  console.log('[IPC] Webview ID:', webviewId)
  console.log('[IPC] Process ID:', event.processId)
  console.log('[IPC] Frame ID:', event.frameId)

  // 保存 webview 信息
  registeredWebviews.set(webviewId, {
    processId: event.processId,
    frameId: event.frameId,
    webContents: event.sender
  })

  console.log('[IPC] ✓ Webview 注册成功')
  console.log('[IPC] 当前已注册的 Webview 数量:', registeredWebviews.size)

  // 向 webview 发送欢迎消息
  event.sender.sendToFrame(
    [event.processId, event.frameId],
    'main-to-webview',
    'welcome',
    { webviewId, message: '欢迎来到 Tab Hive!' }
  )

  return { success: true, webviewId }
})

// 在 webview 中执行 JavaScript
ipcMain.handle('execute-in-webview', async (event, webviewId, code) => {
  console.log('[IPC] ========== 在 Webview 中执行代码 ==========')
  console.log('[IPC] Webview ID:', webviewId)
  console.log('[IPC] 代码长度:', code.length, 'bytes')

  const webview = registeredWebviews.get(webviewId)

  if (!webview) {
    console.error('[IPC] ✗ Webview 未注册:', webviewId)
    return { success: false, error: 'Webview not registered' }
  }

  try {
    // 通过 webContents 发送执行命令
    webview.webContents.sendToFrame(
      [webview.processId, webview.frameId],
      'main-to-webview',
      'execute',
      code
    )

    console.log('[IPC] ✓ 执行命令已发送')
    return { success: true }
  } catch (error) {
    console.error('[IPC] ✗ 执行失败:', error.message)
    return { success: false, error: error.message }
  }
})

// 刷新 webview
ipcMain.handle('refresh-webview', async (event, webviewId) => {
  console.log('[IPC] ========== 刷新 Webview ==========')
  console.log('[IPC] Webview ID:', webviewId)

  // 发送刷新命令到渲染进程
  // 由渲染进程调用 webview.reload()
  mainWindow.webContents.send('refresh-webview-from-main', webviewId)

  return { success: true }
})

// 获取所有已注册的 webview
ipcMain.handle('get-registered-webviews', () => {
  const webviewIds = Array.from(registeredWebviews.keys())
  console.log('[IPC] 获取已注册的 Webview 列表:', webviewIds)
  return { success: true, webviews: webviewIds }
})

// 取消注册 webview
ipcMain.handle('webview-unregister', (event, webviewId) => {
  console.log('[IPC] ========== Webview 取消注册 ==========')
  console.log('[IPC] Webview ID:', webviewId)

  const removed = registeredWebviews.delete(webviewId)

  if (removed) {
    console.log('[IPC] ✓ Webview 已取消注册')
    console.log('[IPC] 剩余已注册的 Webview 数量:', registeredWebviews.size)
  } else {
    console.warn('[IPC] ⚠ Webview 未找到:', webviewId)
  }

  return { success: removed }
})

// ========== 更新下载处理 ==========

/**
 * 下载更新文件
 * @param {string} downloadUrl - 下载链接
 * @param {string} fileName - 文件名
 */
ipcMain.handle('download-update', async (event, downloadUrl, fileName) => {
  console.log('[更新下载] ========== 开始下载更新 ==========')
  console.log('[更新下载] URL:', downloadUrl)
  console.log('[更新下载] 文件名:', fileName)

  // 如果正在下载，返回错误
  if (currentDownload.status === 'downloading') {
    console.log('[更新下载] ✗ 已有下载任务在进行中')
    return { success: false, error: '已有下载任务在进行中' }
  }

  // 确定保存路径（下载到临时目录）
  const downloadDir = path.join(os.tmpdir(), 'tab-hive-updates')
  if (!fs.existsSync(downloadDir)) {
    fs.mkdirSync(downloadDir, { recursive: true })
  }
  const savePath = path.join(downloadDir, fileName)

  // 初始化下载状态
  currentDownload = {
    url: downloadUrl,
    savePath: savePath,
    totalBytes: 0,
    downloadedBytes: 0,
    status: 'downloading',
    error: null
  }

  try {
    // 处理下载响应的函数
    const handleDownloadResponse = (response, fileStream) => {
      // 获取文件总大小
      const contentLength = response.headers['content-length']
      if (contentLength) {
        const totalSize = parseInt(Array.isArray(contentLength) ? contentLength[0] : contentLength, 10)
        currentDownload.totalBytes = totalSize
        console.log('[更新下载] 文件大小:', (currentDownload.totalBytes / 1024 / 1024).toFixed(2), 'MB')
        
        // 立即发送初始状态
        if (mainWindow && !mainWindow.isDestroyed()) {
          mainWindow.webContents.send('update-download-progress', {
            downloaded: 0,
            total: currentDownload.totalBytes,
            progress: 0
          })
        }
      } else {
        console.warn('[更新下载] ⚠ 无法获取文件大小')
      }

      response.on('data', (chunk) => {
        currentDownload.downloadedBytes += chunk.length
        fileStream.write(chunk)

        // 发送进度更新到渲染进程（节流，避免过于频繁）
        if (mainWindow && !mainWindow.isDestroyed()) {
          const progress = currentDownload.totalBytes > 0 
            ? (currentDownload.downloadedBytes / currentDownload.totalBytes) * 100 
            : 0
          
          mainWindow.webContents.send('update-download-progress', {
            downloaded: currentDownload.downloadedBytes,
            total: currentDownload.totalBytes,
            progress: progress
          })
        }
      })

      response.on('end', () => {
        fileStream.end()
        console.log('[更新下载] ✓ 下载完成')
        console.log('[更新下载] 保存路径:', savePath)
        console.log('[更新下载] 已下载:', currentDownload.downloadedBytes, 'bytes')
        
        currentDownload.status = 'completed'
        
        // 通知渲染进程下载完成
        if (mainWindow && !mainWindow.isDestroyed()) {
          mainWindow.webContents.send('update-download-complete', {
            savePath: savePath
          })
        }
      })

      response.on('error', (error) => {
        console.error('[更新下载] ✗ 响应错误:', error.message)
        currentDownload.status = 'failed'
        currentDownload.error = error.message
        fileStream.close()

        if (mainWindow && !mainWindow.isDestroyed()) {
          mainWindow.webContents.send('update-download-error', {
            error: error.message
          })
        }
      })
    }
    
    // 使用 Electron 的 net 模块下载
    const request = net.request(downloadUrl)
    const fileStream = fs.createWriteStream(savePath)

    request.on('response', (response) => {
      console.log('[更新下载] 响应状态码:', response.statusCode)
      console.log('[更新下载] 响应头:', response.headers)
      
      // 处理重定向
      if (response.statusCode === 301 || response.statusCode === 302 || response.statusCode === 307 || response.statusCode === 308) {
        const redirectUrl = response.headers.location
        if (redirectUrl && redirectUrl.length > 0) {
          const redirectUrlStr = Array.isArray(redirectUrl) ? redirectUrl[0] : redirectUrl
          console.log('[更新下载] 重定向到:', redirectUrlStr)
          fileStream.close()
          
          // 重新发起请求到重定向的地址
          const redirectRequest = net.request(redirectUrlStr)
          const redirectFileStream = fs.createWriteStream(savePath)
          
          redirectRequest.on('response', (redirectResponse) => {
            handleDownloadResponse(redirectResponse, redirectFileStream)
          })
          
          redirectRequest.on('error', (error) => {
            console.error('[更新下载] ✗ 重定向请求失败:', error.message)
            currentDownload.status = 'failed'
            currentDownload.error = error.message
            redirectFileStream.close()
            if (mainWindow && !mainWindow.isDestroyed()) {
              mainWindow.webContents.send('update-download-error', {
                error: error.message
              })
            }
          })
          
          redirectRequest.end()
          return
        }
      }
      
      if (response.statusCode !== 200) {
        currentDownload.status = 'failed'
        currentDownload.error = `HTTP ${response.statusCode}`
        fileStream.close()
        return
      }

      handleDownloadResponse(response, fileStream)
    })

    request.on('error', (error) => {
      console.error('[更新下载] ✗ 下载失败:', error.message)
      currentDownload.status = 'failed'
      currentDownload.error = error.message
      fileStream.close()

      // 通知渲染进程下载失败
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('update-download-error', {
          error: error.message
        })
      }
    })

    request.end()

    return { success: true, savePath: savePath }
  } catch (error) {
    console.error('[更新下载] ✗ 启动下载失败:', error.message)
    currentDownload.status = 'failed'
    currentDownload.error = error.message
    return { success: false, error: error.message }
  }
})

/**
 * 获取当前下载状态
 */
ipcMain.handle('get-download-status', () => {
  return {
    success: true,
    download: {
      status: currentDownload.status,
      downloaded: currentDownload.downloadedBytes,
      total: currentDownload.totalBytes,
      progress: currentDownload.totalBytes > 0 
        ? (currentDownload.downloadedBytes / currentDownload.totalBytes) * 100 
        : 0,
      savePath: currentDownload.savePath,
      error: currentDownload.error
    }
  }
})

/**
 * 打开下载的安装文件
 */
ipcMain.handle('open-installer', async (event, filePath) => {
  console.log('[更新下载] 打开安装文件:', filePath)
  
  try {
    if (!fs.existsSync(filePath)) {
      console.error('[更新下载] ✗ 文件不存在:', filePath)
      return { success: false, error: '文件不存在' }
    }

    // 使用 shell.openPath 打开安装文件
    const result = await shell.openPath(filePath)
    
    if (result) {
      console.error('[更新下载] ✗ 打开失败:', result)
      return { success: false, error: result }
    }

    console.log('[更新下载] ✓ 安装文件已打开')
    
    // 等待一会儿后退出应用（让用户安装新版本）
    setTimeout(() => {
      console.log('[更新下载] 退出应用以便安装')
      app.quit()
    }, 1000)

    return { success: true }
  } catch (error) {
    console.error('[更新下载] ✗ 打开安装文件失败:', error.message)
    return { success: false, error: error.message }
  }
})

/**
 * 取消下载
 */
ipcMain.handle('cancel-download', () => {
  console.log('[更新下载] 取消下载')
  
  if (currentDownload.status === 'downloading') {
    currentDownload.status = 'idle'
    currentDownload.error = '用户取消'
    
    // 删除未完成的文件
    if (currentDownload.savePath && fs.existsSync(currentDownload.savePath)) {
      try {
        fs.unlinkSync(currentDownload.savePath)
        console.log('[更新下载] 已删除未完成的文件')
      } catch (e) {
        console.error('[更新下载] 删除文件失败:', e.message)
      }
    }
  }
  
  return { success: true }
})

// ========== Chrome 扩展管理 ==========

/**
 * 加载 Chrome 扩展
 */
async function loadExtension(extensionPath) {
  try {
    console.log(`[Extension] 尝试加载扩展: ${extensionPath}`)
    
    // 检查路径是否存在
    if (!fs.existsSync(extensionPath)) {
      throw new Error(`扩展路径不存在: ${extensionPath}`)
    }

    // 加载扩展
    const extension = await session.defaultSession.loadExtension(extensionPath, {
      allowFileAccess: true
    })
    
    console.log(`[Extension] ✓ 扩展加载成功:`, extension.name, extension.version)
    
    // 保存已加载的扩展信息
    loadedExtensions.set(extension.id, {
      id: extension.id,
      name: extension.name,
      path: extensionPath,
      version: extension.version
    })
    
    return { success: true, extension: {
      id: extension.id,
      name: extension.name,
      version: extension.version,
      path: extensionPath
    }}
  } catch (error) {
    console.error(`[Extension] ✗ 扩展加载失败:`, error.message)
    return { success: false, error: error.message }
  }
}

/**
 * 卸载扩展
 */
function unloadExtension(extensionId) {
  try {
    console.log(`[Extension] 尝试卸载扩展: ${extensionId}`)
    session.defaultSession.removeExtension(extensionId)
    loadedExtensions.delete(extensionId)
    console.log(`[Extension] ✓ 扩展卸载成功`)
    return { success: true }
  } catch (error) {
    console.error(`[Extension] ✗ 扩展卸载失败:`, error.message)
    return { success: false, error: error.message }
  }
}

/**
 * 获取所有已加载的扩展
 */
function getLoadedExtensions() {
  return Array.from(loadedExtensions.values())
}

// IPC: 加载扩展
ipcMain.handle('load-extension', async (event, extensionPath) => {
  return await loadExtension(extensionPath)
})

// IPC: 卸载扩展
ipcMain.handle('unload-extension', (event, extensionId) => {
  return unloadExtension(extensionId)
})

// IPC: 获取已加载的扩展列表
ipcMain.handle('get-loaded-extensions', () => {
  return getLoadedExtensions()
})

// ========== 桌面捕获 ==========

/**
 * 获取可用的桌面源（窗口和屏幕）
 */
ipcMain.handle('get-desktop-sources', async (event, options = {}) => {
  console.log('[Desktop Capture] 获取桌面源')
  
  const { desktopCapturer } = require('electron')
  
  try {
    const sources = await desktopCapturer.getSources({
      types: options.types || ['window', 'screen'],
      thumbnailSize: options.thumbnailSize || { width: 320, height: 180 },
      fetchWindowIcons: options.fetchWindowIcons !== false
    })
    
    console.log('[Desktop Capture] 找到', sources.length, '个源')
    
    // 转换源为可序列化的格式
    const serializedSources = sources.map(source => ({
      id: source.id,
      name: source.name,
      thumbnail: source.thumbnail.toDataURL(),
      display_id: source.display_id,
      appIcon: source.appIcon ? source.appIcon.toDataURL() : null
    }))
    
    return { success: true, sources: serializedSources }
  } catch (error) {
    console.error('[Desktop Capture] 获取源失败:', error)
    return { success: false, error: error.message }
  }
})

/**
 * 创建桌面捕获窗口
 */
ipcMain.handle('start-desktop-capture', async (event, sourceId, options = {}) => {
  console.log('[Desktop Capture] 开始捕获:', sourceId)
  
  try {
    // 发送捕获请求到渲染进程
    const window = BrowserWindow.fromWebContents(event.sender)
    if (window) {
      window.webContents.send('desktop-capture-source-selected', {
        sourceId,
        options
      })
      return { success: true }
    }
    
    return { success: false, error: '窗口不存在' }
  } catch (error) {
    console.error('[Desktop Capture] 启动捕获失败:', error)
    return { success: false, error: error.message }
  }
})

// IPC: 选择扩展目录
ipcMain.handle('select-extension-directory', async () => {
  const { dialog } = require('electron')
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openDirectory'],
    title: '选择Chrome扩展目录',
    message: '请选择解压后的Chrome扩展文件夹'
  })
  
  if (result.canceled) {
    return { success: false, canceled: true }
  }
  
  return { success: true, path: result.filePaths[0] }
})

// ========== 应用生命周期 ==========

console.log('[Electron Main] 等待应用就绪...')

app.whenReady().then(() => {
  console.log('[Electron Main] ========== 应用已就绪 ==========')
  createWindow()
  
  // 自动加载预设的扩展（如果存在）
  const extensionsDir = path.join(__dirname, '../extensions')
  if (fs.existsSync(extensionsDir)) {
    console.log('[Extension] 检查预设扩展目录:', extensionsDir)
    fs.readdirSync(extensionsDir, { withFileTypes: true })
      .filter(dirent => dirent.isDirectory())
      .forEach(dirent => {
        const extPath = path.join(extensionsDir, dirent.name)
        loadExtension(extPath)
      })
  }

  app.on('activate', () => {
    console.log('[Electron Main] activate 事件触发')
    if (BrowserWindow.getAllWindows().length === 0) {
      console.log('[Electron Main] 没有窗口,创建新窗口')
      createWindow()
    }
  })

  console.log('[Electron Main] ✓ 事件监听器已设置')
})

app.on('window-all-closed', () => {
  console.log('[Electron Main] 所有窗口已关闭')
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

console.log('[Electron Main] ========== 主进程初始化完成 ==========')
