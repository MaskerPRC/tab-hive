/**
 * Webview 选择器功能 Composable
 * 负责应用 CSS 选择器、暗色模式、样式恢复等功能
 */

import { watch, computed } from 'vue'
import { generateSelectorCode, generateRestoreCode } from '../utils/webviewSelectorUtils.js'
import { generateAdBlockCode, generateRemoveAdBlockCode } from '../utils/adBlockUtils.js'

export function useWebviewSelector(props, { isElectron, webviewRef, executeJavaScript, adBlockEnabled = false }) {
  // 确保 adBlockEnabled 是响应式的
  const adBlockEnabledRef = computed(() => {
    return typeof adBlockEnabled === 'function' || (typeof adBlockEnabled === 'object' && adBlockEnabled?.value !== undefined)
      ? (typeof adBlockEnabled === 'function' ? adBlockEnabled() : adBlockEnabled.value)
      : adBlockEnabled
  })

  // 应用去广告
  const applyAdBlock = async (webview) => {
    const enabled = adBlockEnabledRef.value
    if (!enabled) {
      console.log('[useWebviewSelector] 去广告未启用，跳过')
      return
    }

    console.log('[useWebviewSelector] 应用去广告，adBlockEnabled:', enabled)

    // 使用重试机制直接尝试执行，避免预先检查（因为检查本身也可能失败）
    const adBlockCode = generateAdBlockCode()
    const maxRetries = 5
    const retryDelays = [500, 1000, 1500, 2000, 3000]
    
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        if (attempt > 0) {
          console.log(`[useWebviewSelector] 第 ${attempt + 1} 次尝试应用去广告，等待 ${retryDelays[attempt - 1]}ms`)
          await new Promise(resolve => setTimeout(resolve, retryDelays[attempt - 1]))
        } else {
          // 第一次尝试前等待一小段时间
          await new Promise(resolve => setTimeout(resolve, 800))
        }

        // 尝试执行去广告代码
        const result = await webview.executeJavaScript(adBlockCode)
        console.log(`[useWebviewSelector] ✓ 去广告代码已注入（第 ${attempt + 1} 次尝试），结果:`, result)
        
        // 成功注入后，等待一段时间再次注入（处理动态加载的内容）
        await new Promise(resolve => setTimeout(resolve, 1000))
        try {
          const result2 = await webview.executeJavaScript(adBlockCode)
          console.log('[useWebviewSelector] ✓ 去广告代码已再次注入（处理动态内容），结果:', result2)
        } catch (secondError) {
          // 第二次注入失败不影响整体功能
          console.warn('[useWebviewSelector] ⚠ 第二次注入失败（动态内容处理），但不影响:', secondError.message)
        }
        
        return // 成功则退出
      } catch (error) {
        const isDomReadyError = error.message && error.message.includes('dom-ready')
        
        if (isDomReadyError && attempt < maxRetries - 1) {
          // DOM 未就绪，继续重试
          console.warn(`[useWebviewSelector] ⚠ DOM 未就绪错误（第 ${attempt + 1} 次尝试），将在 ${retryDelays[attempt]}ms 后重试`)
        } else if (isDomReadyError) {
          // 最后一次尝试也失败
          console.error('[useWebviewSelector] ✗ 去广告应用失败：DOM 未就绪（已重试' + maxRetries + '次）')
          console.warn('[useWebviewSelector] 这可能是由于 webview 加载时机问题，但不会影响其他功能')
        } else {
          // 其他错误，不再重试
          console.error('[useWebviewSelector] ✗ 去广告应用失败:', error)
          throw error
        }
      }
    }
  }

  // 移除去广告
  const removeAdBlock = async () => {
    const enabled = adBlockEnabledRef.value
    if (enabled || !isElectron.value || !webviewRef.value) return

    console.log('[useWebviewSelector] 移除去广告')

    try {
      const removeCode = generateRemoveAdBlockCode()
      await webviewRef.value.executeJavaScript(removeCode)
    } catch (error) {
      console.error('[useWebviewSelector] 移除去广告失败:', error)
    }
  }

  // 应用内边距（网页模式，无选择器）
  const applyPadding = async (webview) => {
    const padding = props.item.padding && props.item.padding > 0 ? props.item.padding : 0
    if (padding === 0) return

    console.log('[useWebviewSelector] 应用内边距（网页模式）:', padding)

    try {
      await new Promise(resolve => setTimeout(resolve, 500))

      const paddingStyleId = `quanshijie-padding-style-${props.item.id}`

      const paddingCode = `
        (function() {
          try {
            console.log('[Webview Padding] 应用内边距（网页模式）');
            
            // 移除旧样式
            const oldStyle = document.getElementById('${paddingStyleId}');
            if (oldStyle) {
              oldStyle.remove();
            }
            
            // 添加内边距样式
            const style = document.createElement('style');
            style.id = '${paddingStyleId}';
            style.textContent = \`
              html, body {
                padding: ${padding}px !important;
                box-sizing: border-box !important;
              }
            \`;
            
            document.head.appendChild(style);
            console.log('[Webview Padding] 内边距已应用（网页模式）');
            return { success: true };
          } catch (e) {
            console.error('[Webview Padding] 错误:', e);
            return { success: false, error: e.message };
          }
        })();
      `

      await webview.executeJavaScript(paddingCode)
      console.log('[useWebviewSelector] ✓ 内边距应用成功（网页模式）')
    } catch (error) {
      console.error('[useWebviewSelector] 应用内边距失败（网页模式）:', error)
    }
  }

  // 移除内边距（网页模式）
  const removePadding = async () => {
    if (!isElectron.value || !webviewRef.value) return

    console.log('[useWebviewSelector] 移除内边距（网页模式）')

    try {
      const paddingStyleId = `quanshijie-padding-style-${props.item.id}`
      const removeCode = `
        (function() {
          try {
            const style = document.getElementById('${paddingStyleId}');
            if (style) {
              style.remove();
            }
            return { success: true };
          } catch (e) {
            console.error('[Webview Padding] 移除失败:', e);
            return { success: false, error: e.message };
          }
        })();
      `
      await webviewRef.value.executeJavaScript(removeCode)
    } catch (error) {
      console.error('[useWebviewSelector] 移除内边距失败（网页模式）:', error)
    }
  }

  // 应用暗色主题
  const applyDarkMode = async (webview) => {
    if (!props.item.darkMode) return

    console.log('[useWebviewSelector] 应用暗色主题')

    try {
      // 等待一段时间确保页面完全加载
      await new Promise(resolve => setTimeout(resolve, 500))

      const darkModeStyleId = `quanshijie-darkmode-style-${props.item.id}`

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
      const styleId = `quanshijie-selector-style-${props.item.id}`
      const padding = props.item.padding && props.item.padding > 0 ? props.item.padding : 0
      const selectorCode = generateSelectorCode(selectors, styleId, padding)

      // 重试机制：最多尝试3次，每次间隔递增
      let lastResult = null
      const maxRetries = 3
      const retryDelays = [1000, 2000, 3000] // 每次重试的等待时间

      for (let attempt = 0; attempt < maxRetries; attempt++) {
        // 等待页面加载
        if (attempt > 0) {
          console.log(`[useWebviewSelector] 第 ${attempt + 1} 次尝试应用选择器，等待 ${retryDelays[attempt]}ms`)
          await new Promise(resolve => setTimeout(resolve, retryDelays[attempt]))
        } else {
          await new Promise(resolve => setTimeout(resolve, 1000))
        }

        // 执行选择器代码
        try {
          lastResult = await webview.executeJavaScript(selectorCode)
          console.log(`[useWebviewSelector] 第 ${attempt + 1} 次尝试结果:`, lastResult)

          if (lastResult && lastResult.success) {
            console.log('[useWebviewSelector] ✓ 选择器应用成功，显示', lastResult.targetCount, '个目标元素')
            return // 成功则退出
          }

          // 如果未找到元素，继续重试（除非是最后一次）
          if (lastResult && lastResult.error === '未找到任何元素') {
            if (attempt < maxRetries - 1) {
              console.warn(`[useWebviewSelector] ⚠ 未找到元素，将在 ${retryDelays[attempt + 1]}ms 后重试`)
              continue
            } else {
              // 最后一次尝试也失败，使用警告而不是错误
              console.warn('[useWebviewSelector] ⚠ 选择器未找到元素（已重试' + maxRetries + '次）:', selectors)
              console.warn('[useWebviewSelector] 这可能是因为页面尚未完全加载，或者选择器在当前页面无效')
            }
          } else {
            // 其他错误，不再重试
            console.warn('[useWebviewSelector] ⚠ 选择器应用失败:', lastResult)
            break
          }
        } catch (jsError) {
          console.error('[useWebviewSelector] 执行 JavaScript 失败:', jsError)
          if (attempt < maxRetries - 1) {
            continue // 继续重试
          } else {
            throw jsError // 最后一次失败则抛出
          }
        }
      }

      if (isBuffer) {
        console.log('[useWebviewSelector] 缓冲 webview 选择器处理完成')
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
        const styleId = `quanshijie-selector-style-${props.item.id}`
        
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
          // 使用 reload() 方法而不是重置 src，避免白屏
          webviewRef.value.reload()
        }
      }
    })
  }

  return {
    applyDarkMode,
    applySelector,
    restoreOriginalStyles,
    watchFullscreenToggle,
    applyAdBlock,
    removeAdBlock,
    applyPadding,
    removePadding
  }
}

