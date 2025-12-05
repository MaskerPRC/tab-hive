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
          @update-url="handleUpdateUrl"
          @resize-start="startResize($event, index, $event)"
        />
        
        <!-- 绘制层 -->
        <svg
          v-if="isDrawingMode || savedDrawings.length > 0"
          class="drawing-layer"
          :class="{ 'drawing-active': isDrawingMode }"
          xmlns="http://www.w3.org/2000/svg"
          @mousedown="handleDrawingMouseDown"
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
      @update-color="(color) => drawingColor = color"
      @update-width="(width) => drawingWidth = parseInt(width)"
      @clear-drawings="clearAllDrawings"
    />
  </div>
</template>

<script>
import { computed, watch, onMounted, onUnmounted, nextTick, ref } from 'vue'
import getStroke from 'perfect-freehand'
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
    },
    drawings: {
      type: Array,
      default: () => []
    }
  },
  emits: ['fullscreen', 'exitFullscreen', 'add-website', 'copy-website', 'remove-website', 'update-website', 'update-drawings'],
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

    // 绘制相关状态
    const isDrawingMode = ref(false)
    const currentPath = ref([])
    const isDrawing = ref(false)
    const drawingColor = ref('#FF5C00')
    const drawingWidth = ref(3)
    const savedDrawings = ref([])

    // 从 props 加载绘制数据
    watch(() => props.drawings, (newDrawings) => {
      savedDrawings.value = newDrawings || []
    }, { immediate: true })

    // 绘制层不需要单独的样式，因为 SVG 不应用 transform
    // 坐标计算时会考虑 grid-container 的 transform

    // 切换绘制模式
    const toggleDrawingMode = () => {
      console.log('[绘制] 切换绘制模式，当前状态:', isDrawingMode.value)
      isDrawingMode.value = !isDrawingMode.value
      if (!isDrawingMode.value) {
        // 退出绘制模式时，保存当前路径
        if (currentPath.value.length > 1) {
          saveCurrentPath()
        }
        currentPath.value = []
        isDrawing.value = false
      } else {
        console.log('[绘制] 绘制模式已激活')
      }
    }

    // 获取画布坐标（相对于 grid-container 本地坐标）
    const getCanvasCoordinates = (event) => {
      const svg = event.target.closest('svg.drawing-layer')
      if (!svg) {
        return null
      }
      
      // 获取 canvas-wrapper 的位置（这是未变换的容器）
      const canvasWrapper = event.target.closest('.canvas-wrapper')
      if (!canvasWrapper) {
        return null
      }
      
      const wrapperRect = canvasWrapper.getBoundingClientRect()
      const transform = canvasTransform.value
      
      // 计算鼠标相对于 canvas-wrapper 的屏幕坐标
      const screenX = event.clientX - wrapperRect.left
      const screenY = event.clientY - wrapperRect.top
      
      // 转换为本地坐标：减去 transform 的偏移，再除以缩放
      // 因为 grid-container 有 transform: translate(x, y) scale(zoom)
      // 所以本地坐标 = (屏幕坐标 - 偏移) / 缩放
      const x = (screenX - (transform?.x || 0)) / (transform?.zoom || 1)
      const y = (screenY - (transform?.y || 0)) / (transform?.zoom || 1)
      
      // 加上 SVG 的位置偏移（SVG 的 left: -10000px, top: -10000px）
      // 这样 SVG 坐标系统的原点在 grid-container 的 (-10000, -10000)
      const svgX = x + 10000
      const svgY = y + 10000
      
      return [svgX, svgY]
    }

    // 开始绘制
    const handleDrawingMouseDown = (event) => {
      // 只响应左键（button === 0），中键用于拖动画布
      if (event.button !== 0) {
        return
      }
      
      if (!isDrawingMode.value) {
        return
      }
      if (props.fullscreenIndex !== null) {
        return
      }
      
      // 如果点击的是网站卡片或其他元素，不开始绘制
      if (event.target.closest('.grid-item') || 
          event.target.closest('.drawing-toolbar') ||
          event.target.closest('.canvas-controls')) {
        return
      }

      event.preventDefault()
      event.stopPropagation()
      
      isDrawing.value = true
      const coords = getCanvasCoordinates(event)
      if (coords) {
        currentPath.value = [coords]
      }
    }

    // 绘制中
    const handleDrawingMouseMove = (event) => {
      if (!isDrawing.value || !isDrawingMode.value) return
      
      const coords = getCanvasCoordinates(event)
      if (coords) {
        currentPath.value.push(coords)
        // 限制路径长度，避免性能问题
        if (currentPath.value.length > 1000) {
          currentPath.value.shift()
        }
      }
    }

    // 停止绘制
    const handleDrawingMouseUp = () => {
      if (!isDrawing.value) return
      
      if (currentPath.value.length > 1) {
        saveCurrentPath()
      }
      
      currentPath.value = []
      isDrawing.value = false
    }

    // 保存当前路径
    const saveCurrentPath = () => {
      if (currentPath.value.length < 2) return

      // 使用 perfect-freehand 生成平滑路径
      const stroke = getStroke(currentPath.value, {
        size: parseInt(drawingWidth.value),
        thinning: 0.5,
        smoothing: 0.5,
        streamline: 0.5
      })
      
      const pathData = getSvgPathFromStroke(stroke)
      
      const newPath = {
        d: pathData,
        color: drawingColor.value,
        width: drawingWidth.value
      }
      
      savedDrawings.value.push(newPath)
      
      // 通知父组件更新绘制数据
      emit('update-drawings', [...savedDrawings.value])
    }

    // 获取路径数据（临时绘制）
    const getPathData = (points) => {
      if (points.length < 2) return ''
      
      const stroke = getStroke(points, {
        size: parseInt(drawingWidth.value),
        thinning: 0.5,
        smoothing: 0.5,
        streamline: 0.5
      })
      
      return getSvgPathFromStroke(stroke)
    }

    // 将 stroke 转换为 SVG path
    const getSvgPathFromStroke = (stroke) => {
      if (!stroke.length) return ''
      
      const d = stroke.reduce(
        (acc, [x0, y0], i, arr) => {
          const [x1, y1] = arr[(i + 1) % arr.length]
          acc.push(x0, y0, (x0 + x1) / 2, (y0 + y1) / 2)
          return acc
        },
        ['M', ...stroke[0], 'Q']
      )
      
      d.push('Z')
      return d.join(' ')
    }

    // 清除所有绘制
    const clearAllDrawings = () => {
      if (confirm('确定要清除所有绘制内容吗？')) {
        savedDrawings.value = []
        currentPath.value = []
        emit('update-drawings', [])
      }
    }

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
      // 如果全屏模式，禁用画布平移
      if (props.fullscreenIndex !== null) {
        return
      }

      // 如果正在拖动或调整大小，不启动画布平移
      if (isDraggingItem.value || isResizing.value) {
        return
      }

      // 如果点击的是网站卡片或其他可交互元素，不启动画布平移
      const target = event.target
      if (target.closest('.grid-item') || 
          target.closest('.btn-add-website-float') || 
          target.closest('.canvas-controls') ||
          target.closest('.drawing-toolbar')) {
        return
      }

      // 绘制模式下：左键绘制，中键拖动
      // 中键 (button === 1) 始终用于拖动画布
      if (event.button === 1) {
        startPan(event)
        return
      }

      // 左键在绘制模式下不启动画布平移（由绘制层处理）
      if (isDrawingMode.value && event.button === 0) {
        return
      }

      // 只有点击空白区域才启动画布平移
      startPan(event)
    }

    /**
     * 处理画布滚轮（缩放）
     */
    const handleCanvasWheel = (event) => {
      // 如果全屏模式，禁用画布缩放
      if (props.fullscreenIndex !== null) {
        return
      }

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
     * 处理全屏切换
     */
    const handleFullscreenToggle = (index) => {
      if (props.fullscreenIndex === index) {
        // 退出全屏
        emit('fullscreen', null)
      } else {
        // 进入全屏
        emit('fullscreen', index)
      }
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
      // 如果全屏模式，禁用画布缩放快捷键
      if (props.fullscreenIndex !== null) {
        return
      }

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

    // 监听全屏状态变化，进入全屏时重置画布变换
    watch(() => props.fullscreenIndex, (newVal, oldVal) => {
      if (newVal !== null && oldVal === null) {
        // 进入全屏时，强制重置画布缩放为100%
        console.log('[GridView] 进入全屏，重置画布变换')
        resetCanvasTransform()
      }
    })

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
      handleAutoArrange,
      handleFullscreenToggle,
      // 绘制相关
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
      clearAllDrawings
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

/* 绘制层 */
.drawing-layer {
  position: absolute;
  /* 偏移到左上方，让坐标系统覆盖负数区域 */
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

/* 绘制模式下，允许绘制层接收鼠标事件 */
.drawing-layer.drawing-active {
  pointer-events: auto;
  cursor: crosshair;
  z-index: 100;
}


/* 绘制模式下，绘制层可以接收鼠标事件 */
.grid-container:has(+ .drawing-layer) .drawing-layer {
  pointer-events: auto;
  cursor: crosshair;
}
</style>
