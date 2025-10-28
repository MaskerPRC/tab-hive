// Execute in Iframe - 通过postMessage在iframe中执行代码
(function() {
  console.log('[Execute-in-iframe] ========== 开始执行 ==========');

  return new Promise((resolve) => {
    try {
      const iframeId = 'IFRAME_ID';
      console.log('[Execute-in-iframe] 目标iframe ID:', iframeId);

      // 查找所有iframe
      const allIframes = document.querySelectorAll('iframe');
      console.log('[Execute-in-iframe] 页面共有', allIframes.length, '个iframe');

      // 查找目标iframe
      const iframe = document.querySelector('iframe[data-iframe-id="' + iframeId + '"]');

      if (!iframe) {
        console.error('[Execute-in-iframe] ✗ 未找到目标iframe');
        console.error('[Execute-in-iframe] 可用的iframe IDs:');
        allIframes.forEach((f, i) => {
          console.log('[Execute-in-iframe]  ', i, ':', f.getAttribute('data-iframe-id'));
        });
        resolve({ success: false, error: 'Iframe not found' });
        return;
      }

      console.log('[Execute-in-iframe] ✓ 找到目标iframe');

      if (!iframe.contentWindow) {
        console.error('[Execute-in-iframe] ✗ iframe.contentWindow不可用');
        resolve({ success: false, error: 'Iframe contentWindow not available' });
        return;
      }

      console.log('[Execute-in-iframe] ✓ contentWindow可用');
      console.log('[Execute-in-iframe] 准备通过postMessage发送代码...');

      // 使用 postMessage 与 iframe 通信
      const messageId = 'exec-' + Date.now() + '-' + Math.random();
      console.log('[Execute-in-iframe] 生成messageId:', messageId);

      let isResolved = false;

      const handleMessage = (e) => {
        console.log('[Execute-in-iframe] 收到postMessage:', e.data ? e.data.type : 'undefined');

        if (e.data && e.data.type === 'exec-result' && e.data.messageId === messageId) {
          console.log('[Execute-in-iframe] ✓ 收到匹配的响应');
          if (!isResolved) {
            isResolved = true;
            window.removeEventListener('message', handleMessage);
            console.log('[Execute-in-iframe] 结果:', e.data.result);
            resolve(e.data.result);
          }
        }
      };

      console.log('[Execute-in-iframe] 添加message监听器...');
      window.addEventListener('message', handleMessage);

      // 5秒超时
      const timeoutId = setTimeout(() => {
        console.error('[Execute-in-iframe] ✗ 执行超时 (5秒)');
        if (!isResolved) {
          isResolved = true;
          window.removeEventListener('message', handleMessage);
          resolve({ success: false, error: 'Execution timeout after 5 seconds' });
        }
      }, 5000);

      // 发送执行请求
      console.log('[Execute-in-iframe] 发送exec-code消息到iframe...');
      iframe.contentWindow.postMessage({
        type: 'exec-code',
        messageId: messageId,
        code: `CODE_TO_EXECUTE`
      }, '*');
      console.log('[Execute-in-iframe] ✓ 消息已发送，等待响应...');

    } catch (e) {
      console.error('[Execute-in-iframe] ✗ 执行失败:', e.message);
      console.error('[Execute-in-iframe] 错误堆栈:', e.stack);
      resolve({ success: false, error: e.message });
    }
  });
})()

