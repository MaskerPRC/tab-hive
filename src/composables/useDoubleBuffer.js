/**
 * 双缓冲刷新机制 Composable
 * 提供无闪烁的 webview 刷新体验
 */

import { ref, nextTick } from 'vue'

export function useDoubleBuffer(props, { isElectron, mainWebviewReady }) {
  // 双缓冲相关状态
  const isBufferLoading = ref(false)
  const isBufferReady = ref(false)
  const bufferUrl = ref('')
  const bufferWebviewRef = ref(null)

  // 设置缓冲 webview 引用
  const setBufferWebviewRef = (el) => {
    bufferWebviewRef.value = el
  }

  // 双缓冲刷新方法
  const refreshWithDoubleBuffer = (websiteUrl, partitionName, onRefresh) => {
    console.log('[useDoubleBuffer] 使用双缓冲刷新:', props.item.title, {
      sessionInstance: props.item.sessionInstance,
      partition: partitionName,
      url: websiteUrl
    })
    
    if (!isElectron.value) {
      return
    }

    // 重置状态
    isBufferReady.value = false
    
    // 设置缓冲 URL 并显示缓冲 webview
    bufferUrl.value = websiteUrl
    isBufferLoading.value = true
    
    console.log('[useDoubleBuffer] 缓冲 webview 配置:', {
      bufferUrl: bufferUrl.value,
      partition: partitionName
    })
  }

  // 处理缓冲 webview 加载完成
  const handleBufferLoad = async (onMainRefresh, needSelector = false) => {
    console.log('[useDoubleBuffer] 缓冲 webview 加载完成')
    
    // 判断是否需要等待选择器应用
    if (needSelector) {
      console.log('[useDoubleBuffer] 选择器类型页面，等待应用选择器')
      await new Promise(resolve => setTimeout(resolve, 1500))
    }
    
    // 缓冲 webview 准备完成，显示在前面
    console.log('[useDoubleBuffer] 显示缓冲 webview')
    isBufferReady.value = true
    
    // 立即刷新主 webview（在后台进行）
    console.log('[useDoubleBuffer] 刷新主 webview')
    mainWebviewReady.value = false
    if (onMainRefresh) {
      onMainRefresh()
    }
    
    // 等待主 webview 加载完成
    await waitForMainWebview()
    
    // 移除缓冲 webview
    isBufferLoading.value = false
    isBufferReady.value = false
    bufferUrl.value = ''
    console.log('[useDoubleBuffer] 双缓冲刷新完成')
  }

  // 等待主 webview 加载完成
  const waitForMainWebview = () => {
    return new Promise((resolve) => {
      const checkReady = () => {
        if (mainWebviewReady.value) {
          console.log('[useDoubleBuffer] 主 webview 已准备就绪')
          resolve()
        } else {
          setTimeout(checkReady, 100)
        }
      }
      
      checkReady()
      
      // 最多等待 5 秒
      setTimeout(() => {
        console.log('[useDoubleBuffer] 等待主 webview 超时')
        resolve()
      }, 5000)
    })
  }

  // 绑定缓冲 webview 的加载完成事件
  const setupBufferWebview = (onMainRefresh, needSelector = false) => {
    nextTick(() => {
      if (bufferWebviewRef.value) {
        bufferWebviewRef.value.addEventListener(
          'did-finish-load',
          () => handleBufferLoad(onMainRefresh, needSelector),
          { once: true }
        )
      }
    })
  }

  return {
    isBufferLoading,
    isBufferReady,
    bufferUrl,
    bufferWebviewRef,
    setBufferWebviewRef,
    refreshWithDoubleBuffer,
    setupBufferWebview
  }
}

