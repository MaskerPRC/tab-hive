<template>
  <div class="execution-history" v-if="results.length">
    <div class="history-header">
      <h4>📝 {{ $t('contentScript.history.title') }}</h4>
      <span class="history-count">{{ results.length }}</span>
    </div>
    <div class="history-list">
      <div v-for="(result, index) in results.slice(-5).reverse()"
           :key="index"
           :class="['history-item', result.success ? 'success' : 'error']">
        <span class="history-status">{{ result.success ? '✅' : '❌' }}</span>
        <span class="history-time">{{ formatTime(result.timestamp) }}</span>
        <span class="history-preview">{{ formatResult(result) }}</span>
      </div>
    </div>
    <button @click="$emit('clear')" class="btn-clear">{{ $t('contentScript.history.clear') }}</button>
  </div>
</template>

<script>
import { useI18n } from 'vue-i18n'

export default {
  name: 'ExecutionHistory',
  props: {
    results: {
      type: Array,
      default: () => []
    }
  },
  emits: ['clear'],
  setup() {
    const { t } = useI18n()

    const formatTime = (timestamp) => {
      const date = new Date(timestamp)
      return date.toLocaleTimeString()
    }

    const formatResult = (result) => {
      if (!result) return t('contentScript.history.noResult')
      if (!result.success) return result.error || t('contentScript.history.executionFailed')

      if (result.result === undefined || result.result === null) {
        return t('contentScript.history.noReturnValue')
      }

      if (typeof result.result === 'string') {
        return result.result.substring(0, 50) + (result.result.length > 50 ? '...' : '')
      }

      try {
        const jsonStr = JSON.stringify(result.result)
        if (!jsonStr) return t('contentScript.history.emptyResult')
        return jsonStr.substring(0, 50) + (jsonStr.length > 50 ? '...' : '')
      } catch (error) {
        return String(result.result).substring(0, 50) + '...'
      }
    }

    return {
      formatTime,
      formatResult
    }
  }
}
</script>

<style scoped>
.execution-history {
  border-top: 1px solid rgba(0, 0, 0, 0.06);
  padding: 16px 24px;
  background: #fafafa;
  flex-shrink: 0;
}

.history-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

.history-header h4 {
  margin: 0;
  font-size: 14px;
  font-weight: 600;
  color: #475569;
}

.history-count {
  font-size: 11px;
  color: white;
  background: #94a3b8;
  padding: 2px 8px;
  border-radius: 10px;
}

.history-list {
  max-height: 140px;
  overflow-y: auto;
  scrollbar-width: thin;
}

.history-list::-webkit-scrollbar {
  width: 4px;
}

.history-list::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 2px;
}

.history-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 12px;
  background: white;
  border-radius: 6px;
  margin-bottom: 6px;
  font-size: 12px;
  border-left: 3px solid transparent;
  transition: all 0.2s;
}

.history-item.success {
  border-left-color: #10b981;
}

.history-item.error {
  border-left-color: #ef4444;
}

.history-item:hover {
  background: #f8fafc;
}

.history-status {
  flex-shrink: 0;
}

.history-time {
  color: #94a3b8;
  font-size: 11px;
  font-family: 'SF Mono', monospace;
  flex-shrink: 0;
}

.history-preview {
  flex: 1;
  color: #64748b;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.btn-clear {
  width: 100%;
  margin-top: 10px;
  padding: 8px;
  background: transparent;
  color: #94a3b8;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-clear:hover {
  background: #fef2f2;
  color: #ef4444;
  border-color: #fecaca;
}

@media (max-width: 600px) {
  .execution-history {
    padding-left: 16px;
    padding-right: 16px;
  }
}
</style>
