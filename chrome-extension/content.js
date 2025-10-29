/**
 * Tab Hive - Chrome Extension Content Script
 * 在每个页面中运行，监听来自Tab Hive应用的消息
 * 并注入反检测脚本以解决iframe显示问题
 */

console.log('[Tab Hive Extension] Content script loaded');

// 立即设置扩展检测标记
try {
  if (window.self === window.top) {
    // 只在顶级窗口设置
    window.__tabHiveExtensionDetected = true;
  }
} catch (e) {
  // 忽略跨域错误
}

// ===========================================
// iframe反检测 - 覆盖JavaScript检测
// ===========================================

// 必须在页面脚本执行之前注入，因此使用立即执行
// 使用外部文件避免CSP inline script问题
(function() {
  try {
    // 创建script元素并指向外部文件
    const script = document.createElement('script');
    script.src = chrome.runtime.getURL('inject.js');
    script.onload = function() {
      console.log('[Tab Hive Extension] iframe反检测脚本已注入');
      this.remove(); // 加载后移除script标签
    };
    script.onerror = function() {
      console.error('[Tab Hive Extension] 注入反检测脚本失败');
      this.remove();
    };
    
    // 尽早插入脚本
    (document.head || document.documentElement).appendChild(script);
  } catch (error) {
    console.error('[Tab Hive Extension] 创建注入脚本失败:', error);
  }
})();

// 监听来自页面的消息（通过window.postMessage）
window.addEventListener('message', async (event) => {
  const message = event.data;

  // 检查是否是Tab Hive的消息
  if (message && message.source === 'tab-hive') {
    console.log('[Tab Hive Extension] 收到来自Tab Hive的消息:', message);

    if (message.action === 'executeScriptInIframe') {
      // 在当前页面（iframe）中应用选择器
      console.log('[Tab Hive Extension] 应用选择器:', message.selector)
      try {
        const result = applyTabHiveSelectorInIframe(message.selector)
        // 发送完成回调
        window.parent.postMessage({
          source: 'tab-hive-extension',
          action: 'selectorApplied',
          requestId: message.requestId,
          success: result.success,
          hiddenCount: result.hiddenCount
        }, '*')
      } catch (error) {
        console.error('[Tab Hive Extension] 选择器应用失败:', error)
        window.parent.postMessage({
          source: 'tab-hive-extension',
          action: 'selectorApplied',
          requestId: message.requestId,
          success: false,
          error: error.message
        }, '*')
      }
    } else if (message.action === 'restoreTabHiveStyles') {
      // 恢复原始样式
      console.log('[Tab Hive Extension] 恢复原始样式')
      try {
        restoreTabHiveStylesInIframe()
      } catch (error) {
        console.error('[Tab Hive Extension] 样式恢复失败:', error)
      }
    } else if (message.action === 'applySelectorFullscreen') {
      // 应用选择器全屏
      try {
        const response = await chrome.runtime.sendMessage({
          action: 'applySelectorFullscreen',
          selector: message.selector,
          frameId: message.frameId
        });

        // 将结果发送回页面
        window.postMessage({
          source: 'tab-hive-extension',
          action: 'applySelectorFullscreenResponse',
          requestId: message.requestId,
          response: response
        }, '*');
      } catch (error) {
        window.postMessage({
          source: 'tab-hive-extension',
          action: 'applySelectorFullscreenResponse',
          requestId: message.requestId,
          response: { success: false, error: error.message }
        }, '*');
      }
    } else if (message.action === 'restoreOriginalStyles') {
      // 恢复原始样式
      try {
        const response = await chrome.runtime.sendMessage({
          action: 'restoreOriginalStyles',
          frameId: message.frameId
        });

        window.postMessage({
          source: 'tab-hive-extension',
          action: 'restoreOriginalStylesResponse',
          requestId: message.requestId,
          response: response
        }, '*');
      } catch (error) {
        window.postMessage({
          source: 'tab-hive-extension',
          action: 'restoreOriginalStylesResponse',
          requestId: message.requestId,
          response: { success: false, error: error.message }
        }, '*');
      }
    } else if (message.action === 'startElementSelector') {
      // 启动元素选择器
      console.log('[Tab Hive Extension] 启动元素选择器')
      try {
        startElementSelectorInIframe()
        window.postMessage({
          source: 'tab-hive-extension',
          action: 'elementSelectorStarted',
          requestId: message.requestId,
          success: true
        }, '*')
      } catch (error) {
        console.error('[Tab Hive Extension] 启动元素选择器失败:', error)
        window.postMessage({
          source: 'tab-hive-extension',
          action: 'elementSelectorStarted',
          requestId: message.requestId,
          success: false,
          error: error.message
        }, '*')
      }
    } else if (message.action === 'stopElementSelector') {
      // 停止元素选择器
      console.log('[Tab Hive Extension] 停止元素选择器')
      try {
        stopElementSelectorInIframe()
        window.postMessage({
          source: 'tab-hive-extension',
          action: 'elementSelectorStopped',
          requestId: message.requestId,
          success: true
        }, '*')
      } catch (error) {
        console.error('[Tab Hive Extension] 停止元素选择器失败:', error)
        window.postMessage({
          source: 'tab-hive-extension',
          action: 'elementSelectorStopped',
          requestId: message.requestId,
          success: false,
          error: error.message
        }, '*')
      }
    } else if (message.action === 'navigateElement') {
      // 导航到父/子元素
      console.log('[Tab Hive Extension] 导航元素:', message.direction)
      try {
        navigateToElement(message.direction)
      } catch (error) {
        console.error('[Tab Hive Extension] 元素导航失败:', error)
      }
    } else if (message.action === 'restartElementSelector') {
      // 重新启动元素选择器（完全清空并重新开始）
      console.log('[Tab Hive Extension] 重新启动元素选择器')
      try {
        restartElementSelectorInIframe()
      } catch (error) {
        console.error('[Tab Hive Extension] 重新启动选择器失败:', error)
      }
    } else if (message.action === 'cleanupElementSelector') {
      // 完全清理选择器（移除所有高亮和状态）
      console.log('[Tab Hive Extension] 完全清理选择器')
      try {
        completeCleanupInIframe()
      } catch (error) {
        console.error('[Tab Hive Extension] 完全清理失败:', error)
      }
    }
  }
});

