/**
 * 卡片调整大小相关的可组合函数
 * 处理网格项目的尺寸调整逻辑
 */
import { ref } from 'vue'

export function useItemResize(itemPositions, itemSizes, snapToGrid, checkCollisionWithOthers, websites) {
  const isResizing = ref(false)
  const resizeHandle = ref('')
  const dragStartPos = ref({ x: 0, y: 0 })
  const dragStartItemPos = ref({ x: 0, y: 0 })
  const currentDragIndex = ref(-1)
  const isColliding = ref(false)

  /**
   * 开始调整大小
   */
  const startResize = (event, index, handle) => {
    event.preventDefault()
    event.stopPropagation()

    isResizing.value = true
    resizeHandle.value = handle
    currentDragIndex.value = index

    // 给 body 添加类，全局禁用 iframe
    document.body.classList.add('resizing-item')

    const clientX = event.type === 'touchstart' ? event.touches[0].clientX : event.clientX
    const clientY = event.type === 'touchstart' ? event.touches[0].clientY : event.clientY

    dragStartPos.value = { x: clientX, y: clientY }
    dragStartItemPos.value = { ...itemPositions.value[index] }

    const currentSize = itemSizes.value[index] || { width: 300, height: 200 }
    dragStartItemPos.value = { ...dragStartItemPos.value, ...currentSize }

    document.addEventListener('mousemove', handleResizeMove, { passive: false })
    document.addEventListener('mouseup', handleResizeEnd)
    document.addEventListener('touchmove', handleResizeMove, { passive: false })
    document.addEventListener('touchend', handleResizeEnd)
  }

  /**
   * 处理调整大小移动
   */
  const handleResizeMove = (event) => {
    if (!isResizing.value) return

    event.preventDefault()
    event.stopPropagation()

    const clientX = event.type === 'touchmove' ? event.touches[0].clientX : event.clientX
    const clientY = event.type === 'touchmove' ? event.touches[0].clientY : event.clientY

    const deltaX = clientX - dragStartPos.value.x
    const deltaY = clientY - dragStartPos.value.y

    const currentSize = itemSizes.value[currentDragIndex.value] || { width: 300, height: 200 }
    let newWidth = currentSize.width
    let newHeight = currentSize.height

    if (resizeHandle.value.includes('e')) {
      newWidth = Math.max(200, dragStartItemPos.value.width + deltaX)
    }
    if (resizeHandle.value.includes('s')) {
      newHeight = Math.max(150, dragStartItemPos.value.height + deltaY)
    }

    const currentPos = itemPositions.value[currentDragIndex.value] || { x: 0, y: 0 }

    // 检测碰撞
    const hasCollision = checkCollisionWithOthers(
      currentDragIndex.value,
      currentPos,
      { width: newWidth, height: newHeight },
      itemPositions.value,
      itemSizes.value,
      Object.keys(itemPositions.value).length
    )

    // 对于调整大小，检测是否在缩小（缩小总是允许的，因为可能在解除重叠）
    const currentSizeVal = itemSizes.value[currentDragIndex.value] || { width: 300, height: 200 }
    const isShrinking = newWidth < currentSizeVal.width || newHeight < currentSizeVal.height

    // 检查当前项目是否有选择器（选择器类型的iframe可以自由调整大小）
    const hasSelector = websites?.value?.[currentDragIndex.value]?.targetSelector
    
    isColliding.value = hasCollision

    // 如果没有碰撞，或者正在缩小（解除重叠），或者有选择器（选择器iframe可以自由调整），允许调整
    if (!hasCollision || isShrinking || hasSelector) {
      itemSizes.value[currentDragIndex.value] = { width: newWidth, height: newHeight }
    }
  }

  /**
   * 处理调整大小结束
   */
  const handleResizeEnd = (emit) => {
    if (isResizing.value && currentDragIndex.value !== -1) {
      // 吸附到网格
      const currentSize = itemSizes.value[currentDragIndex.value]
      if (currentSize) {
        const snappedSize = {
          width: snapToGrid(currentSize.width),
          height: snapToGrid(currentSize.height)
        }
        itemSizes.value[currentDragIndex.value] = snappedSize

        // 保存大小到数据中
        if (emit) {
          emit('update-website', {
            index: currentDragIndex.value,
            size: snappedSize
          })
        }
      }
    }

    // 移除 body 类，恢复 iframe 交互
    document.body.classList.remove('resizing-item')

    isResizing.value = false
    isColliding.value = false
    resizeHandle.value = ''
    currentDragIndex.value = -1

    document.removeEventListener('mousemove', handleResizeMove)
    document.removeEventListener('mouseup', handleResizeEnd)
    document.removeEventListener('touchmove', handleResizeMove)
    document.removeEventListener('touchend', handleResizeEnd)
  }

  return {
    isResizing,
    currentDragIndex,
    isColliding,
    startResize,
    handleResizeEnd
  }
}

