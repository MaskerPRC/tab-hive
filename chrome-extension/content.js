/**
 * Tab Hive - Chrome Extension Content Script
 * 在每个页面中运行，监听来自Tab Hive应用的消息
 */

console.log('[Tab Hive Extension] Content script loaded');

// 监听来自页面的消息（通过window.postMessage）
window.addEventListener('message', async (event) => {
  // 只处理来自同源的消息
  if (event.source !== window) return;

  const message = event.data;

  // 检查是否是Tab Hive的消息
  if (message && message.source === 'tab-hive') {
    console.log('[Tab Hive Extension] 收到来自Tab Hive的消息:', message);

    if (message.action === 'applySelectorFullscreen') {
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

