/**
 * 窗口管理模块
 * 负责创建和管理应用窗口
 */

const { BrowserWindow } = require('electron')
const path = require('path')

// 多窗口管理
const windows = new Map() // key: windowId, value: BrowserWindow
let windowIdCounter = 1
let mainWindow = null

/**
 * 创建新窗口
 * @param {number} windowId - 窗口ID，如果为null则自动生成
 * @param {Object} options - 窗口配置选项
 * @returns {Object} {windowId, window}
 */
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
    preload: path.join(__dirname, '../preload.js')
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

/**
 * 获取主窗口
 * @returns {BrowserWindow|null}
 */
function getMainWindow() {
  return mainWindow
}

/**
 * 获取所有窗口
 * @returns {Map}
 */
function getAllWindows() {
  return windows
}

/**
 * 根据ID获取窗口
 * @param {number} windowId
 * @returns {BrowserWindow|undefined}
 */
function getWindowById(windowId) {
  return windows.get(windowId)
}

module.exports = {
  createWindow,
  getMainWindow,
  getAllWindows,
  getWindowById
}

