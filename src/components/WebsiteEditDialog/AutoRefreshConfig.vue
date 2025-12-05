<template>
  <div class="refresh-config">
    <div class="config-header">
      <label class="config-label">{{ $t('autoRefresh.title') }}</label>
      <span class="config-badge">Auto Refresh</span>
    </div>
    
    <!-- 常用预设 -->
    <div class="refresh-presets">
      <button
        v-for="preset in presets"
        :key="preset.value"
        type="button"
        class="preset-btn"
        :class="{ active: isPresetActive(preset.value) }"
        @click="selectPreset(preset.value)"
      >
        {{ preset.label }}
      </button>
    </div>
    
    <!-- 自定义配置 -->
    <div class="refresh-custom">
      <span class="custom-label">{{ $t('autoRefresh.custom') }}:</span>
      <div class="refresh-interval-selector">
        <input
          :value="customValue"
          @input="handleCustomInput($event.target.value)"
          type="number"
          min="0"
          step="1"
          placeholder="0"
          class="form-input refresh-input"
          @keyup.enter="$emit('enter')"
        />
        <div class="unit-wrapper">
          <select
            :value="timeUnit"
            @change="handleUnitChange($event.target.value)"
            class="unit-select"
          >
            <option value="seconds">{{ $t('autoRefresh.seconds') }}</option>
            <option value="minutes">{{ $t('autoRefresh.minutes') }}</option>
            <option value="hours">{{ $t('autoRefresh.hours') }}</option>
            <option value="days">{{ $t('autoRefresh.days') }}</option>
          </select>
        </div>
      </div>
    </div>
    
    <div class="refresh-hint">
      <i class="fa-regular fa-clock"></i>
      <div class="hint-content">
        <p class="hint-title">刷新策略：</p>
        <ul class="hint-list">
          <li>设置 iframe 自动刷新的时间间隔。</li>
          <li>设置为 <code>0</code> 表示不自动刷新。</li>
          <li>建议最小值：<span class="highlight">30秒</span>（避免频繁刷新影响性能）。</li>
          <li>适用场景：实时监控、数据大屏等需要定期更新的页面。</li>
        </ul>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, watch, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRefreshInterval } from '../../composables/useRefreshInterval.js'

export default {
  name: 'AutoRefreshConfig',
  props: {
    modelValue: {
      type: Number,
      default: 0
    }
  },
  emits: ['update:modelValue', 'enter'],
  setup(props, { emit }) {
    const { t } = useI18n()
    const {
      presets: rawPresets,
      customValue,
      timeUnit,
      convertSecondsToUnit,
      convertToSeconds,
      isPresetActive
    } = useRefreshInterval(props.modelValue)
    
    // 翻译预设标签
    const presets = computed(() => {
      const presetTranslations = {
        0: t('autoRefreshPresets.noRefresh'),
        30: t('autoRefreshPresets.thirtySeconds'),
        60: t('autoRefreshPresets.oneMinute'),
        300: t('autoRefreshPresets.fiveMinutes'),
        1800: t('autoRefreshPresets.thirtyMinutes'),
        3600: t('autoRefreshPresets.oneHour'),
        86400: t('autoRefreshPresets.oneDay')
      }
      
      return rawPresets.map(preset => ({
        ...preset,
        label: presetTranslations[preset.value] || preset.label
      }))
    })

    // 监听外部值变化
    watch(() => props.modelValue, (newVal) => {
      const converted = convertSecondsToUnit(newVal)
      customValue.value = converted.value
      timeUnit.value = converted.unit
    })

    const selectPreset = (seconds) => {
      emit('update:modelValue', seconds)
      const converted = convertSecondsToUnit(seconds)
      customValue.value = converted.value
      timeUnit.value = converted.unit
    }

    const handleCustomInput = (value) => {
      customValue.value = Number(value) || 0
      const seconds = convertToSeconds(customValue.value, timeUnit.value)
      emit('update:modelValue', seconds)
    }

    const handleUnitChange = (unit) => {
      timeUnit.value = unit
      const seconds = convertToSeconds(customValue.value, timeUnit.value)
      emit('update:modelValue', seconds)
    }

    return {
      presets,
      customValue,
      timeUnit,
      selectPreset,
      handleCustomInput,
      handleUnitChange,
      isPresetActive: (value) => isPresetActive(value, props.modelValue)
    }
  }
}
</script>

