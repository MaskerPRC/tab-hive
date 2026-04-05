<template>
  <div v-if="show" class="monitoring-dialog-overlay" @click.self="handleClose">
    <div class="monitoring-dialog" :class="{ 'dark-mode': darkMode }">
      <div class="dialog-header">
        <h3>{{ isEdit ? $t('monitoring.editRule') : $t('monitoring.newRule') }}</h3>
        <button class="close-btn" @click="handleClose">×</button>
      </div>

      <div class="dialog-body">
        <!-- 规则名称 -->
        <div class="form-group">
          <label>{{ $t('monitoring.ruleName') }}</label>
          <input
            v-model="formData.name"
            type="text"
            :placeholder="$t('monitoring.ruleNamePlaceholder')"
            class="form-input"
          />
        </div>

        <!-- 监听条件 -->
        <div class="form-group">
          <label>{{ $t('monitoring.condition') }}</label>
          <div class="condition-type-selector">
            <div class="type-option selected">
              <div class="type-icon">🔍</div>
              <div class="type-info">
                <div class="type-name">{{ $t('monitoring.visionMonitor') }}</div>
                <div class="type-desc">{{ $t('monitoring.visionMonitorDesc') }}</div>
              </div>
            </div>
            <!-- 预留未来的条件类型 -->
            <div class="type-option disabled" title="即将推出">
              <div class="type-icon">📝</div>
              <div class="type-info">
                <div class="type-name">{{ $t('monitoring.textMonitor') }}</div>
                <div class="type-desc">{{ $t('monitoring.textMonitorDesc') }}</div>
              </div>
            </div>
          </div>
        </div>

        <!-- 自然语言条件描述 -->
        <div class="form-group">
          <label>{{ $t('monitoring.conditionDesc') }}</label>
          <textarea
            v-model="formData.conditionDescription"
            :placeholder="$t('monitoring.conditionPlaceholder')"
            class="form-textarea"
            rows="3"
          ></textarea>
          <div class="help-text">
            {{ $t('monitoring.conditionHint') }}
          </div>
        </div>

        <!-- 检测间隔 -->
        <div class="form-group">
          <label>{{ $t('monitoring.checkInterval') }}</label>
          <div class="interval-selector">
            <input
              v-model.number="formData.checkInterval"
              type="number"
              min="10"
              max="86400"
              class="form-input interval-input"
            />
            <span class="interval-unit">{{ $t('monitoring.seconds') }}</span>
            <div class="interval-presets">
              <button
                v-for="preset in intervalPresets"
                :key="preset.value"
                class="preset-btn"
                :class="{ active: formData.checkInterval === preset.value }"
                @click="formData.checkInterval = preset.value"
              >
                {{ preset.label }}
              </button>
            </div>
          </div>
          <div class="help-text">
            {{ $t('monitoring.intervalHint') }}
          </div>
        </div>

        <!-- 执行动作 -->
        <div class="form-group">
          <label>{{ $t('monitoring.actions') }}</label>
          <div class="action-list">
            <div class="action-item">
              <input
                type="checkbox"
                id="action-notification"
                checked
                disabled
                class="action-checkbox"
              />
              <label for="action-notification" class="action-label">
                <span class="action-icon">🔔</span>
                <span class="action-name">{{ $t('monitoring.desktopNotification') }}</span>
                <span class="action-badge">{{ $t('monitoring.required') }}</span>
              </label>
            </div>
            <!-- 预留未来的动作类型 -->
            <div class="action-item disabled">
              <input
                type="checkbox"
                id="action-email"
                disabled
                class="action-checkbox"
              />
              <label for="action-email" class="action-label">
                <span class="action-icon">📧</span>
                <span class="action-name">{{ $t('monitoring.sendEmail') }}</span>
                <span class="action-badge coming-soon">{{ $t('monitoring.comingSoon') }}</span>
              </label>
            </div>
            <div class="action-item disabled">
              <input
                type="checkbox"
                id="action-webhook"
                disabled
                class="action-checkbox"
              />
              <label for="action-webhook" class="action-label">
                <span class="action-icon">🔗</span>
                <span class="action-name">{{ $t('monitoring.webhook') }}</span>
                <span class="action-badge coming-soon">{{ $t('monitoring.comingSoon') }}</span>
              </label>
            </div>
          </div>
        </div>

        <!-- 通知消息 -->
        <div class="form-group">
          <label>{{ $t('monitoring.notificationMessage') }}</label>
          <input
            v-model="formData.notificationMessage"
            type="text"
            :placeholder="$t('monitoring.notificationPlaceholder')"
            class="form-input"
          />
        </div>

        <!-- LLM API 配置提示 -->
        <div class="api-config-notice">
          <div class="notice-icon">ℹ️</div>
          <div class="notice-content">
            <div class="notice-title">{{ $t('monitoring.apiConfigTitle') }}</div>
            <div class="notice-text">
              {{ $t('monitoring.apiConfigDesc') }}
            </div>
            <div class="notice-actions">
              <button class="notice-btn" @click="openApiSettings">
                {{ $t('monitoring.goConfig') }}
              </button>
              <button class="notice-btn secondary" @click="testScreenshot">
                {{ $t('monitoring.testScreenshot') }}
              </button>
              <button class="notice-btn primary" @click="testLLMVision">
                {{ $t('monitoring.testVision') }}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div class="dialog-footer">
        <button class="btn btn-cancel" @click="handleClose">{{ $t('common.cancel') }}</button>
        <button class="btn btn-primary" @click="handleSave" :disabled="!isFormValid">
          {{ isEdit ? $t('common.save') : $t('common.create') }}
        </button>
      </div>
    </div>

    <!-- 测试 LLM 视觉分析弹窗 -->
    <TestLLMDialog
      :visible="showTestDialog"
      :website-id="websiteId"
      :dark-mode="darkMode"
      @close="closeTestDialog"
    />
  </div>
