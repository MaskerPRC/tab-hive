<template>
  <div v-if="show" class="edit-website-overlay" @mousedown="handleOverlayMouseDown" @click="handleOverlayClick">
    <div class="edit-website-dialog" @mousedown.stop>
      <h3>{{ editingIndex === -1 ? '添加网站' : '编辑网站' }}</h3>
      
      <!-- 核心信息区：网站名称和网站地址 -->
      <div class="section-core">
        <WebsiteBasicInfo
          v-model:title="localWebsite.title"
          v-model:url="localWebsite.url"
          :auto-focus="show"
          @enter="handleConfirm"
        />
      </div>
      
      <!-- 常用设置区：设备类型、静音、暗黑模式 -->
      <div class="section-common">
        <div class="section-title">⚙️ 常用设置</div>
        <div class="form-row common-settings">
          <DeviceTypeSelector
            v-model="localWebsite.deviceType"
          />
          <AudioVisualSettings
            v-model:muted="localWebsite.muted"
            v-model:dark-mode="localWebsite.darkMode"
          />
        </div>
      </div>
      
      <!-- 可选配置区：Session实例和内边距 -->
      <div class="section-optional">
        <div class="section-title">🔧 可选配置</div>
        <div class="form-row optional-settings">
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
      </div>
      
      <!-- 进阶功能区：目标选择器和自动刷新（可折叠） -->
      <div class="section-advanced">
        <div 
          class="section-title collapsible" 
          @click="showAdvanced = !showAdvanced"
        >
          <span class="collapse-icon">{{ showAdvanced ? '▼' : '▶' }}</span>
          <span>📦 进阶功能</span>
        </div>
        <div v-show="showAdvanced" class="advanced-content">
          <TargetSelectorList
            v-model="localWebsite.targetSelectors"
            @enter="handleConfirm"
          />
          <AutoRefreshConfig
            v-model="localWebsite.autoRefreshInterval"
            @enter="handleConfirm"
          />
        </div>
      </div>
      
      <!-- 操作按钮 -->
      <div class="form-actions">
        <button class="btn-confirm" @click="handleConfirm">确定</button>
        <button class="btn-cancel" @click="$emit('cancel')">取消</button>
      </div>
    </div>
  </div>
</template>

<script>
import { inject, ref } from 'vue'
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
    // 进阶功能折叠状态
    const showAdvanced = ref(false)
    
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
      showAdvanced,
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
  max-height: 85vh;
  overflow-y: auto;
  scrollbar-gutter: stable; /* 预留滚动条空间，避免内容展开时布局跳动 */
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  animation: slideUp 0.3s ease-out;
  /* 自定义滚动条样式 - 保持圆角效果 */
  scrollbar-width: 10px;
  scrollbar-color: #FF5C00 transparent;
}

.edit-website-dialog::-webkit-scrollbar {
  width: 6px;
}

.edit-website-dialog::-webkit-scrollbar-track {
  background: transparent;
}

.edit-website-dialog::-webkit-scrollbar-thumb {
  background: #FF5C00;
  border-radius: 3px;
  transition: background 0.3s ease;
  margin: 2px;
}

.edit-website-dialog::-webkit-scrollbar-thumb:hover {
  background: #e64e00;
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

/* 分区样式 */
.section-core {
  margin-bottom: 24px;
  padding-bottom: 20px;
  border-bottom: 2px solid #f0f0f0;
}

.section-common,
.section-optional,
.section-advanced {
  margin-bottom: 20px;
  padding: 16px;
  background: #fafafa;
  border-radius: 12px;
  border: 1px solid #e8e8e8;
}

.section-title {
  font-size: 15px;
  font-weight: 600;
  color: #333;
  margin-bottom: 12px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.section-title.collapsible {
  cursor: pointer;
  user-select: none;
  display: flex;
  align-items: center;
  padding: 4px 8px;
  border-radius: 6px;
  transition: background 0.2s;
}

.section-title.collapsible:hover {
  background: rgba(255, 92, 0, 0.05);
}

.collapse-icon {
  font-size: 11px;
  color: var(--primary-color);
  transition: transform 0.3s;
  margin-right: 6px;
  font-weight: bold;
}

.advanced-content {
  margin-top: 12px;
}

.form-row {
  display: flex;
  gap: 20px;
  margin-bottom: 0;
}

.form-row > * {
  flex: 1;
  margin-bottom: 0;
}

/* 常用设置行 - 设备类型占更多空间 */
.form-row.common-settings > :first-child {
  flex: 1.5;
}

.form-row.common-settings > :last-child {
  flex: 1;
}

/* 可选配置行 - 均分空间 */
.form-row.optional-settings > * {
  flex: 1;
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
    padding: 24px;
  }
  
  .form-row {
    flex-direction: column;
    gap: 0;
  }
  
  .form-row > * {
    margin-bottom: 16px;
  }
  
  .form-row > *:last-child {
    margin-bottom: 0;
  }
  
  .section-common,
  .section-optional,
  .section-advanced {
    padding: 12px;
  }
}
</style>
