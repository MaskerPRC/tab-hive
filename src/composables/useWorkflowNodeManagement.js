/**
 * 工作流节点管理 Composable
 * 管理工作流节点的创建、拖拽、交互和右键菜单
 */
import { ref } from 'vue'
import { createTriggerNode, createHttpNode, createSetNode, createWebActionNode } from '../models/workflowModels'

/**
 * @param {Object} options
 * @param {Ref<Array>} options.workflowNodes - 工作流节点列表
 * @param {Object} options.props - 组件 props（需要 canvasTransform）
 * @param {Ref<String>} options.viewMode - 当前视图模式
 * @param {Function} options.originalHandleContextMenu - 原始右键菜单处理函数
 * @param {Function} options.startConnection - 开始连接的函数（来自 useWorkflowConnections）
 * @param {Function} options.getNodePortPosition - 获取节点端口位置的函数（来自 useWorkflowConnections）
 */
export function useWorkflowNodeManagement({ workflowNodes, props, viewMode, originalHandleContextMenu, startConnection, getNodePortPosition }) {
  // ==================== 右键菜单 ====================
  const automationContextMenuVisible = ref(false)
  const automationContextMenuX = ref(0)
  const automationContextMenuY = ref(0)
  const contextMenuClickPosition = ref({ x: 0, y: 0 }) // 右键点击位置，用于放置新节点

  // 处理自动化视图的右键菜单
  const handleAutomationContextMenu = (event) => {
    if (viewMode.value !== 'automation') return

    // 检查是否点击在网站卡片上
    if (event.target.closest('.grid-item') ||
        event.target.closest('webview') ||
        event.target.closest('iframe')) {
      return
    }

    event.preventDefault()
    contextMenuClickPosition.value = {
      x: event.clientX,
      y: event.clientY
    }

    // 转换为画布坐标
    const canvasWrapper = document.querySelector('.canvas-wrapper')
    if (canvasWrapper) {
      const canvasRect = canvasWrapper.getBoundingClientRect()
      const transform = props.canvasTransform || { x: 0, y: 0, zoom: 1 }
      automationContextMenuX.value = event.clientX
      automationContextMenuY.value = event.clientY
      automationContextMenuVisible.value = true
    }
  }

  // 关闭自动化视图右键菜单
  const closeAutomationContextMenu = () => {
    automationContextMenuVisible.value = false
  }

  // 获取画布坐标（从屏幕坐标转换）
  const getCanvasPosition = (screenX, screenY) => {
    const canvasWrapper = document.querySelector('.canvas-wrapper')
    if (!canvasWrapper) return { x: 0, y: 0 }

    const canvasRect = canvasWrapper.getBoundingClientRect()
    const transform = props.canvasTransform || { x: 0, y: 0, zoom: 1 }

    return {
      x: (screenX - canvasRect.left) / transform.zoom - transform.x,
      y: (screenY - canvasRect.top) / transform.zoom - transform.y
    }
  }

  // ==================== 节点创建 ====================

  // 添加触发器节点
  const handleAddTriggerNode = () => {
    const canvasPos = getCanvasPosition(contextMenuClickPosition.value.x, contextMenuClickPosition.value.y)
    const node = createTriggerNode(canvasPos)
    workflowNodes.value.push(node)
    console.log('[GridView] 添加触发器节点:', node)
  }

  // 添加 HTTP 节点
  const handleAddHttpNode = () => {
    const canvasPos = getCanvasPosition(contextMenuClickPosition.value.x, contextMenuClickPosition.value.y)
    const node = createHttpNode(canvasPos)
    workflowNodes.value.push(node)
    console.log('[GridView] 添加 HTTP 节点:', node)
  }

  // 添加 Set 数据节点
  const handleAddSetNode = () => {
    const canvasPos = getCanvasPosition(contextMenuClickPosition.value.x, contextMenuClickPosition.value.y)
    const node = createSetNode(canvasPos)
    workflowNodes.value.push(node)
    console.log('[GridView] 添加 Set 数据节点:', node)
  }

  // 添加网页操作节点
  const handleAddWebActionNode = () => {
    const canvasPos = getCanvasPosition(contextMenuClickPosition.value.x, contextMenuClickPosition.value.y)
    const node = createWebActionNode(canvasPos)
    workflowNodes.value.push(node)
    console.log('[GridView] 添加网页操作节点:', node)
  }

  // 修改原有的 handleContextMenu，在自动化视图下使用新的菜单
  const handleContextMenu = (event) => {
    if (viewMode.value === 'automation') {
      handleAutomationContextMenu(event)
    } else {
      originalHandleContextMenu(event)
    }
  }

  // ==================== 节点交互 ====================
  const selectedNodeId = ref(null)
  const draggingNode = ref(null)
  const dragStartPos = ref({ x: 0, y: 0 })

  // 节点鼠标按下（开始拖拽）
  const handleNodeMouseDown = (event, node) => {
    selectedNodeId.value = node.id
    draggingNode.value = node
    const canvasWrapper = document.querySelector('.canvas-wrapper')
    if (canvasWrapper) {
      const canvasRect = canvasWrapper.getBoundingClientRect()
      const transform = props.canvasTransform || { x: 0, y: 0, zoom: 1 }
      dragStartPos.value = {
        x: (event.clientX - canvasRect.left) / transform.zoom - transform.x - node.position.x,
        y: (event.clientY - canvasRect.top) / transform.zoom - transform.y - node.position.y
      }
    }

    const handleMouseMove = (e) => {
      if (draggingNode.value) {
        const canvasWrapper = document.querySelector('.canvas-wrapper')
        if (canvasWrapper) {
          const canvasRect = canvasWrapper.getBoundingClientRect()
          const transform = props.canvasTransform || { x: 0, y: 0, zoom: 1 }
          draggingNode.value.position = {
            x: (e.clientX - canvasRect.left) / transform.zoom - transform.x - dragStartPos.value.x,
            y: (e.clientY - canvasRect.top) / transform.zoom - transform.y - dragStartPos.value.y
          }
        }
      }
    }

    const handleMouseUp = () => {
      draggingNode.value = null
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }

    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
  }

  // 节点点击
  const handleNodeClick = (event, node) => {
    selectedNodeId.value = node.id
  }

  // 节点端点鼠标按下（开始连接）
  const handleNodePortMouseDown = (event, node, port, direction) => {
    const portPos = getNodePortPosition(node, port, direction)
    if (!portPos) return

    startConnection({
      nodeId: node.id,
      portId: port.id,
      portType: port.portType || 'execution',
      direction: direction,
      x: portPos.x,
      y: portPos.y,
      isNodePort: true
    })
  }

  return {
    // 右键菜单
    automationContextMenuVisible,
    automationContextMenuX,
    automationContextMenuY,
    closeAutomationContextMenu,
    handleContextMenu,
    // 节点创建
    handleAddTriggerNode,
    handleAddHttpNode,
    handleAddSetNode,
    handleAddWebActionNode,
    // 节点交互
    selectedNodeId,
    handleNodeMouseDown,
    handleNodeClick,
    handleNodePortMouseDown
  }
}
