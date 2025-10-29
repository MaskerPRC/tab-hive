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

  // 事件监听
  on: (channel, callback) => {
    const validChannels = [
      'refresh-webview-from-main',
      'update-download-progress',
      'update-download-complete',
      'update-download-error'
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
