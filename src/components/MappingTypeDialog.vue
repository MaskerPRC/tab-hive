<template>
  <div v-if="show" class="mapping-type-dialog-overlay" @click.self="$emit('cancel')">
    <div class="mapping-type-dialog" :class="{ 'dark-mode': false }">
      <div class="dialog-header">
        <h3>选择映射类型</h3>
        <button @click="$emit('cancel')" class="close-btn">×</button>
      </div>
      <div class="dialog-body">
        <p class="dialog-hint">请选择要添加的映射类型：</p>
        <div class="mapping-type-options">
          <button @click="$emit('select', 'data')" class="mapping-type-btn data-mapping">
            <div class="btn-icon">📤</div>
            <div class="btn-content">
              <div class="btn-title">数据映射</div>
              <div class="btn-desc">提取元素的数据（文本、属性等）</div>
            </div>
          </button>
          <button @click="$emit('select', 'action')" class="mapping-type-btn action-mapping">
            <div class="btn-icon">⚡</div>
            <div class="btn-content">
              <div class="btn-title">交互映射</div>
              <div class="btn-desc">对元素执行操作（点击、输入等）</div>
            </div>
          </button>
        </div>
        <div v-if="pendingElementSelection" class="selector-preview">
          <div class="preview-label">选择器：</div>
          <code class="preview-selector">{{ pendingElementSelection.selector }}</code>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'MappingTypeDialog',
  props: {
    show: {
      type: Boolean,
      default: false
    },
    pendingElementSelection: {
      type: Object,
      default: null
    }
  },
  emits: ['select', 'cancel']
}
</script>

<style scoped>
.mapping-type-dialog-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10001;
}

.mapping-type-dialog {
  background: white;
  border-radius: 12px;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
  min-width: 400px;
  max-width: 500px;
  animation: fadeInZoom 0.3s ease-out;
}

.mapping-type-dialog.dark-mode {
  background: #2a2a2a;
  color: #e0e0e0;
}

@keyframes fadeInZoom {
  from {
    opacity: 0;
    transform: scale(0.95);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

.mapping-type-dialog .dialog-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 24px;
  border-bottom: 1px solid #e0e0e0;
}

.mapping-type-dialog.dark-mode .dialog-header {
  border-bottom-color: #444;
}

.mapping-type-dialog .dialog-header h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
}

.mapping-type-dialog .close-btn {
  width: 32px;
  height: 32px;
  border: none;
  background: transparent;
  font-size: 24px;
  cursor: pointer;
  color: #666;
  border-radius: 4px;
  transition: all 0.2s;
}

.mapping-type-dialog .close-btn:hover {
  background: #f0f0f0;
  color: #333;
}

.mapping-type-dialog.dark-mode .close-btn {
  color: #aaa;
}

.mapping-type-dialog.dark-mode .close-btn:hover {
  background: #3a3a3a;
  color: #e0e0e0;
}

.mapping-type-dialog .dialog-body {
  padding: 24px;
}

.mapping-type-dialog .dialog-hint {
  margin: 0 0 20px 0;
  color: #666;
  font-size: 14px;
}

.mapping-type-dialog.dark-mode .dialog-hint {
  color: #aaa;
}

.mapping-type-dialog .mapping-type-options {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 20px;
}

.mapping-type-dialog .mapping-type-btn {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px;
  background: #f8f9fa;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
  text-align: left;
}

.mapping-type-dialog .mapping-type-btn:hover {
  border-color: #4CAF50;
  background: #f0fff0;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(76, 175, 80, 0.2);
}

.mapping-type-dialog.dark-mode .mapping-type-btn {
  background: #3a3a3a;
  border-color: #555;
}

.mapping-type-dialog.dark-mode .mapping-type-btn:hover {
  border-color: #4CAF50;
  background: #2f4f2f;
}

.mapping-type-dialog .btn-icon {
  font-size: 32px;
  flex-shrink: 0;
}

.mapping-type-dialog .btn-content {
  flex: 1;
}

.mapping-type-dialog .btn-title {
  font-size: 16px;
  font-weight: 600;
  color: #333;
  margin-bottom: 4px;
}

.mapping-type-dialog.dark-mode .btn-title {
  color: #e0e0e0;
}

.mapping-type-dialog .btn-desc {
  font-size: 13px;
  color: #666;
}

.mapping-type-dialog.dark-mode .btn-desc {
  color: #aaa;
}

.mapping-type-dialog .selector-preview {
  padding: 12px;
  background: #f8f9fa;
  border-radius: 6px;
  border-left: 3px solid #4CAF50;
}

.mapping-type-dialog.dark-mode .selector-preview {
  background: #3a3a3a;
}

.mapping-type-dialog .preview-label {
  font-size: 12px;
  color: #666;
  margin-bottom: 6px;
  font-weight: 500;
}

.mapping-type-dialog.dark-mode .preview-label {
  color: #aaa;
}

.mapping-type-dialog .preview-selector {
  display: block;
  font-family: 'Courier New', monospace;
  font-size: 13px;
  color: #333;
  word-break: break-all;
}

.mapping-type-dialog.dark-mode .preview-selector {
  color: #e0e0e0;
}
</style>
