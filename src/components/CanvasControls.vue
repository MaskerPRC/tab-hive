<template>
  <div class="fab-container">
    <div class="fab-group">
      <!-- 添加窗口按钮（主要按钮） -->
      <button
        class="fab-btn fab-btn-primary"
        @click="$emit('add-website')"
        :title="$t('canvasControls.addWebsite') || '添加窗口'"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="12" y1="5" x2="12" y2="19"/>
          <line x1="5" y1="12" x2="19" y2="12"/>
        </svg>
      </button>
      
      <button
        class="fab-btn"
        @click="$emit('auto-arrange')"
        :title="$t('canvasControls.fitToScreen') || '适应屏幕'"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"/>
        </svg>
      </button>
      
      <button
        class="fab-btn"
        @click="$emit('rearrange')"
        :title="$t('canvasControls.rearrange') || '重新排列'"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <rect x="3" y="3" width="7" height="7"/>
          <rect x="14" y="3" width="7" height="7"/>
          <rect x="3" y="14" width="7" height="7"/>
          <rect x="14" y="14" width="7" height="7"/>
        </svg>
      </button>
      
      <button
        class="fab-btn"
        @click="$emit('zoom-in')"
        :title="$t('canvasControls.zoomIn') || '放大'"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="11" cy="11" r="8"/>
          <line x1="11" y1="8" x2="11" y2="14"/>
          <line x1="8" y1="11" x2="14" y2="11"/>
        </svg>
      </button>
      
      <button
        class="fab-btn"
        @click="$emit('zoom-out')"
        :title="$t('canvasControls.zoomOut') || '缩小'"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="11" cy="11" r="8"/>
          <line x1="8" y1="11" x2="14" y2="11"/>
        </svg>
      </button>
      
      <!-- 绘制功能按钮 -->
      <button
        class="fab-btn"
        :class="{ 'active': isDrawingMode }"
        @click="$emit('toggle-drawing')"
        :title="$t('canvasControls.drawingMode') || '绘制模式'"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M12 19l7-7 3 3-7 7-3-3z"/>
          <path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z"/>
          <path d="M2 2l7.586 7.586"/>
          <circle cx="11" cy="11" r="2"/>
        </svg>
      </button>
      
      <!-- 工具选择按钮（仅在绘制模式下显示） -->
      <button
        v-if="isDrawingMode"
        class="fab-btn"
        :class="{ 'active': drawingTool === 'pen' }"
        @click="$emit('set-tool', 'pen')"
        title="画笔工具"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M12 19l7-7 3 3-7 7-3-3z"/>
          <path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z"/>
        </svg>
      </button>
      
      <button
        v-if="isDrawingMode"
        class="fab-btn"
        :class="{ 'active': drawingTool === 'text' }"
        @click="$emit('set-tool', 'text')"
        title="文字工具"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="4 7 4 4 20 4 20 7"/>
          <line x1="9" y1="20" x2="15" y2="20"/>
          <line x1="12" y1="4" x2="12" y2="20"/>
        </svg>
      </button>
      
      <button
        v-if="isDrawingMode"
        class="fab-btn"
        :class="{ 'active': drawingTool === 'image' }"
        @click="$emit('set-tool', 'image')"
        title="图片工具"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
          <circle cx="8.5" cy="8.5" r="1.5"/>
          <polyline points="21 15 16 10 5 21"/>
        </svg>
      </button>
      
      <!-- 清除绘制按钮（仅在绘制模式下显示） -->
      <button
        v-if="isDrawingMode"
        class="fab-btn"
        @click="handleClearDrawings"
        :title="$t('canvasControls.clearDrawings') || '清除绘制'"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="3 6 5 6 21 6"/>
          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
        </svg>
      </button>
      
      <!-- 绘制设置按钮（仅在绘制模式下显示） -->
      <button
        v-if="isDrawingMode"
        class="fab-btn"
        :class="{ 'active': showSettings }"
        @click="showSettings = !showSettings"
        :title="$t('canvasControls.drawingSettings') || '绘制设置'"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="3"/>
          <path d="M12 1v6m0 6v6M5.64 5.64l4.24 4.24m4.24 4.24l4.24 4.24M1 12h6m6 0h6M5.64 18.36l4.24-4.24m4.24-4.24l4.24-4.24"/>
        </svg>
      </button>
      
      <!-- 缩放百分比按钮（点击重置为100%） -->
      <button
        class="fab-btn fab-btn-zoom"
        @click="handleResetZoom"
        :title="$t('canvasControls.resetZoom') || '重置缩放 (100%)'"
      >
        <span class="zoom-text">{{ zoomPercentage }}</span>
      </button>
    </div>
    
    <!-- 设置面板（展开时显示） -->
    <div v-if="showSettings" class="fab-settings-panel" @click.stop>
      <div class="settings-content">
        <div v-if="isDrawingMode" class="settings-item">
          <label class="settings-label">绘制颜色</label>
          <input 
            type="color" 
            :value="drawingColor" 
            @input="$emit('update-color', $event.target.value)"
            class="settings-color-input"
          />
        </div>
        
        <div v-if="isDrawingMode" class="settings-item">
          <label class="settings-label">绘制粗细</label>
          <input 
            type="range" 
            :value="drawingWidth" 
            @input="$emit('update-width', $event.target.value)" 
            min="1" 
            max="20"
            class="settings-range-input"
          />
          <span class="settings-value">{{ drawingWidth }}px</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref } from 'vue'

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
    drawingTool: {
      type: String,
      default: 'pen'
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
  emits: ['zoom-in', 'zoom-out', 'reset', 'auto-arrange', 'rearrange', 'toggle-drawing', 'set-tool', 'update-color', 'update-width', 'clear-drawings', 'add-website'],
  setup(props, { emit }) {
    const showSettings = ref(false)
    
    // 重置缩放为100%
    const handleResetZoom = () => {
      emit('reset')
    }
    
    // 清除绘制
    const handleClearDrawings = () => {
      emit('clear-drawings')
    }
    
    return {
      showSettings,
      handleResetZoom,
      handleClearDrawings
    }
  }
}
</script>

