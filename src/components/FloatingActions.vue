<template>
  <div 
    class="floating-actions"
    :class="{
      'require-modifier': requireModifier,
      'modifier-pressed': requireModifier && isModifierPressed
    }"
  >
    <button
      class="btn-action btn-refresh"
      @click="$emit('refresh')"
      :title="$t('floatingActions.refresh')"
      v-html="ICONS.refresh"
    />
    <button
      class="btn-action btn-mute"
      :class="{ 'muted': muted }"
      @click="$emit('toggle-mute')"
      :title="muted ? $t('floatingActions.unmute') : $t('floatingActions.mute')"
      v-html="muted ? ICONS.volumeOff : ICONS.volumeOn"
    />
    <button
      class="btn-action btn-copy"
      @click="$emit('copy')"
      :title="$t('floatingActions.copy')"
      v-html="ICONS.copy"
    />
    <button
      v-if="customCodeEnabled"
      class="btn-action btn-script"
      @click="$emit('open-script-panel')"
      :title="$t('floatingActions.script')"
      v-html="ICONS.code"
    />
    <button
      class="btn-action btn-edit"
      @click="$emit('edit')"
      :title="$t('floatingActions.edit')"
      v-html="ICONS.edit"
    />
    <button
      class="btn-action"
      @click="$emit('fullscreen')"
      :title="$t('floatingActions.fullscreen')"
      v-html="ICONS.fullscreen"
    />
    <button
      class="btn-action btn-remove"
      @click="$emit('remove')"
      :title="$t('floatingActions.remove')"
      v-html="ICONS.remove"
    />
  </div>
</template>

<script>
import { useI18n } from 'vue-i18n'
import { ICONS } from './icons.js'

export default {
  name: 'FloatingActions',
  props: {
    muted: {
      type: Boolean,
      default: false
    },
    requireModifier: {
      type: Boolean,
      default: false
    },
    isModifierPressed: {
      type: Boolean,
      default: false
    },
    customCodeEnabled: {
      type: Boolean,
      default: true
    }
  },
  emits: ['refresh', 'toggle-mute', 'copy', 'open-script-panel', 'edit', 'fullscreen', 'remove'],
  setup() {
    const { t } = useI18n()
    return {
      ICONS,
      t
    }
  }
}
</script>

<style scoped>
.floating-actions {
  position: absolute;
  top: 10px;
  right: 10px;
  display: flex;
  gap: 8px;
  z-index: 101;
  opacity: 0;
  transition: opacity 0.2s ease;
  pointer-events: none;
}

/* 如果需要修饰键但未按下，始终隐藏 */
.floating-actions.require-modifier:not(.modifier-pressed) {
  opacity: 0 !important;
  pointer-events: none !important;
}

.btn-action {
  background: rgba(255, 92, 0, 0.7);
  color: white;
  border: none;
  padding: 8px;
  border-radius: 6px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s;
  backdrop-filter: blur(4px);
}

.btn-action:hover {
  background: rgba(255, 92, 0, 0.9);
  transform: scale(1.1);
}

.btn-action :deep(svg) {
  display: block;
}

.btn-remove {
  background: rgba(255, 68, 68, 0.7) !important;
}

.btn-remove:hover {
  background: rgba(255, 0, 0, 0.9) !important;
}

.btn-refresh {
  background: rgba(76, 175, 80, 0.7) !important;
}

.btn-refresh:hover {
  background: rgba(76, 175, 80, 0.9) !important;
}

.btn-copy {
  background: rgba(156, 39, 176, 0.7) !important;
}

.btn-copy:hover {
  background: rgba(156, 39, 176, 0.9) !important;
}

.btn-edit {
  background: rgba(33, 150, 243, 0.7) !important;
}

.btn-edit:hover {
  background: rgba(33, 150, 243, 0.9) !important;
}

.btn-mute {
  background: rgba(255, 152, 0, 0.7) !important;
}

.btn-mute:hover {
  background: rgba(255, 152, 0, 0.9) !important;
}

.btn-mute.muted {
  background: rgba(244, 67, 54, 0.7) !important;
}

.btn-mute.muted:hover {
  background: rgba(244, 67, 54, 0.9) !important;
}

.btn-script {
  background: rgba(103, 58, 183, 0.7) !important;
}

.btn-script:hover {
  background: rgba(103, 58, 183, 0.9) !important;
}
</style>

