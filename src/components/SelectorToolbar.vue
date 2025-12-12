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
      :title="$t('selectorToolbar.dragHandle')"
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

    <!-- 1. 头部标题栏 -->
    <div class="toolbar-header">
      <div class="toolbar-title">
        <div class="title-icon">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M3 3l7.07 16.97 2.51-7.39 7.39-2.51L3 3z"/>
            <path d="M13 13l6 6"/>
          </svg>
        </div>
        <h3>{{ $t('selectorToolbar.elementCapture') }}</h3>
      </div>
      <div class="toolbar-actions">
        <button 
          class="toolbar-btn"
          @click="showSettings = !showSettings"
          :title="$t('selectorToolbar.settings')"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="3"/>
            <path d="M12 1v6m0 6v6M5.64 5.64l4.24 4.24m4.24 4.24l4.24 4.24M1 12h6m6 0h6M5.64 18.36l4.24-4.24m4.24-4.24l4.24-4.24"/>
          </svg>
        </button>
        <button 
          class="toolbar-btn toolbar-btn-close"
          @click="$emit('cancel')" 
          :title="$t('selectorToolbar.cancel')"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="18" y1="6" x2="6" y2="18"/>
            <line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
      </div>
    </div>

    <!-- 2. 核心控制区 -->
    <div class="toolbar-content">
      <!-- 多选模式开关 -->
      <div 
        class="multi-select-toggle"
        @click="toggleMultiSelect"
      >
        <div class="toggle-left">
          <svg 
            width="16" 
            height="16" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            stroke-width="2"
            :class="{ 'toggle-icon-active': multiSelectMode }"
          >
            <path d="M12 2L2 7l10 5 10-5-10-5z"/>
            <path d="M2 17l10 5 10-5M2 12l10 5 10-5"/>
          </svg>
          <span class="toggle-label">{{ $t('selectorToolbar.multiSelectMode') }}</span>
        </div>
        <!-- Toggle Switch -->
        <div 
          class="toggle-switch"
          :class="{ 'toggle-switch-active': multiSelectMode }"
        >
          <div class="toggle-switch-thumb"></div>
        </div>
      </div>

      <!-- 选择器显示与层级导航 -->
      <div class="selector-section">
        <div class="selector-header">
          <span class="selector-label">{{ $t('selectorToolbar.currentPath') }}</span>
          <span v-if="elementDepth > 0" class="selector-depth">Depth: {{ elementDepth }}</span>
        </div>
        
        <!-- CSS Selector Input Area -->
        <div class="selector-input-wrapper">
          <input 
            v-model="localSelector"
            type="text" 
            class="selector-input"
            :placeholder="$t('selectorToolbar.placeholder')"
            @input="$emit('update:selector', localSelector)"
            @focus="$emit('pause', true)"
            @blur="$emit('pause', false)"
          />
          <button 
            v-if="localSelector"
            class="copy-btn"
            @click="copySelector"
            :title="$t('selectorToolbar.copySelector')"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
            </svg>
          </button>
        </div>

        <!-- DOM Navigation (父/子元素切换) -->
        <div v-if="localSelector" class="dom-navigation">
          <button 
            class="nav-btn nav-btn-parent"
            @click="$emit('navigate', 'parent')"
            :title="$t('selectorToolbar.selectParent')"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="18 15 12 9 6 15"/>
            </svg>
            <span>{{ $t('selectorToolbar.parentElement') }}</span>
          </button>
          <button 
            class="nav-btn nav-btn-child"
            @click="$emit('navigate', 'child')"
            :title="$t('selectorToolbar.selectChild')"
          >
            <span>{{ $t('selectorToolbar.childElement') }}</span>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="6 9 12 15 18 9"/>
            </svg>
          </button>
        </div>
      </div>

      <!-- 多选模式：选择器列表 -->
      <div v-if="multiSelectMode" class="selectors-list-wrapper">
        <label class="input-label">{{ $t('selectorToolbar.selectedElements') }} ({{ localSelectors.length }})</label>
        <div class="selectors-list">
          <div 
            v-for="(sel, index) in localSelectors" 
            :key="index"
            class="selector-list-item"
          >
            <span class="selector-index">{{ index + 1 }}</span>
            <span class="selector-value">{{ sel }}</span>
            <button
              class="remove-selector-btn"
              @click="removeSelector(index)"
              :title="$t('common.remove')"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="18" y1="6" x2="6" y2="18"/>
                <line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>
        </div>
        <div v-if="localSelector && !localSelectors.includes(localSelector)" class="current-selection">
          <button class="add-selector-btn" @click="addCurrentSelector">
            ➕ {{ $t('selectorToolbar.addToList') }}
          </button>
        </div>
      </div>

      <!-- 选择器设置面板 -->
      <div v-if="showSettings && localSelector" class="settings-panel">
        <h4 class="settings-title">{{ $t('selectorToolbar.selectorRules') }}</h4>
        <div class="settings-options">
          <label class="setting-option">
            <input v-model="settings.includeId" type="checkbox" />
            <span>{{ $t('selectorToolbar.includeId') }}</span>
          </label>
          <label class="setting-option">
            <input v-model="settings.includeClass" type="checkbox" />
            <span>{{ $t('selectorToolbar.includeClass') }}</span>
          </label>
          <label class="setting-option">
            <input v-model="settings.includeTag" type="checkbox" />
            <span>{{ $t('selectorToolbar.includeTag') }}</span>
          </label>
          <label class="setting-option">
            <input v-model="settings.includeAttributes" type="checkbox" />
            <span>{{ $t('selectorToolbar.includeAttributes') }}</span>
          </label>
        </div>
      </div>

      <!-- 详细信息面板 -->
      <div v-if="elementInfo" class="element-info">
        <!-- Tag -->
        <div class="info-item">
          <div class="info-icon info-icon-tag">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M4 7V4h16v3M9 20h6M12 4v16"/>
            </svg>
          </div>
          <div class="info-content">
            <div class="info-label">{{ $t('selectorToolbar.tagName') }}</div>
            <div class="info-value info-value-tag">
              &lt;{{ elementInfo.tagName || elementInfo.tag }}&gt;
            </div>
          </div>
        </div>

        <!-- Class -->
        <div v-if="elementInfo.className || elementInfo.class" class="info-item">
          <div class="info-icon info-icon-class">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="4" y1="9" x2="20" y2="9"/>
              <line x1="4" y1="15" x2="20" y2="15"/>
              <line x1="10" y1="3" x2="8" y2="21"/>
              <line x1="16" y1="3" x2="14" y2="21"/>
            </svg>
          </div>
          <div class="info-content">
            <div class="info-label">{{ $t('selectorToolbar.classList') }}</div>
            <p class="info-value info-value-class">
              {{ elementInfo.className || elementInfo.class }}
            </p>
          </div>
        </div>

        <!-- Size -->
        <div class="info-item">
          <div class="info-icon info-icon-size">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
              <line x1="9" y1="3" x2="9" y2="21"/>
              <line x1="3" y1="9" x2="21" y2="9"/>
            </svg>
          </div>
          <div class="info-content">
            <div class="info-label">{{ $t('selectorToolbar.dimensions') }}</div>
            <div class="info-value info-value-size">
              <span>{{ elementInfo.width || 0 }} px</span>
              <span class="separator">×</span>
              <span>{{ elementInfo.height || 0 }} px</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 3. 底部操作栏 -->
    <div class="toolbar-footer">
      <button
        v-if="localSelector || (multiSelectMode && localSelectors.length > 0)"
        class="btn-confirm"
        @click="$emit('confirm')"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="20 6 9 17 4 12"/>
        </svg>
        <span>{{ $t('selectorToolbar.confirmSelection') }}</span>
      </button>
      
      <div class="footer-actions">
        <button 
          class="footer-btn"
          @click="$emit('reselect')"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="23 4 23 10 17 10"/>
            <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
          </svg>
          {{ $t('selectorToolbar.reselectShort') }}
        </button>
        <span class="footer-separator">|</span>
        <p class="footer-hint">
          {{ $t('selectorToolbar.shiftLockHint') }}
        </p>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, watch, onMounted, onUnmounted, reactive, computed } from 'vue'
