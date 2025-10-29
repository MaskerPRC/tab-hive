import { ref } from 'vue'

/**
 * 弹窗遮罩层点击处理
 * 确保只有当鼠标按下和释放都在遮罩层上时才关闭弹窗
 */
export function useOverlayClick(onClose) {
  const mouseDownOnOverlay = ref(false)

  /**
   * 处理鼠标按下事件
   */
  const handleOverlayMouseDown = (event) => {
    // 只有当直接点击 overlay 时才标记
    if (event.target === event.currentTarget) {
      mouseDownOnOverlay.value = true
    } else {
      mouseDownOnOverlay.value = false
    }
  }

  /**
   * 处理点击事件
   */
  const handleOverlayClick = (event) => {
    // 只有当 mousedown 和 click 都发生在 overlay 上时才关闭
    if (event.target === event.currentTarget && mouseDownOnOverlay.value) {
      onClose()
    }
    mouseDownOnOverlay.value = false
  }

  return {
    handleOverlayMouseDown,
    handleOverlayClick
  }
}

