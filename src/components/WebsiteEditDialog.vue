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
                class="quick-add-btn"
                @click="quickAddExcalidraw"
                type="button"
                :title="$t('websiteEdit.quickAddExcalidraw')"
              >
                <i class="fa-solid fa-pen-ruler"></i>
                <span>Excalidraw</span>
              </button>
              <button 
                class="quick-add-btn desktop-capture-btn"
                @click="showDesktopCaptureSelector = true"
                type="button"
                title="添加桌面捕获"
                :disabled="false"
              >
                <i class="fa-solid fa-desktop"></i>
                <span>桌面</span>
              </button>
              <button 
                class="quick-add-btn custom-html-btn"
                @click="showCustomHtmlDialog = true"
                type="button"
                title="AI 生成自定义网页"
              >
                <i class="fa-solid fa-wand-magic-sparkles"></i>
                <span>自定义</span>
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
                v-model="localWebsite.proxyId"
                :dialog-visible="show"
                @manage-proxies="handleOpenProxyManager"
              />
              <div class="hook-url-field">
                <label class="hook-url-label">
                  <i class="fa-solid fa-arrow-right-arrow-left"></i>
                  网络 Hook URL
                </label>
                <input
                  type="text"
                  v-model="localWebsite.networkHookUrl"
                  placeholder="留空则使用全局 Hook 配置"
                  class="hook-url-input"
                />
                <p class="hook-url-hint">为此页面单独设置网络流量转发地址，覆盖全局配置</p>
              </div>
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
              <!-- 自定义 HTML 代码编辑（仅当类型为 custom-html 时显示） -->
              <div v-if="localWebsite.type === 'custom-html'" class="custom-html-editor">
                <h3 class="editor-title">
                  <i class="fa-solid fa-code"></i>
                  HTML 代码
                </h3>
                <textarea
                  v-model="localWebsite.html"
                  class="html-textarea"
                  placeholder="在此编辑 HTML 代码..."
                  rows="10"
                ></textarea>
                <p class="editor-hint">修改 HTML 代码后点击确认保存</p>
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

    <!-- 自定义 HTML 对话框 -->
    <CustomHtmlDialog
      :show="showCustomHtmlDialog"
      @confirm="handleCustomHtmlConfirm"
      @cancel="showCustomHtmlDialog = false"
    />
  </div>
</template>

<script>
import { computed } from 'vue'
import { useWebsiteForm } from '../composables/useWebsiteForm.js'
import { useOverlayClick } from '../composables/useOverlayClick.js'
import { useQuickAdd } from '../composables/useQuickAdd.js'
import { useSpecialWebsiteTypes } from '../composables/useSpecialWebsiteTypes.js'
import { useAdvancedSection } from '../composables/useAdvancedSection.js'
import { useProxySessionSync } from '../composables/useProxySessionSync.js'
import { useSessionOperations } from '../composables/useSessionOperations.js'
import WebsiteBasicInfo from './WebsiteEditDialog/WebsiteBasicInfo.vue'
import DeviceTypeSelector from './WebsiteEditDialog/DeviceTypeSelector.vue'
import TargetSelectorList from './WebsiteEditDialog/TargetSelectorList.vue'
import AudioVisualSettings from './WebsiteEditDialog/AudioVisualSettings.vue'
import SessionInstanceSelector from './WebsiteEditDialog/SessionInstanceSelector.vue'
import ProxySelector from './WebsiteEditDialog/ProxySelector.vue'
import PaddingConfig from './WebsiteEditDialog/PaddingConfig.vue'
import AutoRefreshConfig from './WebsiteEditDialog/AutoRefreshConfig.vue'
import DesktopCaptureSelector from './DesktopCaptureSelector.vue'
import CustomHtmlDialog from './CustomHtmlDialog.vue'

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
    DesktopCaptureSelector,
    CustomHtmlDialog
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
        padding: 0, // 默认不启用内边距，除非配置了选择器
        muted: false,
        darkMode: false,
        requireModifierForActions: false
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
    // 检查是否是 Electron 环境
    const isElectron = computed(() => {
      return window.electron?.isElectron || false
    })
    
    // 表单数据管理
    const { localWebsite, handleConfirm: validateAndSubmit } = useWebsiteForm(props, emit)

    // 弹窗交互
    const { handleOverlayMouseDown, handleOverlayClick } = useOverlayClick(() => {
      emit('cancel')
    })

    // 快捷添加功能
    const {
      quickAddBaidu,
      quickAddGoogle,
      quickAddExcalidraw
    } = useQuickAdd(localWebsite, validateAndSubmit)

    // 特殊网站类型处理（桌面捕获、自定义HTML）
    const {
      showDesktopCaptureSelector,
      showCustomHtmlDialog,
      handleDesktopCaptureSelect,
      handleCustomHtmlConfirm
    } = useSpecialWebsiteTypes(emit)

    // 进阶功能区域状态
    const { showAdvanced, setupAdvancedWatch } = useAdvancedSection()
    setupAdvancedWatch(() => props.website, () => props.show)

    // Session实例操作
    const {
      sessionInstances,
      handleCreateNewInstance,
      handleOpenSessionManager,
      handleOpenProxyManager
    } = useSessionOperations(localWebsite)

    // 代理与会话同步
    const { setupProxySessionWatch } = useProxySessionSync(localWebsite, sessionInstances, props)
    setupProxySessionWatch()

    // 确认提交
    const handleConfirm = () => {
      validateAndSubmit()
    }

    return {
      isElectron,
      showAdvanced,
      showDesktopCaptureSelector,
      showCustomHtmlDialog,
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
      quickAddExcalidraw,
      handleDesktopCaptureSelect,
      handleCustomHtmlConfirm
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

/* Hook URL 字段 */
.hook-url-field {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.hook-url-label {
  font-size: 0.8125rem;
  font-weight: 600;
  color: #374151;
  display: flex;
  align-items: center;
  gap: 0.375rem;
}

.hook-url-label i {
  color: #f97316;
  font-size: 0.75rem;
}

.hook-url-input {
  width: 100%;
  padding: 0.5rem 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 0.5rem;
  font-size: 0.8125rem;
  color: #1f2937;
  background: white;
  transition: all 0.2s;
}

.hook-url-input:focus {
  outline: none;
  border-color: #f97316;
  box-shadow: 0 0 0 3px rgba(249, 115, 22, 0.1);
}

.hook-url-hint {
  font-size: 0.75rem;
  color: #9ca3af;
  margin: 0;
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

/* 自定义 HTML 编辑器 */
.custom-html-editor {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  padding: 1rem;
  background: #f9fafb;
  border-radius: 0.5rem;
  border: 1px solid #e5e7eb;
}

.editor-title {
  font-size: 0.875rem;
  font-weight: 600;
  color: #374151;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.editor-title i {
  color: #f97316;
}

.html-textarea {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 0.5rem;
  font-family: 'Courier New', monospace;
  font-size: 0.875rem;
  line-height: 1.5;
  resize: vertical;
  transition: all 0.2s;
}

.html-textarea:focus {
  outline: none;
  border-color: #f97316;
  box-shadow: 0 0 0 3px rgba(249, 115, 22, 0.1);
}

.editor-hint {
  font-size: 0.75rem;
  color: #6b7280;
  margin: 0;
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
