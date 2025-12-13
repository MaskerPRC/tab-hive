<template>
  <div v-if="show" class="workflow-editor-overlay">
    <div class="workflow-editor" :class="{ 'dark-mode': darkMode }">
      <!-- 顶部工具栏 -->
      <div class="editor-header">
        <div class="header-left">
          <div class="title-row">
            <h2>{{ workflow?.name || '工作流编辑器' }}</h2>
            <span class="god-mode-badge">🎯 上帝视角</span>
          </div>
          <div class="workflow-info">
            <span class="info-badge">{{ nodes.length }} 个节点</span>
            <span class="info-badge">{{ connections.length }} 个连接</span>
            <span class="info-hint">💡 可透过画布看到下方网页</span>
          </div>
        </div>
        <div class="header-right">
          <div class="opacity-control">
            <label>透明度</label>
            <input
              type="range"
              min="0.3"
              max="1"
              step="0.1"
              v-model="canvasOpacity"
              class="opacity-slider"
            />
            <span class="opacity-value">{{ Math.round(canvasOpacity * 100) }}%</span>
          </div>
          <button @click="handleTest" class="btn btn-test" :disabled="isExecuting">
            {{ isExecuting ? '⏳ 执行中...' : '▶️ 测试运行' }}
          </button>
          <button @click="handleSave" class="btn btn-primary">
            💾 保存
          </button>
          <button @click="handleClose" class="btn btn-close">
            × 关闭
          </button>
        </div>
      </div>

      <!-- 主要内容区 -->
      <div class="editor-body">
        <!-- 左侧工具面板 -->
        <div class="tools-panel">
          <div class="tool-section">
            <h4>添加节点</h4>
            <button @click="addFlowNode" class="tool-btn">
              <span class="tool-icon">🔄</span>
              <span>Flow节点</span>
            </button>
            <button @click="addWebControlNode" class="tool-btn">
              <span class="tool-icon">⚡</span>
              <span>网页控制</span>
            </button>
          </div>

          <div class="tool-section">
            <h4>网页元素</h4>
            <button @click="startElementSelection" class="tool-btn primary">
              <span class="tool-icon">🎯</span>
              <span>选择元素</span>
            </button>
          </div>
        </div>

        <!-- 画布区域 -->
        <div 
          class="canvas-area" 
          ref="canvasArea"
          :style="{ opacity: canvasOpacity }"
        >
          <svg class="connections-layer" :style="{ width: '100%', height: '100%' }">
            <!-- 绘制连接线 -->
            <g v-for="conn in connections" :key="conn.id">
              <line
                :x1="getConnectionStart(conn).x"
                :y1="getConnectionStart(conn).y"
                :x2="getConnectionEnd(conn).x"
                :y2="getConnectionEnd(conn).y"
                :class="getConnectionClass(conn)"
                :stroke-dasharray="conn.type === 'data-mapping' ? '5,5' : '0'"
                stroke-width="2"
              />
            </g>
            
            <!-- 正在绘制的临时连接线 -->
            <line
              v-if="draggingConnection"
              :x1="draggingConnection.startX"
              :y1="draggingConnection.startY"
              :x2="draggingConnection.endX"
              :y2="draggingConnection.endY"
              class="connection-temp"
              stroke-dasharray="5,5"
              stroke-width="2"
            />
          </svg>

          <!-- 节点层 -->
          <div class="nodes-layer">
            <!-- 网页节点 -->
            <div
              v-for="node in webpageNodes"
              :key="node.id"
              class="workflow-node webpage-node"
              :style="getNodeStyle(node)"
              @mousedown="startDragNode($event, node)"
            >
              <div class="node-header">
                <span class="node-icon">🌐</span>
                <span class="node-title">{{ node.name }}</span>
                <button @click="deleteNode(node.id)" class="node-delete">×</button>
              </div>
              
              <div class="node-body">
                <!-- 选择器列表 -->
                <div
                  v-for="selector in node.selectorConfigs"
                  :key="selector.id"
                  class="selector-group"
                >
                  <div class="selector-header">
                    <span class="selector-name">{{ selector.elementName }}</span>
                    <button
                      @click="editSelectorConfig(node, selector)"
                      class="selector-edit"
                    >
                      ⚙️
                    </button>
                  </div>

                  <!-- 数据端口 -->
                  <div
                    v-for="dataMapping in selector.dataMappings"
                    :key="dataMapping.id"
                    class="port-item data-port"
                  >
                    <div
                      class="port-dot data"
                      :data-node-id="node.id"
                      :data-port-id="dataMapping.portId"
                      :data-port-type="'data'"
                      @mousedown="startConnection($event, node.id, dataMapping.portId, 'data')"
                    >
                      ○
                    </div>
                    <span class="port-label">{{ dataMapping.name }}</span>
                  </div>

                  <!-- 交互端口 -->
                  <div
                    v-for="actionMapping in selector.actionMappings"
                    :key="actionMapping.id"
                    class="port-item action-port"
                  >
                    <span class="port-label">{{ actionMapping.name }}</span>
                    <div
                      class="port-dot action"
                      :data-node-id="node.id"
                      :data-port-id="actionMapping.portId"
                      :data-port-type="'action'"
                      @mousedown="startConnection($event, node.id, actionMapping.portId, 'action')"
                    >
                      ●
                    </div>
                  </div>
                </div>

                <button
                  @click="startElementSelection(node)"
                  class="add-selector-btn"
                >
                  + 添加选择器
                </button>
              </div>
            </div>

            <!-- Flow节点 -->
            <div
              v-for="node in flowNodes"
              :key="node.id"
              class="workflow-node flow-node"
              :style="getNodeStyle(node)"
              @mousedown="startDragNode($event, node)"
            >
              <div class="node-header">
                <span class="node-icon">🔄</span>
                <input
                  v-model="node.name"
                  class="node-title-input"
                  @click.stop
                />
                <button @click="deleteNode(node.id)" class="node-delete">×</button>
              </div>

              <div class="node-body">
                <!-- 输入端口 -->
                <div class="ports-section">
                  <div
                    v-for="port in node.inputPorts"
                    :key="port.id"
                    class="port-item input-port"
                  >
                    <div
                      class="port-dot input"
                      :data-node-id="node.id"
                      :data-port-id="port.id"
                      :data-port-type="'input'"
                      @mousedown="startConnection($event, node.id, port.id, 'input')"
                    >
                      ◀
                    </div>
                    <span class="port-label">{{ port.name }}</span>
                  </div>
                </div>

                <!-- 输出端口 -->
                <div class="ports-section">
                  <div
                    v-for="port in node.outputPorts"
                    :key="port.id"
                    class="port-item output-port"
                  >
                    <span class="port-label">{{ port.name }}</span>
                    <div
                      class="port-dot output"
                      :data-node-id="node.id"
                      :data-port-id="port.id"
                      :data-port-type="'output'"
                      @mousedown="startConnection($event, node.id, port.id, 'output')"
                    >
                      ▶
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Web Control节点 -->
            <div
              v-for="node in webControlNodes"
              :key="node.id"
              class="workflow-node control-node"
              :style="getNodeStyle(node)"
              @mousedown="startDragNode($event, node)"
            >
              <div class="node-header">
                <span class="node-icon">⚡</span>
                <input
                  v-model="node.name"
                  class="node-title-input"
                  @click.stop
                />
                <button @click="deleteNode(node.id)" class="node-delete">×</button>
              </div>

              <div class="node-body">
                <!-- 输入端口 -->
                <div class="ports-section">
                  <div
                    v-for="port in node.inputPorts"
                    :key="port.id"
                    class="port-item input-port"
                  >
                    <div
                      class="port-dot input"
                      :data-node-id="node.id"
                      :data-port-id="port.id"
                      :data-port-type="'input'"
                      @mousedown="startConnection($event, node.id, port.id, 'input')"
                    >
                      ◀
                    </div>
                    <span class="port-label">{{ port.name }}</span>
                  </div>
                </div>

                <!-- 交互控制（显示已配置的） -->
                <div class="action-controls-section">
                  <div
                    v-for="ctrl in node.actionControls.filter(c => c.targetNodeId)"
                    :key="ctrl.id"
                    class="action-control-item"
                  >
                    <span class="control-label">{{ ctrl.name }}</span>
                    <span class="control-target">
                      → {{ getActionTargetName(ctrl) }}
                    </span>
                  </div>
                </div>

                <!-- 输出端口 -->
                <div class="ports-section">
                  <div
                    v-for="port in node.outputPorts"
                    :key="port.id"
                    class="port-item output-port"
                    :class="{ 'result-port': port.isFixed }"
                  >
                    <span class="port-label">
                      {{ port.isFixed ? '📊 ' : '' }}{{ port.name }}
                    </span>
                    <div
                      class="port-dot output"
                      :data-node-id="node.id"
                      :data-port-id="port.id"
                      :data-port-type="'output'"
                      @mousedown="startConnection($event, node.id, port.id, 'output')"
                    >
                      ▶
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 执行日志 -->
      <div v-if="executionLog.length > 0" class="execution-log">
        <div class="log-header">
          <h4>执行日志</h4>
          <button @click="clearLog" class="btn-clear-log">清空</button>
        </div>
        <div class="log-content">
          <div
            v-for="(log, index) in executionLog"
            :key="index"
            class="log-item"
            :class="`log-${log.type}`"
          >
            <span class="log-time">{{ formatTime(log.time) }}</span>
            <span class="log-message">{{ log.message }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 选择器映射配置弹窗 -->
    <SelectorMappingConfig
      v-if="showSelectorConfig"
      :show="showSelectorConfig"
      :selector-config="currentSelectorConfig"
      :dark-mode="darkMode"
      @save="handleSelectorConfigSave"
      @close="showSelectorConfig = false"
      @reselect="handleReselect"
    />

    <!-- 元素选择器 -->
    <ElementSelector
      v-if="isSelectingElement"
      :is-active="isSelectingElement"
      :target-iframe="targetIframe"
      :current-website="currentWebsite"
      @select="handleElementSelected"
      @cancel="isSelectingElement = false"
    />
  </div>
</template>

<script>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { useWorkflowManager } from '../../composables/useWorkflowManager'
import { createSelectorConfig, createFlowNode, createWebControlNode, NODE_TYPES } from '../../models/workflowModels'
import SelectorMappingConfig from './SelectorMappingConfig.vue'
import ElementSelector from '../ElementSelector.vue'

export default {
  name: 'WorkflowEditor',
  components: {
    SelectorMappingConfig,
    ElementSelector
  },
  props: {
    show: {
      type: Boolean,
      default: false
    },
    workflowId: {
      type: String,
      default: null
    },
    websiteId: {
      type: String,
      required: true
    },
    websiteName: {
      type: String,
      default: '网站'
    },
    darkMode: {
      type: Boolean,
      default: false
    }
  },
  emits: ['close', 'save'],
  setup(props, { emit }) {
    const workflowManager = useWorkflowManager()
    
    // 工作流数据
    const workflow = computed(() => workflowManager.currentWorkflow.value)
    const nodes = computed(() => workflow.value?.nodes || [])
    const connections = computed(() => workflow.value?.connections || [])
    
    // 按类型分组节点
    const webpageNodes = computed(() => 
      nodes.value.filter(n => n.type === NODE_TYPES.WEBPAGE)
    )
    const flowNodes = computed(() => 
      nodes.value.filter(n => n.type === NODE_TYPES.FLOW)
    )
    const webControlNodes = computed(() => 
      nodes.value.filter(n => n.type === NODE_TYPES.WEB_CONTROL)
    )
    
    // UI状态
    const canvasArea = ref(null)
    const showSelectorConfig = ref(false)
    const currentSelectorConfig = ref(null)
    const currentEditingNode = ref(null)
    const isSelectingElement = ref(false)
    const targetIframe = ref(null)
    const currentWebsite = ref(null)
    
    // 拖拽状态
    const draggingNode = ref(null)
    const dragOffset = ref({ x: 0, y: 0 })
    const draggingConnection = ref(null)
    
    // 执行状态
    const isExecuting = ref(false)
    const executionLog = ref([])
    
    // 透明度控制
    const canvasOpacity = ref(0.7) // 默认70%透明度
    
    // 监听 show 属性变化
    watch(() => props.show, (newValue) => {
      console.log('[WorkflowEditor] props.show 变化:', newValue)
      if (newValue) {
        console.log('[WorkflowEditor] 编辑器应该显示')
      } else {
        console.log('[WorkflowEditor] 编辑器应该隐藏')
      }
    }, { immediate: true })
    
    // 初始化
    onMounted(() => {
      console.log('[WorkflowEditor] 组件已挂载')
      console.log('[WorkflowEditor] props.show:', props.show)
      console.log('[WorkflowEditor] props.websiteId:', props.websiteId)
      console.log('[WorkflowEditor] props.websiteName:', props.websiteName)
      console.log('[WorkflowEditor] props.workflowId:', props.workflowId)
      
      if (props.workflowId) {
        console.log('[WorkflowEditor] 加载现有工作流')
        workflowManager.loadWorkflow(props.workflowId)
      } else if (!workflow.value) {
        console.log('[WorkflowEditor] 创建新工作流')
        workflowManager.createNewWorkflow(props.websiteId, props.websiteName)
      }
      
      console.log('[WorkflowEditor] 工作流对象:', workflow.value)
      
      // 添加全局事件监听
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
    })
    
    onUnmounted(() => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    })
    
    // 节点样式
    const getNodeStyle = (node) => {
      return {
        left: `${node.position.x}px`,
        top: `${node.position.y}px`
      }
    }
    
    // 添加节点
    const addFlowNode = () => {
      const node = createFlowNode('处理节点')
      node.position = { x: 300, y: 100 }
      workflowManager.addNode(node)
    }
    
    const addWebControlNode = () => {
      const node = createWebControlNode('网页控制')
      node.position = { x: 600, y: 100 }
      workflowManager.addNode(node)
    }
    
    // 删除节点
    const deleteNode = (nodeId) => {
      if (confirm('确定删除此节点吗？')) {
        workflowManager.removeNode(nodeId)
      }
    }
    
    // 开始元素选择
    const startElementSelection = (node = null) => {
      currentEditingNode.value = node || webpageNodes.value[0]
      if (!currentEditingNode.value) {
        alert('请先添加网页节点')
        return
      }
      
      // 查找对应的webview/iframe
      const isElectron = window.electron?.isElectron
      if (isElectron) {
        targetIframe.value = document.querySelector(
          `#webview-${currentEditingNode.value.websiteId}`
        )
      } else {
        targetIframe.value = document.querySelector(
          `iframe[data-website-id="${currentEditingNode.value.websiteId}"]`
        )
      }
      
      if (!targetIframe.value) {
        alert('未找到网页，请确保网页已加载')
        return
      }
      
      currentWebsite.value = { id: currentEditingNode.value.websiteId }
      isSelectingElement.value = true
    }
    
    // 处理元素选择完成
    const handleElementSelected = (result) => {
      isSelectingElement.value = false
      
      const selectorConfig = createSelectorConfig(result.selector, '新元素')
      currentSelectorConfig.value = selectorConfig
      showSelectorConfig.value = true
    }
    
    // 编辑选择器配置
    const editSelectorConfig = (node, selector) => {
      currentEditingNode.value = node
      currentSelectorConfig.value = selector
      showSelectorConfig.value = true
    }
    
    // 保存选择器配置
    const handleSelectorConfigSave = (config) => {
      if (currentEditingNode.value) {
        const existingIndex = currentEditingNode.value.selectorConfigs.findIndex(
          c => c.id === config.id
        )
        
        if (existingIndex >= 0) {
          // 更新现有配置
          currentEditingNode.value.selectorConfigs[existingIndex] = config
        } else {
          // 添加新配置
          currentEditingNode.value.selectorConfigs.push(config)
        }
        
        workflowManager.saveWorkflows()
      }
      
      showSelectorConfig.value = false
    }
    
    // 重新选择元素
    const handleReselect = () => {
      showSelectorConfig.value = false
      startElementSelection(currentEditingNode.value)
    }
    
    // 节点拖拽
    const startDragNode = (event, node) => {
      if (event.target.closest('.port-dot')) return
      
      draggingNode.value = node
      const rect = event.target.closest('.workflow-node').getBoundingClientRect()
      dragOffset.value = {
        x: event.clientX - rect.left,
        y: event.clientY - rect.top
      }
    }
    
    // 连接线拖拽
    const startConnection = (event, nodeId, portId, portType) => {
      event.stopPropagation()
      
      const rect = event.target.getBoundingClientRect()
      const canvasRect = canvasArea.value.getBoundingClientRect()
      
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
    
    // 鼠标移动
    const handleMouseMove = (event) => {
      if (draggingNode.value && canvasArea.value) {
        const canvasRect = canvasArea.value.getBoundingClientRect()
        draggingNode.value.position = {
          x: event.clientX - canvasRect.left - dragOffset.value.x,
          y: event.clientY - canvasRect.top - dragOffset.value.y
        }
      }
      
      if (draggingConnection.value && canvasArea.value) {
        const canvasRect = canvasArea.value.getBoundingClientRect()
        draggingConnection.value.endX = event.clientX - canvasRect.left
        draggingConnection.value.endY = event.clientY - canvasRect.top
      }
    }
    
    // 鼠标释放
    const handleMouseUp = (event) => {
      if (draggingNode.value) {
        workflowManager.saveWorkflows()
        draggingNode.value = null
      }
      
      if (draggingConnection.value) {
        // 检查是否释放在端口上
        const target = event.target.closest('.port-dot')
        if (target) {
          const toNodeId = target.dataset.nodeId
          const toPortId = target.dataset.portId
          const toPortType = target.dataset.portType
          
          createConnectionBetweenPorts(
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
    
    // 创建连接
    const createConnectionBetweenPorts = (
      fromNodeId, fromPortId, fromPortType,
      toNodeId, toPortId, toPortType
    ) => {
      // MVP: 简化的连接逻辑
      // 数据端口 → Flow输入
      // Flow输出 → Flow输入 或 WebControl输入
      // WebControl → 交互端口
      
      let connectionType = 'execution-flow'
      
      if (fromPortType === 'data') {
        connectionType = 'data-mapping'
      }
      
      workflowManager.addConnection(
        connectionType,
        { nodeId: fromNodeId, portId: fromPortId },
        { nodeId: toNodeId, portId: toPortId }
      )
    }
    
    // 获取连接线坐标（简化版，后续可优化）
    const getConnectionStart = (conn) => {
      // TODO: 计算实际端口位置
      return { x: 100, y: 100 }
    }
    
    const getConnectionEnd = (conn) => {
      // TODO: 计算实际端口位置
      return { x: 300, y: 200 }
    }
    
    const getConnectionClass = (conn) => {
      return {
        'connection-line': true,
        'connection-data': conn.type === 'data-mapping',
        'connection-flow': conn.type === 'execution-flow'
      }
    }
    
    const getActionTargetName = (ctrl) => {
      // TODO: 获取目标动作名称
      return '交互操作'
    }
    
    // 测试运行
    const handleTest = async () => {
      // TODO: 实现工作流执行
      alert('执行功能正在开发中...')
    }
    
    // 保存和关闭
    const handleSave = () => {
      workflowManager.saveWorkflows()
      emit('save', workflow.value)
    }
    
    const handleClose = () => {
      workflowManager.saveWorkflows()
      emit('close')
    }
    
    // 日志
    const clearLog = () => {
      executionLog.value = []
    }
    
    const formatTime = (time) => {
      return new Date(time).toLocaleTimeString()
    }
    
    return {
      workflow,
      nodes,
      connections,
      webpageNodes,
      flowNodes,
      webControlNodes,
      canvasArea,
      showSelectorConfig,
      currentSelectorConfig,
      isSelectingElement,
      targetIframe,
      currentWebsite,
      draggingConnection,
      isExecuting,
      executionLog,
      canvasOpacity,
      getNodeStyle,
      addFlowNode,
      addWebControlNode,
      deleteNode,
      startElementSelection,
      handleElementSelected,
      editSelectorConfig,
      handleSelectorConfigSave,
      handleReselect,
      startDragNode,
      startConnection,
      getConnectionStart,
      getConnectionEnd,
      getConnectionClass,
      getActionTargetName,
      handleTest,
      handleSave,
      handleClose,
      clearLog,
      formatTime
    }
  }
}
</script>

<style scoped>
.workflow-editor-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.3); /* 半透明背景 */
  backdrop-filter: blur(2px); /* 轻微模糊效果 */
  z-index: 9999;
  display: flex;
  pointer-events: none; /* 让背景不捕获鼠标事件 */
}

.workflow-editor {
  width: 100%;
  height: 100%;
  background: rgba(245, 245, 245, 0.95); /* 半透明白色 */
  display: flex;
  flex-direction: column;
  pointer-events: auto; /* 编辑器本身可以交互 */
}

.workflow-editor.dark-mode {
  background: rgba(26, 26, 26, 0.95); /* 半透明黑色 */
  color: #e0e0e0;
}

.editor-header {
  background: rgba(255, 255, 255, 0.98);
  padding: 16px 24px;
  border-bottom: 1px solid #e0e0e0;
  display: flex;
  justify-content: space-between;
  align-items: center;
  backdrop-filter: blur(10px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.dark-mode .editor-header {
  background: rgba(45, 45, 45, 0.98);
  border-bottom-color: #444;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
}

.title-row {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 8px;
}

.header-left h2 {
  margin: 0;
  font-size: 20px;
}

.god-mode-badge {
  padding: 4px 12px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #fff;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 600;
  box-shadow: 0 2px 8px rgba(102, 126, 234, 0.3);
}

.workflow-info {
  display: flex;
  gap: 8px;
  align-items: center;
}

.info-badge {
  padding: 4px 8px;
  background: #e3f2fd;
  color: #1976d2;
  border-radius: 12px;
  font-size: 12px;
}

.dark-mode .info-badge {
  background: #1a3a5a;
  color: #64b5f6;
}

.info-hint {
  padding: 4px 8px;
  background: rgba(255, 193, 7, 0.15);
  color: #f57c00;
  border-radius: 12px;
  font-size: 11px;
  font-style: italic;
}

.dark-mode .info-hint {
  background: rgba(255, 193, 7, 0.2);
  color: #ffb74d;
}

.header-right {
  display: flex;
  gap: 12px;
  align-items: center;
}

.opacity-control {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: rgba(0, 0, 0, 0.05);
  border-radius: 6px;
}

.opacity-control label {
  font-size: 13px;
  color: #666;
  white-space: nowrap;
}

.dark-mode .opacity-control label {
  color: #aaa;
}

.opacity-slider {
  width: 100px;
  cursor: pointer;
}

.opacity-value {
  font-size: 12px;
  color: #666;
  min-width: 40px;
  text-align: right;
}

.dark-mode .opacity-value {
  color: #aaa;
}

.btn {
  padding: 10px 20px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.2s;
}

.btn-test {
  background: #2196F3;
  color: #fff;
}

.btn-test:hover:not(:disabled) {
  background: #1976D2;
}

.btn-test:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-primary {
  background: #4CAF50;
  color: #fff;
}

.btn-primary:hover {
  background: #45a049;
}

.btn-close {
  background: #f44336;
  color: #fff;
}

.btn-close:hover {
  background: #d32f2f;
}

.editor-body {
  flex: 1;
  display: flex;
  overflow: hidden;
}

.tools-panel {
  width: 200px;
  background: rgba(255, 255, 255, 0.98);
  border-right: 1px solid #e0e0e0;
  padding: 16px;
  overflow-y: auto;
  backdrop-filter: blur(10px);
}

.dark-mode .tools-panel {
  background: rgba(45, 45, 45, 0.98);
  border-right-color: #444;
}

.tool-section {
  margin-bottom: 24px;
}

.tool-section h4 {
  margin: 0 0 12px 0;
  font-size: 14px;
  color: #666;
}

.dark-mode .tool-section h4 {
  color: #aaa;
}

.tool-btn {
  width: 100%;
  padding: 12px;
  background: #fff;
  border: 2px solid #e0e0e0;
  border-radius: 6px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
  transition: all 0.2s;
}

.tool-btn:hover {
  border-color: #4CAF50;
  background: #f9fff9;
}

.tool-btn.primary {
  background: #4CAF50;
  color: #fff;
  border-color: #4CAF50;
}

.tool-btn.primary:hover {
  background: #45a049;
}

.dark-mode .tool-btn {
  background: #3a3a3a;
  border-color: #555;
  color: #e0e0e0;
}

.tool-icon {
  font-size: 20px;
}

.canvas-area {
  flex: 1;
  position: relative;
  overflow: auto;
  background: 
    linear-gradient(90deg, rgba(224, 224, 224, 0.3) 1px, transparent 1px) 0 0 / 20px 20px,
    linear-gradient(rgba(224, 224, 224, 0.3) 1px, transparent 1px) 0 0 / 20px 20px;
  background-color: rgba(250, 250, 250, 0.5); /* 半透明画布，可以看到下面的网页 */
}

.dark-mode .canvas-area {
  background: 
    linear-gradient(90deg, rgba(51, 51, 51, 0.3) 1px, transparent 1px) 0 0 / 20px 20px,
    linear-gradient(rgba(51, 51, 51, 0.3) 1px, transparent 1px) 0 0 / 20px 20px;
  background-color: rgba(26, 26, 26, 0.5);
}

.connections-layer {
  position: absolute;
  top: 0;
  left: 0;
  pointer-events: none;
  z-index: 1;
}

.connection-line {
  stroke: #666;
  transition: stroke 0.2s;
}

.connection-data {
  stroke: #2196F3;
}

.connection-flow {
  stroke: #4CAF50;
}

.connection-temp {
  stroke: #999;
  opacity: 0.6;
}

.nodes-layer {
  position: relative;
  z-index: 2;
  min-width: 2000px;
  min-height: 2000px;
}

.workflow-node {
  position: absolute;
  background: rgba(255, 255, 255, 0.98); /* 几乎不透明，保证可读性 */
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  min-width: 220px;
  cursor: move;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2); /* 更强的阴影，突出层次 */
  backdrop-filter: blur(10px); /* 背景模糊效果 */
}

.dark-mode .workflow-node {
  background: rgba(45, 45, 45, 0.98);
  border-color: #444;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
}

.webpage-node {
  border-color: #2196F3;
}

.flow-node {
  border-color: #4CAF50;
}

.control-node {
  border-color: #ff9800;
}

.node-header {
  padding: 12px;
  border-bottom: 1px solid #e0e0e0;
  display: flex;
  align-items: center;
  gap: 8px;
  background: rgba(0, 0, 0, 0.02);
}

.dark-mode .node-header {
  border-bottom-color: #444;
  background: rgba(255, 255, 255, 0.02);
}

.node-icon {
  font-size: 18px;
}

.node-title {
  flex: 1;
  font-weight: 600;
  font-size: 14px;
}

.node-title-input {
  flex: 1;
  border: none;
  background: transparent;
  font-weight: 600;
  font-size: 14px;
  color: inherit;
  padding: 4px;
  cursor: text;
}

.node-title-input:focus {
  outline: 1px solid #4CAF50;
  border-radius: 4px;
}

.node-delete {
  background: none;
  border: none;
  font-size: 20px;
  color: #999;
  cursor: pointer;
  padding: 0;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
}

.node-delete:hover {
  background: rgba(244, 67, 54, 0.1);
  color: #f44336;
}

.node-body {
  padding: 12px;
}

.selector-group {
  margin-bottom: 12px;
  padding: 8px;
  background: rgba(0, 0, 0, 0.02);
  border-radius: 4px;
}

.dark-mode .selector-group {
  background: rgba(255, 255, 255, 0.02);
}

.selector-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.selector-name {
  font-weight: 500;
  font-size: 13px;
}

.selector-edit {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 14px;
  padding: 4px;
}

.port-item {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 4px 0;
  font-size: 12px;
}

.port-dot {
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  font-size: 14px;
  user-select: none;
}

.port-dot.data {
  color: #2196F3;
}

.port-dot.action {
  color: #ff9800;
}

.port-dot.input,
.port-dot.output {
  color: #4CAF50;
}

.port-label {
  flex: 1;
}

.add-selector-btn {
  width: 100%;
  padding: 8px;
  background: transparent;
  border: 2px dashed #ddd;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
  color: #666;
  margin-top: 8px;
}

.add-selector-btn:hover {
  border-color: #4CAF50;
  color: #4CAF50;
}

.ports-section {
  margin-bottom: 8px;
}

.action-controls-section {
  margin: 8px 0;
  padding: 8px;
  background: rgba(255, 152, 0, 0.05);
  border-radius: 4px;
  font-size: 12px;
}

.action-control-item {
  display: flex;
  justify-content: space-between;
  padding: 4px 0;
}

.control-label {
  font-weight: 500;
}

.control-target {
  color: #666;
  font-size: 11px;
}

.dark-mode .control-target {
  color: #aaa;
}

.result-port {
  background: rgba(33, 150, 243, 0.05);
  padding: 6px;
  border-radius: 4px;
}

.execution-log {
  background: rgba(255, 255, 255, 0.98);
  border-top: 1px solid #e0e0e0;
  max-height: 200px;
  display: flex;
  flex-direction: column;
  backdrop-filter: blur(10px);
}

.dark-mode .execution-log {
  background: rgba(45, 45, 45, 0.98);
  border-top-color: #444;
}

.log-header {
  padding: 12px;
  border-bottom: 1px solid #e0e0e0;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.dark-mode .log-header {
  border-bottom-color: #444;
}

.log-header h4 {
  margin: 0;
  font-size: 14px;
}

.btn-clear-log {
  padding: 4px 12px;
  background: #e0e0e0;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
}

.log-content {
  flex: 1;
  overflow-y: auto;
  padding: 12px;
  font-family: 'Courier New', monospace;
  font-size: 12px;
}

.log-item {
  padding: 4px 0;
  display: flex;
  gap: 8px;
}

.log-time {
  color: #999;
}

.log-message {
  flex: 1;
}

.log-info {
  color: #2196F3;
}

.log-success {
  color: #4CAF50;
}

.log-error {
  color: #f44336;
}
</style>

