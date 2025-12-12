<template>
  <div v-if="show" class="edit-website-overlay" @mousedown="handleOverlayMouseDown" @click="handleOverlayClick">
    <div class="edit-website-dialog" @mousedown.stop>
      <!-- 顶部标题栏 (固定) -->
      <div class="dialog-header">
        <div>
          <h1>{{ editingIndex === -1 ? $t('websiteEdit.addWebsite') : $t('websiteEdit.editWebsite') }}</h1>
          <p class="header-subtitle">配置站点的显示选项、代理及高级功能</p>
        </div>
        <div v-if="website.id" class="header-badge">
          <span class="badge-text">ID: {{ website.id }}</span>
        </div>
      </div>

      <!-- 内容滚动区域 -->
      <div class="dialog-content">
        <!-- 1. 基础信息 Section -->
        <section class="content-section">
          <h2 class="section-heading">
            <i class="fa-solid fa-globe"></i> 基础信息
          </h2>
          <div class="basic-info-col">
            <WebsiteBasicInfo
              v-model:title="localWebsite.title"
              v-model:url="localWebsite.url"
              :auto-focus="show"
              @enter="handleConfirm"
            />
          </div>
          <!-- 快捷添加按钮（仅在添加新网站时显示） -->
          <div v-if="editingIndex === -1" class="quick-add-card">
            <div class="quick-add-header">
              <i class="fa-solid fa-bolt"></i>
              <span class="quick-add-title">{{ $t('websiteEdit.quickStart') }}</span>
            </div>
            <div class="quick-add-buttons">
              <button 
                class="quick-add-btn"
                @click="quickAddBaidu"
                type="button"
                :title="$t('websiteEdit.quickAddBaidu')"
              >
                <i class="fa-solid fa-magnifying-glass"></i>
                <span>百度</span>
              </button>
              <button 
                class="quick-add-btn"
                @click="quickAddGoogle"
                type="button"
                :title="$t('websiteEdit.quickAddGoogle')"
              >
                <i class="fa-solid fa-globe"></i>
                <span>谷歌</span>
              </button>
              <button 
                class="quick-add-btn desktop-capture-btn"
                @click="showDesktopCaptureSelector = true"
                type="button"
                title="添加桌面捕获"
                :disabled="!isElectron"
              >
                <i class="fa-solid fa-desktop"></i>
                <span>桌面</span>
              </button>
            </div>
          </div>
        </section>

        <!-- 2. 常用设置 Section -->
        <section class="content-section">
          <h2 class="section-heading">
            <i class="fa-solid fa-sliders"></i> 常用设置
          </h2>
          <div class="common-settings-grid">
            <DeviceTypeSelector
              v-model="localWebsite.deviceType"
            />
            <AudioVisualSettings
              v-model:muted="localWebsite.muted"
              v-model:dark-mode="localWebsite.darkMode"
              v-model:require-modifier-for-actions="localWebsite.requireModifierForActions"
            />
          </div>
        </section>

        <!-- 3. 高级配置 (Two Columns) -->
        <section class="content-section advanced-config-section">
          <div class="advanced-config-grid">
            <!-- 左侧：网络与会话 -->
            <div class="network-session-col">
              <h2 class="section-heading">
                <i class="fa-solid fa-network-wired"></i> 网络与会话
              </h2>
              <SessionInstanceSelector
                v-model="localWebsite.sessionInstance"
                :session-instances="sessionInstances"
                @create-instance="handleCreateNewInstance"
                @manage-instances="handleOpenSessionManager"
              />
              <ProxySelector
                v-if="isElectron"
                v-model="localWebsite.proxyId"
                :dialog-visible="show"
                @manage-proxies="handleOpenProxyManager"
              />
            </div>

            <!-- 右侧：样式配置 -->
            <div class="style-config-col">
              <h2 class="section-heading">
                <i class="fa-solid fa-ruler-combined"></i> 样式配置
              </h2>
              <PaddingConfig
                v-model="localWebsite.padding"
                @enter="handleConfirm"
              />
            </div>
          </div>
        </section>

        <!-- 4. 进阶功能 (展开的 Details Section) -->
        <section class="content-section">
          <details class="advanced-details" :open="showAdvanced" @toggle="showAdvanced = $event.target.open">
            <summary class="advanced-summary">
              <div class="summary-icon">
                <i class="fa-solid fa-cube" :class="{ 'rotated': showAdvanced }"></i>
              </div>
              <div class="summary-content">
                <span class="summary-title">{{ $t('websiteEdit.advancedSettings') }}</span>
                <p class="summary-subtitle" v-show="showAdvanced">配置高级 DOM 选择器与自动化刷新策略</p>
              </div>
              <span class="summary-arrow" :class="{ 'rotated': showAdvanced }">
                <i class="fa-solid fa-chevron-right"></i>
              </span>
            </summary>
            
            <div class="advanced-content">
              <TargetSelectorList
                v-model="localWebsite.targetSelectors"
                @enter="handleConfirm"
              />
              <AutoRefreshConfig
                v-model="localWebsite.autoRefreshInterval"
                @enter="handleConfirm"
              />
              
              <!-- 外部链接配置 -->
              <div class="advanced-option-card">
                <div class="option-header">
                  <div class="option-icon">
                    <i class="fa-solid fa-external-link-alt"></i>
                  </div>
                  <div class="option-content">
                    <h3 class="option-title">{{ $t('advancedSettings.externalLinks') }}</h3>
                    <p class="option-description">{{ $t('advancedSettings.externalLinksDesc') }}</p>
                  </div>
                </div>
                <div class="option-body">
                  <label class="checkbox-label">
                    <input 
                      type="checkbox" 
                      v-model="localWebsite.openExternalInModal"
                      class="checkbox-input"
                    />
                    <span class="checkbox-custom"></span>
                    <span class="checkbox-text">{{ $t('advancedSettings.openExternalInModal') }}</span>
                  </label>
                  <p class="option-hint">{{ $t('advancedSettings.openExternalInModalHint') }}</p>
                </div>
              </div>
            </div>
          </details>
        </section>
      </div>

      <!-- 底部按钮栏 -->
      <div class="dialog-footer">
        <button class="btn-cancel" @click="$emit('cancel')">{{ $t('common.cancel') }}</button>
        <button class="btn-confirm" @click="handleConfirm">{{ $t('common.confirm') }}</button>
      </div>
    </div>
    
    <!-- 桌面捕获选择器 -->
    <DesktopCaptureSelector
      :visible="showDesktopCaptureSelector"
      @close="showDesktopCaptureSelector = false"
      @select="handleDesktopCaptureSelect"
    />
  </div>
