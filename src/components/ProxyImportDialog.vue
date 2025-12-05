<template>
  <div v-if="show" class="edit-overlay" @click="$emit('close')">
    <div class="edit-dialog" @click.stop>
      <h4>导入订阅链接</h4>
      <div class="form-group">
        <label>订阅链接</label>
        <textarea 
          v-model="url" 
          rows="3" 
          placeholder="输入订阅链接（支持 vmess://、ss:// 等格式）"
        ></textarea>
      </div>
      <div class="form-actions">
        <button type="button" class="btn-secondary" @click="$emit('close')">取消</button>
        <button type="button" class="btn-primary" @click="handleImport" :disabled="importing">
          {{ importing ? '导入中...' : '导入' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, watch } from 'vue'

export default {
  name: 'ProxyImportDialog',
  props: {
    show: {
      type: Boolean,
      default: false
    },
    importing: {
      type: Boolean,
      default: false
    }
  },
  emits: ['close', 'import'],
  setup(props, { emit }) {
    const url = ref('')

    // 监听 show 变化，重置 URL
    watch(() => props.show, (show) => {
      if (show) {
        url.value = ''
      }
    })

    const handleImport = () => {
      emit('import', url.value)
    }

    return {
      url,
      handleImport
    }
  }
}
</script>

<style scoped>
.edit-overlay {
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

.edit-dialog {
  background: white;
  border-radius: 12px;
  padding: 24px;
  width: 90%;
  max-width: 500px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
}

.edit-dialog h4 {
  margin: 0 0 20px 0;
  color: var(--primary-color, #FF5C00);
}

.form-group {
  margin-bottom: 16px;
}

.form-group label {
  display: block;
  margin-bottom: 6px;
  font-weight: 500;
  color: #333;
}

.form-group textarea {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 14px;
  font-family: inherit;
  resize: vertical;
  min-height: 80px;
}

.form-actions {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  margin-top: 24px;
}

.btn-primary,
.btn-secondary {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 10px 16px;
  border-radius: 6px;
  border: none;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.3s;
}

.btn-primary {
  background: var(--primary-color, #FF5C00);
  color: white;
}

.btn-primary:hover {
  background: var(--primary-hover, #e64e00);
}

.btn-secondary {
  background: #f0f0f0;
  color: #666;
}

.btn-secondary:hover {
  background: #e0e0e0;
}

.btn-primary:disabled,
.btn-secondary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>

