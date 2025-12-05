<template>
  <div class="config-panel">
    <!-- Logo 和标题（固定在顶部） -->
    <div class="logo-section">
      <div class="logo-icon">
        <img src="/128x128.png" alt="Tab Hive Logo" class="logo-img" />
      </div>
      <h1 class="app-title">Tab Hive</h1>
    </div>

    <!-- 可滚动内容区 -->
    <div class="sidebar-content">
      <!-- 布局选择器 -->
      <LayoutList
        :layouts="layouts"
        :current-layout-id="currentLayoutId"
        @create-layout="handleCreateLayout"
        @select-layout="selectLayout"
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
            <!-- 语言选择 -->
            <LanguageSelector />
          </div>
        </div>
      </div>

      <!-- 窗口管理区域（仅 Electron 环境） -->
      <WindowManagement v-if="isElectron" />
    </div>

    <!-- 底部操作区（固定） -->
    <ConfigPanelBottomActions
      :is-electron="isElectron"
      @show-shared-modal="$emit('show-shared-modal')"
      @manage-proxy="$emit('manage-proxy')"
      @clear-config="clearConfig"
    />
  </div>
</template>

<script>
import { ref, computed, onMounted, onUnmounted, inject } from 'vue'
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
    showUpdateButton: {
      type: Boolean,
      default: false
    }
  },
  emits: ['switch-layout', 'create-layout', 'delete-layout', 'toggle-keep-alive', 'rename-layout', 'show-download-modal', 'toggle-titles', 'toggle-global-mute', 'toggle-ad-block', 'toggle-custom-code', 'manage-sessions', 'manage-proxy', 'show-update', 'show-shared-modal'],
  setup(props, { emit }) {
    const { t } = useI18n()

    // 从父组件注入对话框方法
    const showPrompt = inject('showPrompt')
    const showConfirm = inject('showConfirm')

    // 检测是否在 Electron 环境中
    const isElectron = computed(() => {
      return typeof window !== 'undefined' &&
        (window.electron !== undefined ||
         (navigator.userAgent && navigator.userAgent.toLowerCase().includes('electron')))
    })

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

    return {
      isElectron,
      selectLayout,
      handleCreateLayout,
      clearConfig,
      handleToggleTitles,
      handleToggleGlobalMute,
      handleToggleAdBlock
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
