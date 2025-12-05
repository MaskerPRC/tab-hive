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
    
    <!-- 绘制功能 -->
    <div class="drawing-divider"></div>
    <button
      class="canvas-control-btn"
      :class="{ 'active': isDrawingMode }"
      @click="$emit('toggle-drawing')"
      title="绘制模式"
    >
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M12 19l7-7 3 3-7 7-3-3z"/>
        <path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z"/>
        <path d="M2 2l7.586 7.586"/>
        <circle cx="11" cy="11" r="2"/>
      </svg>
    </button>
    
    <div v-if="isDrawingMode" class="drawing-controls">
      <label class="drawing-control-item">
        <span>颜色</span>
        <input type="color" :value="drawingColor" @input="$emit('update-color', $event.target.value)" />
      </label>
      <label class="drawing-control-item">
        <span>粗细</span>
        <input type="range" :value="drawingWidth" @input="$emit('update-width', $event.target.value)" min="1" max="20" />
      </label>
      <button
        class="canvas-control-btn btn-clear"
        @click="$emit('clear-drawings')"
        title="清除绘制"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="3 6 5 6 21 6"/>
          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
        </svg>
      </button>
    </div>
  </div>
</template>

<script>
export default {
  name: 'CanvasControls',
  props: {
    zoomPercentage: {
      type: Number,
      required: true
    },
    isDrawingMode: {
      type: Boolean,
      default: false
    },
    drawingColor: {
      type: String,
      default: '#FF5C00'
    },
    drawingWidth: {
      type: Number,
      default: 3
    }
  },
  emits: ['zoom-in', 'zoom-out', 'reset', 'auto-arrange', 'toggle-drawing', 'update-color', 'update-width', 'clear-drawings']
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

/* 绘制功能分隔线 */
.drawing-divider {
  height: 1px;
  background: rgba(0, 0, 0, 0.1);
  margin: 8px 0;
}

/* 绘制控制 */
.drawing-controls {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding-top: 8px;
  border-top: 1px solid rgba(0, 0, 0, 0.1);
  margin-top: 8px;
}

.drawing-control-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  font-size: 11px;
  color: #666;
}

.drawing-control-item span {
  font-weight: 500;
  min-width: 30px;
}

.drawing-control-item input[type="color"] {
  width: 32px;
  height: 32px;
  border: 1px solid #ddd;
  border-radius: 4px;
  cursor: pointer;
  padding: 0;
}

.drawing-control-item input[type="range"] {
  flex: 1;
  max-width: 80px;
}

.canvas-control-btn.active {
  background: var(--primary-hover);
  box-shadow: 0 2px 8px rgba(255, 92, 0, 0.3);
}

.canvas-control-btn.btn-clear {
  background: #ff4444;
}

.canvas-control-btn.btn-clear:hover {
  background: #cc0000;
}
</style>

