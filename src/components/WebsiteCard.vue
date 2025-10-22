<template>
  <div
    class="grid-item"
    :class="{
      'fullscreen': isFullscreen,
      'hidden': isHidden,
      'empty-slot': !item.url,
      'drag-over': isDragOver && isExternalDragging,
      'draggable': true,
      'dragging': isDragging && isCurrentDrag,
      'resizing': isResizing && isCurrentResize,
      'colliding': isColliding && (isCurrentDrag || isCurrentResize)
    }"
    :style="itemStyle"
  >
    <!-- 已有网站显示 -->
    <template v-if="item.url">
      <iframe
        :ref="setIframeRef"
        :data-iframe-id="`iframe-${item.id}`"
        :src="websiteUrl"
        frameborder="0"
        sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-popups-to-escape-sandbox allow-downloads allow-modals"
        class="website-iframe"
        :class="{ 'mobile-view': item.deviceType === 'mobile' }"
        :title="item.title"
        :allow="'autoplay; fullscreen; picture-in-picture'"
      ></iframe>
      
      <!-- 拖动手柄 -->
      <DragHandle
        @mousedown="$emit('drag-start', $event, index)"
        @touchstart="$emit('drag-start', $event, index)"
      />
      
      <!-- 拖放区域和提示 -->
      <DropZone
        :is-drag-over="isDragOver"
        :is-external-dragging="isExternalDragging"
        @drag-over="$emit('drag-over', index)"
        @drag-leave="$emit('drag-leave')"
        @drop="$emit('drop', $event, index)"
      />
      
      <!-- 非全屏模式下的浮动按钮 -->
      <FloatingActions
        v-if="!isFullscreen"
        @refresh="$emit('refresh', index)"
        @edit="$emit('edit', index)"
        @fullscreen="$emit('fullscreen', index)"
        @remove="$emit('remove', index)"
      />

      <!-- 调整大小手柄 -->
      <ResizeHandles
        @resize-start="(event, direction) => $emit('resize-start', event, index, direction)"
      />
      
      <!-- 自动刷新倒计时显示 -->
      <div v-if="item.autoRefreshInterval > 0 && remainingTime > 0" class="refresh-timer">
        <svg class="timer-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 6V12L16 14" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
          <circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="2"/>
        </svg>
        <span class="timer-text">{{ formatTime(remainingTime) }}</span>
      </div>
    </template>
  </div>
</template>

<script>
import { computed, toRef } from 'vue'
import FloatingActions from './FloatingActions.vue'
import DragHandle from './DragHandle.vue'
import ResizeHandles from './ResizeHandles.vue'
import DropZone from './DropZone.vue'
import { useIframeSelector } from '../composables/useIframeSelector.js'
import { useAutoRefresh } from '../composables/useAutoRefresh.js'

