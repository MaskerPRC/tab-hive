import { onMounted, onBeforeUnmount } from 'vue'

/**
 * 管理外部链接模态框的逻辑
 * 包括打开、关闭以及监听事件
 */
export function useExternalUrlModal(dialogStates) {
  /**
   * 设置事件监听器
   */
  const setupEventListeners = () => {
    const handleOpenExternalUrlModal = (event) => {
      console.log('[useExternalUrlModal] 收到open-external-url-modal事件')
      console.log('[useExternalUrlModal] event.detail:', event.detail)
      const url = event.detail?.url
      if (url) {
        console.log('[useExternalUrlModal] ✓ 有效URL，打开模态框:', url)
        dialogStates.openExternalUrlModal(url)
      } else {
        console.warn('[useExternalUrlModal] ✗ 无效URL，忽略事件')
      }
    }
    
    console.log('[useExternalUrlModal] 注册open-external-url-modal事件监听器')
    window.addEventListener('open-external-url-modal', handleOpenExternalUrlModal)
    
    // 返回清理函数
    return () => {
      window.removeEventListener('open-external-url-modal', handleOpenExternalUrlModal)
    }
  }
  
  return {
    setupEventListeners
  }
}

/**
 * 在组件中使用外部链接模态框的钩子
 * 自动设置和清理事件监听器
 */
export function useExternalUrlModalListeners(dialogStates) {
  const { setupEventListeners } = useExternalUrlModal(dialogStates)
  
  onMounted(() => {
    const cleanup = setupEventListeners()
    
    onBeforeUnmount(() => {
      cleanup()
    })
  })
}

