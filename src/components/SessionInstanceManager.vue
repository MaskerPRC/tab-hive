<template>
  <div v-if="visible" class="session-manager-overlay" @mousedown="handleOverlayMouseDown" @click="handleOverlayClick">
    <div class="session-manager-dialog" @mousedown.stop>
      <h3>Cookie共享实例管理</h3>
      
      <div class="info-box">
        <svg class="info-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="10"/>
          <path d="M12 16v-4M12 8h.01"/>
        </svg>
        <div class="info-text">
          <strong>什么是Cookie共享实例？</strong><br>
          同一实例的蜂巢会共享Cookie、LocalStorage等存储。不同实例之间完全隔离。<br>
          <strong>使用场景：</strong>多账号登录、测试环境隔离等。
        </div>
      </div>

      <div class="instances-list">
        <div 
          v-for="instance in sessionInstances" 
          :key="instance.id"
          class="instance-item"
          :class="{ 'is-default': instance.id === 'default' }"
        >
          <div class="instance-info">
            <div class="instance-header">
              <span class="instance-name">{{ instance.name }}</span>
              <span class="usage-badge" v-if="websites">
                {{ getUsageCount(instance.id) }} 个蜂巢
              </span>
            </div>
            <div class="instance-description" v-if="instance.description">
              {{ instance.description }}
            </div>
          </div>
          
          <div class="instance-actions">
            <button
              v-if="instance.id !== 'default'"
              class="btn-icon"
              @click="handleRename(instance)"
              title="重命名"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
              </svg>
            </button>
            <button
              v-if="instance.id !== 'default'"
              class="btn-icon btn-delete"
              @click="handleDelete(instance)"
              :disabled="getUsageCount(instance.id) > 0"
              :title="getUsageCount(instance.id) > 0 ? '有蜂巢正在使用此实例，无法删除' : '删除'"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="3 6 5 6 21 6"/>
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
              </svg>
            </button>
          </div>
        </div>
      </div>

      <div class="dialog-actions">
        <button class="btn-add" @click="handleAdd">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="12" y1="5" x2="12" y2="19"/>
            <line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          <span>新建实例</span>
        </button>
        <button class="btn-close" @click="$emit('close')">关闭</button>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, inject } from 'vue'
import { useSessionManager } from '../composables/useSessionManager.js'

export default {
  name: 'SessionInstanceManager',
  props: {
    visible: {
      type: Boolean,
      required: true
    },
    websites: {
      type: Array,
      default: () => []
    }
  },
  emits: ['close'],
  setup(props, { emit }) {
    const { 
      sessionInstances, 
      addSessionInstance, 
      deleteSessionInstance, 
      renameSessionInstance,
      getInstanceUsageCount 
    } = useSessionManager()

    const showPrompt = inject('showPrompt')
    const showConfirm = inject('showConfirm')

    const mouseDownOnOverlay = ref(false)

    const handleOverlayMouseDown = (event) => {
      if (event.target === event.currentTarget) {
        mouseDownOnOverlay.value = true
      } else {
        mouseDownOnOverlay.value = false
      }
    }

    const handleOverlayClick = (event) => {
      if (event.target === event.currentTarget && mouseDownOnOverlay.value) {
        emit('close')
      }
      mouseDownOnOverlay.value = false
    }

    const getUsageCount = (instanceId) => {
      return getInstanceUsageCount(instanceId, props.websites)
    }

    const handleAdd = async () => {
      // 默认命名为 "实例1"、"实例2" 等
      const defaultName = `实例${sessionInstances.value.length}`
      
      if (!showPrompt) {
        const name = prompt('请输入新实例名称：', defaultName)
        if (name && name.trim()) {
          addSessionInstance(name.trim())
        }
        return
      }

      const name = await showPrompt({
        title: '创建新的Cookie共享实例',
        message: '请输入实例名称（例如：账号2、测试环境等）',
        placeholder: defaultName
      })

      if (name && name.trim()) {
        addSessionInstance(name.trim())
      }
    }

    const handleRename = async (instance) => {
      if (!showPrompt) {
        const newName = prompt('请输入新名称：', instance.name)
        if (newName && newName.trim() && newName !== instance.name) {
          renameSessionInstance(instance.id, newName.trim())
        }
        return
      }

      const newName = await showPrompt({
        title: '重命名实例',
        message: '请输入新的实例名称',
        defaultValue: instance.name
      })

      if (newName && newName.trim() && newName !== instance.name) {
        renameSessionInstance(instance.id, newName.trim())
      }
    }

    const handleDelete = async (instance) => {
      const usageCount = getUsageCount(instance.id)
      
      if (usageCount > 0) {
        if (!showConfirm) {
          alert(`此实例正被 ${usageCount} 个蜂巢使用，无法删除`)
        } else {
          await showConfirm({
            title: '无法删除',
            message: `此实例正被 ${usageCount} 个蜂巢使用，无法删除。\n请先将这些蜂巢切换到其他实例。`
          })
        }
        return
      }

      if (!showConfirm) {
        if (confirm(`确定要删除实例 "${instance.name}" 吗？`)) {
          deleteSessionInstance(instance.id)
        }
        return
      }

      const confirmed = await showConfirm({
        title: '确认删除',
        message: `确定要删除实例 "${instance.name}" 吗？此操作不可恢复。`
      })

      if (confirmed) {
        deleteSessionInstance(instance.id)
      }
    }

    return {
      sessionInstances,
      getUsageCount,
      handleAdd,
      handleRename,
      handleDelete,
      handleOverlayMouseDown,
      handleOverlayClick,
      mouseDownOnOverlay
    }
  }
}
</script>

