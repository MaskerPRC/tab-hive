<template>
  <Teleport to="body">
    <div v-if="show" class="dialog-overlay" @click.self="$emit('cancel')">
      <div class="dialog-container rearrange-dialog">
        <div class="dialog-header">
          <h3>{{ $t('rearrangeDialog.title') || '重新排列' }}</h3>
          <button class="close-btn" @click="$emit('cancel')">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        <div class="dialog-content">
          <div class="form-group">
            <label>{{ $t('rearrangeDialog.columns') || '列数' }}</label>
            <input
              type="number"
              v-model.number="localConfig.cols"
              min="1"
              max="10"
              class="form-input"
            />
          </div>

          <div class="form-group">
            <label>{{ $t('rearrangeDialog.itemWidth') || '窗口宽度 (px)' }}</label>
            <input
              type="number"
              v-model.number="localConfig.width"
              min="100"
              max="2000"
              step="10"
              class="form-input"
            />
          </div>

          <div class="form-group">
            <label>{{ $t('rearrangeDialog.itemHeight') || '窗口高度 (px)' }}</label>
            <input
              type="number"
              v-model.number="localConfig.height"
              min="100"
              max="2000"
              step="10"
              class="form-input"
            />
          </div>

          <div class="form-group">
            <label>{{ $t('rearrangeDialog.scale') || '窗口放大倍数' }}</label>
            <input
              type="number"
              v-model.number="localConfig.scale"
              min="0.5"
              max="3"
              step="0.1"
              class="form-input"
            />
            <small class="form-hint">{{ $t('rearrangeDialog.scaleHint') || '1.0 为原始大小，2.0 为放大一倍' }}</small>
          </div>

          <div class="preview-section">
            <h4>{{ $t('rearrangeDialog.preview') || '预览' }}</h4>
            <div class="preview-info">
              <p>{{ $t('rearrangeDialog.finalSize') || '最终窗口大小' }}: {{ Math.round(localConfig.width * localConfig.scale) }} × {{ Math.round(localConfig.height * localConfig.scale) }} px</p>
              <p>{{ $t('rearrangeDialog.layout') || '布局' }}: {{ localConfig.cols }} {{ $t('rearrangeDialog.columns') || '列' }}</p>
            </div>
          </div>
        </div>

        <div class="dialog-footer">
          <button class="btn-secondary" @click="resetToDefault">
            {{ $t('rearrangeDialog.reset') || '恢复默认' }}
          </button>
          <div class="footer-actions">
            <button class="btn-secondary" @click="$emit('cancel')">
              {{ $t('common.cancel') || '取消' }}
            </button>
            <button class="btn-primary" @click="handleConfirm">
              {{ $t('common.confirm') || '确认' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script>
import { ref, watch } from 'vue'

export default {
  name: 'RearrangeDialog',
  props: {
    show: {
      type: Boolean,
      default: false
    }
  },
  emits: ['confirm', 'cancel'],
  setup(props, { emit }) {
    const defaultConfig = {
      cols: 3,
      width: 400,
      height: 300,
      scale: 2.0
    }

    const localConfig = ref({ ...defaultConfig })

    // 当对话框显示时，重置为默认值
    watch(() => props.show, (newVal) => {
      if (newVal) {
        localConfig.value = { ...defaultConfig }
      }
    })

    const resetToDefault = () => {
      localConfig.value = { ...defaultConfig }
    }

    const handleConfirm = () => {
      emit('confirm', { ...localConfig.value })
    }

    return {
      localConfig,
      resetToDefault,
      handleConfirm
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
  z-index: 10000;
}

.dialog-container {
  background: white;
  border-radius: 8px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  max-height: 90vh;
  display: flex;
  flex-direction: column;
}

.dialog-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  border-bottom: 1px solid #eee;
}

.dialog-header h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #333;
}

.rearrange-dialog {
  width: 500px;
  max-width: 90vw;
}

.dialog-content {
  padding: 20px;
  max-height: 70vh;
  overflow-y: auto;
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  font-weight: 500;
  color: #333;
  font-size: 14px;
}

.form-input {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
  transition: border-color 0.2s;
}

.form-input:focus {
  outline: none;
  border-color: #2196F3;
}

.form-hint {
  display: block;
  margin-top: 4px;
  font-size: 12px;
  color: #666;
}

.preview-section {
  margin-top: 24px;
  padding: 16px;
  background: #f5f5f5;
  border-radius: 4px;
}

.preview-section h4 {
  margin: 0 0 12px 0;
  font-size: 14px;
  font-weight: 500;
  color: #333;
}

.preview-info {
  font-size: 13px;
  color: #666;
}

.preview-info p {
  margin: 4px 0;
}

.dialog-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-top: 1px solid #eee;
}

.footer-actions {
  display: flex;
  gap: 10px;
}

.btn-primary,
.btn-secondary {
  padding: 8px 20px;
  border: none;
  border-radius: 4px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-primary {
  background: #2196F3;
  color: white;
}

.btn-primary:hover {
  background: #1976D2;
}

.btn-secondary {
  background: #f5f5f5;
  color: #333;
}

.btn-secondary:hover {
  background: #e0e0e0;
}

.close-btn {
  background: none;
  border: none;
  cursor: pointer;
  padding: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #666;
  transition: color 0.2s;
}

.close-btn:hover {
  color: #333;
}
</style>

