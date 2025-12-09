const { app, BrowserWindow, ipcMain, net, shell, session } = require('electron')
const path = require('path')
const fs = require('fs')
const os = require('os')
const { setupDatabase } = require('./database')
const { ProxyManager } = require('./proxy-manager')

console.log('[Electron Main] ========== 全视界 启动 (Webview 架构) ==========')

// 初始化数据库
let proxyManager = null
setupDatabase().then(() => {
  // 数据库初始化完成后，初始化代理管理器
  proxyManager = new ProxyManager()
  console.log('[Electron Main] 代理管理器已初始化')
}).catch((err) => {
  console.error('[Electron Main] 数据库初始化失败:', err)
  // 即使数据库初始化失败，也创建代理管理器（可能无法使用数据库功能）
  proxyManager = new ProxyManager()
})

// 设置 User-Agent
app.userAgentFallback = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/141.0.0.0 (KHTML, like Gecko) Safari/537.36'

// ========== 证书错误处理 ==========
// 为所有 session 自动接受证书错误（支持自签名证书）
function setupCertificateErrorHandler(sessionInstance) {
  sessionInstance.setCertificateVerifyProc((request, callback) => {
    const { hostname, certificate, verificationResult } = request
    
    // 检查证书验证结果
    // verificationResult: 0 或 'net::OK' = 成功, 其他值 = 证书错误
    // 只检测真正的证书错误，忽略正常的证书
    // 注意：verificationResult 可能是数字 0（成功）或字符串错误码
    const isCertificateError = verificationResult !== 0 && 
                               verificationResult !== 'net::OK' &&
                               verificationResult !== undefined &&
                               verificationResult !== null &&
                               (typeof verificationResult === 'string' && 
                                (verificationResult.includes('ERR_CERT') || 
                                 verificationResult.includes('CERT') ||
                                 verificationResult.startsWith('net::ERR_CERT')))
    
    if (isCertificateError && certificate) {
      // 获取 partition（对于默认 session，partition 可能是 undefined，需要特殊处理）
      const partition = sessionInstance.partition || 'default'
      
      // 计算证书指纹（使用 SHA-256）
      // 优先使用 issuerName + subjectName + hostname 的组合，因为这样更稳定
      // certificate.data 可能每次都不一样，导致哈希不一致
      let certificateHash = ''
      try {
        const crypto = require('crypto')
        const issuerName = certificate.issuerName || ''
        const subjectName = certificate.subjectName || ''
        
        // 使用 issuerName + subjectName + hostname 的组合作为稳定的标识
        // 这样即使证书对象不同，只要这些信息相同，哈希就会一致
        const stableIdentifier = `${issuerName}:${subjectName}:${hostname}`
        certificateHash = crypto.createHash('sha256').update(stableIdentifier).digest('hex')
        
        console.log('[证书处理] 证书哈希计算:', {
          issuerName: issuerName.substring(0, 50),
          subjectName: subjectName.substring(0, 50),
          hostname,
          hash: certificateHash
        })
      } catch (err) {
        console.error('[证书处理] 计算证书哈希失败:', err.message)
        // 使用备用方法
        const crypto = require('crypto')
        certificateHash = crypto.createHash('sha256')
          .update(`${certificate.issuerName || ''}:${certificate.subjectName || ''}:${hostname}`)
          .digest('hex')
      }
      
      console.log('[证书处理] 检测到证书问题:', {
        hostname,
        verificationResult,
        issuerName: certificate?.issuerName,
        subjectName: certificate?.subjectName,
        partition: partition,
        certificateHash: certificateHash
      })
      
      // 通知所有窗口有证书错误（即使接受了证书，也要显示提示）
      windows.forEach((window) => {
        if (window && !window.isDestroyed()) {
          try {
            const url = `https://${hostname}`
            console.log('[证书处理] 发送证书错误通知:', {
              url,
              hostname,
              partition: partition,
              certificateHash: certificateHash
            })
            window.webContents.send('certificate-error-detected', {
              url: url,
              error: `Certificate verification failed: ${verificationResult}`,
              partition: partition,
              hostname: hostname,
              certificateHash: certificateHash
            })
          } catch (err) {
            console.error('[证书处理] 发送证书错误通知失败:', err.message)
          }
        }
      })
    }
    
    // 自动接受所有证书（包括自签名证书）
    callback(0) // 0 表示接受证书
  })

  // 监听证书错误事件，自动接受
  sessionInstance.on('certificate-error', (event, url, error, certificate, callback) => {
    // 获取 partition（对于默认 session，partition 可能是 undefined）
    const partition = sessionInstance.partition || 'default'
    
    // 从 URL 中提取 hostname
    let hostname = ''
    try {
      const urlObj = new URL(url)
      hostname = urlObj.hostname
    } catch (e) {
      // URL 解析失败，尝试从错误信息中提取
      hostname = url.split('/')[2]?.split(':')[0] || ''
    }
    
    // 计算证书指纹
    let certificateHash = ''
    if (certificate) {
      try {
        const crypto = require('crypto')
        const certData = certificate.data || certificate.issuerCert?.data || ''
        if (certData) {
          certificateHash = crypto.createHash('sha256').update(certData).digest('hex')
        } else {
          certificateHash = crypto.createHash('sha256')
            .update(`${certificate.issuerName || ''}:${certificate.subjectName || ''}:${hostname}`)
            .digest('hex')
        }
      } catch (err) {
        console.error('[证书处理] 计算证书哈希失败:', err.message)
        const crypto = require('crypto')
        certificateHash = crypto.createHash('sha256')
          .update(`${certificate.issuerName || ''}:${certificate.subjectName || ''}:${hostname}`)
          .digest('hex')
      }
    }
    
    console.log('[证书处理] certificate-error 事件检测到证书错误:', {
      url,
      error,
      issuerName: certificate?.issuerName,
      subjectName: certificate?.subjectName,
      partition: partition,
      certificateHash: certificateHash.substring(0, 16) + '...'
    })
    
    // 通知所有窗口有证书错误（即使接受了证书，也要显示提示）
    windows.forEach((window) => {
      if (window && !window.isDestroyed()) {
        try {
          window.webContents.send('certificate-error-detected', {
            url,
            error,
            partition: partition,
            hostname: hostname,
            certificateHash: certificateHash
          })
        } catch (err) {
          console.error('[证书处理] 发送证书错误通知失败:', err.message)
        }
      }
    })
    
    // 自动接受证书错误（允许自签名证书）
    event.preventDefault()
    callback(true) // true 表示接受证书
  })
}