// 向页面注入一个标记，表示扩展已加载
window.postMessage({
  source: 'tab-hive-extension',
  action: 'extensionLoaded'
}, '*');

// 监听ping消息并响应
window.addEventListener('message', (event) => {
  if (event.data && event.data.source === 'tab-hive' && event.data.action === 'ping') {
    console.log('[Tab Hive Extension] 收到ping，发送pong')
    window.postMessage({
      source: 'tab-hive-extension',
      action: 'pong'
    }, '*');
  }
});

/**
 * 在iframe中应用选择器（隐藏其他元素，目标元素填满）
 */
function applyTabHiveSelectorInIframe(selector) {
  try {
    console.log('[Tab Hive iframe] 应用选择器:', selector);
    
    const targetElement = document.querySelector(selector);
    
    if (!targetElement) {
      console.warn('[Tab Hive iframe] 未找到选择器:', selector);
      return { success: false, error: '未找到元素' };
    }
    
    console.log('[Tab Hive iframe] 找到目标元素，开始处理');
    
    // 隐藏兄弟元素
    let current = targetElement;
    let hiddenCount = 0;
    
    while (current && current !== document.body) {
      const parent = current.parentElement;
      if (parent) {
        Array.from(parent.children).forEach(sibling => {
          if (sibling !== current && 
              !['SCRIPT', 'STYLE', 'LINK', 'META', 'TITLE'].includes(sibling.tagName)) {
            sibling.style.display = 'none';
            sibling.setAttribute('data-tabhive-hidden', 'true');
            hiddenCount++;
          }
        });
      }
      current = parent;
    }
    
    console.log('[Tab Hive iframe] 已隐藏', hiddenCount, '个兄弟元素');
    
    // 注入样式
    const styleId = 'tabhive-selector-style';
    let style = document.getElementById(styleId);
    if (!style) {
      style = document.createElement('style');
      style.id = styleId;
      document.head.appendChild(style);
    }
    
    style.textContent = `
      html, body {
        margin: 0 !important;
        padding: 0 !important;
        overflow: hidden !important;
        width: 100% !important;
        height: 100% !important;
      }
      
      ${selector} {
        display: block !important;
        visibility: visible !important;
        position: fixed !important;
        top: 0 !important;
        left: 0 !important;
        width: 100vw !important;
        height: 100vh !important;
        margin: 0 !important;
        padding: 0 !important;
        z-index: 999999 !important;
        object-fit: contain !important;
      }
      
      ${selector} * {
        visibility: visible !important;
      }
    `;
    
    console.log('[Tab Hive iframe] 选择器已应用，隐藏了', hiddenCount, '个元素');
    return { success: true, hiddenCount: hiddenCount };
  } catch (error) {
    console.error('[Tab Hive iframe] 错误:', error);
    return { success: false, error: error.message };
  }
}

