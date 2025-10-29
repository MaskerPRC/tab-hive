<template>
  <!-- 选择器工具栏 - 可拖动的浮动面板 -->
  <div
    v-if="isActive"
    class="selector-toolbar"
    :style="{
      transform: `translate(${position.x}px, ${position.y}px)`,
      width: '380px'
    }"
    @mousedown.stop
  >
    <!-- 拖动手柄 -->
    <div
      class="drag-handle"
      @mousedown="startDrag"
      title="拖动移动面板"
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

    <!-- 工具栏头部 -->
    <div class="toolbar-header">
      <div class="toolbar-title">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M9 3L5 7l4 4M15 3l4 4-4 4M12 3v18"/>
        </svg>
        <span>元素选择器</span>
      </div>
      <div class="toolbar-actions">
        <button 
          class="toolbar-btn"
          @click="toggleVisibility"
          :title="isHidden ? '显示高亮' : '隐藏高亮'"
        >
          <svg v-if="isHidden" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
            <line x1="1" y1="1" x2="23" y2="23"/>
          </svg>
          <svg v-else width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
            <circle cx="12" cy="12" r="3"/>
          </svg>
        </button>
        <button 
          v-if="selector"
          class="toolbar-btn toolbar-btn-confirm"
          @click="$emit('confirm')"
          title="确认选择"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
        </button>
        <button class="toolbar-btn" @click="$emit('cancel')" title="取消选择">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="18" y1="6" x2="6" y2="18"/>
            <line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
      </div>
    </div>

    <!-- 选择器显示和控制 -->
    <div class="toolbar-content">
      <!-- 选择器输入框 -->
      <div class="selector-input-wrapper">
        <label class="input-label">CSS 选择器</label>
        <div class="selector-input-group">
          <input
            v-model="localSelector"
            type="text"
            class="selector-input"
            placeholder="点击页面元素选择..."
            @input="$emit('update:selector', localSelector)"
            @focus="$emit('pause', true)"
            @blur="$emit('pause', false)"
          />
          <button
            v-if="localSelector"
            class="clear-btn"
            @click="clearSelector"
            title="清除选择器"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>
      </div>

      <!-- 元素导航 -->
      <div v-if="localSelector" class="element-navigation">
        <button class="nav-btn" @click="$emit('navigate', 'parent')" title="选择父元素">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="18 15 12 9 6 15"/>
          </svg>
          父元素
        </button>
        <button class="nav-btn" @click="$emit('navigate', 'child')" title="选择子元素">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="6 9 12 15 18 9"/>
          </svg>
          子元素
        </button>
        <button 
          class="nav-btn nav-btn-reselect" 
          @click="$emit('reselect')"
          title="重新选择元素"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="23 4 23 10 17 10"/>
            <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
          </svg>
          重选
        </button>
        <button 
          class="nav-btn settings-btn" 
          @click="showSettings = !showSettings"
          :class="{ active: showSettings }"
          title="选择器设置"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="3"/>
            <path d="M12 1v6m0 6v6M5.64 5.64l4.24 4.24m4.24 4.24l4.24 4.24M1 12h6m6 0h6M5.64 18.36l4.24-4.24m4.24-4.24l4.24-4.24"/>
          </svg>
          设置
        </button>
      </div>

      <!-- 选择器设置面板 -->
      <div v-if="showSettings && localSelector" class="settings-panel">
        <h4 class="settings-title">选择器生成规则</h4>
        <div class="settings-options">
          <label class="setting-option">
            <input v-model="settings.includeId" type="checkbox" />
            <span>包含元素 ID</span>
          </label>
          <label class="setting-option">
            <input v-model="settings.includeClass" type="checkbox" />
            <span>包含 Class</span>
          </label>
          <label class="setting-option">
            <input v-model="settings.includeTag" type="checkbox" />
            <span>包含标签名</span>
          </label>
          <label class="setting-option">
            <input v-model="settings.includeAttributes" type="checkbox" />
            <span>包含属性</span>
          </label>
        </div>
      </div>

      <!-- 元素信息 -->
      <div v-if="elementInfo" class="element-info">
        <div class="info-row">
          <span class="info-label">标签:</span>
          <span class="info-value">{{ elementInfo.tagName }}</span>
        </div>
        <div v-if="elementInfo.id" class="info-row">
          <span class="info-label">ID:</span>
          <span class="info-value">{{ elementInfo.id }}</span>
        </div>
        <div v-if="elementInfo.className" class="info-row">
          <span class="info-label">Class:</span>
          <span class="info-value">{{ elementInfo.className }}</span>
        </div>
        <div class="info-row">
          <span class="info-label">尺寸:</span>
          <span class="info-value">{{ elementInfo.width }} × {{ elementInfo.height }}</span>
        </div>
      </div>

      <!-- 确认按钮 -->
      <button
        v-if="localSelector"
        class="btn-confirm"
        @click="$emit('confirm')"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="20 6 9 17 4 12"/>
        </svg>
        确认选择
      </button>

      <!-- 提示信息 -->
      <div class="toolbar-hint">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="10"/>
          <line x1="12" y1="16" x2="12" y2="12"/>
          <line x1="12" y1="8" x2="12.01" y2="8"/>
        </svg>
        <template v-if="!localSelector">
          点击元素选择 | 按 <kbd>空格</kbd> 选择 | 按 <kbd>ESC</kbd> 取消
        </template>
        <template v-else>
          可继续调整选择 | 点击 <strong>确认选择</strong> 保存 | 按 <kbd>ESC</kbd> 取消
        </template>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, watch, onMounted, onUnmounted, reactive } from 'vue'

