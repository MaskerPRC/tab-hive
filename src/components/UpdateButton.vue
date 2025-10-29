<template>
  <button
    v-if="visible"
    class="update-button"
    @click="handleClick"
    title="有新版本可用"
  >
    <div class="update-badge">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-15"></path>
        <polyline points="7 10 12 15 17 10"></polyline>
        <line x1="12" y1="15" x2="12" y2="3"></line>
      </svg>
      <span class="pulse-dot"></span>
    </div>
    <span class="update-text">发现新版本</span>
  </button>
</template>

<script>
export default {
  name: 'UpdateButton',
  props: {
    visible: {
      type: Boolean,
      default: false
    }
  },
  emits: ['click'],
  methods: {
    handleClick() {
      this.$emit('click')
    }
  }
}
</script>

<style scoped>
.update-button {
  width: 100%;
  padding: 12px 16px;
  background: linear-gradient(135deg, #ff5c00 0%, #ff7a33 100%);
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
}

.update-button::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
  transition: left 0.5s;
}

.update-button:hover::before {
  left: 100%;
}

.update-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(255, 92, 0, 0.4);
}

.update-button:active {
  transform: translateY(0);
}

.update-badge {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 50%;
  flex-shrink: 0;
}

.update-badge svg {
  position: relative;
  z-index: 1;
  animation: bounce 2s ease-in-out infinite;
}

.pulse-dot {
  position: absolute;
  top: 2px;
  right: 2px;
  width: 8px;
  height: 8px;
  background: #4caf50;
  border-radius: 50%;
  border: 2px solid white;
  z-index: 2;
  animation: pulse 2s ease-in-out infinite;
}

.update-text {
  flex: 1;
  text-align: left;
}

@keyframes bounce {
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-3px);
  }
}

@keyframes pulse {
  0%, 100% {
    transform: scale(1);
    opacity: 1;
  }
  50% {
    transform: scale(1.2);
    opacity: 0.8;
  }
}
</style>

