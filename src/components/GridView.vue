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
    />

    <!-- 拖动/调整大小时的全局遮罩层，防止iframe捕获鼠标事件 -->
    <div
      v-if="isDraggingOrResizing"
      class="drag-overlay"
    ></div>

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

    <!-- Gridstack 容器 -->
    <div
      ref="gridContainer"
      class="grid-stack"
      :class="{
        'is-dragging': isDraggingOrResizing
      }"
    >
      <!-- Gridstack 会自动管理这些元素 -->
      <div
        v-for="(item, index) in allWebsites"
        :key="item.id"
        :gs-id="String(index)"
        :gs-x="getGridX(item, index)"
        :gs-y="getGridY(item, index)"
        :gs-w="getGridW(item, index)"
        :gs-h="getGridH(item, index)"
        :gs-min-w="2"
        :gs-min-h="2"
        class="grid-stack-item"
      >
        <div class="grid-stack-item-content">
          <WebsiteCard
            :item="item"
            :index="index"
            :item-style="{}"
            :is-fullscreen="fullscreenIndex === index"
            :is-hidden="isHidden(index)"
            :is-drag-over="dragOverIndex === index"
            :is-external-dragging="isDragging"
            :is-dragging="false"
            :is-current-drag="false"
            :is-resizing="false"
            :is-current-resize="false"
            :is-colliding="false"
            @drag-over="handleDragOver"
            @drag-leave="handleDragLeave"
            @drop="handleDrop"
            @refresh="handleRefreshWebsite"
            @edit="handleEditWebsite"
            @fullscreen="$emit('fullscreen', index)"
            @remove="handleRemoveWebsite"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { computed, ref, watch, onMounted, onUnmounted, nextTick } from 'vue'
import FullscreenBar from './FullscreenBar.vue'
import WebsiteEditDialog from './WebsiteEditDialog.vue'
import WebsiteCard from './WebsiteCard.vue'
import { useGridstack } from '../composables/useGridstack'
import { useFullscreen } from '../composables/useFullscreen'
import { useUrlDrop } from '../composables/useUrlDrop'

export default {
  name: 'GridView',
  components: {
    FullscreenBar,
    WebsiteEditDialog,
    WebsiteCard
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
    }
  },
  emits: ['fullscreen', 'exitFullscreen', 'add-website', 'remove-website', 'update-website'],
  setup(props, { emit }) {
    // 编辑网站状态
    const editingSlot = ref(null)
    const newWebsite = ref({
      title: '',
      url: '',
      deviceType: 'desktop',
      targetSelector: '',
      autoRefreshInterval: 0
    })

    // 所有网站列表
    const allWebsites = computed(() => {
      return props.websites || []
    })

    // Gridstack 集成
    const {
      gridContainer,
      gridInstance,
      isInitialized,
      initGridstack,
      refreshGrid,
      pixelToGrid,
      gridToPixel
    } = useGridstack(allWebsites, emit)

    // 拖拽和调整大小状态（由 body 类名控制）
    const isDraggingOrResizing = computed(() => {
      return document.body.classList.contains('dragging-item') || 
             document.body.classList.contains('resizing-item')
    })

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

    // 像素到网格单位的转换（用于初始化）
    const PIXEL_TO_GRID_WIDTH = 100
    const PIXEL_TO_GRID_HEIGHT = 100

    const getGridX = (item, index) => {
      if (item.position && item.position.x !== undefined) {
        return Math.round(item.position.x / PIXEL_TO_GRID_WIDTH)
      }
      return (index % 3) * 4  // 默认布局：每行3个，每个宽4格
    }

    const getGridY = (item, index) => {
      if (item.position && item.position.y !== undefined) {
        return Math.round(item.position.y / PIXEL_TO_GRID_HEIGHT)
      }
      return Math.floor(index / 3) * 3  // 默认布局：每个高3格
    }

    const getGridW = (item, index) => {
      if (item.size && item.size.width) {
        return Math.max(2, Math.round(item.size.width / PIXEL_TO_GRID_WIDTH))
      }
      return 4  // 默认宽度 4 格
    }

    const getGridH = (item, index) => {
      if (item.size && item.size.height) {
        return Math.max(2, Math.round(item.size.height / PIXEL_TO_GRID_HEIGHT))
      }
      return 3  // 默认高度 3 格
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
      const iframe = document.querySelector(`.grid-item:nth-child(${index + 1}) iframe`)
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

    // 监听网站列表变化
    watch(allWebsites, async () => {
      console.log('[GridView] 网站列表变化，等待初始化 Gridstack')
      await nextTick()
      
      if (!isInitialized.value) {
        console.log('[GridView] Gridstack 未初始化，初始化中...')
        await initGridstack()
      } else {
        console.log('[GridView] Gridstack 已初始化，刷新网格')
        // 可以选择刷新或者让 Gridstack 自动处理
      }
    }, { deep: true })

    // 组件挂载时初始化
    onMounted(async () => {
      console.log('[GridView] onMounted，准备初始化 Gridstack')
      await nextTick()
      await nextTick() // 等待两次以确保 DOM 完全渲染
      
      if (gridContainer.value) {
        await initGridstack()
      } else {
        console.error('[GridView] gridContainer 未找到')
      }
    })

    // 组件卸载时清理
    onUnmounted(() => {
      cleanupFullscreen()
    })

    return {
      allWebsites,
      isHidden,
      editingSlot,
      newWebsite,
      dragOverIndex,
      isDragging,
      showFullscreenBar,
      isDraggingOrResizing,
      gridContainer,
      getGridX,
      getGridY,
      getGridW,
      getGridH,
      startAddWebsite,
      confirmAddWebsite,
      cancelAddWebsite,
      handleRemoveWebsite,
      handleRefreshWebsite,
      handleEditWebsite,
      handleGridMouseMove,
      handleFullscreenBarLeave,
      handleDragEnter,
      handleViewDragLeave,
      handleDragOver,
      handleDragLeave,
      handleDrop
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

/* Gridstack 容器样式 */
.grid-stack {
  width: 100%;
  min-height: 100vh;
  position: relative;
  background-image:
    linear-gradient(to right, rgba(255, 92, 0, 0.05) 1px, transparent 1px),
    linear-gradient(to bottom, rgba(255, 92, 0, 0.05) 1px, transparent 1px);
  background-size: 20px 20px;
  background-position: 0 0;
}

/* 全局拖动或调整大小时，禁用所有iframe的鼠标事件 */
.grid-stack.is-dragging .website-iframe {
  pointer-events: none;
}

/* Gridstack 元素样式 */
.grid-stack-item {
  position: absolute;
}

.grid-stack-item-content {
  width: 100%;
  height: 100%;
  overflow: hidden;
  position: relative;
}

/* 让 WebsiteCard 填充整个 grid-stack-item-content */
.grid-stack-item-content :deep(.grid-item) {
  position: absolute !important;
  top: 0;
  left: 0;
  width: 100% !important;
  height: 100% !important;
  transform: none !important;
}
</style>
