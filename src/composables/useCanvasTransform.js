/**
 * 画布变换相关的可组合函数
 * 处理画布的平移和缩放功能
 */
import { ref } from 'vue'

export function useCanvasTransform(initialTransform = null) {
  // 画布变换状态
  const canvasTransform = ref(
    initialTransform || {
      x: 0,      // 平移 X
      y: 0,      // 平移 Y
      zoom: 1    // 缩放比例
    }
  )

  // 是否正在拖动画布
  const isPanning = ref(false)
  const panStartPos = ref({ x: 0, y: 0 })
  const panStartTransform = ref({ x: 0, y: 0 })
  
  // 使用 requestAnimationFrame 优化性能
  let rafId = null
  let pendingTransform = null

  /**
   * 开始拖动画布
   */
  const startPan = (event) => {
    // 如果点击的是网站卡片或其他可交互元素，不启动画布平移
    const target = event.target
    if (target.closest('.grid-item') || 
        target.closest('.btn-add-website-float') ||
        target.closest('.canvas-controls')) {
      return false
    }

    event.preventDefault()
    event.stopPropagation()

    isPanning.value = true

    const clientX = event.type === 'touchstart' ? event.touches[0].clientX : event.clientX
    const clientY = event.type === 'touchstart' ? event.touches[0].clientY : event.clientY

    panStartPos.value = { x: clientX, y: clientY }
    panStartTransform.value = { ...canvasTransform.value }
    
    // 取消之前的动画帧
    if (rafId !== null) {
      cancelAnimationFrame(rafId)
      rafId = null
    }

    document.addEventListener('mousemove', handlePanMove, { passive: false })
    document.addEventListener('mouseup', handlePanEnd)
    document.addEventListener('touchmove', handlePanMove, { passive: false })
    document.addEventListener('touchend', handlePanEnd)

    return true
  }

  /**
   * 处理画布平移移动（使用 requestAnimationFrame 优化）
   */
  const handlePanMove = (event) => {
    if (!isPanning.value) return

    event.preventDefault()
    event.stopPropagation()

    const clientX = event.type === 'touchmove' ? event.touches[0].clientX : event.clientX
    const clientY = event.type === 'touchmove' ? event.touches[0].clientY : event.clientY

    const deltaX = clientX - panStartPos.value.x
    const deltaY = clientY - panStartPos.value.y

    // 保存待更新的变换值
    pendingTransform = {
      x: panStartTransform.value.x + deltaX,
      y: panStartTransform.value.y + deltaY,
      zoom: panStartTransform.value.zoom
    }

    // 使用 requestAnimationFrame 批量更新，避免频繁触发响应式更新
    if (rafId === null) {
      rafId = requestAnimationFrame(() => {
        if (pendingTransform) {
          canvasTransform.value = pendingTransform
          pendingTransform = null
        }
        rafId = null
      })
    }
  }

  /**
   * 处理画布平移结束
   */
  const handlePanEnd = () => {
    isPanning.value = false

    // 确保最后一次更新被应用
    if (rafId !== null) {
      cancelAnimationFrame(rafId)
      rafId = null
    }
    if (pendingTransform) {
      canvasTransform.value = pendingTransform
      pendingTransform = null
    }

    document.removeEventListener('mousemove', handlePanMove)
    document.removeEventListener('mouseup', handlePanEnd)
    document.removeEventListener('touchmove', handlePanMove)
    document.removeEventListener('touchend', handlePanEnd)
  }

  /**
   * 处理鼠标滚轮缩放
   */
  const handleWheelZoom = (event) => {
    // 如果鼠标在网站卡片上，不缩放画布
    if (event.target.closest('.grid-item')) {
      return
    }

    event.preventDefault()

    const delta = event.deltaY > 0 ? -0.1 : 0.1
    const newZoom = Math.max(0.1, Math.min(3, canvasTransform.value.zoom + delta))

    // 计算缩放中心点（鼠标位置）
    // 使用 currentTarget 或 target 的父容器（canvas-wrapper）
    const canvasWrapper = event.currentTarget || event.target.closest('.canvas-wrapper')
    if (!canvasWrapper) return

    const rect = canvasWrapper.getBoundingClientRect()
    const mouseX = event.clientX - rect.left
    const mouseY = event.clientY - rect.top

    // 计算缩放前后的坐标差异
    const zoomRatio = newZoom / canvasTransform.value.zoom
    const offsetX = (mouseX - canvasTransform.value.x) * (1 - zoomRatio)
    const offsetY = (mouseY - canvasTransform.value.y) * (1 - zoomRatio)

    canvasTransform.value = {
      x: canvasTransform.value.x + offsetX,
      y: canvasTransform.value.y + offsetY,
      zoom: newZoom
    }
  }

  /**
   * 设置缩放级别
   */
  const setZoom = (zoom) => {
    const newZoom = Math.max(0.1, Math.min(3, zoom))
    canvasTransform.value = {
      ...canvasTransform.value,
      zoom: newZoom
    }
  }

  /**
   * 重置画布变换
   */
  const resetTransform = () => {
    canvasTransform.value = {
      x: 0,
      y: 0,
      zoom: 1
    }
  }

  /**
   * 获取画布变换样式
   */
  const getTransformStyle = () => {
    // 确保 canvasTransform 已初始化
    if (!canvasTransform.value) {
      return {
        transform: 'translate(0px, 0px) scale(1)',
        transformOrigin: '0 0',
        '--canvas-zoom': 1,
        '--counter-zoom': 1
      }
    }
    const zoom = canvasTransform.value.zoom
    return {
      transform: `translate(${canvasTransform.value.x}px, ${canvasTransform.value.y}px) scale(${zoom})`,
      transformOrigin: '0 0',
      '--canvas-zoom': zoom,
      '--counter-zoom': 1 / zoom
    }
  }

  return {
    canvasTransform,
    isPanning,
    startPan,
    handleWheelZoom,
    setZoom,
    resetTransform,
    getTransformStyle
  }
}

