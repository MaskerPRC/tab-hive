<template>
  <Transition name="dialog-fade">
    <div v-if="visible" class="dialog-overlay" @mousedown="handleOverlayMouseDown" @click="handleOverlayClick">
      <div class="dialog-box" @click.stop @mousedown.stop>
        <div class="dialog-header">
          <div class="dialog-title-wrapper">
            <h3>{{ title || $t('dialog.title') }}</h3>
          </div>
          <button v-if="type === 'alert'" class="dialog-close" @click="handleConfirm" title="关闭">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>
        <div class="dialog-body">
          <p v-if="message">{{ message }}</p>
          <input 
            v-if="type === 'prompt'" 
            v-model="inputValue"
            type="text"
            class="dialog-input"
            :placeholder="placeholder"
            @keyup.enter="handleConfirm"
            @keyup.esc="handleCancel"
            ref="inputRef"
          />
        </div>
        <div class="dialog-footer">
          <button v-if="type !== 'alert'" class="btn-cancel" @click="handleCancel">{{ $t('common.cancel') }}</button>
          <button class="btn-confirm" @click="handleConfirm">{{ $t('common.confirm') }}</button>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script>
import { ref, watch, nextTick } from 'vue'
import { useI18n } from 'vue-i18n'

export default {
  name: 'Dialog',
  props: {
    visible: {
      type: Boolean,
      default: false
    },
    type: {
      type: String,
      default: 'confirm', // 'confirm', 'prompt', or 'alert'
      validator: (value) => ['confirm', 'prompt', 'alert'].includes(value)
    },
    title: {
      type: String,
      default: ''
    },
    message: {
      type: String,
      default: ''
    },
    placeholder: {
      type: String,
      default: ''
    },
    defaultValue: {
      type: String,
      default: ''
    }
  },
  emits: ['confirm', 'cancel', 'update:visible'],
  setup(props, { emit }) {
    const { t } = useI18n()
    const inputValue = ref('')
    const inputRef = ref(null)
    const mouseDownOnOverlay = ref(false)

    // 监听 visible 变化，自动聚焦输入框
    watch(() => props.visible, (newVal) => {
      if (newVal) {
        inputValue.value = props.defaultValue
        mouseDownOnOverlay.value = false
        if (props.type === 'prompt') {
          nextTick(() => {
            inputRef.value?.focus()
            inputRef.value?.select()
          })
        }
      }
    })

    const handleConfirm = () => {
      if (props.type === 'prompt') {
        emit('confirm', inputValue.value)
      } else {
        emit('confirm', true)
      }
      emit('update:visible', false)
    }

    const handleCancel = () => {
      if (props.type !== 'alert') {
        emit('cancel')
        emit('update:visible', false)
      }
    }

    const handleOverlayMouseDown = (event) => {
      // 只有当直接点击 overlay 时才标记
      if (event.target === event.currentTarget) {
        mouseDownOnOverlay.value = true
      } else {
        mouseDownOnOverlay.value = false
      }
    }

    const handleOverlayClick = (event) => {
      // 只有当 mousedown 和 click 都发生在 overlay 上时才关闭
      if (event.target === event.currentTarget && mouseDownOnOverlay.value) {
        if (props.type === 'alert') {
          handleConfirm()
        } else {
          handleCancel()
        }
      }
      mouseDownOnOverlay.value = false
    }

    return {
      inputValue,
      inputRef,
      handleConfirm,
      handleCancel,
      handleOverlayMouseDown,
      handleOverlayClick
    }
  }
}
</script>

<style scoped>
.dialog-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10200; /* 确保在其他对话框之上 */
}

.dialog-box {
  background: white;
  border-radius: 16px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(0, 0, 0, 0.05);
  min-width: 420px;
  max-width: 500px;
  max-height: 85vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  animation: dialog-in 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
  transform-origin: center;
}

