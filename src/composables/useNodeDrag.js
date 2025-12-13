/**
 * useNodeDrag - 工作流节点拖拽功能
 * 提供节点拖拽的状态管理和事件处理
 */
import { ref } from 'vue'

export function useNodeDrag() {
  const draggingNode = ref(null)
  const dragOffset = ref({ x: 0, y: 0 })

  const startDragNode = (event, node, canvasArea) => {
    // 如果点击的是端口，不启动节点拖拽
    if (event.target.closest('.port-dot')) return

    draggingNode.value = node
    const rect = event.target.closest('.workflow-node').getBoundingClientRect()
    dragOffset.value = {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top
    }
  }

  const handleNodeDrag = (event, canvasArea) => {
    if (draggingNode.value && canvasArea) {
      const canvasRect = canvasArea.getBoundingClientRect()
      draggingNode.value.position = {
        x: event.clientX - canvasRect.left - dragOffset.value.x,
        y: event.clientY - canvasRect.top - dragOffset.value.y
      }
    }
  }

  const stopNodeDrag = (onSave) => {
    if (draggingNode.value) {
      if (onSave) onSave()
      draggingNode.value = null
    }
  }

  return {
    draggingNode,
    dragOffset,
    startDragNode,
    handleNodeDrag,
    stopNodeDrag
  }
}

