<template>
  <!-- 多选模式：选择器列表 -->
  <div class="selectors-list-wrapper">
    <label class="input-label">
      {{ $t('selectorToolbar.selectedElements') }} ({{ selectors.length }})
    </label>
    <div class="selectors-list">
      <div 
        v-for="(sel, index) in selectors" 
        :key="index"
        class="selector-list-item"
      >
        <span class="selector-index">{{ index + 1 }}</span>
        <span class="selector-value">{{ sel }}</span>
        <button
          class="remove-selector-btn"
          @click="$emit('remove', index)"
          :title="$t('common.remove')"
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="18" y1="6" x2="6" y2="18"/>
            <line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
      </div>
    </div>
    <div v-if="currentSelector && !selectors.includes(currentSelector)" class="current-selection">
      <button class="add-selector-btn" @click="$emit('add')">
        ➕ {{ $t('selectorToolbar.addToList') }}
      </button>
    </div>
  </div>
</template>

<script>
export default {
  name: 'SelectorList',
  props: {
    selectors: {
      type: Array,
      required: true
    },
    currentSelector: {
      type: String,
      default: ''
    }
  },
  emits: ['add', 'remove']
}
</script>

<style scoped>
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
</style>

