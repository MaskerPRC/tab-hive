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
        :src="websiteUrl"
        frameborder="0"
        sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-popups-to-escape-sandbox allow-downloads"
        class="website-iframe"
        :class="{ 'mobile-view': item.deviceType === 'mobile' }"
        :title="item.title"
      ></iframe>
      
      <!-- 拖动手柄 -->
      <div
        class="drag-handle"
        @mousedown="$emit('drag-start', $event, index)"
        @touchstart="$emit('drag-start', $event, index)"
        title="按住拖动"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="9" cy="5" r="1"/>
          <circle cx="9" cy="12" r="1"/>
          <circle cx="9" cy="19" r="1"/>
          <circle cx="15" cy="5" r="1"/>
          <circle cx="15" cy="12" r="1"/>
          <circle cx="15" cy="19" r="1"/>
        </svg>
      </div>
      
      <!-- 拖放捕获层 -->
      <div
        v-if="isExternalDragging"
        class="drop-zone"
        @dragover.prevent="$emit('drag-over', index)"
        @dragleave.prevent="$emit('drag-leave')"
        @drop.prevent="$emit('drop', $event, index)"
      ></div>
      
      <!-- 拖放提示框 -->
      <div v-if="isDragOver && isExternalDragging" class="drop-hint">
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
          <polyline points="7 10 12 15 17 10"/>
          <line x1="12" y1="15" x2="12" y2="3"/>
        </svg>
        <span>替换此网站</span>
      </div>
      
      <!-- 非全屏模式下的浮动按钮 -->
      <div v-if="!isFullscreen" class="floating-actions">
        <button
          class="btn-action btn-refresh"
          @click="$emit('refresh', index)"
          title="刷新页面"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="23 4 23 10 17 10"/>
            <polyline points="1 20 1 14 7 14"/>
            <path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15"/>
          </svg>
        </button>
        <button
          class="btn-action btn-edit"
          @click="$emit('edit', index)"
          title="编辑链接"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
          </svg>
        </button>
        <button
          class="btn-action"
          @click="$emit('fullscreen', index)"
          title="全屏查看"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"/>
          </svg>
        </button>
        <button
          class="btn-action btn-remove"
          @click="$emit('remove', index)"
          title="删除网站"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
          </svg>
        </button>
      </div>

      <!-- 调整大小手柄 -->
      <div class="resize-handles">
        <div class="resize-handle resize-se" @mousedown="$emit('resize-start', $event, index, 'se')"></div>
        <div class="resize-handle resize-e" @mousedown="$emit('resize-start', $event, index, 'e')"></div>
        <div class="resize-handle resize-s" @mousedown="$emit('resize-start', $event, index, 's')"></div>
      </div>
    </template>
  </div>
</template>

<script>
import { computed } from 'vue'

export default {
  name: 'WebsiteCard',
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
  setup(props) {
    /**
     * 获取网站URL，支持设备类型
     */
    const websiteUrl = computed(() => {
      if (!props.item.url) return ''

      // 如果是手机版，尝试转换为移动版URL
      if (props.item.deviceType === 'mobile') {
        try {
          const url = new URL(props.item.url)
          const hostname = url.hostname

          // 应用转换规则
          let newHostname = hostname
          if (hostname.startsWith('m.')) {
            // 已经是移动版，不变
            newHostname = hostname
          } else if (hostname.startsWith('www.')) {
            newHostname = hostname.replace(/^www\./, 'm.')
          } else {
            newHostname = 'm.' + hostname
          }

          url.hostname = newHostname
          return url.toString()
        } catch (e) {
          // URL 解析失败，返回原始URL
          console.warn('无法解析URL:', props.item.url)
          return props.item.url
        }
      }

      return props.item.url
    })

    return {
      websiteUrl
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

/* 拖动手柄 */
.drag-handle {
  position: absolute;
  top: 8px;
  left: 8px;
  width: 32px;
  height: 32px;
  background: rgba(255, 92, 0, 0.9);
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: move;
  opacity: 0;
  transition: opacity 0.2s, background 0.2s;
  z-index: 150;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
}

.grid-item:hover .drag-handle {
  opacity: 1;
}

.drag-handle:hover {
  background: rgba(255, 92, 0, 1);
  transform: scale(1.05);
}

.drag-handle:active {
  transform: scale(0.95);
}

.drag-handle svg {
  display: block;
  stroke: white;
  fill: white;
}

/* 拖动时保持手柄可见 */
.grid-item.dragging .drag-handle {
  opacity: 1;
}

/* 全屏模式下隐藏拖动手柄 */
.grid-item.fullscreen .drag-handle {
  display: none;
}

.drop-zone {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 100;
  pointer-events: all;
}

.drop-hint {
  position: absolute;
  top: 10px;
  left: 10px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 15px 20px;
  background: rgba(255, 92, 0, 0.15);
  border: 2px dashed var(--primary-color);
  border-radius: 8px;
  color: var(--primary-color);
  font-weight: 600;
  font-size: 14px;
  z-index: 101;
  backdrop-filter: blur(4px);
  pointer-events: none;
  animation: pulse 1.5s ease-in-out infinite;
}

.drop-hint svg {
  stroke: var(--primary-color);
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
    transform: scale(1);
  }
  50% {
    opacity: 0.85;
    transform: scale(1.02);
  }
}

.floating-actions {
  position: absolute;
  top: 10px;
  right: 10px;
  display: flex;
  gap: 8px;
  z-index: 101;
  opacity: 0;
  transition: opacity 0.2s ease;
  pointer-events: none;
}

.grid-item:hover .floating-actions {
  opacity: 1;
  pointer-events: all;
}

.btn-action {
  background: rgba(255, 92, 0, 0.7);
  color: white;
  border: none;
  padding: 8px;
  border-radius: 6px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s;
  backdrop-filter: blur(4px);
}

.btn-action:hover {
  background: rgba(255, 92, 0, 0.9);
  transform: scale(1.1);
}

.btn-action svg {
  display: block;
}

.btn-remove {
  background: rgba(255, 68, 68, 0.7) !important;
}

.btn-remove:hover {
  background: rgba(255, 0, 0, 0.9) !important;
}

.btn-refresh {
  background: rgba(76, 175, 80, 0.7) !important;
}

.btn-refresh:hover {
  background: rgba(76, 175, 80, 0.9) !important;
}

.btn-edit {
  background: rgba(33, 150, 243, 0.7) !important;
}

.btn-edit:hover {
  background: rgba(33, 150, 243, 0.9) !important;
}

/* 调整大小手柄 */
.resize-handles {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 102;
}

.resize-handle {
  position: absolute;
  background: var(--primary-color);
  opacity: 0;
  transition: opacity 0.2s;
  pointer-events: all;
}

.grid-item:hover .resize-handle {
  opacity: 0.8;
}

.resize-handle:hover {
  opacity: 1 !important;
  background: var(--primary-hover);
}

.resize-se {
  bottom: 0;
  right: 0;
  width: 12px;
  height: 12px;
  cursor: se-resize;
  border-radius: 0 0 8px 0;
}

.resize-e {
  top: 50%;
  right: 0;
  width: 4px;
  height: 20px;
  transform: translateY(-50%);
  cursor: e-resize;
}

.resize-s {
  bottom: 0;
  left: 50%;
  width: 20px;
  height: 4px;
  transform: translateX(-50%);
  cursor: s-resize;
}
</style>

