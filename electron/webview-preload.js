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

ipcRenderer.on('navigate-element', (event, data) => {
  console.log('[Webview Preload] 收到导航元素请求:', data.direction)
  navigateToElement(data.direction)
})

ipcRenderer.on('restart-element-selector', (event, data) => {
  console.log('[Webview Preload] 收到重新启动选择器请求')
  restartElementSelector()
})

ipcRenderer.on('cleanup-element-selector', (event, data) => {
  console.log('[Webview Preload] 收到完全清理选择器请求')
  completeCleanupSelector()
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
  
  // 保留覆盖层的高亮显示，但移除交互
  // overlayDiv 保留，这样用户还能看到选中的元素
  
  // 恢复页面滚动
  document.body.style.overflow = ''
  
  // 不清空 hoveredElement，这样导航功能还能用
  console.log('[Webview Preload] 元素选择器已停止交互，但保留高亮和当前元素')
}

/**
 * 创建高亮覆盖层
 */
function createOverlay() {
  overlayDiv = document.createElement('div')
  overlayDiv.id = 'quanshijie-element-selector-overlay'
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
 * 获取元素的详细信息
 */
function getElementInfo(element) {
  try {
    const computedStyle = window.getComputedStyle(element)
    return {
      tagName: element.tagName.toLowerCase(),
      id: element.id || '',
      className: element.className || '',
      width: Math.round(element.offsetWidth),
      height: Math.round(element.offsetHeight),
      display: computedStyle.display,
      position: computedStyle.position,
      zIndex: computedStyle.zIndex,
      // 获取文本内容（限制长度）
      textContent: element.textContent ? element.textContent.substring(0, 100) : '',
      // 获取常用属性
      attributes: {
        href: element.getAttribute('href'),
        src: element.getAttribute('src'),
        alt: element.getAttribute('alt'),
        title: element.getAttribute('title'),
        type: element.getAttribute('type'),
        value: element.getAttribute('value')
      }
    }
  } catch (error) {
    console.error('[Webview Preload] 获取元素信息失败:', error)
    return {
      tagName: element.tagName.toLowerCase(),
      width: 0,
      height: 0
    }
  }
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
  
  // 获取元素信息
  const elementInfo = getElementInfo(target)
  
  // 发送悬停事件到宿主，包含矩形和详细信息
  ipcRenderer.sendToHost('element-selector-hover', { 
    selector,
    rect: {
      x: rect.left,
      y: rect.top,
      width: rect.width,
      height: rect.height
    },
    elementInfo
  })
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
    const rect = hoveredElement.getBoundingClientRect()
    const elementInfo = getElementInfo(hoveredElement)
    
    console.log('[Webview Preload] 元素已选中:', selector)
    
    // 发送选中事件到宿主，包含矩形和详细信息
    ipcRenderer.sendToHost('element-selector-select', { 
      selector,
      rect: {
        x: rect.left,
        y: rect.top,
        width: rect.width,
        height: rect.height
      },
      elementInfo
    })
    
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
 * 重新启动元素选择器（完全清空并重新开始）
 */
function restartElementSelector() {
  console.log('[Webview Preload] 重新启动元素选择器，完全清理旧状态')
  
  // 移除事件监听器（无论状态如何都尝试移除）
  document.removeEventListener('mousemove', handleMouseMove, true)
  document.removeEventListener('click', handleClick, true)
  document.removeEventListener('keydown', handleKeyDown, true)
  
  // 完全移除覆盖层
  if (overlayDiv) {
    console.log('[Webview Preload] 移除旧的高亮框')
    if (overlayDiv.parentNode) {
      overlayDiv.parentNode.removeChild(overlayDiv)
    }
    overlayDiv = null
  }
  
  // 恢复页面滚动
  document.body.style.overflow = ''
  
  // 清空当前元素和状态
  hoveredElement = null
  isSelectingElement = false
  
  console.log('[Webview Preload] 清理完成，准备重新启动')
  
  // 短暂延迟后重新启动
  setTimeout(() => {
    startElementSelector()
  }, 100)
}

/**
 * 完全清理选择器（移除所有高亮和状态）
 */
function completeCleanupSelector() {
  console.log('[Webview Preload] 完全清理选择器（移除所有高亮）')
  
  // 移除事件监听器
  document.removeEventListener('mousemove', handleMouseMove, true)
  document.removeEventListener('click', handleClick, true)
  document.removeEventListener('keydown', handleKeyDown, true)
  
  // 完全移除覆盖层
  if (overlayDiv) {
    if (overlayDiv.parentNode) {
      overlayDiv.parentNode.removeChild(overlayDiv)
    }
    overlayDiv = null
  }
  
  // 恢复页面滚动
  document.body.style.overflow = ''
  
  // 清空当前元素和状态
  hoveredElement = null
  isSelectingElement = false
  
  console.log('[Webview Preload] 完全清理完成')
}

/**
 * 导航到父元素或子元素
 */
function navigateToElement(direction) {
  if (!hoveredElement) {
    console.warn('[Webview Preload] 没有当前元素可导航')
    return
  }
  
  let newElement = null
  
  if (direction === 'parent') {
    // 导航到父元素
    newElement = hoveredElement.parentElement
    if (!newElement || newElement.tagName === 'BODY' || newElement.tagName === 'HTML') {
      console.warn('[Webview Preload] 已到达顶层元素')
      return
    }
  } else if (direction === 'child') {
    // 导航到第一个非脚本/样式的子元素
    const children = Array.from(hoveredElement.children)
    newElement = children.find(child => 
      !['SCRIPT', 'STYLE', 'LINK', 'META'].includes(child.tagName)
    )
    if (!newElement) {
      console.warn('[Webview Preload] 没有可用的子元素')
      return
    }
  }
  
  if (newElement) {
    hoveredElement = newElement
    const selector = generateSelector(newElement)
    const rect = newElement.getBoundingClientRect()
    const elementInfo = getElementInfo(newElement)
    
    console.log('[Webview Preload] 导航到新元素:', selector)
    
    // 更新覆盖层位置
    if (overlayDiv) {
      overlayDiv.style.left = rect.left + window.scrollX + 'px'
      overlayDiv.style.top = rect.top + window.scrollY + 'px'
      overlayDiv.style.width = rect.width + 'px'
      overlayDiv.style.height = rect.height + 'px'
    }
    
    // 发送更新事件到宿主
    ipcRenderer.sendToHost('element-selector-hover', { 
      selector,
      rect: {
        x: rect.left,
        y: rect.top,
        width: rect.width,
        height: rect.height
      },
      elementInfo
    })
  }
}

/**
 * 检测字符串是否包含乱码字符
 */
function hasGarbledCharacters(str) {
  if (!str || typeof str !== 'string') return false
  
  const garbledPatterns = [
    /[^\w\s-]{5,}/, // 大量连续符号
    // eslint-disable-next-line no-control-regex
    /[\x00-\x1F\x7F-\x9F]/, // 控制字符
    /[\uE000-\uF8FF]{3,}/, // Unicode私有区域
    /[\uFFFD]{2,}/, // 替代字符
    /[a-z0-9]{32,}/i, // 长哈希值
    /[A-Za-z0-9+/]{20,}={0,2}/, // base64字符串
    /[_-]{5,}/ // 过多下划线或连字符
  ]
  
  return garbledPatterns.some(pattern => pattern.test(str))
}

/**
 * 计算选择器质量分数
 */
function calculateSelectorQuality(selector) {
  if (!selector) return 0
  
  let score = 50
  
  if (selector.includes('#')) score += 30
  
  const classes = selector.match(/\.([a-zA-Z][a-zA-Z0-9-]*)/g)
  if (classes && classes.length > 0) {
    score += 20
    const avgLength = classes.reduce((sum, c) => sum + c.length, 0) / classes.length
    if (avgLength < 15) score += 10
  }
  
  const semanticKeywords = ['header', 'footer', 'nav', 'main', 'content', 'container', 'wrapper', 'section', 'article']
  const lowerSelector = selector.toLowerCase()
  if (semanticKeywords.some(keyword => lowerSelector.includes(keyword))) {
    score += 10
  }
  
  const complexity = (selector.match(/[>+~\s]/g) || []).length
  if (complexity > 5) score -= complexity * 2
  
  if (/\d{3,}/.test(selector)) score -= 15
  
  return Math.max(0, Math.min(100, score))
}

/**
 * 生成元素的多个候选选择器
 */
function generateSelectorCandidates(element) {
  if (!element) return []
  
  const candidates = []
  
  try {
    // 候选1: ID选择器（验证无乱码）
    if (element.id && !hasGarbledCharacters(element.id)) {
      candidates.push({ selector: `#${element.id}`, element: element })
    }
    
    // 候选2: 标签 + 第一个有效类名
    if (element.className && typeof element.className === 'string') {
      const classes = element.className.trim().split(/\s+/)
        .filter(c => c && !c.startsWith('quanshijie-') && !hasGarbledCharacters(c))
      
      if (classes.length > 0) {
        candidates.push({ 
          selector: `${element.tagName.toLowerCase()}.${classes[0]}`, 
          element: element 
        })
      }
      
      if (classes.length > 1) {
        candidates.push({ 
          selector: `${element.tagName.toLowerCase()}.${classes.slice(0, 2).join('.')}`, 
          element: element 
        })
      }
    }
    
    // 候选3: 标签 + 有效属性
    const validAttrs = ['data-testid', 'data-id', 'role', 'name', 'type']
    for (const attr of validAttrs) {
      const value = element.getAttribute(attr)
      if (value && !hasGarbledCharacters(value)) {
        candidates.push({ 
          selector: `${element.tagName.toLowerCase()}[${attr}="${value}"]`, 
          element: element 
        })
      }
    }
    
    // 候选4: 尝试使用父元素（如果当前元素的选择器质量低）
    const parent = element.parentElement
    if (parent && parent.tagName !== 'BODY' && parent.tagName !== 'HTML') {
      // 检查父元素是否有更好的选择器
      if (parent.id && !hasGarbledCharacters(parent.id)) {
        const siblings = Array.from(parent.children)
        const index = siblings.indexOf(element) + 1
        candidates.push({ 
          selector: `#${parent.id} > ${element.tagName.toLowerCase()}:nth-child(${index})`, 
          element: element 
        })
      } else if (parent.className && typeof parent.className === 'string') {
        const parentClasses = parent.className.trim().split(/\s+/)
          .filter(c => c && !hasGarbledCharacters(c))
        if (parentClasses.length > 0) {
          const siblings = Array.from(parent.children)
          const index = siblings.indexOf(element) + 1
          candidates.push({ 
            selector: `.${parentClasses[0]} > ${element.tagName.toLowerCase()}:nth-child(${index})`, 
            element: element 
          })
        }
      }
      
      // 如果所有候选都很差，尝试使用父元素
      if (candidates.length === 0 || candidates.every(c => calculateSelectorQuality(c.selector) < 30)) {
        console.log('[Webview Preload] 当前元素选择器质量低，尝试父元素')
        const parentCandidates = generateSelectorCandidates(parent)
        // 只取父元素的最佳选择器
        if (parentCandidates.length > 0) {
          const bestParent = parentCandidates.sort((a, b) => 
            calculateSelectorQuality(b.selector) - calculateSelectorQuality(a.selector)
          )[0]
          candidates.push({ selector: bestParent.selector, element: parent })
        }
      }
    }
    
    // 候选5: 简单标签名（作为最后的选择）
    if (candidates.length === 0) {
      candidates.push({ selector: element.tagName.toLowerCase(), element: element })
    }
    
  } catch (error) {
    console.error('[Webview Preload] 生成候选选择器失败:', error)
  }
  
  return candidates
}

/**
 * 选择最佳选择器
 */
function selectBestSelector(candidates) {
  if (!candidates || candidates.length === 0) return null
  
  // 按质量分数排序
  const scored = candidates.map(c => ({
    ...c,
    score: calculateSelectorQuality(c.selector)
  }))
  
  scored.sort((a, b) => b.score - a.score)
  
  console.log('[Webview Preload] 选择器候选列表:', scored.map(s => `${s.selector} (分数: ${s.score})`).join(', '))
  
  return scored[0]
}

/**
 * 生成元素的CSS选择器（优化版本，自动过滤乱码并选择父元素）
 */
function generateSelector(element) {
  try {
    if (!element) return ''
    
    // 生成多个候选选择器
    const candidates = generateSelectorCandidates(element)
    
    if (candidates.length === 0) {
      return element.tagName ? element.tagName.toLowerCase() : ''
    }
    
    // 选择最佳选择器
    const best = selectBestSelector(candidates)
    
    // 如果最佳选择器使用了不同的元素（比如父元素），更新 hoveredElement
    if (best.element !== element) {
      console.log('[Webview Preload] 选择器质量优化：使用', best.element.tagName, '代替', element.tagName)
      hoveredElement = best.element
    }
    
    return best.selector
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

// 拦截 window.open，改为在当前页面打开
const originalOpen = window.open
window.open = function(url, target, features) {
  if (!url) {
    return originalOpen.call(this, url, target, features)
  }
  
  // 转换为绝对URL并在当前页面打开
  try {
    const currentUrl = window.location.href
    const targetUrl = url.startsWith('http') ? url : new URL(url, currentUrl).href
    window.location.href = targetUrl
    return window
  } catch (error) {
    // 出错时也在当前页面打开
    window.location.href = url
    return window
  }
}

// 修改所有target="_blank"的链接，让它们在当前webview中打开
document.addEventListener('click', (event) => {
  let target = event.target
  while (target && target.tagName !== 'A') {
    target = target.parentElement
  }
  
  if (target && target.tagName === 'A' && target.getAttribute('target') === '_blank') {
    const href = target.getAttribute('href')
    if (href && !href.startsWith('#') && !href.startsWith('javascript:')) {
      event.preventDefault()
      const absoluteUrl = href.startsWith('http') || href.startsWith('//') 
        ? href 
        : new URL(href, window.location.href).href
      window.location.href = absoluteUrl
    }
  }
}, true)

// ==================== 页面加载事件 ====================

// 页面加载完成后通知宿主
window.addEventListener('DOMContentLoaded', () => {
  console.log('[Webview Preload] DOMContentLoaded - 页面DOM已加载')
  window.__webviewAPI__.notifyReady()
})

// 页面完全加载完成
window.addEventListener('load', () => {
  console.log('[Webview Preload] Load - 页面完全加载完成（包括所有资源）')
})

// ==================== 鼠标前进/后退按钮支持 ====================

/**
 * 监听鼠标按钮事件，支持前进/后退导航
 * button 3 = 后退按钮（通常是鼠标侧边的 Back 按钮）
 * button 4 = 前进按钮（通常是鼠标侧边的 Forward 按钮）
 */
document.addEventListener('mousedown', (event) => {
  // 如果在元素选择器模式，不处理
  if (isSelectingElement) return
  
  // button 3 = 后退按钮
  if (event.button === 3) {
    console.log('[Webview Preload] 鼠标后退按钮被点击')
    event.preventDefault()
    if (window.history.length > 1) {
      window.history.back()
    }
  }
  // button 4 = 前进按钮
  else if (event.button === 4) {
    console.log('[Webview Preload] 鼠标前进按钮被点击')
    event.preventDefault()
    window.history.forward()
  }
}, true) // 使用捕获阶段确保优先处理

// 也监听 auxclick 事件作为备用（某些浏览器可能使用这个事件）
document.addEventListener('auxclick', (event) => {
  // 如果在元素选择器模式，不处理
  if (isSelectingElement) return
  
  // button 3 = 后退按钮
  if (event.button === 3) {
    console.log('[Webview Preload] auxclick 后退按钮被点击')
    event.preventDefault()
    if (window.history.length > 1) {
      window.history.back()
    }
  }
  // button 4 = 前进按钮
  else if (event.button === 4) {
    console.log('[Webview Preload] auxclick 前进按钮被点击')
    event.preventDefault()
    window.history.forward()
  }
}, true)

console.log('[Webview Preload] Preload script 加载完成')

