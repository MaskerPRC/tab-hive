import { ref, watch } from 'vue'

/**
 * 网页导航功能 composable
 * 用于控制 webview/iframe 的前进后退功能
 * 
 * @param {Object} props - 组件 props
 * @param {Object} options - 配置选项
 * @param {import('vue').Ref<boolean>} options.isElectron - 是否为 Electron 环境
 * @param {import('vue').Ref<HTMLElement>} options.webviewRef - webview 元素引用
 * @param {import('vue').Ref<HTMLElement>} options.iframeRef - iframe 元素引用
 * @returns {Object} 导航状态和方法
 */
export function useNavigation(props, { isElectron, webviewRef, iframeRef }) {
  // 是否可以前进/后退
  const canGoBack = ref(false)
  const canGoForward = ref(false)

  /**
   * 检查是否可以前进/后退
   */
  const checkNavigationState = async () => {
    // 桌面捕获类型不支持导航
    if (props.item.type === 'desktop-capture') {
      canGoBack.value = false
      canGoForward.value = false
      return
    }

    if (isElectron.value && webviewRef.value) {
      try {
        canGoBack.value = webviewRef.value.canGoBack()
        canGoForward.value = webviewRef.value.canGoForward()
      } catch (error) {
        console.error('[useNavigation] 检查导航状态失败:', error)
        canGoBack.value = false
        canGoForward.value = false
      }
    } else if (iframeRef.value) {
      // iframe 无法直接检查历史记录，尝试访问 history 对象
      try {
        const iframeWindow = iframeRef.value.contentWindow
        if (iframeWindow && iframeWindow.history) {
          // 对于 iframe，我们无法直接检查，假设可以前进后退
          // 实际使用时如果失败会被捕获
          canGoBack.value = true
          canGoForward.value = true
        } else {
          canGoBack.value = false
          canGoForward.value = false
        }
      } catch (error) {
        // 跨域 iframe 无法访问，设置为 false
        canGoBack.value = false
        canGoForward.value = false
      }
    }
  }

  /**
   * 后退
   */
  const handleGoBack = () => {
    if (props.item.type === 'desktop-capture') return

    if (isElectron.value && webviewRef.value) {
      try {
        if (webviewRef.value.canGoBack()) {
          webviewRef.value.goBack()
          // 延迟检查状态更新
          setTimeout(checkNavigationState, 100)
        }
      } catch (error) {
        console.error('[useNavigation] 后退失败:', error)
      }
    } else if (iframeRef.value) {
      try {
        const iframeWindow = iframeRef.value.contentWindow
        if (iframeWindow && iframeWindow.history) {
          iframeWindow.history.back()
          // 延迟检查状态更新
          setTimeout(checkNavigationState, 100)
        }
      } catch (error) {
        console.error('[useNavigation] iframe 后退失败:', error)
      }
    }
  }

  /**
   * 前进
   */
  const handleGoForward = () => {
    if (props.item.type === 'desktop-capture') return

    if (isElectron.value && webviewRef.value) {
      try {
        if (webviewRef.value.canGoForward()) {
          webviewRef.value.goForward()
          // 延迟检查状态更新
          setTimeout(checkNavigationState, 100)
        }
      } catch (error) {
        console.error('[useNavigation] 前进失败:', error)
      }
    } else if (iframeRef.value) {
      try {
        const iframeWindow = iframeRef.value.contentWindow
        if (iframeWindow && iframeWindow.history) {
          iframeWindow.history.forward()
          // 延迟检查状态更新
          setTimeout(checkNavigationState, 100)
        }
      } catch (error) {
        console.error('[useNavigation] iframe 前进失败:', error)
      }
    }
  }

  /**
   * 监听 iframe 加载完成，更新导航状态（非 Electron 环境）
   */
  const watchIframeLoad = () => {
    watch(iframeRef, (newIframe) => {
      if (newIframe && !isElectron.value) {
        newIframe.addEventListener('load', () => {
          checkNavigationState()
        })
      }
    }, { immediate: true })
  }

  return {
    canGoBack,
    canGoForward,
    checkNavigationState,
    handleGoBack,
    handleGoForward,
    watchIframeLoad
  }
}