export default {
  name: 'WebsiteCard',
  components: {
    FloatingActions,
    DragHandle,
    ResizeHandles,
    DropZone
  },
  props: {
    item: {
      type: Object,
      required: true
    },
    index: {
      type: Number,
      required: true
    },
    itemStyle: {
      type: Object,
      default: () => ({})
    },
    isFullscreen: {
      type: Boolean,
      default: false
    },
    isHidden: {
      type: Boolean,
      default: false
    },
    isDragOver: {
      type: Boolean,
      default: false
    },
    isExternalDragging: {
      type: Boolean,
      default: false
    },
    isDragging: {
      type: Boolean,
      default: false
    },
    isCurrentDrag: {
      type: Boolean,
      default: false
    },
    isResizing: {
      type: Boolean,
      default: false
    },
    isCurrentResize: {
      type: Boolean,
      default: false
    },
    isColliding: {
      type: Boolean,
      default: false
    }
  },
  emits: ['drag-start', 'drag-over', 'drag-leave', 'drop', 'refresh', 'edit', 'fullscreen', 'remove', 'resize-start'],
  setup(props, { emit }) {
    // 使用iframe选择器composable
    const {
      isElectron,
      setIframeRef,
      getWebsiteUrl
    } = useIframeSelector(props)

    // 计算网站URL
    const websiteUrl = computed(() => getWebsiteUrl())

    // 使用自动刷新功能
    const itemRef = toRef(props, 'item')
    const { remainingTime, resetTimer } = useAutoRefresh({
      item: itemRef,
      onRefresh: () => {
        // 触发刷新事件
        emit('refresh', props.index)
      }
    })

    // 格式化倒计时显示
    const formatTime = (seconds) => {
      if (!seconds || seconds <= 0) return ''
      
      const days = Math.floor(seconds / 86400)
      const hours = Math.floor((seconds % 86400) / 3600)
      const mins = Math.floor((seconds % 3600) / 60)
      const secs = seconds % 60
      
      // 根据时间长度选择最合适的显示格式
      if (days > 0) {
        // 显示天和小时
        if (hours > 0) {
          return `${days}天${hours}时`
        }
        return `${days}天`
      }
      
      if (hours > 0) {
        // 显示小时和分钟
        if (mins > 0) {
          return `${hours}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
        }
        return `${hours}时`
      }
      
      if (mins > 0) {
        // 显示分钟和秒
        return `${mins}:${secs.toString().padStart(2, '0')}`
      }
      
      // 只显示秒
      return `${secs}s`
    }

    return {
      websiteUrl,
      isElectron,
      setIframeRef,
      remainingTime,
      formatTime,
      resetTimer
    }
  }
}
</script>

<style scoped>
.grid-item {
  background: white;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  position: relative;
  min-height: 300px;
  cursor: move;
  border: solid 1px #FF5C00;
}

.grid-item.draggable:hover {
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
}

/* 拖动和调整大小时禁用所有动画 */
.grid-item.dragging,
.grid-item.resizing {
  transition: none !important;
}

/* 拖动时保持正在拖动的元素可交互 */
.grid-item.dragging {
  z-index: 9999 !important;
}

.grid-item.resizing {
  z-index: 9999 !important;
}

/* 碰撞时的视觉反馈 */
.grid-item.colliding {
  box-shadow: 0 0 0 3px rgba(255, 0, 0, 0.5) !important;
  animation: shake 0.3s ease-in-out;
}

@keyframes shake {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-2px); }
  75% { transform: translateX(2px); }
}

.grid-item.hidden {
  display: none;
}

.grid-item.fullscreen {
  position: fixed !important;
  top: 0 !important;
  left: 0 !important;
  width: 100vw !important;
  height: 100vh !important;
  z-index: 9999 !important;
  border-radius: 0;
  box-shadow: none;
  margin: 0;
  padding: 0;
}

.grid-item.drag-over {
  border: 3px dashed var(--primary-color);
  background: var(--primary-light);
  box-shadow: 0 4px 12px rgba(255, 92, 0, 0.3);
}

.website-iframe {
  width: 100%;
  height: 100%;
  border: none;
}

/* 拖动或调整大小时，禁用iframe的鼠标事件，防止操作中断 */
.grid-item.dragging .website-iframe,
.grid-item.resizing .website-iframe {
  pointer-events: none;
}

.website-iframe.mobile-view {
  max-width: 375px;
  margin: 0 auto;
  border: 2px solid #ddd;
  border-radius: 20px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
}

/* 悬停时显示拖动手柄 */
.grid-item:hover :deep(.drag-handle) {
  opacity: 1;
}

/* 拖动时保持手柄可见 */
.grid-item.dragging :deep(.drag-handle) {
  opacity: 1;
}

/* 全屏模式下隐藏拖动手柄 */
.grid-item.fullscreen :deep(.drag-handle) {
  display: none;
}

/* 悬停时显示浮动操作按钮 */
.grid-item:hover :deep(.floating-actions) {
  opacity: 1;
  pointer-events: all;
}

/* 悬停时显示调整大小手柄 */
.grid-item:hover :deep(.resize-handle) {
  opacity: 0.8;
}

/* 自动刷新倒计时显示 */
.refresh-timer {
  position: absolute;
  bottom: 8px;
  right: 8px;
  display: flex;
  align-items: center;
  gap: 4px;
  background: rgba(16, 185, 129, 0.9);
  color: white;
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 11px;
  font-weight: 600;
  box-shadow: 0 2px 8px rgba(16, 185, 129, 0.3);
  z-index: 100;
  pointer-events: none;
  backdrop-filter: blur(4px);
  transition: all 0.3s ease;
}

.timer-icon {
  width: 12px;
  height: 12px;
  animation: pulse 2s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.6;
  }
}

.timer-text {
  line-height: 1;
  min-width: 24px;
  text-align: center;
}

/* 全屏模式下隐藏倒计时 */
.grid-item.fullscreen .refresh-timer {
  display: none;
}

/* 拖动或调整大小时降低倒计时透明度 */
.grid-item.dragging .refresh-timer,
.grid-item.resizing .refresh-timer {
  opacity: 0.3;
}
</style>
