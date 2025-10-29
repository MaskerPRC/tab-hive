/**
 * Webview Preload Script
 * 在每个 webview 中运行的 preload 脚本
 * 负责建立 webview 与主进程之间的通信通道
 */

const { ipcRenderer } = require('electron')

console.log('[Webview Preload] Preload script 开始加载...')
console.log('[Webview Preload] 当前 URL:', window.location.href)

// 从 URL 参数中获取 webview ID
const urlParams = new URLSearchParams(window.location.search)
const webviewId = urlParams.get('__webview_id__') || 'unknown'

console.log('[Webview Preload] Webview ID:', webviewId)

// 向主进程注册当前 webview
ipcRenderer.invoke('webview-register', webviewId).then(() => {
  console.log('[Webview Preload] ✓ 已向主进程注册')
}).catch(err => {
  console.error('[Webview Preload] ✗ 注册失败:', err)
})

// 监听来自主进程的消息
ipcRenderer.on('main-to-webview', (event, ...params) => {
  console.log('[Webview Preload] 收到来自主进程的消息:', params)
  
  // 可以在这里处理主进程发来的命令
  if (params[0] === 'execute') {
    try {
      const code = params[1]
      const result = eval(code)
      // 将结果发送回主进程
      ipcRenderer.sendToHost('webview-execute-result', { success: true, result })
    } catch (error) {
      ipcRenderer.sendToHost('webview-execute-result', { 
        success: false, 
        error: error.message 
      })
    }
  }
})

// 监听来自宿主页面的元素选择器消息
ipcRenderer.on('start-element-selector', (event, data) => {
  console.log('[Webview Preload] 收到启动元素选择器请求')
  startElementSelector()
})

ipcRenderer.on('stop-element-selector', (event, data) => {
  console.log('[Webview Preload] 收到停止元素选择器请求')
  stopElementSelector()
})

// 元素选择器状态
let isSelectingElement = false
let hoveredElement = null
let overlayDiv = null

/**
 * 启动元素选择器
 */
function startElementSelector() {
  if (isSelectingElement) {
    console.log('[Webview Preload] 元素选择器已在运行中')
    return
  }
  
  isSelectingElement = true
  console.log('[Webview Preload] 启动元素选择器')
  
  // 创建覆盖层
  createOverlay()
  
  // 添加事件监听
  document.addEventListener('mousemove', handleMouseMove, true)
  document.addEventListener('click', handleClick, true)
  document.addEventListener('keydown', handleKeyDown, true)
  
  // 防止页面滚动
  document.body.style.overflow = 'hidden'
}

/**
 * 停止元素选择器
 */
function stopElementSelector() {
  if (!isSelectingElement) return
  
  isSelectingElement = false
  console.log('[Webview Preload] 停止元素选择器')
  
  // 移除事件监听
  document.removeEventListener('mousemove', handleMouseMove, true)
  document.removeEventListener('click', handleClick, true)
  document.removeEventListener('keydown', handleKeyDown, true)
  
  // 移除覆盖层
  if (overlayDiv && overlayDiv.parentNode) {
    overlayDiv.parentNode.removeChild(overlayDiv)
    overlayDiv = null
  }
  
  // 恢复页面滚动
  document.body.style.overflow = ''
  
  hoveredElement = null
}

/**
 * 创建高亮覆盖层
 */
function createOverlay() {
  overlayDiv = document.createElement('div')
  overlayDiv.id = 'tab-hive-element-selector-overlay'
  overlayDiv.style.cssText = `
    position: absolute;
    background: rgba(255, 92, 0, 0.3);
    border: 2px solid rgb(255, 92, 0);
    pointer-events: none;
    z-index: 2147483647;
    transition: all 0.1s ease;
  `
  document.body.appendChild(overlayDiv)
}

/**
 * 处理鼠标移动
 */
