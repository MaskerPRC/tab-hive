/**
 * Tab Hive - Chrome Extension Content Script
 * 在每个页面中运行，监听来自Tab Hive应用的消息
 * 并注入反检测脚本以解决iframe显示问题
 */

console.log('[Tab Hive Extension] Content script loaded');

// ===========================================
// iframe反检测 - 覆盖JavaScript检测
// ===========================================

// 必须在页面脚本执行之前注入，因此使用立即执行
(function() {
  try {
    // 注入脚本到页面上下文中（绕过Content Script的隔离）
    const script = document.createElement('script');
    script.textContent = `
      (function() {
        'use strict';
        
        console.log('[Tab Hive Anti-Detection] 反检测脚本已注入');
        
        // 方法1: 尝试覆盖 window.top (某些情况下可能不可写)
        try {
          Object.defineProperty(window, 'top', {
            get: function() {
              return window.self;
            },
            configurable: false
          });
          console.log('[Tab Hive Anti-Detection] window.top 已重定向到 window.self');
        } catch (e) {
          console.log('[Tab Hive Anti-Detection] 无法覆盖 window.top:', e.message);
        }
        
        // 方法2: 覆盖 window.parent
        try {
          Object.defineProperty(window, 'parent', {
            get: function() {
              return window.self;
            },
            configurable: false
          });
          console.log('[Tab Hive Anti-Detection] window.parent 已重定向到 window.self');
        } catch (e) {
          console.log('[Tab Hive Anti-Detection] 无法覆盖 window.parent:', e.message);
        }
        
        // 方法3: 覆盖 window.frameElement
        try {
          Object.defineProperty(window, 'frameElement', {
            get: function() {
              return null;
            },
            configurable: false
          });
          console.log('[Tab Hive Anti-Detection] window.frameElement 已设置为 null');
        } catch (e) {
          console.log('[Tab Hive Anti-Detection] 无法覆盖 window.frameElement:', e.message);
        }
        
        // 方法4: 拦截常见的iframe检测函数
        const originalAddEventListener = window.addEventListener;
        window.addEventListener = function(type, listener, options) {
          // 阻止某些可能用于检测iframe的事件监听
          if (type === 'blur' || type === 'focus') {
            console.log('[Tab Hive Anti-Detection] 拦截了可能的检测事件:', type);
            // 可以选择不添加监听器，或者添加一个伪造的
            return;
          }
          return originalAddEventListener.call(this, type, listener, options);
        };
        
        // 方法5: 伪造 window.location.ancestorOrigins
        try {
          if (window.location.ancestorOrigins) {
            Object.defineProperty(window.location, 'ancestorOrigins', {
              get: function() {
                return {
                  length: 0,
                  item: function() { return null; },
                  contains: function() { return false; }
                };
              }
            });
            console.log('[Tab Hive Anti-Detection] window.location.ancestorOrigins 已伪造');
          }
        } catch (e) {
          console.log('[Tab Hive Anti-Detection] 无法覆盖 ancestorOrigins:', e.message);
        }
        
        console.log('[Tab Hive Anti-Detection] 反检测措施已全部应用');
      })();
    `;
    
    // 尽早插入脚本
    (document.head || document.documentElement).appendChild(script);
    script.remove(); // 插入后移除script标签，但代码已执行
    
    console.log('[Tab Hive Extension] iframe反检测脚本已注入');
  } catch (error) {
    console.error('[Tab Hive Extension] 注入反检测脚本失败:', error);
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

