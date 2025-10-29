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
      @select="handleElementSelected"
      @cancel="cancelElementSelection"
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
        :show-title="globalSettings?.showTitles"
        :refresh-on-fullscreen-toggle="globalSettings?.refreshOnFullscreenToggle"
        @drag-start="startDrag($event, index)"
        @drag-over="handleDragOver"
        @drag-leave="handleDragLeave"
        @drop="handleDrop"
        @refresh="handleRefreshWebsite"
        @copy="handleCopyWebsite"
        @edit="handleEditWebsite"
        @fullscreen="$emit('fullscreen', index)"
        @remove="handleRemoveWebsite"
        @resize-start="startResize($event, index, $event)"
      />
    </div>
  </div>
</template>

<script>
import { computed, ref, watch, onMounted, onUnmounted, nextTick, toRef } from 'vue'
import FullscreenBar from './FullscreenBar.vue'
import WebsiteEditDialog from './WebsiteEditDialog.vue'
import WebsiteCard from './WebsiteCard.vue'
import ElementSelector from './ElementSelector.vue'
import { useCollisionDetection } from '../composables/useCollisionDetection'
import { useGridLayout } from '../composables/useGridLayout'
import { useItemDrag } from '../composables/useItemDrag'
import { useItemResize } from '../composables/useItemResize'
import { useFullscreen } from '../composables/useFullscreen'
import { useUrlDrop } from '../composables/useUrlDrop'
import { useWebContentsView } from '../composables/useWebContentsView'

