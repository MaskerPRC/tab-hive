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
      <div class="layout-section">
        <div class="layout-list-header">
          <span class="section-label">我的空间</span>
          <button class="btn-new-layout" @click="handleCreateLayout" title="新建布局">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="12" y1="5" x2="12" y2="19"/>
              <line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
          </button>
        </div>

        <div class="layout-list">
          <div
            v-for="layout in layouts"
            :key="layout.id"
            class="layout-item"
            :class="{ 'active': layout.id === currentLayoutId }"
            @click="selectLayout(layout.id)"
          >
            <div class="layout-item-content">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="layout-icon">
                <rect x="3" y="3" width="7" height="7"/>
                <rect x="14" y="3" width="7" height="7"/>
                <rect x="14" y="14" width="7" height="7"/>
                <rect x="3" y="14" width="7" height="7"/>
              </svg>
              <span class="layout-item-name">{{ layout.name }}</span>
            </div>
            <div v-if="layout.id === currentLayoutId" class="layout-indicator"></div>
          </div>
        </div>
      </div>

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
            <div class="language-selector-item">
              <div class="language-selector-left">
                <span class="language-icon">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="12" cy="12" r="10"/>
                    <line x1="2" y1="12" x2="22" y2="12"/>
                    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
                  </svg>
                </span>
                <span class="language-label">{{ $t('configPanel.language') }}</span>
              </div>
              <select
                :value="currentLocale"
                @change="handleLanguageChange($event.target.value)"
                class="language-select"
                :title="$t('configPanel.languageHint')"
              >
                <option value="zh">🇨🇳 中文</option>
                <option value="en">🇺🇸 English</option>
                <option value="es">🇪🇸 Español</option>
                <option value="bn">🇧🇩 বাংলা</option>
                <option value="hi">🇮🇳 हिन्दी</option>
                <option value="ar">🇸🇦 العربية</option>
                <option value="pt">🇧🇷 Português</option>
                <option value="ru">🇷🇺 Русский</option>
                <option value="ja">🇯🇵 日本語</option>
                <option value="de">🇩🇪 Deutsch</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      <!-- 窗口管理区域（仅 Electron 环境） -->
      <div v-if="isElectron" class="window-management">
        <div class="window-management-header">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="window-management-icon">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
          </svg>
          <span class="window-management-title">{{ $t('configPanel.windowManagement') }}</span>
        </div>

        <button
          @click="handleCreateNewWindow"
          class="btn-create-window"
          :title="$t('configPanel.createNewWindowHint')"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="12" y1="5" x2="12" y2="19"/>
            <line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          <span>{{ $t('configPanel.createNewWindow') }}</span>
        </button>

        <div v-if="windowManager.windows.value.length > 1" class="window-list">
          <div class="window-list-title">{{ $t('configPanel.allWindows') }} ({{ windowManager.windows.value.length }})</div>
          <div class="window-list-items">
            <button
              v-for="win in windowManager.windows.value"
              :key="win.id"
              @click="handleSwitchWindow(win.id)"
              class="window-item"
              :class="{ 'active': win.id === windowManager.currentWindowId.value }"
              :title="`${$t('configPanel.switchToWindow')} ${win.id}`"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
              </svg>
              <span class="window-item-text">{{ $t('configPanel.window') }} {{ win.id }}</span>
              <span v-if="win.id === windowManager.currentWindowId.value" class="current-badge">{{ $t('configPanel.current') }}</span>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- 底部操作区（固定） -->
    <div class="bottom-actions">
      <button
        @click="$emit('show-shared-modal')"
        class="btn-explore"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="10"/>
          <path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
        </svg>
        探索网友布局
      </button>
      
      <div class="action-buttons">
        <IconButton
          v-if="isElectron"
          icon="monitor"
          :label="$t('configPanel.proxy') || '代理'"
          @click="$emit('manage-proxy')"
        />
        <IconButton
          icon="help-circle"
          :label="$t('configPanel.help')"
          @click="openHelp"
        />
        <IconButton
          icon="trash-2"
          :label="$t('configPanel.clearConfig')"
          danger
          @click="clearConfig"
        />
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted, onUnmounted, inject } from 'vue'
import { useI18n } from 'vue-i18n'
import { setLocale } from '../i18n/index.js'
import LayoutDropdown from './LayoutDropdown.vue'
import UpdateButton from './UpdateButton.vue'
import SwitchItem from './SwitchItem.vue'
import IconButton from './IconButton.vue'
import { useSharedLayouts } from '../composables/useSharedLayouts'
import { useLayoutOperations } from '../composables/useLayoutOperations'
import { useWindowManager } from '../composables/useWindowManager'

