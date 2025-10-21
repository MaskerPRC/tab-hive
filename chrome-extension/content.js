/**
 * Tab Hive - Chrome Extension Content Script
 * 在每个页面中运行，监听来自Tab Hive应用的消息
 */

console.log('[Tab Hive Extension] Content script loaded');

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
        applyTabHiveSelectorInIframe(message.selector)
      } catch (error) {
        console.error('[Tab Hive Extension] 选择器应用失败:', error)
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
    }
  }
});

// 向页面注入一个标记，表示扩展已加载
window.postMessage({
  source: 'tab-hive-extension',
  action: 'extensionLoaded'
}, '*');

/**
 * 在iframe中应用选择器（隐藏其他元素，目标元素填满）
 */
function applyTabHiveSelectorInIframe(selector) {
  try {
    console.log('[Tab Hive iframe] 应用选择器:', selector);
    
    const targetElement = document.querySelector(selector);
    
    if (!targetElement) {
      console.warn('[Tab Hive iframe] 未找到选择器:', selector);
      return;
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
    
    console.log('[Tab Hive iframe] 选择器已应用');
  } catch (error) {
    console.error('[Tab Hive iframe] 错误:', error);
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

