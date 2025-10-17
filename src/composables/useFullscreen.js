/**
 * 全屏模式相关的可组合函数
 * 处理全屏显示和退出逻辑
 */
import { ref, watch } from 'vue'

export function useFullscreen(fullscreenIndex) {
  const showFullscreenBar = ref(false)
  let hideTimer = null

  /**
   * 监听全屏状态变化
   */
  watch(() => fullscreenIndex.value, (newVal, oldVal) => {
    // 进入全屏时自动显示按钮条
    if (newVal !== null && oldVal === null) {
      showFullscreenBar.value = true

      // 清除之前的定时器
      if (hideTimer) {
        clearTimeout(hideTimer)
      }

      // 2秒后自动隐藏
      hideTimer = setTimeout(() => {
        showFullscreenBar.value = false
      }, 2000)
    }
    // 退出全屏时清除定时器
    else if (newVal === null) {
      showFullscreenBar.value = false
      if (hideTimer) {
        clearTimeout(hideTimer)
      }
    }
  })

  /**
   * 处理网格鼠标移动（用于全屏模式下显示/隐藏按钮条）
   */
  const handleGridMouseMove = (event) => {
    // 全屏模式下的逻辑
    if (fullscreenIndex.value !== null) {
      // 鼠标在顶部5px区域时显示退出按钮
      if (event.clientY < 5) {
        // 清除自动隐藏定时器
        if (hideTimer) {
          clearTimeout(hideTimer)
          hideTimer = null
        }
        showFullscreenBar.value = true
      }
      // 鼠标离开顶部60px区域时隐藏（给按钮条一些空间）
      else if (event.clientY > 60) {
        showFullscreenBar.value = false
      }
    }
  }

  /**
   * 处理全屏按钮条离开
   */
  const handleFullscreenBarLeave = () => {
    showFullscreenBar.value = false
  }

  /**
   * 清理定时器
   */
  const cleanup = () => {
    if (hideTimer) {
      clearTimeout(hideTimer)
    }
  }

  return {
    showFullscreenBar,
    handleGridMouseMove,
    handleFullscreenBarLeave,
    cleanup
  }
}

