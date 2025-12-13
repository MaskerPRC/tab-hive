<template>
  <div v-if="show" class="monitoring-dialog-overlay" @click.self="handleClose">
    <div class="monitoring-dialog" :class="{ 'dark-mode': darkMode }">
      <div class="dialog-header">
        <h3>{{ isEdit ? '编辑监听规则' : '新建监听规则' }}</h3>
        <button class="close-btn" @click="handleClose">×</button>
      </div>

      <div class="dialog-body">
        <!-- 规则名称 -->
        <div class="form-group">
          <label>规则名称</label>
          <input
            v-model="formData.name"
            type="text"
            placeholder="例如：检测价格变化"
            class="form-input"
          />
        </div>

        <!-- 监听条件 -->
        <div class="form-group">
          <label>监听条件</label>
          <div class="condition-type-selector">
            <div class="type-option selected">
              <div class="type-icon">🔍</div>
              <div class="type-info">
                <div class="type-name">视觉监听 (LLM)</div>
                <div class="type-desc">使用AI分析页面截图内容</div>
              </div>
            </div>
            <!-- 预留未来的条件类型 -->
            <div class="type-option disabled" title="即将推出">
              <div class="type-icon">📝</div>
              <div class="type-info">
                <div class="type-name">文本监听</div>
                <div class="type-desc">监听页面文本变化（即将推出）</div>
              </div>
            </div>
          </div>
        </div>

        <!-- 自然语言条件描述 -->
        <div class="form-group">
          <label>条件描述（用自然语言描述触发条件）</label>
          <textarea
            v-model="formData.conditionDescription"
            placeholder="例如：当页面显示'缺货'或'sold out'字样时触发"
            class="form-textarea"
            rows="3"
          ></textarea>
          <div class="help-text">
            AI将根据此描述分析页面截图，判断是否满足条件
          </div>
        </div>

        <!-- 检测间隔 -->
        <div class="form-group">
          <label>检测间隔</label>
          <div class="interval-selector">
            <input
              v-model.number="formData.checkInterval"
              type="number"
              min="10"
              max="86400"
              class="form-input interval-input"
            />
            <span class="interval-unit">秒</span>
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
            建议不要设置过短，避免频繁调用API产生高额费用
          </div>
        </div>

        <!-- 执行动作 -->
        <div class="form-group">
          <label>执行动作</label>
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
                <span class="action-name">桌面通知</span>
                <span class="action-badge">必选</span>
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
                <span class="action-name">发送邮件</span>
                <span class="action-badge coming-soon">即将推出</span>
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
                <span class="action-name">Webhook通知</span>
                <span class="action-badge coming-soon">即将推出</span>
              </label>
            </div>
          </div>
        </div>

        <!-- 通知消息 -->
        <div class="form-group">
          <label>通知消息</label>
          <input
            v-model="formData.notificationMessage"
            type="text"
            placeholder="例如：商品状态发生变化！"
            class="form-input"
          />
        </div>

        <!-- LLM API 配置提示 -->
        <div class="api-config-notice">
          <div class="notice-icon">ℹ️</div>
          <div class="notice-content">
            <div class="notice-title">需要配置 LLM API</div>
            <div class="notice-text">
              此功能需要调用 LLM API（如 OpenAI GPT-4 Vision）来分析截图。
              请在设置中配置您的 API 密钥。
            </div>
            <div class="notice-actions">
              <button class="notice-btn" @click="openApiSettings">
                前往配置 →
              </button>
              <button class="notice-btn secondary" @click="testScreenshot">
                🖼️ 测试截图
              </button>
              <button class="notice-btn primary" @click="testLLMVision">
                🤖 测试视觉分析
              </button>
            </div>
          </div>
        </div>
      </div>

      <div class="dialog-footer">
        <button class="btn btn-cancel" @click="handleClose">取消</button>
        <button class="btn btn-primary" @click="handleSave" :disabled="!isFormValid">
          {{ isEdit ? '保存' : '创建' }}
        </button>
      </div>
    </div>

    <!-- 测试 LLM 视觉分析弹窗 -->
    <div v-if="showTestDialog" class="test-dialog-overlay" @click.self="showTestDialog = false">
      <div class="test-dialog" :class="{ 'dark-mode': darkMode }">
        <div class="test-dialog-header">
          <h3>🤖 测试视觉分析</h3>
          <button class="close-btn" @click="showTestDialog = false">×</button>
        </div>
        <div class="test-dialog-body">
          <p class="test-dialog-desc">输入一个简单的问题来测试 LLM 是否能正确分析当前页面：</p>
          <textarea
            v-model="testPrompt"
            placeholder="例如：页面上有输入框吗？&#10;页面显示的是登录页面吗？&#10;页面中有购买按钮吗？"
            class="test-prompt-input"
            rows="4"
          ></textarea>
          <div class="test-examples">
            <div class="examples-title">示例问题：</div>
            <button 
              v-for="example in examplePrompts" 
              :key="example"
              class="example-btn"
              @click="testPrompt = example"
            >
              {{ example }}
            </button>
          </div>
        </div>
        <div class="test-dialog-footer">
          <button class="btn btn-cancel" @click="showTestDialog = false">取消</button>
          <button 
            class="btn btn-primary" 
            @click="executeTest" 
            :disabled="!testPrompt.trim() || testLoading"
          >
            <span v-if="testLoading">分析中...</span>
            <span v-else>开始测试</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, watch } from 'vue'

