<template>
  <div v-if="show" class="edit-website-overlay" @mousedown="handleOverlayMouseDown" @click="handleOverlayClick">
    <div class="edit-website-dialog" @mousedown.stop>
      <h3>{{ editingIndex === -1 ? '添加网站' : '编辑网站' }}</h3>
      
      <!-- 第一行：网站名称和网站地址 -->
      <WebsiteBasicInfo
        v-model:title="localWebsite.title"
        v-model:url="localWebsite.url"
        :auto-focus="show"
        @enter="handleConfirm"
      />
      
      <!-- 第二行：设备类型、目标选择器和静音选项 -->
      <div class="form-row">
        <DeviceTypeSelector
          v-model="localWebsite.deviceType"
        />
        
        <TargetSelectorList
          v-model="localWebsite.targetSelectors"
          @enter="handleConfirm"
        />
        
        <AudioVisualSettings
          v-model:muted="localWebsite.muted"
          v-model:dark-mode="localWebsite.darkMode"
        />
      </div>
      
      <!-- 第三行：Session实例选择和内边距配置 -->
      <div class="form-row">
        <SessionInstanceSelector
          v-model="localWebsite.sessionInstance"
          :session-instances="sessionInstances"
          @create-instance="handleCreateNewInstance"
          @manage-instances="handleOpenSessionManager"
        />
        
        <PaddingConfig
          v-model="localWebsite.padding"
          @enter="handleConfirm"
        />
      </div>
      
      <!-- 自动刷新间隔 -->
      <AutoRefreshConfig
        v-model="localWebsite.autoRefreshInterval"
        @enter="handleConfirm"
      />
      
      <!-- 操作按钮 -->
      <div class="form-actions">
        <button class="btn-confirm" @click="handleConfirm">确定</button>
        <button class="btn-cancel" @click="$emit('cancel')">取消</button>
      </div>
    </div>
  </div>
</template>

<script>
import { inject } from 'vue'
import { useSessionManager } from '../composables/useSessionManager.js'
import { useWebsiteForm } from '../composables/useWebsiteForm.js'
import { useOverlayClick } from '../composables/useOverlayClick.js'
import WebsiteBasicInfo from './WebsiteEditDialog/WebsiteBasicInfo.vue'
import DeviceTypeSelector from './WebsiteEditDialog/DeviceTypeSelector.vue'
import TargetSelectorList from './WebsiteEditDialog/TargetSelectorList.vue'
import AudioVisualSettings from './WebsiteEditDialog/AudioVisualSettings.vue'
import SessionInstanceSelector from './WebsiteEditDialog/SessionInstanceSelector.vue'
import PaddingConfig from './WebsiteEditDialog/PaddingConfig.vue'
import AutoRefreshConfig from './WebsiteEditDialog/AutoRefreshConfig.vue'

export default {
  name: 'WebsiteEditDialog',
  components: {
    WebsiteBasicInfo,
    DeviceTypeSelector,
    TargetSelectorList,
    AudioVisualSettings,
    SessionInstanceSelector,
    PaddingConfig,
    AutoRefreshConfig
  },
  props: {
    show: {
      type: Boolean,
      required: true
    },
    editingIndex: {
      type: Number,
      default: null
    },
    website: {
      type: Object,
      default: () => ({
        title: '',
        url: '',
        deviceType: 'desktop',
        targetSelector: '',
        targetSelectors: [],
        autoRefreshInterval: 0,
        sessionInstance: 'default',
        padding: 10,
        muted: false,
        darkMode: false
      })
    }
  },
  emits: ['confirm', 'cancel'],
  setup(props, { emit }) {
    // Session管理
    const { sessionInstances, addSessionInstance } = useSessionManager()
    const showPrompt = inject('showPrompt')
    const openSessionManager = inject('openSessionManager')

    // 表单数据管理
    const { localWebsite, handleConfirm: validateAndSubmit } = useWebsiteForm(props, emit)

    // 弹窗交互
    const { handleOverlayMouseDown, handleOverlayClick } = useOverlayClick(() => {
      emit('cancel')
    })

    // 确认提交
    const handleConfirm = () => {
      validateAndSubmit()
    }

    // 创建新的session实例
    const handleCreateNewInstance = async () => {
      // 使用当前蜂巢的名称作为实例的默认命名
      const defaultName = localWebsite.value.title 
        ? `${localWebsite.value.title}` 
        : `共享实例 ${sessionInstances.value.length}`
      
      if (!showPrompt) {
        const name = prompt('请输入新实例名称：', defaultName)
        if (name && name.trim()) {
          const newInstance = addSessionInstance(name.trim())
          localWebsite.value.sessionInstance = newInstance.id
        }
        return
      }

      const name = await showPrompt({
        title: '创建新的Cookie共享实例',
        message: '请输入实例名称（例如：账号2、测试环境等）',
        placeholder: defaultName
      })

      if (name && name.trim()) {
        const newInstance = addSessionInstance(name.trim())
        localWebsite.value.sessionInstance = newInstance.id
      }
    }

    // 打开实例管理器
    const handleOpenSessionManager = () => {
      if (openSessionManager) {
        openSessionManager()
      }
    }

    return {
      localWebsite,
      sessionInstances,
      handleConfirm,
      handleOverlayMouseDown,
      handleOverlayClick,
      handleCreateNewInstance,
      handleOpenSessionManager
    }
  }
}
</script>

<style scoped>
.edit-website-overlay {
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

.edit-website-dialog {
  background: white;
  border-radius: 16px;
  padding: 32px;
  max-width: 1000px;
  width: 90%;
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

.edit-website-dialog h3 {
  color: var(--primary-color);
  margin: 0 0 24px 0;
  font-size: 24px;
  text-align: center;
}

.form-row {
  display: flex;
  gap: 20px;
  margin-bottom: 20px;
}

.form-row > * {
  flex: 1;
  margin-bottom: 0;
}

.form-actions {
  display: flex;
  gap: 10px;
  justify-content: center;
  margin-top: 10px;
}

.btn-confirm {
  background: var(--primary-color);
  color: white;
  border: none;
  padding: 12px 30px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: background 0.3s;
}

.btn-confirm:hover {
  background: var(--primary-hover);
}

.btn-cancel {
  background: #e0e0e0;
  color: #666;
  border: none;
  padding: 12px 30px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: background 0.3s;
}

.btn-cancel:hover {
  background: #d0d0d0;
}

/* 响应式设计：在较小屏幕上切换回纵向布局 */
@media (max-width: 900px) {
  .edit-website-dialog {
    max-width: 600px;
  }
  
  .form-row {
    flex-direction: column;
    gap: 0;
  }
  
  .form-row > * {
    margin-bottom: 20px;
  }
}
</style>