/**
 * 恢复Tab Hive的样式修改
 */
function restoreTabHiveStylesInIframe() {
  try {
    const styleId = 'tabhive-selector-style';
    const style = document.getElementById(styleId);
    if (style) {
      style.remove();
      console.log('[Tab Hive iframe] 样式已移除');
    }
    
    const hiddenElements = document.querySelectorAll('[data-tabhive-hidden]');
    let restoredCount = 0;
    hiddenElements.forEach(el => {
      el.style.display = '';
      el.removeAttribute('data-tabhive-hidden');
      restoredCount++;
    });
    console.log('[Tab Hive iframe] 已恢复', restoredCount, '个元素');
  } catch (error) {
    console.error('[Tab Hive iframe] 恢复失败:', error);
  }
}

// ===========================================
// 元素选择器功能
// ===========================================

let selectorOverlay = null;
let selectorHighlight = null;
let currentHoveredElement = null;

/**
 * 检测字符串是否包含乱码字符
 */
function hasGarbledCharacters(str) {
  if (!str || typeof str !== 'string') return false;
  
  const garbledPatterns = [
    /[^\w\s-]{5,}/, // 大量连续符号
    // eslint-disable-next-line no-control-regex
    /[\x00-\x1F\x7F-\x9F]/, // 控制字符
    /[\uE000-\uF8FF]{3,}/, // Unicode私有区域
    /[\uFFFD]{2,}/, // 替代字符
    /[a-z0-9]{32,}/i, // 长哈希值
    /[A-Za-z0-9+/]{20,}={0,2}/, // base64字符串
    /[_-]{5,}/ // 过多下划线或连字符
  ];
  
  return garbledPatterns.some(pattern => pattern.test(str));
}

/**
 * 计算选择器质量分数
 */
function calculateSelectorQuality(selector) {
  if (!selector) return 0;
  
  let score = 50;
  
  if (selector.includes('#')) score += 30;
  
  const classes = selector.match(/\.([a-zA-Z][a-zA-Z0-9-]*)/g);
  if (classes && classes.length > 0) {
    score += 20;
    const avgLength = classes.reduce((sum, c) => sum + c.length, 0) / classes.length;
    if (avgLength < 15) score += 10;
  }
  
  const semanticKeywords = ['header', 'footer', 'nav', 'main', 'content', 'container', 'wrapper', 'section', 'article'];
  const lowerSelector = selector.toLowerCase();
  if (semanticKeywords.some(keyword => lowerSelector.includes(keyword))) {
    score += 10;
  }
  
  const complexity = (selector.match(/[>+~\s]/g) || []).length;
  if (complexity > 5) score -= complexity * 2;
  
  if (/\d{3,}/.test(selector)) score -= 15;
  
  return Math.max(0, Math.min(100, score));
}

/**
 * 生成元素的多个候选选择器
 */
