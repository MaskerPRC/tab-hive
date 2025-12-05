<template>
  <div class="setting-card">
    <div class="card-header">
      <span class="card-title">{{ $t('deviceType.title') }}</span>
      <i class="fa-solid fa-mobile-screen card-icon"></i>
    </div>
    <!-- Segmented Control -->
    <div class="segmented-control">
      <button
        type="button"
        class="segment-btn"
        :class="{ active: modelValue === 'desktop' }"
        @click="$emit('update:modelValue', 'desktop')"
      >
        <i class="fa-solid fa-desktop"></i> {{ $t('deviceType.desktop') }}
      </button>
      <button
        type="button"
        class="segment-btn"
        :class="{ active: modelValue === 'mobile' }"
        @click="$emit('update:modelValue', 'mobile')"
      >
        <i class="fa-solid fa-mobile-alt"></i> {{ $t('deviceType.mobile') }}
      </button>
    </div>
    <p class="card-hint">选择网站加载时的 User-Agent 类型</p>
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
.setting-card {
  background: white;
  padding: 1rem;
  border-radius: 0.75rem;
  border: 1px solid #e5e7eb;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  transition: all 0.2s ease;
  cursor: default;
}

.setting-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0.75rem;
}

.card-title {
  font-weight: 500;
  color: #374151;
  font-size: 0.875rem;
}

.card-icon {
  color: #9ca3af;
  font-size: 0.875rem;
}

.segmented-control {
  display: flex;
  background: #f3f4f6;
  padding: 0.25rem;
  border-radius: 0.5rem;
  gap: 0.25rem;
}

.segment-btn {
  flex: 1;
  padding: 0.375rem 0.75rem;
  border-radius: 0.375rem;
  background: transparent;
  border: none;
  color: #6b7280;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
}

.segment-btn:hover {
  color: #374151;
}

.segment-btn.active {
  background: white;
  color: #f97316;
  box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
}

.segment-btn i {
  font-size: 0.75rem;
}

.card-hint {
  font-size: 0.75rem;
  color: #9ca3af;
  margin: 0.75rem 0 0 0;
  line-height: 1.5;
}
</style>

