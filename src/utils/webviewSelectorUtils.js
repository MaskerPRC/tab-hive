/**
 * Webview 选择器工具函数
 * 提供在 webview 中执行的选择器相关功能
 */

/**
 * 应用选择器到页面
 * @param {string[]} selectors - CSS选择器数组
 * @param {string} styleId - 样式ID
 * @returns {Object} 执行结果
 */
export function applyWebviewSelector(selectors, styleId) {
  try {
    console.log('[Webview Selector] 应用多个选择器:', selectors);
    
    // 移除旧样式
    const oldStyle = document.getElementById(styleId);
    if (oldStyle) {
      oldStyle.remove();
    }
    
    // 查找所有目标元素
    const targetElements = [];
    selectors.forEach(selector => {
      const elements = document.querySelectorAll(selector);
      if (elements.length > 0) {
        targetElements.push(...Array.from(elements));
        console.log('[Webview Selector] 选择器', selector, '找到', elements.length, '个元素');
      } else {
        console.warn('[Webview Selector] 未找到选择器对应的元素:', selector);
      }
    });
    
    if (targetElements.length === 0) {
      console.warn('[Webview Selector] 所有选择器都未找到元素');
      return { success: false, error: '未找到任何元素' };
    }
    
    console.log('[Webview Selector] 共找到', targetElements.length, '个目标元素');
    
    const debugInfo = {
      targetCount: targetElements.length,
      targetDetails: targetElements.map(el => ({
        tagName: el.tagName,
        id: el.id,
        className: el.className,
        textContent: el.textContent?.substring(0, 100)
      }))
    };
    
    // 标记所有目标元素及其祖先和所有后代
    const markedElements = new Set();
    targetElements.forEach(element => {
      // 标记目标元素本身
      element.setAttribute('data-tabhive-keep', 'true');
      markedElements.add(element);
      
      // 标记所有祖先元素
      let current = element.parentElement;
      while (current && current !== document.body && current !== document.documentElement) {
        current.setAttribute('data-tabhive-keep', 'true');
        markedElements.add(current);
        current = current.parentElement;
      }
      
      // 标记所有后代元素
      function markDescendants(el) {
        Array.from(el.children).forEach(child => {
          child.setAttribute('data-tabhive-keep', 'true');
          markedElements.add(child);
          markDescendants(child);
        });
      }
      markDescendants(element);
    });
    
    debugInfo.markedCount = markedElements.size;
    
    // 隐藏所有未标记的元素
    let hiddenCount = 0;
    function hideNonTargetElements(element) {
      if (!element || !element.children) return;
      
      Array.from(element.children).forEach(child => {
        // 跳过脚本、样式等元素
        if (['SCRIPT', 'STYLE', 'LINK', 'META', 'TITLE', 'HEAD'].includes(child.tagName)) {
          return;
        }
        
        // 如果元素未被标记，隐藏它
        if (!child.hasAttribute('data-tabhive-keep')) {
          child.style.display = 'none';
          child.setAttribute('data-tabhive-hidden', 'true');
          hiddenCount++;
        } else {
          // 如果元素被标记，递归处理其子元素
          hideNonTargetElements(child);
        }
      });
    }
    
    hideNonTargetElements(document.body);
    debugInfo.hiddenCount = hiddenCount;
    
    // 检查目标元素是否仍然可见
    const visibleTargets = targetElements.filter(el => {
      const rect = el.getBoundingClientRect();
      const computedStyle = window.getComputedStyle(el);
      const isVisible = rect.width > 0 && rect.height > 0 && 
                       computedStyle.display !== 'none' &&
                       computedStyle.visibility !== 'hidden';
      return isVisible;
    });
    
    debugInfo.visibleCount = visibleTargets.length;
    debugInfo.visibilityDetails = targetElements.map(el => {
      const rect = el.getBoundingClientRect();
      const computedStyle = window.getComputedStyle(el);
      return {
        id: el.id,
        className: el.className,
        rect: { width: rect.width, height: rect.height },
        display: computedStyle.display,
        visibility: computedStyle.visibility,
        opacity: computedStyle.opacity,
        hasKeepAttr: el.hasAttribute('data-tabhive-keep')
      };
    });
    
    // 检查是否有目标元素的祖先被隐藏了
    const hiddenAncestors = [];
    targetElements.forEach(el => {
      let current = el.parentElement;
      let level = 0;
      while (current && current !== document.body && level < 10) {
        const isHidden = current.hasAttribute('data-tabhive-hidden') || 
                        window.getComputedStyle(current).display === 'none';
        if (isHidden) {
          hiddenAncestors.push({
            level,
            tagName: current.tagName,
            id: current.id,
            className: current.className,
            hasHiddenAttr: current.hasAttribute('data-tabhive-hidden'),
            display: window.getComputedStyle(current).display
          });
        }
        current = current.parentElement;
        level++;
      }
    });
    
    debugInfo.hiddenAncestors = hiddenAncestors;
    
    // 生成CSS样式（多个选择器合并）
    const combinedSelector = selectors.join(', ');
    const style = document.createElement('style');
    style.id = styleId;
    
    // 如果只有一个目标元素，应用单选择器样式（固定全屏）
    if (targetElements.length === 1) {
      style.textContent = `
        html, body {
          margin: 0 !important;
          padding: 0 !important;
          overflow: hidden !important;
          width: 100% !important;
          height: 100% !important;
        }
        
        ${combinedSelector} {
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
        
        ${combinedSelector} * {
          visibility: visible !important;
        }
      `;
    } else {
      // 多个目标元素，保持原有布局
      style.textContent = `
        html, body {
          margin: 0 !important;
          padding: 0 !important;
          overflow: auto !important;
          width: 100% !important;
          height: 100% !important;
        }
        
        ${combinedSelector} {
          display: block !important;
          visibility: visible !important;
        }
        
        ${combinedSelector} * {
          visibility: visible !important;
        }
      `;
    }
    
    document.head.appendChild(style);
    console.log('[Webview Selector] 选择器已应用,隐藏了', hiddenCount, '个元素');
    
    return { 
      success: true, 
      hiddenCount: hiddenCount, 
      targetCount: targetElements.length, 
      debugInfo: debugInfo 
    };
  } catch (e) {
    console.error('[Webview Selector] 错误:', e);
    return { success: false, error: e.message };
  }
}

