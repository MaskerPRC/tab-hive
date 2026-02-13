<template>
  <div
    class="grid-view"
    :class="{
      'fullscreen-mode': fullscreenIndex !== null
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
    />
  </div>
</template>

<script>
// 子组件
import FullscreenBar from './FullscreenBar.vue'
import ElementSelector from './ElementSelector.vue'
import CanvasControls from './CanvasControls.vue'
import GridDialogManager from './GridDialogManager.vue'
import GridDrawingLayer from './GridDrawingLayer.vue'
import GridWebsiteList from './GridWebsiteList.vue'

// Composables
import { useGridViewSetup } from '../composables/useGridViewSetup'

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
    'open-monitoring'
  ],
  setup(props, { emit }) {
    const setupResult = useGridViewSetup(props, { emit })
    return { ...setupResult }
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