function generateSelectorCandidates(element) {
  if (!element) return [];
  
  const candidates = [];
  
  try {
    // 候选1: ID选择器（验证无乱码）
    if (element.id && !hasGarbledCharacters(element.id)) {
      candidates.push({ selector: `#${element.id}`, element: element });
    }
    
    // 候选2: 标签 + 第一个有效类名
    if (element.className && typeof element.className === 'string') {
      const classes = element.className.trim().split(/\s+/)
        .filter(c => c && !c.startsWith('tabhive-') && !hasGarbledCharacters(c));
      
      if (classes.length > 0) {
        candidates.push({ 
          selector: `${element.tagName.toLowerCase()}.${classes[0]}`, 
          element: element 
        });
      }
      
      if (classes.length > 1) {
        candidates.push({ 
          selector: `${element.tagName.toLowerCase()}.${classes.slice(0, 2).join('.')}`, 
          element: element 
        });
      }
    }
    
    // 候选3: 标签 + 有效属性
    const validAttrs = ['data-testid', 'data-id', 'role', 'name', 'type'];
    for (const attr of validAttrs) {
      const value = element.getAttribute(attr);
      if (value && !hasGarbledCharacters(value)) {
        candidates.push({ 
          selector: `${element.tagName.toLowerCase()}[${attr}="${value}"]`, 
          element: element 
        });
      }
    }
    
    // 候选4: 尝试使用父元素（如果当前元素的选择器质量低）
    const parent = element.parentElement;
    if (parent && parent.tagName !== 'BODY' && parent.tagName !== 'HTML') {
      // 检查父元素是否有更好的选择器
      if (parent.id && !hasGarbledCharacters(parent.id)) {
        const siblings = Array.from(parent.children);
        const index = siblings.indexOf(element) + 1;
        candidates.push({ 
          selector: `#${parent.id} > ${element.tagName.toLowerCase()}:nth-child(${index})`, 
          element: element 
        });
      } else if (parent.className && typeof parent.className === 'string') {
        const parentClasses = parent.className.trim().split(/\s+/)
          .filter(c => c && !hasGarbledCharacters(c));
        if (parentClasses.length > 0) {
          const siblings = Array.from(parent.children);
          const index = siblings.indexOf(element) + 1;
          candidates.push({ 
            selector: `.${parentClasses[0]} > ${element.tagName.toLowerCase()}:nth-child(${index})`, 
            element: element 
          });
        }
      }
      
      // 如果所有候选都很差，尝试使用父元素
      if (candidates.length === 0 || candidates.every(c => calculateSelectorQuality(c.selector) < 30)) {
        console.log('[Tab Hive] 当前元素选择器质量低，尝试父元素');
        const parentCandidates = generateSelectorCandidates(parent);
        // 只取父元素的最佳选择器
        if (parentCandidates.length > 0) {
          const bestParent = parentCandidates.sort((a, b) => 
            calculateSelectorQuality(b.selector) - calculateSelectorQuality(a.selector)
          )[0];
          candidates.push({ selector: bestParent.selector, element: parent });
        }
      }
    }
    
    // 候选5: 简单标签名（作为最后的选择）
    if (candidates.length === 0) {
      candidates.push({ selector: element.tagName.toLowerCase(), element: element });
    }
    
  } catch (error) {
    console.error('[Tab Hive] 生成候选选择器失败:', error);
  }
  
  return candidates;
}

/**
 * 选择最佳选择器
 */
function selectBestSelector(candidates) {
  if (!candidates || candidates.length === 0) return null;
  
  // 按质量分数排序
  const scored = candidates.map(c => ({
    ...c,
    score: calculateSelectorQuality(c.selector)
  }));
  
  scored.sort((a, b) => b.score - a.score);
  
  console.log('[Tab Hive] 选择器候选列表:', scored.map(s => `${s.selector} (分数: ${s.score})`).join(', '));
  
  return scored[0];
}

/**
 * 生成CSS选择器（优化版本，自动过滤乱码并选择父元素）
 */
function generateCssSelector(element) {
  try {
    if (!element) return '';
    
    // 生成多个候选选择器
    const candidates = generateSelectorCandidates(element);
    
    if (candidates.length === 0) {
      return element.tagName ? element.tagName.toLowerCase() : '';
    }
    
    // 选择最佳选择器
    const best = selectBestSelector(candidates);
    
    // 如果最佳选择器使用了不同的元素（比如父元素），更新 currentHoveredElement
    if (best.element !== element) {
      console.log('[Tab Hive] 选择器质量优化：使用', best.element.tagName, '代替', element.tagName);
      currentHoveredElement = best.element;
    }
    
    return best.selector;
  } catch (error) {
    console.error('[Tab Hive] 生成选择器失败:', error);
    return element.tagName ? element.tagName.toLowerCase() : '';
  }
}

/**
 * 启动元素选择器
 */
