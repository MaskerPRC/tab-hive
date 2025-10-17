/**
 * 卡片拖拽相关的可组合函数
 * 处理网格项目的拖拽移动逻辑
 */
import { ref } from 'vue'

export function useItemDrag(itemPositions, itemSizes, snapToGrid, checkCollisionWithOthers, isMovingAway) {
  const isDraggingItem = ref(false)
  const dragStartPos = ref({ x: 0, y: 0 })
  const dragStartItemPos = ref({ x: 0, y: 0 })
  const currentDragIndex = ref(-1)
  const isColliding = ref(false)

  /**
   * 开始拖拽项目
   */
  const startDrag = (event, index, totalItems) => {
    // 检查是否点击了调整大小的手柄
    if (event.target.classList.contains('resize-handle')) {
      return
    }

    // 检查是否点击了表单元素或其内部
    const target = event.target
    if (target.closest('.add-website-form') ||
        target.classList.contains('add-website-form') ||
        target.tagName === 'INPUT' ||
        target.tagName === 'BUTTON' ||
        target.closest('.floating-actions')) {
      return
    }

    event.preventDefault()
    event.stopPropagation()

    isDraggingItem.value = true
    currentDragIndex.value = index

    // 给 body 添加类，全局禁用 iframe
    document.body.classList.add('dragging-item')

    const clientX = event.type === 'touchstart' ? event.touches[0].clientX : event.clientX
    const clientY = event.type === 'touchstart' ? event.touches[0].clientY : event.clientY

    dragStartPos.value = { x: clientX, y: clientY }
    dragStartItemPos.value = { ...itemPositions.value[index] }

    document.addEventListener('mousemove', handleDragMove, { passive: false })
    document.addEventListener('mouseup', handleDragEnd)
    document.addEventListener('touchmove', handleDragMove, { passive: false })
    document.addEventListener('touchend', handleDragEnd)
  }

  /**
   * 处理拖拽移动
   */
  const handleDragMove = (event) => {
    if (!isDraggingItem.value) return

    event.preventDefault()
    event.stopPropagation()

    const clientX = event.type === 'touchmove' ? event.touches[0].clientX : event.clientX
    const clientY = event.type === 'touchmove' ? event.touches[0].clientY : event.clientY

    const deltaX = clientX - dragStartPos.value.x
    const deltaY = clientY - dragStartPos.value.y

    const newX = Math.max(0, dragStartItemPos.value.x + deltaX)
    const newY = Math.max(0, dragStartItemPos.value.y + deltaY)

    const currentSize = itemSizes.value[currentDragIndex.value] || { width: 400, height: 300 }

    // 检测碰撞
    const hasCollision = checkCollisionWithOthers(
      currentDragIndex.value,
      { x: newX, y: newY },
      currentSize,
      itemPositions.value,
      itemSizes.value,
      Object.keys(itemPositions.value).length
    )
    
    const currentPos = itemPositions.value[currentDragIndex.value]
    const movingAway = isMovingAway(
      currentDragIndex.value,
      currentPos,
      { x: newX, y: newY },
      itemPositions.value,
      itemSizes.value,
      currentSize,
      Object.keys(itemPositions.value).length
    )

    isColliding.value = hasCollision

    // 如果没有碰撞，或者正在远离碰撞（解除重叠），允许移动
    if (!hasCollision || movingAway) {
      itemPositions.value[currentDragIndex.value] = { x: newX, y: newY }
    }
  }

  /**
   * 处理拖拽结束
   */
  const handleDragEnd = (emit) => {
    if (isDraggingItem.value && currentDragIndex.value !== -1) {
      // 吸附到网格
      const currentPos = itemPositions.value[currentDragIndex.value]
      if (currentPos) {
        const snappedPos = {
          x: snapToGrid(currentPos.x),
          y: snapToGrid(currentPos.y)
        }
        itemPositions.value[currentDragIndex.value] = snappedPos

        // 保存位置到数据中
        if (emit) {
          emit('update-website', {
            index: currentDragIndex.value,
            position: snappedPos
          })
        }
      }
    }

    // 移除 body 类，恢复 iframe 交互
    document.body.classList.remove('dragging-item')

    isDraggingItem.value = false
    isColliding.value = false
    currentDragIndex.value = -1

    document.removeEventListener('mousemove', handleDragMove)
    document.removeEventListener('mouseup', handleDragEnd)
    document.removeEventListener('touchmove', handleDragMove)
    document.removeEventListener('touchend', handleDragEnd)
  }

  return {
    isDraggingItem,
    currentDragIndex,
    isColliding,
    startDrag,
    handleDragEnd
  }
}

