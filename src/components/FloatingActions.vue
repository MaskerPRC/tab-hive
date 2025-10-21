<template>
  <div class="floating-actions">
    <button
      class="btn-action btn-refresh"
      @click="$emit('refresh')"
      title="刷新页面"
      v-html="ICONS.refresh"
    />
    <button
      class="btn-action btn-edit"
      @click="$emit('edit')"
      title="编辑链接"
      v-html="ICONS.edit"
    />
    <button
      class="btn-action"
      @click="$emit('fullscreen')"
      title="全屏查看"
      v-html="ICONS.fullscreen"
    />
    <button
      class="btn-action btn-remove"
      @click="$emit('remove')"
      title="删除网站"
      v-html="ICONS.remove"
    />
  </div>
</template>

<script>
import { ICONS } from './icons.js'

export default {
  name: 'FloatingActions',
  emits: ['refresh', 'edit', 'fullscreen', 'remove'],
  setup() {
    return {
      ICONS
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

.btn-edit {
  background: rgba(33, 150, 243, 0.7) !important;
}

.btn-edit:hover {
  background: rgba(33, 150, 243, 0.9) !important;
}
</style>

