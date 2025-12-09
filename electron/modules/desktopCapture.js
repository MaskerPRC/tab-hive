/**
 * 桌面捕获模块
 * 负责屏幕和窗口捕获功能
 */

const { desktopCapturer, BrowserWindow } = require('electron')

/**
 * 获取可用的桌面源（窗口和屏幕）
 * @param {Object} options - 选项 {types, thumbnailSize, fetchWindowIcons}
 * @returns {Promise<Object>} {success, sources?, error?}
 */
async function getDesktopSources(options = {}) {
  console.log('[Desktop Capture] 获取桌面源')

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
}

/**
 * 开始桌面捕获
 * @param {Electron.WebContents} webContents - WebContents
 * @param {string} sourceId - 源ID
 * @param {Object} options - 捕获选项
 * @returns {Object} {success, error?}
 */
function startDesktopCapture(webContents, sourceId, options = {}) {
  console.log('[Desktop Capture] 开始捕获:', sourceId)

  try {
    const window = BrowserWindow.fromWebContents(webContents)
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
}

module.exports = {
  getDesktopSources,
  startDesktopCapture
}

