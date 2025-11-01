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

    <!-- 普通网站编辑对话框 -->
    <WebsiteEditDialog
      :show="editingSlot !== null && editingDialogType === 'website'"
      :editing-index="editingSlot"
      :website="editingSlot !== null && editingSlot !== -1 ? websites[editingSlot] : newWebsite"
      @confirm="confirmAddWebsite"
      @cancel="cancelAddWebsite"
    />
    
    <!-- 桌面捕获编辑对话框 -->
    <DesktopCaptureEditDialog
      :show="editingSlot !== null && editingDialogType === 'desktop-capture'"
      :editing-index="editingSlot"
      :desktop-capture="editingSlot !== null && editingSlot !== -1 ? websites[editingSlot] : {}"
      @confirm="confirmAddWebsite"
      @cancel="cancelAddWebsite"
    />

    <div
      class="grid-container"
      :class="{
        'free-layout': true,
        'is-dragging': isDraggingItem || isResizing
      }"
      :data-websites-count="allWebsites.length"
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
        :global-muted="globalSettings?.globalMuted"
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
  </div>
</template>

<script>
import { computed, ref, watch, onMounted, onUnmounted, nextTick } from 'vue'
import FullscreenBar from './FullscreenBar.vue'
import WebsiteEditDialog from './WebsiteEditDialog.vue'
import DesktopCaptureEditDialog from './DesktopCaptureEditDialog.vue'
import WebsiteCard from './WebsiteCard.vue'
import ElementSelector from './ElementSelector.vue'
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
    DesktopCaptureEditDialog,
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
    const editingDialogType = ref('website') // 'website' 或 'desktop-capture'
    const newWebsite = ref({
      title: '',
      url: '',
      deviceType: 'desktop',
      targetSelector: '',
      targetSelectors: [],
      autoRefreshInterval: 0,
      sessionInstance: 'default',
      padding: 10,
      muted: false,
      darkMode: false,
      requireModifierForActions: false
    })

    // 元素选择器状态
    const isSelectingElement = ref(false)
    const fullscreenIframe = ref(null)

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

    // 当前全屏网站配置
    const currentFullscreenWebsite = computed(() => {
      console.log('[GridView] currentFullscreenWebsite 计算:', {
        fullscreenIndex: props.fullscreenIndex,
        websitesLength: props.websites?.length,
        targetWebsite: props.websites?.[props.fullscreenIndex]
      })
      
      if (props.fullscreenIndex !== null && props.websites[props.fullscreenIndex]) {
        const website = props.websites[props.fullscreenIndex]
        console.log('[GridView] 返回全屏网站配置:', website)
        return website
      }
      console.log('[GridView] 返回 null（无全屏网站）')
      return null
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
    } = useItemDrag(itemPositions, itemSizes, snapToGrid, checkCollisionWithOthers, isMovingAway, allWebsites)

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
      editingDialogType.value = 'website' // 默认是普通网站
      newWebsite.value = {
        title: '',
        url: '',
        deviceType: 'desktop',
        targetSelector: '',
        targetSelectors: [],
        autoRefreshInterval: 0,
        sessionInstance: 'default',
        padding: 10,
        muted: false,
        darkMode: false,
        requireModifierForActions: false
      }
    }
    
    /**
     * 开始添加桌面捕获（从快捷按钮触发）
     */
    const startAddDesktopCapture = () => {
      editingSlot.value = -1
      editingDialogType.value = 'desktop-capture'
    }

    /**
     * 确认添加网站
     */
    const confirmAddWebsite = (websiteData) => {
      console.log('[GridView] ========== 确认添加/更新网站 ==========')
      console.log('[GridView] editingSlot:', editingSlot.value)
      console.log('[GridView] websiteData:', websiteData)
      
      // 如果提交的是桌面捕获类型，确保对话框类型正确（用于后续编辑）
      if (websiteData.type === 'desktop-capture') {
        editingDialogType.value = 'desktop-capture'
      } else {
        editingDialogType.value = 'website'
      }
      
      // 如果是编辑模式
      if (editingSlot.value !== -1 && editingSlot.value !== null) {
        console.log('[GridView] 模式：编辑现有网站')
        
        // 检查是否需要刷新（选择器或暗色模式变化）
        const oldWebsite = props.websites[editingSlot.value]
        let needsRefresh = false
        
        if (oldWebsite) {
          // 检查暗色模式是否变化
          if (websiteData.darkMode !== oldWebsite.darkMode) {
            console.log('[GridView] 暗色模式已变化，需要刷新')
            needsRefresh = true
          }
          
          // 检查选择器是否变化
          const oldSelectors = oldWebsite.targetSelectors || (oldWebsite.targetSelector ? [oldWebsite.targetSelector] : [])
          const newSelectors = websiteData.targetSelectors || []
          
          // 比较选择器数组
          if (oldSelectors.length !== newSelectors.length ||
              !oldSelectors.every((sel, idx) => sel === newSelectors[idx])) {
            console.log('[GridView] 选择器已变化，需要刷新')
            console.log('[GridView] 旧选择器:', oldSelectors)
            console.log('[GridView] 新选择器:', newSelectors)
            needsRefresh = true
          }
        }
        
        const websiteIndex = editingSlot.value
        
        emit('update-website', {
          index: websiteIndex,
          ...websiteData
        })
        
        // 如果需要刷新，延迟一小段时间后自动刷新
        if (needsRefresh) {
          console.log('[GridView] 将在更新后自动刷新网站')
          setTimeout(() => {
            handleRefreshWebsite(websiteIndex)
          }, 100)
        }
      } else {
        // 添加模式
        console.log('[GridView] 模式：添加新网站')
        emit('add-website', websiteData)
      }

      // 关闭对话框并重置状态
      editingSlot.value = null
      editingDialogType.value = 'website'
      newWebsite.value = { title: '', url: '', deviceType: 'desktop', targetSelector: '', targetSelectors: [], autoRefreshInterval: 0, sessionInstance: 'default', padding: 10, muted: false, darkMode: false, requireModifierForActions: false }
      console.log('[GridView] ========== 添加/更新流程完成 ==========')
    }

    /**
     * 取消添加网站
     */
    const cancelAddWebsite = () => {
      editingSlot.value = null
      editingDialogType.value = 'website'
      newWebsite.value = { title: '', url: '', deviceType: 'desktop', targetSelector: '', targetSelectors: [], autoRefreshInterval: 0, sessionInstance: 'default', padding: 10, muted: false, darkMode: false, requireModifierForActions: false }
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
     * 切换网站静音状态
     */
    const handleToggleMute = (index) => {
      const website = props.websites[index]
      if (website) {
        emit('update-website', {
          index,
          updates: {
            muted: !website.muted
          }
        })
      }
    }

    /**
     * 更新网站URL
     */
    const handleUpdateUrl = (index, newUrl) => {
      console.log('[GridView] 更新网站 URL:', { index, newUrl })
      emit('update-website', {
        index,
        updates: {
          url: newUrl
        }
      })
    }

    /**
     * 刷新网站
     */
    const handleRefreshWebsite = (index) => {
      console.log('[GridView] ========== handleRefreshWebsite 被调用 ==========')
      console.log('[GridView] 刷新网站索引:', index)
      
      // 处理 iframe 刷新
      const iframe = document.querySelector(`.grid-item:nth-child(${index + 1}) iframe:not(.buffer-iframe)`)
      if (iframe) {
        console.log('[GridView] 刷新 iframe')
        // 通过重新设置src来刷新iframe
        const currentSrc = iframe.src
        iframe.src = 'about:blank'
        // 使用setTimeout确保浏览器识别到URL变化
        setTimeout(() => {
          iframe.src = currentSrc
        }, 10)
      }
      
      // 处理 webview 刷新
      const webview = document.querySelector(`.grid-item:nth-child(${index + 1}) webview:not(.buffer-webview)`)
      if (webview) {
        console.log('[GridView] 刷新 webview')
        // 通过重新设置src来刷新webview
        const currentSrc = webview.src
        webview.src = ''
        // 使用setTimeout确保浏览器识别到URL变化
        setTimeout(() => {
          webview.src = currentSrc
        }, 10)
      }
    }

    /**
     * 编辑网站
     */
    const handleEditWebsite = (index) => {
      const website = props.websites[index]
      if (website) {
        // 根据网站类型决定显示哪个对话框
        editingDialogType.value = website.type === 'desktop-capture' ? 'desktop-capture' : 'website'
        editingSlot.value = index
        newWebsite.value = {
          title: website.title,
          url: website.url,
          deviceType: website.deviceType || 'desktop',
          targetSelector: website.targetSelector || '',
          targetSelectors: website.targetSelectors || [],
          autoRefreshInterval: website.autoRefreshInterval || 0,
          sessionInstance: website.sessionInstance || 'default',
          padding: website.padding !== undefined ? website.padding : 10,
          muted: website.muted || false,
          darkMode: website.darkMode || false,
          requireModifierForActions: website.requireModifierForActions || false
        }
        console.log('[GridView] 编辑网站:', {
          title: website.title,
          sessionInstance: newWebsite.value.sessionInstance,
          targetSelectors: newWebsite.value.targetSelectors
        })
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

      // 根据环境获取全屏 webview 或 iframe
      const isElectron = window.electron?.isElectron
      
      if (isElectron) {
        // Electron 环境：查找 webview
        const webviewElements = document.querySelectorAll('.grid-item webview:not(.buffer-webview)')
        if (webviewElements[props.fullscreenIndex]) {
          fullscreenIframe.value = webviewElements[props.fullscreenIndex]
          isSelectingElement.value = true
          console.log('[Tab Hive] 开始元素选择模式 (webview)')
        } else {
          console.error('[Tab Hive] 未找到全屏 webview')
        }
      } else {
        // 浏览器环境：查找 iframe
        const iframeElements = document.querySelectorAll('.grid-item iframe:not(.buffer-iframe)')
        if (iframeElements[props.fullscreenIndex]) {
          fullscreenIframe.value = iframeElements[props.fullscreenIndex]
          isSelectingElement.value = true
          console.log('[Tab Hive] 开始元素选择模式 (iframe)')
        } else {
          console.error('[Tab Hive] 未找到全屏 iframe')
        }
      }
    }

    /**
     * 处理元素选择完成
     */
    const handleElementSelected = (data) => {
      const { selector, selectors, multiSelect } = data
      
      // 支持多选和单选模式
      const finalSelectors = multiSelect ? selectors : (selectors || [selector])
      
      console.log('选中元素选择器:', multiSelect ? `多选 ${finalSelectors.length} 个` : selector)
      
      if (props.fullscreenIndex !== null && props.websites[props.fullscreenIndex]) {
        const website = props.websites[props.fullscreenIndex]
        
        // 尝试获取当前 webview/iframe 的 URL
        let currentUrl = website.url
        try {
          // 查找当前全屏的 webview
          const webview = document.querySelector(`#webview-${website.id}`)
          if (webview && window.electron?.isElectron) {
            const url = webview.getURL()
            // 移除 __webview_id__ 参数
            currentUrl = url.replace(/[?&]__webview_id__=[^&]+/, '').replace(/\?$/, '')
            console.log('[GridView] 获取当前 URL:', currentUrl)
          }
        } catch (error) {
          console.warn('[GridView] 无法获取当前 URL，使用原 URL:', error)
        }
        
        // 同时更新网站的 URL 和选择器
        const updates = {
          url: currentUrl,
          targetSelectors: finalSelectors,
          targetSelector: finalSelectors.length > 0 ? finalSelectors[0] : '' // 兼容旧版
        }
        
        console.log('[GridView] ========== 准备发送 update-website 事件 ==========')
        console.log('[GridView] updates 对象:', updates)
        console.log('[GridView] 完整事件数据:', {
          index: props.fullscreenIndex,
          updates
        })
        
        emit('update-website', {
          index: props.fullscreenIndex,
          updates
        })
        
        if (multiSelect) {
          alert(`已设置 ${finalSelectors.length} 个元素选择器：\n${finalSelectors.join('\n')}\n\n网页地址已更新为：${currentUrl}\n\n退出全屏后将同时显示所有选中的元素。`)
        } else {
          alert(`已设置元素选择器：\n${selector}\n\n网页地址已更新为：${currentUrl}\n\n退出全屏后将自动应用该选择器。`)
        }
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
      confirmAddWebsite,
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