function handleMouseMove(event) {
  if (!isSelectingElement) return
  
  event.preventDefault()
  event.stopPropagation()
  
  const target = event.target
  if (!target || target === overlayDiv) return
  
  hoveredElement = target
  
  // 更新覆盖层位置
  const rect = target.getBoundingClientRect()
  overlayDiv.style.left = rect.left + window.scrollX + 'px'
  overlayDiv.style.top = rect.top + window.scrollY + 'px'
  overlayDiv.style.width = rect.width + 'px'
  overlayDiv.style.height = rect.height + 'px'
  
  // 生成选择器
  const selector = generateSelector(target)
  
  // 发送悬停事件到宿主
  ipcRenderer.sendToHost('element-selector-hover', { selector })
}

/**
 * 处理点击
 */
function handleClick(event) {
  if (!isSelectingElement) return
  
  event.preventDefault()
  event.stopPropagation()
  
  if (hoveredElement) {
    const selector = generateSelector(hoveredElement)
    console.log('[Webview Preload] 元素已选中:', selector)
    
    // 发送选中事件到宿主
    ipcRenderer.sendToHost('element-selector-select', { selector })
    
    // 停止选择器
    stopElementSelector()
  }
}

/**
 * 处理键盘事件
 */
function handleKeyDown(event) {
  if (!isSelectingElement) return
  
  if (event.key === 'Escape') {
    event.preventDefault()
    event.stopPropagation()
    
    console.log('[Webview Preload] 用户按ESC取消')
    
    // 发送取消事件到宿主
    ipcRenderer.sendToHost('element-selector-cancel', {})
    
    // 停止选择器
    stopElementSelector()
  }
}

/**
 * 生成元素的CSS选择器（简洁版本，优先使用ID或class）
 */
function generateSelector(element) {
  try {
    if (!element) return ''
    
    // 如果有ID，优先使用ID
    if (element.id) {
      return '#' + element.id
    }
    
    // 如果有类名，使用标签名+第一个类名
    if (element.className && typeof element.className === 'string') {
      const classes = element.className.trim().split(/\s+/).filter(c => c && !c.startsWith('tab-hive-'))
      if (classes.length > 0) {
        return element.tagName.toLowerCase() + '.' + classes[0]
      }
    }
    
    // 否则使用父元素 + nth-child
    const parent = element.parentElement
    if (parent) {
      const siblings = Array.from(parent.children)
      const index = siblings.indexOf(element) + 1
      return parent.tagName.toLowerCase() + ' > ' + element.tagName.toLowerCase() + ':nth-child(' + index + ')'
    }
    
    // 最后只返回标签名
    return element.tagName.toLowerCase()
  } catch (error) {
    console.error('[Webview Preload] 生成选择器失败:', error)
    return element.tagName ? element.tagName.toLowerCase() : ''
  }
}

// 暴露受限的 API 到 webview 的渲染进程
window.__webviewAPI__ = {
  // 获取当前 webview ID
  getWebviewId: () => webviewId,
  
  // 向宿主页面发送消息
  sendToHost: (channel, ...args) => {
    ipcRenderer.sendToHost(channel, ...args)
  },
  
  // 向主进程发送消息
  sendToMain: (channel, ...args) => {
    ipcRenderer.send(channel, ...args)
  },
  
  // 通知页面加载完成
  notifyReady: () => {
    ipcRenderer.sendToHost('webview-ready', { webviewId, url: window.location.href })
  }
}

// 拦截 window.open,防止打开新窗口
const originalOpen = window.open
window.open = function(url, target, features) {
  console.log('[Webview Preload] 拦截 window.open:', url)
  
  // 通知宿主页面处理新窗口打开
  ipcRenderer.sendToHost('webview-open-url', { 
    url, 
    target, 
    features,
    webviewId 
  })
  
  // 返回 null,阻止打开新窗口
  return null
}

// 页面加载完成后通知宿主
window.addEventListener('DOMContentLoaded', () => {
  console.log('[Webview Preload] DOMContentLoaded')
  window.__webviewAPI__.notifyReady()
})

console.log('[Webview Preload] Preload script 加载完成')

