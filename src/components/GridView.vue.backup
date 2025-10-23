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
      v-if="isDraggingItem || isResizing"
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

    <div
      class="grid-container"
      :class="{
        'free-layout': true,
        'is-dragging': isDraggingItem || isResizing
      }"
    >
      <WebsiteCard
        v-for="(item, index) in allWebsites"
        :key="item.id"
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
        @drag-start="startDrag($event, index)"
        @drag-over="handleDragOver"
        @drag-leave="handleDragLeave"
        @drop="handleDrop"
        @refresh="handleRefreshWebsite"
        @edit="handleEditWebsite"
        @fullscreen="$emit('fullscreen', index)"
        @remove="handleRemoveWebsite"
        @resize-start="startResize($event, index, $event)"
      />
    </div>
  </div>
</template>

<script>
import { computed, ref, watch, onMounted, onUnmounted, nextTick } from 'vue'
import FullscreenBar from './FullscreenBar.vue'
import WebsiteEditDialog from './WebsiteEditDialog.vue'
import WebsiteCard from './WebsiteCard.vue'
import { useCollisionDetection } from '../composables/useCollisionDetection'
import { useGridLayout } from '../composables/useGridLayout'
import { useItemDrag } from '../composables/useItemDrag'
import { useItemResize } from '../composables/useItemResize'
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
      getItemStyle
    } = useGridLayout(allWebsites)

    // 拖拽
    const {
      isDraggingItem,
      currentDragIndex,
      isColliding: dragIsColliding,
      startDrag: startDragItem,
      handleDragEnd
    } = useItemDrag(itemPositions, itemSizes, snapToGrid, checkCollisionWithOthers, isMovingAway)

    // 调整大小
    const {
      isResizing,
      currentDragIndex: currentResizeIndex,
      isColliding: resizeIsColliding,
      startResize: startResizeItem,
      handleResizeEnd
    } = useItemResize(itemPositions, itemSizes, snapToGrid, checkCollisionWithOthers, allWebsites)

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

    // 监听网站列表变化，初始化新添加的项目
    watch(allWebsites, () => {
      // 使用 nextTick 确保 DOM 已更新
      nextTick(() => {
        initializeGridLayout()
      })
    }, { immediate: false })

    // 组件挂载时初始化布局
    onMounted(() => {
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
    })

    // 组件卸载时清理事件监听
    onUnmounted(() => {
      cleanupFullscreen()
      window.removeEventListener('resize', initializeGridLayout)
    })

    return {
      allWebsites,
      isHidden,
      getItemStyle,
      editingSlot,
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
      handleDrop,
      startDrag,
      startResize
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

.grid-container {
  width: 100%;
  min-height: 100%;
  height: auto;
  position: relative;
}

.grid-container.free-layout {
  position: relative;
  min-height: 100vh;
  background-image:
    linear-gradient(to right, rgba(255, 92, 0, 0.05) 1px, transparent 1px),
    linear-gradient(to bottom, rgba(255, 92, 0, 0.05) 1px, transparent 1px);
  background-size: 20px 20px;
  background-position: 0 0;
}

/* 全局拖动或调整大小时，禁用所有iframe的鼠标事件 */
.grid-container.is-dragging .website-iframe {
  pointer-events: none;
}
</style>
