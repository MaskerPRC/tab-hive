/**
 * useConnectionDrag - 工作流连接线拖拽功能
 * 提供连接线创建的拖拽状态管理和事件处理
 */
import { ref } from 'vue'

export function useConnectionDrag() {
  const draggingConnection = ref(null)

  const startConnection = (event, nodeId, portId, portType, canvasArea) => {
    event.stopPropagation()

    const rect = event.target.getBoundingClientRect()
    const canvasRect = canvasArea.getBoundingClientRect()

    draggingConnection.value = {
      fromNodeId: nodeId,
      fromPortId: portId,
      fromPortType: portType,
      startX: rect.left + rect.width / 2 - canvasRect.left,
      startY: rect.top + rect.height / 2 - canvasRect.top,
      endX: rect.left + rect.width / 2 - canvasRect.left,
      endY: rect.top + rect.height / 2 - canvasRect.top
    }
  }

  const handleConnectionDrag = (event, canvasArea) => {
    if (draggingConnection.value && canvasArea) {
      const canvasRect = canvasArea.getBoundingClientRect()
      draggingConnection.value.endX = event.clientX - canvasRect.left
      draggingConnection.value.endY = event.clientY - canvasRect.top
    }
  }

  const stopConnection = (event, onCreateConnection) => {
    if (draggingConnection.value) {
      // 检查是否释放在端口上
      const target = event.target.closest('.port-dot')
      if (target && onCreateConnection) {
        const toNodeId = target.dataset.nodeId
        const toPortId = target.dataset.portId
        const toPortType = target.dataset.portType

        onCreateConnection(
          draggingConnection.value.fromNodeId,
          draggingConnection.value.fromPortId,
          draggingConnection.value.fromPortType,
          toNodeId,
          toPortId,
          toPortType
        )
      }

      draggingConnection.value = null
    }
  }

  return {
    draggingConnection,
    startConnection,
    handleConnectionDrag,
    stopConnection
  }
}