</template>

<script>
import { inject, ref, watch, computed, nextTick } from 'vue'
import { useI18n } from 'vue-i18n'
import { useSessionManager } from '../composables/useSessionManager.js'
import { useWebsiteForm } from '../composables/useWebsiteForm.js'
import { useOverlayClick } from '../composables/useOverlayClick.js'
import WebsiteBasicInfo from './WebsiteEditDialog/WebsiteBasicInfo.vue'
import DeviceTypeSelector from './WebsiteEditDialog/DeviceTypeSelector.vue'
import TargetSelectorList from './WebsiteEditDialog/TargetSelectorList.vue'
import AudioVisualSettings from './WebsiteEditDialog/AudioVisualSettings.vue'
import SessionInstanceSelector from './WebsiteEditDialog/SessionInstanceSelector.vue'
import ProxySelector from './WebsiteEditDialog/ProxySelector.vue'
import PaddingConfig from './WebsiteEditDialog/PaddingConfig.vue'
import AutoRefreshConfig from './WebsiteEditDialog/AutoRefreshConfig.vue'
import DesktopCaptureSelector from './DesktopCaptureSelector.vue'

export default {
  name: 'WebsiteEditDialog',
  components: {
    WebsiteBasicInfo,
    DeviceTypeSelector,
    TargetSelectorList,
    AudioVisualSettings,
    SessionInstanceSelector,
    ProxySelector,
    PaddingConfig,
    AutoRefreshConfig,
    DesktopCaptureSelector
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
        proxyId: '',
        padding: 10,
        muted: false,
        darkMode: false,
        requireModifierForActions: false,
        openExternalInModal: false
      })
    },
    // 所有网站列表，用于检查代理冲突
    websites: {
      type: Array,
      default: () => []
    }
  },
  emits: ['confirm', 'cancel'],
  setup(props, { emit }) {
    const { t } = useI18n()
    
    // 检查是否是 Electron 环境
    const isElectron = computed(() => {
      return window.electron?.isElectron || false
    })
    
    // 桌面捕获选择器显示状态
    const showDesktopCaptureSelector = ref(false)
    
    // 进阶功能折叠状态
    const showAdvanced = ref(false)

    // 检查是否配置了进阶功能
    const hasAdvancedConfig = (website) => {
      // 检查是否配置了选择器（不为空数组）
      const hasSelectors = website.targetSelectors && 
                          Array.isArray(website.targetSelectors) && 
                          website.targetSelectors.length > 0
      
      // 检查是否配置了自动刷新（不为默认值0）
      const hasAutoRefresh = website.autoRefreshInterval && 
                            website.autoRefreshInterval !== 0
      
      return hasSelectors || hasAutoRefresh
    }

    // 当对话框打开时，根据是否配置了进阶功能来决定展开状态
    watch(() => props.show, (newShow) => {
      if (newShow) {
        // 对话框打开时，检查当前网站是否配置了进阶功能
        showAdvanced.value = hasAdvancedConfig(props.website)
      }
    })
    
    // Session管理
    const { sessionInstances, addSessionInstance } = useSessionManager()
    const showPrompt = inject('showPrompt')
    const openSessionManager = inject('openSessionManager')
    const openProxyManager = inject('openProxyManager')

    // 表单数据管理
    const { localWebsite, handleConfirm: validateAndSubmit } = useWebsiteForm(props, emit)

    // 弹窗交互
    const { handleOverlayMouseDown, handleOverlayClick } = useOverlayClick(() => {
      emit('cancel')
    })

    // 监听代理设置变化
    watch(() => localWebsite.value.proxyId, (newProxyId, oldProxyId) => {
      if (newProxyId && newProxyId !== oldProxyId) {
        // 当设置了代理时，自动创建或切换到专属的隐藏 session 实例
        const proxySessionId = `proxy-${props.website.id || Date.now()}-${newProxyId}`
        
        // 检查是否已经存在该隐藏实例
        const existingInstance = sessionInstances.value.find(inst => inst.id === proxySessionId)
        
        if (!existingInstance) {
          // 创建隐藏的 session 实例
          const hiddenInstance = {
            id: proxySessionId,
            name: `代理专用 (${localWebsite.value.title || '未命名'})`,
            description: '为代理设置自动创建的隐藏实例',
            hidden: true, // 标记为隐藏
            createdAt: new Date().toISOString()
          }
          sessionInstances.value.push(hiddenInstance)
        }
        
        // 自动切换到该 session 实例
        localWebsite.value.sessionInstance = proxySessionId
      } else if (!newProxyId && oldProxyId) {
        // 当清除代理时，切换回默认 session 实例
        const currentSessionId = localWebsite.value.sessionInstance
        if (currentSessionId && currentSessionId.startsWith('proxy-')) {
          localWebsite.value.sessionInstance = 'default'
        }
      }
    })

    // 确认提交
    const handleConfirm = () => {
      validateAndSubmit()
    }

    // 创建新的session实例
    const handleCreateNewInstance = async () => {
      // 使用当前视界的名称作为实例的默认命名
        const defaultName = localWebsite.value.title 
        ? `${localWebsite.value.title}` 
        : `${t('sessionInstance.defaultInstanceName')} ${sessionInstances.value.length}`
      
      if (!showPrompt) {
        const name = prompt(t('sessionInstance.createNewInstanceMessage'), defaultName)
        if (name && name.trim()) {
          const newInstance = addSessionInstance(name.trim())
          localWebsite.value.sessionInstance = newInstance.id
        }
        return
      }

      const name = await showPrompt({
        title: t('sessionInstance.createNewInstance'),
        message: t('sessionInstance.createNewInstanceMessage'),
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

    // 打开代理管理器
    const handleOpenProxyManager = () => {
      if (openProxyManager) {
        openProxyManager()
      }
    }

    // 快捷添加百度
    const quickAddBaidu = () => {
      localWebsite.value.title = t('websiteEdit.baidu')
      localWebsite.value.url = 'https://www.baidu.com'
      // 自动提交
      handleConfirm()
    }

    // 快捷添加谷歌
    const quickAddGoogle = () => {
      localWebsite.value.title = t('websiteEdit.google')
      localWebsite.value.url = 'https://www.google.com'
      // 自动提交
      handleConfirm()
    }
    
    // 处理桌面捕获选择
    const handleDesktopCaptureSelect = ({ source, options }) => {
      console.log('[WebsiteEditDialog] 选择桌面捕获源:', source, options)
      
      // 关闭选择器
      showDesktopCaptureSelector.value = false
      
      // 关闭当前对话框
      emit('cancel')
      
      // 延迟提交数据，让父组件有时间切换对话框类型
      nextTick(() => {
        const desktopCaptureData = {
          type: 'desktop-capture',
          title: source.name || '桌面捕获',
          url: '', // 桌面捕获不需要URL
          desktopCaptureSourceId: source.id,
        desktopCaptureOptions: {
          autoRefresh: false, // 已移除自动刷新功能
          fitScreen: options.fitScreen || false // 默认false
        },
          padding: 0,
          muted: false,
          targetSelectors: [],
          targetSelector: ''
        }
        
        // 提交数据，父组件会识别类型并切换到桌面捕获对话框
        emit('confirm', desktopCaptureData)
      })
    }

    return {
      isElectron,
      showAdvanced,
      showDesktopCaptureSelector,
      localWebsite,
      sessionInstances,
      handleConfirm,
      handleOverlayMouseDown,
      handleOverlayClick,
      handleCreateNewInstance,
      handleOpenSessionManager,
      handleOpenProxyManager,
      quickAddBaidu,
      quickAddGoogle,
      handleDesktopCaptureSelect
    }
  }
}
</script>

<style scoped>
/* 自定义滚动条 */
::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

::-webkit-scrollbar-track {
  background: #f1f1f1; 
}

::-webkit-scrollbar-thumb {
  background: #cbd5e1; 
  border-radius: 4px;
}

::-webkit-scrollbar-thumb:hover {
  background: #94a3b8; 
}

.edit-website-overlay {
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

.edit-website-dialog {
  background: white;
  width: 100%;
  max-width: 80rem; /* 5xl */
  border-radius: 1rem; /* rounded-2xl */
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

/* 顶部标题栏 (固定) */
.dialog-header {
  padding: 1.5rem 2rem;
  border-bottom: 1px solid #f3f4f6;
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: white;
  flex-shrink: 0;
  z-index: 20;
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

.header-badge {
  display: flex;
  gap: 0.5rem;
}

.badge-text {
  padding: 0.25rem 0.75rem;
  background: #f3f4f6;
  color: #4b5563;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 500;
}

/* 内容滚动区域 */
.dialog-content {
  flex: 1;
  overflow-y: auto;
  padding: 2rem;
  display: flex;
  flex-direction: column;
  gap: 2.5rem;
}

.content-section {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.section-heading {
  font-size: 0.875rem;
  font-weight: 600;
  color: #9ca3af;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: 1rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.section-heading i {
  font-size: 0.875rem;
}

/* 基础信息列 */
.basic-info-col {
  margin-bottom: 0;
}

/* 快捷添加卡片 */
.quick-add-card {
  background: linear-gradient(135deg, #fff7ed 0%, #fed7aa 100%);
  border: 1px solid #fdba74;
  border-radius: 0.75rem;
  padding: 1rem;
  margin-top: 1rem;
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 1rem;
  box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
}

.quick-add-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #c2410c;
  font-weight: 600;
  font-size: 0.875rem;
  white-space: nowrap;
  flex-shrink: 0;
}

.quick-add-header i {
  font-size: 1rem;
}

.quick-add-title {
  font-size: 0.875rem;
  color: #c2410c;
  font-weight: 600;
}

.quick-add-buttons {
  display: flex;
  flex-direction: row;
  gap: 0.75rem;
}

.quick-add-btn {
  flex: 0 0 auto;
  padding: 0.625rem 0.75rem;
  border-radius: 0.5rem;
  border: 1px solid #fdba74;
  background: white;
  color: #c2410c;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  white-space: nowrap;
  box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
}

.quick-add-btn:hover:not(:disabled) {
  background: #fff7ed;
  border-color: #f97316;
  transform: translateY(-1px);
  box-shadow: 0 2px 4px 0 rgba(0, 0, 0, 0.1);
}

.quick-add-btn:active:not(:disabled) {
  transform: translateY(0);
}

.quick-add-btn i {
  font-size: 0.875rem;
}

.quick-add-btn.desktop-capture-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  background: #f3f4f6;
  color: #9ca3af;
  border-color: #e5e7eb;
}

.quick-add-btn.desktop-capture-btn:disabled:hover {
  transform: none;
  box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
}

/* 常用设置网格 */
.common-settings-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1rem;
}

@media (min-width: 768px) {
  .common-settings-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (min-width: 1024px) {
  .common-settings-grid {
    grid-template-columns: repeat(4, 1fr);
  }
}

/* 高级配置区域 */
.advanced-config-section {
  margin-top: 0;
}

.advanced-config-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 2rem;
}

@media (min-width: 1024px) {
  .advanced-config-grid {
    grid-template-columns: 2fr 1fr;
  }
}

.network-session-col,
.style-config-col {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

/* 进阶功能 Details */
.advanced-details {
  background: white;
  border-radius: 0.75rem;
  border: 1px solid #e5e7eb;
  overflow: hidden;
  transition: all 0.3s;
}

.advanced-details[open] {
  box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06);
  border-color: #f97316;
}

.advanced-summary {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1.5rem;
  cursor: pointer;
  list-style: none;
  user-select: none;
  transition: background-color 0.2s;
}

.advanced-summary:hover {
  background: #f9fafb;
}

.advanced-summary::-webkit-details-marker {
  display: none;
}

.summary-icon {
  width: 2.5rem;
  height: 2.5rem;
  border-radius: 0.5rem;
  background: #fff7ed;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #f97316;
  transition: transform 0.3s;
}

.summary-icon i {
  font-size: 1.125rem;
  transition: transform 0.3s;
}

.summary-icon i.rotated {
  transform: rotate(12deg);
}

.summary-content {
  flex: 1;
}

.summary-title {
  font-size: 1.125rem;
  font-weight: 700;
  color: #1f2937;
  display: block;
}

.summary-subtitle {
  font-size: 0.75rem;
  color: #9ca3af;
  font-weight: 400;
  margin: 0.125rem 0 0 0;
  display: block;
}

.summary-arrow {
  color: #9ca3af;
  transition: transform 0.2s;
}

.summary-arrow.rotated {
  transform: rotate(90deg);
}

.advanced-content {
  padding: 0 1.5rem 2rem 1.5rem;
  border-top: 1px solid #f3f4f6;
  display: flex;
  flex-direction: column;
  gap: 2rem;
  animation: fadeIn 0.3s ease-out;
}

/* 高级选项卡片 */
.advanced-option-card {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 0.75rem;
  overflow: hidden;
}

.option-header {
  background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%);
  padding: 1rem 1.25rem;
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  border-bottom: 1px solid #e0e7ff;
}

.option-icon {
  width: 2.5rem;
  height: 2.5rem;
  border-radius: 0.5rem;
  background: white;
  border: 1px solid #bfdbfe;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #3b82f6;
  font-size: 1.125rem;
  flex-shrink: 0;
}

.option-content {
  flex: 1;
}

.option-title {
  font-size: 1rem;
  font-weight: 600;
  color: #1e40af;
  margin: 0 0 0.25rem 0;
}

.option-description {
  font-size: 0.875rem;
  color: #64748b;
  margin: 0;
  line-height: 1.5;
}

.option-body {
  padding: 1rem 1.25rem;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  cursor: pointer;
  user-select: none;
  margin-bottom: 0.75rem;
}

.checkbox-input {
  display: none;
}

.checkbox-custom {
  width: 1.25rem;
  height: 1.25rem;
  border: 2px solid #d1d5db;
  border-radius: 0.25rem;
  position: relative;
  transition: all 0.2s;
  flex-shrink: 0;
}

.checkbox-input:checked + .checkbox-custom {
  background: #3b82f6;
  border-color: #3b82f6;
}

.checkbox-input:checked + .checkbox-custom::after {
  content: '';
  position: absolute;
  left: 0.375rem;
  top: 0.125rem;
  width: 0.375rem;
  height: 0.625rem;
  border: solid white;
  border-width: 0 2px 2px 0;
  transform: rotate(45deg);
}

.checkbox-text {
  font-size: 0.875rem;
  font-weight: 500;
  color: #374151;
}

.option-hint {
  font-size: 0.75rem;
  color: #6b7280;
  margin: 0;
  padding-left: 2rem;
  line-height: 1.5;
}

/* 底部按钮栏 */
.dialog-footer {
  background: #f9fafb;
  padding: 1.25rem 2rem;
  border-top: 1px solid #e5e7eb;
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  flex-shrink: 0;
  z-index: 20;
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

.btn-confirm:hover {
  box-shadow: 0 10px 15px -3px rgba(249, 115, 22, 0.3);
  transform: translateY(-1px);
}

/* 响应式设计 */
@media (max-width: 768px) {
  .edit-website-dialog {
    max-width: 100%;
    max-height: 95vh;
  }

  .dialog-header {
    padding: 1rem 1.5rem;
    flex-direction: column;
    align-items: flex-start;
    gap: 0.5rem;
  }

  .dialog-content {
    padding: 1.5rem;
    gap: 1.5rem;
  }

  .common-settings-grid {
    grid-template-columns: 1fr;
  }

  .advanced-config-grid {
    grid-template-columns: 1fr;
  }

}
</style>
