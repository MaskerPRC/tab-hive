const { contextBridge, ipcRenderer } = require('electron')
const path = require('path')

console.log('[Preload] Preload script 开始加载 (Webview 架构)...')

// 计算 webview preload 路径
const getWebviewPreloadPath = () => {
  if (process.env.NODE_ENV === 'development') {
    // 开发模式
    return path.join(__dirname, 'webview-preload.js')
  } else {
    // 生产模式
    return path.join(__dirname, 'webview-preload.js')
  }
}

// 暴露安全的 API 到渲染进程
contextBridge.exposeInMainWorld('electron', {
  isElectron: true,
  platform: process.platform,
  version: process.versions.electron,
  webviewPreloadPath: getWebviewPreloadPath(),
  
  // 更新下载 API
  update: {
    /**
     * 下载更新文件
     * @param {string} downloadUrl - 下载链接
     * @param {string} fileName - 文件名
     */
    download: (downloadUrl, fileName) => {
      console.log('[Preload] download:', downloadUrl, fileName)
      return ipcRenderer.invoke('download-update', downloadUrl, fileName)
    },

    /**
     * 获取下载状态
     */
    getStatus: () => {
      return ipcRenderer.invoke('get-download-status')
    },

    /**
     * 打开安装文件
     * @param {string} filePath - 安装文件路径
     */
    openInstaller: (filePath) => {
      console.log('[Preload] openInstaller:', filePath)
      return ipcRenderer.invoke('open-installer', filePath)
    },

    /**
     * 取消下载
     */
    cancel: () => {
      console.log('[Preload] cancel download')
      return ipcRenderer.invoke('cancel-download')
    }
  },
  
  // Chrome 扩展管理 API
  extensions: {
    /**
     * 加载扩展
     * @param {string} extensionPath - 扩展目录路径
     */
    load: (extensionPath) => {
      console.log('[Preload] load-extension:', extensionPath)
      return ipcRenderer.invoke('load-extension', extensionPath)
    },

    /**
     * 卸载扩展
     * @param {string} extensionId - 扩展ID
     */
    unload: (extensionId) => {
      console.log('[Preload] unload-extension:', extensionId)
      return ipcRenderer.invoke('unload-extension', extensionId)
    },

    /**
     * 获取已加载的扩展列表
     */
    getLoaded: () => {
      return ipcRenderer.invoke('get-loaded-extensions')
    },

    /**
     * 选择扩展目录
     */
    selectDirectory: () => {
      return ipcRenderer.invoke('select-extension-directory')
    }
  },
  
  // 窗口管理 API
  window: {
    /**
     * 创建新窗口
     */
    createNew: () => {
      console.log('[Preload] createNew')
      return ipcRenderer.invoke('create-new-window')
    },

    /**
     * 获取所有窗口列表
     */
    getAll: () => {
      console.log('[Preload] getAll')
      return ipcRenderer.invoke('get-all-windows')
    },

    /**
     * 聚焦到指定窗口
     * @param {number} windowId - 窗口ID
     */
    focus: (windowId) => {
      console.log('[Preload] focus:', windowId)
      return ipcRenderer.invoke('focus-window', windowId)
    },

    /**
     * 获取当前窗口 ID
     */
    getId: () => {
      return ipcRenderer.invoke('get-window-id')
    }
  },

  // Webview 管理 API
  webview: {
    /**
     * 在 webview 中执行 JavaScript
     * @param {string} webviewId - Webview ID
     * @param {string} code - 要执行的代码
     */
    executeJS: (webviewId, code) => {
      console.log('[Preload] executeJS:', webviewId, code.substring(0, 100))
      return ipcRenderer.invoke('execute-in-webview', webviewId, code)
    },

    /**
     * 刷新 webview
     * @param {string} webviewId - Webview ID
     */
    refresh: (webviewId) => {
      console.log('[Preload] refresh:', webviewId)
      return ipcRenderer.invoke('refresh-webview', webviewId)
    },

    /**
     * 获取所有已注册的 webview
     */
    getRegistered: () => {
      console.log('[Preload] getRegistered')
      return ipcRenderer.invoke('get-registered-webviews')
    },

    /**
     * 取消注册 webview
     * @param {string} webviewId - Webview ID
     */
    unregister: (webviewId) => {
      console.log('[Preload] unregister:', webviewId)
      return ipcRenderer.invoke('webview-unregister', webviewId)
    }
  },

  // 桌面捕获 API
  desktopCapture: {
    /**
     * 获取桌面源列表（窗口和屏幕）
     * @param {Object} options - 选项
     */
    getSources: (options) => {
      console.log('[Preload] getSources:', options)
      return ipcRenderer.invoke('get-desktop-sources', options)
    },

    /**
     * 开始捕获指定的桌面源
     * @param {string} sourceId - 源ID
     * @param {Object} options - 选项
     */
    startCapture: (sourceId, options) => {
      console.log('[Preload] startCapture:', sourceId, options)
      return ipcRenderer.invoke('start-desktop-capture', sourceId, options)
    },

    /**
     * 监听桌面捕获源选择事件
     */
    onSourceSelected: (callback) => {
      ipcRenderer.on('desktop-capture-source-selected', (event, data) => callback(data))
    }
  },

  // 事件监听
  on: (channel, callback) => {
    const validChannels = [
      'refresh-webview-from-main',
      'update-download-progress',
      'update-download-complete',
      'update-download-error',
      'desktop-capture-source-selected'
    ]
    if (validChannels.includes(channel)) {
      ipcRenderer.on(channel, (event, ...args) => callback(...args))
    }
  },

  // 移除事件监听
  off: (channel, callback) => {
    const validChannels = [
      'refresh-webview-from-main',
      'update-download-progress',
      'update-download-complete',
      'update-download-error'
    ]
    if (validChannels.includes(channel)) {
      ipcRenderer.removeListener(channel, callback)
    }
  }
})

console.log('[Preload] ✓ Preload script 加载完成,electron API 已暴露')
