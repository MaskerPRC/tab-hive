<template>
  <div v-if="show" class="rules-list-overlay" @click.self="handleClose">
    <div class="rules-list-dialog" :class="{ 'dark-mode': darkMode }">
      <div class="dialog-header">
        <h3>{{ $t('monitoring.rulesTitle') }}</h3>
        <button class="close-btn" @click="handleClose">×</button>
      </div>

      <div class="dialog-body">
        <!-- 空状态 -->
        <div v-if="rules.length === 0" class="empty-state">
          <div class="empty-icon">👁️</div>
          <div class="empty-title">{{ $t('monitoring.noRules') }}</div>
          <div class="empty-desc">{{ $t('monitoring.noRulesDesc') }}</div>
          <button class="btn btn-primary" @click="handleCreate">
            {{ $t('monitoring.createFirst') }}
          </button>
        </div>

        <!-- 规则列表 -->
        <div v-else class="rules-list">
          <div
            v-for="rule in rules"
            :key="rule.id"
            class="rule-item"
            :class="{ disabled: !rule.enabled }"
          >
            <div class="rule-header">
              <div class="rule-title">
                <span class="rule-icon">🔍</span>
                <span class="rule-name">{{ rule.name }}</span>
              </div>
              <div class="rule-actions">
                <label class="toggle-switch">
                  <input
                    type="checkbox"
                    :checked="rule.enabled"
                    @change="handleToggle(rule)"
                  />
                  <span class="toggle-slider"></span>
                </label>
                <button
                  class="icon-btn"
                  :title="$t('common.edit')"
                  @click="handleEdit(rule)"
                >
                  ✏️
                </button>
                <button
                  class="icon-btn"
                  :title="$t('common.delete')"
                  @click="handleDelete(rule)"
                >
                  🗑️
                </button>
              </div>
            </div>

            <div class="rule-body">
              <div class="rule-condition">
                <strong>{{ $t('monitoring.conditionLabel') }}</strong>
                {{ getConditionDescription(rule) }}
              </div>
              <div class="rule-meta">
                <span class="meta-item">
                  ⏱️ {{ $t('monitoring.checkEvery', { interval: rule.check_interval }) }}
                </span>
                <span class="meta-item">
                  🔔 {{ $t('monitoring.desktopNotification') }}
                </span>
                <span v-if="rule.last_trigger_time" class="meta-item">
                  🎯 {{ $t('monitoring.lastTrigger', { time: formatTime(rule.last_trigger_time) }) }}
                </span>
                <span v-if="rule.trigger_count > 0" class="meta-item">
                  📊 {{ $t('monitoring.triggerCount', { count: rule.trigger_count }) }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="dialog-footer">
        <button class="btn btn-cancel" @click="handleClose">{{ $t('common.close') }}</button>
        <button class="btn btn-primary" @click="handleCreate">
          {{ $t('monitoring.createRule') }}
        </button>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, watch } from 'vue'

export default {
  name: 'MonitoringRulesList',
  props: {
    show: {
      type: Boolean,
      default: false
    },
    websiteId: {
      type: String,
      default: null
    },
    darkMode: {
      type: Boolean,
      default: false
    }
  },
  emits: ['close', 'create', 'edit', 'delete', 'toggle'],
  setup(props, { emit }) {
    const rules = ref([])
    const loading = ref(false)

    // 加载规则列表
    const loadRules = async () => {
      if (!window.electron || !window.electron.monitoring || !props.websiteId) return
      
      loading.value = true
      try {
        const result = await window.electron.monitoring.getRules(props.websiteId)
        rules.value = result || []
      } catch (error) {
        console.error('加载监听规则失败:', error)
      } finally {
        loading.value = false
      }
    }

    // 监听 show 变化，加载数据
    watch(() => props.show, (newVal) => {
      if (newVal) {
        loadRules()
      }
    })

    const handleClose = () => {
      emit('close')
    }

    const handleCreate = () => {
      emit('create')
    }

    const handleEdit = (rule) => {
      emit('edit', rule)
    }

    const handleDelete = async (rule) => {
      if (!confirm(`确定要删除规则"${rule.name}"吗？`)) return
      emit('delete', rule.id)
      // 重新加载列表
      setTimeout(loadRules, 100)
    }

    const handleToggle = async (rule) => {
      emit('toggle', rule.id, !rule.enabled)
      // 更新本地状态
      rule.enabled = !rule.enabled
    }

    const getConditionDescription = (rule) => {
      try {
        const config = JSON.parse(rule.condition_config || '{}')
        return config.description || '无描述'
      } catch (e) {
        return '无描述'
      }
    }

    const formatTime = (timeStr) => {
      if (!timeStr) return ''
      const date = new Date(timeStr)
      const now = new Date()
      const diff = now - date
      const seconds = Math.floor(diff / 1000)
      const minutes = Math.floor(seconds / 60)
      const hours = Math.floor(minutes / 60)
      const days = Math.floor(hours / 24)

      if (days > 0) return `${days}天前`
      if (hours > 0) return `${hours}小时前`
      if (minutes > 0) return `${minutes}分钟前`
      return '刚刚'
    }

    return {
      rules,
      loading,
      handleClose,
      handleCreate,
      handleEdit,
      handleDelete,
      handleToggle,
      getConditionDescription,
      formatTime
    }
  }
}
</script>

