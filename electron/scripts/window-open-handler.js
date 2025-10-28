// Window Open Handler - 拦截新窗口打开，在iframe中导航
(function() {
  console.log('[Window-Open-Handler] ========== 开始处理窗口打开 ==========');

  const urlToOpen = 'URL_TO_OPEN';
  console.log('[Window-Open-Handler] 目标URL:', urlToOpen);

  try {
    // 查找最近获得焦点的iframe
    const activeElement = document.activeElement;
    console.log('[Window-Open-Handler] 当前活动元素:', activeElement ? activeElement.tagName : 'null');

    if (activeElement && activeElement.tagName === 'IFRAME') {
      console.log('[Window-Open-Handler] 找到活动iframe');
      const iframeId = activeElement.getAttribute('data-iframe-id');
      console.log('[Window-Open-Handler] iframe ID:', iframeId);

      try {
        activeElement.contentWindow.location.href = urlToOpen;
        console.log('[Window-Open-Handler] ✓ 在活动iframe中导航成功');
        return true;
      } catch (e) {
        console.error('[Window-Open-Handler] ✗ 导航失败:', e.message);
      }
    } else {
      console.log('[Window-Open-Handler] 活动元素不是iframe');
    }

    // 如果没有找到活动iframe，尝试在最后一个iframe中打开
    const iframes = document.querySelectorAll('iframe');
    console.log('[Window-Open-Handler] 页面共有', iframes.length, '个iframe');

    if (iframes.length > 0) {
      const lastIframe = iframes[iframes.length - 1];
      const lastIframeId = lastIframe.getAttribute('data-iframe-id');
      console.log('[Window-Open-Handler] 尝试在最后一个iframe中导航，ID:', lastIframeId);

      try {
        lastIframe.contentWindow.location.href = urlToOpen;
        console.log('[Window-Open-Handler] ✓ 在最后一个iframe中导航成功');
        return true;
      } catch (e) {
        console.error('[Window-Open-Handler] ✗ 导航失败:', e.message);
      }
    }

    console.warn('[Window-Open-Handler] ✗ 未找到可用iframe');
    return false;
  } catch (error) {
    console.error('[Window-Open-Handler] ✗ 处理失败:', error.message);
    console.error('[Window-Open-Handler] 错误堆栈:', error.stack);
    return false;
  }
})();

