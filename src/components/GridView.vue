<template>
  <div
    class="grid-view"
    :class="{ 'fullscreen-mode': fullscreenIndex !== null }"
    @mousemove="handleGridMouseMove"
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

    <!-- 使用 grid-layout-plus -->
    <grid-layout
      v-if="fullscreenIndex === null"
      v-model:layout="layout"
      :col-num="12"
      :row-height="50"
      :is-draggable="true"
      :is-resizable="true"
      :vertical-compact="true"
      :margin="[20, 20]"
      :use-css-transforms="true"
      @layout-updated="handleLayoutUpdated"
    >
      <grid-item
        v-for="(item, index) in layout"
        :key="item.i"
        :x="item.x"
        :y="item.y"
        :w="item.w"
        :h="item.h"
        :i="item.i"
        :min-w="4"
        :min-h="3"
        :is-draggable="true"
        :is-resizable="true"
        class="grid-item-wrapper"
      >
        <WebsiteCard
          :item="websites[index]"
          :index="index"
          :item-style="{}"
          :is-fullscreen="false"
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
          @fullscreen="$emit('fullscreen', index)"
          @remove="handleRemoveWebsite"
        />
      </grid-item>
    </grid-layout>

    <!-- 全屏模式显示单个卡片 -->
    <div v-if="fullscreenIndex !== null" class="fullscreen-container">
      <WebsiteCard
        :item="websites[fullscreenIndex]"
        :index="fullscreenIndex"
        :item-style="{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', zIndex: 1000 }"
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
        @fullscreen="$emit('exitFullscreen')"
        @remove="handleRemoveWebsite"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, watch, onMounted, nextTick, computed, onUnmounted } from 'vue'
import { GridLayout, GridItem } from 'grid-layout-plus'
import FullscreenBar from './FullscreenBar.vue'
import WebsiteEditDialog from './WebsiteEditDialog.vue'
import WebsiteCard from './WebsiteCard.vue'
import { useFullscreen } from '../composables/useFullscreen'

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

const emit = defineEmits(['fullscreen', 'exitFullscreen', 'add-website', 'remove-website', 'update-website'])

// 编辑网站状态
const editingSlot = ref(null)
const newWebsite = ref({
  title: '',
  url: '',
  deviceType: 'desktop',
  targetSelector: '',
  autoRefreshInterval: 0
})

// 网格布局数据
const layout = ref([])

// 将网站数据转换为网格布局数据
const initializeLayout = () => {
  console.log('[Grid Layout] 初始化布局', props.websites.length)
  
  layout.value = props.websites.map((website, index) => {
    // 如果网站已有位置和大小信息，使用它们
    // 否则自动排列
    const x = website.gridX !== undefined ? website.gridX : (index % 3) * 4
    const y = website.gridY !== undefined ? website.gridY : Math.floor(index / 3) * 4
    const w = website.gridW !== undefined ? website.gridW : 4
    const h = website.gridH !== undefined ? website.gridH : 4
    
    console.log(`[Grid Layout] 项目 ${index}:`, { x, y, w, h })
    
    return {
      x,
      y,
      w,
      h,
      i: website.id || `item-${index}`
    }
  })
}

// 监听网站列表变化
watch(() => props.websites, () => {
  console.log('[Grid Layout] 网站列表变化')
  nextTick(() => {
    initializeLayout()
  })
}, { deep: true })

// 布局更新回调
const handleLayoutUpdated = (newLayout) => {
  console.log('[Grid Layout] 布局已更新', newLayout)
  
  // 保存布局到网站数据
  newLayout.forEach((item, index) => {
    if (props.websites[index]) {
      emit('update-website', {
        index,
        gridX: item.x,
        gridY: item.y,
        gridW: item.w,
        gridH: item.h
      })
    }
  })
}

// 全屏功能
const fullscreenIndexRef = computed(() => props.fullscreenIndex)
const {
  showFullscreenBar,
  handleGridMouseMove,
  handleFullscreenBarLeave,
  cleanup: cleanupFullscreen
} = useFullscreen(fullscreenIndexRef)

/**
 * 开始添加网站
 */
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

/**
 * 确认添加网站
 */
const confirmAddWebsite = (websiteData) => {
  // 如果是编辑模式
  if (editingSlot.value !== -1 && editingSlot.value !== null) {
    emit('update-website', {
      index: editingSlot.value,
      ...websiteData
    })
  } else {
    // 添加模式
    emit('add-website', websiteData)
  }

  editingSlot.value = null
  newWebsite.value = { title: '', url: '', deviceType: 'desktop', targetSelector: '', autoRefreshInterval: 0 }
}

