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

  /**
   * 打开单个网站到新窗口
   */
  ipcMain.handle('open-website-in-window', (event, websiteData) => {
    console.log('[窗口管理] 打开网站到新窗口:', websiteData)

    // 获取当前窗口的位置，新窗口稍微偏移
    const currentWindow = BrowserWindow.fromWebContents(event.sender)
    const bounds = currentWindow.getBounds()

    // 创建新窗口，传递网站数据
    const result = createWindowFn(null, {
      x: bounds.x + 30,
      y: bounds.y + 30,
      width: bounds.width,
      height: bounds.height,
      websiteData: websiteData // 传递网站数据
    })

    console.log('[窗口管理] ✓ 新窗口已创建, ID:', result.windowId)

    return {
      success: true,
      windowId: result.windowId,
      totalWindows: getAllWindows().size
    }
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

  // ========== 监听规则管理 ==========
  
  const { getMonitoringManager } = require('./monitoringManager')
  const monitoringManager = getMonitoringManager()

  /**
   * 获取监听规则列表
   */
  ipcMain.handle('monitoring:get-rules', async (event, websiteId) => {
    console.log('[监听规则] 获取规则列表:', websiteId)
    return await monitoringManager.getRules(websiteId)
  })

  /**
   * 创建监听规则
   */
  ipcMain.handle('monitoring:create-rule', async (event, ruleData) => {
    console.log('[监听规则] 创建规则:', ruleData)
    return await monitoringManager.createRule(ruleData)
  })

  /**
   * 更新监听规则
   */
  ipcMain.handle('monitoring:update-rule', async (event, ruleId, ruleData) => {
    console.log('[监听规则] 更新规则:', ruleId, ruleData)
    return await monitoringManager.updateRule(ruleId, ruleData)
  })

  /**
   * 删除监听规则
   */
  ipcMain.handle('monitoring:delete-rule', async (event, ruleId) => {
    console.log('[监听规则] 删除规则:', ruleId)
    return await monitoringManager.deleteRule(ruleId)
  })

  /**
   * 切换监听规则启用状态
   */
  ipcMain.handle('monitoring:toggle-rule', async (event, ruleId, enabled) => {
    console.log('[监听规则] 切换规则状态:', ruleId, enabled)
    return await monitoringManager.toggleRule(ruleId, enabled)
  })

  /**
   * 配置 LLM API
   */
  ipcMain.handle('monitoring:configure-llm', async (event, config) => {
    console.log('[监听规则] 配置 LLM API')
    monitoringManager.configureLLM(config)
    return { success: true }
  })

  /**
   * 手动测试截图（用于调试）
   */
  ipcMain.handle('monitoring:test-screenshot', async (event, websiteId) => {
    console.log('[监听规则] 测试截图:', websiteId)
    try {
      const webview = await monitoringManager.findWebview(websiteId)
      if (!webview) {
        return { success: false, error: '未找到 webview' }
      }
      
      const screenshot = await monitoringManager.captureWebview(webview)
      if (!screenshot) {
        return { success: false, error: '截图失败' }
      }
      
      // 保存截图到临时目录
      const { app } = require('electron')
      const fs = require('fs')
      const path = require('path')
      const tempDir = app.getPath('temp')
      const screenshotPath = path.join(tempDir, `test-screenshot-${Date.now()}.png`)
      const buffer = Buffer.from(screenshot, 'base64')
      fs.writeFileSync(screenshotPath, buffer)
      
      return { success: true, path: screenshotPath, size: buffer.length }
    } catch (error) {
      console.error('[监听规则] 测试截图失败:', error)
      return { success: false, error: error.message }
    }
  })

  /**
   * 测试 LLM 视觉分析（用于调试）
   */
  ipcMain.handle('monitoring:test-llm-vision', async (event, websiteId, prompt) => {
    console.log('[监听规则] 测试 LLM 视觉分析:', websiteId, prompt)
    try {
      const webview = await monitoringManager.findWebview(websiteId)
      if (!webview) {
        return { success: false, error: '未找到 webview' }
      }
      
      console.log('[监听规则] 找到 webview, 开始截图...')
      const screenshot = await monitoringManager.captureWebview(webview)
      if (!screenshot) {
        return { success: false, error: '截图失败' }
      }
      
      console.log('[监听规则] 截图成功, 开始调用 LLM...')
      // 使用测试模式，获取完整回答而不是 YES/NO
      const answer = await monitoringManager.analyzewithLLM(screenshot, prompt, true)
      
      console.log('[监听规则] LLM 分析完成, 回答:', answer)
      return { 
        success: true, 
        answer: answer
      }
    } catch (error) {
      console.error('[监听规则] 测试 LLM 视觉分析失败:', error)
      return { success: false, error: error.message }
    }
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

