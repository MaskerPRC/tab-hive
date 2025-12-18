<template>
  <div
    v-if="show"
    class="workflow-editor-overlay"
    :class="{ 'selecting-element': isSelectingElement }"
  >
    <div class="workflow-editor" :class="{ 'dark-mode': darkMode }">
      <!-- 顶部工具栏 -->
      <div class="editor-header" :class="{ 'selecting-mode': isSelectingElement }">
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

      <!-- 元素选择提示层 -->
      <div v-if="isSelectingElement" class="element-selection-hint">
        <div class="hint-content">
          <div class="hint-icon">🎯</div>
          <div class="hint-text">
            <h3>正在选择网页元素</h3>
            <p>✓ 鼠标移动到元素上会显示黄色高亮</p>
            <p>✓ 点击元素即可选择</p>
            <p class="hint-small">按 ESC 取消选择</p>
          </div>
        </div>
      </div>

      <!-- 主要内容区 -->
      <div class="editor-body" v-show="!isSelectingElement">
        <!-- 左侧工具面板 -->
        <ToolsPanel
          :websites="websites"
          @add-webpage-node="handleAddWebpageNode"
          @add-flow-node="addFlowNode"
          @add-web-control-node="addWebControlNode"
          @start-element-selection="startElementSelection"
        />

        <!-- 画布区域 -->
        <div
          class="canvas-area"
          ref="canvasArea"
          :style="{ opacity: canvasOpacity }"
        >
          <!-- 连接线层 -->
          <ConnectionsLayer
            :connections="connections"
            :dragging-connection="draggingConnection"
          />

          <!-- 节点层 -->
          <div class="nodes-layer">
            <!-- 网页节点 -->
            <WebpageNode
              v-for="node in webpageNodes"
              :key="node.id"
              :node="node"
              @start-drag="startDragNode($event, node)"
              @delete="deleteNode(node.id)"
              @edit-selector="editSelectorConfig(node, $event)"
              @add-selector="startElementSelection(node)"
              @port-mousedown="handlePortMouseDown"
            />

            <!-- Flow节点 -->
            <FlowNode
              v-for="node in flowNodes"
              :key="node.id"
              :node="node"
              @start-drag="startDragNode($event, node)"
              @delete="deleteNode(node.id)"
              @update:name="node.name = $event"
              @port-mousedown="handlePortMouseDown"
            />

            <!-- Web Control节点 -->
            <WebControlNode
              v-for="node in webControlNodes"
              :key="node.id"
              :node="node"
              @start-drag="startDragNode($event, node)"
              @delete="deleteNode(node.id)"
              @update:name="node.name = $event"
              @port-mousedown="handlePortMouseDown"
            />
          </div>
        </div>
      </div>

      <!-- 执行日志 -->
      <ExecutionLog
        :logs="executionLog"
        @clear="clearLog"
      />
    </div>
    <!-- 关闭 .workflow-editor -->

    <!-- 选择器映射配置弹窗（放在 .workflow-editor 外层，避免被 pointer-events: none 影响） -->
    <SelectorMappingConfig
      v-if="showSelectorConfig"
      :show="showSelectorConfig"
      :selector-config="currentSelectorConfig"
      :dark-mode="darkMode"
      @save="handleSelectorConfigSave"
      @close="showSelectorConfig = false"
      @reselect="handleReselect"
    />

    <!-- 元素选择器（放在编辑器外层，避免被遮挡） -->
    <ElementSelector
      v-if="isSelectingElement"
      :is-active="isSelectingElement"
      :target-iframe="targetIframe"
      :current-website="currentWebsite"
      @select="handleElementSelected"
      @cancel="isSelectingElement = false"
    />
  </div>
  <!-- 关闭 .workflow-editor-overlay -->
</template>

