<template>
  <div class="config-panel">
    <!-- Logo 和标题（固定在顶部） -->
    <div class="logo-section">
      <div class="logo-icon">
        <img src="/128x128.png" alt="全视界 Logo" class="logo-img" />
      </div>
      <h1 class="app-title">全视界</h1>
      <button
        class="sidebar-collapse-btn"
        @click="$emit('close-sidebar')"
        title="收起侧边栏"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
          <line x1="9" y1="3" x2="9" y2="21"/>
          <polyline points="15 8 12 12 15 16"/>
        </svg>
      </button>
    </div>

    <!-- 可滚动内容区 -->
    <div class="sidebar-content">
      <!-- 布局选择器 -->
      <LayoutList
        :layouts="layouts"
        :current-layout-id="currentLayoutId"
        @create-layout="handleCreateLayout"
        @select-layout="selectLayout"
        @share-layout="$emit('share-layout', $event)"
        @export-layout="$emit('export-layout', $event)"
        @delete-layout="(id) => $emit('delete-layout', id)"
        @toggle-keep-alive="(id) => $emit('toggle-keep-alive', id)"
        @rename-layout="(id, name) => $emit('rename-layout', id, name)"
        @reorder-layout="(fromIndex, toIndex) => $emit('reorder-layout', fromIndex, toIndex)"
      />

      <!-- 设置和操作按钮 -->
      <div class="actions-section">
        <!-- 配置开关区 -->
        <div class="settings-section">
          <span class="section-label">当前视图设置</span>
          <div class="settings-container">
            <SwitchItem
              :icon="showTitles ? 'eye' : 'eye-off'"
              :label="$t('configPanel.showTitles')"
              :checked="showTitles"
              @change="handleToggleTitles"
            />
            <SwitchItem
              :icon="globalMuted ? 'volume-x' : 'volume-2'"
              :label="$t('configPanel.globalMuted')"
              :checked="globalMuted"
              @change="handleToggleGlobalMute"
            />
            <SwitchItem
              icon="zap"
              :label="$t('configPanel.adBlockEnabled')"
              :checked="adBlockEnabled"
              @change="handleToggleAdBlock"
            />
            <SwitchItem
              icon="shield-alert"
              :label="$t('configPanel.showCertificateErrorShadow')"
              :checked="showCertificateErrorShadow"
              @change="handleToggleCertificateErrorShadow"
            />
            <!-- 语言选择 -->
            <LanguageSelector />
          </div>
        </div>
      </div>

      <!-- 窗口管理区域 -->
      <WindowManagement />
    </div>

    <!-- 底部操作区（固定） -->
    <ConfigPanelBottomActions
      @show-shared-modal="$emit('show-shared-modal')"
      @manage-proxy="$emit('manage-proxy')"
      @clear-config="clearConfig"
      @open-settings="$emit('open-settings')"
    />
  </div>
</template>

<script>
import { inject } from 'vue'
import { useI18n } from 'vue-i18n'
import SwitchItem from './SwitchItem.vue'
import LayoutList from './LayoutList.vue'
import LanguageSelector from './LanguageSelector.vue'
import WindowManagement from './WindowManagement.vue'
import ConfigPanelBottomActions from './ConfigPanelBottomActions.vue'

