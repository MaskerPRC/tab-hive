/**
 * Tab Hive - Chrome Extension Background Script
 * 处理来自网页的消息，控制选择器全屏功能
 */

// 监听来自content script的消息
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('[Tab Hive Extension] 收到消息:', request);

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
    console.error('[Tab Hive Extension] 应用选择器全屏失败:', error);
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
    console.error('[Tab Hive Extension] 恢复原始样式失败:', error);
    sendResponse({ success: false, error: error.message });
  }
}

/**
 * 在页面中应用选择器全屏（此函数将被注入到页面中执行）
 */
function applySelectorFullscreenInPage(selector) {
  try {
    const targetElement = document.querySelector(selector);
    
    if (!targetElement) {
      console.error('[Tab Hive] 未找到选择器对应的元素:', selector);
      return { success: false, error: '未找到选择器对应的元素' };
    }

    // 保存原始样式
    if (!window.__tabHiveOriginalStyles) {
      window.__tabHiveOriginalStyles = {
        body: {
          overflow: document.body.style.overflow,
          margin: document.body.style.margin,
          padding: document.body.style.padding,
          backgroundColor: document.body.style.backgroundColor
        },
        html: {
          overflow: document.documentElement.style.overflow
        },
        target: {
          position: targetElement.style.position,
          top: targetElement.style.top,
          left: targetElement.style.left,
          width: targetElement.style.width,
          height: targetElement.style.height,
          zIndex: targetElement.style.zIndex,
          margin: targetElement.style.margin,
          padding: targetElement.style.padding
        },
        hiddenElements: []
      };
    }

    // 隐藏其他元素
    document.querySelectorAll('body > *').forEach(el => {
      if (!el.contains(targetElement) && el !== targetElement) {
        if (el.style.display !== 'none') {
          window.__tabHiveOriginalStyles.hiddenElements.push({
            element: el,
            display: el.style.display
          });
          el.style.display = 'none';
        }
      }
    });

    // 将目标元素全屏化
    document.documentElement.style.overflow = 'hidden';
    document.body.style.overflow = 'hidden';
    document.body.style.margin = '0';
    document.body.style.padding = '0';
    document.body.style.backgroundColor = '#000';
    
    targetElement.style.position = 'fixed';
    targetElement.style.top = '0';
    targetElement.style.left = '0';
    targetElement.style.width = '100vw';
    targetElement.style.height = '100vh';
    targetElement.style.zIndex = '999999';
    targetElement.style.margin = '0';
    targetElement.style.padding = '0';

    console.log('[Tab Hive] 选择器全屏已应用:', selector);
    return { success: true };
  } catch (error) {
    console.error('[Tab Hive] 应用选择器全屏时出错:', error);
    return { success: false, error: error.message };
  }
}

/**
 * 在页面中恢复原始样式（此函数将被注入到页面中执行）
 */
function restoreOriginalStylesInPage() {
  try {
    if (!window.__tabHiveOriginalStyles) {
      return { success: true, message: '没有需要恢复的样式' };
    }

    const styles = window.__tabHiveOriginalStyles;

    // 恢复html和body样式
    document.documentElement.style.overflow = styles.html.overflow;
    document.body.style.overflow = styles.body.overflow;
    document.body.style.margin = styles.body.margin;
    document.body.style.padding = styles.body.padding;
    document.body.style.backgroundColor = styles.body.backgroundColor;

    // 显示所有之前隐藏的元素
    styles.hiddenElements.forEach(({ element, display }) => {
      element.style.display = display;
    });

    // 恢复目标元素样式
    const targetElement = document.querySelector('[style*="position: fixed"]');
    if (targetElement) {
      targetElement.style.position = styles.target.position;
      targetElement.style.top = styles.target.top;
      targetElement.style.left = styles.target.left;
      targetElement.style.width = styles.target.width;
      targetElement.style.height = styles.target.height;
      targetElement.style.zIndex = styles.target.zIndex;
      targetElement.style.margin = styles.target.margin;
      targetElement.style.padding = styles.target.padding;
    }

    delete window.__tabHiveOriginalStyles;

    console.log('[Tab Hive] 原始样式已恢复');
    return { success: true };
  } catch (error) {
    console.error('[Tab Hive] 恢复原始样式时出错:', error);
    return { success: false, error: error.message };
  }
}

// 扩展安装时的处理
chrome.runtime.onInstalled.addListener(() => {
  console.log('[Tab Hive Extension] 扩展已安装/更新');
});

