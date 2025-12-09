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

  // 加载页面，带上窗口 ID 和网站数据（如果有）
  let urlParams = `windowId=${wid}`
  if (options.websiteData) {
    // 将网站数据编码为 JSON 并添加到 URL 参数
    const websiteDataJson = encodeURIComponent(JSON.stringify(options.websiteData))
    urlParams += `&websiteData=${websiteDataJson}`
    console.log('[Electron Main] 传递网站数据到新窗口:', options.websiteData.title || options.websiteData.url)
  }

  if (process.env.NODE_ENV === 'development') {
    console.log('[Electron Main] 开发模式,加载 http://localhost:3000')
    window.loadURL(`http://localhost:3000?${urlParams}`)
    window.webContents.openDevTools()
  } else {
    console.log('[Electron Main] 生产模式,加载本地文件')
    const indexPath = path.join(__dirname, '../dist/index.html')
    console.log('[Electron Main] 文件路径:', indexPath)
    const query = {}
    urlParams.split('&').forEach(param => {
      const [key, value] = param.split('=')
      query[key] = decodeURIComponent(value)
    })
    window.loadFile(indexPath, { query })
  }

  console.log('[Electron Main] ========== 设置 CORS 和 Cookie 处理 ==========')

  // 完全禁用菜单栏，防止Alt键显示菜单栏导致窗口偏移
  window.setMenuBarVisibility(false)
  window.setMenu(null)

  window.once('ready-to-show', () => {
    console.log('[Electron Main] ✓ 窗口准备完成,显示窗口')
    window.show()
  })

  // 拦截新窗口打开 - 根据域名判断是导航还是打开模态框
  window.webContents.setWindowOpenHandler(({ url, frameName, disposition }) => {
    console.log('[Window Open Guard] ========== 拦截新窗口打开 ==========')
    console.log('[Window Open Guard] URL:', url)
    console.log('[Window Open Guard] frameName:', frameName)
    console.log('[Window Open Guard] disposition:', disposition)
    console.log('[Window Open Guard] 窗口ID:', wid)
    console.log('[Window Open Guard] 堆栈跟踪:', new Error().stack)

    // 发送消息到渲染进程，让它判断是导航还是打开模态框
    window.webContents.executeJavaScript(`
      (function() {
        const newUrl = '${url.replace(/'/g, "\\'")}';
        console.log('[Window Open Guard Renderer] ========== 开始处理新URL ==========');
        console.log('[Window Open Guard Renderer] 新URL:', newUrl);
        console.log('[Window Open Guard Renderer] document.activeElement:', document.activeElement?.tagName);
        
        // 查找最近获得焦点的webview
        let activeWebview = null;
        const activeElement = document.activeElement;
        if (activeElement && activeElement.tagName === 'WEBVIEW') {
          activeWebview = activeElement;
          console.log('[Window Open Guard Renderer] 找到活动webview (activeElement)');
        }
        
        // 如果没有找到活动webview，尝试在最后一个webview中打开
        if (!activeWebview) {
          const webviews = document.querySelectorAll('webview:not(.buffer-webview)');
          console.log('[Window Open Guard Renderer] 找到webview数量:', webviews.length);
          if (webviews.length > 0) {
            activeWebview = webviews[webviews.length - 1];
            console.log('[Window Open Guard Renderer] 使用最后一个webview');
          }
        }
        
        if (activeWebview) {
          try {
            const currentUrl = activeWebview.getURL();
            console.log('[Window Open Guard Renderer] 当前webview URL:', currentUrl);
            console.log('[Window Open Guard Renderer] 新URL:', newUrl);
            
            // 判断是否同根域名
            function getRootDomain(hostname) {
              if (!hostname) return '';
              hostname = hostname.split(':')[0];
              if (/^\\d+\\.\\d+\\.\\d+\\.\\d+$/.test(hostname)) return hostname;
              if (hostname === 'localhost' || hostname === '127.0.0.1') return hostname;
              const parts = hostname.split('.');
              if (parts.length >= 2) {
                return parts.slice(-2).join('.');
              }
              return hostname;
            }
            
            function isSameRootDomain(url1, url2) {
              try {
                const urlObj1 = new URL(url1);
                const urlObj2 = new URL(url2);
                const rootDomain1 = getRootDomain(urlObj1.hostname);
                const rootDomain2 = getRootDomain(urlObj2.hostname);
                console.log('[Window Open Guard Renderer] 域名比较:', {
                  url1: urlObj1.hostname,
                  url2: urlObj2.hostname,
                  rootDomain1: rootDomain1,
                  rootDomain2: rootDomain2,
                  isSame: rootDomain1 === rootDomain2 && rootDomain1 !== ''
                });
                return rootDomain1 === rootDomain2 && rootDomain1 !== '';
              } catch (e) {
                console.error('[Window Open Guard Renderer] URL解析失败:', e);
                return false;
              }
            }
            
            // 如果同根域名，在当前webview中导航
            if (currentUrl && isSameRootDomain(currentUrl, newUrl)) {
              console.log('[Window Open Guard Renderer] ✓ 同根域名，在当前webview中导航');
              activeWebview.src = newUrl;
              return { action: 'navigate', success: true };
            } else {
              // 不同根域名，通过IPC发送消息打开模态框
              console.log('[Window Open Guard Renderer] ✗ 不同根域名，打开模态框');
              console.log('[Window Open Guard Renderer] window.electron存在:', !!window.electron);
              if (window.electron && window.electron.ipc) {
                console.log('[Window Open Guard Renderer] 触发CustomEvent: open-external-url-modal');
                // 触发自定义事件，让App.vue监听
                const event = new CustomEvent('open-external-url-modal', {
                  detail: { url: newUrl }
                });
                window.dispatchEvent(event);
                console.log('[Window Open Guard Renderer] CustomEvent已触发');
              } else {
                console.error('[Window Open Guard Renderer] window.electron不存在，无法打开模态框');
              }
              return { action: 'modal', success: true };
            }
          } catch (e) {
            console.error('[Window Open Guard Renderer] 处理失败:', e.message, e.stack);
            // 出错时也打开模态框
            if (window.electron && window.electron.ipc) {
              console.log('[Window Open Guard Renderer] 出错时触发CustomEvent');
              window.dispatchEvent(new CustomEvent('open-external-url-modal', {
                detail: { url: newUrl }
              }));
            }
            return { action: 'modal', success: true };
          }
        } else {
          // 没有找到webview，打开模态框
          console.log('[Window Open Guard Renderer] ✗ 未找到可用webview，打开模态框');
          if (window.electron && window.electron.ipc) {
            console.log('[Window Open Guard Renderer] 触发CustomEvent: open-external-url-modal');
            window.dispatchEvent(new CustomEvent('open-external-url-modal', {
              detail: { url: newUrl }
            }));
          } else {
            console.error('[Window Open Guard Renderer] window.electron不存在，无法打开模态框');
          }
          return { action: 'modal', success: true };
        }
      })();
    `).then(result => {
      console.log('[Window Open Guard] executeJavaScript结果:', result)
    }).catch(err => {
      console.error('[Window Open Guard] ✗ executeJavaScript执行失败:', err.message)
      console.error('[Window Open Guard] 错误堆栈:', err.stack)
    })

    // 阻止打开新窗口
    console.log('[Window Open Guard] 返回 deny，阻止打开新窗口')
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

