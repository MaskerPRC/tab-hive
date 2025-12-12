/**
 * URL 变化检测 Composable
 * 监听 webview URL 变化并提供提示功能
 */

import { ref } from 'vue'
import { generateRestoreCode } from '../utils/webviewSelectorUtils.js'

export function useUrlChangeDetector(props, { isElectron, getCurrentUrl, webviewRef, executeJavaScript }) {
  const currentUrl = ref('')
  const showUrlChangeHint = ref(false)

  // 检查 URL 是否变化
  const checkUrlChange = async (url) => {
    if (!url) return
    
    // 移除 __webview_id__ 参数
    const cleanUrl = url.split('?')[0] + (url.includes('?') && !url.includes('__webview_id__') ? '?' + url.split('?')[1] : '')
    const configUrl = props.item.url.split('?')[0]
    
    currentUrl.value = cleanUrl
    
    // 检查域名是否相同
    try {
      const current = new URL(cleanUrl)
      const config = new URL(props.item.url)
      
      // 如果主域名不同，或路径不同，显示提示并清除选择器样式
      if (current.hostname !== config.hostname || current.pathname !== config.pathname) {
        showUrlChangeHint.value = true
        console.log('[useUrlChangeDetector] URL 已变化:', {
          current: cleanUrl,
          config: props.item.url
        })
        
        // 清除已应用的选择器样式（避免在新页面上显示异常）
        const hasSelectors = (props.item.targetSelectors && props.item.targetSelectors.length > 0) ||
                            (props.item.targetSelector && props.item.targetSelector.trim())
        if (hasSelectors && isElectron.value && webviewRef?.value && executeJavaScript) {
          try {
            const styleId = `quanshijie-selector-style-${props.item.id}`
            const restoreCode = generateRestoreCode(styleId)
            await executeJavaScript(restoreCode)
            console.log('[useUrlChangeDetector] ✓ 已清除选择器样式（URL已变化）')
          } catch (error) {
            console.warn('[useUrlChangeDetector] 清除选择器样式失败:', error)
          }
        }
      } else {
        showUrlChangeHint.value = false
      }
    } catch (error) {
      console.error('[useUrlChangeDetector] URL 解析失败:', error)
    }
  }

  // 使用当前 URL
  const handleUseCurrentUrl = (emit, index) => {
    if (currentUrl.value && isElectron.value) {
      try {
        const url = getCurrentUrl()
        // 移除 __webview_id__ 参数
        const cleanUrl = url.replace(/[?&]__webview_id__=[^&]+/, '').replace(/\?$/, '')
        
        console.log('[useUrlChangeDetector] 使用当前 URL:', cleanUrl)
        emit('update-url', index, cleanUrl)
        showUrlChangeHint.value = false
      } catch (error) {
        console.error('[useUrlChangeDetector] 获取 URL 失败:', error)
      }
    }
  }

  return {
    currentUrl,
    showUrlChangeHint,
    checkUrlChange,
    handleUseCurrentUrl
  }
}

