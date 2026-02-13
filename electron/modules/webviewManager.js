/**
 * Webview 管理模块
 * 负责 webview 的注册、通信和管理
 */

// 存储已注册的 webview
// key: webviewId, value: { processId, frameId, webContents }
const registeredWebviews = new Map()

/**
 * 注册 webview
 * @param {string} webviewId - Webview ID
 * @param {number} processId - Process ID
 * @param {number} frameId - Frame ID
 * @param {Electron.WebContents} webContents - WebContents
 * @returns {Object} {success, webviewId}
 */
function registerWebview(webviewId, processId, frameId, webContents) {
  console.log('[IPC] ========== Webview 注册 ==========')
  console.log('[IPC] Webview ID:', webviewId)
  console.log('[IPC] Process ID:', processId)
  console.log('[IPC] Frame ID:', frameId)

  // 保存 webview 信息
  registeredWebviews.set(webviewId, {
    processId,
    frameId,
    webContents
  })

  console.log('[IPC] ✓ Webview 注册成功')
  console.log('[IPC] 当前已注册的 Webview 数量:', registeredWebviews.size)

  // 向 webview 发送欢迎消息
  webContents.sendToFrame(
    [processId, frameId],
    'main-to-webview',
    'welcome',
    { webviewId, message: '欢迎来到 全视界!' }
  )

  return { success: true, webviewId }
}

/**
 * 取消注册 webview
 * @param {string} webviewId - Webview ID
 * @returns {Object} {success}
 */
function unregisterWebview(webviewId) {
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
}

/**
 * 在 webview 中执行 JavaScript
 * @param {string} webviewId - Webview ID
 * @param {string} code - JavaScript 代码
 * @returns {Object} {success, error?}
 */
function executeInWebview(webviewId, code) {
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
}

/**
 * 获取所有已注册的 webview ID
 * @returns {Array<string>}
 */
function getRegisteredWebviewIds() {
  return Array.from(registeredWebviews.keys())
}

/**
 * 根据 ID 获取 webview 信息
 * @param {string} webviewId - Webview ID
 * @returns {Object|undefined}
 */
function getWebviewById(webviewId) {
  return registeredWebviews.get(webviewId)
}

/**
 * 在 webview 中执行 JavaScript 并返回结果
 * 使用 webContents.executeJavaScript 获取同步返回值
 * @param {string} websiteId - 网站 ID
 * @param {string} code - JavaScript 代码
 * @returns {Promise<{success: boolean, result?: any, error?: string}>}
 */
async function executeJsWithResult(websiteId, code) {
  const { BrowserWindow, webContents: electronWebContents } = require('electron')

  const windows = BrowserWindow.getAllWindows()
  for (const window of windows) {
    if (window.isDestroyed()) continue
    try {
      const webviewInfo = await window.webContents.executeJavaScript(`
        (function() {
          var webview = document.querySelector('[data-webview-id="${websiteId}"]');
          if (webview && webview.getWebContentsId) {
            return { found: true, webContentsId: webview.getWebContentsId() };
          }
          return { found: false };
        })()
      `)
      if (webviewInfo && webviewInfo.found) {
        const wc = electronWebContents.fromId(webviewInfo.webContentsId)
        if (wc && !wc.isDestroyed()) {
          const result = await wc.executeJavaScript(code)
          return { success: true, result }
        }
      }
    } catch (error) {
      continue
    }
  }
  return { success: false, error: 'Webview not found' }
}

module.exports = {
  registerWebview,
  unregisterWebview,
  executeInWebview,
  executeJsWithResult,
  getRegisteredWebviewIds,
  getWebviewById
}