function startElementSelectorInIframe() {
  console.log('[Tab Hive] 在iframe中启动元素选择器');
  
  // 注入样式
  const styleId = 'tabhive-element-selector-styles';
  if (!document.getElementById(styleId)) {
    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = `
      .tabhive-selector-overlay {
        position: fixed !important;
        top: 0 !important;
        left: 0 !important;
        right: 0 !important;
        bottom: 0 !important;
        z-index: 2147483646 !important;
        cursor: crosshair !important;
        background: rgba(0, 0, 0, 0.02) !important;
        pointer-events: none !important;
      }
      
      * {
        cursor: crosshair !important;
      }
      
      .tabhive-element-highlight {
        position: absolute !important;
        border: 2px solid #ff5c00 !important;
        background: rgba(255, 92, 0, 0.1) !important;
        pointer-events: none !important;
        z-index: 2147483647 !important;
        transition: all 0.1s ease-out !important;
        box-shadow: 0 0 0 2px rgba(255, 92, 0, 0.3) !important;
      }
      
      .tabhive-element-highlight::before {
        content: '' !important;
        position: absolute !important;
        top: -2px !important;
        left: -2px !important;
        right: -2px !important;
        bottom: -2px !important;
        border: 2px dashed rgba(255, 92, 0, 0.5) !important;
        animation: tabhive-dash 0.5s linear infinite !important;
      }
      
      @keyframes tabhive-dash {
        to {
          stroke-dashoffset: -20;
        }
      }
    `;
    document.head.appendChild(style);
  }
  
  // 创建覆盖层（用于视觉提示，不阻挡事件）
  selectorOverlay = document.createElement('div');
  selectorOverlay.className = 'tabhive-selector-overlay';
  document.body.appendChild(selectorOverlay);
  
  // 创建高亮元素
  selectorHighlight = document.createElement('div');
  selectorHighlight.className = 'tabhive-element-highlight';
  selectorHighlight.style.display = 'none';
  document.body.appendChild(selectorHighlight);
  
  // 添加事件监听器到document，使用捕获阶段
  document.addEventListener('mouseover', handleSelectorMouseOver, {capture: true, passive: true});
  document.addEventListener('click', handleSelectorClick, {capture: true});
  document.addEventListener('keydown', handleSelectorKeyDown, {capture: true});
  
  console.log('[Tab Hive] 元素选择器已启动，事件监听器已添加');
}

/**
 * 停止元素选择器
 */
function stopElementSelectorInIframe() {
  console.log('[Tab Hive] 停止元素选择器');
  
  // 移除事件监听器（使用相同的选项）
  document.removeEventListener('mouseover', handleSelectorMouseOver, {capture: true, passive: true});
  document.removeEventListener('click', handleSelectorClick, {capture: true});
  document.removeEventListener('keydown', handleSelectorKeyDown, {capture: true});
  
  // 保留高亮显示但移除事件
  // 不移除 selectorHighlight，这样用户还能看到选中的元素
  
  // 移除覆盖层
  if (selectorOverlay && selectorOverlay.parentNode) {
    selectorOverlay.parentNode.removeChild(selectorOverlay);
  }
  
  // 移除样式中的 cursor: crosshair
  const style = document.getElementById('tabhive-element-selector-styles');
  if (style) {
    style.textContent = `
      .tabhive-element-highlight {
        position: absolute !important;
        border: 2px solid #ff5c00 !important;
        background: rgba(255, 92, 0, 0.1) !important;
        pointer-events: none !important;
        z-index: 2147483647 !important;
        transition: all 0.1s ease-out !important;
        box-shadow: 0 0 0 2px rgba(255, 92, 0, 0.3) !important;
      }
    `;
  }
  
  // 重置覆盖层变量，但保留当前元素引用用于导航
  selectorOverlay = null;
  // 不清空 currentHoveredElement，这样导航功能还能用
  // 不清空 selectorHighlight，保持高亮显示
  
  console.log('[Tab Hive] 元素选择器已停止交互，但保留高亮和当前元素');
}

/**
 * 获取元素的详细信息
 */
function getElementInfo(element) {
  try {
    const computedStyle = window.getComputedStyle(element);
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
    };
  } catch (error) {
    console.error('[Tab Hive] 获取元素信息失败:', error);
    return {
      tagName: element.tagName.toLowerCase(),
      width: 0,
      height: 0
    };
  }
}

