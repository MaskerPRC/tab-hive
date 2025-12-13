/**
 * 下载弹窗处理器
 * 负责处理下载弹窗的显示和关闭
 */

export function useDownloadModalHandlers(dialogStates, viewportStates) {
  // 检查用户是否已经看过首次弹窗
  const hasSeenDownloadModal = () => {
    try {
      return localStorage.getItem('quanshijie-seen-download-modal') === 'true'
    } catch (e) {
      return false
    }
  }

  // 关闭下载弹窗
  const closeDownloadModal = () => {
    const isFirstTime = !hasSeenDownloadModal()
    dialogStates.closeDownloadModal()

    // 保存用户已经看过弹窗的标记
    try {
      localStorage.setItem('quanshijie-seen-download-modal', 'true')
    } catch (e) {
      console.error('保存弹窗状态失败:', e)
    }

    // 如果是首次关闭弹窗，显示侧边栏让用户知道
    if (isFirstTime) {
      setTimeout(() => {
        viewportStates.showPanelTemporarily(3000)
      }, 300) // 稍微延迟一下，让弹窗关闭动画完成
    }
  }

  return {
    hasSeenDownloadModal,
    closeDownloadModal
  }
}