</template>

<script>
import { ref } from 'vue'
import TestLLMDialog from './TestLLMDialog.vue'
import { useMonitoringRuleForm } from '../composables/useMonitoringRuleForm'

export default {
  name: 'MonitoringRuleDialog',
  components: {
    TestLLMDialog
  },
  props: {
    show: {
      type: Boolean,
      default: false
    },
    websiteId: {
      type: String,
      default: null
    },
    rule: {
      type: Object,
      default: null
    },
    darkMode: {
      type: Boolean,
      default: false
    }
  },
  emits: ['close', 'save', 'open-api-settings'],
  setup(props, { emit }) {
    // 使用表单管理 composable
    const {
      formData,
      intervalPresets,
      isEdit,
      isFormValid,
      handleSave,
      handleClose
    } = useMonitoringRuleForm(props, emit)

    // 测试 LLM 对话框状态
    const showTestDialog = ref(false)

    /**
     * 打开 API 设置
     */
    const openApiSettings = () => {
      emit('open-api-settings')
    }

    /**
     * 测试截图
     */
    const testScreenshot = async () => {
      if (!window.electron || !window.electron.monitoring) {
        alert('此功能仅在 Electron 环境中可用')
        return
      }

      if (!props.websiteId) {
        alert('网站ID无效')
        return
      }

      try {
        const result = await window.electron.monitoring.testScreenshot(props.websiteId)
        if (result.success) {
          alert(`截图已保存到:\n${result.path}\n\n大小: ${Math.round(result.size / 1024)} KB\n\n请打开该文件查看截图是否正确。`)
        } else {
          alert(`截图失败: ${result.error}`)
        }
      } catch (error) {
        console.error('测试截图失败:', error)
        alert('测试截图失败: ' + error.message)
      }
    }

    /**
     * 打开测试 LLM 视觉分析对话框
     */
    const testLLMVision = () => {
      showTestDialog.value = true
    }

    /**
     * 关闭测试对话框
     */
    const closeTestDialog = () => {
      showTestDialog.value = false
    }

    return {
      formData,
      intervalPresets,
      isEdit,
      isFormValid,
      handleClose,
      handleSave,
      openApiSettings,
      testScreenshot,
      showTestDialog,
      testLLMVision,
      closeTestDialog
    }
  }
}
</script>

