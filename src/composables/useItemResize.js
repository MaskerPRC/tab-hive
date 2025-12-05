/**
 * 卡片调整大小相关的可组合函数
 * 处理网格项目的尺寸调整逻辑
 */
import { ref } from 'vue'
import { performCollisionPush } from './collisionPushAlgorithm'

export function useItemResize(itemPositions, itemSizes, snapToGrid, checkCollisionWithOthers, websites, canvasTransform = null) {
  const isResizing = ref(false)
  const resizeHandle = ref('')
  const dragStartPos = ref({ x: 0, y: 0 })
  const dragStartItemPos = ref({ x: 0, y: 0 })
  const currentDragIndex = ref(-1)
  const isColliding = ref(false)

  // 最小可调整尺寸：确保用户能够找到边框并继续调整大小
  const MIN_WIDTH = 200  // 最小宽度 200px
  const MIN_HEIGHT = 150  // 最小高度 150px

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

    // 考虑画布缩放：鼠标移动距离需要除以缩放比例才能得到画布上的实际移动距离
    const zoom = canvasTransform?.value?.zoom || 1
    const scaledDeltaX = deltaX / zoom
    const scaledDeltaY = deltaY / zoom

    const currentSize = itemSizes.value[currentDragIndex.value] || { width: 300, height: 200 }
    let newWidth = currentSize.width
    let newHeight = currentSize.height

    if (resizeHandle.value.includes('e')) {
      newWidth = Math.max(MIN_WIDTH, dragStartItemPos.value.width + scaledDeltaX)
    }
    if (resizeHandle.value.includes('s')) {
      newHeight = Math.max(MIN_HEIGHT, dragStartItemPos.value.height + scaledDeltaY)
    }

    const currentPos = itemPositions.value[currentDragIndex.value] || { x: 0, y: 0 }

    // 使用实际的网站数量而不是位置映射的键数量
    const actualTotalItems = websites?.value?.length || 0

    // 检测碰撞
    const hasCollision = checkCollisionWithOthers(
      currentDragIndex.value,
      currentPos,
      { width: newWidth, height: newHeight },
      itemPositions.value,
      itemSizes.value,
      actualTotalItems,
      websites?.value || null
    )

    // 对于调整大小，检测是否在缩小（缩小总是允许的，因为可能在解除重叠）
    const currentSizeVal = itemSizes.value[currentDragIndex.value] || { width: 300, height: 200 }
    const isShrinking = newWidth < currentSizeVal.width || newHeight < currentSizeVal.height
    const isGrowing = newWidth > currentSizeVal.width || newHeight > currentSizeVal.height

    // 检查当前项目是否有选择器（选择器类型的iframe可以自由调整大小）
    const hasSelector = websites?.value?.[currentDragIndex.value]?.targetSelector
    
    isColliding.value = hasCollision

    // 先更新当前视界的尺寸
    itemSizes.value[currentDragIndex.value] = { width: newWidth, height: newHeight }

    // 如果正在放大且有碰撞，执行推开算法
    if (hasCollision && isGrowing && !hasSelector) {
      console.log('[调整大小] 检测到碰撞，执行推开算法', {
        index: currentDragIndex.value,
        hasCollision,
        isGrowing,
        isShrinking,
        hasSelector,
        currentPos,
        newSize: { width: newWidth, height: newHeight }
      })

      // 执行碰撞推开算法
      const newPositions = performCollisionPush(
        currentDragIndex.value,
        currentPos,
        { width: newWidth, height: newHeight },
        itemPositions.value,
        itemSizes.value,
        actualTotalItems,
        0,
        websites?.value || null
      )

      console.log('[调整大小] 推开算法完成，更新位置', {
        oldPositions: itemPositions.value,
        newPositions
      })

      // 更新所有视界的位置
      itemPositions.value = { ...newPositions }
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
          width: Math.max(MIN_WIDTH, snapToGrid(currentSize.width)),
          height: Math.max(MIN_HEIGHT, snapToGrid(currentSize.height))
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