export default {
  name: 'ConfigPanel',
  components: {
    LayoutDropdown,
    UpdateButton,
    SwitchItem,
    IconButton
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
    const { t, locale } = useI18n()
    const showLayoutDropdown = ref(false)
    const currentLocale = computed(() => locale.value)
    let hideTimer = null

    // 从父组件注入对话框方法
    const showPrompt = inject('showPrompt')
    const showConfirm = inject('showConfirm')
    const checkTemplateUpdate = inject('checkTemplateUpdate')
    const syncTemplateUpdate = inject('syncTemplateUpdate')
    const showImportModeDialog = inject('showImportModeDialog')

    // 检测是否在 Electron 环境中
    const isElectron = computed(() => {
      return typeof window !== 'undefined' &&
        (window.electron !== undefined ||
         (navigator.userAgent && navigator.userAgent.toLowerCase().includes('electron')))
    })

    // 使用 composables
    const sharedLayouts = useSharedLayouts(isElectron.value)
    const operations = useLayoutOperations(isElectron.value)
    const windowManager = useWindowManager()

    // 点击外部区域关闭下拉菜单
    const handleClickOutside = (event) => {
      const dropdown = document.querySelector('.layout-dropdown')
      if (dropdown && !dropdown.contains(event.target)) {
        showLayoutDropdown.value = false
        clearHideTimer()
      }
    }

    // 开始隐藏倒计时
    const startHideTimer = () => {
      // 如果正在编辑布局名称，不启动隐藏倒计时
      if (operations.editingLayoutId.value !== null) {
        return
      }
      clearHideTimer()
      hideTimer = setTimeout(() => {
        showLayoutDropdown.value = false
      }, 300) // 300ms 延迟，避免鼠标快速移动时闪烁
    }

    // 清除隐藏倒计时
    const clearHideTimer = () => {
      if (hideTimer) {
        clearTimeout(hideTimer)
        hideTimer = null
      }
    }

    // 处理下拉菜单区域的鼠标离开
    const handleDropdownLeave = () => {
      // 如果正在编辑布局名称，不启动隐藏倒计时
      if (operations.editingLayoutId.value !== null) {
        return
      }
      startHideTimer()
    }


    onMounted(() => {
      document.addEventListener('click', handleClickOutside)
    })

    onUnmounted(() => {
      document.removeEventListener('click', handleClickOutside)
      clearHideTimer()
    })

    const currentLayoutName = () => {
      const layout = props.layouts.find(l => l.id === props.currentLayoutId)
      return layout ? layout.name : t('configPanel.unnamed')
    }

    const toggleLayoutDropdown = () => {
      showLayoutDropdown.value = !showLayoutDropdown.value
    }

    const selectLayout = (layoutId) => {
      emit('switch-layout', layoutId)
      showLayoutDropdown.value = false
    }

    const handleCreateLayout = async () => {
      const name = await showPrompt({
        title: t('configPanel.layoutDropdown.createLayout'),
        message: t('configPanel.layoutDropdown.createLayoutMessage'),
        placeholder: t('configPanel.layoutDropdown.createLayoutPlaceholder')
      })
      if (name && name.trim()) {
        emit('create-layout', name.trim())
        showLayoutDropdown.value = false
      }
    }

    const handleDeleteLayout = async (layoutId, event) => {
      event.stopPropagation()
      const layout = props.layouts.find(l => l.id === layoutId)
      if (layout && await showConfirm(t('configPanel.layoutDropdown.deleteLayout', { name: layout.name }))) {
        emit('delete-layout', layoutId)
      }
    }

    const handleStartRename = (layoutId, event) => {
      const layout = props.layouts.find(l => l.id === layoutId)
      if (layout) {
        operations.startRename(layoutId, layout.name, event)
      }
    }

    const handleConfirmRename = () => {
      operations.confirmRename((layoutId, newName) => {
        emit('rename-layout', layoutId, newName)
      })
    }

    const clearConfig = async () => {
      if (await showConfirm(t('configPanel.layoutDropdown.clearConfig'))) {
        // 使用布局管理器的清除功能，确保正确处理多窗口情况
        emit('clear-config')
        window.location.reload()
      }
    }

    const handleLanguageChange = (locale) => {
      setLocale(locale)
      // 可选：刷新页面以确保所有组件都更新
      // window.location.reload()
    }

    // 打开帮助页面（确保在顶层窗口中打开）
    const openHelp = () => {
      // 使用 window.top 确保在顶层窗口打开，避免在 iframe 中打开
      if (window.top) {
        window.top.open('./help.html', '_blank', 'noopener,noreferrer')
      } else {
        window.open('./help.html', '_blank', 'noopener,noreferrer')
      }
    }

    // 切换到共享标签页
    const handleSwitchToShared = () => {
      sharedLayouts.loadSharedLayouts()
    }

    // 搜索共享布局
    const handleSearchShared = (query) => {
      sharedLayouts.searchQuery.value = query
      sharedLayouts.searchSharedLayouts(query)
    }


    // 分享布局
    const handleShareLayout = async (layout, event) => {
      event.stopPropagation()
      await operations.shareLayout(layout, showConfirm)
    }

    // 同步模板更新
    const handleSyncTemplate = async (layout, event) => {
      event.stopPropagation()
      await operations.syncTemplate(layout, checkTemplateUpdate, syncTemplateUpdate, showConfirm)
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

    // 切换自定义代码
    const handleToggleCustomCode = () => {
      emit('toggle-custom-code', !props.customCodeEnabled)
    }

    // 创建新窗口
    const handleCreateNewWindow = async () => {
      const result = await windowManager.createNewWindow()
      if (result.success) {
        console.log('[ConfigPanel] ✓ 新窗口已创建')
      }
    }

    // 切换到指定窗口
    const handleSwitchWindow = async (windowId) => {
      await windowManager.switchToWindow(windowId)
    }

    return {
      isElectron,
      showLayoutDropdown,
      sharedLayouts,
      operations,
      currentLayoutName,
      toggleLayoutDropdown,
      selectLayout,
      handleCreateLayout,
      handleDeleteLayout,
      handleStartRename,
      handleConfirmRename,
      clearConfig,
      openHelp,
      handleDropdownLeave,
      clearHideTimer,
      startHideTimer,
      handleSwitchToShared,
      handleSearchShared,
      handleShareLayout,
      handleSyncTemplate,
      handleToggleTitles,
      handleToggleGlobalMute,
      handleToggleAdBlock,
      handleToggleCustomCode,
      windowManager,
      handleCreateNewWindow,
      handleSwitchWindow,
      handleLanguageChange,
      currentLocale
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

/* 布局选择器区域 */
.layout-section {
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
}

.layout-list-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.75rem;
  padding: 0 0.5rem;
}

.section-label {
  font-size: 0.75rem;
  font-weight: 600;
  color: #94a3b8;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.btn-new-layout {
  padding: 0.25rem;
  background: transparent;
  border: none;
  border-radius: 0.375rem;
  cursor: pointer;
  color: #94a3b8;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
}

.btn-new-layout:hover {
  background: #f1f5f9;
  color: #64748b;
}

.layout-list {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  flex-shrink: 0;
}

.layout-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.625rem 0.75rem;
  border-radius: 0.5rem;
  cursor: pointer;
  transition: all 0.2s;
  border: 1px solid transparent;
  background: transparent;
  color: #475569;
}

.layout-item:hover {
  background: #f1f5f9;
}

.layout-item.active {
  background: #fff7ed;
  border-color: #fed7aa;
  box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
}

.layout-item.active .layout-icon {
  color: #f97316;
}

.layout-item.active .layout-item-name {
  color: #ea580c;
  font-weight: 600;
}

.layout-item-content {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  overflow: hidden;
  flex: 1;
  min-width: 0;
}

.layout-icon {
  flex-shrink: 0;
  color: #94a3b8;
}

.layout-item-name {
  font-size: 0.875rem;
  font-weight: 500;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.layout-indicator {
  width: 0.375rem;
  height: 0.375rem;
  border-radius: 50%;
  background: #f97316;
  flex-shrink: 0;
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

/* 窗口管理区域 */
.window-management {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  padding: 0 0.5rem;
  margin-top: 0.5rem;
  flex-shrink: 0;
}

.window-management-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.25rem;
}

.window-management-icon {
  color: #94a3b8;
  flex-shrink: 0;
}

.window-management-title {
  font-size: 0.75rem;
  font-weight: 600;
  color: #94a3b8;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

/* 语言选择器样式（在设置容器内，与SwitchItem保持一致） */
.language-selector-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.5rem 0;
}

.language-selector-left {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #475569;
}

.language-icon {
  color: #94a3b8;
  display: flex;
  align-items: center;
}

.language-label {
  font-size: 0.875rem;
  font-weight: 500;
}

.language-select {
  flex-shrink: 0;
  padding: 0.25rem 0.5rem;
  border: 1px solid #cbd5e1;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  font-weight: 500;
  color: #475569;
  background: white;
  cursor: pointer;
  transition: all 0.2s;
  outline: none;
  font-family: inherit;
  min-width: 100px;
}

.language-select:hover {
  border-color: #f97316;
  background: #fff7ed;
}

.language-select:focus {
  border-color: #f97316;
  box-shadow: 0 0 0 3px rgba(249, 115, 22, 0.1);
}

.btn-create-window {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.625rem 0.75rem;
  background: #fff7ed;
  border: 1px solid #fed7aa;
  border-radius: 0.5rem;
  color: #ea580c;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  font-family: inherit;
}

.btn-create-window:hover {
  background: #ffedd5;
  border-color: #f97316;
  color: #c2410c;
  transform: translateY(-1px);
  box-shadow: 0 2px 4px rgba(249, 115, 22, 0.2);
}

.btn-create-window svg {
  stroke: currentColor;
  flex-shrink: 0;
}

.window-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-top: 0.5rem;
}

.window-list-title {
  font-size: 0.75rem;
  color: #94a3b8;
  font-weight: 500;
  padding: 0.25rem 0.5rem;
}

.window-list-items {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.window-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.625rem 0.75rem;
  border-radius: 0.5rem;
  cursor: pointer;
  font-size: 0.875rem;
  font-weight: 500;
  font-family: inherit;
  transition: all 0.2s;
  border: 1px solid transparent;
  background: transparent;
  color: #475569;
}

.window-item:hover {
  background: #f1f5f9;
  color: #f97316;
}

.window-item.active {
  background: #fff7ed;
  border-color: #fed7aa;
  color: #ea580c;
  box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
}

.window-item svg {
  stroke: currentColor;
  flex-shrink: 0;
}

.window-item-text {
  flex: 1;
}

.current-badge {
  font-size: 0.625rem;
  padding: 0.125rem 0.375rem;
  background: #f97316;
  color: white;
  border-radius: 0.25rem;
  font-weight: 600;
  flex-shrink: 0;
}

/* 开关控件样式 */
.toggle-control {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  cursor: pointer;
  user-select: none;
  position: relative;
  padding: 12px;
  border-radius: 8px;
  transition: background 0.3s;
  background: #f8f8f8;
}

.toggle-control:hover {
  background: #fff5f0;
}

.toggle-label {
  font-size: 14px;
  color: #666;
  font-weight: 500;
}

.toggle-checkbox {
  position: absolute;
  opacity: 0;
  width: 0;
  height: 0;
}

.toggle-slider {
  position: relative;
  width: 42px;
  height: 24px;
  background: #ddd;
  border-radius: 12px;
  transition: background 0.3s;
  flex-shrink: 0;
}

.toggle-slider::before {
  content: '';
  position: absolute;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: white;
  top: 3px;
  left: 3px;
  transition: transform 0.3s;
}

.toggle-checkbox:checked + .toggle-slider {
  background: var(--primary-color);
}

.toggle-checkbox:checked + .toggle-slider::before {
  transform: translateX(18px);
}

/* 侧边栏按钮通用样式 */
.sidebar-btn {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 12px 16px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  font-family: inherit;
  transition: all 0.3s;
  border: none;
}

.btn-sessions,
.btn-proxy {
  background: transparent;
  color: #666;
  border: 1px solid #ddd;
}

.btn-sessions:hover,
.btn-proxy:hover {
  background: #fff5f0;
  color: var(--primary-color);
  border-color: var(--primary-color);
  transform: translateX(2px);
}

.btn-sessions svg,
.btn-proxy svg {
  stroke: currentColor;
}

.btn-help {
  background: transparent;
  color: #666;
  border: 1px solid #ddd;
}

.btn-help:hover {
  background: #fff5f0;
  color: var(--primary-color);
  border-color: var(--primary-color);
  transform: translateX(2px);
}

.btn-help svg {
  stroke: currentColor;
}

.btn-download {
  background: var(--primary-color);
  color: white;
}

.btn-download:hover {
  background: var(--primary-hover);
  transform: translateX(2px);
  box-shadow: 0 4px 8px rgba(255, 92, 0, 0.3);
}

.btn-download svg {
  stroke: currentColor;
}

.btn-clear {
  background: transparent;
  color: #666;
  border: 1px solid #ddd;
}

.btn-clear:hover {
  background: #fff5f0;
  color: var(--primary-color);
  border-color: var(--primary-color);
  transform: translateX(2px);
}

.btn-clear svg {
  stroke: currentColor;
}

/* 底部操作区 */
.bottom-actions {
  padding: 1rem;
  border-top: 1px solid #f1f5f9;
  background: white;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  flex-shrink: 0;
  z-index: 10;
}

.btn-explore {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  background: #1e293b;
  color: white;
  padding: 0.625rem;
  border-radius: 0.5rem;
  font-size: 0.875rem;
  font-weight: 500;
  border: none;
  cursor: pointer;
  transition: all 0.2s;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
}

.btn-explore:hover {
  background: #0f172a;
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
}

.btn-explore svg {
  width: 1rem;
  height: 1rem;
}

.action-buttons {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0.5rem;
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
