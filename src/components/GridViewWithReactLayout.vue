<template>
  <div
    class="grid-view"
    :class="{ 'fullscreen-mode': fullscreenIndex !== null }"
  >
    <!-- 全屏模式下的顶部退出按钮条 -->
    <FullscreenBar
      :show="fullscreenIndex !== null && showFullscreenBar"
      @exit="$emit('exitFullscreen')"
      @leave="handleFullscreenBarLeave"
    />

    <!-- 添加网站浮动按钮 -->
    <button
      v-if="fullscreenIndex === null"
      class="btn-add-website-float"
      @click="startAddWebsite(-1)"
      title="添加新网站"
    >
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="12" cy="12" r="10"/>
        <line x1="12" y1="8" x2="12" y2="16"/>
        <line x1="8" y1="12" x2="16" y2="12"/>
      </svg>
    </button>

    <!-- 添加/编辑网站对话框 -->
    <WebsiteEditDialog
      :show="editingSlot !== null"
      :editing-index="editingSlot"
      :website="newWebsite"
      @confirm="confirmAddWebsite"
      @cancel="cancelAddWebsite"
    />

    <!-- React Grid Layout 容器 -->
    <div ref="gridContainer" class="grid-container">
      <ReactGridLayoutVue
        v-if="gridWidth > 0 && fullscreenIndex === null"
        :layout="reactLayout"
        :items="allWebsites"
        :renderItem="renderWebsiteCard"
        :onLayoutChange="handleLayoutChange"
        :cols="12"
        :rowHeight="60"
        :width="gridWidth"
        :margin="[20, 20]"
        :containerPadding="[15, 15]"
        :compactType="'vertical'"
        :preventCollision="false"
        :isDraggable="true"
        :isResizable="true"
        :resizeHandles="['se', 'e', 's']"
      />

      <!-- 全屏模式 -->
      <WebsiteCard
        v-if="fullscreenIndex !== null"
        :item="allWebsites[fullscreenIndex]"
        :index="fullscreenIndex"
        :item-style="getFullscreenStyle()"
        :is-fullscreen="true"
        :is-hidden="false"
        :is-drag-over="false"
        :is-external-dragging="false"
        :is-dragging="false"
        :is-current-drag="false"
        :is-resizing="false"
        :is-current-resize="false"
        :is-colliding="false"
        @refresh="handleRefreshWebsite"
        @edit="handleEditWebsite"
        @fullscreen="$emit('fullscreen', fullscreenIndex)"
        @remove="handleRemoveWebsite"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, nextTick, watch, createApp, h } from 'vue'
import { applyReactInVue } from 'veaury'
import { createRoot } from 'react-dom/client'
import ReactGridLayoutWrapper from './ReactGridLayout.jsx'
import FullscreenBar from './FullscreenBar.vue'
import WebsiteEditDialog from './WebsiteEditDialog.vue'
import WebsiteCard from './WebsiteCard.vue'
import { useFullscreen } from '../composables/useFullscreen'

// 将 React 组件转换为 Vue 组件，配置 createRoot
const ReactGridLayoutVue = applyReactInVue(ReactGridLayoutWrapper, {
  react: {
    createRoot
  }
})

// Props
const props = defineProps({
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
  }
})

// Emits
const emit = defineEmits(['fullscreen', 'exitFullscreen', 'add-website', 'remove-website', 'update-website'])

// 状态
const editingSlot = ref(null)
const newWebsite = ref({
  title: '',
  url: '',
  deviceType: 'desktop',
  targetSelector: '',
  autoRefreshInterval: 0
})
const gridContainer = ref(null)
const gridWidth = ref(0)
const cardInstances = ref(new Map())

// 计算属性
const allWebsites = computed(() => props.websites || [])

// React Grid Layout 布局配置
const reactLayout = computed(() => {
  const layout = allWebsites.value.map((item, index) => {
    // 将像素坐标转换为网格坐标
    // 网格单元大小：宽度 = 容器宽度/12, 高度 = 60px
    const cellWidth = gridWidth.value / 12
    const cellHeight = 60
    
    const gridX = Math.round((item.position?.x || index * 4 * cellWidth) / cellWidth)
    const gridY = Math.round((item.position?.y || 0) / cellHeight)
    const gridW = Math.max(2, Math.round((item.size?.width || 400) / cellWidth))
    const gridH = Math.max(2, Math.round((item.size?.height || 300) / cellHeight))

    return {
      i: item.id.toString(),
      x: Math.min(gridX, 12 - gridW), // 确保不超出右边界
      y: gridY,
      w: gridW,
      h: gridH,
      minW: 2,
      minH: 2
    }
  })
  
  console.log('[GridView] reactLayout computed', {
    websitesCount: allWebsites.value.length,
    layout,
    websites: allWebsites.value,
    gridWidth: gridWidth.value
  })
  
  return layout
})

