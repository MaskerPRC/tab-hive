/**
 * 更新检测处理器
 * 负责处理应用更新的各种操作
 */

export function useUpdateHandlers(updateChecker) {
  // 显示更新通知（从按钮点击）
  const handleShowUpdate = () => {
    updateChecker.showNotificationFromButton()
  }

  // 关闭更新通知
  const handleCloseUpdateNotification = () => {
    updateChecker.closeNotification()
  }

  // 忽略更新
  const handleIgnoreUpdate = () => {
    updateChecker.ignoreUpdate()
  }

  // 开始下载
  const handleStartDownload = () => {
    updateChecker.startDownload()
  }

  // 安装更新
  const handleInstallUpdate = (filePath) => {
    updateChecker.openInstaller(filePath)
  }

  // 取消下载
  const handleCancelDownload = () => {
    updateChecker.cancelDownload()
  }

  // 重试下载
  const handleRetryDownload = () => {
    updateChecker.retryDownload()
  }

  return {
    handleShowUpdate,
    handleCloseUpdateNotification,
    handleIgnoreUpdate,
    handleStartDownload,
    handleInstallUpdate,
    handleCancelDownload,
    handleRetryDownload
  }
}