/**
 * 处理鼠标悬停
 */
function handleSelectorMouseOver(event) {
  const element = event.target;
  
  // 忽略我们自己的元素
  if (element === selectorOverlay || element === selectorHighlight ||
      element.classList.contains('tabhive-selector-overlay') ||
      element.classList.contains('tabhive-element-highlight')) {
    return;
  }
  
  // 忽略html和body
  if (element.tagName === 'HTML' || element.tagName === 'BODY') {
    return;
  }
  
  currentHoveredElement = element;
  const selector = generateCssSelector(element);
  
  console.log('[Tab Hive] 鼠标悬停元素:', element.tagName, selector);
  
  // 更新高亮位置
  const rect = element.getBoundingClientRect();
  const scrollLeft = document.documentElement.scrollLeft || document.body.scrollLeft;
  const scrollTop = document.documentElement.scrollTop || document.body.scrollTop;
  
  selectorHighlight.style.top = (rect.top + scrollTop) + 'px';
  selectorHighlight.style.left = (rect.left + scrollLeft) + 'px';
  selectorHighlight.style.width = rect.width + 'px';
  selectorHighlight.style.height = rect.height + 'px';
  selectorHighlight.style.display = 'block';
  
  // 获取元素信息
  const elementInfo = getElementInfo(element);
  
  // 发送选择器和详细信息到父页面
  try {
    window.parent.postMessage({
      source: 'tab-hive-extension',
      action: 'elementHovered',
      selector: selector,
      rect: {
        x: rect.left,
        y: rect.top,
        width: rect.width,
        height: rect.height
      },
      elementInfo: elementInfo
    }, '*');
    console.log('[Tab Hive] 已发送hover消息到父页面');
  } catch (error) {
    console.error('[Tab Hive] 发送hover消息失败:', error);
  }
  
  event.stopPropagation();
}

/**
 * 处理点击
 */
function handleSelectorClick(event) {
  event.preventDefault();
  event.stopPropagation();
  
  console.log('[Tab Hive] 点击事件触发', currentHoveredElement);
  
  if (currentHoveredElement) {
    const selector = generateCssSelector(currentHoveredElement);
    const rect = currentHoveredElement.getBoundingClientRect();
    const elementInfo = getElementInfo(currentHoveredElement);
    
    console.log('[Tab Hive] 选中元素:', selector);
    
    // 发送选择结果到父页面，包含矩形和详细信息
    try {
      window.parent.postMessage({
        source: 'tab-hive-extension',
        action: 'elementSelected',
        selector: selector,
        rect: {
          x: rect.left,
          y: rect.top,
          width: rect.width,
          height: rect.height
        },
        elementInfo: elementInfo
      }, '*');
      console.log('[Tab Hive] 已发送选择消息到父页面');
    } catch (error) {
      console.error('[Tab Hive] 发送选择消息失败:', error);
    }
    
    // 停止选择器
    stopElementSelectorInIframe();
  } else {
    console.warn('[Tab Hive] 没有悬停的元素');
  }
}

/**
 * 处理ESC键
 */
function handleSelectorKeyDown(event) {
  if (event.key === 'Escape') {
    event.preventDefault();
    event.stopPropagation();
    
    // 发送取消消息到父页面
    window.parent.postMessage({
      source: 'tab-hive-extension',
      action: 'elementSelectorCancelled'
    }, '*');
    
    // 停止选择器
    stopElementSelectorInIframe();
  }
}

/**
 * 重新启动元素选择器（完全清空并重新开始）
 */
