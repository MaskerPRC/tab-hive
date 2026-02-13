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
    <MappingTypeDialog
      :show="showMappingTypeDialog"
      :pending-element-selection="pendingElementSelection"
      @select="handleSelectMappingType"
      @cancel="handleCancelMappingType"
    />

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
import MappingTypeDialog from './MappingTypeDialog.vue'
import CanvasControls from './CanvasControls.vue'
import GridDialogManager from './GridDialogManager.vue'
import GridDrawingLayer from './GridDrawingLayer.vue'
import GridWebsiteList from './GridWebsiteList.vue'
import AutomationContextMenu from './AutomationContextMenu.vue'
import WorkflowNode from './WorkflowNode.vue'

import { ref } from 'vue'

// Composables
import { useGridViewSetup } from '../composables/useGridViewSetup'
import { useAutomationData } from '../composables/useAutomationData'
import { useAutomationElementSelection } from '../composables/useAutomationElementSelection'
import { useWorkflowConnections } from '../composables/useWorkflowConnections'
import { useWorkflowNodeManagement } from '../composables/useWorkflowNodeManagement'
import { useWorkflowExecution } from '../composables/useWorkflowExecution'

export default {
  name: 'GridView',
  components: {
    FullscreenBar,
    ElementSelector,
    MappingTypeDialog,
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

    // 自动化元素选择（映射对话框、映射CRUD）
    const automationElementSelection = useAutomationElementSelection(automationData, setupResult)

    // 工作流节点列表（共享 ref，供连接和节点管理共同使用）
    const workflowNodes = ref([])

    // 工作流连接线
    const workflowConnections = useWorkflowConnections({
      workflowNodes,
      props,
      automationData,
      allWebsites: setupResult.allWebsites,
      automationSelectingElement: automationElementSelection.automationSelectingElement
    })

    // 工作流节点管理
    const workflowNodeMgmt = useWorkflowNodeManagement({
      workflowNodes,
      props,
      viewMode: setupResult.viewMode,
      originalHandleContextMenu: setupResult.handleContextMenu,
      startConnection: workflowConnections.startConnection,
      getNodePortPosition: workflowConnections.getNodePortPosition
    })

    // 工作流执行引擎
    const workflowExec = useWorkflowExecution({
      workflowNodes,
      connections: workflowConnections.connections,
      automationData,
      allWebsites: setupResult.allWebsites
    })

    // 暴露方法给模板
    return {
      ...setupResult,
      // 自动化视图元素选择器
      ...automationElementSelection,
      automationData,
      // 连接线
      ...workflowConnections,
      // 工作流节点
      workflowNodes,
      ...workflowNodeMgmt,
      // 执行引擎
      ...workflowExec
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
</style>
