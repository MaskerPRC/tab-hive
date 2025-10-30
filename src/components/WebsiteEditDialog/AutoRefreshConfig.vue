<template>
  <div class="form-group">
    <label>{{ $t('autoRefresh.title') }}</label>
    
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
      <div class="custom-label">{{ $t('autoRefresh.custom') }}</div>
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
        <select
          :value="timeUnit"
          @change="handleUnitChange($event.target.value)"
          class="form-input unit-select"
        >
          <option value="seconds">{{ $t('autoRefresh.seconds') }}</option>
          <option value="minutes">{{ $t('autoRefresh.minutes') }}</option>
          <option value="hours">{{ $t('autoRefresh.hours') }}</option>
          <option value="days">{{ $t('autoRefresh.days') }}</option>
        </select>
      </div>
    </div>
    
    <div class="refresh-hint">
      {{ $t('autoRefresh.hint') }}
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
.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  color: #333;
  font-weight: 500;
  font-size: 14px;
}

.refresh-presets {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 16px;
}

.preset-btn {
  flex: 0 0 auto;
  padding: 8px 14px;
  border: 2px solid #e0e0e0;
  border-radius: 6px;
  background: white;
  color: #333;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  white-space: nowrap;
}

.preset-btn:hover {
  border-color: var(--primary-color);
  background: var(--primary-light);
  transform: translateY(-1px);
  box-shadow: 0 2px 4px rgba(255, 92, 0, 0.1);
}

.preset-btn.active {
  border-color: var(--primary-color);
  background: var(--primary-color);
  color: white;
  box-shadow: 0 2px 8px rgba(255, 92, 0, 0.3);
}

.refresh-custom {
  margin-top: 12px;
}

.custom-label {
  font-size: 13px;
  color: #666;
  margin-bottom: 8px;
  font-weight: 500;
}

.refresh-interval-selector {
  display: flex;
  align-items: center;
  gap: 10px;
}

.form-input {
  width: 100%;
  padding: 12px 15px;
  border: 2px solid #e0e0e0;
  border-radius: 6px;
  font-size: 14px;
  transition: border-color 0.3s;
}

.form-input:focus {
  outline: none;
  border-color: var(--primary-color);
}

.refresh-input {
  flex: 0 1 120px;
  min-width: 80px;
  max-width: 150px;
}

.unit-select {
  flex: 0 0 90px;
  cursor: pointer;
  padding: 12px 10px;
  font-size: 14px;
}

.refresh-hint {
  margin-top: 12px;
  padding: 10px;
  background: #f0fdf4;
  border-left: 3px solid #10b981;
  border-radius: 4px;
  font-size: 12px;
  line-height: 1.6;
  color: #065f46;
}
</style>

