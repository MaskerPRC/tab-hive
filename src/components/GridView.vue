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
      :can-go-back="fullscreenCanGoBack"
      :can-go-forward="fullscreenCanGoForward"
      @exit="$emit('exitFullscreen')"
      @leave="handleFullscreenBarLeave"
      @selectElement="startElementSelection"
      @refresh="handleFullscreenRefresh"
      @go-back="handleFullscreenGoBack"
      @go-forward="handleFullscreenGoForward"
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
          @drawing-mouse-down="handleDrawingMouseDownWrapper"
          @drawing-mouse-move="handleDrawingMouseMove"
          @drawing-mouse-up="handleDrawingMouseUp"
          @text-submit="handleTextSubmit"
          @text-cancel="handleTextCancel"
          @image-file-select="handleImageFileSelect"
          @image-cancel="handleImageCancel"
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
import { computed, watch, onMounted, onUnmounted, nextTick, ref } from 'vue'
// 子组件
import FullscreenBar from './FullscreenBar.vue'
import ElementSelector from './ElementSelector.vue'
import CanvasControls from './CanvasControls.vue'
import GridDialogManager from './GridDialogManager.vue'
import GridDrawingLayer from './GridDrawingLayer.vue'
import GridWebsiteList from './GridWebsiteList.vue'