export default {
  name: 'MonitoringRuleDialog',
  props: {
    show: {
      type: Boolean,
      default: false
    },
    websiteId: {
      type: String,
      required: true
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
    const formData = ref({
      name: '',
      conditionType: 'llm_screenshot',
      conditionDescription: '',
      checkInterval: 60,
      actionType: 'desktop_notification',
      notificationMessage: ''
    })

    const intervalPresets = [
      { label: '30秒', value: 30 },
      { label: '1分钟', value: 60 },
      { label: '5分钟', value: 300 },
      { label: '10分钟', value: 600 },
      { label: '30分钟', value: 1800 },
      { label: '1小时', value: 3600 }
    ]

    const isEdit = computed(() => !!props.rule)

    const isFormValid = computed(() => {
      return formData.value.name.trim() !== '' &&
             formData.value.conditionDescription.trim() !== '' &&
             formData.value.checkInterval >= 10
    })

    // 监听规则变化，填充表单
    watch(() => props.rule, (newRule) => {
      if (newRule) {
        formData.value = {
          name: newRule.name || '',
          conditionType: newRule.condition_type || 'llm_screenshot',
          conditionDescription: newRule.condition_config ? JSON.parse(newRule.condition_config).description : '',
          checkInterval: newRule.check_interval || 60,
          actionType: newRule.action_type || 'desktop_notification',
          notificationMessage: newRule.action_config ? JSON.parse(newRule.action_config).message : ''
        }
      } else {
        // 重置表单
        formData.value = {
          name: '',
          conditionType: 'llm_screenshot',
          conditionDescription: '',
          checkInterval: 60,
          actionType: 'desktop_notification',
          notificationMessage: ''
        }
      }
    }, { immediate: true })

    const handleClose = () => {
      emit('close')
    }

    const handleSave = () => {
      if (!isFormValid.value) return

      const ruleData = {
        website_id: props.websiteId,
        name: formData.value.name.trim(),
        condition_type: formData.value.conditionType,
        condition_config: JSON.stringify({
          description: formData.value.conditionDescription.trim()
        }),
        action_type: formData.value.actionType,
        action_config: JSON.stringify({
          message: formData.value.notificationMessage.trim()
        }),
        check_interval: formData.value.checkInterval
      }

      if (isEdit.value) {
        ruleData.id = props.rule.id
      }

      emit('save', ruleData)
    }

    const openApiSettings = () => {
      emit('open-api-settings')
    }

    const testScreenshot = async () => {
      if (!window.electron || !window.electron.monitoring) {
        alert('此功能仅在 Electron 环境中可用')
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

    // 测试 LLM 视觉分析
    const showTestDialog = ref(false)
    const testPrompt = ref('')
    const testLoading = ref(false)

    const examplePrompts = [
      '你看到了什么？请描述页面的主要内容。',
      '页面上有哪些按钮？',
      '页面中是否有输入框？如果有，请描述它们的用途。',
      '页面显示了什么文字内容？',
      '页面的整体布局是什么样的？'
    ]

    const testLLMVision = () => {
      showTestDialog.value = true
      testPrompt.value = ''
    }

    const executeTest = async () => {
      if (!window.electron || !window.electron.monitoring) {
        alert('此功能仅在 Electron 环境中可用')
        return
      }

      if (!testPrompt.value.trim()) {
        return
      }

      testLoading.value = true
      try {
        const result = await window.electron.monitoring.testLLMVision(
          props.websiteId, 
          testPrompt.value.trim()
        )
        
        testLoading.value = false
        
        if (result.success) {
          alert(`🤖 LLM 回答：\n\n${result.answer}\n\n───────────────\n\n你的问题：${testPrompt.value}\n\n请检查这个回答是否合理。\n\n如果回答不准确，可能需要：\n1. 调整问题的描述方式（更明确、更具体）\n2. 检查截图是否正确（点击"测试截图"按钮）\n3. 尝试更换不同的 LLM 模型\n4. 检查 LLM API 配置`)
          showTestDialog.value = false
        } else {
          alert(`测试失败：${result.error}`)
        }
      } catch (error) {
        testLoading.value = false
        console.error('测试 LLM 视觉分析失败:', error)
        alert('测试失败: ' + error.message)
      }
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
      testPrompt,
      testLoading,
      examplePrompts,
      testLLMVision,
      executeTest
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

.test-dialog-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10001;
  backdrop-filter: blur(4px);
}

.test-dialog {
  background: #fff;
  border-radius: 12px;
  width: 90%;
  max-width: 500px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
}

.test-dialog.dark-mode {
  background: #2d2d2d;
  color: #e0e0e0;
}

.test-dialog-header {
  padding: 20px 24px;
  border-bottom: 1px solid #e0e0e0;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.dark-mode .test-dialog-header {
  border-bottom-color: #444;
}

.test-dialog-header h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
}

.test-dialog-body {
  padding: 24px;
}

.test-dialog-desc {
  margin: 0 0 16px 0;
  font-size: 14px;
  color: #666;
}

.dark-mode .test-dialog-desc {
  color: #aaa;
}

.test-prompt-input {
  width: 100%;
  padding: 12px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 14px;
  font-family: inherit;
  resize: vertical;
  box-sizing: border-box;
}

.test-prompt-input:focus {
  outline: none;
  border-color: #4CAF50;
  box-shadow: 0 0 0 3px rgba(76, 175, 80, 0.1);
}

.dark-mode .test-prompt-input {
  background: #3a3a3a;
  border-color: #555;
  color: #e0e0e0;
}

.test-examples {
  margin-top: 16px;
}

.examples-title {
  font-size: 13px;
  font-weight: 500;
  margin-bottom: 8px;
  color: #666;
}

.dark-mode .examples-title {
  color: #aaa;
}

.example-btn {
  display: block;
  width: 100%;
  padding: 8px 12px;
  margin-bottom: 6px;
  background: #f5f5f5;
  border: 1px solid #e0e0e0;
  border-radius: 6px;
  text-align: left;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s;
}

.example-btn:hover {
  background: #e8f5e9;
  border-color: #4CAF50;
}

.dark-mode .example-btn {
  background: #3a3a3a;
  border-color: #555;
  color: #e0e0e0;
}

.dark-mode .example-btn:hover {
  background: #2a4a2a;
  border-color: #66BB6A;
}

.test-dialog-footer {
  padding: 16px 24px;
  border-top: 1px solid #e0e0e0;
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

.dark-mode .test-dialog-footer {
  border-top-color: #444;
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

