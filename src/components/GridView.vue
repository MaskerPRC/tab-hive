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
        <WebsiteCard
          v-for="(item, index) in allWebsites"
          :key="item.id || `website-${index}`"
          :item="item"
          :index="index"
          :item-style="getItemStyle(item, index, fullscreenIndex)"
          :is-fullscreen="fullscreenIndex === index"
          :is-hidden="isHidden(index)"
          :is-drag-over="dragOverIndex === index"
          :is-external-dragging="isDragging"
          :is-dragging="isDraggingItem"
          :is-current-drag="currentDragIndex === index"
          :is-resizing="isResizing"
          :is-current-resize="currentResizeIndex === index"
          :is-colliding="dragIsColliding || resizeIsColliding"
          :show-title="globalSettings?.showTitles"
          :refresh-on-fullscreen-toggle="false"
          :global-muted="globalSettings?.globalMuted"
          :ad-block-enabled="globalSettings?.adBlockEnabled"
          :custom-code-enabled="globalSettings?.customCodeEnabled"
          :show-certificate-error-shadow="globalSettings?.showCertificateErrorShadow"
          @drag-start="startDrag($event, index)"
          @drag-over="handleDragOver"
          @drag-leave="handleDragLeave"
          @drop="handleDrop"
          @refresh="handleRefreshWebsite"
          @copy="handleCopyWebsite"
          @edit="handleEditWebsite"
          @fullscreen="handleFullscreenToggle(index)"
          @remove="handleRemoveWebsite"
          @toggle-mute="handleToggleMute"
          @open-script-panel="handleOpenScriptPanel"
          @update-url="handleUpdateUrl"
          @resize-start="startResize($event, index, $event)"
        />
        
        <!-- 绘制层 -->
        <svg
          v-if="isDrawingMode || savedDrawings.length > 0"
          class="drawing-layer"
          :class="{ 'drawing-active': isDrawingMode }"
          xmlns="http://www.w3.org/2000/svg"
          @mousedown="handleDrawingMouseDownWrapper"
          @mousemove="handleDrawingMouseMove"
          @mouseup="handleDrawingMouseUp"
          @mouseleave="handleDrawingMouseUp"
        >
          <!-- 已保存的绘制路径 -->
          <path
            v-for="(path, index) in savedDrawings"
            :key="`saved-${index}`"
            :d="path.d"
            :stroke="path.color"
            :stroke-width="path.width"
            fill="none"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
          
          <!-- 当前正在绘制的路径 -->
          <path
            v-if="currentPath.length > 0"
            :d="getPathData(currentPath)"
            :stroke="drawingColor"
            :stroke-width="drawingWidth"
            fill="none"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
        </svg>
      </div>
    </div>

    <!-- 画布控制按钮（全屏时隐藏） -->
    <CanvasControls
      v-if="fullscreenIndex === null"
      :zoom-percentage="zoomPercentage"
      :is-drawing-mode="isDrawingMode"
      :drawing-color="drawingColor"
      :drawing-width="drawingWidth"
      @zoom-in="zoomIn"
      @zoom-out="zoomOut"
      @reset="resetTransform"
      @auto-arrange="handleAutoArrange"
      @toggle-drawing="toggleDrawingMode"
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
import WebsiteEditDialog from './WebsiteEditDialog.vue'
import DesktopCaptureEditDialog from './DesktopCaptureEditDialog.vue'
import WebsiteCard from './WebsiteCard.vue'
import ElementSelector from './ElementSelector.vue'
import CanvasControls from './CanvasControls.vue'
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

