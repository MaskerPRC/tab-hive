<template>
  <!-- 选择器设置面板 -->
  <div class="settings-panel">
    <h4 class="settings-title">{{ $t('selectorToolbar.selectorRules') }}</h4>
    <div class="settings-options">
      <label class="setting-option">
        <input 
          type="checkbox" 
          :checked="settings.includeId"
          @change="$emit('update:includeId', $event.target.checked)"
        />
        <span>{{ $t('selectorToolbar.includeId') }}</span>
      </label>
      <label class="setting-option">
        <input 
          type="checkbox"
          :checked="settings.includeClass"
          @change="$emit('update:includeClass', $event.target.checked)"
        />
        <span>{{ $t('selectorToolbar.includeClass') }}</span>
      </label>
      <label class="setting-option">
        <input 
          type="checkbox"
          :checked="settings.includeTag"
          @change="$emit('update:includeTag', $event.target.checked)"
        />
        <span>{{ $t('selectorToolbar.includeTag') }}</span>
      </label>
      <label class="setting-option">
        <input 
          type="checkbox"
          :checked="settings.includeAttributes"
          @change="$emit('update:includeAttributes', $event.target.checked)"
        />
        <span>{{ $t('selectorToolbar.includeAttributes') }}</span>
      </label>
    </div>
  </div>
</template>

<script>
export default {
  name: 'SelectorSettings',
  props: {
    settings: {
      type: Object,
      required: true,
      default: () => ({
        includeId: true,
        includeClass: true,
        includeTag: true,
        includeAttributes: false
      })
    }
  },
  emits: ['update:includeId', 'update:includeClass', 'update:includeTag', 'update:includeAttributes']
}
</script>

<style scoped>
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
</style>

