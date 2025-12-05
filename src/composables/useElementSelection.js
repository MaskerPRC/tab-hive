import { ref, computed } from 'vue'

/**
 * 元素选择 Composable
 * 处理全屏模式下的DOM元素选择功能
 */
export function useElementSelection(props, emit) {
  // 元素选择器状态
  const isSelectingElement = ref(false)
  const fullscreenIframe = ref(null)

  // 当前全屏网站配置
  const currentFullscreenWebsite = computed(() => {
    console.log('[GridView] currentFullscreenWebsite 计算:', {
      fullscreenIndex: props.fullscreenIndex,
      websitesLength: props.websites?.length,
      targetWebsite: props.websites?.[props.fullscreenIndex]
    })

    if (props.fullscreenIndex !== null && props.websites[props.fullscreenIndex]) {
      const website = props.websites[props.fullscreenIndex]
      console.log('[GridView] 返回全屏网站配置:', website)
      return website
    }
    console.log('[GridView] 返回 null（无全屏网站）')
    return null
  })

  /**
   * 开始元素选择
   */
  const startElementSelection = () => {
    if (props.fullscreenIndex === null) {
      console.warn('只能在全屏模式下选择元素')
      return
    }

    // 根据环境获取全屏 webview 或 iframe
    const isElectron = window.electron?.isElectron

    if (isElectron) {
      // Electron 环境：查找 webview
      const webviewElements = document.querySelectorAll('.grid-item webview:not(.buffer-webview)')
      if (webviewElements[props.fullscreenIndex]) {
        fullscreenIframe.value = webviewElements[props.fullscreenIndex]
        isSelectingElement.value = true
        console.log('[全视界] 开始元素选择模式 (webview)')
      } else {
        console.error('[全视界] 未找到全屏 webview')
      }
    } else {
      // 浏览器环境：查找 iframe
      const iframeElements = document.querySelectorAll('.grid-item iframe:not(.buffer-iframe)')
      if (iframeElements[props.fullscreenIndex]) {
        fullscreenIframe.value = iframeElements[props.fullscreenIndex]
        isSelectingElement.value = true
        console.log('[全视界] 开始元素选择模式 (iframe)')
      } else {
        console.error('[全视界] 未找到全屏 iframe')
      }
    }
  }

  /**
   * 处理元素选择完成
   */
  const handleElementSelected = (data) => {
    const { selector, selectors, multiSelect } = data

    // 支持多选和单选模式
    const finalSelectors = multiSelect ? selectors : (selectors || [selector])

    console.log('选中元素选择器:', multiSelect ? `多选 ${finalSelectors.length} 个` : selector)

    if (props.fullscreenIndex !== null && props.websites[props.fullscreenIndex]) {
      const website = props.websites[props.fullscreenIndex]

      // 尝试获取当前 webview/iframe 的 URL
      let currentUrl = website.url
      try {
        // 查找当前全屏的 webview
        const webview = document.querySelector(`#webview-${website.id}`)
        if (webview && window.electron?.isElectron) {
          const url = webview.getURL()
          // 移除 __webview_id__ 参数
          currentUrl = url.replace(/[?&]__webview_id__=[^&]+/, '').replace(/\?$/, '')
          console.log('[GridView] 获取当前 URL:', currentUrl)
        }
      } catch (error) {
        console.warn('[GridView] 无法获取当前 URL，使用原 URL:', error)
      }

      // 同时更新网站的 URL 和选择器
      const updates = {
        url: currentUrl,
        targetSelectors: finalSelectors,
        targetSelector: finalSelectors.length > 0 ? finalSelectors[0] : '' // 兼容旧版
      }

      console.log('[GridView] ========== 准备发送 update-website 事件 ==========')
      console.log('[GridView] updates 对象:', updates)
      console.log('[GridView] 完整事件数据:', {
        index: props.fullscreenIndex,
        updates
      })

      emit('update-website', {
        index: props.fullscreenIndex,
        updates
      })

      if (multiSelect) {
        alert(`已设置 ${finalSelectors.length} 个元素选择器：\n${finalSelectors.join('\n')}\n\n网页地址已更新为：${currentUrl}\n\n退出全屏后将同时显示所有选中的元素。`)
      } else {
        alert(`已设置元素选择器：\n${selector}\n\n网页地址已更新为：${currentUrl}\n\n退出全屏后将自动应用该选择器。`)
      }
    }

    isSelectingElement.value = false
    fullscreenIframe.value = null
  }

  /**
   * 取消元素选择
   */
  const cancelElementSelection = () => {
    console.log('取消元素选择')
    isSelectingElement.value = false
    fullscreenIframe.value = null
  }

  return {
    // 状态
    isSelectingElement,
    fullscreenIframe,
    currentFullscreenWebsite,
    // 方法
    startElementSelection,
    handleElementSelected,
    cancelElementSelection
  }
}

