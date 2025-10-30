<template>
  <Transition name="dialog-fade">
    <div v-if="visible" class="dialog-overlay" @mousedown="handleOverlayMouseDown" @click="handleOverlayClick">
      <div class="dialog-box" @click.stop @mousedown.stop>
        <div class="dialog-header">
          <h3>{{ title }}</h3>
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
          <button class="btn-cancel" @click="handleCancel">取消</button>
          <button class="btn-confirm" @click="handleConfirm">确定</button>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script>
import { ref, watch, nextTick } from 'vue'

export default {
  name: 'Dialog',
  props: {
    visible: {
      type: Boolean,
      default: false
    },
    type: {
      type: String,
      default: 'confirm', // 'confirm' or 'prompt'
      validator: (value) => ['confirm', 'prompt'].includes(value)
    },
    title: {
      type: String,
      default: '提示'
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
      emit('cancel')
      emit('update:visible', false)
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
        handleCancel()
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
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding-top: 20vh; /* 向下偏移 */
  z-index: 10001; /* 确保在其他对话框之上 */
}

.dialog-box {
  background: white;
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
  min-width: 400px;
  max-width: 500px;
  max-height: 80vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  animation: dialog-in 0.2s ease-out;
}

@keyframes dialog-in {
  from {
    opacity: 0;
    transform: scale(0.9) translateY(-20px);
  }
  to {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}

.dialog-header {
  padding: 20px 24px;
  border-bottom: 1px solid #e0e0e0;
  background: var(--primary-light, #fff5f0);
}

.dialog-header h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: var(--primary-color, #ff5c00);
}

.dialog-body {
  padding: 24px;
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
  margin: 0 0 16px 0;
  color: #333;
  font-size: 14px;
  line-height: 1.6;
  white-space: pre-wrap;
}

.dialog-input {
  width: 100%;
  padding: 12px 16px;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  font-size: 14px;
  outline: none;
  transition: border-color 0.3s;
  box-sizing: border-box;
}

.dialog-input:focus {
  border-color: var(--primary-color, #ff5c00);
}

.dialog-footer {
  padding: 16px 24px;
  border-top: 1px solid #e0e0e0;
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  flex-shrink: 0;
}

.dialog-footer button {
  padding: 10px 24px;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s;
}

.btn-cancel {
  background: #f5f5f5;
  color: #666;
}

.btn-cancel:hover {
  background: #e0e0e0;
}

.btn-confirm {
  background: var(--primary-color, #ff5c00);
  color: white;
}

.btn-confirm:hover {
  background: var(--primary-hover, #e64e00);
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(255, 92, 0, 0.3);
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
    transform: scale(0.9) translateY(-20px);
  }
}
</style>

