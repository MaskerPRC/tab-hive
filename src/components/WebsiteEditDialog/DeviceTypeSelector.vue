<template>
  <div class="form-group">
    <label>{{ $t('deviceType.title') }}</label>
    <div class="device-type-selector">
      <label class="device-option" :class="{ active: modelValue === 'desktop' }">
        <input
          type="radio"
          value="desktop"
          :checked="modelValue === 'desktop'"
          @change="$emit('update:modelValue', 'desktop')"
        />
        <span>{{ $t('deviceType.desktop') }}</span>
      </label>
      <label class="device-option" :class="{ active: modelValue === 'mobile' }">
        <input
          type="radio"
          value="mobile"
          :checked="modelValue === 'mobile'"
          @change="$emit('update:modelValue', 'mobile')"
        />
        <span>{{ $t('deviceType.mobile') }}</span>
      </label>
    </div>
    <div class="device-hint" v-if="modelValue === 'mobile'">
      {{ $t('deviceType.mobileHint') }}
    </div>
  </div>
</template>

<script>
import { useI18n } from 'vue-i18n'

export default {
  name: 'DeviceTypeSelector',
  props: {
    modelValue: {
      type: String,
      default: 'desktop'
    }
  },
  emits: ['update:modelValue']
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

.device-type-selector {
  display: flex;
  gap: 12px;
  margin-top: 8px;
}

.device-hint {
  margin-top: 10px;
  padding: 10px;
  background: #f0f7ff;
  border-left: 3px solid #3b82f6;
  border-radius: 4px;
  font-size: 12px;
  line-height: 1.6;
  color: #1e40af;
}

.device-option {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s;
  background: white;
  font-size: 14px;
  font-weight: 500;
  white-space: nowrap;
  flex-shrink: 0;
}

.device-option:hover {
  border-color: var(--primary-color);
  background: var(--primary-light);
}

.device-option.active {
  border-color: var(--primary-color);
  background: var(--primary-color);
  color: white;
}

.device-option input[type="radio"] {
  display: none;
}

.device-option span {
  display: flex;
  align-items: center;
  gap: 6px;
}
</style>

