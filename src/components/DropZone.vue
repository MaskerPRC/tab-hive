<template>
  <div>
    <!-- 拖放捕获层 -->
    <div
      v-if="isExternalDragging"
      class="drop-zone"
      @dragover.prevent="$emit('drag-over')"
      @dragleave.prevent="$emit('drag-leave')"
      @drop.prevent="$emit('drop', $event)"
    ></div>
    
    <!-- 拖放提示框 -->
    <div v-if="isDragOver && isExternalDragging" class="drop-hint">
      <span v-html="ICONS.dropHint"></span>
      <span>替换此网站</span>
    </div>
  </div>
</template>

<script>
import { ICONS } from './icons.js'

export default {
  name: 'DropZone',
  props: {
    isDragOver: {
      type: Boolean,
      default: false
    },
    isExternalDragging: {
      type: Boolean,
      default: false
    }
  },
  emits: ['drag-over', 'drag-leave', 'drop'],
  setup() {
    return {
      ICONS
    }
  }
}
</script>

<style scoped>
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

.drop-hint :deep(svg) {
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
</style>

