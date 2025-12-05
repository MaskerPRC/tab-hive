<template>
  <div
    v-if="show"
    class="fullscreen-exit-bar"
    @mouseleave="$emit('leave')"
  >
    <button
      class="btn-selector"
      @click="$emit('selectElement')"
      :title="$t('fullscreenBar.selectElement')"
    >
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M3 3l7.07 16.97 2.51-7.39 7.39-2.51L3 3z"/>
        <path d="M13 13l6 6"/>
      </svg>
      <span>{{ $t('fullscreenBar.selectElement') }}</span>
    </button>
    <button
      class="btn-refresh"
      @click="$emit('refresh')"
      :title="$t('fullscreenBar.refresh')"
    >
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <polyline points="23 4 23 10 17 10"/>
        <polyline points="1 20 1 14 7 14"/>
        <path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15"/>
      </svg>
      <span>{{ $t('fullscreenBar.refresh') }}</span>
    </button>
    <button
      class="btn-exit-fullscreen"
      @click="$emit('exit')"
    >
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3"/>
      </svg>
      <span>{{ $t('fullscreenBar.exitFullscreen') }}</span>
    </button>
  </div>
</template>

<script>
import { useI18n } from 'vue-i18n'

export default {
  name: 'FullscreenBar',
  props: {
    show: {
      type: Boolean,
      required: true
    }
  },
  emits: ['exit', 'leave', 'selectElement', 'refresh'],
  setup() {
    const { t } = useI18n()
    return { t }
  }
}
</script>

<style scoped>
.fullscreen-exit-bar {
  position: fixed;
  top: 0;
  left: 50%;
  transform: translateX(-50%);
  z-index: 10001;
  background: rgba(255, 92, 0, 0.95);
  padding: 0;
  border-radius: 0 0 12px 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  backdrop-filter: blur(10px);
  animation: slideDown 0.3s ease-out;
  display: flex;
  gap: 0;
}

@keyframes slideDown {
  from {
    transform: translateX(-50%) translateY(-100%);
    opacity: 0;
  }
  to {
    transform: translateX(-50%) translateY(0);
    opacity: 1;
  }
}

.btn-selector,
.btn-refresh,
.btn-exit-fullscreen {
  display: flex;
  align-items: center;
  gap: 10px;
  background: transparent;
  color: white;
  border: none;
  padding: 12px 30px;
  cursor: pointer;
  font-size: 15px;
  font-weight: 500;
  transition: all 0.3s;
  position: relative;
}

.btn-selector {
  border-right: 1px solid rgba(255, 255, 255, 0.2);
}

.btn-refresh {
  border-right: 1px solid rgba(255, 255, 255, 0.2);
}

.btn-selector:hover,
.btn-refresh:hover,
.btn-exit-fullscreen:hover {
  background: rgba(255, 255, 255, 0.15);
}

.btn-selector svg,
.btn-refresh svg,
.btn-exit-fullscreen svg {
  display: block;
}
</style>