function restartElementSelectorInIframe() {
  console.log('[Tab Hive] 重新启动元素选择器，完全清理旧状态');
  
  // 移除事件监听器（如果存在）
  document.removeEventListener('mouseover', handleSelectorMouseOver, {capture: true, passive: true});
  document.removeEventListener('click', handleSelectorClick, {capture: true});
  document.removeEventListener('keydown', handleSelectorKeyDown, {capture: true});
  
  // 完全移除高亮元素
  if (selectorHighlight) {
    console.log('[Tab Hive] 移除旧的高亮框');
    if (selectorHighlight.parentNode) {
      selectorHighlight.parentNode.removeChild(selectorHighlight);
    }
    selectorHighlight = null;
  }
  
  // 移除覆盖层
  if (selectorOverlay) {
    if (selectorOverlay.parentNode) {
      selectorOverlay.parentNode.removeChild(selectorOverlay);
    }
    selectorOverlay = null;
  }
  
  // 移除样式
  const style = document.getElementById('tabhive-element-selector-styles');
  if (style) {
    if (style.parentNode) {
      style.parentNode.removeChild(style);
    }
  }
  
  // 清空当前元素
  currentHoveredElement = null;
  
  console.log('[Tab Hive] 清理完成，准备重新启动');
  
  // 短暂延迟后重新启动
  setTimeout(() => {
    startElementSelectorInIframe();
  }, 100);
}

/**
 * 完全清理选择器（移除所有高亮和状态）
 */
function completeCleanupInIframe() {
  console.log('[Tab Hive] 完全清理选择器（移除所有高亮）');
  
  // 移除事件监听器
  document.removeEventListener('mouseover', handleSelectorMouseOver, {capture: true, passive: true});
  document.removeEventListener('click', handleSelectorClick, {capture: true});
  document.removeEventListener('keydown', handleSelectorKeyDown, {capture: true});
  
  // 完全移除高亮元素
  if (selectorHighlight) {
    if (selectorHighlight.parentNode) {
      selectorHighlight.parentNode.removeChild(selectorHighlight);
    }
    selectorHighlight = null;
  }
  
  // 移除覆盖层
  if (selectorOverlay) {
    if (selectorOverlay.parentNode) {
      selectorOverlay.parentNode.removeChild(selectorOverlay);
    }
    selectorOverlay = null;
  }
  
  // 移除样式
  const style = document.getElementById('tabhive-element-selector-styles');
  if (style) {
    if (style.parentNode) {
      style.parentNode.removeChild(style);
    }
  }
  
  // 清空当前元素
  currentHoveredElement = null;
  
  console.log('[Tab Hive] 完全清理完成');
}

/**
 * 导航到父元素或子元素
 */
function navigateToElement(direction) {
  if (!currentHoveredElement) {
    console.warn('[Tab Hive] 没有当前元素可导航');
    return;
  }
  
  let newElement = null;
  
  if (direction === 'parent') {
    // 导航到父元素
    newElement = currentHoveredElement.parentElement;
    if (!newElement || newElement.tagName === 'BODY' || newElement.tagName === 'HTML') {
      console.warn('[Tab Hive] 已到达顶层元素');
      return;
    }
  } else if (direction === 'child') {
    // 导航到第一个非脚本/样式的子元素
    const children = Array.from(currentHoveredElement.children);
    newElement = children.find(child => 
      !['SCRIPT', 'STYLE', 'LINK', 'META'].includes(child.tagName)
    );
    if (!newElement) {
      console.warn('[Tab Hive] 没有可用的子元素');
      return;
    }
  }
  
  if (newElement) {
    currentHoveredElement = newElement;
    const selector = generateCssSelector(newElement);
    const rect = newElement.getBoundingClientRect();
    const elementInfo = getElementInfo(newElement);
    
    console.log('[Tab Hive] 导航到新元素:', selector);
    
    // 更新高亮位置
    const scrollLeft = document.documentElement.scrollLeft || document.body.scrollLeft;
    const scrollTop = document.documentElement.scrollTop || document.body.scrollTop;
    
    if (selectorHighlight) {
      selectorHighlight.style.top = (rect.top + scrollTop) + 'px';
      selectorHighlight.style.left = (rect.left + scrollLeft) + 'px';
      selectorHighlight.style.width = rect.width + 'px';
      selectorHighlight.style.height = rect.height + 'px';
      selectorHighlight.style.display = 'block';
    }
    
    // 发送更新到父页面
    try {
      window.parent.postMessage({
        source: 'tab-hive-extension',
        action: 'elementHovered',
        selector: selector,
        rect: {
          x: rect.left,
          y: rect.top,
          width: rect.width,
          height: rect.height
        },
        elementInfo: elementInfo
      }, '*');
    } catch (error) {
      console.error('[Tab Hive] 发送导航消息失败:', error);
    }
  }
}

