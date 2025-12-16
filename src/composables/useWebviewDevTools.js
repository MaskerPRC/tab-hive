import { nextTick } from 'vue'

/**
 * 管理 Webview DevTools 的逻辑
 * @param {Object} props - 组件属性
 * @param {Object} options - 配置选项
 * @returns {Object} DevTools相关的方法
 */
export function useWebviewDevTools(props, { isElectron, webviewRef, customHtmlWebviewRef }) {
  /**
   * 打开 DevTools
   */
  const handleOpenDevTools = async () => {
    if (!isElectron.value) return

    // 等待DOM更新完成
    await nextTick()

    console.log('[useWebviewDevTools] 尝试打开 DevTools')
    console.log('[useWebviewDevTools] item.type:', props.item.type)
    console.log('[useWebviewDevTools] item.id:', props.item.id)
    console.log('[useWebviewDevTools] webviewRef.value:', webviewRef.value)
    console.log('[useWebviewDevTools] customHtmlWebviewRef.value:', customHtmlWebviewRef?.value)

    // 根据类型选择正确的 webview ref
    let targetWebview = null
    if (props.item.type === 'custom-html') {
      targetWebview = customHtmlWebviewRef?.value
      console.log('[useWebviewDevTools] 使用自定义HTML webview ref')

      // 如果ref为空，尝试通过DOM查询
      if (!targetWebview) {
        const webviewId = `webview-custom-${props.item.id}`
        const webviewElement = document.getElementById(webviewId)
        if (webviewElement) {
          targetWebview = webviewElement
          console.log('[useWebviewDevTools] 通过DOM查询找到自定义HTML webview:', webviewId)
        }
      }
    } else {
      targetWebview = webviewRef.value
      console.log('[useWebviewDevTools] 使用普通 webview ref')

      // 如果ref为空，尝试通过DOM查询
      if (!targetWebview) {
        const webviewId = `webview-${props.item.id}`
        const webviewElement = document.getElementById(webviewId)
        if (webviewElement) {
          targetWebview = webviewElement
          console.log('[useWebviewDevTools] 通过DOM查询找到普通 webview:', webviewId)
        }
      }
    }

    if (targetWebview) {
      console.log('[useWebviewDevTools] 找到 webview 引用，打开 DevTools')
      try {
        targetWebview.openDevTools()
        console.log('[useWebviewDevTools] DevTools 打开成功')
      } catch (error) {
        console.error('[useWebviewDevTools] 打开 DevTools 失败:', error)
      }
    } else {
      console.warn('[useWebviewDevTools] 无法打开 DevTools: 未找到 webview 引用')
      console.warn('[useWebviewDevTools] 调试信息:', {
        type: props.item.type,
        id: props.item.id,
        isElectron: isElectron.value,
        webviewRef: webviewRef.value,
        customHtmlWebviewRef: customHtmlWebviewRef?.value,
        domQuery: props.item.type === 'custom-html'
          ? document.getElementById(`webview-custom-${props.item.id}`)
          : document.getElementById(`webview-${props.item.id}`)
      })
    }
  }

  return {
    handleOpenDevTools
  }
}


