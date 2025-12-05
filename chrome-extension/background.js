/**
 * 全视界 - Chrome Extension Background Script
 * 处理来自网页的消息，控制选择器全屏功能
 * 并拦截HTTP响应头以解决iframe检测问题
 */

// ===========================================
// HTTP响应头拦截 - 解决iframe检测问题
// ===========================================

// 使用declarativeNetRequest API拦截并修改响应头
chrome.declarativeNetRequest.updateDynamicRules({
  removeRuleIds: [1], // 先移除可能存在的旧规则
  addRules: [
    {
      id: 1,
      priority: 1,
      action: {
        type: 'modifyHeaders',
        responseHeaders: [
          // 移除 X-Frame-Options 头
          { header: 'X-Frame-Options', operation: 'remove' },
          { header: 'x-frame-options', operation: 'remove' },
          // 移除 Content-Security-Policy 中的 frame-ancestors
          { header: 'Content-Security-Policy', operation: 'remove' },
          { header: 'content-security-policy', operation: 'remove' }
        ]
      },
      condition: {
        urlFilter: '*',
        resourceTypes: ['main_frame', 'sub_frame']
      }
    }
  ]
}).catch(err => {
  console.log('[全视界 Extension] 无法设置响应头拦截规则 (这在某些浏览器版本中是正常的):', err);
});

console.log('[全视界 Extension] HTTP响应头拦截已启用');

// ===========================================
// 消息处理
// ===========================================

// 监听来自content script的消息
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('[全视界 Extension] 收到消息:', request);

  if (request.action === 'applySelectorFullscreen') {
    // 应用选择器全屏
    handleApplySelectorFullscreen(request, sender, sendResponse);
    return true; // 保持消息通道开启以支持异步响应
  } else if (request.action === 'restoreOriginalStyles') {
    // 恢复原始样式
    handleRestoreOriginalStyles(request, sender, sendResponse);
    return true;
  }
});

/**
 * 处理应用选择器全屏
 */
async function handleApplySelectorFullscreen(request, sender, sendResponse) {
  const { selector, frameId } = request;

  try {
    // 在指定的frame中执行脚本
    const result = await chrome.scripting.executeScript({
      target: { 
        tabId: sender.tab.id,
        frameIds: frameId ? [frameId] : undefined
      },
      func: applySelectorFullscreenInPage,
      args: [selector]
    });

    sendResponse({ success: true, result: result[0]?.result });
  } catch (error) {
    console.error('[全视界 Extension] 应用选择器全屏失败:', error);
    sendResponse({ success: false, error: error.message });
  }
}

/**
 * 处理恢复原始样式
 */
async function handleRestoreOriginalStyles(request, sender, sendResponse) {
  try {
    const result = await chrome.scripting.executeScript({
      target: { 
        tabId: sender.tab.id,
        frameIds: request.frameId ? [request.frameId] : undefined
      },
      func: restoreOriginalStylesInPage
    });

    sendResponse({ success: true, result: result[0]?.result });
  } catch (error) {
    console.error('[全视界 Extension] 恢复原始样式失败:', error);
    sendResponse({ success: false, error: error.message });
  }
}

/**
 * 在页面中应用选择器全屏（此函数将被注入到页面中执行）
 */
function applySelectorFullscreenInPage(selector) {
  try {
    console.log('[全视界 iframe] 应用选择器:', selector);
    
    const targetElement = document.querySelector(selector);
    
    if (!targetElement) {
      console.warn('[全视界 iframe] 未找到选择器对应的元素:', selector);
      return { success: false, error: '未找到元素' };
    }
    
    // 输出调试信息
    console.log('[全视界 iframe] 目标元素信息:', {
      tagName: targetElement.tagName,
      className: targetElement.className,
      id: targetElement.id,
      width: targetElement.offsetWidth,
      height: targetElement.offsetHeight
    });
    
    // 遍历父元素链，隐藏每一层的兄弟元素
    let current = targetElement;
    let hiddenCount = 0;
    
    while (current && current !== document.body) {
      // 获取所有兄弟元素
      const parent = current.parentElement;
      if (parent) {
        Array.from(parent.children).forEach(sibling => {
          // 如果不是当前元素，且不是script/style/link，就隐藏
          if (sibling !== current && 
              !['SCRIPT', 'STYLE', 'LINK', 'META', 'TITLE'].includes(sibling.tagName)) {
            sibling.style.display = 'none';
            sibling.setAttribute('data-quanshijie-hidden', 'true');
            hiddenCount++;
          }
        });
      }
      current = parent;
    }
    
    console.log('[全视界 iframe] 已隐藏 ' + hiddenCount + ' 个兄弟元素');
    
    // 创建style标签，让目标元素填满
    const styleId = 'quanshijie-selector-style';
    
    // 移除旧的style
    const oldStyle = document.getElementById(styleId);
    if (oldStyle) {
      oldStyle.remove();
    }
    
    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = `
      /* 全视界 - 让选择器元素填满整个区域 */
      
      /* 重置body和html */
      html, body {
        margin: 0 !important;
        padding: 0 !important;
        overflow: hidden !important;
        width: 100% !important;
        height: 100% !important;
      }
      
      /* 目标元素：fixed定位，填满整个视口 */
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
      
      /* 确保子元素可见 */
      ${selector} * {
        visibility: visible !important;
      }
    `;
    
    document.head.appendChild(style);
    
    console.log('[全视界 iframe] 选择器全屏已应用');
    return { success: true };
  } catch (error) {
    console.error('[全视界 iframe] 错误:', error);
    return { success: false, error: error.message };
  }
}

/**
 * 在页面中恢复原始样式（此函数将被注入到页面中执行）
 */
function restoreOriginalStylesInPage() {
  try {
    // 移除注入的style标签
    const styleId = 'quanshijie-selector-style';
    const style = document.getElementById(styleId);
    if (style) {
      style.remove();
      console.log('[全视界 iframe] 样式已移除');
    }
    
    // 恢复所有被隐藏的兄弟元素
    const hiddenElements = document.querySelectorAll('[data-quanshijie-hidden]');
    let restoredCount = 0;
    hiddenElements.forEach(el => {
      el.style.display = '';
      el.removeAttribute('data-quanshijie-hidden');
      restoredCount++;
    });
    console.log('[全视界 iframe] 已恢复 ' + restoredCount + ' 个元素');
    
    console.log('[全视界 iframe] 原始样式已恢复');
    return { success: true };
  } catch (error) {
    console.error('[全视界 iframe] 恢复原始样式时出错:', error);
    return { success: false, error: error.message };
  }
}

// 扩展安装时的处理
chrome.runtime.onInstalled.addListener(() => {
  console.log('[全视界 Extension] 扩展已安装/更新');
});

