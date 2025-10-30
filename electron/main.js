const { app, BrowserWindow, ipcMain, net, shell } = require('electron')
const path = require('path')
const fs = require('fs')
const os = require('os')

console.log('[Electron Main] ========== Tab Hive 启动 (Webview 架构) ==========')
console.log('[Electron Main] 用户数据目录:', app.getPath('userData'))
console.log('[Electron Main] 应用名称:', app.getName())

// 设置 User-Agent
app.userAgentFallback = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/141.0.0.0 (KHTML, like Gecko) Safari/537.36'

let mainWindow

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

function createWindow() {
  console.log('[Electron Main] ========== 创建主窗口 ==========')

  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 800,
    minHeight: 600,
    icon: path.join(__dirname, '../public/256x256.ico'),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: false,
      webSecurity: false,
      allowRunningInsecureContent: true,
      webviewTag: true, // 启用 webview 标签支持
      preload: path.join(__dirname, 'preload.js')
    },
    backgroundColor: '#f5f5f5',
    show: false,
    autoHideMenuBar: true
  })

  console.log('[Electron Main] ✓ 主窗口创建完成')

  // 加载页面
  if (process.env.NODE_ENV === 'development') {
    console.log('[Electron Main] 开发模式,加载 http://localhost:3000')
    mainWindow.loadURL('http://localhost:3000')
    mainWindow.webContents.openDevTools()
  } else {
    console.log('[Electron Main] 生产模式,加载本地文件')
    const indexPath = path.join(__dirname, '../dist/index.html')
    console.log('[Electron Main] 文件路径:', indexPath)
    mainWindow.loadFile(indexPath)
  }

  console.log('[Electron Main] ========== 设置 CORS 和 Cookie 处理 ==========')

  mainWindow.once('ready-to-show', () => {
    console.log('[Electron Main] ✓ 窗口准备完成,显示窗口')
    mainWindow.show()
  })

  mainWindow.on('closed', () => {
    console.log('[Electron Main] 窗口已关闭')
    registeredWebviews.clear()
    mainWindow = null
  })

  console.log('[Electron Main] ========== 主窗口创建流程完成 ==========')
}

// ========== IPC 处理器 ==========

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

// ========== 应用生命周期 ==========

console.log('[Electron Main] 等待应用就绪...')

app.whenReady().then(() => {
  console.log('[Electron Main] ========== 应用已就绪 ==========')
  createWindow()

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
