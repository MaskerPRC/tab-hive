<template>
  <div
    class="grid-view"
    :class="{ 
      'fullscreen-mode': fullscreenIndex !== null,
      'automation-mode': viewMode === 'automation'
    }"
    @dragenter.prevent="handleDragEnter"
    @dragleave="handleViewDragLeave"
    @mousemove="handleGridMouseMove"
  >
    <!-- 全屏模式下的顶部退出按钮条 -->
    <FullscreenBar
      :show="fullscreenIndex !== null && showFullscreenBar"
      :can-go-back="fullscreenCanGoBack"
      :can-go-forward="fullscreenCanGoForward"
      @exit="$emit('exitFullscreen')"
      @leave="handleFullscreenBarLeave"
      @selectElement="startElementSelection"
      @refresh="handleFullscreenRefresh"
      @go-back="handleFullscreenGoBack"
      @go-forward="handleFullscreenGoForward"
    />

    <!-- 元素选择器覆盖层（全屏模式） -->
    <ElementSelector
      v-if="fullscreenIndex !== null"
      :is-active="isSelectingElement"
      :target-iframe="fullscreenIframe"
      :current-website="currentFullscreenWebsite"
      @select="handleElementSelected"
      @cancel="cancelElementSelection"
    />
    
    <!-- 元素选择器覆盖层（自动化视图模式） -->
    <ElementSelector
      v-if="viewMode === 'automation' && automationSelectingElement"
      :is-active="automationSelectingElement"
      :target-iframe="automationTargetIframe"
      :current-website="automationTargetWebsite"
      @select="handleAutomationElementSelected"
      @cancel="handleAutomationElementSelectionCancel"
    />
    
    <!-- 映射类型选择对话框 -->
    <div v-if="showMappingTypeDialog" class="mapping-type-dialog-overlay" @click.self="handleCancelMappingType">
      <div class="mapping-type-dialog" :class="{ 'dark-mode': false }">
        <div class="dialog-header">
          <h3>选择映射类型</h3>
          <button @click="handleCancelMappingType" class="close-btn">×</button>
        </div>
        <div class="dialog-body">
          <p class="dialog-hint">请选择要添加的映射类型：</p>
          <div class="mapping-type-options">
            <button @click="handleSelectMappingType('data')" class="mapping-type-btn data-mapping">
              <div class="btn-icon">📤</div>
              <div class="btn-content">
                <div class="btn-title">数据映射</div>
                <div class="btn-desc">提取元素的数据（文本、属性等）</div>
              </div>
            </button>
            <button @click="handleSelectMappingType('action')" class="mapping-type-btn action-mapping">
              <div class="btn-icon">⚡</div>
              <div class="btn-content">
                <div class="btn-title">交互映射</div>
                <div class="btn-desc">对元素执行操作（点击、输入等）</div>
              </div>
            </button>
          </div>
          <div v-if="pendingElementSelection" class="selector-preview">
            <div class="preview-label">选择器：</div>
            <code class="preview-selector">{{ pendingElementSelection.selector }}</code>
          </div>
        </div>
      </div>
    </div>

    <!-- 拖动/调整大小时的全局遮罩层，防止iframe捕获鼠标事件 -->
    <div
      v-if="isDraggingItem || isResizing"
      class="drag-overlay"
    ></div>

    <!-- 对话框管理器 -->
    <GridDialogManager
      :editing-slot="dialogState.editingSlot"
      :editing-dialog-type="dialogState.editingDialogType"
      :new-website="dialogState.newWebsite"
      :show-custom-html-dialog="dialogState.showCustomHtmlDialog"
      :show-rearrange-dialog="dialogState.showRearrangeDialog"
      :context-menu-visible="dialogState.contextMenuVisible && viewMode !== 'automation'"
      :context-menu-x="dialogState.contextMenuX"
      :context-menu-y="dialogState.contextMenuY"
      :websites="websites"
      @confirm-website="onConfirmAddWebsite"
      @cancel-edit="cancelAddWebsite"
      @confirm-custom-html="handleCustomHtmlConfirm"
      @cancel-custom-html="closeCustomHtmlDialog"
      @confirm-rearrange="handleRearrangeConfirm"
      @cancel-rearrange="closeRearrangeDialog"
      @context-add-website="handleContextMenuAddWebsite"
      @context-add-custom-html="handleContextMenuAddCustomHtml"
      @close-context-menu="closeContextMenu"
    />
    
    <!-- 自动化视图右键菜单 -->
    <AutomationContextMenu
      v-if="viewMode === 'automation'"
      :visible="automationContextMenuVisible"
      :x="automationContextMenuX"
      :y="automationContextMenuY"
      @add-trigger="handleAddTriggerNode"
      @add-http="handleAddHttpNode"
      @add-set="handleAddSetNode"
      @add-web-action="handleAddWebActionNode"
      @close="closeAutomationContextMenu"
    />

    <!-- 画布容器 -->
    <div
      class="canvas-wrapper"
      :class="{ 'panning': isPanning || false, 'dragging-item': isDraggingItem || isResizing }"
      @mousedown="handleCanvasMouseDown"
      @mousemove="handleCanvasMouseMoveForConnection"
      @mouseup="handleCanvasMouseUpForConnection"
      @wheel="handleCanvasWheel"
      @contextmenu="handleContextMenu"
      @click="closeAutomationContextMenu"
      @drop.prevent="handleDropOnEmpty"
      @dragover.prevent="handleDragOverOnEmpty"
      @dragenter.prevent="handleDragEnterForFiles"
    >
      <!-- 连接线层（自动化视图）- 放在 canvas-wrapper 下，使用屏幕坐标 -->
      <svg
        v-if="viewMode === 'automation'"
        class="connection-layer"
        :style="connectionLayerStyle"
      >
        <!-- 已保存的连接线 -->
        <g v-for="(connection, index) in connections" :key="`connection-${index}`">
          <path
            :d="getConnectionPath(connection)"
            :stroke="connection.type === 'data' ? '#4CAF50' : '#2196F3'"
            :stroke-width="2"
            :stroke-dasharray="connection.type === 'data' ? '5,5' : '0'"
            fill="none"
            marker-end="url(#arrowhead)"
          />
        </g>
        <!-- 临时连接线（正在拖动时） -->
        <path
          v-if="isConnecting"
          :d="tempConnectionPath"
          :stroke="connectingPortType === 'data-output' ? '#4CAF50' : '#2196F3'"
          :stroke-width="2"
          :stroke-dasharray="connectingPortType === 'data-output' ? '5,5' : '0'"
          fill="none"
          marker-end="url(#arrowhead)"
          opacity="0.7"
          style="pointer-events: none;"
        />
        <!-- 箭头标记 -->
        <defs>
          <marker
            id="arrowhead"
            markerWidth="10"
            markerHeight="10"
            refX="9"
            refY="3"
            orient="auto"
          >
            <polygon points="0 0, 10 3, 0 6" fill="currentColor" />
          </marker>
        </defs>
      </svg>
      
      <!-- 画布内容 -->
      <div
        class="grid-container"
        :class="{
          'free-layout': true,
          'is-dragging': isDraggingItem || isResizing
        }"
        :style="transformStyle"
        :data-websites-count="allWebsites.length"
      >
        <!-- 网站卡片列表 -->
        <GridWebsiteList
          :all-websites="allWebsites"
          :fullscreen-index="fullscreenIndex"
          :drag-over-index="dragOverIndex"
          :is-dragging="isDragging"
          :is-dragging-item="isDraggingItem"
          :current-drag-index="currentDragIndex"
          :is-resizing="isResizing"
          :current-resize-index="currentResizeIndex"
          :drag-is-colliding="dragIsColliding"
          :resize-is-colliding="resizeIsColliding"
          :global-settings="globalSettings"
          :get-item-style="getItemStyle"
          :is-automation-mode="viewMode === 'automation'"
          :automation-selecting-website-id="automationTargetWebsite?.id || null"
          :get-automation-data="getAutomationDataForWebsite"
          @drag-start="startDrag"
          @drag-over="handleDragOver"
          @drag-leave="handleDragLeave"
          @drop="handleDrop"
          @refresh="handleRefreshWebsite"
          @copy="handleCopyWebsite"
          @edit="handleEditWebsite"
          @fullscreen="handleFullscreenToggle"
          @remove="handleRemoveWebsite"
          @toggle-mute="handleToggleMute"
          @open-script-panel="handleOpenScriptPanel"
          @open-monitoring="(websiteId, darkMode) => $emit('open-monitoring', websiteId, darkMode)"
          @update-url="handleUpdateUrl"
          @resize-start="startResize"
          @start-automation-element-selection="handleStartAutomationElementSelection"
          @edit-data-mapping="handleEditDataMapping"
          @delete-data-mapping="handleDeleteDataMapping"
          @edit-action-mapping="handleEditActionMapping"
          @delete-action-mapping="handleDeleteActionMapping"
          @port-mousedown="handlePortMouseDown"
        />
        
        <!-- 工作流节点层（自动化视图） -->
        <div
          v-if="viewMode === 'automation'"
          class="workflow-nodes-layer"
          :style="workflowNodesLayerStyle"
        >
          <WorkflowNode
            v-for="node in workflowNodes"
            :key="node.id"
            :node="node"
            :is-selected="selectedNodeId === node.id"
            :canvas-transform="canvasTransform"
            @node-mousedown="handleNodeMouseDown"
            @node-click="handleNodeClick"
            @port-mousedown="handleNodePortMouseDown"
            @execute="handleNodeExecute"
          />
        </div>
        
        <!-- 绘制层 -->
        <GridDrawingLayer
          :is-drawing-mode="isDrawingMode"
          :saved-drawings="savedDrawings"
          :current-path="currentPath"
          :drawing-color="drawingColor"
          :drawing-width="drawingWidth"
          :text-input="textInput"
          :image-upload="imageUpload"
          :canvas-transform="canvasTransform"
          @drawing-mouse-down="handleDrawingMouseDownWrapper"
          @drawing-mouse-move="handleDrawingMouseMove"
          @drawing-mouse-up="handleDrawingMouseUp"
          @text-submit="handleTextSubmit"
          @text-cancel="handleTextCancel"
          @image-file-select="handleImageFileSelect"
          @image-cancel="handleImageCancel"
          @update-drawing-item="updateDrawingItem"
        />
      </div>
    </div>

    <!-- 画布控制按钮（全屏时隐藏） -->
    <CanvasControls
      v-if="fullscreenIndex === null"
      :zoom-percentage="zoomPercentage"
      :is-drawing-mode="isDrawingMode"
      :drawing-tool="drawingTool"
      :drawing-color="drawingColor"
      :drawing-width="drawingWidth"
      :is-automation-mode="viewMode === 'automation'"
      @zoom-in="zoomIn"
      @zoom-out="zoomOut"
      @reset="resetTransform"
      @auto-arrange="handleAutoArrange"
      @rearrange="openRearrangeDialog"
      @toggle-drawing="toggleDrawingMode"
      @set-tool="setDrawingTool"
      @update-color="setDrawingColor"
      @update-width="setDrawingWidth"
      @clear-drawings="clearAllDrawings"
      @add-website="startAddWebsite(-1)"
      @toggle-view-mode="toggleViewMode"
    />
  </div>