<style scoped>
.monitoring-dialog-overlay {
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

.monitoring-dialog {
  background: #fff;
  border-radius: 12px;
  width: 90%;
  max-width: 600px;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
}

.monitoring-dialog.dark-mode {
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

.form-group {
  margin-bottom: 24px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  font-weight: 500;
  font-size: 14px;
}

.form-input,
.form-textarea {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 14px;
  font-family: inherit;
  transition: all 0.2s;
  box-sizing: border-box;
}

.form-input:focus,
.form-textarea:focus {
  outline: none;
  border-color: #4CAF50;
  box-shadow: 0 0 0 3px rgba(76, 175, 80, 0.1);
}

.dark-mode .form-input,
.dark-mode .form-textarea {
  background: #3a3a3a;
  border-color: #555;
  color: #e0e0e0;
}

.dark-mode .form-input:focus,
.dark-mode .form-textarea:focus {
  border-color: #66BB6A;
  box-shadow: 0 0 0 3px rgba(102, 187, 106, 0.1);
}

.form-textarea {
  resize: vertical;
  min-height: 80px;
}

.help-text {
  margin-top: 6px;
  font-size: 12px;
  color: #888;
}

.dark-mode .help-text {
  color: #aaa;
}

.condition-type-selector {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.type-option {
  display: flex;
  align-items: center;
  padding: 16px;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
}

.type-option:not(.disabled):hover {
  border-color: #4CAF50;
  background: #f9fff9;
}

.type-option.selected {
  border-color: #4CAF50;
  background: #f1f8f4;
}

.type-option.disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.dark-mode .type-option {
  border-color: #555;
}

.dark-mode .type-option:not(.disabled):hover {
  border-color: #66BB6A;
  background: #2a3a2a;
}

.dark-mode .type-option.selected {
  border-color: #66BB6A;
  background: #2a4a2a;
}

.type-icon {
  font-size: 32px;
  margin-right: 16px;
}

.type-info {
  flex: 1;
}

.type-name {
  font-weight: 600;
  font-size: 14px;
  margin-bottom: 4px;
}

.type-desc {
  font-size: 12px;
  color: #888;
}

.dark-mode .type-desc {
  color: #aaa;
}

.interval-selector {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.interval-input {
  width: 120px;
  margin-right: 8px;
}

.interval-unit {
  font-size: 14px;
  color: #666;
}

.dark-mode .interval-unit {
  color: #aaa;
}

.interval-presets {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.preset-btn {
  padding: 6px 12px;
  border: 1px solid #ddd;
  background: #fff;
  border-radius: 6px;
  cursor: pointer;
  font-size: 13px;
  transition: all 0.2s;
}

.preset-btn:hover {
  border-color: #4CAF50;
  background: #f9fff9;
}

.preset-btn.active {
  border-color: #4CAF50;
  background: #4CAF50;
  color: #fff;
}

.dark-mode .preset-btn {
  background: #3a3a3a;
  border-color: #555;
  color: #e0e0e0;
}

.dark-mode .preset-btn:hover {
  border-color: #66BB6A;
  background: #2a4a2a;
}

.dark-mode .preset-btn.active {
  background: #66BB6A;
  border-color: #66BB6A;
}

.action-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.action-item {
  display: flex;
  align-items: center;
}

.action-item.disabled {
  opacity: 0.5;
}

.action-checkbox {
  margin-right: 12px;
  width: 18px;
  height: 18px;
  cursor: pointer;
}

.action-item.disabled .action-checkbox {
  cursor: not-allowed;
}

.action-label {
  display: flex;
  align-items: center;
  cursor: pointer;
  flex: 1;
}

.action-item.disabled .action-label {
  cursor: not-allowed;
}

.action-icon {
  font-size: 20px;
  margin-right: 8px;
}

.action-name {
  font-size: 14px;
  margin-right: 8px;
}

.action-badge {
  padding: 2px 8px;
  background: #4CAF50;
  color: #fff;
  border-radius: 12px;
  font-size: 11px;
  font-weight: 600;
}

.action-badge.coming-soon {
  background: #999;
}

.api-config-notice {
  display: flex;
  padding: 16px;
  background: #fff3cd;
  border: 1px solid #ffc107;
  border-radius: 8px;
  margin-top: 24px;
}

.dark-mode .api-config-notice {
  background: #3a3020;
  border-color: #aa8807;
}

.notice-icon {
  font-size: 24px;
  margin-right: 12px;
}

.notice-content {
  flex: 1;
}

.notice-title {
  font-weight: 600;
  font-size: 14px;
  margin-bottom: 4px;
}

.notice-text {
  font-size: 13px;
  color: #666;
  margin-bottom: 8px;
}

.dark-mode .notice-text {
  color: #aaa;
}

.notice-actions {
  display: flex;
  gap: 8px;
  margin-top: 8px;
}

.notice-btn {
  padding: 6px 12px;
  background: #ffc107;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 13px;
  font-weight: 500;
  transition: all 0.2s;
}

.notice-btn:hover {
  background: #ffb300;
}

.notice-btn.secondary {
  background: #e0e0e0;
  color: #333;
}

.notice-btn.secondary:hover {
  background: #d0d0d0;
}

.dark-mode .notice-btn.secondary {
  background: #555;
  color: #e0e0e0;
}

.dark-mode .notice-btn.secondary:hover {
  background: #666;
}

.notice-btn.primary {
  background: #4CAF50;
  color: white;
}

.notice-btn.primary:hover {
  background: #45a049;
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

.btn-primary:disabled {
  background: #ccc;
  cursor: not-allowed;
}

.dark-mode .btn-primary:disabled {
  background: #555;
}
</style>

