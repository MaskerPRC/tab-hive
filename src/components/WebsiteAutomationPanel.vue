<template>
  <div
    class="automation-panel-overlay"
    :class="{
      'dark-mode': darkMode,
      'selecting-element': isSelectingElement
    }"
  >
    <div class="automation-panel" :class="{ 'dark-mode': darkMode }">
      <!-- 头部信息 -->
      <div class="panel-header">
        <div class="website-info">
          <span class="website-icon">🌐</span>
          <div class="website-name">{{ websiteName }}</div>
        </div>
        <button
          @click="$emit('start-select-element')"
          class="btn-select-element"
          title="选择网页元素"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M3 3l7.07 16.97 2.51-7.39 7.39-2.51L3 3z"/>
            <path d="M13 13l6 6"/>
          </svg>
          选择元素
        </button>
      </div>

      <!-- 数据映射区域 -->
      <div class="mapping-section">
        <div class="section-header">
          <h4>📤 数据映射</h4>
          <button @click="addDataMapping" class="btn-add" title="添加数据映射">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="12" y1="5" x2="12" y2="19"/>
              <line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
          </button>
        </div>

        <div class="mapping-list">
          <div
            v-for="(mapping, index) in dataMappings"
            :key="mapping.id || `data-mapping-${index}`"
            class="mapping-item"
          >
            <div class="mapping-content">
              <span class="mapping-icon">📝</span>
              <div class="mapping-info">
                <div class="mapping-name">{{ mapping.name }}</div>
                <div class="mapping-selector">{{ mapping.selector || '未设置选择器' }}</div>
              </div>
            </div>
            <div class="mapping-actions">
              <button @click="editDataMapping(mapping)" class="btn-icon" title="编辑">
                ✏️
              </button>
              <button @click="deleteDataMapping(mapping.id)" class="btn-icon" title="删除">
                🗑️
              </button>
            </div>
            <!-- 数据映射端点 -->
            <div
              class="port port-output"
              :data-port-id="mapping.portId"
              :data-port-type="'data'"
              @mousedown="$emit('port-mousedown', $event, websiteId, mapping.portId, 'data-output')"
            ></div>
          </div>

          <div v-if="dataMappings.length === 0" class="empty-hint">
            暂无数据映射，点击 + 添加
          </div>
        </div>
      </div>

      <!-- 交互映射区域 -->
      <div class="mapping-section">
        <div class="section-header">
          <h4>⚡ 交互映射</h4>
          <button @click="addActionMapping" class="btn-add" title="添加交互映射">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="12" y1="5" x2="12" y2="19"/>
              <line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
          </button>
        </div>

        <div class="mapping-list">
          <div
            v-for="(mapping, index) in actionMappings"
            :key="mapping.id || `action-mapping-${index}`"
            class="mapping-item"
          >
            <div class="mapping-content">
              <span class="mapping-icon">{{ getActionIcon(mapping.type) }}</span>
              <div class="mapping-info">
                <div class="mapping-name">{{ mapping.name }}</div>
                <div class="mapping-selector">{{ mapping.selector || '未设置选择器' }}</div>
              </div>
            </div>
            <div class="mapping-actions">
              <button @click="editActionMapping(mapping)" class="btn-icon" title="编辑">
                ✏️
              </button>
              <button @click="deleteActionMapping(mapping.id)" class="btn-icon" title="删除">
                🗑️
              </button>
            </div>
            <!-- 交互映射端点 -->
            <div
              class="port port-input"
              :data-port-id="mapping.portId"
              :data-port-type="'action'"
              @mousedown="$emit('port-mousedown', $event, websiteId, mapping.portId, 'action-input')"
            ></div>
          </div>

          <div v-if="actionMappings.length === 0" class="empty-hint">
            暂无交互映射，点击 + 添加
          </div>
        </div>
      </div>

      <!-- 选择元素提示 -->
      <div v-if="isSelectingElement" class="selecting-hint">
        <div class="hint-content">
          <h3>🎯 正在选择网页元素</h3>
          <p>请在下方网页中点击要选择的元素</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'WebsiteAutomationPanel',
  mounted() {
    console.log('[WebsiteAutomationPanel] 组件已挂载')
    console.log('[WebsiteAutomationPanel] websiteId:', this.websiteId)
    console.log('[WebsiteAutomationPanel] websiteName:', this.websiteName)
    console.log('[WebsiteAutomationPanel] dataMappings:', this.dataMappings)
    console.log('[WebsiteAutomationPanel] actionMappings:', this.actionMappings)
    console.log('[WebsiteAutomationPanel] dataMappings 数量:', this.dataMappings?.length || 0)
  },
  watch: {
    dataMappings: {
      handler(newVal) {
        console.log('[WebsiteAutomationPanel] dataMappings 变化:', newVal?.length || 0)
      },
      deep: true,
      immediate: true
    },
    actionMappings: {
      handler(newVal) {
        console.log('[WebsiteAutomationPanel] actionMappings 变化:', newVal?.length || 0)
      },
      deep: true,
      immediate: true
    }
  },
  props: {
    websiteId: {
      type: [String, Number],
      required: true
    },
    websiteName: {
      type: String,
      default: '网页'
    },
    dataMappings: {
      type: Array,
      default: () => []
    },
    actionMappings: {
      type: Array,
      default: () => []
    },
    darkMode: {
      type: Boolean,
      default: false
    },
    isSelectingElement: {
      type: Boolean,
      default: false
    }
  },
  emits: [
    'add-data-mapping',
    'edit-data-mapping',
    'delete-data-mapping',
    'add-action-mapping',
    'edit-action-mapping',
    'delete-action-mapping',
    'port-mousedown',
    'start-select-element'
  ],
  methods: {
    addDataMapping() {
      this.$emit('add-data-mapping', this.websiteId)
    },
    editDataMapping(mapping) {
      this.$emit('edit-data-mapping', this.websiteId, mapping)
    },
    deleteDataMapping(mappingId) {
      if (confirm('确定删除此数据映射吗？')) {
        this.$emit('delete-data-mapping', this.websiteId, mappingId)
      }
    },
    addActionMapping() {
      this.$emit('add-action-mapping', this.websiteId)
    },
    editActionMapping(mapping) {
      this.$emit('edit-action-mapping', this.websiteId, mapping)
    },
    deleteActionMapping(mappingId) {
      if (confirm('确定删除此交互映射吗？')) {
        this.$emit('delete-action-mapping', this.websiteId, mappingId)
      }
    },
    getActionIcon(type) {
      const icons = {
        'click': '👆',
        'input': '⌨️',
        'submit': '✅',
        'select': '📋'
      }
      return icons[type] || '⚡'
    }
  }
}
</script>

