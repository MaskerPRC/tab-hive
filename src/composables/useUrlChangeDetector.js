/**
 * URL 变化检测 Composable
 * 监听 webview URL 变化并提供提示功能
 */

import { ref } from 'vue'
import { generateRestoreCode } from '../utils/webviewSelectorUtils.js'

export function useUrlChangeDetector(props, { isElectron, getCurrentUrl, webviewRef, executeJavaScript }) {
  const currentUrl = ref('')
  const showUrlChangeHint = ref(false)

  /**
   * 获取字符串长度（一个中文算一个字符）
   * @param {string} str - 字符串
   * @returns {number} 字符长度
   */
  const getCharLength = (str) => {
    if (!str) return 0
    // 使用 Array.from 正确处理 Unicode 字符（包括中文）
    return Array.from(str).length
  }

  /**
   * 解析 URL 的查询参数，只返回值长度在 40 字符以内的参数
   * @param {string} url - URL 字符串
   * @returns {Object} 参数对象（只包含短参数）
   */
  const getShortParams = (url) => {
    try {
      const urlObj = new URL(url)
      const params = {}
      urlObj.searchParams.forEach((value, key) => {
        // 跳过 __webview_id__ 参数
        if (key === '__webview_id__') return
        // 只保留值长度在 40 字符以内的参数
        if (getCharLength(value) <= 40) {
          params[key] = value
        }
      })
      return params
    } catch (error) {
      return {}
    }
  }

  /**
   * 比较两个参数对象是否一致
   * @param {Object} params1 - 参数对象1
   * @param {Object} params2 - 参数对象2
   * @returns {boolean} 是否一致
   */
  const compareParams = (params1, params2) => {
    const keys1 = Object.keys(params1).sort()
    const keys2 = Object.keys(params2).sort()
    
    // 键的数量不同，不一致
    if (keys1.length !== keys2.length) {
      return false
    }
    
    // 比较每个键的值
    for (let i = 0; i < keys1.length; i++) {
      if (keys1[i] !== keys2[i] || params1[keys1[i]] !== params2[keys2[i]]) {
        return false
      }
    }
    
    return true
  }

  // 检查 URL 是否变化
  const checkUrlChange = async (url) => {
    if (!url) return
    
    // 移除 __webview_id__ 参数
    const cleanUrl = url.replace(/[?&]__webview_id__=[^&]+/, '').replace(/\?$/, '')
    
    currentUrl.value = cleanUrl
    
    // 检查域名是否相同
    try {
      const current = new URL(cleanUrl)
      const config = new URL(props.item.url)
      
      // 检查域名和路径
      const hostnameOrPathChanged = current.hostname !== config.hostname || current.pathname !== config.pathname
      
      // 检查短参数（值长度 <= 40 字符）
      const currentShortParams = getShortParams(cleanUrl)
      const configShortParams = getShortParams(props.item.url)
      const paramsChanged = !compareParams(currentShortParams, configShortParams)
      
      // 如果主域名不同、路径不同，或短参数不同，显示提示并清除选择器样式
      if (hostnameOrPathChanged || paramsChanged) {
        showUrlChangeHint.value = true
        console.log('[useUrlChangeDetector] URL 已变化:', {
          current: cleanUrl,
          config: props.item.url,
          hostnameOrPathChanged,
          paramsChanged,
          currentShortParams,
          configShortParams
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