@keyframes dialog-in {
  from {
    opacity: 0;
    transform: scale(0.9) translateY(-10px);
  }
  to {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}

.dialog-header {
  padding: 20px 24px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
  background: linear-gradient(135deg, var(--primary-light, #fff5f0) 0%, #ffffff 100%);
  display: flex;
  align-items: center;
  justify-content: space-between;
  position: relative;
}

.dialog-title-wrapper {
  flex: 1;
}

.dialog-header h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: var(--primary-color, #ff5c00);
  letter-spacing: -0.01em;
}

.dialog-close {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  border: none;
  background: transparent;
  color: #666;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
  margin-left: 12px;
  flex-shrink: 0;
}

.dialog-close:hover {
  background: rgba(0, 0, 0, 0.05);
  color: #333;
}

.dialog-close:active {
  transform: scale(0.95);
}

.dialog-body {
  padding: 28px 24px;
  flex: 1;
  overflow-y: auto;
  min-height: 0;
  /* 自定义滚动条样式 - 保持圆角效果 */
  scrollbar-width: thin;
  scrollbar-color: #FF5C00 transparent;
  padding-right: 8px; /* 为滚动条留出空间 */
  margin-right: -8px; /* 抵消右边距 */
}

.dialog-body::-webkit-scrollbar {
  width: 6px;
}

.dialog-body::-webkit-scrollbar-track {
  background: transparent;
}

.dialog-body::-webkit-scrollbar-thumb {
  background: #FF5C00;
  border-radius: 3px;
  transition: background 0.3s ease;
  margin: 2px;
}

.dialog-body::-webkit-scrollbar-thumb:hover {
  background: #e64e00;
}

.dialog-body p {
  margin: 0;
  color: #1e293b;
  font-size: 15px;
  line-height: 1.6;
  white-space: pre-wrap;
  word-break: break-word;
}

.dialog-input {
  width: 100%;
  padding: 12px 16px;
  border: 2px solid #e2e8f0;
  border-radius: 8px;
  font-size: 14px;
  outline: none;
  transition: all 0.2s;
  box-sizing: border-box;
  background: #ffffff;
  color: #1e293b;
}

.dialog-input:focus {
  border-color: var(--primary-color, #ff5c00);
  box-shadow: 0 0 0 3px rgba(255, 92, 0, 0.1);
}

.dialog-input::placeholder {
  color: #94a3b8;
}

.dialog-footer {
  padding: 20px 24px;
  border-top: 1px solid rgba(0, 0, 0, 0.06);
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  flex-shrink: 0;
  background: #fafafa;
}

.dialog-footer button {
  padding: 10px 24px;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  min-width: 80px;
}

.btn-cancel {
  background: #f1f5f9;
  color: #64748b;
}

.btn-cancel:hover {
  background: #e2e8f0;
  color: #475569;
  transform: translateY(-1px);
}

.btn-cancel:active {
  transform: translateY(0);
}

.btn-confirm {
  background: var(--primary-color, #ff5c00);
  color: white;
  box-shadow: 0 2px 8px rgba(255, 92, 0, 0.2);
}

.btn-confirm:hover {
  background: var(--primary-hover, #e64e00);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(255, 92, 0, 0.35);
}

.btn-confirm:active {
  transform: translateY(0);
  box-shadow: 0 2px 6px rgba(255, 92, 0, 0.25);
}

/* 过渡动画 */
.dialog-fade-enter-active,
.dialog-fade-leave-active {
  transition: opacity 0.2s ease;
}

.dialog-fade-enter-from,
.dialog-fade-leave-to {
  opacity: 0;
}

.dialog-fade-enter-active .dialog-box {
  animation: dialog-in 0.2s ease-out;
}

.dialog-fade-leave-active .dialog-box {
  animation: dialog-out 0.2s ease-in;
}

@keyframes dialog-out {
  from {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
  to {
    opacity: 0;
    transform: scale(0.95) translateY(-10px);
  }
}
</style>

