<template>
  <div v-if="show" class="custom-html-overlay" @mousedown="handleOverlayMouseDown" @click="handleOverlayClick">
    <div class="custom-html-dialog" @mousedown.stop>
      <div class="dialog-header">
        <h1>创建自定义网页</h1>
        <p class="header-subtitle">描述你的需求，AI 将为你生成网页代码</p>
      </div>

      <div class="dialog-content">
        <div class="form-group">
          <label for="requirement">需求描述</label>
          <textarea
            id="requirement"
            v-model="requirement"
            rows="6"
            placeholder="例如：创建一个待办事项列表，支持添加、删除和标记完成..."
            class="form-textarea"
          ></textarea>
          <p class="form-hint">详细描述你想要的网页功能和样式</p>
        </div>

        <div v-if="error" class="error-message">
          <i class="fa-solid fa-circle-exclamation"></i>
          {{ error }}
        </div>

        <div v-if="isGenerating" class="generating-message">
          <i class="fa-solid fa-spinner fa-spin"></i>
          正在生成 HTML 代码，请稍候...
        </div>
      </div>

      <div class="dialog-footer">
        <button class="btn-cancel" @click="handleCancel">取消</button>
        <button 
          class="btn-confirm" 
          @click="handleGenerate"
          :disabled="!requirement.trim() || isGenerating"
        >
          {{ isGenerating ? '生成中...' : '生成网页' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, watch } from 'vue'
import { useOverlayClick } from '../composables/useOverlayClick.js'
import { useLlmGenerator } from '../composables/useLlmGenerator.js'
import { useLlmConfig } from '../composables/useLlmConfig.js'

export default {
  name: 'CustomHtmlDialog',
  props: {
    show: {
      type: Boolean,
      required: true
    }
  },
  emits: ['confirm', 'cancel'],
  setup(props, { emit }) {
    const requirement = ref('')
    const { generateHtml, isGenerating, error } = useLlmGenerator()
    const { isValid } = useLlmConfig()

    // 监听 show 变化，重置表单
    watch(() => props.show, (newShow) => {
      if (newShow) {
        requirement.value = ''
        error.value = null
      }
    })

    const { handleOverlayMouseDown, handleOverlayClick } = useOverlayClick(() => {
      emit('cancel')
    })

    const handleGenerate = async () => {
      if (!requirement.value.trim()) {
        return
      }

      // 检查配置
      const { config: currentConfig } = useLlmConfig()
      console.log('[CustomHtmlDialog] 当前配置:', currentConfig.value)
      console.log('[CustomHtmlDialog] API URL:', currentConfig.value.apiUrl)
      console.log('[CustomHtmlDialog] API Key:', currentConfig.value.apiKey ? '已设置' : '未设置')
      
      if (!currentConfig.value.apiUrl || !currentConfig.value.apiKey) {
        error.value = '请先在设置中配置 LLM API'
        return
      }

      try {
        const html = await generateHtml(requirement.value.trim())
        emit('confirm', {
          title: '自定义网页',
          html: html,
          type: 'custom-html'
        })
      } catch (err) {
        // 错误已经在 useLlmGenerator 中设置
        console.error('[CustomHtmlDialog] 生成失败:', err)
        error.value = err.message || '生成失败'
      }
    }

    const handleCancel = () => {
      emit('cancel')
    }

    return {
      requirement,
      isGenerating,
      error,
      handleOverlayMouseDown,
      handleOverlayClick,
      handleGenerate,
      handleCancel
    }
  }
}
</script>

<style scoped>
.custom-html-overlay {
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

.custom-html-dialog {
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

.form-textarea {
  padding: 0.625rem 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 0.5rem;
  font-size: 0.875rem;
  font-family: inherit;
  resize: vertical;
  transition: all 0.2s;
}

.form-textarea:focus {
  outline: none;
  border-color: #f97316;
  box-shadow: 0 0 0 3px rgba(249, 115, 22, 0.1);
}

.form-hint {
  font-size: 0.75rem;
  color: #6b7280;
  margin: 0;
}

.error-message {
  padding: 0.75rem 1rem;
  background: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: 0.5rem;
  color: #dc2626;
  font-size: 0.875rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.generating-message {
  padding: 0.75rem 1rem;
  background: #f0f9ff;
  border: 1px solid #bae6fd;
  border-radius: 0.5rem;
  color: #0369a1;
  font-size: 0.875rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
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

.btn-confirm:hover:not(:disabled) {
  box-shadow: 0 10px 15px -3px rgba(249, 115, 22, 0.3);
  transform: translateY(-1px);
}

.btn-confirm:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>