// 全屏相关
const fullscreenIndexRef = computed(() => props.fullscreenIndex)
const {
  showFullscreenBar,
  handleGridMouseMove,
  handleFullscreenBarLeave,
  cleanup: cleanupFullscreen
} = useFullscreen(fullscreenIndexRef)

// 方法
const renderWebsiteCard = (el, item, index) => {
  // 检查是否已经挂载过
  if (cardInstances.value.has(item.id)) {
    console.log('[GridView] 卡片已存在，跳过重新挂载', { id: item.id, title: item.title })
    return
  }

  console.log('[GridView] 首次渲染卡片', { id: item.id, index, title: item.title })

  // 创建新的 Vue 应用实例来渲染 WebsiteCard
  const app = createApp({
    render() {
      return h(WebsiteCard, {
        item: item,
        index: index,
        itemStyle: {
          width: '100%',
          height: '100%',
          position: 'relative'
        },
        isFullscreen: false,
        isHidden: false,
        isDragOver: false,
        isExternalDragging: false,
        isDragging: false,
        isCurrentDrag: false,
        isResizing: false,
        isCurrentResize: false,
        isColliding: false,
        onRefresh: () => handleRefreshWebsite(index),
        onEdit: () => handleEditWebsite(index),
        onFullscreen: () => emit('fullscreen', index),
        onRemove: () => handleRemoveWebsite(index)
      })
    }
  })

  app.mount(el)
  cardInstances.value.set(item.id, app)
}

const getFullscreenStyle = () => {
  return {
    position: 'fixed',
    top: 0,
    left: 0,
    width: '100vw',
    height: '100vh',
    zIndex: 1000
  }
}

const handleLayoutChange = (newLayout) => {
  console.log('[GridView] React Grid Layout 改变', newLayout)
  
  // 将网格坐标转换回像素坐标并更新
  const cellWidth = gridWidth.value / 12
  const cellHeight = 60
  
  newLayout.forEach(layoutItem => {
    const index = allWebsites.value.findIndex(w => w.id.toString() === layoutItem.i)
    if (index !== -1) {
      const pixelX = layoutItem.x * cellWidth
      const pixelY = layoutItem.y * cellHeight
      const pixelWidth = layoutItem.w * cellWidth
      const pixelHeight = layoutItem.h * cellHeight

      emit('update-website', {
        index,
        position: { x: pixelX, y: pixelY },
        size: { width: pixelWidth, height: pixelHeight }
      })
    }
  })
}

const startAddWebsite = (index) => {
  editingSlot.value = index
  newWebsite.value = {
    title: '',
    url: '',
    deviceType: 'desktop',
    targetSelector: '',
    autoRefreshInterval: 0
  }
}

const confirmAddWebsite = (websiteData) => {
  if (editingSlot.value !== -1 && editingSlot.value !== null) {
    emit('update-website', {
      index: editingSlot.value,
      ...websiteData
    })
  } else {
    emit('add-website', websiteData)
  }

  editingSlot.value = null
  newWebsite.value = { title: '', url: '', deviceType: 'desktop', targetSelector: '', autoRefreshInterval: 0 }
}

const cancelAddWebsite = () => {
  editingSlot.value = null
  newWebsite.value = { title: '', url: '', deviceType: 'desktop', targetSelector: '', autoRefreshInterval: 0 }
}

const handleRemoveWebsite = (index) => {
  if (confirm(`确定要删除 "${props.websites[index].title}" 吗？`)) {
    emit('remove-website', index)
  }
}

const handleRefreshWebsite = (index) => {
  const iframe = document.querySelector(`.grid-item:nth-child(${index + 1}) iframe`)
  if (iframe) {
    iframe.src = iframe.src
  }
}

const handleEditWebsite = (index) => {
  const website = props.websites[index]
  if (website) {
    editingSlot.value = index
    newWebsite.value = {
      title: website.title,
      url: website.url,
      deviceType: website.deviceType || 'desktop',
      targetSelector: website.targetSelector || '',
      autoRefreshInterval: website.autoRefreshInterval || 0
    }
  }
}

const updateGridWidth = () => {
  if (gridContainer.value) {
    gridWidth.value = gridContainer.value.clientWidth
    console.log('[GridView] 更新网格宽度', {
      width: gridWidth.value,
      websitesCount: allWebsites.value.length,
      fullscreenIndex: props.fullscreenIndex
    })
  }
}

// 生命周期
onMounted(() => {
  console.log('[GridView] 组件已挂载', {
    websitesCount: allWebsites.value.length,
    websites: allWebsites.value
  })
  
  nextTick(() => {
    updateGridWidth()
  })

  window.addEventListener('resize', updateGridWidth)
})