import { useI18n } from 'vue-i18n'

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
    selectors: {
      type: Array,
      default: () => []
    },
    elementInfo: {
      type: Object,
      default: null
    },
    multiSelectMode: {
      type: Boolean,
      default: false
    }
  },
  emits: ['cancel', 'confirm', 'update:selector', 'update:selectors', 'navigate', 'pause', 'reselect', 'toggle-multi-select'],
  setup(props, { emit }) {
    const { t } = useI18n()
    const localSelector = ref(props.selector)
    const localSelectors = ref(props.selectors || [])
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

    // 计算元素深度（从选择器路径估算）
    const elementDepth = computed(() => {
      if (!localSelector.value) return 0
      // 简单估算：通过选择器中的 > 和空格数量
      const depth = (localSelector.value.match(/>/g) || []).length + 
                    (localSelector.value.match(/\s+/g) || []).length
      return depth
    })

    watch(() => props.selector, (newVal) => {
      localSelector.value = newVal
    })
    
    watch(() => props.selectors, (newVal) => {
      localSelectors.value = newVal || []
    }, { deep: true })

    const toggleMultiSelect = () => {
      emit('toggle-multi-select', !props.multiSelectMode)
    }

    const copySelector = async () => {
      if (!localSelector.value) return
      try {
        await navigator.clipboard.writeText(localSelector.value)
        // 可以添加一个提示
        console.log('选择器已复制到剪贴板')
      } catch (err) {
        console.error('复制失败:', err)
      }
    }
    
    // 添加当前选择器到列表
    const addCurrentSelector = () => {
      if (localSelector.value && !localSelectors.value.includes(localSelector.value)) {
        localSelectors.value.push(localSelector.value)
        emit('update:selectors', [...localSelectors.value])
        localSelector.value = '' // 清空当前选择器，准备选择下一个
        emit('update:selector', '')
        
        // 添加到列表后，重新启动选择，进入hover状态
        console.log('[SelectorToolbar] 添加到列表后，触发重新选择')
        emit('reselect')
      }
    }
    
    // 移除选择器
    const removeSelector = (index) => {
      localSelectors.value.splice(index, 1)
      emit('update:selectors', [...localSelectors.value])
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
      localSelectors,
      showSettings,
      position,
      settings,
      elementDepth,
      toggleMultiSelect,
      copySelector,
      addCurrentSelector,
      removeSelector,
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
  border-radius: 16px;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
  border: 1px solid #e2e8f0;
  z-index: 10002;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', sans-serif;
  user-select: none;
  overflow: hidden;
  animation: fadeInZoom 0.3s ease-out;
}

@keyframes fadeInZoom {
  from {
    opacity: 0;
    transform: scale(0.95);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
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
  color: #64748b;
}

.selector-toolbar:hover .drag-handle {
  opacity: 1;
}

.drag-handle:hover {
  background: #f8fafc;
}

/* 1. 头部标题栏 */
.toolbar-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid #f1f5f9;
  background: white;
}

.toolbar-title {
  display: flex;
  align-items: center;
  gap: 10px;
}

.title-icon {
  padding: 6px;
  background: #fff7ed;
  color: #ea580c;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.toolbar-title h3 {
  font-size: 16px;
  font-weight: 700;
  color: #1e293b;
  margin: 0;
}

.toolbar-actions {
  display: flex;
  align-items: center;
  gap: 4px;
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
  color: #64748b;
  transition: all 0.2s;
}

.toolbar-btn:hover {
  background: #f1f5f9;
  color: #334155;
}

.toolbar-btn-close:hover {
  background: #fef2f2;
  color: #ef4444;
}

/* 2. 核心控制区 */
.toolbar-content {
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

/* 多选模式开关 */
.multi-select-toggle {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px;
  background: #f8fafc;
  border-radius: 8px;
  border: 1px solid #f1f5f9;
  cursor: pointer;
  transition: all 0.2s;
}

.multi-select-toggle:hover {
  border-color: #fed7aa;
}

.toggle-left {
  display: flex;
  align-items: center;
  gap: 8px;
}

.toggle-icon-active {
  color: #ea580c;
}

.toggle-label {
  font-size: 14px;
  font-weight: 500;
  color: #475569;
}

.toggle-switch {
  width: 36px;
  height: 20px;
  border-radius: 9999px;
  background: #cbd5e1;
  position: relative;
  transition: background-color 0.2s;
}

.toggle-switch-active {
  background: #ea580c;
}

.toggle-switch-thumb {
  position: absolute;
  top: 2px;
  left: 2px;
  width: 16px;
  height: 16px;
  background: white;
  border-radius: 9999px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
  transition: transform 0.2s;
}

.toggle-switch-active .toggle-switch-thumb {
  transform: translateX(16px);
}

/* 选择器区域 */
.selector-section {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.selector-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 11px;
  font-weight: 600;
  color: #94a3b8;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.selector-depth {
  font-size: 10px;
  background: #f1f5f9;
  padding: 2px 6px;
  border-radius: 4px;
  color: #64748b;
}

.selector-input-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}

.selector-input {
  width: 100%;
  padding: 10px 36px 10px 12px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  font-size: 12px;
  font-family: 'Monaco', 'Menlo', 'Consolas', monospace;
  color: #475569;
  transition: all 0.2s;
  text-overflow: ellipsis;
  overflow: hidden;
  white-space: nowrap;
}

.selector-input:focus {
  outline: none;
  border-color: #ea580c;
  background: white;
  box-shadow: 0 0 0 3px rgba(234, 88, 12, 0.1);
}

.copy-btn {
  position: absolute;
  right: 8px;
  top: 50%;
  transform: translateY(-50%);
  padding: 4px;
  border: none;
  background: transparent;
  color: #94a3b8;
  cursor: pointer;
  border-radius: 4px;
  opacity: 0;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
}

.selector-input-wrapper:hover .copy-btn {
  opacity: 1;
}

.copy-btn:hover {
  color: #ea580c;
  background: #fff7ed;
}

/* DOM 导航 */
.dom-navigation {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
  margin-top: 8px;
}

.nav-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 8px 12px;
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  font-size: 14px;
  color: #475569;
  cursor: pointer;
  transition: all 0.2s;
  font-weight: 500;
}

