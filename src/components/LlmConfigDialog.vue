<template>
  <div v-if="show" class="llm-config-overlay" @mousedown="handleOverlayMouseDown" @click="handleOverlayClick">
    <div class="llm-config-dialog" @mousedown.stop>
      <div class="dialog-header">
        <h1>LLM API 配置</h1>
        <p class="header-subtitle">配置 LLM API 以生成自定义网页</p>
      </div>

      <div class="dialog-content">
        <div class="form-group">
          <label for="apiUrl">API 地址</label>
          <input
            id="apiUrl"
            v-model="localConfig.apiUrl"
            type="text"
            placeholder="https://openrouter.ai/api/v1/chat/completions"
            class="form-input"
          />
          <p class="form-hint">LLM API 的完整地址</p>
        </div>

        <div class="form-group">
          <label for="apiKey">API Key</label>
          <input
            id="apiKey"
            v-model="localConfig.apiKey"
            type="password"
            placeholder="sk-..."
            class="form-input"
          />
          <p class="form-hint">
            用于认证的 API Key。
            <a href="https://openrouter.ai/settings/keys" target="_blank" class="form-link">去 OpenRouter 获取</a>
          </p>
        </div>

        <div class="form-group">
          <label for="model">模型名称</label>
          <input
            id="model"
            v-model="localConfig.model"
            type="text"
            placeholder="google/gemini-3-pro-preview"
            class="form-input"
          />
          <p class="form-hint">要使用的模型名称</p>
        </div>

        <div class="form-group">
          <label for="temperature">Temperature</label>
          <input
            id="temperature"
            v-model.number="localConfig.temperature"
            type="number"
            min="0"
            max="2"
            step="0.1"
            class="form-input"
          />
          <p class="form-hint">控制输出的随机性 (0-2)</p>
        </div>

        <div class="form-group">
          <label for="maxTokens">最大 Token 数</label>
          <input
            id="maxTokens"
            v-model.number="localConfig.maxTokens"
            type="number"
            min="0"
            max="8000"
            step="100"
            class="form-input"
          />
          <p class="form-hint">生成内容的最大长度（0 表示不限制）</p>
        </div>
      </div>

      <div class="dialog-footer">
        <button class="btn-cancel" @click="handleCancel">取消</button>
        <button class="btn-confirm" @click="handleConfirm">保存</button>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, watch } from 'vue'
import { useOverlayClick } from '../composables/useOverlayClick.js'

export default {
  name: 'LlmConfigDialog',
  props: {
    show: {
      type: Boolean,
      required: true
    },
    config: {
      type: Object,
      default: () => ({
        apiUrl: 'https://openrouter.ai/api/v1/chat/completions',
        apiKey: '',
        model: 'google/gemini-3-pro-preview',
        temperature: 0.7,
        maxTokens: 0
      })
    }
  },
  emits: ['confirm', 'cancel'],
  setup(props, { emit }) {
    const localConfig = ref({ ...props.config })

    // 监听 props.config 变化
    watch(() => props.config, (newConfig) => {
      localConfig.value = { ...newConfig }
    }, { deep: true, immediate: true })

    // 监听 show 变化，重置配置
    watch(() => props.show, (newShow) => {
      if (newShow) {
        localConfig.value = { ...props.config }
      }
    })

    const { handleOverlayMouseDown, handleOverlayClick } = useOverlayClick(() => {
      emit('cancel')
    })

    const handleConfirm = () => {
      emit('confirm', { ...localConfig.value })
    }

    const handleCancel = () => {
      emit('cancel')
    }

    return {
      localConfig,
      handleOverlayMouseDown,
      handleOverlayClick,
      handleConfirm,
      handleCancel
    }
  }
}
</script>

<style scoped>
.llm-config-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
  z-index: 10000;
  backdrop-filter: blur(5px);
  animation: fadeIn 0.2s ease-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

.llm-config-dialog {
  background: white;
  width: 100%;
  max-width: 32rem;
  border-radius: 1rem;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
  overflow: hidden;
  border: 1px solid #f3f4f6;
  display: flex;
  flex-direction: column;
  max-height: 90vh;
  animation: slideUp 0.3s ease-out;
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.dialog-header {
  padding: 1.5rem 2rem;
  border-bottom: 1px solid #f3f4f6;
  background: white;
  flex-shrink: 0;
}

.dialog-header h1 {
  font-size: 1.5rem;
  font-weight: 700;
  color: #1f2937;
  margin: 0;
}

.header-subtitle {
  font-size: 0.875rem;
  color: #6b7280;
  margin: 0.25rem 0 0 0;
}

.dialog-content {
  flex: 1;
  overflow-y: auto;
  padding: 2rem;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.form-group label {
  font-size: 0.875rem;
  font-weight: 600;
  color: #374151;
}

.form-input {
  padding: 0.625rem 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 0.5rem;
  font-size: 0.875rem;
  transition: all 0.2s;
}

.form-input:focus {
  outline: none;
  border-color: #f97316;
  box-shadow: 0 0 0 3px rgba(249, 115, 22, 0.1);
}

.form-hint {
  font-size: 0.75rem;
  color: #6b7280;
  margin: 0;
}

.form-link {
  color: #f97316;
  text-decoration: none;
  font-weight: 500;
  transition: color 0.2s;
}

.form-link:hover {
  color: #ea580c;
  text-decoration: underline;
}

.dialog-footer {
  background: #f9fafb;
  padding: 1.25rem 2rem;
  border-top: 1px solid #e5e7eb;
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  flex-shrink: 0;
}

.btn-cancel {
  padding: 0.625rem 1.5rem;
  border-radius: 0.5rem;
  border: 1px solid #d1d5db;
  color: #4b5563;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  background: white;
  font-size: 0.875rem;
}

.btn-cancel:hover {
  background: #f3f4f6;
  color: #1f2937;
}

.btn-confirm {
  padding: 0.625rem 2rem;
  border-radius: 0.5rem;
  background: linear-gradient(to right, #f97316, #ef4444);
  color: white;
  font-weight: 500;
  border: none;
  cursor: pointer;
  box-shadow: 0 4px 6px -1px rgba(249, 115, 22, 0.2);
  transition: all 0.2s;
  font-size: 0.875rem;
}

.btn-confirm:hover {
  box-shadow: 0 10px 15px -3px rgba(249, 115, 22, 0.3);
  transform: translateY(-1px);
}
</style>

