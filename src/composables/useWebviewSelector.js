/**
 * Webview 选择器功能 Composable
 * 负责应用 CSS 选择器、暗色模式、样式恢复等功能
 */

import { watch } from 'vue'
import { generateSelectorCode, generateRestoreCode } from '../utils/webviewSelectorUtils.js'

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

  // 应用选择器到 webview（支持多个选择器）
  const applySelector = async (webview, isBuffer = false) => {
    // 支持新旧两种格式
    const selectors = props.item.targetSelectors && Array.isArray(props.item.targetSelectors) && props.item.targetSelectors.length > 0
      ? props.item.targetSelectors.filter(s => s && s.trim())
      : (props.item.targetSelector && props.item.targetSelector.trim() ? [props.item.targetSelector.trim()] : [])
    
    if (selectors.length === 0) return

    console.log('[useWebviewSelector] 应用选择器:', selectors)
    console.log('[useWebviewSelector] ========== 开始执行选择器应用代码 ==========')

    try {
      // 等待一段时间确保页面完全加载
      await new Promise(resolve => setTimeout(resolve, 1000))
      console.log('[useWebviewSelector] 等待完成，开始查找元素')

      const styleId = `tabhive-selector-style-${props.item.id}`

      // 使用独立的工具函数生成选择器代码
      const selectorCode = generateSelectorCode(selectors, styleId)

      // 执行选择器代码
      const result = await webview.executeJavaScript(selectorCode)
      console.log('[useWebviewSelector] executeJavaScript 返回结果:', result)

      if (isBuffer) {
        console.log('[useWebviewSelector] 缓冲 webview 选择器应用完成')
      }
      
      if (result && result.success) {
        console.log('[useWebviewSelector] ✓ 选择器应用成功，显示', result.targetCount, '个目标元素')
        
      } else {
        console.error('[useWebviewSelector] ✗ 选择器应用失败:', result)
      }
    } catch (error) {
      console.error('[useWebviewSelector] 应用选择器失败:', error)
    }
  }
  
  // 恢复原始样式（全屏模式）
  const restoreOriginalStyles = async () => {
    // 支持新旧两种格式
    const hasSelectors = (props.item.targetSelectors && Array.isArray(props.item.targetSelectors) && props.item.targetSelectors.length > 0) ||
                         (props.item.targetSelector && props.item.targetSelector.trim())
    
    if (!hasSelectors) return
    
    console.log('[useWebviewSelector] 恢复原始样式')
    
    if (isElectron.value && webviewRef.value) {
      try {
        const styleId = `tabhive-selector-style-${props.item.id}`
        
        // 使用独立的工具函数生成恢复代码
        const code = generateRestoreCode(styleId)
        
        await webviewRef.value.executeJavaScript(code)
      } catch (error) {
        console.error('[useWebviewSelector] 恢复样式失败:', error)
      }
    }
  }

  // 监听全屏状态变化，控制选择器切换
  const watchFullscreenToggle = (isFullscreen, refreshOnFullscreenToggle, pauseTimer, resumeTimer) => {
    watch(isFullscreen, async (newVal, oldVal) => {
      // 支持新旧两种格式
      const hasSelectors = (props.item.targetSelectors && Array.isArray(props.item.targetSelectors) && props.item.targetSelectors.length > 0) ||
                           (props.item.targetSelector && props.item.targetSelector.trim())
      
      if (newVal) {
        console.log('[useWebviewSelector] 进入全屏，暂停自动刷新')
        pauseTimer()
        
        // 如果有选择器且不刷新，恢复完整页面
        if (hasSelectors && !refreshOnFullscreenToggle && oldVal !== undefined) {
          await restoreOriginalStyles()
        }
      } else {
        console.log('[useWebviewSelector] 退出全屏，恢复自动刷新')
        resumeTimer()
        
        // 如果有选择器且不刷新，重新应用选择器
        if (hasSelectors && !refreshOnFullscreenToggle && oldVal !== undefined) {
          await new Promise(resolve => setTimeout(resolve, 100))
          if (isElectron.value && webviewRef.value) {
            await applySelector(webviewRef.value, false)
          }
        }
      }
      
      // 如果配置了刷新，则刷新 webview
      if (hasSelectors && refreshOnFullscreenToggle && oldVal !== undefined) {
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
