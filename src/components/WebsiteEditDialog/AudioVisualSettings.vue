<template>
  <div class="settings-container">
    <!-- 音频设置 -->
    <div class="form-group">
      <label>{{ $t('audioVisual.audioSettings') }}</label>
      <div class="audio-control">
        <label class="audio-option" :class="{ active: muted }">
          <input
            type="checkbox"
            :checked="muted"
            @change="$emit('update:muted', $event.target.checked)"
          />
          <span>{{ $t('audioVisual.muted') }}</span>
        </label>
      </div>
      <div class="audio-hint">
        {{ $t('audioVisual.mutedHint') }}
      </div>
    </div>

    <!-- 视觉设置 -->
    <div class="form-group">
      <label>{{ $t('audioVisual.visualSettings') }}</label>
      <div class="visual-control">
        <label class="visual-option" :class="{ active: darkMode }">
          <input
            type="checkbox"
            :checked="darkMode"
            @change="$emit('update:darkMode', $event.target.checked)"
          />
          <span>{{ $t('audioVisual.darkMode') }}</span>
        </label>
      </div>
      <div class="visual-hint">
        {{ $t('audioVisual.darkModeHint') }}
      </div>
    </div>

    <!-- 操作按钮设置 -->
    <div class="form-group">
      <label>{{ $t('audioVisual.actionButtonSettings') }}</label>
      <div class="action-control">
        <label class="action-option" :class="{ active: requireModifierForActions }">
          <input
            type="checkbox"
            :checked="requireModifierForActions"
            @change="$emit('update:requireModifierForActions', $event.target.checked)"
          />
          <span>{{ $t('audioVisual.requireModifierForActions') }}</span>
        </label>
      </div>
      <div class="action-hint">
        {{ $t('audioVisual.requireModifierForActionsHint') }}
      </div>
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
  emits: ['update:muted', 'update:darkMode', 'update:requireModifierForActions']
}
</script>

<style scoped>
.settings-container {
  display: contents;
}

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

.audio-control,
.visual-control {
  display: flex;
  gap: 12px;
  margin-top: 8px;
}

.audio-option,
.visual-option {
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
}

.audio-option:hover {
  border-color: #ef4444;
  background: #fef2f2;
}

.audio-option.active {
  border-color: #ef4444;
  background: #ef4444;
  color: white;
}

.visual-option:hover {
  border-color: #6366f1;
  background: #eef2ff;
}

.visual-option.active {
  border-color: #6366f1;
  background: #6366f1;
  color: white;
}

.audio-option input[type="checkbox"],
.visual-option input[type="checkbox"] {
  display: none;
}

.audio-option span,
.visual-option span {
  display: flex;
  align-items: center;
  gap: 6px;
}

.audio-hint {
  margin-top: 8px;
  padding: 10px;
  background: #fef2f2;
  border-left: 3px solid #ef4444;
  border-radius: 4px;
  font-size: 12px;
  line-height: 1.6;
  color: #991b1b;
}

.visual-hint {
  margin-top: 8px;
  padding: 10px;
  background: #eef2ff;
  border-left: 3px solid #6366f1;
  border-radius: 4px;
  font-size: 12px;
  line-height: 1.6;
  color: #4338ca;
}

.action-control {
  display: flex;
  gap: 12px;
  margin-top: 8px;
}

.action-option {
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
}

.action-option:hover {
  border-color: #FF5C00;
  background: #fff5f0;
}

.action-option.active {
  border-color: #FF5C00;
  background: #FF5C00;
  color: white;
}

.action-option input[type="checkbox"] {
  display: none;
}

.action-option span {
  display: flex;
  align-items: center;
  gap: 6px;
}

.action-hint {
  margin-top: 8px;
  padding: 10px;
  background: #fff5f0;
  border-left: 3px solid #FF5C00;
  border-radius: 4px;
  font-size: 12px;
  line-height: 1.6;
  color: #b45309;
}
</style>

