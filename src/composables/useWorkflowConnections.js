/**
 * 工作流连接线 Composable
 * 管理节点/网站之间的连接线绘制、端点位置计算、连接交互
 */
import { ref, computed, watch } from 'vue'

/**
 * @param {Object} options
 * @param {Ref<Array>} options.workflowNodes - 工作流节点列表
 * @param {Object} options.props - 组件 props（需要 canvasTransform）
 * @param {Object} options.automationData - useAutomationData() 返回的实例
 * @param {Ref<Array>} options.allWebsites - 所有网站列表
 * @param {Ref<Boolean>} options.automationSelectingElement - 是否正在选择元素
 */
export function useWorkflowConnections({ workflowNodes, props, automationData, allWebsites, automationSelectingElement }) {
  const isConnecting = ref(false)
  const connectingPort = ref(null) // { websiteId, portId, portType, x, y, isNodePort, nodeId?, direction? }
  const tempConnectionEnd = ref({ x: 0, y: 0 })
  const connections = ref([]) // 已保存的连接线

  // ==================== 端点位置计算 ====================

  // 获取端点的屏幕坐标（从事件对象或元素）
  const getPortPosition = (websiteId, portId, eventOrElement) => {
    let port = null

    // 如果提供了事件对象，直接从事件目标获取
    if (eventOrElement && eventOrElement.target) {
      port = eventOrElement.target.closest('.port')
    }

    // 如果没找到，尝试通过 portId 查找
    if (!port) {
      const allPorts = document.querySelectorAll(`[data-port-id="${portId}"]`)
      // 找到第一个匹配的端点（简化版本，假设每个 portId 是唯一的）
      port = allPorts[0]
    }

    if (!port) {
      console.warn('[GridView] 无法找到端点:', { websiteId, portId })
      return null
    }

    // 获取端点的位置
    const rect = port.getBoundingClientRect()

    // 获取 grid-container 的位置（因为网站卡片和SVG都是相对于 grid-container 定位的）
    const gridContainer = document.querySelector('.grid-container')
    if (!gridContainer) return null

    const gridContainerRect = gridContainer.getBoundingClientRect()
    // 从 props 获取 canvasTransform，如果没有则使用默认值
    const transform = props.canvasTransform || { x: 0, y: 0, zoom: 1 }

    // 计算端点在 grid-container 本地坐标系统中的位置
    // grid-container 有 transform: translate(x, y) scale(zoom)
    // CSS transform 的顺序是：先 translate 再 scale
    // 屏幕坐标 = (本地坐标 + translate) * zoom + grid-container屏幕位置
    // 反过来：本地坐标 = (屏幕坐标 - grid-container屏幕位置) / zoom - translate
    const portCenterX = rect.left + rect.width / 2
    const portCenterY = rect.top + rect.height / 2

    // ========== 新方案：SVG 放在 canvas-wrapper 下，使用屏幕坐标 ==========
    // SVG 不再继承 grid-container 的 transform，直接使用屏幕坐标
    // 获取 canvas-wrapper 的位置作为 SVG 的坐标系统原点
    const canvasWrapper = document.querySelector('.canvas-wrapper')
    if (!canvasWrapper) return null

    const canvasWrapperRect = canvasWrapper.getBoundingClientRect()

    // SVG 内的坐标就是相对于 canvas-wrapper 的屏幕坐标
    const svgX = portCenterX - canvasWrapperRect.left
    const svgY = portCenterY - canvasWrapperRect.top

    // 调试日志（仅在开发环境）
    if (process.env.NODE_ENV === 'development') {
      console.log('[GridView] 端点位置计算:', {
        portId,
        portScreen: { x: portCenterX, y: portCenterY },
        canvasWrapperScreen: {
          left: canvasWrapperRect.left,
          top: canvasWrapperRect.top,
          width: canvasWrapperRect.width,
          height: canvasWrapperRect.height
        },
        svgCoordinates: {
          x: svgX,
          y: svgY,
          formula: `(${portCenterX} - ${canvasWrapperRect.left}) = ${svgX}`
        }
      })
    }

    return { x: svgX, y: svgY }
  }

  // 获取节点端点的位置
  const getNodePortPosition = (node, port, direction) => {
    // 查找节点元素
    const nodeElement = document.querySelector(`[data-node-id="${node.id}"]`)
    if (!nodeElement) {
      // 如果找不到，尝试通过端口ID查找
      const portElement = document.querySelector(`[data-port-id="${port.id}"]`)
      if (!portElement) return null

      const rect = portElement.getBoundingClientRect()

      // SVG 使用屏幕坐标（相对于 canvas-wrapper）
      const canvasWrapper = document.querySelector('.canvas-wrapper')
      if (!canvasWrapper) return null

      const canvasWrapperRect = canvasWrapper.getBoundingClientRect()
      const portCenterX = rect.left + rect.width / 2
      const portCenterY = rect.top + rect.height / 2

      return {
        x: portCenterX - canvasWrapperRect.left,
        y: portCenterY - canvasWrapperRect.top
      }
    }

    // 查找端口元素
    const portElement = nodeElement.querySelector(`[data-port-id="${port.id}"]`)
    if (!portElement) return null

    const rect = portElement.getBoundingClientRect()

    // SVG 使用屏幕坐标（相对于 canvas-wrapper）
    const canvasWrapper = document.querySelector('.canvas-wrapper')
    if (!canvasWrapper) return null

    const canvasWrapperRect = canvasWrapper.getBoundingClientRect()
    const portCenterX = rect.left + rect.width / 2
    const portCenterY = rect.top + rect.height / 2

    return {
      x: portCenterX - canvasWrapperRect.left,
      y: portCenterY - canvasWrapperRect.top
    }
  }

  // ==================== 连接交互 ====================

  // 开始连接（供外部调用，如节点端口鼠标按下）
  const startConnection = (config) => {
    isConnecting.value = true
    connectingPort.value = config
    tempConnectionEnd.value = { x: config.x, y: config.y }
  }

  // 处理端点鼠标按下
  const handlePortMouseDown = (event, websiteId, portId, portType) => {
    console.log('[GridView] 开始连接，端点:', { websiteId, portId, portType })

    // 获取端点位置（传入事件对象）
    const portPos = getPortPosition(websiteId, portId, event)
    if (!portPos) {
      console.error('[GridView] 无法获取端点位置')
      return
    }

    // 开始连接
    startConnection({
      websiteId,
      portId,
      portType,
      x: portPos.x,
      y: portPos.y,
      isNodePort: false
    })
    console.log('[GridView] 连接状态已设置:', {
      isConnecting: isConnecting.value,
      connectingPort: {
        websiteId: connectingPort.value.websiteId,
        portId: connectingPort.value.portId,
        portType: connectingPort.value.portType,
        position: { x: connectingPort.value.x, y: connectingPort.value.y }
      }
    })
  }

  // 处理连接线鼠标移动
  const handleConnectionMouseMove = (event) => {
    if (!isConnecting.value || !connectingPort.value) {
      return
    }

    const canvasWrapper = document.querySelector('.canvas-wrapper')
    if (!canvasWrapper) return

    const canvasWrapperRect = canvasWrapper.getBoundingClientRect()

    // 更新临时连接线的终点（鼠标位置）
    tempConnectionEnd.value = {
      x: event.clientX - canvasWrapperRect.left,
      y: event.clientY - canvasWrapperRect.top
    }

    // 重新计算起点位置（因为缩放时端点位置会变化）
    if (connectingPort.value.isNodePort) {
      // 节点端点
      const node = workflowNodes.value.find(n => n.id === connectingPort.value.nodeId)
      if (node) {
        const allPorts = [...(node.inputPorts || []), ...(node.outputPorts || [])]
        const port = allPorts.find(p => p.id === connectingPort.value.portId)
        if (port) {
          const portPos = getNodePortPosition(node, port, connectingPort.value.direction)
          if (portPos) {
            connectingPort.value.x = portPos.x
            connectingPort.value.y = portPos.y
          }
        }
      }
    } else {
      // 网站端点
      const portPos = getPortPosition(connectingPort.value.websiteId, connectingPort.value.portId, null)
      if (portPos) {
        connectingPort.value.x = portPos.x
        connectingPort.value.y = portPos.y
      }
    }
  }

  // 处理连接线鼠标释放
  const handleConnectionMouseUp = (event) => {
    if (!isConnecting.value || !connectingPort.value) return

    console.log('[GridView] 连接线鼠标释放:', {
      mouseScreen: { x: event.clientX, y: event.clientY },
      tempEnd: { x: tempConnectionEnd.value.x, y: tempConnectionEnd.value.y },
      connectingPort: {
        position: { x: connectingPort.value.x, y: connectingPort.value.y },
        portId: connectingPort.value.portId
      }
    })

    // 查找鼠标下的端点
    const elementsAtPoint = document.elementsFromPoint(event.clientX, event.clientY)
    let port = null
    let targetNode = null
    let targetPort = null
    let targetWebsiteId = null
    let targetPortId = null

    for (const el of elementsAtPoint) {
      if (el.classList.contains('port') || el.classList.contains('node-port')) {
        port = el
        break
      }
    }

    if (port && port.dataset.portId) {
      targetPortId = port.dataset.portId
      const targetPortType = port.dataset.portType

      // 检查是否是节点端口
      const nodeElement = port.closest('[data-node-id]')
      if (nodeElement) {
        // 节点端口连接
        const nodeId = nodeElement.dataset.nodeId
        targetNode = workflowNodes.value.find(n => n.id === nodeId)
        if (targetNode) {
          const allPorts = [...(targetNode.inputPorts || []), ...(targetNode.outputPorts || [])]
          targetPort = allPorts.find(p => p.id === targetPortId)
        }
      } else {
        // 网站端点连接
        // 查找目标端点所在的网站ID
        let parent = port.parentElement
        while (parent) {
          if (parent.querySelector('.automation-panel')) {
            for (const website of allWebsites.value) {
              const websiteAutomationData = automationData.getAutomationData(website.id)
              const allMappings = [...(websiteAutomationData.dataMappings || []), ...(websiteAutomationData.actionMappings || [])]
              if (allMappings.some(m => m.portId === targetPortId)) {
                targetWebsiteId = website.id
                break
              }
            }
            if (targetWebsiteId) break
          }
          parent = parent.parentElement
        }
      }

      // 处理连接逻辑
      if (connectingPort.value.isNodePort) {
        // 从节点端口连接
        if (targetNode && targetPort) {
          // 连接到节点
          const fromNode = workflowNodes.value.find(n => n.id === connectingPort.value.nodeId)
          if (fromNode && connectingPort.value.direction === 'output' && targetPort.portType !== 'action') {
            // 执行流连接：输出 -> 输入
            connections.value.push({
              from: {
                nodeId: connectingPort.value.nodeId,
                portId: connectingPort.value.portId
              },
              to: {
                nodeId: targetNode.id,
                portId: targetPortId
              },
              type: 'execution'
            })
            console.log('[GridView] 创建节点执行连接')
          } else if (targetPort.portType === 'action' && targetNode.type === 'web-action') {
            // 交互映射连接：只能连接到网页操作节点
            if (targetNode.config) {
              targetNode.config.actionPort = {
                websiteId: connectingPort.value.websiteId,
                portId: connectingPort.value.portId
              }
              console.log('[GridView] 连接交互映射到网页操作节点')
            }
          }
        } else if (targetWebsiteId) {
          // 连接到网站端点（数据映射）
          const fromNode = workflowNodes.value.find(n => n.id === connectingPort.value.nodeId)
          if (fromNode && connectingPort.value.portType === 'data') {
            // 数据映射连接：节点 -> 网站端点
            connections.value.push({
              from: {
                nodeId: connectingPort.value.nodeId,
                portId: connectingPort.value.portId
              },
              to: {
                websiteId: targetWebsiteId,
                portId: targetPortId
              },
              type: 'data'
            })
            console.log('[GridView] 创建数据映射连接')
          }
        }
      } else {
        // 从网站端点连接
        if (targetNode && targetPort) {
          // 连接到节点
          if (connectingPort.value.portType === 'data-output') {
            // 数据映射连接：网站端点 -> 节点
            if (targetPort.portType === 'data' || !targetPort.portType) {
              // 可以在节点配置中引用这个数据
              if (!targetNode.config) targetNode.config = {}
              if (!targetNode.config.dataReferences) targetNode.config.dataReferences = {}
              // 添加数据引用
              const refKey = `data_${Date.now()}`
              targetNode.config.dataReferences[refKey] = {
                websiteId: connectingPort.value.websiteId,
                portId: connectingPort.value.portId
              }
              console.log('[GridView] 添加数据引用到节点')
            }
          } else if (connectingPort.value.portType === 'action' && targetPort.portType === 'action' && targetNode.type === 'web-action') {
            // 交互映射连接：只能连接到网页操作节点
            if (targetNode.config) {
              targetNode.config.actionPort = {
                websiteId: connectingPort.value.websiteId,
                portId: connectingPort.value.portId
              }
              console.log('[GridView] 连接交互映射到网页操作节点')
            }
          }
        } else if (targetWebsiteId && connectingPort.value.portType === 'data-output') {
          // 网站端点 -> 网站端点（数据映射）
          if (targetWebsiteId !== connectingPort.value.websiteId || targetPortId !== connectingPort.value.portId) {
            connections.value.push({
              from: {
                websiteId: connectingPort.value.websiteId,
                portId: connectingPort.value.portId
              },
              to: {
                websiteId: targetWebsiteId,
                portId: targetPortId
              },
              type: 'data'
            })
            console.log('[GridView] 创建网站间数据连接')
          }
        }
      }
    }

    // 重置连接状态
    isConnecting.value = false
    connectingPort.value = null
    tempConnectionEnd.value = { x: 0, y: 0 }
  }

  // ==================== 路径计算 ====================

  // 计算连接线路径
  const getConnectionPath = (connection) => {
    let fromPos = null
    let toPos = null

    // 获取起始位置
    if (connection.from.nodeId) {
      // 从节点端口
      const fromNode = workflowNodes.value.find(n => n.id === connection.from.nodeId)
      if (fromNode) {
        const allPorts = [...(fromNode.inputPorts || []), ...(fromNode.outputPorts || [])]
        const fromPort = allPorts.find(p => p.id === connection.from.portId)
        if (fromPort) {
          fromPos = getNodePortPosition(fromNode, fromPort, fromNode.outputPorts?.some(p => p.id === fromPort.id) ? 'output' : 'input')
        }
      }
    } else if (connection.from.websiteId) {
      // 从网站端点
      fromPos = getPortPosition(connection.from.websiteId, connection.from.portId, null)
    }

    // 获取目标位置
    if (connection.to.nodeId) {
      // 到节点端口
      const toNode = workflowNodes.value.find(n => n.id === connection.to.nodeId)
      if (toNode) {
        const allPorts = [...(toNode.inputPorts || []), ...(toNode.outputPorts || [])]
        const toPort = allPorts.find(p => p.id === connection.to.portId)
        if (toPort) {
          toPos = getNodePortPosition(toNode, toPort, toNode.inputPorts?.some(p => p.id === toPort.id) ? 'input' : 'output')
        }
      }
    } else if (connection.to.websiteId) {
      // 到网站端点
      toPos = getPortPosition(connection.to.websiteId, connection.to.portId, null)
    }

    if (!fromPos || !toPos) {
      if (process.env.NODE_ENV === 'development') {
        console.warn('[GridView] 无法计算连接线路径，缺少位置:', {
          connection,
          fromPos,
          toPos
        })
      }
      return ''
    }

    // 使用贝塞尔曲线绘制连接线
    const dx = toPos.x - fromPos.x
    const dy = toPos.y - fromPos.y
    const controlX = fromPos.x + dx * 0.5

    const path = `M ${fromPos.x} ${fromPos.y} C ${controlX} ${fromPos.y}, ${controlX} ${toPos.y}, ${toPos.x} ${toPos.y}`

    // 调试日志（仅在开发环境，限制频率）
    if (process.env.NODE_ENV === 'development' && Math.random() < 0.1) {
      console.log('[GridView] 连接线路径计算:', {
        connection: {
          from: connection.from,
          to: connection.to,
          type: connection.type
        },
        fromPos,
        toPos,
        path
      })
    }

    return path
  }

  // 临时连接线路径
  const tempConnectionPath = computed(() => {
    if (!connectingPort.value) return ''

    const fromPos = connectingPort.value
    const toPos = tempConnectionEnd.value

    const dx = toPos.x - fromPos.x
    const dy = toPos.y - fromPos.y
    const controlX = fromPos.x + dx * 0.5

    const path = `M ${fromPos.x} ${fromPos.y} C ${controlX} ${fromPos.y}, ${controlX} ${toPos.y}, ${toPos.x} ${toPos.y}`

    // 调试日志（仅在开发环境，限制频率）
    if (process.env.NODE_ENV === 'development' && Math.random() < 0.05) {
      console.log('[GridView] 临时连接线路径:', {
        from: { x: fromPos.x, y: fromPos.y },
        to: { x: toPos.x, y: toPos.y },
        path,
        svgElement: document.querySelector('.connection-layer') ? 'found' : 'not found'
      })
    }

    return path
  })

  // 连接线层样式
  // SVG 放在 canvas-wrapper 下，使用屏幕坐标系统
  const connectionLayerStyle = computed(() => {
    return {
      position: 'absolute',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      pointerEvents: 'none',
      zIndex: 5
    }
  })

  // ==================== 画布事件处理 ====================

  // 在画布容器上监听鼠标事件（用于连接线拖拽）
  const handleCanvasMouseMoveForConnection = (event) => {
    if (isConnecting.value && connectingPort.value) {
      handleConnectionMouseMove(event)
    }
  }

  const handleCanvasMouseUpForConnection = (event) => {
    if (isConnecting.value && connectingPort.value) {
      console.log('[GridView] 连接线鼠标释放，查找目标端点')
      handleConnectionMouseUp(event)
    }
  }

  // ==================== 样式 ====================

  // 工作流节点层样式
  const workflowNodesLayerStyle = computed(() => {
    return {
      position: 'absolute',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      // 当选择器激活时，禁用指针事件以允许鼠标事件穿透到 iframe/webview
      pointerEvents: automationSelectingElement.value ? 'none' : 'auto',
      zIndex: 6
    }
  })

  // ==================== 缩放监听 ====================

  // 监听缩放变化，如果正在连接，重新计算起点坐标
  watch(() => props.canvasTransform?.zoom, (newZoom, oldZoom) => {
    if (isConnecting.value && connectingPort.value && newZoom !== oldZoom && oldZoom !== undefined) {
      // 重新计算起点坐标
      if (connectingPort.value.isNodePort) {
        // 节点端点
        const node = workflowNodes.value.find(n => n.id === connectingPort.value.nodeId)
        if (node) {
          const allPorts = [...(node.inputPorts || []), ...(node.outputPorts || [])]
          const port = allPorts.find(p => p.id === connectingPort.value.portId)
          if (port) {
            const portPos = getNodePortPosition(node, port, connectingPort.value.direction)
            if (portPos) {
              connectingPort.value.x = portPos.x
              connectingPort.value.y = portPos.y
              tempConnectionEnd.value = { x: portPos.x, y: portPos.y }
            }
          }
        }
      } else {
        // 网站端点
        const portPos = getPortPosition(connectingPort.value.websiteId, connectingPort.value.portId, null)
        if (portPos) {
          connectingPort.value.x = portPos.x
          connectingPort.value.y = portPos.y
          tempConnectionEnd.value = { x: portPos.x, y: portPos.y }
        }
      }
    }
  })

  return {
    // 连接状态
    isConnecting,
    connectingPort,
    connections,
    connectingPortType: computed(() => connectingPort.value?.portType || ''),
    // 端点位置
    getPortPosition,
    getNodePortPosition,
    startConnection,
    // 连接交互
    handlePortMouseDown,
    handleConnectionMouseMove,
    handleConnectionMouseUp,
    handleCanvasMouseMoveForConnection,
    handleCanvasMouseUpForConnection,
    // 路径计算
    getConnectionPath,
    tempConnectionPath,
    // 样式
    connectionLayerStyle,
    workflowNodesLayerStyle
  }
}
