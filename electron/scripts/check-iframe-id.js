// Check Iframe ID - 检查frame是否为目标iframe
(function() {
  try {
    if (window.frameElement) {
      const id = window.frameElement.getAttribute('data-iframe-id');
      console.log('[Check-iframe-id] 找到iframe ID:', id);
      return id;
    }
    console.log('[Check-iframe-id] 不在iframe中或frameElement不可用');
    return null;
  } catch (e) {
    console.error('[Check-iframe-id] 检查失败:', e.message);
    return null;
  }
})()