/**
 * 恢复原始样式
 * @param {string} styleId - 样式ID
 * @returns {Object} 执行结果
 */
export function restoreWebviewStyles(styleId) {
  try {
    const style = document.getElementById(styleId);
    if (style) {
      style.remove();
    }
    
    // 恢复隐藏的元素
    const hiddenElements = document.querySelectorAll('[data-tabhive-hidden]');
    let restoredCount = 0;
    hiddenElements.forEach(el => {
      el.style.display = '';
      el.removeAttribute('data-tabhive-hidden');
      restoredCount++;
    });
    
    // 移除标记
    const markedElements = document.querySelectorAll('[data-tabhive-keep]');
    markedElements.forEach(el => {
      el.removeAttribute('data-tabhive-keep');
    });
    
    console.log('[Webview Selector] 已恢复', restoredCount, '个元素');
    return { success: true };
  } catch (e) {
    console.error('[Webview Selector] 恢复失败:', e);
    return { success: false, error: e.message };
  }
}

/**
 * 生成选择器应用的包装函数代码
 * @param {string[]} selectors - CSS选择器数组
 * @param {string} styleId - 样式ID
 * @returns {string} 可执行的JavaScript代码字符串
 */
export function generateSelectorCode(selectors, styleId) {
  // 将完整的函数代码作为字符串内联，避免打包后 toString() 失败
  return `
    (function() {
      const selectors = ${JSON.stringify(selectors)};
      const styleId = ${JSON.stringify(styleId)};
      
      // 内联 applyWebviewSelector 函数
      function applyWebviewSelector(selectors, styleId) {
        try {
          console.log('[Webview Selector] 应用多个选择器:', selectors);
          
          // 移除旧样式
          const oldStyle = document.getElementById(styleId);
          if (oldStyle) {
            oldStyle.remove();
          }
          
          // 查找所有目标元素
          const targetElements = [];
          selectors.forEach(selector => {
            const elements = document.querySelectorAll(selector);
            if (elements.length > 0) {
              targetElements.push(...Array.from(elements));
              console.log('[Webview Selector] 选择器', selector, '找到', elements.length, '个元素');
            } else {
              console.warn('[Webview Selector] 未找到选择器对应的元素:', selector);
            }
          });
          
          if (targetElements.length === 0) {
            console.warn('[Webview Selector] 所有选择器都未找到元素');
            return { success: false, error: '未找到任何元素' };
          }
          
          console.log('[Webview Selector] 共找到', targetElements.length, '个目标元素');
          
          const debugInfo = {
            targetCount: targetElements.length,
            targetDetails: targetElements.map(el => ({
              tagName: el.tagName,
              id: el.id,
              className: el.className,
              textContent: el.textContent?.substring(0, 100)
            }))
          };
          
          // 标记所有目标元素及其祖先和所有后代
          const markedElements = new Set();
          targetElements.forEach(element => {
            // 标记目标元素本身
            element.setAttribute('data-tabhive-keep', 'true');
            markedElements.add(element);
            
            // 标记所有祖先元素
            let current = element.parentElement;
            while (current && current !== document.body && current !== document.documentElement) {
              current.setAttribute('data-tabhive-keep', 'true');
              markedElements.add(current);
              current = current.parentElement;
            }
            
            // 标记所有后代元素
            function markDescendants(el) {
              Array.from(el.children).forEach(child => {
                child.setAttribute('data-tabhive-keep', 'true');
                markedElements.add(child);
                markDescendants(child);
              });
            }
            markDescendants(element);
          });
          
          debugInfo.markedCount = markedElements.size;
          
          // 隐藏所有未标记的元素
          let hiddenCount = 0;
          function hideNonTargetElements(element) {
            if (!element || !element.children) return;
            
            Array.from(element.children).forEach(child => {
              // 跳过脚本、样式等元素
              if (['SCRIPT', 'STYLE', 'LINK', 'META', 'TITLE', 'HEAD'].includes(child.tagName)) {
                return;
              }
              
              // 如果元素未被标记，隐藏它
              if (!child.hasAttribute('data-tabhive-keep')) {
                child.style.display = 'none';
                child.setAttribute('data-tabhive-hidden', 'true');
                hiddenCount++;
              } else {
                // 如果元素被标记，递归处理其子元素
                hideNonTargetElements(child);
              }
            });
          }
          
          hideNonTargetElements(document.body);
          debugInfo.hiddenCount = hiddenCount;
          
          // 检查目标元素是否仍然可见
          const visibleTargets = targetElements.filter(el => {
            const rect = el.getBoundingClientRect();
            const computedStyle = window.getComputedStyle(el);
            const isVisible = rect.width > 0 && rect.height > 0 && 
                             computedStyle.display !== 'none' &&
                             computedStyle.visibility !== 'hidden';
            return isVisible;
          });
          
          debugInfo.visibleCount = visibleTargets.length;
          debugInfo.visibilityDetails = targetElements.map(el => {
            const rect = el.getBoundingClientRect();
            const computedStyle = window.getComputedStyle(el);
            return {
              id: el.id,
              className: el.className,
              rect: { width: rect.width, height: rect.height },
              display: computedStyle.display,
              visibility: computedStyle.visibility,
              opacity: computedStyle.opacity,
              hasKeepAttr: el.hasAttribute('data-tabhive-keep')
            };
          });
          
          // 检查是否有目标元素的祖先被隐藏了
          const hiddenAncestors = [];
          targetElements.forEach(el => {
            let current = el.parentElement;
            let level = 0;
            while (current && current !== document.body && level < 10) {
              const isHidden = current.hasAttribute('data-tabhive-hidden') || 
                              window.getComputedStyle(current).display === 'none';
              if (isHidden) {
                hiddenAncestors.push({
                  level,
                  tagName: current.tagName,
                  id: current.id,
                  className: current.className,
                  hasHiddenAttr: current.hasAttribute('data-tabhive-hidden'),
                  display: window.getComputedStyle(current).display
                });
              }
              current = current.parentElement;
              level++;
            }
          });
          
          debugInfo.hiddenAncestors = hiddenAncestors;
          
          // 生成CSS样式（多个选择器合并）
          const combinedSelector = selectors.join(', ');
          const style = document.createElement('style');
          style.id = styleId;
          
          // 如果只有一个目标元素，应用单选择器样式（固定全屏）
          if (targetElements.length === 1) {
            style.textContent = \`
              html, body {
                margin: 0 !important;
                padding: 0 !important;
                overflow: hidden !important;
                width: 100% !important;
                height: 100% !important;
              }
              
              \${combinedSelector} {
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
              
              \${combinedSelector} * {
                visibility: visible !important;
              }
            \`;
          } else {
            // 多个目标元素，保持原有布局
            style.textContent = \`
              html, body {
                margin: 0 !important;
                padding: 0 !important;
                overflow: auto !important;
                width: 100% !important;
                height: 100% !important;
              }
              
              \${combinedSelector} {
                display: block !important;
                visibility: visible !important;
              }
              
              \${combinedSelector} * {
                visibility: visible !important;
              }
            \`;
          }
          
          document.head.appendChild(style);
          console.log('[Webview Selector] 选择器已应用,隐藏了', hiddenCount, '个元素');
          
          return { 
            success: true, 
            hiddenCount: hiddenCount, 
            targetCount: targetElements.length, 
            debugInfo: debugInfo 
          };
        } catch (e) {
          console.error('[Webview Selector] 错误:', e);
          return { success: false, error: e.message };
        }
      }
      
      return applyWebviewSelector(selectors, styleId);
    })();
  `;
}