export default {
  name: 'ConfigPanel',
  components: {
    SwitchItem,
    LayoutList,
    LanguageSelector,
    WindowManagement,
    ConfigPanelBottomActions
  },
  props: {
    layouts: {
      type: Array,
      required: true
    },
    currentLayoutId: {
      type: Number,
      required: true
    },
    showTitles: {
      type: Boolean,
      default: false
    },
    globalMuted: {
      type: Boolean,
      default: false
    },
    adBlockEnabled: {
      type: Boolean,
      default: false
    },
    customCodeEnabled: {
      type: Boolean,
      default: true
    },
    showCertificateErrorShadow: {
      type: Boolean,
      default: true
    },
    showUpdateButton: {
      type: Boolean,
      default: false
    }
  },
  emits: ['switch-layout', 'create-layout', 'delete-layout', 'toggle-keep-alive', 'rename-layout', 'reorder-layout', 'toggle-titles', 'toggle-global-mute', 'toggle-ad-block', 'toggle-custom-code', 'toggle-certificate-error-shadow', 'manage-sessions', 'manage-proxy', 'open-settings', 'show-update', 'show-shared-modal', 'share-layout', 'export-layout', 'close-sidebar'],
  setup(props, { emit }) {
    const { t } = useI18n()

    // 从父组件注入对话框方法
    const showPrompt = inject('showPrompt')
    const showConfirm = inject('showConfirm')

    const selectLayout = (layoutId) => {
      emit('switch-layout', layoutId)
    }

    const handleCreateLayout = async () => {
      const name = await showPrompt({
        title: t('configPanel.layoutDropdown.createLayout'),
        message: t('configPanel.layoutDropdown.createLayoutMessage'),
        placeholder: t('configPanel.layoutDropdown.createLayoutPlaceholder')
      })
      if (name && name.trim()) {
        emit('create-layout', name.trim())
      }
    }

    const clearConfig = async () => {
      if (await showConfirm(t('configPanel.layoutDropdown.clearConfig'))) {
        emit('clear-config')
        window.location.reload()
      }
    }

    // 切换标题显示
    const handleToggleTitles = () => {
      emit('toggle-titles', !props.showTitles)
    }

    // 切换全局静音
    const handleToggleGlobalMute = () => {
      emit('toggle-global-mute', !props.globalMuted)
    }

    // 切换去广告
    const handleToggleAdBlock = () => {
      emit('toggle-ad-block', !props.adBlockEnabled)
    }

    // 切换证书错误阴影
    const handleToggleCertificateErrorShadow = () => {
      emit('toggle-certificate-error-shadow', !props.showCertificateErrorShadow)
    }

    return {
      selectLayout,
      handleCreateLayout,
      clearConfig,
      handleToggleTitles,
      handleToggleGlobalMute,
      handleToggleAdBlock,
      handleToggleCertificateErrorShadow
    }
  }
}
</script>

<style scoped>
.config-panel {
  background: white;
  width: 288px;
  height: 100%;
  border-right: 1px solid #e2e8f0;
  display: flex;
  flex-direction: column;
  position: relative;
  z-index: 20;
  overflow: hidden;
}

.sidebar-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow-y: auto;
  overflow-x: hidden;
  padding: 1.5rem;
  gap: 1.5rem;
  min-height: 0;
}

.sidebar-content::-webkit-scrollbar {
  width: 4px;
}

.sidebar-content::-webkit-scrollbar-track {
  background: transparent;
}

.sidebar-content::-webkit-scrollbar-thumb {
  background-color: #cbd5e1;
  border-radius: 20px;
}

/* Logo 区域（固定在顶部） */
.logo-section {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1.5rem;
  padding-bottom: 1.5rem;
  border-bottom: 1px solid #f1f5f9;
  flex-shrink: 0;
  background: white;
  z-index: 10;
}

.logo-icon {
  width: 2rem;
  height: 2rem;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 0.5rem;
  overflow: hidden;
}

.logo-img {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.app-title {
  font-size: 1.25rem;
  font-weight: 700;
  background: linear-gradient(to right, #1e293b, #475569);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin: 0;
  flex: 1;
}

.sidebar-collapse-btn {
  width: 36px;
  height: 36px;
  background: white;
  border: none;
  border-radius: 7px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.08);
  cursor: pointer;
  color: #64748b;
  flex-shrink: 0;
  transition: all 0.2s ease;
  margin-left: auto;
}

.sidebar-collapse-btn:hover {
  background: #f8fafc;
  color: #f97316;
  border-color: #f97316;
  box-shadow: 0 2px 8px rgba(249, 115, 22, 0.15);
}

/* 操作按钮区域 */
.actions-section {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  flex-shrink: 0;
}

.settings-section {
  margin-bottom: 1.5rem;
  padding: 0 0.5rem;
}

.section-label {
  font-size: 0.75rem;
  font-weight: 600;
  color: #94a3b8;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.settings-container {
  background: #f8fafc;
  padding: 0.75rem;
  border-radius: 0.75rem;
  border: 1px solid #f1f5f9;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  margin-top: 0.75rem;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .config-panel {
    width: 240px;
  }

  .sidebar-content {
    padding: 15px;
  }

  .logo-img {
    width: 48px;
    height: 48px;
  }

  .app-title {
    font-size: 20px;
  }
}
</style>
