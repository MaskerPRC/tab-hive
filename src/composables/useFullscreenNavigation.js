/**
 * 全屏导航功能
 * 处理全屏模式下的前进/后退导航
 */
import { ref } from 'vue'

export function useFullscreenNavigation(fullscreenIndexRef, allWebsites) {
  // 全屏模式下的前进后退状态
  const fullscreenCanGoBack = ref(false)
  const fullscreenCanGoForward = ref(false)

  /**
   * 检查全屏模式下的导航状态
   */
  const checkFullscreenNavigationState = () => {
    if (fullscreenIndexRef.value === null) {
      fullscreenCanGoBack.value = false
      fullscreenCanGoForward.value = false
      return
    }

    const website = allWebsites.value[fullscreenIndexRef.value]
    if (!website || website.type === 'desktop-capture') {
      fullscreenCanGoBack.value = false
      fullscreenCanGoForward.value = false
      return
    }

    const isElectron = window.electron?.isElectron
    if (isElectron) {
      // Electron 环境：通过 ID 精确查找 webview（而不是使用索引）
      // 自定义HTML页面的webview ID格式是 webview-custom-${id}，普通页面是 webview-${id}
      const webviewId = website.type === 'custom-html' 
        ? `webview-custom-${website.id}` 
        : `webview-${website.id}`
      const webview = document.querySelector(`#${webviewId}`)
      if (webview) {
        try {
          fullscreenCanGoBack.value = webview.canGoBack()
          fullscreenCanGoForward.value = webview.canGoForward()
        } catch (error) {
          console.error('[useFullscreenNavigation] 检查导航状态失败:', error)
          fullscreenCanGoBack.value = false
          fullscreenCanGoForward.value = false
        }
      } else {
        console.warn('[useFullscreenNavigation] 未找到 webview，ID:', website.id, 'webviewId:', webviewId)
        fullscreenCanGoBack.value = false
        fullscreenCanGoForward.value = false
      }
    } else {
      // 浏览器环境：通过 ID 精确查找 iframe（而不是使用索引）
      const iframe = document.querySelector(`iframe[data-website-id="${website.id}"]`)
      if (iframe) {
        try {
          const iframeWindow = iframe.contentWindow
          if (iframeWindow && iframeWindow.history) {
            // 对于 iframe，我们无法直接检查，假设可以前进后退
            fullscreenCanGoBack.value = true
            fullscreenCanGoForward.value = true
          } else {
            fullscreenCanGoBack.value = false
            fullscreenCanGoForward.value = false
          }
        } catch (error) {
          // 跨域 iframe 无法访问
          fullscreenCanGoBack.value = false
          fullscreenCanGoForward.value = false
        }
      } else {
        console.warn('[useFullscreenNavigation] 未找到 iframe，ID:', website.id)
        fullscreenCanGoBack.value = false
        fullscreenCanGoForward.value = false
      }
    }
  }

  /**
   * 全屏模式下的后退
   */
  const handleFullscreenGoBack = () => {
    if (fullscreenIndexRef.value === null) return

    const website = allWebsites.value[fullscreenIndexRef.value]
    if (!website || website.type === 'desktop-capture') return

    const isElectron = window.electron?.isElectron
    if (isElectron) {
      // 通过 ID 精确查找 webview（而不是使用索引）
      // 自定义HTML页面的webview ID格式是 webview-custom-${id}，普通页面是 webview-${id}
      const webviewId = website.type === 'custom-html' 
        ? `webview-custom-${website.id}` 
        : `webview-${website.id}`
      const webview = document.querySelector(`#${webviewId}`)
      if (webview && webview.canGoBack()) {
        webview.goBack()
        setTimeout(checkFullscreenNavigationState, 100)
      }
    } else {
      // 通过 ID 精确查找 iframe（而不是使用索引）
      const iframe = document.querySelector(`iframe[data-website-id="${website.id}"]`)
      if (iframe) {
        try {
          const iframeWindow = iframe.contentWindow
          if (iframeWindow && iframeWindow.history) {
            iframeWindow.history.back()
            setTimeout(checkFullscreenNavigationState, 100)
          }
        } catch (error) {
          console.error('[useFullscreenNavigation] iframe 后退失败:', error)
        }
      }
    }
  }

  /**
   * 全屏模式下的前进
   */
  const handleFullscreenGoForward = () => {
    if (fullscreenIndexRef.value === null) return

    const website = allWebsites.value[fullscreenIndexRef.value]
    if (!website || website.type === 'desktop-capture') return

    const isElectron = window.electron?.isElectron
    if (isElectron) {
      // 通过 ID 精确查找 webview（而不是使用索引）
      // 自定义HTML页面的webview ID格式是 webview-custom-${id}，普通页面是 webview-${id}
      const webviewId = website.type === 'custom-html' 
        ? `webview-custom-${website.id}` 
        : `webview-${website.id}`
      const webview = document.querySelector(`#${webviewId}`)
      if (webview && webview.canGoForward()) {
        webview.goForward()
        setTimeout(checkFullscreenNavigationState, 100)
      }
    } else {
      // 通过 ID 精确查找 iframe（而不是使用索引）
      const iframe = document.querySelector(`iframe[data-website-id="${website.id}"]`)
      if (iframe) {
        try {
          const iframeWindow = iframe.contentWindow
          if (iframeWindow && iframeWindow.history) {
            iframeWindow.history.forward()
            setTimeout(checkFullscreenNavigationState, 100)
          }
        } catch (error) {
          console.error('[useFullscreenNavigation] iframe 前进失败:', error)
        }
      }
    }
  }

  return {
    fullscreenCanGoBack,
    fullscreenCanGoForward,
    checkFullscreenNavigationState,
    handleFullscreenGoBack,
    handleFullscreenGoForward
  }
}

