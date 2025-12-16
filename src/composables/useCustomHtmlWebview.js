import { ref, watch } from 'vue'

/**
 * 管理自定义 HTML webview 的逻辑
 * @param {Object} props - 组件属性
 * @param {Object} options - 配置选项
 * @returns {Object} 自定义HTML webview相关的状态和方法
 */
export function useCustomHtmlWebview(props, { isElectron, applySelector, restoreOriginalStyles }) {
  const customHtmlWebviewRef = ref(null)
  const canGoBackCustomHtml = ref(false)
  const canGoForwardCustomHtml = ref(false)

  /**
   * 将 HTML 转换为 data URL
   */
  const getCustomHtmlDataUrl = (html) => {
    if (!html) return 'about:blank'
    return `data:text/html;charset=utf-8,${encodeURIComponent(html)}`
  }

  /**
   * 设置自定义HTML webview引用
   */
  const setCustomHtmlWebviewRef = (el) => {
    if (el) {
      console.log('[useCustomHtmlWebview] 设置自定义HTML webview ref:', el.id)
      customHtmlWebviewRef.value = el
    } else {
      console.log('[useCustomHtmlWebview] 清除自定义HTML webview ref')
      customHtmlWebviewRef.value = null
    }
  }

  /**
   * 检查自定义HTML webview的导航状态
   */
  const checkCustomHtmlNavigationState = async () => {
    if (props.item.type !== 'custom-html' || !isElectron.value || !customHtmlWebviewRef.value) {
      canGoBackCustomHtml.value = false
      canGoForwardCustomHtml.value = false
      return
    }

    try {
      canGoBackCustomHtml.value = customHtmlWebviewRef.value.canGoBack()
      canGoForwardCustomHtml.value = customHtmlWebviewRef.value.canGoForward()
    } catch (error) {
      console.error('[useCustomHtmlWebview] 检查导航状态失败:', error)
      canGoBackCustomHtml.value = false
      canGoForwardCustomHtml.value = false
    }
  }

  /**
   * 为自定义HTML webview设置导航事件监听
   */
  const setupCustomHtmlNavigationEvents = () => {
    if (props.item.type !== 'custom-html' || !isElectron.value || !customHtmlWebviewRef.value) {
      return
    }

    const webview = customHtmlWebviewRef.value

    // 监听导航事件
    const handleDidNavigate = () => {
      setTimeout(checkCustomHtmlNavigationState, 100)
    }

    // 监听加载完成事件，应用选择器（如果不在全屏模式下）
    const handleDidFinishLoad = async () => {
      handleDidNavigate()

      // 检查是否有选择器且不在全屏模式
      const hasSelectors = (props.item.targetSelectors && Array.isArray(props.item.targetSelectors) && props.item.targetSelectors.length > 0) ||
                           (props.item.targetSelector && props.item.targetSelector.trim())

      if (hasSelectors && !props.isFullscreen) {
        console.log('[useCustomHtmlWebview] 自定义HTML页面加载完成，应用选择器')
        // 等待一小段时间确保DOM完全加载
        await new Promise(resolve => setTimeout(resolve, 500))
        if (customHtmlWebviewRef.value) {
          await applySelector(customHtmlWebviewRef.value, false)
        }
      }
    }

    webview.addEventListener('did-navigate', handleDidNavigate)
    webview.addEventListener('did-navigate-in-page', handleDidNavigate)
    webview.addEventListener('did-finish-load', handleDidFinishLoad)

    // 初始检查
    setTimeout(checkCustomHtmlNavigationState, 500)
  }

  /**
   * 自定义HTML后退
   */
  const handleGoBackCustomHtml = () => {
    if (isElectron.value && customHtmlWebviewRef.value) {
      try {
        if (customHtmlWebviewRef.value.canGoBack()) {
          customHtmlWebviewRef.value.goBack()
          setTimeout(checkCustomHtmlNavigationState, 100)
        }
      } catch (error) {
        console.error('[useCustomHtmlWebview] 后退失败:', error)
      }
    }
  }

  /**
   * 自定义HTML前进
   */
  const handleGoForwardCustomHtml = () => {
    if (isElectron.value && customHtmlWebviewRef.value) {
      try {
        if (customHtmlWebviewRef.value.canGoForward()) {
          customHtmlWebviewRef.value.goForward()
          setTimeout(checkCustomHtmlNavigationState, 100)
        }
      } catch (error) {
        console.error('[useCustomHtmlWebview] 前进失败:', error)
      }
    }
  }

  /**
   * 刷新自定义HTML webview（重新加载原始HTML内容）
   */
  const handleRefreshCustomHtml = (getCustomHtmlDataUrl) => {
    if (isElectron.value && customHtmlWebviewRef.value) {
      console.log('[useCustomHtmlWebview] 刷新自定义HTML webview，重新加载原始HTML内容')
      // 重新获取原始HTML内容并生成data URL
      const originalHtml = props.item.html || ''
      const originalDataUrl = getCustomHtmlDataUrl(originalHtml)
      // 重新加载原始HTML内容
      customHtmlWebviewRef.value.src = 'about:blank'
      setTimeout(() => {
        customHtmlWebviewRef.value.src = originalDataUrl
        // 刷新后更新导航状态
        setTimeout(checkCustomHtmlNavigationState, 100)
      }, 10)
    }
  }

  /**
   * 处理全屏切换时的选择器应用
   */
  const handleFullscreenToggle = async (isFullscreen, oldVal, refreshOnFullscreenToggle) => {
    // 只处理自定义HTML页面
    if (props.item.type !== 'custom-html') return

    // 支持新旧两种格式
    const hasSelectors = (props.item.targetSelectors && Array.isArray(props.item.targetSelectors) && props.item.targetSelectors.length > 0) ||
                         (props.item.targetSelector && props.item.targetSelector.trim())

    if (!hasSelectors) return

    if (isFullscreen) {
      console.log('[useCustomHtmlWebview] 进入全屏，恢复完整页面')
      // 进入全屏：恢复完整页面
      if (!refreshOnFullscreenToggle && oldVal !== undefined) {
        await restoreOriginalStyles()
      }
    } else {
      console.log('[useCustomHtmlWebview] 退出全屏，重新应用选择器')
      // 退出全屏：重新应用选择器
      if (!refreshOnFullscreenToggle && oldVal !== undefined) {
        await new Promise(resolve => setTimeout(resolve, 100))
        if (isElectron.value && customHtmlWebviewRef.value) {
          await applySelector(customHtmlWebviewRef.value, false)
        }
      }
    }

    // 如果配置了刷新，则刷新 webview
    if (refreshOnFullscreenToggle && oldVal !== undefined) {
      if (isElectron.value && customHtmlWebviewRef.value) {
        console.log('[useCustomHtmlWebview] 全屏切换，刷新 webview')
        customHtmlWebviewRef.value.reload()
      }
    }
  }

  // 监听自定义HTML webview ref变化
  watch(customHtmlWebviewRef, (newRef) => {
    if (newRef && props.item.type === 'custom-html') {
      setupCustomHtmlNavigationEvents()
    }
  }, { immediate: true })

  return {
    customHtmlWebviewRef,
    canGoBackCustomHtml,
    canGoForwardCustomHtml,
    getCustomHtmlDataUrl,
    setCustomHtmlWebviewRef,
    checkCustomHtmlNavigationState,
    handleGoBackCustomHtml,
    handleGoForwardCustomHtml,
    handleRefreshCustomHtml,
    handleFullscreenToggle
  }
}


