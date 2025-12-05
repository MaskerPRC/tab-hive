<template>
  <div
    class="grid-view"
    :class="{ 'fullscreen-mode': fullscreenIndex !== null }"
    @dragenter.prevent="handleDragEnter"
    @dragleave="handleViewDragLeave"
    @mousemove="handleGridMouseMove"
  >
    <!-- 全屏模式下的顶部退出按钮条 -->
    <FullscreenBar
      :show="fullscreenIndex !== null && showFullscreenBar"
      @exit="$emit('exitFullscreen')"
      @leave="handleFullscreenBarLeave"
      @selectElement="startElementSelection"
    />

    <!-- 元素选择器覆盖层 -->
    <ElementSelector
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

    <!-- 添加网站浮动按钮 -->
    <AddWebsiteButton
      :visible="fullscreenIndex === null"
      @click="startAddWebsite(-1)"
    />

    <!-- 普通网站编辑对话框 -->
    <WebsiteEditDialog
      :show="editingSlot !== null && editingDialogType === 'website'"
      :editing-index="editingSlot"
      :website="editingSlot !== null && editingSlot !== -1 ? websites[editingSlot] : newWebsite"
      :websites="websites"
      @confirm="onConfirmAddWebsite"
      @cancel="cancelAddWebsite"
    />
    
    <!-- 桌面捕获编辑对话框 -->
    <DesktopCaptureEditDialog
      :show="editingSlot !== null && editingDialogType === 'desktop-capture'"
      :editing-index="editingSlot"
      :desktop-capture="editingSlot !== null && editingSlot !== -1 ? websites[editingSlot] : {}"
      @confirm="onConfirmAddWebsite"
      @cancel="cancelAddWebsite"
    />

    <!-- 画布容器 -->
    <div
      class="canvas-wrapper"
      :class="{ 'panning': isPanning || false, 'dragging-item': isDraggingItem || isResizing }"
      @mousedown="handleCanvasMouseDown"
      @wheel="handleCanvasWheel"
      @contextmenu.prevent
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
        <WebsiteCard
          v-for="(item, index) in allWebsites"
          v-if="fullscreenIndex !== index"
          :key="item.id || `website-${index}`"
          :item="item"
          :index="index"
          :item-style="getItemStyle(item, index, fullscreenIndex)"
          :is-fullscreen="false"
          :is-hidden="isHidden(index)"
          :is-drag-over="dragOverIndex === index"
          :is-external-dragging="isDragging"
          :is-dragging="isDraggingItem"
          :is-current-drag="currentDragIndex === index"
          :is-resizing="isResizing"
          :is-current-resize="currentResizeIndex === index"
          :is-colliding="dragIsColliding || resizeIsColliding"
          :show-title="globalSettings?.showTitles"
          :refresh-on-fullscreen-toggle="globalSettings?.refreshOnFullscreenToggle"
          :global-muted="globalSettings?.globalMuted"
          :ad-block-enabled="globalSettings?.adBlockEnabled"
          @drag-start="startDrag($event, index)"
          @drag-over="handleDragOver"
          @drag-leave="handleDragLeave"
          @drop="handleDrop"
          @refresh="handleRefreshWebsite"
          @copy="handleCopyWebsite"
          @edit="handleEditWebsite"
          @fullscreen="$emit('fullscreen', index)"
          @remove="handleRemoveWebsite"
          @toggle-mute="handleToggleMute"
          @update-url="handleUpdateUrl"
          @resize-start="startResize($event, index, $event)"
        />
      </div>
      
      <!-- 全屏元素渲染在画布容器外，避免受 transform 影响 -->
      <WebsiteCard
        v-if="fullscreenIndex !== null && allWebsites[fullscreenIndex]"
        :key="`fullscreen-${allWebsites[fullscreenIndex].id || fullscreenIndex}`"
        :item="allWebsites[fullscreenIndex]"
        :index="fullscreenIndex"
        :item-style="{}"
        :is-fullscreen="true"
        :is-hidden="false"
        :is-drag-over="false"
        :is-external-dragging="false"
        :is-dragging="false"
        :is-current-drag="false"
        :is-resizing="false"
        :is-current-resize="false"
        :is-colliding="false"
        :show-title="globalSettings?.showTitles"
        :refresh-on-fullscreen-toggle="globalSettings?.refreshOnFullscreenToggle"
        :global-muted="globalSettings?.globalMuted"
        :ad-block-enabled="globalSettings?.adBlockEnabled"
        @fullscreen="$emit('fullscreen', null)"
        @refresh="handleRefreshWebsite"
        @copy="handleCopyWebsite"
        @edit="handleEditWebsite"
        @remove="handleRemoveWebsite"
        @toggle-mute="handleToggleMute"
        @update-url="handleUpdateUrl"
      />
    </div>

    <!-- 画布控制按钮 -->
    <CanvasControls
      :zoom-percentage="zoomPercentage"
      @zoom-in="zoomIn"
      @zoom-out="zoomOut"
      @reset="resetTransform"
      @auto-arrange="handleAutoArrange"
    />
  </div>
