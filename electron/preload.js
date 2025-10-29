const { contextBridge, ipcRenderer } = require('electron')

console.log('[Preload] Preload script 开始加载...')

// 暴露安全的API到渲染进程
contextBridge.exposeInMainWorld('electron', {
  isElectron: true,
  platform: process.platform,
  version: process.versions.electron,
  
  // WebContentsView 管理 API
  views: {
    /**
     * 创建或更新网站视图
     * @param {string} id - 视图ID
     * @param {string} url - 要加载的URL
     * @param {object} bounds - 视图的位置和大小 {x, y, width, height}
     * @param {boolean} visible - 是否可见
     */
    createOrUpdate: (id, url, bounds, visible = true) => {
      console.log('[Preload] createOrUpdate:', { id, url, bounds, visible })
      return ipcRenderer.invoke('create-website-view', { id, url, bounds, visible })
    },

    /**
     * 更新视图
     * @param {string} id - 视图ID
     * @param {object} options - 更新选项 {bounds, visible, url}
     */
    update: (id, options) => {
      console.log('[Preload] update:', { id, ...options })
      return ipcRenderer.invoke('update-website-view', { id, ...options })
    },

    /**
     * 删除视图
     * @param {string} id - 视图ID
     */
    remove: (id) => {
      console.log('[Preload] remove:', id)
      return ipcRenderer.invoke('remove-website-view', { id })
    },

    /**
     * 刷新视图
     * @param {string} id - 视图ID
     */
    refresh: (id) => {
      console.log('[Preload] refresh:', id)
      return ipcRenderer.invoke('refresh-website-view', { id })
    },

    /**
     * 在视图中执行 JavaScript
     * @param {string} id - 视图ID
     * @param {string} code - 要执行的代码
     */
    executeJS: (id, code) => {
      console.log('[Preload] executeJS:', id, code.substring(0, 100))
      return ipcRenderer.invoke('execute-in-view', { id, code })
    },

    /**
     * 隐藏除指定视图外的所有视图
     * @param {string} id - 要保留可见的视图ID
     */
    hideAllExcept: (id) => {
      console.log('[Preload] hideAllExcept:', id)
      return ipcRenderer.invoke('hide-all-views-except', { id })
    },

    /**
     * 显示所有视图
     */
    showAll: () => {
      console.log('[Preload] showAll')
      return ipcRenderer.invoke('show-all-views')
    },

    /**
     * 获取窗口尺寸
     */
    getWindowBounds: () => {
      return ipcRenderer.invoke('get-window-bounds')
    },

    /**
     * 设置是否忽略鼠标事件（用于事件穿透）
     * @param {boolean} ignore - 是否忽略鼠标事件
     * @param {object} options - 选项，如 { forward: true }
     */
    setIgnoreMouseEvents: (ignore, options = {}) => {
      return ipcRenderer.invoke('set-ignore-mouse-events', ignore, options)
    }
  },

  // 事件监听
  on: (channel, callback) => {
    const validChannels = ['window-resized']
    if (validChannels.includes(channel)) {
      ipcRenderer.on(channel, (event, ...args) => callback(...args))
    }
  },

  // 移除事件监听
  off: (channel, callback) => {
    const validChannels = ['window-resized']
    if (validChannels.includes(channel)) {
      ipcRenderer.removeListener(channel, callback)
    }
  }
})

console.log('[Preload] Preload script 加载完成，electron API已暴露')
