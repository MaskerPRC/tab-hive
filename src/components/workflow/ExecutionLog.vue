<template>
  <div v-if="logs.length > 0" class="execution-log">
    <div class="log-header">
      <h4>执行日志</h4>
      <button @click="$emit('clear')" class="btn-clear-log">清空</button>
    </div>
    <div class="log-content">
      <div
        v-for="(log, index) in logs"
        :key="index"
        class="log-item"
        :class="`log-${log.type}`"
      >
        <span class="log-time">{{ formatTime(log.time) }}</span>
        <span class="log-message">{{ log.message }}</span>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'ExecutionLog',
  props: {
    logs: {
      type: Array,
      required: true,
      default: () => []
    }
  },
  emits: ['clear'],
  setup() {
    const formatTime = (time) => {
      return new Date(time).toLocaleTimeString()
    }

    return {
      formatTime
    }
  }
}
</script>

<style scoped>
.execution-log {
  background: rgba(255, 255, 255, 0.98);
  border-top: 1px solid #e0e0e0;
  max-height: 200px;
  display: flex;
  flex-direction: column;
  backdrop-filter: blur(10px);
}

.dark-mode .execution-log {
  background: rgba(45, 45, 45, 0.98);
  border-top-color: #444;
}

.log-header {
  padding: 12px;
  border-bottom: 1px solid #e0e0e0;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.dark-mode .log-header {
  border-bottom-color: #444;
}

.log-header h4 {
  margin: 0;
  font-size: 14px;
}

.btn-clear-log {
  padding: 4px 12px;
  background: #e0e0e0;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
}

.log-content {
  flex: 1;
  overflow-y: auto;
  padding: 12px;
  font-family: 'Courier New', monospace;
  font-size: 12px;
}

.log-item {
  padding: 4px 0;
  display: flex;
  gap: 8px;
}

.log-time {
  color: #999;
}

.log-message {
  flex: 1;
}

.log-info {
  color: #2196F3;
}

.log-success {
  color: #4CAF50;
}

.log-error {
  color: #f44336;
}
</style>