// Composables
import { useCollisionDetection } from '../composables/useCollisionDetection'
import { useGridLayout } from '../composables/useGridLayout'
import { useItemDrag } from '../composables/useItemDrag'
import { useItemResize } from '../composables/useItemResize'
import { useFullscreen } from '../composables/useFullscreen'
import { useUrlDrop } from '../composables/useUrlDrop'
import { useCanvasTransform } from '../composables/useCanvasTransform'
import { useWebsiteOperations } from '../composables/useWebsiteOperations'
import { useElementSelection } from '../composables/useElementSelection'
import { useDrawing } from '../composables/useDrawing'
import { useKeyboardShortcuts } from '../composables/useKeyboardShortcuts'
import { useFullscreenNavigation } from '../composables/useFullscreenNavigation'
import { useFileDrop } from '../composables/useFileDrop'
import { useCanvasEventHandlers } from '../composables/useCanvasEventHandlers'
import { useGridDialogs } from '../composables/useGridDialogs'

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
  emits: ['fullscreen', 'exitFullscreen', 'add-website', 'copy-website', 'remove-website', 'update-website', 'update-drawings', 'update-canvas-transform', 'open-script-panel', 'import-layout-from-image', 'open-monitoring'],
  setup(props, { emit }) {
    // 所有网站列表（过滤掉空白项，防止僵尸视界）
    const allWebsites = computed(() => {
      const sites = props.websites || []
      const filtered = sites.filter(site => site && (site.url || site.type === 'desktop-capture' || site.type === 'custom-html'))
      return filtered
    })

    // ========== Composables 初始化 ==========
    
    // 对话框管理
    const {
      editingSlot,
      editingDialogType,
      newWebsite,
      showCustomHtmlDialog,
      showRearrangeDialog,
      contextMenuVisible,
      contextMenuX,
      contextMenuY,
      openWebsiteEditDialog,
      openDesktopCaptureDialog,
      closeEditDialog,
      openCustomHtmlDialog,
      closeCustomHtmlDialog,
      openRearrangeDialog,
      closeRearrangeDialog,
      openContextMenu,
      closeContextMenu
    } = useGridDialogs()
    
    // 将对话框状态组合成一个对象
    const dialogState = computed(() => ({
      editingSlot: editingSlot.value,
      editingDialogType: editingDialogType.value,
      newWebsite: newWebsite.value,
      showCustomHtmlDialog: showCustomHtmlDialog.value,
      showRearrangeDialog: showRearrangeDialog.value,
      contextMenuVisible: contextMenuVisible.value,
      contextMenuX: contextMenuX.value,
      contextMenuY: contextMenuY.value
    }))
    
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

    // 画布变换（平移和缩放）
    const initialTransform = props.canvasTransform || null
    const {
      canvasTransform,
      isPanning,
      startPan,
      handleWheelZoom,
      setZoom,
      resetTransform: resetCanvasTransform,
      getTransformStyle
    } = useCanvasTransform(initialTransform)

    // 拖拽
    const {
      isDraggingItem,
      currentDragIndex,
      isColliding: dragIsColliding,
      startDrag: startDragItem,
      handleDragEnd
    } = useItemDrag(itemPositions, itemSizes, snapToGrid, checkCollisionWithOthers, isMovingAway, allWebsites, canvasTransform)

    // 调整大小
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
      handleDrop: handleDropBase,
      handleDropOnEmpty: handleDropOnEmptyBase,
      extractUrlFromText
    } = useUrlDrop()

    // 网站操作
    const {
      editingSlot: _editingSlot,
      editingDialogType: _editingDialogType,
      newWebsite: _newWebsite,
      startAddWebsite: _startAddWebsite,
      startAddDesktopCapture,
      confirmAddWebsite,
      cancelAddWebsite: _cancelAddWebsite,
      handleCopyWebsite,
      handleRemoveWebsite,
      handleToggleMute,
      handleUpdateUrl,
      handleRefreshWebsite,
      handleEditWebsite: _handleEditWebsite
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

    // 绘制功能
    const {
      isDrawingMode,
      drawingTool,
      currentPath,
      drawingColor,
      drawingWidth,
      savedDrawings,
      textInput,
      imageUpload,
      toggleDrawingMode,
      setDrawingTool,
      handleDrawingMouseDown,
      handleDrawingMouseMove,
      handleDrawingMouseUp,
      getPathData,
      clearAllDrawings,
      setDrawingColor,
      setDrawingWidth,
      saveText,
      saveImage,
      handlePaste,
      handleImageUpload
    } = useDrawing(props, emit, canvasTransform)

    // 全屏导航功能
    const {
      fullscreenCanGoBack,
      fullscreenCanGoForward,
      checkFullscreenNavigationState,
      handleFullscreenGoBack,
      handleFullscreenGoForward
    } = useFullscreenNavigation(fullscreenIndexRef, allWebsites)

    // 文件拖放功能
    const {
      handleDragOverOnEmpty: handleDragOverOnEmptyFiles,
      handleDragEnterForFiles,
      handleDropOnEmpty: handleDropOnEmptyFiles
    } = useFileDrop()

    // 画布事件处理器
    const {
      handleCanvasMouseDown,
      handleContextMenu: _handleContextMenu,
      handleCanvasWheel,
      zoomIn,
      zoomOut,
      resetTransform
    } = useCanvasEventHandlers(props, {
      isDraggingItem,
      isResizing,
      isDrawingMode,
      startPan,
      handleWheelZoom,
      setZoom,
      resetCanvasTransform,
      canvasTransform
    })

    // ========== 计算属性 ==========
    
    const zoomPercentage = computed(() => {
      return Math.round((canvasTransform.value?.zoom || 1) * 100)
    })
    
    const transformStyle = computed(() => getTransformStyle())

    // ========== 事件处理方法 ==========
    
    // 包装 handleDrop，传递正确的参数
    const handleDrop = (event, index) => {
      handleDropBase(event, index, allWebsites.value, emit)
    }

    // 处理空白区域的拖放（整合文件拖放和URL拖放）
    const handleDragOverOnEmpty = (event) => {
      handleDragOverOnEmptyFiles(event, dragOverIndex)
    }

    const handleDropOnEmpty = async (event) => {
      await handleDropOnEmptyFiles(event, emit, handleDropOnEmptyBase)
    }

    // 开始添加网站（使用对话框管理器）
    const startAddWebsite = (index) => {
      openWebsiteEditDialog(index, index === -1 ? null : allWebsites.value[index])
    }

    // 编辑网站（使用对话框管理器）
    const handleEditWebsite = (index) => {
      openWebsiteEditDialog(index, allWebsites.value[index])
    }

    // 取消添加网站（使用对话框管理器）
    const cancelAddWebsite = () => {
      closeEditDialog()
    }

    // 确认添加网站包装器
    const onConfirmAddWebsite = (websiteData) => {
      confirmAddWebsite(websiteData, handleRefreshWebsite)
      closeEditDialog()
    }

    // 处理自定义 HTML 确认
    const handleCustomHtmlConfirm = (data) => {
      console.log('[GridView] 自定义 HTML 数据:', data)
      closeCustomHtmlDialog()
      
      // 创建网站数据
      const websiteData = {
        type: 'custom-html',
        title: data.title || '自定义网页',
        url: '', // 自定义 HTML 不需要 URL
        html: data.html || '',
        deviceType: 'desktop',
        padding: 10,
        muted: false,
        darkMode: false,
        requireModifierForActions: false,
        targetSelectors: [],
        targetSelector: '',
        autoRefreshInterval: 0,
        sessionInstance: 'default'
      }
      
      onConfirmAddWebsite(websiteData)
    }

    // 右键菜单：添加网站
    const handleContextMenuAddWebsite = () => {
      startAddWebsite(-1)
      closeContextMenu()
    }

    // 右键菜单：添加自定义 HTML
    const handleContextMenuAddCustomHtml = () => {
      openCustomHtmlDialog()
      closeContextMenu()
    }

    // 自定义的右键菜单处理
    const handleContextMenu = (event) => {
      const target = event.target
      if (target.closest('webview') || 
          target.closest('iframe') || 
          target.closest('.grid-item')) {
        return
      }
      event.preventDefault()
      
      // 显示右键菜单
      openContextMenu(event.clientX, event.clientY)
    }

    // 点击其他地方关闭右键菜单
    const handleClickOutside = () => {
      closeContextMenu()
    }

    // 开始拖拽
    const startDrag = (event, index) => {
      startDragItem(event, index, allWebsites.value.length)
    }

    // 开始调整大小
    const startResize = (event, index, handle) => {
      const target = event.target
      if (target.classList.contains('resize-se')) {
        startResizeItem(event, index, 'se')
      } else if (target.classList.contains('resize-e')) {
        startResizeItem(event, index, 'e')
      } else if (target.classList.contains('resize-s')) {
        startResizeItem(event, index, 's')
      }
    }

    // 处理全屏切换
    const handleFullscreenToggle = (index) => {
      if (props.fullscreenIndex === index) {
        emit('fullscreen', null)
      } else {
        emit('fullscreen', index)
      }
    }

    // 处理打开脚本面板
    const handleOpenScriptPanel = (iframe) => {
      emit('open-script-panel', iframe)
    }

    // 处理全屏模式下的刷新
    const handleFullscreenRefresh = () => {
      console.log('[GridView] ========== handleFullscreenRefresh 被调用 ==========')
      console.log('[GridView] fullscreenIndex:', props.fullscreenIndex)
      if (props.fullscreenIndex !== null) {
        console.log('[GridView] 准备刷新网站到首页')
        handleRefreshWebsite(props.fullscreenIndex)
      } else {
        console.warn('[GridView] fullscreenIndex 为 null，无法刷新')
      }
    }

    // 绘制鼠标按下包装器
    const handleDrawingMouseDownWrapper = (event) => {
      handleDrawingMouseDown(event, props.fullscreenIndex)
    }

    // 处理适应屏幕：调整画板缩放以适应所有内容
    const handleAutoArrange = () => {
      // 计算所有网站的边界框
      let minX = Infinity, minY = Infinity
      let maxX = -Infinity, maxY = -Infinity
      
      allWebsites.value.forEach((site, index) => {
        const pos = itemPositions.value[index]
        const size = itemSizes.value[index]
        
        if (pos && size) {
          minX = Math.min(minX, pos.x)
          minY = Math.min(minY, pos.y)
          maxX = Math.max(maxX, pos.x + size.width)
          maxY = Math.max(maxY, pos.y + size.height)
        }
      })
      
      if (!isFinite(minX) || !isFinite(minY)) {
        console.warn('[适应屏幕] 没有有效的网站位置')
        return
      }
      
      // 获取容器尺寸
      const container = document.querySelector('.canvas-wrapper')
      if (!container) {
        console.warn('[适应屏幕] 未找到容器')
        return
      }
      
      const containerWidth = container.clientWidth
      const containerHeight = container.clientHeight
      
      // 计算内容的实际尺寸（加上边距）
      const contentWidth = maxX - minX + 40  // 左右各留20px边距
      const contentHeight = maxY - minY + 40 // 上下各留20px边距
      
      // 计算缩放比例
      const scaleX = containerWidth / contentWidth
      const scaleY = containerHeight / contentHeight
      const newZoom = Math.min(scaleX, scaleY, 1) // 不放大，只缩小
      
      // 计算居中偏移
      const offsetX = (containerWidth - contentWidth * newZoom) / 2 - minX * newZoom + 20 * newZoom
      const offsetY = (containerHeight - contentHeight * newZoom) / 2 - minY * newZoom + 20 * newZoom
      
      // 应用缩放和平移
      canvasTransform.value = {
        x: offsetX,
        y: offsetY,
        zoom: newZoom
      }
      
      console.log('[适应屏幕] 内容边界:', { minX, minY, maxX, maxY })
      console.log('[适应屏幕] 容器尺寸:', { containerWidth, containerHeight })
      console.log('[适应屏幕] 新缩放:', newZoom)
    }

    // 处理重排确认：按网格重新排列所有网站
    const handleRearrangeConfirm = (config) => {
      console.log('[重排] 配置:', config)
      closeRearrangeDialog()
      
      const { cols, width, height, scale } = config
      const spacing = 20
      const updates = {}
      
      // 计算所有网站的新位置和大小
      allWebsites.value.forEach((item, index) => {
        const row = Math.floor(index / cols)
        const col = index % cols
        
        const x = snapToGrid(col * (width + spacing) + spacing)
        const y = snapToGrid(row * (height + spacing) + spacing)
        
        // 更新位置和大小
        itemPositions.value[index] = { x, y }
        itemSizes.value[index] = { 
          width: Math.round(width * scale), 
          height: Math.round(height * scale) 
        }
        
        updates[index] = {
          position: { x, y },
          size: { 
            width: Math.round(width * scale), 
            height: Math.round(height * scale) 
          }
        }
      })
      
      // 创建索引映射
      const indexMap = new Map()
      let originalIndex = 0
      
      allWebsites.value.forEach((site, filteredIndex) => {
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
      
      // 发送更新事件
      Object.keys(updates).forEach(indexStr => {
        const filteredIndex = parseInt(indexStr)
        const origIdx = indexMap.get(filteredIndex)
        const update = updates[filteredIndex]
        
        if (update && origIdx !== undefined) {
          emit('update-website', {
            index: origIdx,
            position: update.position,
            size: update.size
          })
        }
      })
      
      console.log('[重排] 完成，共重排', allWebsites.value.length, '个窗口')
      console.log('[重排] 布局:', cols, '列，窗口大小:', `${Math.round(width * scale)}x${Math.round(height * scale)}`)
    }

    // 文字输入处理
    const handleTextSubmit = () => {
      if (textInput.value.content && textInput.value.content.trim()) {
        saveText(textInput.value.content)
      } else {
        textInput.value.show = false
      }
    }
    
    const handleTextCancel = () => {
      textInput.value.show = false
    }
    
    // 图片上传处理
    const handleImageFileSelect = (event) => {
      const file = event.target.files?.[0]
      if (file) {
        handleImageUpload(file)
      }
    }
    
    const handleImageCancel = () => {
      imageUpload.value.show = false
    }

    // ========== 键盘快捷键 ==========
    
    useKeyboardShortcuts({
      fullscreenIndex: fullscreenIndexRef,
      zoomIn,
      zoomOut,
      resetTransform,
      extractUrlFromText,
      emit,
      canvasTransform
    })

    // ========== 监听器 ==========
    
    watch(() => props.fullscreenIndex, (newVal, oldVal) => {
      if (newVal !== null && oldVal === null) {
        resetCanvasTransform()
      }
      // 检查导航状态
      if (newVal !== null) {
        // 延迟检查，等待 webview/iframe 加载
        setTimeout(checkFullscreenNavigationState, 200)
        // 定期检查导航状态（因为导航可能发生在 webview 内部）
        const interval = setInterval(() => {
          if (props.fullscreenIndex === newVal) {
            checkFullscreenNavigationState()
          } else {
            clearInterval(interval)
          }
        }, 500)
        // 5秒后清除定时器
        setTimeout(() => clearInterval(interval), 5000)
      } else {
        fullscreenCanGoBack.value = false
        fullscreenCanGoForward.value = false
      }
    })

    watch(allWebsites, () => {
      nextTick(() => {
        initializeGridLayout()
      })
    }, { immediate: false })

    // 标记是否正在从 props 恢复状态，避免触发保存
    const isRestoringTransform = ref(false)

    // 监听 canvasTransform 的变化，保存到布局
    watch(canvasTransform, (newTransform) => {
      // 如果正在恢复状态，不触发保存
      if (isRestoringTransform.value) {
        return
      }
      // 总是保存 canvasTransform，包括默认值，以便正确恢复状态
      if (newTransform) {
        emit('update-canvas-transform', { ...newTransform })
      }
    }, { deep: true })

    // 监听 props.canvasTransform 的变化（切换布局时）
    watch(() => props.canvasTransform, (newTransform) => {
      if (newTransform) {
        isRestoringTransform.value = true
        canvasTransform.value = { ...newTransform }
        // 使用 nextTick 确保状态更新完成后再重置标记
        nextTick(() => {
          isRestoringTransform.value = false
        })
      } else {
        // 如果没有保存的变换，重置为默认值
        isRestoringTransform.value = true
        canvasTransform.value = { x: 0, y: 0, zoom: 1 }
        nextTick(() => {
          isRestoringTransform.value = false
        })
      }
    }, { immediate: true })

    // ========== 生命周期 ==========
    
    onMounted(() => {
      console.log('[GridView] 组件挂载，初始网站数量:', props.websites.length)
      
      nextTick(() => {
        initializeGridLayout()
      })

      window.addEventListener('resize', initializeGridLayout)

      document.addEventListener('mouseup', () => {
        if (isDraggingItem.value) {
          handleDragEnd(emit)
        }
        if (isResizing.value) {
          handleResizeEnd(emit)
        }
      })

      // 点击其他地方关闭右键菜单
      document.addEventListener('click', handleClickOutside)
      
      // 监听粘贴事件
      document.addEventListener('paste', handlePaste)
    })

    onUnmounted(() => {
      cleanupFullscreen()
      window.removeEventListener('resize', initializeGridLayout)
      document.removeEventListener('click', handleClickOutside)
      document.removeEventListener('paste', handlePaste)
    })

    return {
      // 状态
      allWebsites,
      currentFullscreenWebsite,
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
      isPanning,
      zoomPercentage,
      transformStyle,
      // 绘制状态
      isDrawingMode,
      drawingTool,
      currentPath,
      drawingColor,
      drawingWidth,
      savedDrawings,
      textInput,
      imageUpload,
      // 对话框状态
      dialogState,
      // 方法
      getItemStyle,
      startAddWebsite,
      onConfirmAddWebsite,
      cancelAddWebsite,
      handleCopyWebsite,
      handleRemoveWebsite,
      handleRefreshWebsite,
      handleToggleMute,
      handleUpdateUrl,
      handleOpenScriptPanel,
      handleEditWebsite,
      handleGridMouseMove,
      handleFullscreenBarLeave,
      handleDragEnter,
      handleViewDragLeave,
      handleDragOver,
      handleDragLeave,
      handleDrop,
      handleDropOnEmpty,
      handleDragOverOnEmpty,
      handleDragEnterForFiles,
      handleContextMenu,
      startDrag,
      startResize,
      startElementSelection,
      handleElementSelected,
      cancelElementSelection,
      handleCanvasMouseDown,
      handleCanvasWheel,
      zoomIn,
      zoomOut,
      resetTransform,
      handleContextMenuAddWebsite,
      handleContextMenuAddCustomHtml,
      closeCustomHtmlDialog,
      handleCustomHtmlConfirm,
      closeRearrangeDialog,
      openRearrangeDialog,
      handleRearrangeConfirm,
      handleAutoArrange,
      handleFullscreenToggle,
      handleFullscreenRefresh,
      handleFullscreenGoBack,
      handleFullscreenGoForward,
      fullscreenCanGoBack,
      fullscreenCanGoForward,
      closeContextMenu,
      // 绘制方法
      toggleDrawingMode,
      setDrawingTool,
      handleDrawingMouseDownWrapper,
      handleDrawingMouseMove,
      handleDrawingMouseUp,
      clearAllDrawings,
      setDrawingColor,
      setDrawingWidth,
      handleTextSubmit,
      handleTextCancel,
      handleImageFileSelect,
      handleImageCancel
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
</style>
