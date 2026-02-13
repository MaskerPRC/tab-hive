<template>
  <div class="resize-handles">
    <div 
      class="resize-handle resize-se" 
      @mousedown="$emit('resize-start', $event, 'se')"
    ></div>
    <div 
      class="resize-handle resize-e" 
      @mousedown="$emit('resize-start', $event, 'e')"
    ></div>
    <div 
      class="resize-handle resize-s" 
      @mousedown="$emit('resize-start', $event, 's')"
    ></div>
  </div>
</template>

<script>
export default {
  name: 'ResizeHandles',
  emits: ['resize-start']
}
</script>

<style scoped>
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
  zoom: var(--counter-zoom, 1);
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

