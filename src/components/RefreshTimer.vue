<template>
  <div v-if="remainingTime > 0" class="refresh-timer">
    <svg class="timer-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 6V12L16 14" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
      <circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="2"/>
    </svg>
    <span class="timer-text">{{ formattedTime }}</span>
  </div>
</template>

<script>
import { computed } from 'vue'

export default {
  name: 'RefreshTimer',
  props: {
    remainingTime: {
      type: Number,
      required: true
    }
  },
  setup(props) {
    // 格式化倒计时显示
    const formattedTime = computed(() => {
      const seconds = props.remainingTime
      if (!seconds || seconds <= 0) return ''
      
      const days = Math.floor(seconds / 86400)
      const hours = Math.floor((seconds % 86400) / 3600)
      const mins = Math.floor((seconds % 3600) / 60)
      const secs = seconds % 60
      
      if (days > 0) {
        if (hours > 0) {
          return `${days}天${hours}时`
        }
        return `${days}天`
      }
      
      if (hours > 0) {
        if (mins > 0) {
          return `${hours}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
        }
        return `${hours}时`
      }
      
      if (mins > 0) {
        return `${mins}:${secs.toString().padStart(2, '0')}`
      }
      
      return `${secs}s`
    })

    return {
      formattedTime
    }
  }
}
</script>

<style scoped>
.refresh-timer {
  position: absolute;
  bottom: 8px;
  right: 8px;
  display: flex;
  align-items: center;
  gap: 4px;
  background: rgba(16, 185, 129, 0.9);
  color: white;
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 11px;
  font-weight: 600;
  box-shadow: 0 2px 8px rgba(16, 185, 129, 0.3);
  z-index: 100;
  pointer-events: none;
  backdrop-filter: blur(4px);
  transition: all 0.3s ease;
  opacity: 0;
}

.timer-icon {
  width: 12px;
  height: 12px;
  animation: pulse 2s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.6;
  }
}

.timer-text {
  line-height: 1;
  min-width: 24px;
  text-align: center;
}
</style>

