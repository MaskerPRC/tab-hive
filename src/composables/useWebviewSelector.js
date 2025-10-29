/**
 * Webview 选择器功能 Composable
 * 负责应用 CSS 选择器、暗色模式、样式恢复等功能
 */

import { watch } from 'vue'

export function useWebviewSelector(props, { isElectron, webviewRef, executeJavaScript }) {
  // 应用暗色主题
  const applyDarkMode = async (webview) => {
    if (!props.item.darkMode) return

    console.log('[useWebviewSelector] 应用暗色主题')

    try {
      // 等待一段时间确保页面完全加载
      await new Promise(resolve => setTimeout(resolve, 500))

      const darkModeStyleId = `tabhive-darkmode-style-${props.item.id}`

      const darkModeCode = `
        (function() {
          try {
            console.log('[Webview DarkMode] 应用暗色主题');
            
            // 移除旧样式
            const oldStyle = document.getElementById('${darkModeStyleId}');
            if (oldStyle) {
              oldStyle.remove();
            }
            
            // 添加暗色主题样式
            const style = document.createElement('style');
            style.id = '${darkModeStyleId}';
            style.textContent = \`
              html {
                filter: invert(0.9) hue-rotate(180deg) !important;
                background-color: #1a1a1a !important;
              }
              
              img, video, iframe, [style*="background-image"] {
                filter: invert(1) hue-rotate(180deg) !important;
              }
              
              * {
                scrollbar-color: #555 #222 !important;
              }
              
              *::-webkit-scrollbar {
                background-color: #222 !important;
              }
              
              *::-webkit-scrollbar-thumb {
                background-color: #555 !important;
              }
            \`;
            
            document.head.appendChild(style);
            console.log('[Webview DarkMode] 暗色主题已应用');
            return { success: true };
          } catch (e) {
            console.error('[Webview DarkMode] 错误:', e);
            return { success: false, error: e.message };
          }
        })();
      `

      await webview.executeJavaScript(darkModeCode)
      console.log('[useWebviewSelector] ✓ 暗色主题应用成功')
    } catch (error) {
      console.error('[useWebviewSelector] 应用暗色主题失败:', error)
    }
  }

  // 应用选择器到 webview
  const applySelector = async (webview, isBuffer = false) => {
    if (!props.item.targetSelector) return

    console.log('[useWebviewSelector] 应用选择器:', props.item.targetSelector)

    try {
      // 等待一段时间确保页面完全加载
      await new Promise(resolve => setTimeout(resolve, 1000))

      const styleId = `tabhive-selector-style-${props.item.id}`
      const selector = props.item.targetSelector

      // 构造完整的选择器代码（包括样式注入）
      const selectorCode = `
        (function() {
          try {
            const selector = '${selector.replace(/'/g, "\\'")}';
            console.log('[Webview Selector] 应用选择器:', selector);
            
            // 移除旧样式
            const oldStyle = document.getElementById('${styleId}');
            if (oldStyle) {
              oldStyle.remove();
            }
            
            // 查找目标元素
            const targetElement = document.querySelector(selector);
            if (!targetElement) {
              console.warn('[Webview Selector] 未找到选择器对应的元素:', selector);
              return { success: false, error: '未找到元素' };
            }
            
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
            
            console.log('[Webview Selector] 已隐藏', hiddenCount, '个兄弟元素');
            
            // 添加样式
            const style = document.createElement('style');
            style.id = '${styleId}';
            style.textContent = \`
              html, body {
                margin: 0 !important;
                padding: 0 !important;
                overflow: hidden !important;
                width: 100% !important;
                height: 100% !important;
              }
              
              \${selector} {
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
              
              \${selector} * {
                visibility: visible !important;
              }
            \`;
            
            document.head.appendChild(style);
            console.log('[Webview Selector] 选择器已应用,隐藏了', hiddenCount, '个元素');
            return { success: true, hiddenCount: hiddenCount };
          } catch (e) {
            console.error('[Webview Selector] 错误:', e);
            return { success: false, error: e.message };
          }
        })();
      `

      // 执行选择器代码
      const result = await webview.executeJavaScript(selectorCode)

      if (isBuffer) {
        console.log('[useWebviewSelector] 缓冲 webview 选择器应用完成')
      }
      
      if (result && result.success) {
        console.log('[useWebviewSelector] ✓ 选择器应用成功')
      }
    } catch (error) {
      console.error('[useWebviewSelector] 应用选择器失败:', error)
    }
  }
  
  // 恢复原始样式（全屏模式）
  const restoreOriginalStyles = async () => {
    if (!props.item.targetSelector) return
    
    console.log('[useWebviewSelector] 恢复原始样式')
    
    if (isElectron.value && webviewRef.value) {
      try {
        const styleId = `tabhive-selector-style-${props.item.id}`
        
        const code = `
          (function() {
            try {
              const style = document.getElementById('${styleId}');
              if (style) {
                style.remove();
              }
              
              const hiddenElements = document.querySelectorAll('[data-tabhive-hidden]');
              let restoredCount = 0;
              hiddenElements.forEach(el => {
                el.style.display = '';
                el.removeAttribute('data-tabhive-hidden');
                restoredCount++;
              });
              console.log('[Webview Selector] 已恢复', restoredCount, '个元素');
              return { success: true };
            } catch (e) {
              console.error('[Webview Selector] 恢复失败:', e);
              return { success: false, error: e.message };
            }
          })();
        `
        
        await webviewRef.value.executeJavaScript(code)
      } catch (error) {
        console.error('[useWebviewSelector] 恢复样式失败:', error)
      }
    }
  }

  // 监听全屏状态变化，控制选择器切换
  const watchFullscreenToggle = (isFullscreen, refreshOnFullscreenToggle, pauseTimer, resumeTimer) => {
    watch(isFullscreen, async (newVal, oldVal) => {
      if (newVal) {
        console.log('[useWebviewSelector] 进入全屏，暂停自动刷新')
        pauseTimer()
        
        // 如果有选择器且不刷新，恢复完整页面
        if (props.item.targetSelector && !refreshOnFullscreenToggle && oldVal !== undefined) {
          await restoreOriginalStyles()
        }
      } else {
        console.log('[useWebviewSelector] 退出全屏，恢复自动刷新')
        resumeTimer()
        
        // 如果有选择器且不刷新，重新应用选择器
        if (props.item.targetSelector && !refreshOnFullscreenToggle && oldVal !== undefined) {
          await new Promise(resolve => setTimeout(resolve, 100))
          if (isElectron.value && webviewRef.value) {
            await applySelector(webviewRef.value, false)
          }
        }
      }
      
      // 如果配置了刷新，则刷新 webview
      if (props.item.targetSelector && refreshOnFullscreenToggle && oldVal !== undefined) {
        if (isElectron.value && webviewRef.value) {
          console.log('[useWebviewSelector] 全屏切换，刷新 webview')
          const currentSrc = webviewRef.value.src
          webviewRef.value.src = ''
          setTimeout(() => {
            webviewRef.value.src = currentSrc
          }, 10)
        }
      }
    })
  }

  return {
    applyDarkMode,
    applySelector,
    restoreOriginalStyles,
    watchFullscreenToggle
  }
}
