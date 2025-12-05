<template>
  <div class="canvas-controls">
    <button
      class="canvas-control-btn"
      @click="$emit('zoom-in')"
      title="放大 (Ctrl + Plus)"
    >
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="11" cy="11" r="8"/>
        <line x1="11" y1="8" x2="11" y2="14"/>
        <line x1="8" y1="11" x2="14" y2="11"/>
      </svg>
    </button>
    <button
      class="canvas-control-btn"
      @click="$emit('zoom-out')"
      title="缩小 (Ctrl + Minus)"
    >
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="11" cy="11" r="8"/>
        <line x1="8" y1="11" x2="14" y2="11"/>
      </svg>
    </button>
    <div class="canvas-zoom-display">
      {{ zoomPercentage }}%
    </div>
    <button
      class="canvas-control-btn"
      @click="$emit('reset')"
      title="重置视图 (Ctrl + 0)"
    >
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/>
        <path d="M21 3v5h-5"/>
        <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/>
        <path d="M3 21v-5h5"/>
      </svg>
    </button>
    <button
      class="canvas-control-btn"
      @click="$emit('auto-arrange')"
      title="自动排布"
    >
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <rect x="3" y="3" width="7" height="7"/>
        <rect x="14" y="3" width="7" height="7"/>
        <rect x="14" y="14" width="7" height="7"/>
        <rect x="3" y="14" width="7" height="7"/>
      </svg>
    </button>
  </div>
</template>

<script>
export default {
  name: 'CanvasControls',
  props: {
    zoomPercentage: {
      type: Number,
      required: true
    }
  },
  emits: ['zoom-in', 'zoom-out', 'reset', 'auto-arrange']
}
</script>

<style scoped>
/* 画布控制按钮 */
.canvas-controls {
  position: fixed;
  bottom: 100px;
  right: 30px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  z-index: 200;
  background: rgba(255, 255, 255, 0.95);
  padding: 12px;
  border-radius: 12px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
  backdrop-filter: blur(10px);
}

.canvas-control-btn {
  width: 40px;
  height: 40px;
  background: var(--primary-color);
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
  padding: 0;
}

.canvas-control-btn:hover {
  background: var(--primary-hover);
  transform: scale(1.05);
}

.canvas-control-btn:active {
  transform: scale(0.95);
}

.canvas-control-btn svg {
  display: block;
}

.canvas-zoom-display {
  text-align: center;
  font-size: 12px;
  font-weight: 600;
  color: #666;
  padding: 4px 0;
  min-width: 40px;
}
</style>

