const { contextBridge, ipcRenderer } = require('electron')

console.log('[Preload] Preload script 开始加载...')

// 暴露安全的API到渲染进程
contextBridge.exposeInMainWorld('electron', {
  isElectron: true,
  platform: process.platform,
  version: process.versions.electron,
  
  // 在iframe中执行JavaScript代码（用于选择器全屏功能）
  executeInIframe: (iframeId, code) => {
    console.log('[Preload] executeInIframe 被调用:', iframeId)
    return ipcRenderer.invoke('execute-in-iframe', iframeId, code)
  }
})

console.log('[Preload] Preload script 加载完成，electron API已暴露')