</template>

<script>
// 子组件
import FullscreenBar from './FullscreenBar.vue'
import ElementSelector from './ElementSelector.vue'
import { ref, computed, watch } from 'vue'
import CanvasControls from './CanvasControls.vue'
import GridDialogManager from './GridDialogManager.vue'
import GridDrawingLayer from './GridDrawingLayer.vue'
import GridWebsiteList from './GridWebsiteList.vue'
import AutomationContextMenu from './AutomationContextMenu.vue'
import WorkflowNode from './WorkflowNode.vue'

// 主逻辑 Composable
import { useGridViewSetup } from '../composables/useGridViewSetup'
import { useAutomationData } from '../composables/useAutomationData'
import { createTriggerNode, createHttpNode, createSetNode, createWebActionNode } from '../models/workflowModels'

export default {
  name: 'GridView',
  components: {
    FullscreenBar,
    ElementSelector,
    CanvasControls,
    GridDialogManager,
    GridDrawingLayer,
    GridWebsiteList,
    AutomationContextMenu,
    WorkflowNode
  },
  props: {
    websites: {
      type: Array,
      required: true
    },
    rows: {
      type: Number,
      required: true
    },
    cols: {
      type: Number,
      required: true
    },
    fullscreenIndex: {
      type: Number,
      default: null
    },
    globalSettings: {
      type: Object,
      default: () => ({ showTitles: true })
    },
    drawings: {
      type: Array,
      default: () => []
    },
    canvasTransform: {
      type: Object,
      default: null
    }
  },
  emits: [
    'fullscreen', 
    'exitFullscreen', 
    'add-website', 
    'copy-website', 
    'remove-website', 
    'update-website', 
    'update-drawings', 
    'update-canvas-transform', 
    'open-script-panel', 
    'import-layout-from-image', 
    'open-monitoring', 
,
    'start-automation-element-selection',
    'update-automation-data'
  ],
  setup(props, { emit }) {
    // 使用主逻辑 composable，它内部组织了所有其他 composables
    const setupResult = useGridViewSetup(props, { emit })
    
    // 自动化数据管理
    const automationData = useAutomationData()
    
    // 自动化视图的元素选择器状态
    const automationSelectingElement = ref(false)
    const automationTargetIframe = ref(null)
    const automationTargetWebsite = ref(null)
    const pendingElementSelection = ref(null) // 待处理的元素选择结果
    
    // 处理自动化视图的元素选择
    const handleAutomationElementSelected = (result) => {
      console.log('[GridView] 自动化视图元素选择完成:', result)
      const websiteId = automationTargetWebsite.value?.id
      
      if (!websiteId) {
        console.error('[GridView] 没有 websiteId')
        return
      }
      
      // 获取选择器
      const selector = result.selector || result.selectors?.[0]
      if (!selector) {
        console.error('[GridView] 没有选择器')
        return
      }
      
      // 如果正在编辑映射，直接更新映射的选择器
      if (editingMapping.value) {
        const { type, websiteId: editWebsiteId, mappingId } = editingMapping.value
        if (type === 'data') {
          automationData.updateDataMapping(editWebsiteId, mappingId, { selector })
          console.log('[GridView] 已更新数据映射的选择器')
        } else if (type === 'action') {
          automationData.updateActionMapping(editWebsiteId, mappingId, { selector })
          console.log('[GridView] 已更新交互映射的选择器')
        }
        // 清除编辑状态
        editingMapping.value = null
        // 重置选择器状态
        automationSelectingElement.value = false
        automationTargetIframe.value = null
        automationTargetWebsite.value = null
        return
      }
      
      // 保存选择结果，等待用户选择映射类型
      pendingElementSelection.value = {
        websiteId,
        selector,
        elementInfo: result.elementInfo
      }
      
      // 显示选择映射类型的对话框
      showMappingTypeDialog.value = true
      
      // 重置选择器状态
      automationSelectingElement.value = false
      automationTargetIframe.value = null
      automationTargetWebsite.value = null
    }
    
    // 映射类型对话框状态
    const showMappingTypeDialog = ref(false)
    
    // 选择映射类型并添加
    const handleSelectMappingType = (mappingType) => {
      if (!pendingElementSelection.value) return
      
      const { websiteId, selector, elementInfo } = pendingElementSelection.value
      const elementName = elementInfo?.tagName?.toLowerCase() || '元素'
      
      if (mappingType === 'data') {
        // 添加数据映射
        automationData.addDataMapping(websiteId, selector, elementName)
      } else if (mappingType === 'action') {
        // 添加交互映射（默认点击）
        automationData.addActionMapping(websiteId, selector, 'click', elementName)
      }
      
      // 关闭对话框并清除待处理的选择
      showMappingTypeDialog.value = false
      pendingElementSelection.value = null
      
      console.log('[GridView] 已添加映射，网站ID:', websiteId)
      console.log('[GridView] 当前数据映射:', automationData.getAutomationData(websiteId).dataMappings)
      console.log('[GridView] 当前交互映射:', automationData.getAutomationData(websiteId).actionMappings)
    }
    
    // 取消添加映射
    const handleCancelMappingType = () => {
      showMappingTypeDialog.value = false
      pendingElementSelection.value = null
    }
    
    const handleAutomationElementSelectionCancel = () => {
      console.log('[GridView] 取消自动化视图元素选择')
      automationSelectingElement.value = false
      automationTargetIframe.value = null
      automationTargetWebsite.value = null
      // 清除编辑状态
      editingMapping.value = null
    }
    
    // 监听来自网站卡片的元素选择请求
    const handleStartAutomationElementSelection = (websiteId) => {
      console.log('[GridView] ========== 开始自动化视图元素选择 ==========')
      console.log('[GridView] websiteId:', websiteId)
      console.log('[GridView] 当前 viewMode:', setupResult.viewMode.value)
      console.log('[GridView] 当前 allWebsites 数量:', setupResult.allWebsites.value.length)
      
      // 找到对应的网站
      const website = setupResult.allWebsites.value.find(w => {
        // 支持字符串和数字类型的 ID 比较
        const wId = String(w.id)
        const targetId = String(websiteId)
        return wId === targetId
      })
      
      if (!website) {
        console.error('[GridView] 未找到网站:', websiteId)
        console.error('[GridView] 所有网站ID:', setupResult.allWebsites.value.map(w => ({ id: w.id, type: typeof w.id })))
        alert(`未找到网站 ID: ${websiteId}`)
        return
      }
      
      console.log('[GridView] 找到网站:', website)
      automationTargetWebsite.value = website
      
      // 查找对应的 webview 或 iframe
      const isElectron = window.electron?.isElectron
      console.log('[GridView] isElectron:', isElectron)
      
      if (isElectron) {
        const webviewId = website.type === 'custom-html' 
          ? `webview-custom-${website.id}` 
          : `webview-${website.id}`
        console.log('[GridView] 查找 webview，ID:', webviewId)
        
        // 等待一下，确保 webview 已渲染
        setTimeout(() => {
          const webview = document.querySelector(`#${webviewId}`)
          console.log('[GridView] 找到 webview:', !!webview, webview)
          console.log('[GridView] 页面上所有 webview ID:', Array.from(document.querySelectorAll('webview')).map(w => w.id))
          
          if (webview) {
            automationTargetIframe.value = webview
            automationSelectingElement.value = true
            console.log('[GridView] ✅ 元素选择器已启动')
            console.log('[GridView] automationSelectingElement:', automationSelectingElement.value)
            console.log('[GridView] automationTargetIframe:', automationTargetIframe.value)
            console.log('[GridView] viewMode:', setupResult.viewMode.value)
          } else {
            console.error('[GridView] 未找到 webview，ID:', webviewId)
            console.error('[GridView] 页面上所有 webview:', Array.from(document.querySelectorAll('webview')).map(w => ({ id: w.id, src: w.src?.substring(0, 50) })))
            alert('未找到网页，请确保网页已加载')
          }
        }, 100)
      } else {
        const iframe = document.querySelector(`iframe[data-website-id="${website.id}"]`)
        console.log('[GridView] 查找 iframe，找到:', !!iframe)
        
        if (iframe) {
          automationTargetIframe.value = iframe
          automationSelectingElement.value = true
          console.log('[GridView] ✅ 元素选择器已启动（iframe）')
        } else {
          console.error('[GridView] 未找到 iframe')
          alert('未找到网页，请确保网页已加载')
        }
      }
    }
    
    // 获取网站的自动化数据
    const getAutomationDataForWebsite = (websiteId) => {
      return automationData.getAutomationData(websiteId)
    }
    
    // 正在编辑的映射（用于编辑时重新选择元素）
    const editingMapping = ref(null)
    
    // 处理编辑数据映射
    const handleEditDataMapping = (websiteId, mapping) => {
      console.log('[GridView] 编辑数据映射:', websiteId, mapping)
      // 保存正在编辑的映射信息
      editingMapping.value = {
        type: 'data',
        websiteId,
        mappingId: mapping.id
      }
      // 启动元素选择器，让用户重新选择元素
      handleStartAutomationElementSelection(websiteId)
    }
    
    // 处理删除数据映射
    const handleDeleteDataMapping = (websiteId, mappingId) => {
      console.log('[GridView] 删除数据映射:', websiteId, mappingId)
      automationData.deleteDataMapping(websiteId, mappingId)
    }
    
    // 处理编辑交互映射
    const handleEditActionMapping = (websiteId, mapping) => {
      console.log('[GridView] 编辑交互映射:', websiteId, mapping)
      // 保存正在编辑的映射信息
      editingMapping.value = {
        type: 'action',
        websiteId,
        mappingId: mapping.id
      }
      // 启动元素选择器，让用户重新选择元素
      handleStartAutomationElementSelection(websiteId)
    }
    
    // 处理删除交互映射
    const handleDeleteActionMapping = (websiteId, mappingId) => {
      console.log('[GridView] 删除交互映射:', websiteId, mappingId)
      automationData.deleteActionMapping(websiteId, mappingId)
    }
    
    // ==================== 连接线绘制 ====================
    const isConnecting = ref(false)
    const connectingPort = ref(null) // { websiteId, portId, portType, x, y, isNodePort, nodeId?, direction? }
    const tempConnectionEnd = ref({ x: 0, y: 0 })
    const connections = ref([]) // 已保存的连接线
    
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
      isConnecting.value = true
      connectingPort.value = {
        websiteId,
        portId,
        portType,
        x: portPos.x,
        y: portPos.y,
        isNodePort: false
      }
      tempConnectionEnd.value = { x: portPos.x, y: portPos.y }
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
              for (const website of setupResult.allWebsites.value) {
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
    
    // ==================== 工作流节点管理 ====================
    const workflowNodes = ref([]) // 工作流节点列表
    const automationContextMenuVisible = ref(false)
    const automationContextMenuX = ref(0)
    const automationContextMenuY = ref(0)
    const contextMenuClickPosition = ref({ x: 0, y: 0 }) // 右键点击位置，用于放置新节点
    
    // 处理自动化视图的右键菜单
    const handleAutomationContextMenu = (event) => {
      if (setupResult.viewMode.value !== 'automation') return
      
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
    const originalHandleContextMenu = setupResult.handleContextMenu
    const handleContextMenu = (event) => {
      if (setupResult.viewMode.value === 'automation') {
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
      
      isConnecting.value = true
      connectingPort.value = {
        nodeId: node.id,
        portId: port.id,
        portType: port.portType || 'execution',
        direction: direction,
        x: portPos.x,
        y: portPos.y,
        isNodePort: true
      }
      tempConnectionEnd.value = { x: portPos.x, y: portPos.y }
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
    
    // ==================== 执行引擎 ====================
    const executingNodeId = ref(null)
    const executionContext = ref({}) // 执行上下文，存储数据
    
    // 获取数据映射的值
    const getDataMappingValue = async (websiteId, portId) => {
      try {
        const websiteAutomationData = automationData.getAutomationData(websiteId)
        const mapping = [...(websiteAutomationData.dataMappings || []), ...(websiteAutomationData.actionMappings || [])]
          .find(m => m.portId === portId)
        
        if (!mapping || !mapping.selector) {
          console.warn('[执行引擎] 未找到映射或选择器:', { websiteId, portId })
          return ''
        }
        
        // 查找对应的网站
        const website = setupResult.allWebsites.value.find(w => String(w.id) === String(websiteId))
        if (!website) {
          console.warn('[执行引擎] 未找到网站:', websiteId)
          return ''
        }
        
        // 在 Electron 环境下，需要通过 webview 执行脚本
        const isElectron = window.electron?.isElectron
        if (isElectron) {
          const webviewId = website.type === 'custom-html' 
            ? `webview-custom-${website.id}` 
            : `webview-${website.id}`
          const webview = document.querySelector(`#${webviewId}`)
          
          if (webview && webview.executeJavaScript) {
            const script = `
              (function() {
                try {
                  const element = document.querySelector('${mapping.selector.replace(/'/g, "\\'")}');
                  if (!element) return '';
                  return element.textContent?.trim() || '';
                } catch(e) {
                  return '';
                }
              })()
            `
            const result = await webview.executeJavaScript(script)
            return result || ''
          }
        } else {
          // 浏览器环境，通过 iframe
          const iframe = document.querySelector(`iframe[data-website-id="${website.id}"]`)
          if (iframe && iframe.contentWindow) {
            try {
              const element = iframe.contentDocument?.querySelector(mapping.selector)
              return element?.textContent?.trim() || ''
            } catch (e) {
              console.error('[执行引擎] 无法访问 iframe 内容:', e)
              return ''
            }
          }
        }
        
        return ''
      } catch (error) {
        console.error('[执行引擎] 获取数据映射值失败:', error)
        return ''
      }
    }
    
    // 执行节点
    const executeNode = async (node) => {
      if (executingNodeId.value) {
        console.warn('[执行引擎] 已有节点正在执行')
        return
      }
      
      executingNodeId.value = node.id
      console.log('[执行引擎] 开始执行节点:', node.type, node.id)
      
      try {
        if (node.type === 'trigger') {
          // 触发器节点：找到连接的输出节点并执行
          const outputPort = node.outputPorts?.[0]
          if (outputPort) {
            const nextConnections = connections.value.filter(c => 
              c.from.nodeId === node.id && c.from.portId === outputPort.id
            )
            
            for (const connection of nextConnections) {
              const nextNode = workflowNodes.value.find(n => n.id === connection.to.nodeId)
              if (nextNode) {
                await executeNode(nextNode)
              }
            }
          }
        } else if (node.type === 'http') {
          // HTTP 节点：执行 HTTP 请求
          await executeHttpNode(node)
        } else if (node.type === 'set') {
          // Set 节点：设置数据
          await executeSetNode(node)
        } else if (node.type === 'web-action') {
          // 网页操作节点：执行网页操作
          await executeWebActionNode(node)
        }
        
        // 继续执行连接的节点
        const outputPorts = node.outputPorts || []
        for (const outputPort of outputPorts) {
          const nextConnections = connections.value.filter(c => 
            c.from.nodeId === node.id && c.from.portId === outputPort.id
          )
          
          for (const connection of nextConnections) {
            const nextNode = workflowNodes.value.find(n => n.id === connection.to.nodeId)
            if (nextNode) {
              await executeNode(nextNode)
            }
          }
        }
      } catch (error) {
        console.error('[执行引擎] 执行节点失败:', error)
      } finally {
        executingNodeId.value = null
      }
    }
    
    // 执行 HTTP 节点
    const executeHttpNode = async (node) => {
      console.log('[执行引擎] 执行 HTTP 节点')
      const config = node.config || {}
      
      // 处理数据引用
      let url = config.url || ''
      let body = config.body || ''
      
      if (config.dataReferences) {
        for (const [key, ref] of Object.entries(config.dataReferences)) {
          const value = await getDataMappingValue(ref.websiteId, ref.portId)
          // 替换 URL 和 body 中的占位符
          url = url.replace(`{{${key}}}`, value)
          body = body.replace(`{{${key}}}`, value)
        }
      }
      
      try {
        const response = await fetch(url, {
          method: config.method || 'GET',
          headers: config.headers || {},
          body: config.method !== 'GET' ? body : undefined
        })
        
        const result = await response.text()
        console.log('[执行引擎] HTTP 请求完成:', result)
        executionContext.value[`http_${node.id}`] = result
      } catch (error) {
        console.error('[执行引擎] HTTP 请求失败:', error)
      }
    }
    
    // 执行 Set 节点
    const executeSetNode = async (node) => {
      console.log('[执行引擎] 执行 Set 节点')
      const config = node.config || {}
      
      if (config.dataReferences) {
        for (const [key, ref] of Object.entries(config.dataReferences)) {
          const value = await getDataMappingValue(ref.websiteId, ref.portId)
          executionContext.value[key] = value
          console.log('[执行引擎] 设置变量:', key, '=', value)
        }
      }
    }
    
    // 执行网页操作节点
    const executeWebActionNode = async (node) => {
      console.log('[执行引擎] 执行网页操作节点')
      const config = node.config || {}
      
      if (!config.actionPort) {
        console.warn('[执行引擎] 网页操作节点未配置交互映射')
        return
      }
      
      const { websiteId, portId } = config.actionPort
      
      // 查找对应的映射
      const websiteAutomationData = automationData.getAutomationData(websiteId)
      const actionMapping = (websiteAutomationData.actionMappings || []).find(m => m.portId === portId)
      
      if (!actionMapping || !actionMapping.selector) {
        console.warn('[执行引擎] 未找到交互映射')
        return
      }
      
      // 查找对应的网站
      const website = setupResult.allWebsites.value.find(w => String(w.id) === String(websiteId))
      if (!website) {
        console.warn('[执行引擎] 未找到网站')
        return
      }
      
      // 执行操作
      const isElectron = window.electron?.isElectron
      if (isElectron) {
        const webviewId = website.type === 'custom-html' 
          ? `webview-custom-${website.id}` 
          : `webview-${website.id}`
        const webview = document.querySelector(`#${webviewId}`)
        
        if (webview && webview.executeJavaScript) {
          const script = `
            (function() {
              try {
                const element = document.querySelector('${actionMapping.selector.replace(/'/g, "\\'")}');
                if (!element) return { success: false, error: '元素未找到' };
                element.click();
                return { success: true };
              } catch(e) {
                return { success: false, error: e.message };
              }
            })()
          `
          const result = await webview.executeJavaScript(script)
          console.log('[执行引擎] 网页操作完成:', result)
        }
      } else {
        // 浏览器环境
        const iframe = document.querySelector(`iframe[data-website-id="${website.id}"]`)
        if (iframe && iframe.contentWindow) {
          try {
            const element = iframe.contentDocument?.querySelector(actionMapping.selector)
            if (element) {
              element.click()
              console.log('[执行引擎] 网页操作完成')
            }
          } catch (e) {
            console.error('[执行引擎] 无法执行网页操作:', e)
          }
        }
      }
    }
    
    // 处理节点执行
    const handleNodeExecute = (node) => {
      if (node.type === 'trigger') {
        executeNode(node)
      }
    }
    
    // 暴露方法给父组件
    return {
      ...setupResult,
      // 自动化视图元素选择器
      automationSelectingElement,
      automationTargetIframe,
      automationTargetWebsite,
      handleAutomationElementSelected,
      handleAutomationElementSelectionCancel,
      handleStartAutomationElementSelection,
      // 自动化数据
      getAutomationDataForWebsite,
      automationData,
      // 映射类型对话框
      showMappingTypeDialog,
      pendingElementSelection,
      handleSelectMappingType,
      handleCancelMappingType,
      // 编辑和删除映射
      handleEditDataMapping,
      handleDeleteDataMapping,
      handleEditActionMapping,
      handleDeleteActionMapping,
      // 连接线
      handlePortMouseDown,
      handleConnectionMouseMove,
      handleConnectionMouseUp,
      handleCanvasMouseMoveForConnection,
      handleCanvasMouseUpForConnection,
      tempConnectionPath,
      connectionLayerStyle,
      connections,
      isConnecting,
      connectingPortType: computed(() => connectingPort.value?.portType || ''),
      // 工作流节点
      workflowNodes,
      automationContextMenuVisible,
      automationContextMenuX,
      automationContextMenuY,
      handleAddTriggerNode,
      handleAddHttpNode,
      handleAddSetNode,
      handleAddWebActionNode,
      closeAutomationContextMenu,
      handleContextMenu,
      // 节点交互
      selectedNodeId,
      handleNodeMouseDown,
      handleNodeClick,
      handleNodePortMouseDown,
      handleNodeExecute,
      workflowNodesLayerStyle,
      // 执行引擎
      executingNodeId,
      executionContext
    }
  }
}
</script>

<style scoped>
.grid-view {
  flex: 1;
  width: 100%;
  height: 100%;
  padding: 0;
  overflow-y: auto;
  overflow-x: hidden;
  position: relative;
  scrollbar-width: none;
  -ms-overflow-style: none;
  background: #f8fafc;
}

.grid-view::before {
  content: '';
  position: absolute;
  inset: 0;
  background-image: radial-gradient(#cbd5e1 1px, transparent 1px);
  background-size: 24px 24px;
  background-position: 0 0;
  opacity: 0.4;
  pointer-events: none;
  z-index: 0;
}

.grid-view::-webkit-scrollbar {
  display: none;
}

.fullscreen-mode {
  position: relative;
  padding: 0;
  overflow: hidden;
}

/* 全屏模式下限制 grid-container 尺寸，使全屏卡片正确填充可见区域 */
.fullscreen-mode .canvas-wrapper {
  width: 100%;
  height: 100%;
}

.fullscreen-mode .grid-container {
  min-width: 100% !important;
  min-height: 100% !important;
  width: 100%;
  height: 100%;
  transform: none !important;
  transition: none !important;
}

.drag-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 9998;
  background: transparent;
  cursor: move;
}

.canvas-wrapper {
  width: 100%;
  height: 100%;
  position: relative;
  overflow: hidden;
  cursor: default;
  z-index: 1;
}

.canvas-wrapper.panning {
  cursor: grabbing;
}

.canvas-wrapper.dragging-item {
  cursor: move;
}

.grid-container {
  width: 100%;
  min-height: 100%;
  height: auto;
  position: relative;
  min-width: 200vw;
  min-height: 200vh;
  will-change: transform;
  transition: transform 0.1s ease-out;
}

.canvas-wrapper.panning .grid-container {
  transition: none !important;
}

.grid-container.free-layout {
  position: relative;
  background: transparent;
}

.grid-container.is-dragging .website-iframe {
  pointer-events: none;
}

/* 映射类型选择对话框 */
.mapping-type-dialog-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10001;
}

.mapping-type-dialog {
  background: white;
  border-radius: 12px;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
  min-width: 400px;
  max-width: 500px;
  animation: fadeInZoom 0.3s ease-out;
}

.mapping-type-dialog.dark-mode {
  background: #2a2a2a;
  color: #e0e0e0;
}

@keyframes fadeInZoom {
  from {
    opacity: 0;
    transform: scale(0.95);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

.mapping-type-dialog .dialog-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 24px;
  border-bottom: 1px solid #e0e0e0;
}

.mapping-type-dialog.dark-mode .dialog-header {
  border-bottom-color: #444;
}

.mapping-type-dialog .dialog-header h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
}

.mapping-type-dialog .close-btn {
  width: 32px;
  height: 32px;
  border: none;
  background: transparent;
  font-size: 24px;
  cursor: pointer;
  color: #666;
  border-radius: 4px;
  transition: all 0.2s;
}

.mapping-type-dialog .close-btn:hover {
  background: #f0f0f0;
  color: #333;
}

.mapping-type-dialog.dark-mode .close-btn {
  color: #aaa;
}

.mapping-type-dialog.dark-mode .close-btn:hover {
  background: #3a3a3a;
  color: #e0e0e0;
}

.mapping-type-dialog .dialog-body {
  padding: 24px;
}

.mapping-type-dialog .dialog-hint {
  margin: 0 0 20px 0;
  color: #666;
  font-size: 14px;
}

.mapping-type-dialog.dark-mode .dialog-hint {
  color: #aaa;
}

.mapping-type-dialog .mapping-type-options {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 20px;
}

.mapping-type-dialog .mapping-type-btn {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px;
  background: #f8f9fa;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
  text-align: left;
}

.mapping-type-dialog .mapping-type-btn:hover {
  border-color: #4CAF50;
  background: #f0fff0;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(76, 175, 80, 0.2);
}

.mapping-type-dialog.dark-mode .mapping-type-btn {
  background: #3a3a3a;
  border-color: #555;
}

.mapping-type-dialog.dark-mode .mapping-type-btn:hover {
  border-color: #4CAF50;
  background: #2f4f2f;
}

.mapping-type-dialog .btn-icon {
  font-size: 32px;
  flex-shrink: 0;
}

.mapping-type-dialog .btn-content {
  flex: 1;
}

.mapping-type-dialog .btn-title {
  font-size: 16px;
  font-weight: 600;
  color: #333;
  margin-bottom: 4px;
}

.mapping-type-dialog.dark-mode .btn-title {
  color: #e0e0e0;
}

.mapping-type-dialog .btn-desc {
  font-size: 13px;
  color: #666;
}

.mapping-type-dialog.dark-mode .btn-desc {
  color: #aaa;
}

.mapping-type-dialog .selector-preview {
  padding: 12px;
  background: #f8f9fa;
  border-radius: 6px;
  border-left: 3px solid #4CAF50;
}

.mapping-type-dialog.dark-mode .selector-preview {
  background: #3a3a3a;
}

.mapping-type-dialog .preview-label {
  font-size: 12px;
  color: #666;
  margin-bottom: 6px;
  font-weight: 500;
}

.mapping-type-dialog.dark-mode .preview-label {
  color: #aaa;
}

.mapping-type-dialog .preview-selector {
  display: block;
  font-family: 'Courier New', monospace;
  font-size: 13px;
  color: #333;
  word-break: break-all;
}

.mapping-type-dialog.dark-mode .preview-selector {
  color: #e0e0e0;
}
</style>