/**
 * 生成样式恢复的包装函数代码
 * @param {string} styleId - 样式ID
 * @returns {string} 可执行的JavaScript代码字符串
 */
export function generateRestoreCode(styleId) {
  // 将完整的函数代码作为字符串内联，避免打包后 toString() 失败
  return `
    (function() {
      const styleId = ${JSON.stringify(styleId)};
      
      // 内联 restoreWebviewStyles 函数
      function restoreWebviewStyles(styleId) {
        try {
          const style = document.getElementById(styleId);
          if (style) {
            style.remove();
          }
          
          // 恢复隐藏的元素
          const hiddenElements = document.querySelectorAll('[data-tabhive-hidden]');
          let restoredCount = 0;
          hiddenElements.forEach(el => {
            el.style.display = '';
            el.removeAttribute('data-tabhive-hidden');
            restoredCount++;
          });
          
          // 移除标记
          const markedElements = document.querySelectorAll('[data-tabhive-keep]');
          markedElements.forEach(el => {
            el.removeAttribute('data-tabhive-keep');
          });
          
          console.log('[Webview Selector] 已恢复', restoredCount, '个元素');
          return { success: true };
        } catch (e) {
          console.error('[Webview Selector] 恢复失败:', e);
          return { success: false, error: e.message };
        }
      }
      
      return restoreWebviewStyles(styleId);
    })();
  `;
}
