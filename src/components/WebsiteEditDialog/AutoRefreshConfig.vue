<template>
  <div class="form-group">
    <label>自动刷新间隔（可选）：</label>
    
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
      <div class="custom-label">自定义：</div>
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
          <option value="seconds">秒</option>
          <option value="minutes">分钟</option>
          <option value="hours">小时</option>
          <option value="days">天</option>
        </select>
      </div>
    </div>
    
    <div class="refresh-hint">
      💡 设置iframe自动刷新的时间间隔<br>
      • 点击预设快速选择，或自定义时间和单位<br>
      • 设置为 0 表示不自动刷新<br>
      • 建议最小值：30秒（避免频繁刷新影响性能）<br>
      • 适用场景：实时监控、数据大屏等需要定期更新的页面
    </div>
  </div>
</template>

<script>
import { ref, watch } from 'vue'
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
    const {
      presets,
      customValue,
      timeUnit,
      convertSecondsToUnit,
      convertToSeconds,
      isPresetActive
    } = useRefreshInterval(props.modelValue)

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