</template>

<script>
import { computed, watch, onMounted, onUnmounted, nextTick } from 'vue'
import FullscreenBar from './FullscreenBar.vue'
import WebsiteEditDialog from './WebsiteEditDialog.vue'
import DesktopCaptureEditDialog from './DesktopCaptureEditDialog.vue'
import WebsiteCard from './WebsiteCard.vue'
import ElementSelector from './ElementSelector.vue'
import CanvasControls from './CanvasControls.vue'
import AddWebsiteButton from './AddWebsiteButton.vue'
import { useCollisionDetection } from '../composables/useCollisionDetection'
import { useGridLayout } from '../composables/useGridLayout'
import { useItemDrag } from '../composables/useItemDrag'
import { useItemResize } from '../composables/useItemResize'
import { useFullscreen } from '../composables/useFullscreen'
import { useUrlDrop } from '../composables/useUrlDrop'
import { useCanvasTransform } from '../composables/useCanvasTransform'
import { useWebsiteOperations } from '../composables/useWebsiteOperations'
import { useElementSelection } from '../composables/useElementSelection'

export default {
  name: 'GridView',
  components: {
    FullscreenBar,
    WebsiteEditDialog,
    DesktopCaptureEditDialog,
    WebsiteCard,
    ElementSelector,
    CanvasControls,
    AddWebsiteButton
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
      default: () => ({ showTitles: false })
    }
  },
  emits: ['fullscreen', 'exitFullscreen', 'add-website', 'copy-website', 'remove-website', 'update-website'],
  setup(props, { emit }) {
    // 所有网站列表（过滤掉空白项，防止僵尸蜂巢）
    const allWebsites = computed(() => {
      console.log('[GridView] ========== allWebsites 计算开始 ==========')
      console.log('[GridView] props.websites:', props.websites)
      const sites = props.websites || []
      console.log('[GridView] sites 数量:', sites.length)
      // 过滤掉没有 URL 且不是桌面捕获类型的空白项
      const filtered = sites.filter(site => site && (site.url || site.type === 'desktop-capture'))
      console.log('[GridView] 过滤后的网站数量:', filtered.length)
      console.log('[GridView] 过滤后的网站列表:', filtered)
      console.log('[GridView] ========== allWebsites 计算结束 ==========')
      return filtered
    })

    // 碰撞检测
    const { 
      isColliding: collisionIsColliding, 
      checkCollisionWithOthers, 
      isMovingAway 
    } = useCollisionDetection()

    // 网格布局
    const {
      itemPositions,
      itemSizes,
      snapToGrid,
      initializeGridLayout,
      getItemStyle,
      autoArrange
    } = useGridLayout(allWebsites)

    // 画布变换（平移和缩放）- 需要先初始化，因为拖拽和调整大小会用到
    const {
      canvasTransform,
      isPanning,
      startPan,
      handleWheelZoom,
      setZoom,
      resetTransform: resetCanvasTransform,
      getTransformStyle
    } = useCanvasTransform()

    // 拖拽（传入画布变换以考虑缩放）
    const {
      isDraggingItem,
      currentDragIndex,
      isColliding: dragIsColliding,
      startDrag: startDragItem,
      handleDragEnd
    } = useItemDrag(itemPositions, itemSizes, snapToGrid, checkCollisionWithOthers, isMovingAway, allWebsites, canvasTransform)

    // 调整大小（传入画布变换以考虑缩放）
    const {
      isResizing,
      currentDragIndex: currentResizeIndex,
      isColliding: resizeIsColliding,
      startResize: startResizeItem,
      handleResizeEnd
    } = useItemResize(itemPositions, itemSizes, snapToGrid, checkCollisionWithOthers, allWebsites, canvasTransform)

    // 全屏
    const fullscreenIndexRef = computed(() => props.fullscreenIndex)
    const {
      showFullscreenBar,
      handleGridMouseMove,
      handleFullscreenBarLeave,
      cleanup: cleanupFullscreen
    } = useFullscreen(fullscreenIndexRef)

    // URL拖放
    const {
      dragOverIndex,
      isDragging,
      handleDragEnter,
      handleViewDragLeave,
      handleDragOver,
      handleDragLeave,
      handleDrop
    } = useUrlDrop()

    // 网站操作
    const {
      editingSlot,
      editingDialogType,
      newWebsite,
      startAddWebsite,
      startAddDesktopCapture,
      confirmAddWebsite,
      cancelAddWebsite,
      handleCopyWebsite,
      handleRemoveWebsite,
      handleToggleMute,
      handleUpdateUrl,
      handleRefreshWebsite,
      handleEditWebsite
    } = useWebsiteOperations(props, emit)

    // 元素选择
    const {
      isSelectingElement,
      fullscreenIframe,
      currentFullscreenWebsite,
      startElementSelection,
      handleElementSelected,
      cancelElementSelection
    } = useElementSelection(props, emit)

    // 计算缩放百分比（用于显示）
    const zoomPercentage = computed(() => {
      return Math.round((canvasTransform.value?.zoom || 1) * 100)
    })
    
    // 使用计算属性优化 transform 样式，避免每次重新计算
    const transformStyle = computed(() => getTransformStyle())

    /**
     * 判断某个索引的网站是否应该隐藏
     */
    const isHidden = (index) => {
      // 如果是全屏模式，隐藏所有非全屏的网站
      if (props.fullscreenIndex !== null) {
        return index !== props.fullscreenIndex
      }
      // 非全屏模式，不隐藏任何网站
      return false
    }

    /**
     * 确认添加网站包装器（传入刷新回调）
     */
    const onConfirmAddWebsite = (websiteData) => {
      confirmAddWebsite(websiteData, handleRefreshWebsite)
    }

    /**
     * 开始拖拽
     */
    const startDrag = (event, index) => {
      startDragItem(event, index, allWebsites.value.length)
    }

    /**
     * 开始调整大小
     */
    const startResize = (event, index, handle) => {
      // 从事件对象中提取 handle
      const target = event.target
      if (target.classList.contains('resize-se')) {
        startResizeItem(event, index, 'se')
      } else if (target.classList.contains('resize-e')) {
        startResizeItem(event, index, 'e')
      } else if (target.classList.contains('resize-s')) {
        startResizeItem(event, index, 's')
      }
    }

    /**
     * 处理画布鼠标按下（开始平移）
     */
    const handleCanvasMouseDown = (event) => {
      // 如果正在拖动或调整大小，不启动画布平移
      if (isDraggingItem.value || isResizing.value) {
        return
      }

      // 如果点击的是网站卡片或其他可交互元素，不启动画布平移
      const target = event.target
      if (target.closest('.grid-item') || 
          target.closest('.btn-add-website-float') ||
          target.closest('.canvas-controls')) {
        return
      }

      // 只有点击空白区域才启动画布平移
      startPan(event)
    }

    /**
     * 处理画布滚轮（缩放）
     */
    const handleCanvasWheel = (event) => {
      // 如果正在拖动或调整大小，不缩放
      if (isDraggingItem.value || isResizing.value) {
        return
      }
      handleWheelZoom(event)
    }

    /**
     * 放大
     */
    const zoomIn = () => {
      setZoom(canvasTransform.value.zoom + 0.1)
    }

    /**
     * 缩小
     */
    const zoomOut = () => {
      setZoom(canvasTransform.value.zoom - 0.1)
    }

    /**
     * 重置画布变换
     */
    const resetTransform = () => {
      resetCanvasTransform()
    }

    /**
     * 处理自动排布
     */
    const handleAutoArrange = () => {
      // 执行自动排布算法（基于 allWebsites，即过滤后的列表）
      const updates = autoArrange()
      
      // 创建索引映射：从 allWebsites 索引到 props.websites 索引
      // allWebsites 是 props.websites 的过滤版本，需要找到每个有效网站在原始列表中的索引
      const indexMap = new Map()
      let originalIndex = 0
      
      allWebsites.value.forEach((site, filteredIndex) => {
        // 在原始列表中查找对应的网站
        while (originalIndex < props.websites.length) {
          const originalSite = props.websites[originalIndex]
          if (originalSite && 
              ((originalSite.url && originalSite.url === site.url) || 
               (originalSite.id && originalSite.id === site.id) ||
               (originalSite.type === 'desktop-capture' && site.type === 'desktop-capture'))) {
            indexMap.set(filteredIndex, originalIndex)
            originalIndex++
            break
          }
          originalIndex++
        }
      })
      
      // 更新所有网站的位置和大小（使用原始索引）
      Object.keys(updates).forEach(indexStr => {
        const filteredIndex = parseInt(indexStr)
        const originalIndex = indexMap.get(filteredIndex)
        const update = updates[filteredIndex]
        
        if (update && originalIndex !== undefined) {
          emit('update-website', {
            index: originalIndex,
            position: update.position,
            size: update.size
          })
        }
      })
      
      console.log('[GridView] 自动排布完成，已更新', Object.keys(updates).length, '个网站')
    }

    // 键盘快捷键
    const handleKeyDown = (event) => {
      // Ctrl + Plus 放大
      if (event.ctrlKey && (event.key === '+' || event.key === '=')) {
        event.preventDefault()
        zoomIn()
      }
      // Ctrl + Minus 缩小
      if (event.ctrlKey && event.key === '-') {
        event.preventDefault()
        zoomOut()
      }
      // Ctrl + 0 重置
      if (event.ctrlKey && event.key === '0') {
        event.preventDefault()
        resetTransform()
      }
    }

    // 监听网站列表变化，初始化新添加的项目
    watch(allWebsites, () => {
      // 使用 nextTick 确保 DOM 已更新
      nextTick(() => {
        initializeGridLayout()
      })
    }, { immediate: false })

    // 组件挂载时初始化布局
    onMounted(() => {
      console.log('[GridView] ========== 组件挂载 ==========')
      console.log('[GridView] 初始网站数量:', props.websites.length)
      console.log('[GridView] 初始网站列表:', props.websites)
      
      nextTick(() => {
        initializeGridLayout()
      })

      // 监听窗口大小变化
      window.addEventListener('resize', initializeGridLayout)

      // 监听全局鼠标抬起事件，处理拖拽和调整大小结束
      document.addEventListener('mouseup', () => {
        if (isDraggingItem.value) {
          handleDragEnd(emit)
        }
        if (isResizing.value) {
          handleResizeEnd(emit)
        }
      })

      // 监听键盘快捷键
      window.addEventListener('keydown', handleKeyDown)
    })
    
    // 监视 props.websites 变化
    watch(() => props.websites, (newWebsites, oldWebsites) => {
      console.log('[GridView] ========== props.websites 发生变化 ==========')
      console.log('[GridView] 旧网站数量:', oldWebsites?.length || 0)
      console.log('[GridView] 新网站数量:', newWebsites?.length || 0)
      console.log('[GridView] 新网站列表:', newWebsites)
    }, { deep: true })
    
    // 监视 allWebsites 变化
    watch(allWebsites, (newValue, oldValue) => {
      console.log('[GridView] ========== allWebsites 发生变化 ==========')
      console.log('[GridView] 旧数量:', oldValue?.length || 0)
      console.log('[GridView] 新数量:', newValue?.length || 0)
      console.log('[GridView] 过滤后的网站列表:', newValue)
    })

    // 组件卸载时清理事件监听
    onUnmounted(() => {
      cleanupFullscreen()
      window.removeEventListener('resize', initializeGridLayout)
      window.removeEventListener('keydown', handleKeyDown)
    })

    return {
      allWebsites,
      currentFullscreenWebsite,
      isHidden,
      getItemStyle,
      editingSlot,
      editingDialogType,
      newWebsite,
      dragOverIndex,
      isDragging,
      showFullscreenBar,
      isDraggingItem,
      isResizing,
      currentDragIndex,
      currentResizeIndex,
      dragIsColliding,
      resizeIsColliding,
      isSelectingElement,
      fullscreenIframe,
      startAddWebsite,
      startAddDesktopCapture,
      onConfirmAddWebsite,
      cancelAddWebsite,
      handleCopyWebsite,
      handleRemoveWebsite,
      handleRefreshWebsite,
      handleToggleMute,
      handleUpdateUrl,
      handleEditWebsite,
      handleGridMouseMove,
      handleFullscreenBarLeave,
      handleDragEnter,
      handleViewDragLeave,
      handleDragOver,
      handleDragLeave,
      handleDrop,
      startDrag,
      startResize,
      startElementSelection,
      handleElementSelected,
      cancelElementSelection,
      // 画布变换
      canvasTransform,
      isPanning,
      zoomPercentage,
      transformStyle,
      getTransformStyle,
      handleCanvasMouseDown,
      handleCanvasWheel,
      zoomIn,
      zoomOut,
      resetTransform,
      handleAutoArrange
    }
  }
}
</script>

