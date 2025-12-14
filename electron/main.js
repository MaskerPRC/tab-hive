const { app, session } = require('electron')
const path = require('path')
const { setupDatabase } = require('./database')
const { ProxyManager } = require('./proxy-manager')
const { setupCertificateErrorHandler, ensureCertificateErrorHandler } = require('./modules/certificateHandler')
const { createWindow, getMainWindow, getAllWindows } = require('./modules/windowManager')
const { registerIpcHandlers } = require('./modules/ipcHandlers')

console.log('[Electron Main] ========== 全视界 启动 (Webview 架构) ==========')

// ========== 开发模式下设置固定的 userData 路径 ==========
// 必须在 app.whenReady() 之前设置，确保 localStorage 数据持久化
if (process.env.NODE_ENV === 'development') {
  const userDataPath = path.join(__dirname, '../dev-user-data')
  app.setPath('userData', userDataPath)
  console.log('[Electron Main] 开发模式: userData 路径已设置为:', userDataPath)
}

// ========== 初始化代理管理器 ==========
let proxyManager = null

// 数据库初始化 Promise
const databaseReady = setupDatabase().then(() => {
  // 数据库初始化完成后，初始化代理管理器
  proxyManager = new ProxyManager()
  console.log('[Electron Main] 代理管理器已初始化')
  return proxyManager
}).catch((err) => {
  console.error('[Electron Main] 数据库初始化失败:', err)
  // 即使数据库初始化失败，也创建代理管理器（可能无法使用数据库功能）
  proxyManager = new ProxyManager()
  return proxyManager
})

// ========== 设置 User-Agent ==========
app.userAgentFallback = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/141.0.0.0 (KHTML, like Gecko) Safari/537.36'

// ========== 证书错误处理回调 ==========
/**
 * 证书错误通知回调
 * @param {Object} errorData - 证书错误数据
 */
function notifyCertificateError(errorData) {
  // ========== 详细日志：记录证书错误通知 ==========
  console.log('[证书通知] notifyCertificateError 被调用:', {
    url: errorData.url,
    hostname: errorData.hostname,
    partition: errorData.partition,
    error: errorData.error,
    certificateHash: errorData.certificateHash ? (errorData.certificateHash.substring(0, 16) + '...') : '(无)',
    timestamp: new Date().toISOString(),
    allWindowsCount: getAllWindows().length
  })
  
  // 通知所有窗口有证书错误
  let notifiedCount = 0
  getAllWindows().forEach((window, index) => {
    if (window && !window.isDestroyed()) {
      try {
        console.log(`[证书通知] 向窗口 ${index} 发送证书错误通知:`, {
          windowId: window.id,
          url: errorData.url,
          hostname: errorData.hostname,
          partition: errorData.partition,
          certificateHash: errorData.certificateHash ? (errorData.certificateHash.substring(0, 16) + '...') : '(无)'
        })
        window.webContents.send('certificate-error-detected', errorData)
        notifiedCount++
      } catch (err) {
        console.error(`[证书通知] 向窗口 ${index} 发送证书错误通知失败:`, {
          windowId: window.id,
          error: err.message,
          stack: err.stack
        })
      }
    } else {
      console.log(`[证书通知] 窗口 ${index} 已销毁或无效，跳过`)
    }
  })
  
  console.log(`[证书通知] 通知完成，共通知 ${notifiedCount} 个窗口`)
}

// ========== 为默认 session 设置证书错误处理 ==========
app.whenReady().then(async () => {
  console.log('[Electron Main] ========== 应用已就绪 ==========')

  const defaultSession = session.defaultSession
  setupCertificateErrorHandler(defaultSession, notifyCertificateError)
  console.log('[证书处理] ✓ 默认 session 证书错误处理已设置')

  // 等待数据库和代理管理器初始化完成
  await databaseReady
  console.log('[Electron Main] ✓ 数据库和代理管理器初始化完成')

  // 创建主窗口
  createWindow()

  // 注册所有 IPC 处理器（此时 proxyManager 已确保初始化完成）
  registerIpcHandlers(
    createWindow,
    proxyManager,
    (partition) => ensureCertificateErrorHandler(partition, notifyCertificateError)
  )

  // 初始化监听规则管理器
  const { getMonitoringManager } = require('./modules/monitoringManager')
  const monitoringManager = getMonitoringManager()
  await monitoringManager.initialize()
  console.log('[Electron Main] ✓ 监听规则管理器初始化完成')

  app.on('activate', () => {
    console.log('[Electron Main] activate 事件触发')
    const { BrowserWindow } = require('electron')
    if (BrowserWindow.getAllWindows().length === 0) {
      console.log('[Electron Main] 没有窗口,创建新窗口')
      createWindow()
    }
  })

  console.log('[Electron Main] ✓ 事件监听器已设置')
})

// ========== 应用生命周期事件 ==========
app.on('window-all-closed', () => {
  console.log('[Electron Main] 所有窗口已关闭')
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// 应用退出时清理资源
app.on('before-quit', async () => {
  console.log('[Electron Main] 清理资源...')
  
  // 清理监听规则定时器
  const { getMonitoringManager } = require('./modules/monitoringManager')
  const monitoringManager = getMonitoringManager()
  monitoringManager.cleanup()
  
  // 清理代理资源
  if (proxyManager) {
    // 停止所有视界的代理
    for (const hiveId of proxyManager.hiveClashProcesses.keys()) {
      await proxyManager.stopProxyForHive(hiveId)
    }
  }
})

console.log('[Electron Main] ========== 主进程初始化完成 ==========')