.nav-btn:hover {
  border-color: #fed7aa;
  background: #fff7ed;
  color: #ea580c;
}

.nav-btn:active {
  transform: scale(0.98);
}

.nav-btn svg {
  color: #94a3b8;
  transition: color 0.2s;
}

.nav-btn:hover svg {
  color: #ea580c;
}

/* 选择器列表 */
.selectors-list-wrapper {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.input-label {
  font-size: 12px;
  font-weight: 500;
  color: #64748b;
}

.selectors-list {
  max-height: 200px;
  overflow-y: auto;
  background: #f8fafc;
  border: 1.5px solid #e2e8f0;
  border-radius: 8px;
  padding: 8px;
}

.selector-list-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px;
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  margin-bottom: 6px;
  font-size: 12px;
  transition: all 0.2s;
}

.selector-list-item:last-child {
  margin-bottom: 0;
}

.selector-list-item:hover {
  border-color: #ea580c;
  background: #fff7ed;
}

.selector-index {
  flex: 0 0 24px;
  width: 24px;
  height: 24px;
  background: #ea580c;
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 11px;
}

.selector-value {
  flex: 1;
  color: #1e293b;
  font-family: 'Monaco', 'Menlo', 'Consolas', monospace;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.remove-selector-btn {
  flex: 0 0 20px;
  width: 20px;
  height: 20px;
  border: none;
  background: transparent;
  color: #ef4444;
  cursor: pointer;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.remove-selector-btn:hover {
  background: #fee2e2;
  color: #dc2626;
}

.current-selection {
  margin-top: 8px;
}

.add-selector-btn {
  width: 100%;
  padding: 10px 16px;
  background: linear-gradient(135deg, #ea580c 0%, #f97316 100%);
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  transition: all 0.2s;
  box-shadow: 0 2px 8px rgba(234, 88, 12, 0.2);
}

.add-selector-btn:hover {
  background: linear-gradient(135deg, #c2410c 0%, #ea580c 100%);
  box-shadow: 0 4px 12px rgba(234, 88, 12, 0.3);
  transform: translateY(-1px);
}

.add-selector-btn:active {
  transform: translateY(0);
}

/* 设置面板 */
.settings-panel {
  padding: 12px;
  background: #f8fafc;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
}

.settings-title {
  font-size: 12px;
  font-weight: 600;
  color: #475569;
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
  color: #64748b;
  cursor: pointer;
}

.setting-option input[type="checkbox"] {
  width: 16px;
  height: 16px;
  cursor: pointer;
  accent-color: #ea580c;
}

/* 详细信息面板 */
.element-info {
  background: #f8fafc;
  border-radius: 12px;
  padding: 12px;
  border: 1px solid #f1f5f9;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.info-item {
  display: flex;
  gap: 12px;
}

.info-icon {
  width: 20px;
  height: 20px;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  margin-top: 2px;
}

.info-icon-tag {
  background: #dbeafe;
  color: #2563eb;
}

.info-icon-class {
  background: #f3e8ff;
  color: #9333ea;
}

.info-icon-size {
  background: #d1fae5;
  color: #059669;
}

.info-content {
  flex: 1;
  overflow: hidden;
  min-width: 0;
}

.info-label {
  font-size: 10px;
  color: #94a3b8;
  font-weight: 700;
  text-transform: uppercase;
  margin-bottom: 4px;
}

.info-value {
  font-size: 12px;
  color: #475569;
  word-break: break-word;
}

.info-value-tag {
  font-family: 'Monaco', 'Menlo', 'Consolas', monospace;
  background: white;
  padding: 2px 6px;
  border-radius: 4px;
  border: 1px solid #e2e8f0;
  display: inline-block;
}

.info-value-class {
  font-family: 'Monaco', 'Menlo', 'Consolas', monospace;
  font-size: 11px;
  color: #64748b;
  line-height: 1.5;
  user-select: all;
}

.info-value-size {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 500;
  color: #1e293b;
}

.separator {
  color: #cbd5e1;
}

/* 3. 底部操作栏 */
.toolbar-footer {
  padding: 20px;
  padding-top: 0;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.btn-confirm {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  background: #ea580c;
  color: white;
  padding: 12px 20px;
  border: none;
  border-radius: 12px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  box-shadow: 0 4px 14px rgba(234, 88, 12, 0.2);
}

.btn-confirm:hover {
  background: #c2410c;
  box-shadow: 0 6px 20px rgba(234, 88, 12, 0.3);
}

.btn-confirm:active {
  transform: scale(0.98);
}

.footer-actions {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px;
}

.footer-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: #94a3b8;
  background: transparent;
  border: none;
  cursor: pointer;
  transition: color 0.2s;
  padding: 4px;
}

.footer-btn:hover {
  color: #ea580c;
}

.footer-separator {
  color: #cbd5e1;
}

.footer-hint {
  font-size: 10px;
  color: #94a3b8;
  margin: 0;
}

.footer-hint kbd {
  font-family: inherit;
  background: #f1f5f9;
  padding: 2px 6px;
  border-radius: 4px;
  border: 1px solid #e2e8f0;
  font-size: 10px;
  font-weight: 600;
  color: #64748b;
}
</style>