export default {
  name: 'SelectorToolbar',
  props: {
    isActive: {
      type: Boolean,
      default: false
    },
    selector: {
      type: String,
      default: ''
    },
    elementInfo: {
      type: Object,
      default: null
    }
  },
  emits: ['cancel', 'confirm', 'update:selector', 'navigate', 'pause', 'reselect'],
  setup(props, { emit }) {
    const localSelector = ref(props.selector)
    const isHidden = ref(false)
    const showSettings = ref(false)
    const isDragging = ref(false)
    const position = reactive({
      x: 0,
      y: 20
    })
    const dragStart = reactive({
      x: 0,
      y: 0,
      posX: 0,
      posY: 0
    })

    const settings = reactive({
      includeId: true,
      includeClass: true,
      includeTag: true,
      includeAttributes: false
    })

    watch(() => props.selector, (newVal) => {
      localSelector.value = newVal
    })

    const clearSelector = () => {
      localSelector.value = ''
      emit('update:selector', '')
    }

    const toggleVisibility = () => {
      isHidden.value = !isHidden.value
      // TODO: 发送事件到高亮组件
    }

    const startDrag = (event) => {
      isDragging.value = true
      dragStart.x = event.clientX
      dragStart.y = event.clientY
      dragStart.posX = position.x
      dragStart.posY = position.y
      
      document.addEventListener('mousemove', onDrag)
      document.addEventListener('mouseup', stopDrag)
    }

    const onDrag = (event) => {
      if (!isDragging.value) return
      
      const deltaX = event.clientX - dragStart.x
      const deltaY = event.clientY - dragStart.y
      
      position.x = dragStart.posX + deltaX
      position.y = dragStart.posY + deltaY
      
      // 限制在视口内
      const maxX = window.innerWidth - 380 - 20
      const maxY = window.innerHeight - 200
      
      position.x = Math.max(20, Math.min(position.x, maxX))
      position.y = Math.max(20, Math.min(position.y, maxY))
    }

    const stopDrag = () => {
      isDragging.value = false
      document.removeEventListener('mousemove', onDrag)
      document.removeEventListener('mouseup', stopDrag)
    }

    onMounted(() => {
      // 初始位置：右上角
      position.x = window.innerWidth - 380 - 40
      position.y = 20
    })

    onUnmounted(() => {
      if (isDragging.value) {
        stopDrag()
      }
    })

    return {
      localSelector,
      isHidden,
      showSettings,
      position,
      settings,
      clearSelector,
      toggleVisibility,
      startDrag
    }
  }
}
</script>

<style scoped>
.selector-toolbar {
  position: fixed;
  top: 0;
  left: 0;
  background: white;
  border-radius: 12px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2), 0 0 0 1px rgba(0, 0, 0, 0.05);
  z-index: 10002;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  user-select: none;
  backdrop-filter: blur(10px);
}

.drag-handle {
  position: absolute;
  top: -12px;
  left: -12px;
  width: 32px;
  height: 32px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: move;
  opacity: 0;
  transition: opacity 0.2s;
  color: #666;
}

.selector-toolbar:hover .drag-handle {
  opacity: 1;
}

.drag-handle:hover {
  background: #f9f9f9;
}

.toolbar-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid #e5e7eb;
}

.toolbar-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
  font-size: 15px;
  color: #111827;
}

