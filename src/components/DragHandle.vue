<template>
  <div
    class="drag-handle"
    @mousedown="$emit('mousedown', $event)"
    @touchstart="$emit('touchstart', $event)"
    title="按住拖动"
    v-html="ICONS.drag"
  />
</template>

<script>
import { ICONS } from './icons.js'

export default {
  name: 'DragHandle',
  emits: ['mousedown', 'touchstart'],
  setup() {
    return {
      ICONS
    }
  }
}
</script>

<style scoped>
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

.drag-handle:hover {
  background: rgba(255, 92, 0, 1);
  transform: scale(1.05);
}

.drag-handle:active {
  transform: scale(0.95);
}

.drag-handle :deep(svg) {
  display: block;
  stroke: white;
  fill: white;
}
</style>

