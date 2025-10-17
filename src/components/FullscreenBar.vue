<template>
  <div
    v-if="show"
    class="fullscreen-exit-bar"
    @mouseleave="$emit('leave')"
  >
    <button
      class="btn-exit-fullscreen"
      @click="$emit('exit')"
    >
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3"/>
      </svg>
      <span>退出全屏</span>
    </button>
  </div>
</template>

<script>
export default {
  name: 'FullscreenBar',
  props: {
    show: {
      type: Boolean,
      required: true
    }
  },
  emits: ['exit', 'leave']
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
}

.btn-exit-fullscreen:hover {
  background: rgba(255, 255, 255, 0.15);
}

.btn-exit-fullscreen svg {
  display: block;
}
</style>

