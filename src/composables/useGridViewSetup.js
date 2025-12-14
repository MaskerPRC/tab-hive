/**
 * 网格视图主逻辑 Composable
 * 统一管理和组织所有子 composables
 */
import { computed, watch, onMounted, onUnmounted, nextTick, ref } from 'vue'

// Composables
import { useCollisionDetection } from './useCollisionDetection'
import { useGridLayout } from './useGridLayout'
import { useItemDrag } from './useItemDrag'
import { useItemResize } from './useItemResize'
import { useFullscreen } from './useFullscreen'
import { useUrlDrop } from './useUrlDrop'
import { useCanvasTransform } from './useCanvasTransform'
import { useWebsiteOperations } from './useWebsiteOperations'
import { useElementSelection } from './useElementSelection'
import { useDrawing } from './useDrawing'
import { useKeyboardShortcuts } from './useKeyboardShortcuts'
import { useFullscreenNavigation } from './useFullscreenNavigation'
import { useFileDrop } from './useFileDrop'
import { useCanvasEventHandlers } from './useCanvasEventHandlers'
import { useGridDialogs } from './useGridDialogs'
import { useGridEventHandlers } from './useGridEventHandlers'
import { useLayoutOperations } from './useLayoutOperations'

/**
 * 主设置函数
 */
