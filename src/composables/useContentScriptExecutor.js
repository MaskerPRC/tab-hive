/**
 * Content Script 执行器
 * 用于在 webview/iframe 中执行复杂的 JavaScript 逻辑
 * 支持元素高亮、批量处理、数据提取等
 */

import { ref, computed } from 'vue'

export function useContentScriptExecutor() {
  const isElectron = computed(() => window.electron?.isElectron || false)
  const executionResults = ref([])
  const isExecuting = ref(false)

  /**
   * 在 webview/iframe 中执行脚本
   * @param {Object} target - 目标 iframe 或 webview
   * @param {string} script - 要执行的脚本
   * @returns {Promise<any>} - 执行结果
   */
  async function executeScript(target, script) {
    if (!target) {
      throw new Error('目标 iframe/webview 不可用')
    }

    isExecuting.value = true

    try {
      if (isElectron.value) {
        // Electron 环境：target 是 webview 元素，直接使用 executeJavaScript
        if (target.executeJavaScript) {
          try {
            const result = await target.executeJavaScript(script)
            const executionResult = {
              success: true,
              result: result
            }
            executionResults.value.push({
              timestamp: Date.now(),
              success: true,
              result: result,
              error: null
            })
            return executionResult
          } catch (error) {
            const executionResult = {
              success: false,
              result: null,
              error: error.message
            }
            executionResults.value.push({
              timestamp: Date.now(),
              success: false,
              result: null,
              error: error.message
            })
            return executionResult
          }
        } else {
          // 如果 target 没有 executeJavaScript 方法，尝试使用 IPC（兼容旧代码）
          if (window.electron?.executeInIframe && target.id) {
            const result = await window.electron.executeInIframe(target.id, script)
            executionResults.value.push({
              timestamp: Date.now(),
              success: result.success,
              result: result.result,
              error: result.error
            })
            return result
          } else {
            throw new Error('无法执行脚本：webview 元素不支持 executeJavaScript 方法')
          }
        }
      } else {
        // 浏览器环境：使用 postMessage
        return await executeScriptViaPostMessage(target, script)
      }
    } finally {
      isExecuting.value = false
    }
  }

  /**
   * 通过 postMessage 执行脚本（浏览器环境）
   */
  function executeScriptViaPostMessage(iframe, script) {
    return new Promise((resolve, reject) => {
      const requestId = `exec-${Date.now()}-${Math.random()}`
      const timeout = setTimeout(() => {
        window.removeEventListener('message', handler)
        const error = new Error('执行超时')
        const result = {
          success: false,
          result: null,
          error: error.message
        }
        executionResults.value.push({
          timestamp: Date.now(),
          success: false,
          result: null,
          error: error.message
        })
        reject(error)
      }, 10000)

      const handler = (event) => {
        if (event.data && 
            event.data.source === 'quanshijie-content-executor' && 
            event.data.requestId === requestId) {
          clearTimeout(timeout)
          window.removeEventListener('message', handler)
          const result = event.data.result || {
            success: true,
            result: event.data.result,
            error: null
          }
          executionResults.value.push({
            timestamp: Date.now(),
            success: result.success !== false,
            result: result.result,
            error: result.error
          })
          resolve(result)
        }
      }

      window.addEventListener('message', handler)

      iframe.contentWindow.postMessage({
        source: 'quanshijie',
        action: 'executeScript',
        requestId,
        script
      }, '*')
    })
  }

  /**
   * 高亮显示元素
   * @param {Object} target - 目标 iframe/webview
   * @param {string|string[]} selectors - 选择器或选择器数组
   * @param {Object} options - 高亮选项
   */
  async function highlightElements(target, selectors, options = {}) {
    const selectorArray = Array.isArray(selectors) ? selectors : [selectors]
    const {
      color = '#ff5c00',
      backgroundColor = 'rgba(255, 92, 0, 0.2)',
      duration = 0, // 0 表示永久高亮
      outline = true,
      pulse = false
    } = options

    const script = `
      (function() {
        const selectors = ${JSON.stringify(selectorArray)};
        const results = {
          highlighted: [],
          notFound: []
        };
        
        // 清除之前的高亮
        const oldHighlights = document.querySelectorAll('.quanshijie-highlight-overlay');
        oldHighlights.forEach(el => el.remove());
        
        // 为每个选择器创建高亮
        selectors.forEach(selector => {
          try {
            const elements = document.querySelectorAll(selector);
            if (elements.length === 0) {
              results.notFound.push(selector);
              return;
            }
            
            elements.forEach((element, index) => {
              const rect = element.getBoundingClientRect();
              const scrollLeft = document.documentElement.scrollLeft || document.body.scrollLeft;
              const scrollTop = document.documentElement.scrollTop || document.body.scrollTop;
              
              const overlay = document.createElement('div');
              overlay.className = 'quanshijie-highlight-overlay';
              overlay.style.cssText = \`
                position: absolute;
                left: \${rect.left + scrollLeft}px;
                top: \${rect.top + scrollTop}px;
                width: \${rect.width}px;
                height: \${rect.height}px;
                ${outline ? `border: 2px solid ${color};` : ''}
                background: ${backgroundColor};
                pointer-events: none;
                z-index: 999999;
                transition: all 0.3s ease;
                ${pulse ? 'animation: quanshijie-pulse 1.5s ease-in-out infinite;' : ''}
              \`;
              
              // 添加标签
              const label = document.createElement('div');
              label.style.cssText = \`
                position: absolute;
                top: -20px;
                left: 0;
                background: ${color};
                color: white;
                padding: 2px 6px;
                font-size: 11px;
                border-radius: 3px;
                white-space: nowrap;
                font-family: monospace;
              \`;
              label.textContent = \`\${selector}[\${index}]\`;
              overlay.appendChild(label);
              
              document.body.appendChild(overlay);
              
              results.highlighted.push({
                selector,
                index,
                tagName: element.tagName.toLowerCase(),
                rect: {
                  x: rect.left,
                  y: rect.top,
                  width: rect.width,
                  height: rect.height
                }
              });
            });
          } catch (error) {
            results.notFound.push(selector);
            console.error('[全视界] 高亮失败:', selector, error);
          }
        });
        
        // 添加动画样式
        ${pulse ? `
        if (!document.getElementById('quanshijie-pulse-animation')) {
          const style = document.createElement('style');
          style.id = 'quanshijie-pulse-animation';
          style.textContent = \`
            @keyframes quanshijie-pulse {
              0%, 100% { opacity: 1; transform: scale(1); }
              50% { opacity: 0.7; transform: scale(1.02); }
            }
          \`;
          document.head.appendChild(style);
        }
        ` : ''}
        
        // 定时移除高亮
        ${duration > 0 ? `
        setTimeout(() => {
          const highlights = document.querySelectorAll('.quanshijie-highlight-overlay');
          highlights.forEach(el => {
            el.style.opacity = '0';
            setTimeout(() => el.remove(), 300);
          });
        }, ${duration});
        ` : ''}
        
        return results;
      })();
    `

    return await executeScript(target, script)
  }

  /**
   * 清除所有高亮
   */
  async function clearHighlights(target) {
    const script = `
      (function() {
        const highlights = document.querySelectorAll('.quanshijie-highlight-overlay');
        let count = highlights.length;
        highlights.forEach(el => el.remove());
        return { cleared: count };
      })();
    `
    return await executeScript(target, script)
  }

  /**
   * 批量提取元素数据
   * @param {Object} target - 目标 iframe/webview
   * @param {string|string[]} selectors - 选择器
   * @param {Object} extractors - 数据提取器配置
   */
  async function extractElementsData(target, selectors, extractors = {}) {
    const selectorArray = Array.isArray(selectors) ? selectors : [selectors]
    const {
      text = true,
      html = false,
      attributes = [],
      styles = [],
      custom = null // 自定义提取函数（字符串形式）
    } = extractors

    const script = `
      (function() {
        const selectors = ${JSON.stringify(selectorArray)};
        const results = [];
        
        selectors.forEach(selector => {
          try {
            const elements = document.querySelectorAll(selector);
            elements.forEach((element, index) => {
              const data = {
                selector,
                index,
                tagName: element.tagName.toLowerCase()
              };
              
              // 提取文本
              ${text ? `data.text = element.textContent?.trim();` : ''}
              
              // 提取 HTML
              ${html ? `data.html = element.innerHTML;` : ''}
              
              // 提取属性
              ${attributes.length > 0 ? `
              data.attributes = {};
              ${JSON.stringify(attributes)}.forEach(attr => {
                data.attributes[attr] = element.getAttribute(attr);
              });
              ` : ''}
              
              // 提取样式
              ${styles.length > 0 ? `
              data.styles = {};
              const computedStyle = window.getComputedStyle(element);
              ${JSON.stringify(styles)}.forEach(style => {
                data.styles[style] = computedStyle[style];
              });
              ` : ''}
              
              // 自定义提取
              ${custom ? `
              try {
                const customExtractor = ${custom};
                data.custom = customExtractor(element);
              } catch (e) {
                data.customError = e.message;
              }
              ` : ''}
              
              results.push(data);
            });
          } catch (error) {
            results.push({
              selector,
              error: error.message
            });
          }
        });
        
        return results;
      })();
    `

    return await executeScript(target, script)
  }

  /**
   * 批量修改元素样式
   */
  async function modifyElementsStyle(target, selectors, styles) {
    const selectorArray = Array.isArray(selectors) ? selectors : [selectors]
    
    const script = `
      (function() {
        const selectors = ${JSON.stringify(selectorArray)};
        const styles = ${JSON.stringify(styles)};
        let modifiedCount = 0;
        
        selectors.forEach(selector => {
          try {
            const elements = document.querySelectorAll(selector);
            elements.forEach(element => {
              Object.assign(element.style, styles);
              modifiedCount++;
            });
          } catch (error) {
            console.error('[全视界] 修改样式失败:', selector, error);
          }
        });
        
        return { modified: modifiedCount };
      })();
    `

    return await executeScript(target, script)
  }

  /**
   * 批量执行元素操作
   */
  async function performElementsAction(target, selectors, action) {
    const selectorArray = Array.isArray(selectors) ? selectors : [selectors]
    const validActions = ['click', 'focus', 'blur', 'scrollIntoView', 'remove', 'hide', 'show']
    
    if (!validActions.includes(action)) {
      throw new Error(`不支持的操作: ${action}`)
    }

    const script = `
      (function() {
        const selectors = ${JSON.stringify(selectorArray)};
        const action = ${JSON.stringify(action)};
        const results = {
          success: [],
          failed: []
        };
        
        selectors.forEach(selector => {
          try {
            const elements = document.querySelectorAll(selector);
            if (elements.length === 0) {
              results.failed.push({ selector, reason: '未找到元素' });
              return;
            }
            
            elements.forEach((element, index) => {
              try {
                switch(action) {
                  case 'click':
                    element.click();
                    break;
                  case 'focus':
                    element.focus();
                    break;
                  case 'blur':
                    element.blur();
                    break;
                  case 'scrollIntoView':
                    element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    break;
                  case 'remove':
                    element.remove();
                    break;
                  case 'hide':
                    element.style.display = 'none';
                    break;
                  case 'show':
                    element.style.display = '';
                    break;
                }
                results.success.push({ selector, index });
              } catch (error) {
                results.failed.push({ selector, index, reason: error.message });
              }
            });
          } catch (error) {
            results.failed.push({ selector, reason: error.message });
          }
        });
        
        return results;
      })();
    `

    return await executeScript(target, script)
  }

  /**
   * 监听元素变化
   */
  async function watchElements(target, selectors, callback, options = {}) {
    const selectorArray = Array.isArray(selectors) ? selectors : [selectors]
    const {
      attributes = true,
      childList = true,
      subtree = false,
      characterData = false
    } = options

    // 注册监听器ID
    const watcherId = `watcher-${Date.now()}-${Math.random()}`

    const script = `
      (function() {
        const selectors = ${JSON.stringify(selectorArray)};
        const watcherId = ${JSON.stringify(watcherId)};
        
        if (!window.__tabHiveWatchers) {
          window.__tabHiveWatchers = {};
        }
        
        // 清理旧的监听器
        if (window.__tabHiveWatchers[watcherId]) {
          window.__tabHiveWatchers[watcherId].disconnect();
        }
        
        const observer = new MutationObserver((mutations) => {
          const changes = mutations.map(mutation => ({
            type: mutation.type,
            target: mutation.target.tagName.toLowerCase(),
            addedNodes: mutation.addedNodes.length,
            removedNodes: mutation.removedNodes.length,
            attributeName: mutation.attributeName
          }));
          
          // 发送变化通知
          window.parent.postMessage({
            source: 'quanshijie-content-executor',
            action: 'elementChanged',
            watcherId: watcherId,
            changes: changes
          }, '*');
        });
        
        // 监听所有匹配的元素
        selectors.forEach(selector => {
          const elements = document.querySelectorAll(selector);
          elements.forEach(element => {
            observer.observe(element, ${JSON.stringify({ attributes, childList, subtree, characterData })});
          });
        });
        
        window.__tabHiveWatchers[watcherId] = observer;
        
        return { 
          watcherId,
          watching: selectors.length
        };
      })();
    `

    const result = await executeScript(target, script)

    // 设置回调监听器
    if (callback) {
      const handler = (event) => {
        if (event.data && 
            event.data.source === 'quanshijie-content-executor' &&
            event.data.action === 'elementChanged' &&
            event.data.watcherId === watcherId) {
          callback(event.data.changes)
        }
      }
      window.addEventListener('message', handler)

      // 返回清理函数
      result.cleanup = () => {
        window.removeEventListener('message', handler)
        stopWatching(target, watcherId)
      }
    }

    return result
  }

  /**
   * 停止监听元素
   */
  async function stopWatching(target, watcherId) {
    const script = `
      (function() {
        const watcherId = ${JSON.stringify(watcherId)};
        if (window.__tabHiveWatchers && window.__tabHiveWatchers[watcherId]) {
          window.__tabHiveWatchers[watcherId].disconnect();
          delete window.__tabHiveWatchers[watcherId];
          return { stopped: true };
        }
        return { stopped: false, reason: '监听器不存在' };
      })();
    `
    return await executeScript(target, script)
  }

  /**
   * 清除所有结果
   */
  function clearResults() {
    executionResults.value = []
  }

  return {
    // 状态
    isExecuting,
    executionResults,
    
    // 方法
    executeScript,
    highlightElements,
    clearHighlights,
    extractElementsData,
    modifyElementsStyle,
    performElementsAction,
    watchElements,
    stopWatching,
    clearResults
  }
}

