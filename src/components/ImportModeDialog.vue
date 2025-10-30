<template>
  <div v-if="visible" class="import-dialog-overlay" @mousedown="handleOverlayMouseDown" @click="handleOverlayClick">
    <div class="import-dialog" @mousedown.stop>
      <h3>{{ $t('importMode.title') }}</h3>
      <p class="dialog-desc">{{ $t('importMode.description') }}</p>

      <div class="import-options">
        <div class="import-option" @click="handleSelectMode('realtime')">
          <div class="option-icon">🔗</div>
          <div class="option-content">
            <h4>{{ $t('importMode.realtimeSync.title') }}</h4>
            <p>{{ $t('importMode.realtimeSync.description') }}</p>
            <span class="option-note">{{ $t('importMode.realtimeSync.note') }}</span>
          </div>
        </div>

        <div class="import-option" @click="handleSelectMode('copy')">
          <div class="option-icon">📋</div>
          <div class="option-content">
            <h4>{{ $t('importMode.copy.title') }}</h4>
            <p>{{ $t('importMode.copy.description') }}</p>
            <span class="option-note">{{ $t('importMode.copy.note') }}</span>
          </div>
        </div>
      </div>

      <button class="cancel-btn" @click="handleClose">{{ $t('importMode.cancel') }}</button>
    </div>
  </div>
</template>

<script>
import { ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'

export default {
  name: 'ImportModeDialog',
  props: {
    visible: {
      type: Boolean,
      default: false
    }
  },
  emits: ['close', 'select-mode'],
  setup(props, { emit }) {
    const mouseDownOnOverlay = ref(false)

    // 监听对话框显示，重置状态
    watch(() => props.visible, (newVal) => {
      if (newVal) {
        mouseDownOnOverlay.value = false
      }
    })

    const handleClose = () => {
      emit('close')
    }

    const handleSelectMode = (mode) => {
      emit('select-mode', mode)
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
        handleClose()
      }
      mouseDownOnOverlay.value = false
    }

    return {
      handleClose,
      handleSelectMode,
      handleOverlayMouseDown,
      handleOverlayClick
    }
  }
}
</script>

<style scoped>
/* 导入模式选择对话框 */
.import-dialog-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10001;
  backdrop-filter: blur(4px);
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

.import-dialog {
  background: white;
  border-radius: 16px;
  padding: 32px;
  max-width: 500px;
  width: 90%;
  max-height: 80vh;
  overflow-y: auto;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  animation: slideIn 0.3s ease-out;
  /* 自定义滚动条样式 - 保持圆角效果 */
  scrollbar-width: thin;
  scrollbar-color: #FF5C00 transparent;
  padding-right: 8px; /* 为滚动条留出空间 */
  margin-right: -8px; /* 抵消右边距 */
}

.import-dialog::-webkit-scrollbar {
  width: 6px;
}

.import-dialog::-webkit-scrollbar-track {
  background: transparent;
}

.import-dialog::-webkit-scrollbar-thumb {
  background: #FF5C00;
  border-radius: 3px;
  transition: background 0.3s ease;
  margin: 2px;
}

.import-dialog::-webkit-scrollbar-thumb:hover {
  background: #e64e00;
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(-30px) scale(0.95);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

.import-dialog h3 {
  margin: 0 0 12px 0;
  font-size: 24px;
  color: #333;
  font-weight: 600;
}

.dialog-desc {
  color: #666;
  font-size: 15px;
  margin: 0 0 24px 0;
  line-height: 1.5;
}

.import-options {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 24px;
}

.import-option {
  display: flex;
  gap: 16px;
  padding: 20px;
  border: 2px solid #e0e0e0;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
  background: #fafafa;
}

.import-option:hover {
  border-color: #FF5C00;
  background: #fff5f0;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(255, 92, 0, 0.15);
}

.option-icon {
  font-size: 32px;
  line-height: 1;
  flex-shrink: 0;
}

.option-content {
  flex: 1;
}

.option-content h4 {
  margin: 0 0 8px 0;
  font-size: 17px;
  color: #333;
  font-weight: 600;
}

.option-content p {
  margin: 0 0 8px 0;
  font-size: 14px;
  color: #666;
  line-height: 1.5;
}

.option-note {
  display: block;
  font-size: 12px;
  color: #999;
  font-style: italic;
  line-height: 1.4;
}

.cancel-btn {
  width: 100%;
  padding: 12px;
  background: transparent;
  color: #666;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 15px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.cancel-btn:hover {
  background: #f5f5f5;
  color: #333;
  border-color: #ccc;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .import-dialog {
    padding: 24px;
  }

  .import-dialog h3 {
    font-size: 20px;
  }

  .import-option {
    padding: 16px;
  }

  .option-icon {
    font-size: 28px;
  }

  .option-content h4 {
    font-size: 16px;
  }
}
</style>