<style scoped>
/* FAB 容器 */
.fab-container {
  position: fixed;
  bottom: 2rem;
  right: 2rem;
  z-index: 200;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 1rem;
}

/* FAB 按钮组 */
.fab-group {
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(8px);
  border-radius: 9999px;
  padding: 0.375rem;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
  border: 1px solid rgba(226, 232, 240, 0.8);
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

/* FAB 按钮 */
.fab-btn {
  width: 2.5rem;
  height: 2.5rem;
  border-radius: 50%;
  border: none;
  background: white;
  color: #475569;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
  box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
  position: relative;
}

.fab-btn:hover {
  background: #fff7ed;
  color: #f97316;
  transform: scale(1.1);
}

.fab-btn.active {
  background: #fff7ed;
  color: #f97316;
}

/* 主要按钮（添加窗口） */
.fab-btn-primary {
  background: #f97316;
  color: white;
  box-shadow: 0 4px 6px -1px rgba(249, 115, 22, 0.2);
}

.fab-btn-primary:hover {
  background: #ea580c;
  color: white;
  box-shadow: 0 6px 8px -2px rgba(249, 115, 22, 0.3);
}

/* 缩放百分比按钮 */
.fab-btn-zoom {
  font-size: 0.75rem;
  font-weight: 600;
  color: #475569;
}

.fab-btn-zoom:hover {
  background: #fff7ed;
  color: #f97316;
}

.zoom-text {
  line-height: 1;
}

/* Tooltip */
.fab-btn {
  position: relative;
}

.fab-btn::before {
  content: attr(title);
  position: absolute;
  right: calc(100% + 0.5rem);
  top: 50%;
  transform: translateY(-50%);
  background: #1e293b;
  color: white;
  padding: 0.375rem 0.75rem;
  border-radius: 0.375rem;
  font-size: 0.75rem;
  white-space: nowrap;
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.2s;
  z-index: 1000;
}

.fab-btn:hover::before {
  opacity: 1;
}

/* 设置面板 */
.fab-settings-panel {
  background: white;
  border-radius: 0.75rem;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
  border: 1px solid #e2e8f0;
  padding: 1rem;
  min-width: 12rem;
  animation: slide-up 0.2s ease-out;
}

@keyframes slide-up {
  from {
    opacity: 0;
    transform: translateY(0.5rem);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.settings-content {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.settings-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
}

.settings-label {
  font-size: 0.875rem;
  color: #475569;
  font-weight: 500;
}

.settings-value {
  font-size: 0.875rem;
  color: #64748b;
  font-weight: 600;
}

.settings-color-input {
  width: 2rem;
  height: 2rem;
  border: 1px solid #e2e8f0;
  border-radius: 0.375rem;
  cursor: pointer;
  padding: 0;
}

.settings-range-input {
  flex: 1;
  max-width: 6rem;
}

.settings-btn-clear {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.5rem;
  background: #fef2f2;
  color: #dc2626;
  border: 1px solid #fecaca;
  border-radius: 0.5rem;
  cursor: pointer;
  font-size: 0.875rem;
  font-weight: 500;
  transition: all 0.2s;
  margin-top: 0.25rem;
}

.settings-btn-clear:hover {
  background: #fee2e2;
  border-color: #fca5a5;
}
</style>