export function useGridViewSetup(props, { emit }) {
  // ========== 基础数据 ==========
  
  // 所有网站列表（过滤掉空白项）
  const allWebsites = computed(() => {
    const sites = props.websites || []
    const filtered = sites.filter(site => 
      site && (site.url || site.type === 'desktop-capture' || site.type === 'custom-html')
    )
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
  
  // 对话框状态对象
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
    handleImageUpload,
    updateDrawingItem
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

  // 布局操作
  const {
    handleAutoArrange,
    handleRearrangeConfirm
  } = useLayoutOperations(props, {
    allWebsites,
    itemPositions,
    itemSizes,
    snapToGrid,
    canvasTransform,
    emit
  })

  // 事件处理器
  const eventHandlers = useGridEventHandlers(props, {
    emit,
    allWebsites,
    editingSlot,
    openWebsiteEditDialog,
    closeEditDialog,
    openCustomHtmlDialog,
    closeCustomHtmlDialog,
    openRearrangeDialog,
    closeRearrangeDialog,
    openContextMenu,
    closeContextMenu,
    confirmAddWebsite,
    handleRefreshWebsite,
    handleCopyWebsite,
    handleRemoveWebsite,
    handleToggleMute,
    handleUpdateUrl,
    startDragItem,
    startResizeItem,
    handleDropBase,
    handleDropOnEmptyBase,
    handleDropOnEmptyFiles,
    handleDragOverOnEmptyFiles,
    handleDrawingMouseDown,
    fullscreenIndexRef,
    dragOverIndex
  })

  // ========== 计算属性 ==========
  
  const zoomPercentage = computed(() => {
    return Math.round((canvasTransform.value?.zoom || 1) * 100)
  })
  
  const transformStyle = computed(() => getTransformStyle())

  // ========== 生命周期和监听器 ==========
  
  // 点击其他地方关闭右键菜单
  const handleClickOutside = () => {
    closeContextMenu()
  }

  // 标记是否正在从 props 恢复状态
  const isRestoringTransform = ref(false)
  
  // 保存全屏前的画布变换状态
  const canvasTransformBeforeFullscreen = ref(null)

  // 监听全屏索引变化
  watch(() => props.fullscreenIndex, (newVal, oldVal) => {
    if (newVal !== null && oldVal === null) {
      // 进入全屏：保存当前的画布变换状态
      canvasTransformBeforeFullscreen.value = {
        x: canvasTransform.value?.x || 0,
        y: canvasTransform.value?.y || 0,
        zoom: canvasTransform.value?.zoom || 1
      }
      console.log('[全屏] 保存画布变换状态:', canvasTransformBeforeFullscreen.value)
      resetCanvasTransform()
    } else if (newVal === null && oldVal !== null) {
      // 退出全屏：恢复之前保存的画布变换状态
      if (canvasTransformBeforeFullscreen.value) {
        console.log('[全屏] 恢复画布变换状态:', canvasTransformBeforeFullscreen.value)
        const savedTransform = { ...canvasTransformBeforeFullscreen.value }
        isRestoringTransform.value = true
        canvasTransform.value = savedTransform
        // 触发更新事件，确保父组件同步状态
        nextTick(() => {
          emit('update-canvas-transform', savedTransform)
          isRestoringTransform.value = false
          canvasTransformBeforeFullscreen.value = null
        })
      }
    }
    // 检查导航状态
    if (newVal !== null) {
      setTimeout(checkFullscreenNavigationState, 200)
      const interval = setInterval(() => {
        if (props.fullscreenIndex === newVal) {
          checkFullscreenNavigationState()
        } else {
          clearInterval(interval)
        }
      }, 500)
      setTimeout(() => clearInterval(interval), 5000)
    } else {
      fullscreenCanGoBack.value = false
      fullscreenCanGoForward.value = false
    }
  })

  // 监听网站列表变化
  watch(allWebsites, () => {
    nextTick(() => {
      initializeGridLayout()
    })
  }, { immediate: false })

  // 监听画布变换变化
  watch(canvasTransform, (newTransform) => {
    if (isRestoringTransform.value) {
      return
    }
    if (newTransform) {
      emit('update-canvas-transform', { ...newTransform })
    }
  }, { deep: true })

  // 监听 props.canvasTransform 变化
  watch(() => props.canvasTransform, (newTransform) => {
    if (newTransform) {
      isRestoringTransform.value = true
      canvasTransform.value = { ...newTransform }
      nextTick(() => {
        isRestoringTransform.value = false
      })
    } else {
      isRestoringTransform.value = true
      canvasTransform.value = { x: 0, y: 0, zoom: 1 }
      nextTick(() => {
        isRestoringTransform.value = false
      })
    }
  }, { immediate: true })

  // 挂载时初始化
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

    document.addEventListener('click', handleClickOutside)
    document.addEventListener('paste', handlePaste)
  })

  // 卸载时清理
  onUnmounted(() => {
    cleanupFullscreen()
    window.removeEventListener('resize', initializeGridLayout)
    document.removeEventListener('click', handleClickOutside)
    document.removeEventListener('paste', handlePaste)
  })

  // 键盘快捷键
  useKeyboardShortcuts({
    fullscreenIndex: fullscreenIndexRef,
    zoomIn,
    zoomOut,
    resetTransform,
    extractUrlFromText,
    emit,
    canvasTransform
  })

  // ========== 返回所有需要的状态和方法 ==========
  
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
    // 基础方法
    getItemStyle,
    handleGridMouseMove,
    handleFullscreenBarLeave,
    handleDragEnter,
    handleViewDragLeave,
    handleDragOver,
    handleDragLeave,
    handleDragEnterForFiles,
    startElementSelection,
    handleElementSelected,
    cancelElementSelection,
    handleCanvasMouseDown,
    handleCanvasWheel,
    zoomIn,
    zoomOut,
    resetTransform,
    closeCustomHtmlDialog,
    closeRearrangeDialog,
    openRearrangeDialog,
    closeContextMenu,
    handleRearrangeConfirm,
    handleAutoArrange,
    handleFullscreenGoBack,
    handleFullscreenGoForward,
    fullscreenCanGoBack,
    fullscreenCanGoForward,
    // 绘制方法
    toggleDrawingMode,
    setDrawingTool,
    handleDrawingMouseMove,
    handleDrawingMouseUp,
    clearAllDrawings,
    setDrawingColor,
    setDrawingWidth,
    updateDrawingItem,
    // 事件处理器
    ...eventHandlers,
    // 文字和图片输入的特殊处理
    handleTextSubmit: () => eventHandlers.handleTextSubmit(textInput, saveText),
    handleTextCancel: () => eventHandlers.handleTextCancel(textInput),
    handleImageFileSelect: (event) => eventHandlers.handleImageFileSelect(event, handleImageUpload),
    handleImageCancel: () => eventHandlers.handleImageCancel(imageUpload)
  }
}