/**
 * 取消添加网站
 */
const cancelAddWebsite = () => {
  editingSlot.value = null
  newWebsite.value = { title: '', url: '', deviceType: 'desktop', targetSelector: '', autoRefreshInterval: 0 }
}

/**
 * 删除网站
 */
const handleRemoveWebsite = (index) => {
  if (confirm(`确定要删除 "${props.websites[index].title}" 吗？`)) {
    emit('remove-website', index)
  }
}

/**
 * 刷新网站
 */
const handleRefreshWebsite = (index) => {
  const iframe = document.querySelector(`.grid-item-wrapper:nth-child(${index + 1}) iframe`)
  if (iframe) {
    iframe.src = iframe.src
  }
}

/**
 * 编辑网站
 */
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

// 组件挂载时初始化布局
onMounted(() => {
  nextTick(() => {
    initializeLayout()
  })
})

// 组件卸载时清理
onUnmounted(() => {
  cleanupFullscreen()
})
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

/* 添加网站浮动按钮 */
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

.grid-item-wrapper {
  background: transparent;
}

.fullscreen-container {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 1000;
}

/* 覆盖 grid-layout-plus 的默认样式 */
:deep(.vue-grid-layout),
:deep(.grid-layout) {
  position: relative;
  background-image:
    linear-gradient(to right, rgba(255, 92, 0, 0.05) 1px, transparent 1px),
    linear-gradient(to bottom, rgba(255, 92, 0, 0.05) 1px, transparent 1px);
  background-size: 20px 20px;
  background-position: 0 0;
  min-height: 100vh;
}

:deep(.vue-grid-item),
:deep(.grid-item) {
  transition: all 200ms ease;
  transition-property: transform, width, height;
  box-sizing: border-box;
  position: absolute;
  cursor: move;
}

:deep(.vue-grid-item.resizing),
:deep(.vue-grid-item.dragging),
:deep(.grid-item.resizing),
:deep(.grid-item.dragging) {
  opacity: 0.9;
  z-index: 999;
  transition: none;
}

:deep(.vue-grid-item.static),
:deep(.grid-item.static) {
  cursor: default;
}

:deep(.vue-grid-item > .vue-resizable-handle),
:deep(.grid-item > .vue-resizable-handle),
:deep(.vue-grid-item > .resizable-handle),
:deep(.grid-item > .resizable-handle) {
  position: absolute;
  width: 20px;
  height: 20px;
  background: var(--primary-color);
  border: 2px solid white;
  border-radius: 50%;
  opacity: 0;
  transition: opacity 0.2s;
  z-index: 10;
}

:deep(.vue-grid-item:hover > .vue-resizable-handle),
:deep(.grid-item:hover > .vue-resizable-handle),
:deep(.vue-grid-item:hover > .resizable-handle),
:deep(.grid-item:hover > .resizable-handle) {
  opacity: 1;
}

:deep(.vue-resizable-handle-se),
:deep(.resizable-handle-se) {
  bottom: 0;
  right: 0;
  cursor: se-resize;
}

:deep(.vue-resizable-handle-e),
:deep(.resizable-handle-e) {
  top: 50%;
  right: 0;
  transform: translateY(-50%);
  cursor: e-resize;
}

:deep(.vue-resizable-handle-s),
:deep(.resizable-handle-s) {
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  cursor: s-resize;
}

/* grid-layout-plus 特定的类名 */
:deep(.gl-layout) {
  position: relative;
}

:deep(.gl-item) {
  position: absolute;
  box-sizing: border-box;
  transition: all 200ms ease;
}

:deep(.gl-item.resizing),
:deep(.gl-item.dragging) {
  transition: none;
  z-index: 100;
}

:deep(.gl-item > .gl-resizer) {
  position: absolute;
  width: 20px;
  height: 20px;
  background: var(--primary-color);
  border: 2px solid white;
  border-radius: 50%;
  opacity: 0;
  transition: opacity 0.2s;
}

:deep(.gl-item:hover > .gl-resizer) {
  opacity: 1;
}

:deep(.gl-resizer.se) {
  bottom: 0;
  right: 0;
  cursor: se-resize;
}

:deep(.gl-resizer.e) {
  top: 50%;
  right: 0;
  transform: translateY(-50%);
  cursor: e-resize;
}

:deep(.gl-resizer.s) {
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  cursor: s-resize;
}
</style>

