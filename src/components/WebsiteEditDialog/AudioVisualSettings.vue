<template>
  <div class="settings-container">
    <!-- 音频设置 -->
    <div 
      class="setting-card"
      :class="{ 'active-red': muted }"
      @click="toggleMuted"
    >
      <div class="card-header">
        <span class="card-title">{{ $t('audioVisual.audioSettings') }}</span>
        <div class="toggle-switch" :class="{ active: muted }">
          <div class="toggle-thumb"></div>
        </div>
      </div>
      <div class="card-status" :class="{ 'status-active': muted }">
        <i class="fa-solid fa-volume-xmark"></i>
        <span>{{ $t('audioVisual.muted') }}</span>
      </div>
      <p class="card-hint">{{ $t('audioVisual.mutedHint') }}</p>
    </div>

    <!-- 视觉设置 -->
    <div 
      class="setting-card"
      :class="{ 'active-purple': darkMode }"
      @click="toggleDarkMode"
    >
      <div class="card-header">
        <span class="card-title">{{ $t('audioVisual.visualSettings') }}</span>
        <div class="toggle-switch" :class="{ active: darkMode }">
          <div class="toggle-thumb"></div>
        </div>
      </div>
      <div class="card-status" :class="{ 'status-active': darkMode }">
        <i class="fa-solid fa-moon"></i>
        <span>{{ $t('audioVisual.darkMode') }}</span>
      </div>
      <p class="card-hint">{{ $t('audioVisual.darkModeHint') }}</p>
    </div>

    <!-- 操作按钮设置 -->
    <div 
      class="setting-card"
      :class="{ 'active-orange': requireModifierForActions }"
      @click="toggleRequireModifier"
    >
      <div class="card-header">
        <span class="card-title">{{ $t('audioVisual.actionButtonSettings') }}</span>
        <div class="toggle-switch toggle-switch-orange" :class="{ active: requireModifierForActions }">
          <div class="toggle-thumb"></div>
        </div>
      </div>
      <div class="card-status" :class="{ 'status-active': requireModifierForActions }">
        <i class="fa-solid fa-keyboard"></i>
        <span>{{ $t('audioVisual.requireModifierForActions') }}</span>
      </div>
      <p class="card-hint">{{ $t('audioVisual.requireModifierForActionsHint') }}</p>
    </div>
  </div>
</template>

<script>
import { useI18n } from 'vue-i18n'

export default {
  name: 'AudioVisualSettings',
  props: {
    muted: {
      type: Boolean,
      default: false
    },
    darkMode: {
      type: Boolean,
      default: false
    },
    requireModifierForActions: {
      type: Boolean,
      default: false
    }
  },
  emits: ['update:muted', 'update:darkMode', 'update:requireModifierForActions'],
  setup(props, { emit }) {
    const toggleMuted = () => {
      emit('update:muted', !props.muted)
    }

    const toggleDarkMode = () => {
      emit('update:darkMode', !props.darkMode)
    }

    const toggleRequireModifier = () => {
      emit('update:requireModifierForActions', !props.requireModifierForActions)
    }

    return {
      toggleMuted,
      toggleDarkMode,
      toggleRequireModifier
    }
  }
}
</script>

<style scoped>
.settings-container {
  display: contents;
}

.setting-card {
  background: white;
  padding: 1rem;
  border-radius: 0.75rem;
  border: 1px solid #e5e7eb;
  cursor: pointer;
  transition: all 0.2s ease;
  position: relative;
  overflow: hidden;
}

.setting-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
}

.setting-card.active-red {
  border-color: #ef4444;
  background-color: #fef2f2;
}

.setting-card.active-purple {
  border-color: #a78bfa;
  background-color: #f5f3ff;
}

.setting-card.active-orange {
  border-color: #f97316;
  background-color: #fff7ed;
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0.5rem;
}

.card-title {
  font-weight: 500;
  color: #1f2937;
  font-size: 0.875rem;
}

.toggle-switch {
  width: 2rem;
  height: 1.25rem;
  background: #e5e7eb;
  border-radius: 9999px;
  position: relative;
  transition: background 0.2s;
}

.toggle-switch.active {
  background: #ef4444;
}

.toggle-switch-orange.active {
  background: #f97316;
}

.toggle-thumb {
  position: absolute;
  width: 0.75rem;
  height: 0.75rem;
  background: white;
  border-radius: 50%;
  top: 0.125rem;
  left: 0.125rem;
  transition: transform 0.2s;
}

.toggle-switch.active .toggle-thumb {
  transform: translateX(0.875rem);
}

.card-status {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #6b7280;
  font-weight: 500;
  font-size: 0.875rem;
  margin-bottom: 0.5rem;
}

.card-status.status-active {
  color: #dc2626;
  font-weight: 600;
}

.setting-card.active-purple .card-status.status-active {
  color: #7c3aed;
}

.setting-card.active-orange .card-status.status-active {
  color: #f97316;
}

.card-status i {
  font-size: 0.875rem;
}

.card-hint {
  font-size: 0.75rem;
  color: #6b7280;
  margin: 0;
  padding-left: 0.5rem;
  border-left: 2px solid #fee2e2;
  line-height: 1.5;
}

.setting-card.active-purple .card-hint {
  border-left-color: #e9d5ff;
}

.setting-card.active-orange .card-hint {
  border-left-color: #fed7aa;
}
</style>