onUnmounted(() => {
  // 清理所有卡片实例
  cardInstances.value.forEach(app => app.unmount())
  cardInstances.value.clear()
  
  cleanupFullscreen()
  window.removeEventListener('resize', updateGridWidth)
})

// 监听网站列表变化
watch(() => props.websites, () => {
  nextTick(() => {
    updateGridWidth()
  })
}, { deep: true })
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
  scrollbar-width: none;
  -ms-overflow-style: none;
}

.grid-view::-webkit-scrollbar {
  display: none;
}

.fullscreen-mode {
  padding: 0;
  overflow: hidden;
}

.btn-add-website-float {
  position: fixed;
  bottom: 30px;
  right: 30px;
  width: 60px;
  height: 60px;
  background: var(--primary-color);
  color: white;
  border: none;
  border-radius: 50%;
  box-shadow: 0 4px 16px rgba(255, 92, 0, 0.4);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s;
  z-index: 100;
}

.btn-add-website-float:hover {
  background: var(--primary-hover);
  transform: scale(1.1);
  box-shadow: 0 6px 20px rgba(255, 92, 0, 0.5);
}

.btn-add-website-float svg {
  display: block;
}

.grid-container {
  width: 100%;
  min-height: 100%;
  height: auto;
  position: relative;
}

/* React Grid Layout 样式覆盖 */
:deep(.react-grid-layout) {
  position: relative;
  transition: height 200ms ease;
}

:deep(.react-grid-item) {
  transition: all 200ms ease;
  transition-property: left, top, width, height;
}

:deep(.react-grid-item.cssTransforms) {
  transition-property: transform, width, height;
}

:deep(.react-grid-item.resizing) {
  transition: none;
  z-index: 100;
}

:deep(.react-grid-item.react-draggable-dragging) {
  transition: none;
  z-index: 100;
}

:deep(.react-grid-item.dropping) {
  visibility: hidden;
}

:deep(.react-grid-item.react-grid-placeholder) {
  background: rgba(255, 92, 0, 0.2);
  opacity: 0.2;
  transition-duration: 100ms;
  z-index: 2;
  -webkit-user-select: none;
  -moz-user-select: none;
  -ms-user-select: none;
  -o-user-select: none;
  user-select: none;
  border-radius: 8px;
  border: 2px dashed var(--primary-color);
}

:deep(.react-grid-item > .react-resizable-handle) {
  position: absolute;
  width: 20px;
  height: 20px;
}

:deep(.react-grid-item > .react-resizable-handle::after) {
  content: "";
  position: absolute;
  right: 3px;
  bottom: 3px;
  width: 5px;
  height: 5px;
  border-right: 2px solid rgba(0, 0, 0, 0.4);
  border-bottom: 2px solid rgba(0, 0, 0, 0.4);
}

:deep(.react-resizable-hide > .react-resizable-handle) {
  display: none;
}

:deep(.react-grid-item > .react-resizable-handle.react-resizable-handle-sw) {
  bottom: 0;
  left: 0;
  cursor: sw-resize;
  transform: rotate(90deg);
}

:deep(.react-grid-item > .react-resizable-handle.react-resizable-handle-se) {
  bottom: 0;
  right: 0;
  cursor: se-resize;
}

:deep(.react-grid-item > .react-resizable-handle.react-resizable-handle-nw) {
  top: 0;
  left: 0;
  cursor: nw-resize;
  transform: rotate(180deg);
}

:deep(.react-grid-item > .react-resizable-handle.react-resizable-handle-ne) {
  top: 0;
  right: 0;
  cursor: ne-resize;
  transform: rotate(270deg);
}

:deep(.react-grid-item > .react-resizable-handle.react-resizable-handle-w),
:deep(.react-grid-item > .react-resizable-handle.react-resizable-handle-e) {
  top: 50%;
  margin-top: -10px;
  cursor: ew-resize;
}

:deep(.react-grid-item > .react-resizable-handle.react-resizable-handle-w) {
  left: 0;
  transform: rotate(135deg);
}

:deep(.react-grid-item > .react-resizable-handle.react-resizable-handle-e) {
  right: 0;
  transform: rotate(315deg);
}

:deep(.react-grid-item > .react-resizable-handle.react-resizable-handle-n),
:deep(.react-grid-item > .react-resizable-handle.react-resizable-handle-s) {
  left: 50%;
  margin-left: -10px;
  cursor: ns-resize;
}

:deep(.react-grid-item > .react-resizable-handle.react-resizable-handle-n) {
  top: 0;
  transform: rotate(225deg);
}

:deep(.react-grid-item > .react-resizable-handle.react-resizable-handle-s) {
  bottom: 0;
  transform: rotate(45deg);
}
</style>

