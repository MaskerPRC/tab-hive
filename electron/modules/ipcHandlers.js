/**
 * IPC 处理器集成模块
 * 负责注册所有的 IPC 处理器
 */

const { ipcMain, BrowserWindow } = require('electron')
const { getMainWindow, getAllWindows, getWindowById } = require('./windowManager')
const {
  registerWebview,
  unregisterWebview,
  executeInWebview,
  getRegisteredWebviewIds
} = require('./webviewManager')
const {
  downloadUpdate,
  getDownloadStatus,
  openInstaller,
  cancelDownload
} = require('./updateDownloader')
const { getDesktopSources, startDesktopCapture } = require('./desktopCapture')
const { setupProxyHandlers } = require('./proxyHandler')

/**
 * 注册所有 IPC 处理器
 * @param {Function} createWindowFn - 创建窗口的函数
 * @param {Object} proxyManager - 代理管理器实例
 * @param {Function} ensureCertificateHandler - 确保证书处理的函数
 */
function registerIpcHandlers(createWindowFn, proxyManager, ensureCertificateHandler) {
  // ========== 窗口管理 ==========
  
  /**
   * 创建新窗口
   */
  ipcMain.handle('create-new-window', (event) => {
    console.log('[窗口管理] 创建新窗口')

    // 获取当前窗口的位置，新窗口稍微偏移
    const currentWindow = BrowserWindow.fromWebContents(event.sender)
    const bounds = currentWindow.getBounds()

    const result = createWindowFn(null, {
      x: bounds.x + 30,
      y: bounds.y + 30,
      width: bounds.width,
      height: bounds.height
    })

    console.log('[窗口管理] ✓ 新窗口已创建, ID:', result.windowId)

    return {
      success: true,
      windowId: result.windowId,
      totalWindows: getAllWindows().size
    }
  })

  /**
   * 获取所有窗口列表
   */
  ipcMain.handle('get-all-windows', () => {
    const windowList = []
    getAllWindows().forEach((window, windowId) => {
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

    const window = getWindowById(windowId)
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

  // ========== Webview 管理 ==========

  /**
   * Webview 注册
   */
  ipcMain.handle('webview-register', (event, webviewId) => {
    return registerWebview(webviewId, event.processId, event.frameId, event.sender)
  })

  /**
   * 在 webview 中执行 JavaScript
   */
  ipcMain.handle('execute-in-webview', async (event, webviewId, code) => {
    return executeInWebview(webviewId, code)
  })

  /**
   * 刷新 webview
   */
  ipcMain.handle('refresh-webview', async (event, webviewId) => {
    console.log('[IPC] ========== 刷新 Webview ==========')
    console.log('[IPC] Webview ID:', webviewId)

    const mainWindow = getMainWindow()
    if (mainWindow) {
      mainWindow.webContents.send('refresh-webview-from-main', webviewId)
    }

    return { success: true }
  })

  /**
   * 获取所有已注册的 webview
   */
  ipcMain.handle('get-registered-webviews', () => {
    const webviewIds = getRegisteredWebviewIds()
    console.log('[IPC] 获取已注册的 Webview 列表:', webviewIds)
    return { success: true, webviews: webviewIds }
  })

  /**
   * 取消注册 webview
   */
  ipcMain.handle('webview-unregister', (event, webviewId) => {
    return unregisterWebview(webviewId)
  })

  // ========== 更新下载 ==========

  /**
   * 下载更新文件
   */
  ipcMain.handle('download-update', async (event, downloadUrl, fileName) => {
    const mainWindow = getMainWindow()
    
    return await downloadUpdate(downloadUrl, fileName, {
      onProgress: (data) => {
        if (mainWindow && !mainWindow.isDestroyed()) {
          mainWindow.webContents.send('update-download-progress', data)
        }
      },
      onComplete: (data) => {
        if (mainWindow && !mainWindow.isDestroyed()) {
          mainWindow.webContents.send('update-download-complete', data)
        }
      },
      onError: (data) => {
        if (mainWindow && !mainWindow.isDestroyed()) {
          mainWindow.webContents.send('update-download-error', data)
        }
      }
    })
  })

  /**
   * 获取当前下载状态
   */
  ipcMain.handle('get-download-status', () => {
    return getDownloadStatus()
  })

  /**
   * 打开下载的安装文件
   */
  ipcMain.handle('open-installer', async (event, filePath) => {
    return await openInstaller(filePath, () => {
      const { app } = require('electron')
      app.quit()
    })
  })

  /**
   * 取消下载
   */
  ipcMain.handle('cancel-download', () => {
    return cancelDownload()
  })

  // ========== 桌面捕获 ==========

  /**
   * 获取可用的桌面源
   */
  ipcMain.handle('get-desktop-sources', async (event, options = {}) => {
    return await getDesktopSources(options)
  })

  /**
   * 创建桌面捕获窗口
   */
  ipcMain.handle('start-desktop-capture', async (event, sourceId, options = {}) => {
    return startDesktopCapture(event.sender, sourceId, options)
  })

  // ========== 代理管理 ==========

  const proxyHandlers = setupProxyHandlers(proxyManager, ensureCertificateHandler)

  ipcMain.handle('proxy:get-list', async (event, page, pageSize) => {
    return await proxyHandlers.getProxyList(page, pageSize)
  })

  ipcMain.handle('proxy:import-subscription', async (event, subscriptionUrl) => {
    return await proxyHandlers.importSubscription(subscriptionUrl)
  })

  ipcMain.handle('proxy:add', async (event, proxyConfig) => {
    return await proxyHandlers.addProxy(proxyConfig)
  })

  ipcMain.handle('proxy:update', async (event, proxyId, proxyConfig) => {
    return await proxyHandlers.updateProxy(proxyId, proxyConfig)
  })

  ipcMain.handle('proxy:delete', async (event, proxyId) => {
    return await proxyHandlers.deleteProxy(proxyId)
  })

  ipcMain.handle('proxy:test', async (event, proxyId) => {
    return await proxyHandlers.testProxy(proxyId)
  })

  ipcMain.handle('proxy:start-for-hive', async (event, hiveId, proxyId) => {
    return await proxyHandlers.startProxyForHive(hiveId, proxyId)
  })

  ipcMain.handle('proxy:stop-for-hive', async (event, hiveId) => {
    return await proxyHandlers.stopProxyForHive(hiveId)
  })

  ipcMain.handle('proxy:get-hive-info', async (event, hiveId) => {
    return await proxyHandlers.getHiveProxyInfo(hiveId)
  })

  ipcMain.handle('proxy:set-session-proxy', async (event, partition, hiveId, proxyId) => {
    return await proxyHandlers.setSessionProxy(partition, hiveId, proxyId)
  })

  // ========== 证书处理 ==========

  /**
   * 确保证书错误处理已设置
   */
  ipcMain.handle('ensure-certificate-error-handler', async (event, partition) => {
    console.log(`[证书处理] 请求确保证书错误处理 - partition: ${partition}`)
    ensureCertificateHandler(partition)
    return { success: true }
  })

  /**
   * 记录证书信任操作
   */
  ipcMain.handle('certificate:trust', async (event, certificateHash) => {
    console.log('[证书处理] 用户信任证书:', certificateHash)
    return { success: true }
  })

  console.log('[IPC] ✓ 所有 IPC 处理器已注册')
}

module.exports = {
  registerIpcHandlers
}

