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
    <!-- 前进后退和刷新按钮组（紧凑区域） -->
    <div class="navigation-group">
      <button
        class="btn-nav btn-back"
        @click="$emit('goBack')"
        :disabled="!canGoBack"
        :title="$t('fullscreenBar.goBack')"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="15 18 9 12 15 6"/>
        </svg>
      </button>
      <button
        class="btn-nav btn-refresh"
        @click.stop="handleRefresh"
        :title="$t('fullscreenBar.refresh')"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="23 4 23 10 17 10"/>
          <polyline points="1 20 1 14 7 14"/>
          <path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15"/>
        </svg>
      </button>
      <button
        class="btn-nav btn-forward"
        @click="$emit('goForward')"
        :disabled="!canGoForward"
        :title="$t('fullscreenBar.goForward')"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="9 18 15 12 9 6"/>
        </svg>
      </button>
    </div>
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
    },
    canGoBack: {
      type: Boolean,
      default: false
    },
    canGoForward: {
      type: Boolean,
      default: false
    }
  },
  emits: ['exit', 'leave', 'selectElement', 'refresh', 'goBack', 'goForward'],
  setup(props, { emit }) {
    const { t } = useI18n()
    
    const handleRefresh = (event) => {
      console.log('[FullscreenBar] ========== 刷新按钮被点击 ==========')
      console.log('[FullscreenBar] event:', event)
      console.log('[FullscreenBar] event.target:', event.target)
      emit('refresh')
    }
    
    return { t, handleRefresh }
  }
}
</script>

<style scoped>
.fullscreen-exit-bar {
  position: absolute;
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
  pointer-events: auto;
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

/* 前进后退和刷新按钮组（紧凑区域） */
.navigation-group {
  display: flex;
  gap: 0;
  border-right: 1px solid rgba(255, 255, 255, 0.2);
}

.btn-nav {
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  color: white;
  border: none;
  cursor: pointer;
  transition: all 0.3s;
  position: relative;
  pointer-events: auto;
}

/* 前进后退按钮稍微宽一点 */
.btn-nav.btn-back,
.btn-nav.btn-forward {
  padding: 12px 20px;
}

/* 刷新按钮稍窄一点 */
.btn-nav.btn-refresh {
  padding: 12px 18px;
}

.btn-nav:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.btn-nav:not(:disabled):hover {
  background: rgba(255, 255, 255, 0.15);
}

.btn-back {
  border-right: 1px solid rgba(255, 255, 255, 0.1);
}

.btn-refresh {
  border-right: 1px solid rgba(255, 255, 255, 0.1);
}

.btn-selector,
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
  pointer-events: auto;
}

.btn-selector {
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