// 为默认 session 设置证书错误处理
app.whenReady().then(() => {
  const defaultSession = session.defaultSession
  setupCertificateErrorHandler(defaultSession)
  console.log('[证书处理] ✓ 默认 session 证书错误处理已设置')
})

// 存储已设置证书处理的 session
const certificateHandledSessions = new Set()

// 为指定 partition 的 session 设置证书错误处理
function ensureCertificateErrorHandler(partition) {
  if (!partition || certificateHandledSessions.has(partition)) {
    return
  }

  try {
    const webviewSession = session.fromPartition(partition)
    setupCertificateErrorHandler(webviewSession)
    certificateHandledSessions.add(partition)
    console.log(`[证书处理] ✓ Partition ${partition} 证书错误处理已设置`)
  } catch (error) {
    console.error(`[证书处理] ✗ 设置 partition ${partition} 证书错误处理失败:`, error.message)
  }
}

let mainWindow
// 多窗口管理
const windows = new Map() // key: windowId, value: BrowserWindow
let windowIdCounter = 1

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

  const webPreferences = {
    nodeIntegration: false,
    contextIsolation: true,
    sandbox: false,
    webSecurity: false,
    allowRunningInsecureContent: true,
    webviewTag: true, // 启用 webview 标签支持
    preload: path.join(__dirname, 'preload.js')
  }

  // 第一个窗口使用默认 session（向后兼容），其他窗口使用独立的 partition
  if (wid !== 1) {
    webPreferences.partition = `persist:window-${wid}`
  }

  const window = new BrowserWindow({
    width: options.width || 1400,
    height: options.height || 900,
    minWidth: 800,
    minHeight: 600,
    x: options.x,
    y: options.y,
    icon: path.join(__dirname, '../public/256x256.ico'),
    webPreferences: webPreferences,
    backgroundColor: '#f5f5f5',
    show: false,
    autoHideMenuBar: true,
    title: `全视界 - 窗口 ${wid}`
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

  // 拦截新窗口打开 - 在webview中导航而不是打开新窗口
  window.webContents.setWindowOpenHandler(({ url, frameName, disposition }) => {
    console.log('[Window Open Guard] 拦截新窗口打开:', { url, frameName, disposition })

    // 发送消息到渲染进程，让它在最近点击的webview中导航
    window.webContents.executeJavaScript(`
      (function() {
        console.log('[Window Open Guard] 尝试在webview中打开:', '${url.replace(/'/g, "\\'")}');
        
        // 查找最近获得焦点的webview
        const activeElement = document.activeElement;
        if (activeElement && activeElement.tagName === 'WEBVIEW') {
          console.log('[Window Open Guard] 找到活动webview，在其中导航');
          try {
            activeElement.src = '${url.replace(/'/g, "\\'")}';
            return true;
          } catch (e) {
            console.log('[Window Open Guard] 导航失败:', e.message);
          }
        }
        
        // 如果没有找到活动webview，尝试在最后一个webview中打开
        const webviews = document.querySelectorAll('webview:not(.buffer-webview)');
        if (webviews.length > 0) {
          const lastWebview = webviews[webviews.length - 1];
          console.log('[Window Open Guard] 在最后一个webview中导航');
          try {
            lastWebview.src = '${url.replace(/'/g, "\\'")}';
            return true;
          } catch (e) {
            console.log('[Window Open Guard] 导航失败:', e.message);
          }
        }
        
        console.log('[Window Open Guard] 未找到可用webview');
        return false;
      })();
    `).catch(err => {
      console.log('[Window Open Guard] 执行失败:', err.message)
    })

    // 阻止打开新窗口
    return { action: 'deny' }
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
    { webviewId, message: '欢迎来到 全视界!' }
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

// ========== 代理管理 ==========

/**
 * 获取代理列表
 */
ipcMain.handle('proxy:get-list', async (event, page = 1, pageSize = 10) => {
  if (!proxyManager) {
    return { success: false, error: '代理管理器未初始化' }
  }
  return await proxyManager.getProxyList(page, pageSize)
})

/**
 * 导入订阅链接
 */
ipcMain.handle('proxy:import-subscription', async (event, subscriptionUrl) => {
  if (!proxyManager) {
    return { success: false, error: '代理管理器未初始化' }
  }
  return await proxyManager.importSubscription(subscriptionUrl)
})

/**
 * 添加代理
 */
ipcMain.handle('proxy:add', async (event, proxyConfig) => {
  if (!proxyManager) {
    return { success: false, error: '代理管理器未初始化' }
  }
  return await proxyManager.addProxy(proxyConfig)
})

/**
 * 更新代理
 */
ipcMain.handle('proxy:update', async (event, proxyId, proxyConfig) => {
  if (!proxyManager) {
    return { success: false, error: '代理管理器未初始化' }
  }
  return await proxyManager.updateProxy(proxyId, proxyConfig)
})

/**
 * 删除代理
 */
ipcMain.handle('proxy:delete', async (event, proxyId) => {
  if (!proxyManager) {
    return { success: false, error: '代理管理器未初始化' }
  }
  return await proxyManager.deleteProxy(proxyId)
})

/**
 * 测试代理
 */
ipcMain.handle('proxy:test', async (event, proxyId) => {
  if (!proxyManager) {
    return { success: false, error: '代理管理器未初始化' }
  }
  return await proxyManager.testProxy(proxyId)
})

/**
 * 为视界启动代理
 */
ipcMain.handle('proxy:start-for-hive', async (event, hiveId, proxyId) => {
  if (!proxyManager) {
    return { success: false, error: '代理管理器未初始化' }
  }
  return await proxyManager.startProxyForHive(hiveId, proxyId)
})

/**
 * 停止视界代理
 */
ipcMain.handle('proxy:stop-for-hive', async (event, hiveId) => {
  if (!proxyManager) {
    return { success: false, error: '代理管理器未初始化' }
  }
  return await proxyManager.stopProxyForHive(hiveId)
})

/**
 * 获取视界代理信息
 */
ipcMain.handle('proxy:get-hive-info', async (event, hiveId) => {
  if (!proxyManager) {
    return { success: false, error: '代理管理器未初始化' }
  }
  const info = proxyManager.getHiveProxyInfo(hiveId)
  return { success: true, data: info }
})

/**
 * 为指定 partition 确保证书错误处理已设置
 */
ipcMain.handle('ensure-certificate-error-handler', async (event, partition) => {
  console.log(`[证书处理] 请求确保证书错误处理 - partition: ${partition}`)
  ensureCertificateErrorHandler(partition)
  return { success: true }
})

// 记录证书信任操作
ipcMain.handle('certificate:trust', async (event, certificateHash) => {
  console.log('[证书处理] 用户信任证书:', certificateHash)
  return { success: true }
})

/**
 * 为 webview session 设置代理
 */
ipcMain.handle('proxy:set-session-proxy', async (event, partition, hiveId, proxyId) => {
  console.log(`[Proxy] 设置代理请求 - partition: ${partition}, hiveId: ${hiveId}, proxyId: ${proxyId}`)

  if (!proxyManager) {
    return { success: false, error: '代理管理器未初始化' }
  }

  try {
    // 如果已有代理在运行，先停止
    const existingInfo = proxyManager.getHiveProxyInfo(hiveId)
    if (existingInfo) {
      console.log(`[Proxy] 停止现有代理 - hiveId: ${hiveId}`)
      await proxyManager.stopProxyForHive(hiveId)
    }

    // 启动新的代理
    if (proxyId) {
      console.log(`[Proxy] 启动新代理 - hiveId: ${hiveId}, proxyId: ${proxyId}`)
      const result = await proxyManager.startProxyForHive(hiveId, proxyId)
      console.log(`[Proxy] 代理启动结果:`, result)

      if (result.success) {
        // 为 session 设置代理
        const webviewSession = session.fromPartition(partition)
        // 确保证书错误处理已设置
        ensureCertificateErrorHandler(partition)
        const proxyConfig = {
          proxyRules: `http=127.0.0.1:${result.data.httpPort};https=127.0.0.1:${result.data.httpPort};socks4=127.0.0.1:${result.data.socksPort};socks5=127.0.0.1:${result.data.socksPort}`,
          proxyBypassRules: 'localhost,127.0.0.1'
        }
        console.log(`[Proxy] 应用代理配置:`, proxyConfig)
        await webviewSession.setProxy(proxyConfig)
        console.log(`[Proxy] 代理配置已应用到分区 ${partition}`)
        return { success: true, data: result.data }
      } else {
        return result
      }
    } else {
      // 清除代理
      console.log(`[Proxy] 清除代理 - partition: ${partition}, hiveId: ${hiveId}`)
      const webviewSession = session.fromPartition(partition)
      // 确保证书错误处理已设置
      ensureCertificateErrorHandler(partition)
      // 使用空对象完全清除代理设置，而不是使用 'DIRECT'
      await webviewSession.setProxy({})
      await proxyManager.stopProxyForHive(hiveId)
      console.log(`[Proxy] 代理已清除`)
      return { success: true }
    }
  } catch (error) {
    console.error('[Proxy] 设置 session 代理失败:', error)
    return { success: false, error: error.message }
  }
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

// 应用退出时清理代理资源
app.on('before-quit', async () => {
  console.log('[Electron Main] 清理代理资源...')
  if (proxyManager) {
    // 停止所有视界的代理
    for (const hiveId of proxyManager.hiveClashProcesses.keys()) {
      await proxyManager.stopProxyForHive(hiveId)
    }
  }
})

console.log('[Electron Main] ========== 主进程初始化完成 ==========')