export default {
  name: 'GridView',
  components: {
    FullscreenBar,
    WebsiteEditDialog,
    WebsiteCard,
    ElementSelector
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
    // 编辑网站状态
    const editingSlot = ref(null)
    const newWebsite = ref({
      title: '',
      url: '',
      deviceType: 'desktop',
      targetSelector: '',
      autoRefreshInterval: 0
    })

    // 元素选择器状态
    const isSelectingElement = ref(false)
    const fullscreenIframe = ref(null)

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

    // 全屏和 WebContentsView 共用的 refs
    const fullscreenIndexRef = toRef(props, 'fullscreenIndex')
    const globalSettingsRef = toRef(props, 'globalSettings')

    // 全屏
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

    // WebContentsView 管理（仅在 Electron 环境中使用）
    const {
      isElectron,
      createOrUpdateView,
      removeView,
      refreshView: refreshWebContentsView,
      updateAllViewsLayout
    } = useWebContentsView(allWebsites, fullscreenIndexRef, globalSettingsRef)

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
     * 复制网站
     */
    const handleCopyWebsite = (index) => {
      emit('copy-website', index)
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
      const item = props.websites[index]
      
      if (isElectron) {
        // 在 Electron 中刷新 WebContentsView
        refreshWebContentsView(item)
      } else {
        // 在浏览器中刷新 iframe
        const iframe = document.querySelector(`.grid-item:nth-child(${index + 1}) iframe:not(.buffer-iframe)`)
        if (iframe) {
          // 通过重新设置src来刷新iframe
          const currentSrc = iframe.src
          iframe.src = 'about:blank'
          // 使用setTimeout确保浏览器识别到URL变化
          setTimeout(() => {
            iframe.src = currentSrc
          }, 10)
        }
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

    /**
     * 开始元素选择
     */
    const startElementSelection = () => {
      if (props.fullscreenIndex === null) {
        console.warn('只能在全屏模式下选择元素')
        return
      }

      // 获取全屏iframe
      const iframeElements = document.querySelectorAll('.grid-item iframe:not(.buffer-iframe)')
      if (iframeElements[props.fullscreenIndex]) {
        fullscreenIframe.value = iframeElements[props.fullscreenIndex]
        isSelectingElement.value = true
        console.log('开始元素选择模式')
      } else {
        console.error('未找到全屏iframe')
      }
    }

    /**
     * 处理元素选择完成
     */
    const handleElementSelected = ({ selector }) => {
      console.log('选中元素选择器:', selector)
      
      if (props.fullscreenIndex !== null && props.websites[props.fullscreenIndex]) {
        const website = props.websites[props.fullscreenIndex]
        
        // 更新网站的targetSelector
        emit('update-website', {
          index: props.fullscreenIndex,
          title: website.title,
          url: website.url,
          deviceType: website.deviceType || 'desktop',
          targetSelector: selector,
          autoRefreshInterval: website.autoRefreshInterval || 0
        })
        
        alert(`已设置元素选择器：\n${selector}\n\n退出全屏后将自动应用该选择器。`)
      }
      
      isSelectingElement.value = false
      fullscreenIframe.value = null
    }

    /**
     * 取消元素选择
     */
    const cancelElementSelection = () => {
      console.log('取消元素选择')
      isSelectingElement.value = false
      fullscreenIframe.value = null
    }

    // 监听网站列表变化，初始化新添加的项目
    watch(allWebsites, async (newWebsites, oldWebsites) => {
      // 使用 nextTick 确保 DOM 已更新
      await nextTick()
      initializeGridLayout()

      // 在 Electron 中更新 WebContentsView
      if (isElectron) {
        // 检查是否有删除的网站
        if (oldWebsites) {
          const newIds = new Set(newWebsites.map(w => w.id))
          const removedItems = oldWebsites.filter(w => !newIds.has(w.id))
          for (const item of removedItems) {
            await removeView(item)
          }
        }

        // 更新所有视图布局
        setTimeout(() => {
          updateAllViewsLayout(allWebsites, getItemStyle)
        }, 100)
      }
    }, { immediate: false })

    // 监听布局变化（拖拽/调整大小后）
    watch([itemPositions, itemSizes], () => {
      if (isElectron && !isDraggingItem.value && !isResizing.value) {
        // 布局稳定后更新视图
        setTimeout(() => {
          updateAllViewsLayout(allWebsites, getItemStyle)
        }, 50)
      }
    }, { deep: true })

    // 组件挂载时初始化布局
    onMounted(async () => {
      await nextTick()
      initializeGridLayout()

      // 在 Electron 中初始化所有视图
      if (isElectron) {
        setTimeout(() => {
          updateAllViewsLayout(allWebsites, getItemStyle)
        }, 500)
      }

      // 监听窗口大小变化
      const handleResize = async () => {
        initializeGridLayout()
        if (isElectron) {
          await nextTick()
          setTimeout(() => {
            updateAllViewsLayout(allWebsites, getItemStyle)
          }, 100)
        }
      }
      window.addEventListener('resize', handleResize)

      // 监听全局鼠标抬起事件，处理拖拽和调整大小结束
      const handleMouseUp = async () => {
        if (isDraggingItem.value) {
          handleDragEnd(emit)
          if (isElectron) {
            // 拖拽结束后更新视图布局
            setTimeout(() => {
              updateAllViewsLayout(allWebsites, getItemStyle)
            }, 100)
          }
        }
        if (isResizing.value) {
          handleResizeEnd(emit)
          if (isElectron) {
            // 调整大小结束后更新视图布局
            setTimeout(() => {
              updateAllViewsLayout(allWebsites, getItemStyle)
            }, 100)
          }
        }
      }
      document.addEventListener('mouseup', handleMouseUp)

      // 保存事件处理器引用以便清理
      window._gridViewResizeHandler = handleResize
      window._gridViewMouseUpHandler = handleMouseUp
    })

    // 组件卸载时清理事件监听
    onUnmounted(() => {
      cleanupFullscreen()
      if (window._gridViewResizeHandler) {
        window.removeEventListener('resize', window._gridViewResizeHandler)
        delete window._gridViewResizeHandler
      }
      if (window._gridViewMouseUpHandler) {
        document.removeEventListener('mouseup', window._gridViewMouseUpHandler)
        delete window._gridViewMouseUpHandler
      }
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
      isSelectingElement,
      fullscreenIframe,
      startAddWebsite,
      confirmAddWebsite,
      cancelAddWebsite,
      handleCopyWebsite,
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
      startResize,
      startElementSelection,
      handleElementSelected,
      cancelElementSelection
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
  /* 透明背景，让 WebContentsView 可以透过来 */
  background: transparent;
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
  /* 网格背景（半透明，不影响 WebContentsView 显示） */
  background-image:
    linear-gradient(to right, rgba(255, 92, 0, 0.05) 1px, transparent 1px),
    linear-gradient(to bottom, rgba(255, 92, 0, 0.05) 1px, transparent 1px);
  background-size: 20px 20px;
  background-position: 0 0;
}

/* 在 Electron 中不显示网格背景，避免影响视觉 */
.electron-env .grid-container.free-layout {
  background-image: none;
}

/* 全局拖动或调整大小时，禁用所有iframe的鼠标事件 */
.grid-container.is-dragging .website-iframe {
  pointer-events: none;
}
</style>
