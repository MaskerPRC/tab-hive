/**
 * useDrag - 通用拖拽功能composable
 * 提供可拖拽元素的位置管理和事件处理
 */
import { ref, reactive, onUnmounted } from 'vue'

export function useDrag(initialPosition = { x: 0, y: 0 }) {
  const isDragging = ref(false)
  const position = reactive({ ...initialPosition })
  const dragStart = reactive({
    x: 0,
    y: 0,
    posX: 0,
    posY: 0
  })

  const startDrag = (event) => {
    isDragging.value = true
    dragStart.x = event.clientX
    dragStart.y = event.clientY
    dragStart.posX = position.x
    dragStart.posY = position.y
    
    document.addEventListener('mousemove', onDrag)
    document.addEventListener('mouseup', stopDrag)
  }

  const onDrag = (event) => {
    if (!isDragging.value) return
    
    const deltaX = event.clientX - dragStart.x
    const deltaY = event.clientY - dragStart.y
    
    position.x = dragStart.posX + deltaX
    position.y = dragStart.posY + deltaY
    
    // 限制在视口内
    const maxX = window.innerWidth - 380 - 20
    const maxY = window.innerHeight - 200
    
    position.x = Math.max(20, Math.min(position.x, maxX))
    position.y = Math.max(20, Math.min(position.y, maxY))
  }

  const stopDrag = () => {
    isDragging.value = false
    document.removeEventListener('mousemove', onDrag)
    document.removeEventListener('mouseup', stopDrag)
  }

  const setPosition = (x, y) => {
    position.x = x
    position.y = y
  }

  // 清理
  onUnmounted(() => {
    if (isDragging.value) {
      stopDrag()
    }
  })

  return {
    isDragging,
    position,
    startDrag,
    setPosition
  }
}

