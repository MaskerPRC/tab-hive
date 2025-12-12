/**
 * 画布事件处理器
 * 处理画布的鼠标事件、滚轮缩放、右键菜单等
 */

export function useCanvasEventHandlers(props, {
  isDraggingItem,
  isResizing,
  isDrawingMode,
  startPan,
  handleWheelZoom,
  setZoom,
  resetCanvasTransform,
  canvasTransform
}) {
  /**
   * 处理画布鼠标按下（开始平移或绘制）
   */
  const handleCanvasMouseDown = (event) => {
    if (props.fullscreenIndex !== null) return
    if (isDraggingItem.value || isResizing.value) return

    const target = event.target
    if (target.closest('.grid-item') || 
        target.closest('.btn-add-website-float') || 
        target.closest('.canvas-controls') ||
        target.closest('.drawing-toolbar')) {
      return
    }

    // 中键点击或绘制模式
    if (event.button === 1) {
      startPan(event)
      return
    }

    if (isDrawingMode.value && event.button === 0) {
      return
    }

    startPan(event)
  }

  /**
   * 处理右键菜单事件
   */
  const handleContextMenu = (event) => {
    const target = event.target
    if (target.closest('webview') || 
        target.closest('iframe') || 
        target.closest('.grid-item')) {
      return
    }
    event.preventDefault()
  }

  /**
   * 处理画布滚轮（缩放）
   */
  const handleCanvasWheel = (event) => {
    if (props.fullscreenIndex !== null) return
    if (isDraggingItem.value || isResizing.value) return
    handleWheelZoom(event)
  }

  /**
   * 放大画布
   */
  const zoomIn = () => setZoom(canvasTransform.value.zoom + 0.1)

  /**
   * 缩小画布
   */
  const zoomOut = () => setZoom(canvasTransform.value.zoom - 0.1)

  /**
   * 重置画布变换
   */
  const resetTransform = () => resetCanvasTransform()

  return {
    handleCanvasMouseDown,
    handleContextMenu,
    handleCanvasWheel,
    zoomIn,
    zoomOut,
    resetTransform
  }
}

