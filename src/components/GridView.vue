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
      :context-menu-visible="dialogState.contextMenuVisible"
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

    <!-- 画布容器 -->
    <div
      class="canvas-wrapper"
      :class="{ 'panning': isPanning || false, 'dragging-item': isDraggingItem || isResizing }"
      @mousedown="handleCanvasMouseDown"
      @wheel="handleCanvasWheel"
      @contextmenu="handleContextMenu"
      @drop.prevent="handleDropOnEmpty"
      @dragover.prevent="handleDragOverOnEmpty"
      @dragenter.prevent="handleDragEnterForFiles"
    >
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
          @open-workflow="handleOpenWorkflow"
          @update-url="handleUpdateUrl"
          @resize-start="startResize"
          @start-automation-element-selection="handleStartAutomationElementSelection"
        />
        
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
import { ref } from 'vue'
import CanvasControls from './CanvasControls.vue'
import GridDialogManager from './GridDialogManager.vue'
import GridDrawingLayer from './GridDrawingLayer.vue'
import GridWebsiteList from './GridWebsiteList.vue'

// 主逻辑 Composable
import { useGridViewSetup } from '../composables/useGridViewSetup'
import { useAutomationData } from '../composables/useAutomationData'

export default {
  name: 'GridView',
  components: {
    FullscreenBar,
    ElementSelector,
    CanvasControls,
    GridDialogManager,
    GridDrawingLayer,
    GridWebsiteList
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
    'open-workflow',
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
      handleCancelMappingType
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
  padding: 0;
  overflow: hidden;
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