export default {
  name: 'GridView',
  components: {
    FullscreenBar,
    WebsiteEditDialog,
    DesktopCaptureEditDialog,
    WebsiteCard,
    ElementSelector,
    CanvasControls
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
  emits: ['fullscreen', 'exitFullscreen', 'add-website', 'copy-website', 'remove-website', 'update-website', 'update-drawings', 'update-canvas-transform', 'open-script-panel', 'import-layout-from-image'],
  setup(props, { emit }) {
    // 所有网站列表（过滤掉空白项，防止僵尸视界）
    const allWebsites = computed(() => {
      console.log('[GridView] ========== allWebsites 计算开始 ==========')
      const sites = props.websites || []
      const filtered = sites.filter(site => site && (site.url || site.type === 'desktop-capture'))
      console.log('[GridView] 过滤后的网站数量:', filtered.length)
      return filtered
    })

    // ========== Composables 初始化 ==========
    
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
    // 从 props 中恢复保存的变换状态，如果没有则使用默认值
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

    // 绘制功能
    const {
      isDrawingMode,
      currentPath,
      drawingColor,
      drawingWidth,
      savedDrawings,
      toggleDrawingMode,
      handleDrawingMouseDown,
      handleDrawingMouseMove,
      handleDrawingMouseUp,
      getPathData,
      clearAllDrawings,
      setDrawingColor,
      setDrawingWidth
    } = useDrawing(props, emit, canvasTransform)

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

    // 处理空白区域的拖放
    const handleDragOverOnEmpty = (event) => {
      const types = event.dataTransfer.types
      // 支持文件拖拽和URL拖拽
      if (types.includes('Files') || types.includes('text/uri-list') || types.includes('text/plain') || types.includes('text/x-moz-url')) {
        const target = event.target
        if (target.closest('.grid-item')) {
          return
        }
        event.preventDefault()
        dragOverIndex.value = null
      }
    }
    
    // 处理文件拖拽进入
    const handleDragEnterForFiles = (event) => {
      const types = event.dataTransfer.types
      if (types.includes('Files')) {
        event.preventDefault()
        console.log('[GridView] 文件拖拽进入画布')
      }
    }

    const handleDropOnEmpty = async (event) => {
      console.log('[GridView] handleDropOnEmpty 被调用')
      const types = event.dataTransfer.types
      console.log('[GridView] 拖拽类型:', types)
      
      const target = event.target
      if (target.closest('.grid-item')) {
        console.log('[GridView] 拖拽到卡片上，跳过')
        return
      }
      
      // 检查是否是文件拖拽（图片文件）
      if (types.includes('Files')) {
        console.log('[GridView] 检测到文件拖拽')
        const files = event.dataTransfer.files
        if (files.length > 0) {
          const file = files[0]
          console.log('[GridView] 文件:', file.name, file.type, file.size)
          
          // 检查是否是图片文件
          if (file.type.startsWith('image/')) {
            console.log('[GridView] 是图片文件，尝试提取布局数据')
            try {
              const { extractLayoutFromImage } = await import('../utils/layoutImageUtils.js')
              const layoutData = await extractLayoutFromImage(file)
              
              console.log('[GridView] 从拖拽图片提取的布局数据:', layoutData)
              
              if (layoutData && layoutData.websites && Array.isArray(layoutData.websites)) {
                console.log('[GridView] 从拖拽图片检测到布局数据，触发导入事件')
                emit('import-layout-from-image', layoutData)
                return
              } else {
                console.log('[GridView] 图片中没有找到布局数据')
              }
            } catch (error) {
              console.error('[GridView] 处理拖拽图片失败:', error)
            }
          }
        }
      }
      
      // 处理URL拖拽
      if (types.includes('text/uri-list') || types.includes('text/plain') || types.includes('text/x-moz-url')) {
        handleDropOnEmptyBase(event, emit)
      }
    }

    // 判断某个索引的网站是否应该隐藏
    const isHidden = (index) => {
      if (props.fullscreenIndex !== null) {
        return index !== props.fullscreenIndex
      }
      return false
    }

    // 确认添加网站包装器
    const onConfirmAddWebsite = (websiteData) => {
      confirmAddWebsite(websiteData, handleRefreshWebsite)
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

    // 处理画布鼠标按下（开始平移）
    const handleCanvasMouseDown = (event) => {
      if (props.fullscreenIndex !== null) return
      if (isDraggingItem.value || isResizing.value) return

      const target = event.target
      if (target.closest('.grid-item') || 
          target.closest('.btn-add-website-float') || 
          target.closest('.canvas-controls') ||
          target.closest('.drawing-toolbar')) {
        return
      }

      if (event.button === 1) {
        startPan(event)
        return
      }

      if (isDrawingMode.value && event.button === 0) {
        return
      }

      startPan(event)
    }

    // 处理右键菜单事件
    const handleContextMenu = (event) => {
      const target = event.target
      if (target.closest('webview') || 
          target.closest('iframe') || 
          target.closest('.grid-item')) {
        return
      }
      event.preventDefault()
    }

    // 处理画布滚轮（缩放）
    const handleCanvasWheel = (event) => {
      if (props.fullscreenIndex !== null) return
      if (isDraggingItem.value || isResizing.value) return
      handleWheelZoom(event)
    }

    // 缩放控制
    const zoomIn = () => setZoom(canvasTransform.value.zoom + 0.1)
    const zoomOut = () => setZoom(canvasTransform.value.zoom - 0.1)
    const resetTransform = () => resetCanvasTransform()

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
      if (props.fullscreenIndex !== null) {
        handleRefreshWebsite(props.fullscreenIndex)
      }
    }

    // 全屏模式下的前进后退状态
    const fullscreenCanGoBack = ref(false)
    const fullscreenCanGoForward = ref(false)

    // 检查全屏模式下的导航状态
    const checkFullscreenNavigationState = () => {
      if (props.fullscreenIndex === null) {
        fullscreenCanGoBack.value = false
        fullscreenCanGoForward.value = false
        return
      }

      const website = allWebsites.value[props.fullscreenIndex]
      if (!website || website.type === 'desktop-capture') {
        fullscreenCanGoBack.value = false
        fullscreenCanGoForward.value = false
        return
      }

      const isElectron = window.electron?.isElectron
      if (isElectron) {
        // Electron 环境：查找 webview
        const webviewElements = document.querySelectorAll('.grid-item webview:not(.buffer-webview)')
        const webview = webviewElements[props.fullscreenIndex]
        if (webview) {
          try {
            fullscreenCanGoBack.value = webview.canGoBack()
            fullscreenCanGoForward.value = webview.canGoForward()
          } catch (error) {
            console.error('[GridView] 检查全屏导航状态失败:', error)
            fullscreenCanGoBack.value = false
            fullscreenCanGoForward.value = false
          }
        }
      } else {
        // 浏览器环境：查找 iframe
        const iframeElements = document.querySelectorAll('.grid-item iframe:not(.buffer-iframe)')
        const iframe = iframeElements[props.fullscreenIndex]
        if (iframe) {
          try {
            const iframeWindow = iframe.contentWindow
            if (iframeWindow && iframeWindow.history) {
              // 对于 iframe，我们无法直接检查，假设可以前进后退
              fullscreenCanGoBack.value = true
              fullscreenCanGoForward.value = true
            } else {
              fullscreenCanGoBack.value = false
              fullscreenCanGoForward.value = false
            }
          } catch (error) {
            // 跨域 iframe 无法访问
            fullscreenCanGoBack.value = false
            fullscreenCanGoForward.value = false
          }
        }
      }
    }

    // 全屏模式下的后退
    const handleFullscreenGoBack = () => {
      if (props.fullscreenIndex === null) return

      const website = allWebsites.value[props.fullscreenIndex]
      if (!website || website.type === 'desktop-capture') return

      const isElectron = window.electron?.isElectron
      if (isElectron) {
        const webviewElements = document.querySelectorAll('.grid-item webview:not(.buffer-webview)')
        const webview = webviewElements[props.fullscreenIndex]
        if (webview && webview.canGoBack()) {
          webview.goBack()
          setTimeout(checkFullscreenNavigationState, 100)
        }
      } else {
        const iframeElements = document.querySelectorAll('.grid-item iframe:not(.buffer-iframe)')
        const iframe = iframeElements[props.fullscreenIndex]
        if (iframe) {
          try {
            const iframeWindow = iframe.contentWindow
            if (iframeWindow && iframeWindow.history) {
              iframeWindow.history.back()
              setTimeout(checkFullscreenNavigationState, 100)
            }
          } catch (error) {
            console.error('[GridView] 全屏 iframe 后退失败:', error)
          }
        }
      }
    }

    // 全屏模式下的前进
    const handleFullscreenGoForward = () => {
      if (props.fullscreenIndex === null) return

      const website = allWebsites.value[props.fullscreenIndex]
      if (!website || website.type === 'desktop-capture') return

      const isElectron = window.electron?.isElectron
      if (isElectron) {
        const webviewElements = document.querySelectorAll('.grid-item webview:not(.buffer-webview)')
        const webview = webviewElements[props.fullscreenIndex]
        if (webview && webview.canGoForward()) {
          webview.goForward()
          setTimeout(checkFullscreenNavigationState, 100)
        }
      } else {
        const iframeElements = document.querySelectorAll('.grid-item iframe:not(.buffer-iframe)')
        const iframe = iframeElements[props.fullscreenIndex]
        if (iframe) {
          try {
            const iframeWindow = iframe.contentWindow
            if (iframeWindow && iframeWindow.history) {
              iframeWindow.history.forward()
              setTimeout(checkFullscreenNavigationState, 100)
            }
          } catch (error) {
            console.error('[GridView] 全屏 iframe 前进失败:', error)
          }
        }
      }
    }

    // 绘制鼠标按下包装器
    const handleDrawingMouseDownWrapper = (event) => {
      handleDrawingMouseDown(event, props.fullscreenIndex)
    }

    // 处理自动排布
    const handleAutoArrange = () => {
      const updates = autoArrange()
      
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
    }

    // 刷新所有网站
    const handleRefreshAll = () => {
      console.log('[GridView] 刷新所有网站')
      allWebsites.value.forEach((site, index) => {
        handleRefreshWebsite(index)
      })
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
    })

    onUnmounted(() => {
      cleanupFullscreen()
      window.removeEventListener('resize', initializeGridLayout)
    })

    return {
      // 状态
      allWebsites,
      currentFullscreenWebsite,
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
      isPanning,
      zoomPercentage,
      transformStyle,
      // 绘制状态
      isDrawingMode,
      currentPath,
      drawingColor,
      drawingWidth,
      savedDrawings,
      // 方法
      isHidden,
      getItemStyle,
      startAddWebsite,
      startAddDesktopCapture,
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
      handleAutoArrange,
      handleRefreshAll,
      handleFullscreenToggle,
      handleFullscreenRefresh,
      handleFullscreenGoBack,
      handleFullscreenGoForward,
      fullscreenCanGoBack,
      fullscreenCanGoForward,
      // 绘制方法
      toggleDrawingMode,
      handleDrawingMouseDownWrapper,
      handleDrawingMouseMove,
      handleDrawingMouseUp,
      getPathData,
      clearAllDrawings,
      setDrawingColor,
      setDrawingWidth
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

.drawing-layer {
  position: absolute;
  top: -10000px;
  left: -10000px;
  width: 20000px;
  height: 20000px;
  pointer-events: none;
  z-index: 100;
  overflow: visible;
}

.drawing-layer path {
  pointer-events: none;
}

.drawing-layer.drawing-active {
  pointer-events: auto;
  cursor: crosshair;
  z-index: 100;
}
</style>