<script>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { useWorkflowManager } from '../../composables/useWorkflowManager'
import { useNodeDrag } from '../../composables/useNodeDrag'
import { useConnectionDrag } from '../../composables/useConnectionDrag'
import { createSelectorConfig, createFlowNode, createWebControlNode, NODE_TYPES } from '../../models/workflowModels'
import SelectorMappingConfig from './SelectorMappingConfig.vue'
import ElementSelector from '../ElementSelector.vue'
import ToolsPanel from './ToolsPanel.vue'
import ExecutionLog from './ExecutionLog.vue'
import ConnectionsLayer from './ConnectionsLayer.vue'
import WebpageNode from './WebpageNode.vue'
import FlowNode from './FlowNode.vue'
import WebControlNode from './WebControlNode.vue'

export default {
  name: 'WorkflowEditor',
  components: {
    SelectorMappingConfig,
    ElementSelector,
    ToolsPanel,
    ExecutionLog,
    ConnectionsLayer,
    WebpageNode,
    FlowNode,
    WebControlNode
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
    layoutId: {
      type: [String, Number],
      required: true
    },
    layoutName: {
      type: String,
      default: '布局'
    },
    websites: {
      type: Array,
      default: () => []
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

    // 执行状态
    const isExecuting = ref(false)
    const executionLog = ref([])

    // 透明度控制
    const canvasOpacity = ref(0.7)

    // 使用拖拽composables
    const {
      startDragNode: startNodeDrag,
      handleNodeDrag,
      stopNodeDrag
    } = useNodeDrag()

    const {
      draggingConnection,
      startConnection,
      handleConnectionDrag,
      stopConnection
    } = useConnectionDrag()

    // 监听 show 属性变化
    watch(() => props.show, (newValue) => {
      console.log('[WorkflowEditor] props.show 变化:', newValue)
      if (newValue) {
        console.log('[WorkflowEditor] 编辑器应该显示')
      } else {
        console.log('[WorkflowEditor] 编辑器应该隐藏')
      }
    }, { immediate: true })

    // 监听元素选择状态变化
    watch(isSelectingElement, (newValue) => {
      console.log('[WorkflowEditor] isSelectingElement 变化:', newValue)
      if (newValue) {
        console.log('[WorkflowEditor] 进入元素选择模式，隐藏编辑器主体')
      } else {
        console.log('[WorkflowEditor] 退出元素选择模式，显示编辑器主体')
      }
    })

    // 初始化
    onMounted(() => {
      console.log('[WorkflowEditor] 组件已挂载')
      console.log('[WorkflowEditor] props.show:', props.show)
      console.log('[WorkflowEditor] props.layoutId:', props.layoutId)
      console.log('[WorkflowEditor] props.layoutName:', props.layoutName)
      console.log('[WorkflowEditor] props.websites:', props.websites)
      console.log('[WorkflowEditor] props.workflowId:', props.workflowId)

      if (props.workflowId) {
        console.log('[WorkflowEditor] 加载现有工作流')
        workflowManager.loadWorkflow(props.workflowId)
      } else if (!workflow.value) {
        console.log('[WorkflowEditor] 创建新工作流')
        workflowManager.createNewWorkflow(props.layoutId, props.layoutName, props.websites)
      }

      console.log('[WorkflowEditor] 工作流对象:', workflow.value)
      console.log('[WorkflowEditor] nodes 数组:', workflow.value?.nodes)
      console.log('[WorkflowEditor] webpageNodes:', webpageNodes.value)

      if (webpageNodes.value.length > 0) {
        console.log('[WorkflowEditor] 第一个网页节点:', webpageNodes.value[0])
        console.log('[WorkflowEditor] 第一个网页节点的 websiteId:', webpageNodes.value[0].websiteId)
      }

      // 添加全局事件监听
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
    })

    onUnmounted(() => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    })

    // 添加网页节点
    const handleAddWebpageNode = (website) => {
      console.log('[WorkflowEditor] 添加网页节点:', website)
      workflowManager.addWebpageNode(website.id, website.name || website.url)
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

    // 节点拖拽
    const startDragNode = (event, node) => {
      startNodeDrag(event, node, canvasArea.value)
    }

    // 端口鼠标按下
    const handlePortMouseDown = (event, nodeId, portId, portType) => {
      startConnection(event, nodeId, portId, portType, canvasArea.value)
    }

    // 开始元素选择
    const startElementSelection = (node = null) => {
      console.log('[WorkflowEditor] startElementSelection 被调用')
      console.log('[WorkflowEditor] 传入的 node:', node)
      console.log('[WorkflowEditor] webpageNodes.value:', webpageNodes.value)
      console.log('[WorkflowEditor] webpageNodes.value[0]:', webpageNodes.value[0])

      currentEditingNode.value = node || webpageNodes.value[0]
      if (!currentEditingNode.value) {
        alert('请先添加网页节点')
        return
      }

      console.log('[WorkflowEditor] 开始元素选择')
      console.log('[WorkflowEditor] currentEditingNode:', currentEditingNode.value)
      console.log('[WorkflowEditor] 目标网站ID:', currentEditingNode.value.websiteId)

      // 查找对应的webview/iframe
      const isElectron = window.electron?.isElectron
      const websiteId = currentEditingNode.value.websiteId

      console.log('[WorkflowEditor] 查找 webview/iframe，ID:', websiteId)

      if (isElectron) {
        const selector = `#webview-${websiteId}`
        console.log('[WorkflowEditor] Electron模式，选择器:', selector)
        targetIframe.value = document.querySelector(selector)

        if (targetIframe.value) {
          console.log('[WorkflowEditor] ✓ 找到 webview')
          console.log('[WorkflowEditor] webview.id:', targetIframe.value.id)
          console.log('[WorkflowEditor] webview.send 方法存在:', typeof targetIframe.value.send)
          console.log('[WorkflowEditor] webview.addEventListener 方法存在:', typeof targetIframe.value.addEventListener)
        }
      } else {
        const selector = `iframe[data-website-id="${websiteId}"]`
        console.log('[WorkflowEditor] 浏览器模式，选择器:', selector)
        targetIframe.value = document.querySelector(selector)
      }

      console.log('[WorkflowEditor] 找到的iframe/webview:', targetIframe.value)

      if (!targetIframe.value) {
        alert('未找到网页，请确保网页已加载')
        return
      }

      currentWebsite.value = { id: currentEditingNode.value.websiteId }
      isSelectingElement.value = true

      console.log('[WorkflowEditor] 元素选择模式已激活')
      console.log('[WorkflowEditor] isSelectingElement:', isSelectingElement.value)
    }

    // 处理元素选择完成
    const handleElementSelected = (result) => {
      console.log('[WorkflowEditor] 元素选择完成')
      console.log('[WorkflowEditor] 选择器:', result.selector)

      isSelectingElement.value = false

      const selectorConfig = createSelectorConfig(result.selector, '新元素')
      currentSelectorConfig.value = selectorConfig
      showSelectorConfig.value = true

      console.log('[WorkflowEditor] 打开配置对话框')
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

    // 鼠标移动
    const handleMouseMove = (event) => {
      handleNodeDrag(event, canvasArea.value)
      handleConnectionDrag(event, canvasArea.value)
    }

    // 鼠标释放
    const handleMouseUp = (event) => {
      stopNodeDrag(() => workflowManager.saveWorkflows())
      stopConnection(event, createConnectionBetweenPorts)
    }

    // 创建连接
    const createConnectionBetweenPorts = (
      fromNodeId, fromPortId, fromPortType,
      toNodeId, toPortId, toPortType
    ) => {
      // MVP: 简化的连接逻辑
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
      addFlowNode,
      addWebControlNode,
      deleteNode,
      startElementSelection,
      handleElementSelected,
      editSelectorConfig,
      handleSelectorConfigSave,
      handleReselect,
      startDragNode,
      handlePortMouseDown,
      handleTest,
      handleSave,
      handleClose,
      clearLog
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
  background: rgba(0, 0, 0, 0.3);
  backdrop-filter: blur(2px);
  z-index: 9999;
  display: flex;
  pointer-events: none;
}

.workflow-editor-overlay.selecting-element {
  background: transparent !important;
  backdrop-filter: none !important;
  pointer-events: none !important;
}

.workflow-editor {
  width: 100%;
  height: 100%;
  background: rgba(245, 245, 245, 0.95);
  display: flex;
  flex-direction: column;
  pointer-events: auto;
}

.workflow-editor.dark-mode {
  background: rgba(26, 26, 26, 0.95);
  color: #e0e0e0;
}

.selecting-element .workflow-editor {
  pointer-events: none;
}

.selecting-element .editor-header {
  pointer-events: auto;
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

.editor-header.selecting-mode {
  background: rgba(103, 58, 183, 0.98);
  color: #fff;
  border-bottom-color: rgba(103, 58, 183, 0.8);
  box-shadow: 0 4px 12px rgba(103, 58, 183, 0.4);
}

.editor-header.selecting-mode .god-mode-badge {
  background: rgba(255, 255, 255, 0.2);
  color: #fff;
}

.editor-header.selecting-mode .info-badge {
  background: rgba(255, 255, 255, 0.2);
  color: #fff;
}

.editor-header.selecting-mode .info-hint {
  background: rgba(255, 193, 7, 0.3);
  color: #fff;
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

.element-selection-hint {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  pointer-events: none;
}

.hint-content {
  text-align: center;
  padding: 32px 40px;
  background: rgba(255, 255, 255, 0.98);
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15);
  backdrop-filter: blur(10px);
  max-width: 450px;
  pointer-events: none;
  position: fixed;
  top: 120px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 9998;
}

.dark-mode .hint-content {
  background: rgba(45, 45, 45, 0.98);
}

.hint-icon {
  font-size: 64px;
  margin-bottom: 20px;
  animation: pulse 2s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.1); }
}

.hint-text h3 {
  margin: 0 0 12px 0;
  font-size: 18px;
  color: #333;
}

.dark-mode .hint-text h3 {
  color: #e0e0e0;
}

.hint-text p {
  margin: 6px 0;
  font-size: 13px;
  color: #666;
  text-align: left;
}

.dark-mode .hint-text p {
  color: #aaa;
}

.hint-small {
  font-size: 12px !important;
  font-style: italic;
  color: #999 !important;
  margin-top: 16px !important;
  text-align: center !important;
}

.dark-mode .hint-small {
  color: #777 !important;
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

.canvas-area {
  flex: 1;
  position: relative;
  overflow: auto;
  background:
    linear-gradient(90deg, rgba(224, 224, 224, 0.3) 1px, transparent 1px) 0 0 / 20px 20px,
    linear-gradient(rgba(224, 224, 224, 0.3) 1px, transparent 1px) 0 0 / 20px 20px;
  background-color: rgba(250, 250, 250, 0.5);
}

.dark-mode .canvas-area {
  background:
    linear-gradient(90deg, rgba(51, 51, 51, 0.3) 1px, transparent 1px) 0 0 / 20px 20px,
    linear-gradient(rgba(51, 51, 51, 0.3) 1px, transparent 1px) 0 0 / 20px 20px;
  background-color: rgba(26, 26, 26, 0.5);
}

.nodes-layer {
  position: relative;
  z-index: 2;
  min-width: 2000px;
  min-height: 2000px;
}

/* 确保配置对话框和元素选择器永远可以交互 */
.selector-mapping-overlay,
.selector-toolbar {
  pointer-events: auto !important;
  z-index: 10000;
}

.selector-mapping-overlay button,
.selector-mapping-overlay input,
.selector-mapping-overlay select,
.selector-toolbar button,
.selector-toolbar input,
.selector-toolbar select {
  pointer-events: auto !important;
  cursor: pointer;
}
</style>
