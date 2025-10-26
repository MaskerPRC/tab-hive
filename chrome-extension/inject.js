/**
 * Tab Hive - 反检测注入脚本
 * 此脚本在页面上下文中运行，用于绕过iframe检测
 */

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