<style scoped>
.grid-view {
  flex: 1;
  width: 100%;
  height: 100%;
  padding: 15px;
  overflow-y: auto;
  overflow-x: hidden;
  position: relative;
  scrollbar-width: none; /* Firefox */
  -ms-overflow-style: none; /* IE 和 Edge */
}

/* 隐藏滚动条 - Chrome, Safari */
.grid-view::-webkit-scrollbar {
  display: none;
}

.fullscreen-mode {
  padding: 0;
  overflow: hidden;
}

/* 拖动/调整大小时的全局遮罩层 */
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

/* 画布包装器 */
.canvas-wrapper {
  width: 100%;
  height: 100%;
  position: relative;
  overflow: hidden;
  cursor: default;
}

.canvas-wrapper.panning {
  cursor: grabbing;
}

.canvas-wrapper.dragging-item {
  cursor: move;
}

/* 画布内容容器 */
.grid-container {
  width: 100%;
  min-height: 100%;
  height: auto;
  position: relative;
  /* 确保画布可以扩展到足够大的范围 */
  min-width: 200vw;
  min-height: 200vh;
  /* 性能优化：使用 GPU 加速 */
  will-change: transform;
  /* 拖动时禁用 transition，提升性能 */
  transition: transform 0.1s ease-out;
}

/* 拖动时禁用 transition */
.canvas-wrapper.panning .grid-container {
  transition: none !important;
}

.grid-container.free-layout {
  position: relative;
  background-image:
    linear-gradient(to right, rgba(255, 92, 0, 0.05) 1px, transparent 1px),
    linear-gradient(to bottom, rgba(255, 92, 0, 0.05) 1px, transparent 1px);
  background-size: 20px 20px;
  background-position: 0 0;
  /* 无限画布背景 */
  background-repeat: repeat;
}

/* 全局拖动或调整大小时，禁用所有iframe的鼠标事件 */
.grid-container.is-dragging .website-iframe {
  pointer-events: none;
}
</style>