<style scoped>
.rules-list-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10000;
  backdrop-filter: blur(4px);
}

.rules-list-dialog {
  background: #fff;
  border-radius: 12px;
  width: 90%;
  max-width: 700px;
  max-height: 80vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
}

.rules-list-dialog.dark-mode {
  background: #2d2d2d;
  color: #e0e0e0;
}

.dialog-header {
  padding: 20px 24px;
  border-bottom: 1px solid #e0e0e0;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.dark-mode .dialog-header {
  border-bottom-color: #444;
}

.dialog-header h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
}

.close-btn {
  background: none;
  border: none;
  font-size: 28px;
  cursor: pointer;
  color: #666;
  padding: 0;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
  transition: all 0.2s;
}

.close-btn:hover {
  background: #f0f0f0;
  color: #333;
}

.dark-mode .close-btn {
  color: #aaa;
}

.dark-mode .close-btn:hover {
  background: #444;
  color: #fff;
}

.dialog-body {
  padding: 24px;
  overflow-y: auto;
  flex: 1;
}

.empty-state {
  text-align: center;
  padding: 60px 20px;
}

.empty-icon {
  font-size: 64px;
  margin-bottom: 16px;
}

.empty-title {
  font-size: 18px;
  font-weight: 600;
  margin-bottom: 8px;
}

.empty-desc {
  font-size: 14px;
  color: #888;
  margin-bottom: 24px;
}

.dark-mode .empty-desc {
  color: #aaa;
}

.rules-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.rule-item {
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  padding: 16px;
  transition: all 0.2s;
}

.rule-item:hover {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.rule-item.disabled {
  opacity: 0.6;
}

.dark-mode .rule-item {
  border-color: #444;
  background: #3a3a3a;
}

.dark-mode .rule-item:hover {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
}

.rule-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.rule-title {
  display: flex;
  align-items: center;
  gap: 8px;
}

.rule-icon {
  font-size: 20px;
}

.rule-name {
  font-size: 16px;
  font-weight: 600;
}

.rule-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.toggle-switch {
  position: relative;
  display: inline-block;
  width: 44px;
  height: 24px;
}

.toggle-switch input {
  opacity: 0;
  width: 0;
  height: 0;
}

.toggle-slider {
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: #ccc;
  transition: 0.3s;
  border-radius: 24px;
}

.toggle-slider:before {
  position: absolute;
  content: "";
  height: 18px;
  width: 18px;
  left: 3px;
  bottom: 3px;
  background-color: white;
  transition: 0.3s;
  border-radius: 50%;
}

input:checked + .toggle-slider {
  background-color: #4CAF50;
}

input:checked + .toggle-slider:before {
  transform: translateX(20px);
}

.dark-mode .toggle-slider {
  background-color: #555;
}

.dark-mode input:checked + .toggle-slider {
  background-color: #66BB6A;
}

.icon-btn {
  background: none;
  border: none;
  font-size: 18px;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 4px;
  transition: all 0.2s;
}

.icon-btn:hover {
  background: #f0f0f0;
}

.dark-mode .icon-btn:hover {
  background: #444;
}

.rule-body {
  font-size: 14px;
}

.rule-condition {
  margin-bottom: 8px;
  line-height: 1.5;
}

.rule-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  font-size: 12px;
  color: #888;
}

.dark-mode .rule-meta {
  color: #aaa;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 4px;
}

.dialog-footer {
  padding: 16px 24px;
  border-top: 1px solid #e0e0e0;
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

.dark-mode .dialog-footer {
  border-top-color: #444;
}

.btn {
  padding: 10px 20px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.2s;
}

.btn-cancel {
  background: #f0f0f0;
  color: #333;
}

.btn-cancel:hover {
  background: #e0e0e0;
}

.dark-mode .btn-cancel {
  background: #3a3a3a;
  color: #e0e0e0;
}

.dark-mode .btn-cancel:hover {
  background: #444;
}

.btn-primary {
  background: #4CAF50;
  color: #fff;
}

.btn-primary:hover {
  background: #45a049;
}
</style>