<style scoped>
.session-manager-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
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

.session-manager-dialog {
  background: white;
  border-radius: 16px;
  padding: 32px;
  max-width: 700px;
  width: 90%;
  max-height: 80vh;
  overflow-y: auto;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
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

.session-manager-dialog h3 {
  color: var(--primary-color);
  margin: 0 0 24px 0;
  font-size: 24px;
  text-align: center;
}

.info-box {
  display: flex;
  gap: 12px;
  padding: 16px;
  background: #f0f7ff;
  border-left: 4px solid #3b82f6;
  border-radius: 8px;
  margin-bottom: 24px;
}

.info-icon {
  flex-shrink: 0;
  width: 24px;
  height: 24px;
  color: #3b82f6;
}

.info-text {
  font-size: 13px;
  line-height: 1.6;
  color: #1e40af;
}

.info-text strong {
  display: block;
  margin-bottom: 4px;
}

.instances-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 24px;
  max-height: 400px;
  overflow-y: auto;
}

.instance-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 16px;
  background: #f8f8f8;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  transition: all 0.3s;
}

.instance-item:hover {
  background: #fff5f0;
  border-color: var(--primary-color);
}

.instance-item.is-default {
  background: linear-gradient(135deg, #fff9f0 0%, #ffe8d6 100%);
  border-color: var(--primary-color);
}

.instance-info {
  flex: 1;
  min-width: 0;
}

.instance-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 4px;
}

.instance-name {
  font-size: 16px;
  font-weight: 600;
  color: #333;
}

.usage-badge {
  display: inline-flex;
  align-items: center;
  padding: 2px 8px;
  background: var(--primary-color);
  color: white;
  border-radius: 12px;
  font-size: 11px;
  font-weight: 600;
}

.instance-description {
  font-size: 13px;
  color: #666;
  line-height: 1.4;
}

.instance-actions {
  display: flex;
  gap: 8px;
}

.btn-icon {
  padding: 8px;
  background: white;
  border: 1px solid #ddd;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.3s;
  display: flex;
  align-items: center;
  justify-content: center;
}

.btn-icon:hover:not(:disabled) {
  background: var(--primary-color);
  border-color: var(--primary-color);
}

.btn-icon:hover:not(:disabled) svg {
  stroke: white;
}

.btn-icon:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.btn-delete:hover:not(:disabled) {
  background: #ef4444;
  border-color: #ef4444;
}

.dialog-actions {
  display: flex;
  gap: 12px;
  justify-content: center;
  padding-top: 20px;
  border-top: 2px solid #f0f0f0;
}

.btn-add {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 24px;
  background: var(--primary-color);
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 600;
  transition: all 0.3s;
}

.btn-add:hover {
  background: var(--primary-hover);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(255, 92, 0, 0.3);
}

.btn-close {
  padding: 12px 24px;
  background: #e0e0e0;
  color: #666;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 600;
  transition: all 0.3s;
}

.btn-close:hover {
  background: #d0d0d0;
}

/* 滚动条样式 */
.instances-list::-webkit-scrollbar {
  width: 6px;
}

.instances-list::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 3px;
}

.instances-list::-webkit-scrollbar-thumb {
  background: #ccc;
  border-radius: 3px;
}

.instances-list::-webkit-scrollbar-thumb:hover {
  background: #999;
}
</style>

