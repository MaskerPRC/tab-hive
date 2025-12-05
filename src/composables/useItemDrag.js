/**
 * 卡片拖拽相关的可组合函数
 * 处理网格项目的拖拽移动逻辑
 */
import { ref } from 'vue'
import { performCollisionPush } from './collisionPushAlgorithm'

export function useItemDrag(itemPositions, itemSizes, snapToGrid, checkCollisionWithOthers, isMovingAway, websites = null) {
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

    // 移除边界限制，允许移动到负坐标（无限画布）
    const newX = dragStartItemPos.value.x + deltaX
    const newY = dragStartItemPos.value.y + deltaY

    const currentSize = itemSizes.value[currentDragIndex.value] || { width: 400, height: 300 }

    // 使用实际的网站数量而不是位置映射的键数量
    const actualTotalItems = websites?.value?.length || 0
    
    // 检测碰撞
    const hasCollision = checkCollisionWithOthers(
      currentDragIndex.value,
      { x: newX, y: newY },
      currentSize,
      itemPositions.value,
      itemSizes.value,
      actualTotalItems,
      websites?.value || null
    )
    
    const currentPos = itemPositions.value[currentDragIndex.value]
    const movingAway = isMovingAway(
      currentDragIndex.value,
      currentPos,
      { x: newX, y: newY },
      itemPositions.value,
      itemSizes.value,
      currentSize,
      actualTotalItems,
      websites?.value || null
    )

    isColliding.value = hasCollision

    // 先更新当前蜂巢的位置
    itemPositions.value[currentDragIndex.value] = { x: newX, y: newY }

    // 如果有碰撞且不是在远离，执行推开算法（拖拽时推开力度较小，仅轻微推开）
    if (hasCollision && !movingAway) {
      console.log('[拖拽] 检测到碰撞，执行推开算法', {
        index: currentDragIndex.value,
        hasCollision,
        movingAway,
        newPos: { x: newX, y: newY },
        currentSize
      })

      // 执行碰撞推开算法
      const newPositions = performCollisionPush(
        currentDragIndex.value,
        { x: newX, y: newY },
        currentSize,
        itemPositions.value,
        itemSizes.value,
        actualTotalItems,
        0,
        websites?.value || null
      )

      console.log('[拖拽] 推开算法完成，更新位置', {
        oldPositions: itemPositions.value,
        newPositions
      })

      // 更新所有蜂巢的位置
      itemPositions.value = { ...newPositions }
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

