<template>
  <div class="grid-website-list">
    <WebsiteCard
      v-for="(item, index) in allWebsites"
      :key="item.id || `website-${index}`"
      :item="item"
      :index="index"
      :item-style="itemStyle(index)"
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
      @drag-start="handleDragStart($event, index)"
      @drag-over="handleDragOver"
      @drag-leave="handleDragLeave"
      @drop="handleDrop"
      @refresh="handleRefresh"
      @copy="handleCopy"
      @edit="handleEdit"
      @fullscreen="handleFullscreen(index)"
      @remove="handleRemove"
      @toggle-mute="handleToggleMute"
      @open-script-panel="handleOpenScriptPanel"
      @open-monitoring="handleOpenMonitoring"
      @update-url="handleUpdateUrl"
      @resize-start="handleResizeStart($event, index, $event)"
    />
  </div>
</template>

<script>
import WebsiteCard from './WebsiteCard.vue'

/**
 * GridWebsiteList - 网站卡片列表组件
 * 负责渲染和管理所有网站卡片
 */
export default {
  name: 'GridWebsiteList',
  components: {
    WebsiteCard
  },
  props: {
    allWebsites: {
      type: Array,
      required: true
    },
    fullscreenIndex: {
      type: Number,
      default: null
    },
    dragOverIndex: {
      type: Number,
      default: null
    },
    isDragging: {
      type: Boolean,
      default: false
    },
    isDraggingItem: {
      type: Boolean,
      default: false
    },
    currentDragIndex: {
      type: Number,
      default: null
    },
    isResizing: {
      type: Boolean,
      default: false
    },
    currentResizeIndex: {
      type: Number,
      default: null
    },
    dragIsColliding: {
      type: Boolean,
      default: false
    },
    resizeIsColliding: {
      type: Boolean,
      default: false
    },
    globalSettings: {
      type: Object,
      default: () => ({ showTitles: true })
    },
    getItemStyle: {
      type: Function,
      required: true
    }
  },
  emits: [
    'drag-start',
    'drag-over',
    'drag-leave',
    'drop',
    'refresh',
    'copy',
    'edit',
    'fullscreen',
    'remove',
    'toggle-mute',
    'open-script-panel',
    'open-monitoring',
    'update-url',
    'resize-start'
  ],
  setup(props, { emit }) {
    // ========== 判断是否隐藏 ==========
    
    const isHidden = (index) => {
      if (props.fullscreenIndex !== null) {
        return index !== props.fullscreenIndex
      }
      return false
    }
    
    // ========== 获取样式 ==========
    
    const itemStyle = (index) => {
      return props.getItemStyle(props.allWebsites[index], index, props.fullscreenIndex)
    }
    
    // ========== 事件处理 ==========
    
    const handleDragStart = (event, index) => {
      emit('drag-start', event, index)
    }
    
    const handleDragOver = (event) => {
      emit('drag-over', event)
    }
    
    const handleDragLeave = (event) => {
      emit('drag-leave', event)
    }
    
    const handleDrop = (event, index) => {
      emit('drop', event, index)
    }
    
    const handleRefresh = (index) => {
      emit('refresh', index)
    }
    
    const handleCopy = (index) => {
      emit('copy', index)
    }
    
    const handleEdit = (index) => {
      emit('edit', index)
    }
    
    const handleFullscreen = (index) => {
      emit('fullscreen', index)
    }
    
    const handleRemove = (index) => {
      emit('remove', index)
    }
    
    const handleToggleMute = (index, muted) => {
      emit('toggle-mute', index, muted)
    }
    
    const handleOpenScriptPanel = (iframe) => {
      emit('open-script-panel', iframe)
    }
    
    const handleOpenMonitoring = (websiteId, darkMode) => {
      emit('open-monitoring', websiteId, darkMode)
    }
    
    const handleUpdateUrl = (index, url) => {
      emit('update-url', index, url)
    }
    
    const handleResizeStart = (event, index, handle) => {
      emit('resize-start', event, index, handle)
    }

    return {
      isHidden,
      itemStyle,
      handleDragStart,
      handleDragOver,
      handleDragLeave,
      handleDrop,
      handleRefresh,
      handleCopy,
      handleEdit,
      handleFullscreen,
      handleRemove,
      handleToggleMute,
      handleOpenScriptPanel,
      handleOpenMonitoring,
      handleUpdateUrl,
      handleResizeStart
    }
  }
}
</script>

<style scoped>
.grid-website-list {
  /* 该组件不需要特殊样式，WebsiteCard 自己有定位 */
}
</style>