.toolbar-title svg {
  color: #ff5c00;
}

.toolbar-actions {
  display: flex;
  gap: 6px;
}

.toolbar-btn {
  width: 32px;
  height: 32px;
  border: none;
  background: transparent;
  border-radius: 6px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #6b7280;
  transition: all 0.2s;
}

.toolbar-btn:hover {
  background: #f3f4f6;
  color: #111827;
}

.toolbar-btn-confirm {
  background: #10b981;
  color: white;
}

.toolbar-btn-confirm:hover {
  background: #059669;
  color: white;
}

.toolbar-content {
  padding: 16px 20px;
}

.selector-input-wrapper {
  margin-bottom: 12px;
}

.input-label {
  display: block;
  font-size: 12px;
  font-weight: 500;
  color: #6b7280;
  margin-bottom: 6px;
}

.selector-input-group {
  position: relative;
}

.selector-input {
  width: 100%;
  padding: 10px 36px 10px 12px;
  border: 1.5px solid #e5e7eb;
  border-radius: 8px;
  font-size: 13px;
  font-family: 'Monaco', 'Menlo', monospace;
  color: #111827;
  background: #f9fafb;
  transition: all 0.2s;
}

.selector-input:focus {
  outline: none;
  border-color: #ff5c00;
  background: white;
  box-shadow: 0 0 0 3px rgba(255, 92, 0, 0.1);
}

.clear-btn {
  position: absolute;
  right: 8px;
  top: 50%;
  transform: translateY(-50%);
  width: 24px;
  height: 24px;
  border: none;
  background: transparent;
  border-radius: 4px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #9ca3af;
  transition: all 0.2s;
}

.clear-btn:hover {
  background: #e5e7eb;
  color: #111827;
}

.element-navigation {
  display: flex;
  gap: 8px;
  margin-bottom: 12px;
}

.nav-btn {
  flex: 1;
  padding: 8px 12px;
  border: 1.5px solid #e5e7eb;
  background: white;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 500;
  color: #374151;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  transition: all 0.2s;
}

.nav-btn:hover {
  border-color: #ff5c00;
  color: #ff5c00;
  background: #fff7ed;
}

.settings-btn.active {
  border-color: #ff5c00;
  color: #ff5c00;
  background: #fff7ed;
}

.nav-btn-reselect {
  border-color: #3b82f6;
  color: #3b82f6;
}

.nav-btn-reselect:hover {
  border-color: #3b82f6;
  color: white;
  background: #3b82f6;
}

.settings-panel {
  margin-bottom: 12px;
  padding: 12px;
  background: #f9fafb;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
}

.settings-title {
  font-size: 12px;
  font-weight: 600;
  color: #374151;
  margin: 0 0 10px 0;
}

.settings-options {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.setting-option {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  color: #4b5563;
  cursor: pointer;
}

.setting-option input[type="checkbox"] {
  width: 16px;
  height: 16px;
  cursor: pointer;
  accent-color: #ff5c00;
}

.element-info {
  margin-bottom: 12px;
  padding: 12px;
  background: #f0f9ff;
  border-radius: 8px;
  border: 1px solid #bfdbfe;
}

.info-row {
  display: flex;
  justify-content: space-between;
  margin-bottom: 6px;
  font-size: 12px;
}

.info-row:last-child {
  margin-bottom: 0;
}

.info-label {
  font-weight: 500;
  color: #1e40af;
}

.info-value {
  color: #1e3a8a;
  font-family: 'Monaco', 'Menlo', monospace;
  word-break: break-all;
}

.toolbar-hint {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 11px;
  color: #6b7280;
  padding: 10px 12px;
  background: #f9fafb;
  border-radius: 6px;
}

.toolbar-hint svg {
  flex-shrink: 0;
}

.toolbar-hint kbd {
  padding: 2px 6px;
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 4px;
  font-family: inherit;
  font-size: 10px;
  font-weight: 600;
  color: #374151;
}

.toolbar-hint strong {
  color: #10b981;
  font-weight: 600;
}

.btn-confirm {
  width: 100%;
  padding: 12px 20px;
  margin-bottom: 12px;
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  transition: all 0.2s;
  box-shadow: 0 2px 8px rgba(16, 185, 129, 0.2);
}

.btn-confirm:hover {
  background: linear-gradient(135deg, #059669 0%, #047857 100%);
  box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
  transform: translateY(-1px);
}

.btn-confirm:active {
  transform: translateY(0);
}
</style>

