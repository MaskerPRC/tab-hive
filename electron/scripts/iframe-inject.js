// Iframe Injection Script - 在iframe中注入反检测和元素选择器功能
(function() {
  console.log('[Tab Hive iframe] ========== 注入脚本开始 ==========');
  console.log('[Tab Hive iframe] 当前URL:', window.location.href);

  // 防止重复注入
  if (window.__tabHiveInjected) {
    console.log('[Tab Hive iframe] ⚠️ 已经注入过，跳过');
    return;
  }
  window.__tabHiveInjected = true;
  console.log('[Tab Hive iframe] 标记为已注入');

  // ⚠️ 重要：在反检测脚本执行之前保存原始的window.parent引用
  // 这样元素选择器可以使用它来发送消息到真正的父页面
  const __originalParent = window.parent;
  console.log('[Tab Hive iframe] 已保存原始window.parent引用');

  // ===========================================
  // iframe反检测 - 让网站认为不在iframe中
  // ===========================================

  console.log('[Tab Hive Anti-Detection] 步骤1: 开始应用反检测措施');
  console.log('[Tab Hive Anti-Detection] ⚠️⚠️⚠️ 临时完全禁用反检测，用于测试是否导致卡死');

  // 方法1: 覆盖 window.top
  console.log('[Tab Hive Anti-Detection] 步骤2: 尝试覆盖window.top...');
  try {
    Object.defineProperty(window, 'top', {
      get: function() {
        return window.self;
      },
      configurable: false
    });
    console.log('[Tab Hive Anti-Detection] ✓ window.top 已重定向');
  } catch (e) {
    console.log('[Tab Hive Anti-Detection] ✗ window.top 覆盖失败:', e.message);
  }

  // 方法2: 覆盖 window.parent
  console.log('[Tab Hive Anti-Detection] 步骤3: 尝试覆盖window.parent...');
  try {
    Object.defineProperty(window, 'parent', {
      get: function() {
        return null;
      },
      configurable: false
    });
    console.log('[Tab Hive Anti-Detection] ✓ window.parent 已重定向');
  } catch (e) {
    console.log('[Tab Hive Anti-Detection] ✗ window.parent 覆盖失败:', e.message);
  }

  // 方法3: 覆盖 window.frameElement
  console.log('[Tab Hive Anti-Detection] 步骤4: 尝试覆盖window.frameElement...');
  try {
    Object.defineProperty(window, 'frameElement', {
      get: function() {
        return null;
      },
      configurable: false
    });
    console.log('[Tab Hive Anti-Detection] ✓ window.frameElement 已设置为 null');
  } catch (e) {
    console.log('[Tab Hive Anti-Detection] ✗ window.frameElement 覆盖失败:', e.message);
  }

  // 方法4: 伪造 window.location.ancestorOrigins
  console.log('[Tab Hive Anti-Detection] 步骤5: 尝试伪造ancestorOrigins...');
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
      console.log('[Tab Hive Anti-Detection] ✓ ancestorOrigins 已伪造');
    } else {
      console.log('[Tab Hive Anti-Detection] - ancestorOrigins不存在，跳过');
    }
  } catch (e) {
    console.log('[Tab Hive Anti-Detection] ✗ ancestorOrigins 覆盖失败:', e.message);
  }

  console.log('[Tab Hive Anti-Detection] 步骤6: 反检测措施已跳过（测试模式）');

  // ===========================================
  // window.open 拦截
  // ===========================================

  console.log('[Tab Hive iframe] 步骤7: 设置window.open拦截...');

  // 保存原始的window.open
  const originalOpen = window.open;

  // 重写window.open
  window.open = function(url, target, features) {
    console.log('[Tab Hive iframe] window.open被调用:', url, target);

    // 如果是_blank或新窗口，改为在当前页面打开
    if (!target || target === '_blank' || target === '_new') {
      console.log('[Tab Hive iframe] 重定向到当前iframe:', url);
      window.location.href = url;
      return window;
    }

    // 其他情况也在当前页面打开
    window.location.href = url;
    return window;
  };

  console.log('[Tab Hive iframe] 步骤8: window.open拦截设置完成');

  // 添加 postMessage 监听器
  console.log('[Tab Hive iframe] 步骤9: 添加postMessage监听器...');

  let messageCount = 0;

  console.log('[Tab Hive iframe] 步骤10: 注册message事件监听器...');
  window.addEventListener('message', function(e) {
    const message = e.data;

    // 执行代码（旧的选择器功能）
    if (message && message.type === 'exec-code') {
      messageCount++;
      console.log('[Tab Hive iframe] 收到代码执行请求 #', messageCount, 'messageId:', message.messageId);
      console.log('[Tab Hive iframe] 代码长度:', message.code ? message.code.length : 0, 'bytes');

      try {
        console.log('[Tab Hive iframe] 开始执行代码...');
        const result = eval(message.code);
        console.log('[Tab Hive iframe] ✓ 代码执行成功，返回结果');

        __originalParent.postMessage({
          type: 'exec-result',
          messageId: message.messageId,
          result: { success: true, result: result }
        }, '*');
      } catch (error) {
        console.error('[Tab Hive iframe] ✗ 代码执行失败:', error);

        __originalParent.postMessage({
          type: 'exec-result',
          messageId: message.messageId,
          result: { success: false, error: error.message }
        }, '*');
      }
    }

    // 元素选择器消息（与Chrome扩展相同）
    if (message && message.source === 'tab-hive') {
      if (message.action === 'startElementSelector') {
        console.log('[Tab Hive iframe] 启动元素选择器');
        try {
          window.__startElementSelector();
          __originalParent.postMessage({
            source: 'tab-hive-electron',
            action: 'elementSelectorStarted',
            requestId: message.requestId,
            success: true
          }, '*');
        } catch (error) {
          console.error('[Tab Hive iframe] 启动选择器失败:', error);
          __originalParent.postMessage({
            source: 'tab-hive-electron',
            action: 'elementSelectorStarted',
            requestId: message.requestId,
            success: false,
            error: error.message
          }, '*');
        }
      } else if (message.action === 'stopElementSelector') {
        console.log('[Tab Hive iframe] 停止元素选择器');
        try {
          window.__stopElementSelector();
          __originalParent.postMessage({
            source: 'tab-hive-electron',
            action: 'elementSelectorStopped',
            requestId: message.requestId,
            success: true
          }, '*');
        } catch (error) {
          console.error('[Tab Hive iframe] 停止选择器失败:', error);
        }
      }
    }
  });

  console.log('[Tab Hive iframe] 步骤11: message监听器注册完成');

  // 修改所有target="_blank"的链接（异步批处理）
  console.log('[Tab Hive iframe] 步骤12: 准备设置链接修改功能...');
  let modifyLinksTimeout = null;
  let modifyLinksCount = 0;
  let isModifying = false;
  let mutationObserver = null; // 保存observer引用

  const modifyLinks = () => {
    // 如果正在修改，跳过
    if (isModifying) {
      console.log('[Tab Hive iframe] 跳过：正在修改中');
      return;
    }

    // 清除之前的定时器，实现节流
    if (modifyLinksTimeout) {
      clearTimeout(modifyLinksTimeout);
    }

    // 延迟执行，避免阻塞
    modifyLinksTimeout = setTimeout(() => {
      if (isModifying) return;
      isModifying = true;

      try {
        const links = document.querySelectorAll('a[target="_blank"]');
        if (links.length > 0) {
          modifyLinksCount++;
          console.log('[Tab Hive iframe] 准备修改', links.length, '个链接 (第', modifyLinksCount, '次)');

          // 🔥 关键：在修改前断开MutationObserver，避免触发大量回调
          if (mutationObserver) {
            console.log('[Tab Hive iframe] 临时断开MutationObserver');
            mutationObserver.disconnect();
          }

          // 一次性修改所有链接（不再分批，因为已经断开observer）
          console.log('[Tab Hive iframe] 开始批量修改...');
          for (let i = 0; i < links.length; i++) {
            links[i].setAttribute('target', '_self');
          }
          console.log('[Tab Hive iframe] ✓ 修改完成，共', links.length, '个链接');

          // 🔥 关键：修改完成后重新连接MutationObserver
          if (mutationObserver && document.body) {
            console.log('[Tab Hive iframe] 重新连接MutationObserver');
            mutationObserver.observe(document.body, {
              childList: true,
              subtree: true,
              attributes: true,
              attributeFilter: ['target']
            });
          }

          isModifying = false;
        } else {
          isModifying = false;
        }
      } catch (e) {
        console.error('[Tab Hive iframe] 修改链接失败:', e.message);

        // 出错时也要重新连接observer
        if (mutationObserver && document.body) {
          console.log('[Tab Hive iframe] 错误恢复：重新连接MutationObserver');
          try {
            mutationObserver.observe(document.body, {
              childList: true,
              subtree: true,
              attributes: true,
              attributeFilter: ['target']
            });
          } catch (err) {
            console.error('[Tab Hive iframe] 重新连接失败:', err.message);
          }
        }

        isModifying = false;
      }
      modifyLinksTimeout = null;
    }, 200); // 200ms延迟，给页面喘息时间
  };

  // 延迟初始化，不阻塞注入
  console.log('[Tab Hive iframe] 步骤13: 链接修改功能定义完成');
  console.log('[Tab Hive iframe] ⚠️ 临时禁用链接修改功能，用于测试是否是卡死原因');
  setTimeout(() => {
    console.log('[Tab Hive iframe] 步骤14: 开始初始化链接修改');
    modifyLinks();
  }, 200);

  // 监听DOM变化（带保护）
  console.log('[Tab Hive iframe] 步骤15: 检查document.body是否存在...');
  console.log('[Tab Hive iframe] ⚠️ 临时禁用MutationObserver，用于测试');
  if (document.body) {
    console.log('[Tab Hive iframe] 步骤16: document.body存在，设置MutationObserver');

    // 使用防抖，减少触发频率
    let mutationTimeout = null;
    mutationObserver = new MutationObserver(() => {
      if (mutationTimeout) {
        clearTimeout(mutationTimeout);
      }
      mutationTimeout = setTimeout(() => {
        console.log('[Tab Hive iframe] MutationObserver触发，调用modifyLinks');
        modifyLinks();
      }, 1000); // 增加到1000ms防抖，进一步降低触发频率
    });

    console.log('[Tab Hive iframe] 步骤17: 调用observer.observe()...');
    mutationObserver.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['target']
    });
    console.log('[Tab Hive iframe] 步骤18: MutationObserver已启动');
  } else {
    console.warn('[Tab Hive iframe] 步骤16-skip: document.body不存在，跳过MutationObserver');
  }

  console.log('[Tab Hive iframe] 步骤19: 链接修改设置完成');

  // ===========================================
  // 元素选择器功能（与Chrome扩展相同）
  // ===========================================

  console.log('[Tab Hive iframe] 步骤20: 定义元素选择器功能...');

  let selectorOverlay = null;
  let selectorHighlight = null;
  let currentHoveredElement = null;

  // 生成CSS选择器
  function generateCssSelector(element) {
    try {
      if (element.id) return '#' + element.id;
      if (element.className && typeof element.className === 'string') {
        const classes = element.className.trim().split(/\s+/).filter(c => c && !c.startsWith('tabhive-'));
        if (classes.length > 0) return element.tagName.toLowerCase() + '.' + classes[0];
      }
      const parent = element.parentElement;
      if (parent) {
        const siblings = Array.from(parent.children);
        const index = siblings.indexOf(element) + 1;
        return parent.tagName.toLowerCase() + ' > ' + element.tagName.toLowerCase() + ':nth-child(' + index + ')';
      }
      return element.tagName.toLowerCase();
    } catch (error) {
      return element.tagName.toLowerCase();
    }
  }

  // 启动元素选择器
  window.__startElementSelector = function() {
    console.log('[Tab Hive iframe] ========== 启动元素选择器 ==========');

    try {
      // 注入样式
      const styleId = 'tabhive-element-selector-styles';
      console.log('[Tab Hive iframe] 检查样式是否已存在...');

      if (!document.getElementById(styleId)) {
        console.log('[Tab Hive iframe] 创建选择器样式...');
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
      `;
        document.head.appendChild(style);
        console.log('[Tab Hive iframe] ✓ 选择器样式已注入');
      } else {
        console.log('[Tab Hive iframe] 样式已存在，跳过');
      }

      // 创建覆盖层
      console.log('[Tab Hive iframe] 创建覆盖层...');
      selectorOverlay = document.createElement('div');
      selectorOverlay.className = 'tabhive-selector-overlay';
      document.body.appendChild(selectorOverlay);
      console.log('[Tab Hive iframe] ✓ 覆盖层已添加');

      // 创建高亮元素
      console.log('[Tab Hive iframe] 创建高亮元素...');
      selectorHighlight = document.createElement('div');
      selectorHighlight.className = 'tabhive-element-highlight';
      selectorHighlight.style.display = 'none';
      document.body.appendChild(selectorHighlight);
      console.log('[Tab Hive iframe] ✓ 高亮元素已添加');

    // 鼠标悬停处理（带节流）
    let lastHoverTime = 0;
    const handleMouseOver = function(event) {
      const element = event.target;
      if (element === selectorOverlay || element === selectorHighlight ||
          element.classList.contains('tabhive-selector-overlay') ||
          element.classList.contains('tabhive-element-highlight')) return;
      if (element.tagName === 'HTML' || element.tagName === 'BODY') return;

      // 节流：最多每50ms处理一次
      const now = Date.now();
      if (now - lastHoverTime < 50) return;
      lastHoverTime = now;

      currentHoveredElement = element;
      const selector = generateCssSelector(element);
      const rect = element.getBoundingClientRect();
      const scrollLeft = document.documentElement.scrollLeft || document.body.scrollLeft;
      const scrollTop = document.documentElement.scrollTop || document.body.scrollTop;

      selectorHighlight.style.top = (rect.top + scrollTop) + 'px';
      selectorHighlight.style.left = (rect.left + scrollLeft) + 'px';
      selectorHighlight.style.width = rect.width + 'px';
      selectorHighlight.style.height = rect.height + 'px';
      selectorHighlight.style.display = 'block';

      // console.log('[Tab Hive iframe] 鼠标悬停:', element.tagName, selector);

      __originalParent.postMessage({
        source: 'tab-hive-electron',
        action: 'elementHovered',
        selector: selector
      }, '*');

      event.stopPropagation();
    };

    // 点击处理
    const handleClick = function(event) {
      event.preventDefault();
      event.stopPropagation();

      console.log('[Tab Hive iframe] 点击事件触发，当前悬停元素:', currentHoveredElement);

      if (currentHoveredElement) {
        const selector = generateCssSelector(currentHoveredElement);
        console.log('[Tab Hive iframe] 选中元素，选择器:', selector);

        __originalParent.postMessage({
          source: 'tab-hive-electron',
          action: 'elementSelected',
          selector: selector
        }, '*');
        console.log('[Tab Hive iframe] 已发送elementSelected消息到父页面');

        window.__stopElementSelector();
      } else {
        console.warn('[Tab Hive iframe] 点击时没有悬停的元素，忽略点击');
      }
    };

    // ESC键处理
    const handleKeyDown = function(event) {
      if (event.key === 'Escape') {
        event.preventDefault();
        event.stopPropagation();
        __originalParent.postMessage({
          source: 'tab-hive-electron',
          action: 'elementSelectorCancelled'
        }, '*');
        window.__stopElementSelector();
      }
    };

      // 添加事件监听
      console.log('[Tab Hive iframe] 添加事件监听器...');
      document.addEventListener('mouseover', handleMouseOver, {capture: true, passive: true});
      document.addEventListener('click', handleClick, {capture: true});
      document.addEventListener('keydown', handleKeyDown, {capture: true});
      console.log('[Tab Hive iframe] ✓ 事件监听器已添加');

      // 保存处理器引用以便后续移除
      window.__selectorHandlers = { handleMouseOver, handleClick, handleKeyDown };

      console.log('[Tab Hive iframe] ========== 元素选择器启动完成 ==========');
    } catch (error) {
      console.error('[Tab Hive iframe] ✗ 启动元素选择器失败:', error);
      console.error('[Tab Hive iframe] 错误堆栈:', error.stack);
      throw error;
    }
  };

  // 停止元素选择器
  window.__stopElementSelector = function() {
    console.log('[Tab Hive iframe] ========== 停止元素选择器 ==========');

    try {
      // 移除事件监听器
      if (window.__selectorHandlers) {
        console.log('[Tab Hive iframe] 移除事件监听器...');
        const {handleMouseOver, handleClick, handleKeyDown} = window.__selectorHandlers;
        document.removeEventListener('mouseover', handleMouseOver, {capture: true, passive: true});
        document.removeEventListener('click', handleClick, {capture: true});
        document.removeEventListener('keydown', handleKeyDown, {capture: true});
        window.__selectorHandlers = null;
        console.log('[Tab Hive iframe] ✓ 事件监听器已移除');
      }

      // 隐藏并移除高亮
      console.log('[Tab Hive iframe] 移除高亮元素...');
      if (selectorHighlight) {
        selectorHighlight.style.display = 'none';
        if (selectorHighlight.parentNode) selectorHighlight.parentNode.removeChild(selectorHighlight);
      }
      if (selectorOverlay && selectorOverlay.parentNode) selectorOverlay.parentNode.removeChild(selectorOverlay);
      console.log('[Tab Hive iframe] ✓ 高亮元素已移除');

      // 移除样式
      console.log('[Tab Hive iframe] 移除样式...');
      const style = document.getElementById('tabhive-element-selector-styles');
      if (style && style.parentNode) style.parentNode.removeChild(style);
      console.log('[Tab Hive iframe] ✓ 样式已移除');

      selectorOverlay = null;
      selectorHighlight = null;
      currentHoveredElement = null;

      console.log('[Tab Hive iframe] ========== 元素选择器停止完成 ==========');
    } catch (error) {
      console.error('[Tab Hive iframe] ✗ 停止元素选择器时出错:', error);
      console.error('[Tab Hive iframe] 错误堆栈:', error.stack);
    }
  };

  console.log('[Tab Hive iframe] 步骤21: 元素选择器功能定义完成');

  console.log('[Tab Hive iframe] ========== 代码注入完成 ✓ ==========');

  // 添加心跳日志，确认iframe脚本在正常运行
  console.log('[Tab Hive iframe] 步骤22: 设置心跳定时器...');
  let iframeHeartbeat = 0;

  // 立即输出第一次心跳
  console.log('[Tab Hive iframe] ❤️ iframe心跳 0 - 初始化');

  const heartbeatInterval = setInterval(() => {
    iframeHeartbeat++;
    console.log('[Tab Hive iframe] ❤️ iframe心跳', iframeHeartbeat, '- iframe脚本运行正常，时间:', new Date().toLocaleTimeString());

    if (iframeHeartbeat >= 10) {
      console.log('[Tab Hive iframe] iframe心跳日志已达到10次，停止输出');
      clearInterval(heartbeatInterval);
    }
  }, 2000);

  console.log('[Tab Hive iframe] 步骤23: 心跳定时器已设置');
  console.log('[Tab Hive iframe] 🎉 所有初始化步骤完成！');
  console.log('[Tab Hive iframe] 🎉 当前时间:', new Date().toLocaleTimeString());
})();