<style scoped>
/* 覆盖层容器 */
.automation-panel-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 10;
  pointer-events: auto;
  transition: opacity 0.3s;
}

/* 选择元素时完全隐藏覆盖层，让用户能看到网页 */
.automation-panel-overlay.selecting-element {
  opacity: 0;
  pointer-events: none;
  z-index: 1; /* 降低层级，确保 ElementSelector 在上方 */
}

.automation-panel {
  width: 100%;
  height: 100%;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  display: flex;
  flex-direction: column;
  overflow-y: auto;
  padding: 16px;
  box-shadow: 0 0 20px rgba(0, 0, 0, 0.1);
}

.dark-mode.automation-panel {
  background: rgba(42, 42, 42, 0.95);
  color: #e0e0e0;
}

.panel-header {
  margin-bottom: 20px;
  padding-bottom: 12px;
  border-bottom: 2px solid #e0e0e0;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.dark-mode .panel-header {
  border-bottom-color: #444;
}

.website-info {
  display: flex;
  align-items: center;
  gap: 8px;
}

.btn-select-element {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  background: #4CAF50;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 13px;
  font-weight: 500;
  transition: all 0.2s;
}

.btn-select-element:hover {
  background: #45a049;
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(76, 175, 80, 0.3);
}

.website-icon {
  font-size: 24px;
}

.website-name {
  font-size: 16px;
  font-weight: 600;
  color: #333;
}

.dark-mode .website-name {
  color: #e0e0e0;
}

.mapping-section {
  margin-bottom: 24px;
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

.section-header h4 {
  margin: 0;
  font-size: 14px;
  font-weight: 600;
  color: #555;
}

.dark-mode .section-header h4 {
  color: #aaa;
}

.btn-add {
  width: 24px;
  height: 24px;
  padding: 0;
  background: #4CAF50;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.btn-add:hover {
  background: #45a049;
  transform: scale(1.1);
}

.btn-add svg {
  color: white;
}

.mapping-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.mapping-item {
  position: relative;
  background: #f8f9fa;
  border: 1px solid #e0e0e0;
  border-radius: 6px;
  padding: 10px 12px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  transition: all 0.2s;
}

.mapping-item:hover {
  border-color: #4CAF50;
  background: #f0fff0;
}

.dark-mode .mapping-item {
  background: #3a3a3a;
  border-color: #555;
}

.dark-mode .mapping-item:hover {
  border-color: #4CAF50;
  background: #2f4f2f;
}

.mapping-content {
  display: flex;
  align-items: center;
  gap: 10px;
  flex: 1;
  min-width: 0;
}

.mapping-icon {
  font-size: 20px;
  flex-shrink: 0;
}

.mapping-info {
  flex: 1;
  min-width: 0;
}

.mapping-name {
  font-size: 13px;
  font-weight: 600;
  color: #333;
  margin-bottom: 2px;
}

.dark-mode .mapping-name {
  color: #e0e0e0;
}

.mapping-selector {
  font-size: 11px;
  color: #666;
  font-family: 'Courier New', monospace;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.dark-mode .mapping-selector {
  color: #999;
}

.mapping-actions {
  display: flex;
  gap: 4px;
  margin-left: 8px;
}

.btn-icon {
  padding: 4px;
  background: transparent;
  border: none;
  cursor: pointer;
  font-size: 14px;
  opacity: 0.6;
  transition: all 0.2s;
}

.btn-icon:hover {
  opacity: 1;
  transform: scale(1.2);
}

.empty-hint {
  text-align: center;
  color: #999;
  font-size: 12px;
  padding: 20px;
}

.dark-mode .empty-hint {
  color: #666;
}

/* 端点样式 */
.port {
  position: absolute;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  border: 2px solid #fff;
  cursor: crosshair;
  z-index: 10;
}

.port-output {
  right: -6px;
  top: 50%;
  transform: translateY(-50%);
  background: #4CAF50;
}

.port-input {
  left: -6px;
  top: 50%;
  transform: translateY(-50%);
  background: #2196F3;
}

.port:hover {
  transform: translateY(-50%) scale(1.3);
}

/* 选择元素提示 */
.selecting-hint {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: rgba(76, 175, 80, 0.95);
  color: white;
  padding: 24px 32px;
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
  text-align: center;
  z-index: 100;
  pointer-events: none;
}

.hint-content h3 {
  margin: 0 0 12px 0;
  font-size: 20px;
  font-weight: 600;
}

.hint-content p {
  margin: 0;
  font-size: 14px;
  opacity: 0.9;
}
</style>

