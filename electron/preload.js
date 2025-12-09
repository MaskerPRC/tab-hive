const { contextBridge, ipcRenderer } = require('electron')
const path = require('path')

console.log('[Preload] Preload script 开始加载 (Webview 架构)...')

// 计算 webview preload 路径
const getWebviewPreloadPath = () => {
  // 无论开发还是生产模式，都使用 __dirname
  // electron-builder 会将 electron 目录打包到应用中
  const preloadPath = path.join(__dirname, 'webview-preload.js')
  console.log('[Preload] Webview preload 路径:', preloadPath)
  return preloadPath
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
    },

    /**
     * 打开单个网站到新窗口
     * @param {Object} websiteData - 网站数据
     */
    openWebsite: (websiteData) => {
      console.log('[Preload] openWebsite:', websiteData)
      return ipcRenderer.invoke('open-website-in-window', websiteData)
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

  // 代理管理 API
  proxy: {
    /**
     * 获取代理列表
     */
    getList: (page = 1, pageSize = 10) => {
      return ipcRenderer.invoke('proxy:get-list', page, pageSize)
    },

    /**
     * 导入订阅链接
     */
    importSubscription: (subscriptionUrl) => {
      return ipcRenderer.invoke('proxy:import-subscription', subscriptionUrl)
    },

    /**
     * 添加代理
     */
    add: (proxyConfig) => {
      return ipcRenderer.invoke('proxy:add', proxyConfig)
    },

    /**
     * 更新代理
     */
    update: (proxyId, proxyConfig) => {
      return ipcRenderer.invoke('proxy:update', proxyId, proxyConfig)
    },

    /**
     * 删除代理
     */
    delete: (proxyId) => {
      return ipcRenderer.invoke('proxy:delete', proxyId)
    },

    /**
     * 测试代理
     */
    test: (proxyId) => {
      return ipcRenderer.invoke('proxy:test', proxyId)
    },

    /**
     * 为视界启动代理
     */
    startForHive: (hiveId, proxyId) => {
      return ipcRenderer.invoke('proxy:start-for-hive', hiveId, proxyId)
    },

    /**
     * 停止视界代理
     */
    stopForHive: (hiveId) => {
      return ipcRenderer.invoke('proxy:stop-for-hive', hiveId)
    },

    /**
     * 获取视界代理信息
     */
    getHiveInfo: (hiveId) => {
      return ipcRenderer.invoke('proxy:get-hive-info', hiveId)
    },

    /**
     * 为 webview session 设置代理
     */
    setSessionProxy: (partition, hiveId, proxyId) => {
      return ipcRenderer.invoke('proxy:set-session-proxy', partition, hiveId, proxyId)
    }
  },

  // IPC 通信 API
  ipc: {
    /**
     * 调用主进程方法
     * @param {string} channel - 通道名称
     * @param {...any} args - 参数
     */
    invoke: (channel, ...args) => {
      return ipcRenderer.invoke(channel, ...args)
    }
  },

  // 事件监听
  on: (channel, callback) => {
    const validChannels = [
      'refresh-webview-from-main',
      'update-download-progress',
      'update-download-complete',
      'update-download-error',
      'desktop-capture-source-selected',
      'certificate-error-detected'
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