<style scoped>
.refresh-config {
  margin-bottom: 0;
}

.config-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0.75rem;
}

.config-label {
  display: block;
  color: #374151;
  font-weight: 500;
  font-size: 0.875rem;
  margin: 0;
}

.config-badge {
  font-size: 0.75rem;
  background: #f3f4f6;
  color: #6b7280;
  padding: 0.125rem 0.5rem;
  border-radius: 0.25rem;
}

.refresh-presets {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 0.5rem;
  margin-bottom: 1rem;
}

@media (min-width: 640px) {
  .refresh-presets {
    grid-template-columns: repeat(4, 1fr);
  }
}

@media (min-width: 768px) {
  .refresh-presets {
    grid-template-columns: repeat(7, 1fr);
  }
}

.preset-btn {
  padding: 0.5rem 0.25rem;
  border: 1px solid #e5e7eb;
  border-radius: 0.5rem;
  background: white;
  color: #4b5563;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;
}

.preset-btn:hover {
  border-color: #f97316;
  color: #f97316;
}

.preset-btn.active {
  background: #f97316;
  color: white;
  border-color: #f97316;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
}

.refresh-custom {
  margin-top: 1rem;
  display: flex;
  align-items: center;
  gap: 1rem;
}

.custom-label {
  font-size: 0.875rem;
  color: #6b7280;
  font-weight: 500;
  white-space: nowrap;
}

.refresh-interval-selector {
  display: flex;
  align-items: center;
  width: 12rem;
  box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
  border-radius: 0.5rem;
  overflow: hidden;
  border: 1px solid #e5e7eb;
  transition: all 0.2s;
}

.refresh-interval-selector:focus-within {
  border-color: #f97316;
  box-shadow: 0 0 0 2px rgba(249, 115, 22, 0.1);
}

.refresh-input {
  flex: 1;
  min-width: 0;
  padding: 0.5rem 0.75rem;
  border: none;
  outline: none;
  font-size: 0.875rem;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
  color: #1f2937;
  background: white;
}

.unit-wrapper {
  height: 100%;
  background: #f9fafb;
  border-left: 1px solid #e5e7eb;
  display: flex;
  align-items: center;
  padding: 0 0.5rem;
}

.unit-select {
  background: transparent;
  border: none;
  outline: none;
  font-size: 0.875rem;
  color: #4b5563;
  cursor: pointer;
  padding: 0.25rem 0;
}

.refresh-hint {
  margin-top: 1rem;
  background: #d1fae5;
  border-left: 4px solid #10b981;
  padding: 1rem;
  border-radius: 0 0.5rem 0.5rem 0;
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
}

.refresh-hint i {
  color: #059669;
  margin-top: 0.125rem;
  font-size: 0.875rem;
  flex-shrink: 0;
}

.hint-content {
  font-size: 0.875rem;
  color: #374151;
  line-height: 1.5;
}

.hint-title {
  font-weight: 500;
  color: #1f2937;
  margin-bottom: 0.25rem;
  display: block;
}

.hint-list {
  margin: 0.5rem 0 0 0;
  padding-left: 1rem;
  font-size: 0.75rem;
  color: #065f46;
}

.hint-list li {
  margin: 0.25rem 0;
}

.hint-list code {
  background: white;
  padding: 0.125rem 0.25rem;
  border-radius: 0.25rem;
  border: 1px solid #a7f3d0;
  color: #047857;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
  font-size: 0.75rem;
}

.highlight {
  color: #047857;
  font-weight: 500;
}
</style>

