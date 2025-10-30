<template>
  <div class="config-panel" @mouseleave="handlePanelMouseLeave">
    <div class="sidebar-content">
      <!-- Logo 和标题 -->
      <div class="logo-section">
        <img src="/128x128.png" alt="Tab Hive Logo" class="logo-img" />
        <h2 class="app-title">Tab Hive</h2>
      </div>

      <!-- 布局选择器 -->
      <div class="layout-section">
        <LayoutDropdown
          :visible="showLayoutDropdown"
          :layouts="layouts"
          :currentLayoutId="currentLayoutId"
          :currentLayoutName="currentLayoutName()"
          :editingLayoutId="operations.editingLayoutId.value"
          :editingLayoutName="operations.editingLayoutName.value"
          :sharedLayouts="sharedLayouts.sharedLayouts.value"
          :loadingShared="sharedLayouts.loadingShared.value"
          :searchQuery="sharedLayouts.searchQuery.value"
          @toggle="toggleLayoutDropdown"
          @select-layout="selectLayout"
          @create-layout="handleCreateLayout"
          @start-rename="handleStartRename"
          @confirm-rename="handleConfirmRename"
          @cancel-rename="operations.cancelRename"
          @delete-layout="handleDeleteLayout"
          @toggle-keep-alive="$emit('toggle-keep-alive', $event)"
          @share-layout="handleShareLayout"
          @sync-template="handleSyncTemplate"
          @switch-to-shared="handleSwitchToShared"
          @search-shared="handleSearchShared"
          @import-layout="handleImportLayout"
          @clear-hide-timer="clearHideTimer"
          @start-hide-timer="handleDropdownLeave"
          @update:editingLayoutName="operations.editingLayoutName.value = $event"
          @update:searchQuery="sharedLayouts.searchQuery.value = $event"
        />
      </div>

      <!-- 设置和操作按钮 -->
      <div class="actions-section">
        <!-- 窗口管理区域（仅 Electron 环境） -->
        <div v-if="isElectron" class="window-management">
          <div class="section-title">窗口管理</div>
          
          <button
            @click="handleCreateNewWindow"
            class="sidebar-btn btn-window"
            title="创建新的 Tab Hive 窗口"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
              <line x1="12" y1="8" x2="12" y2="16"/>
              <line x1="8" y1="12" x2="16" y2="12"/>
            </svg>
            <span>新建窗口</span>
          </button>

          <div v-if="windowManager.windows.value.length > 1" class="window-list">
            <div class="window-list-title">所有窗口 ({{ windowManager.windows.value.length }})</div>
            <button
              v-for="win in windowManager.windows.value"
              :key="win.id"
              @click="handleSwitchWindow(win.id)"
              class="window-item"
              :class="{ 'active': win.id === windowManager.currentWindowId.value }"
              :title="`切换到窗口 ${win.id}`"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
              </svg>
              <span>窗口 {{ win.id }}</span>
              <span v-if="win.id === windowManager.currentWindowId.value" class="current-badge">当前</span>
            </button>
          </div>
        </div>

        <div class="section-divider"></div>

        <label class="toggle-control" title="显示/隐藏蜂巢标题">
          <span class="toggle-label">显示标题</span>
          <input
            type="checkbox"
            :checked="showTitles"
            @change="handleToggleTitles"
            class="toggle-checkbox"
          />
          <span class="toggle-slider"></span>
        </label>

        <label class="toggle-control" title="选择器类型的蜂巢，全屏切换时是否刷新网页">
          <span class="toggle-label">全屏切换刷新</span>
          <input
            type="checkbox"
            :checked="refreshOnFullscreenToggle"
            @change="handleToggleRefreshOnFullscreen"
            class="toggle-checkbox"
          />
          <span class="toggle-slider"></span>
        </label>

        <label class="toggle-control" title="全局静音/取消静音所有网页">
          <span class="toggle-label">全局静音</span>
          <input
            type="checkbox"
            :checked="globalMuted"
            @change="handleToggleGlobalMute"
            class="toggle-checkbox"
          />
          <span class="toggle-slider"></span>
        </label>

        <button
          @click="$emit('manage-sessions')"
          class="sidebar-btn btn-sessions"
          title="管理Cookie共享实例"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="3" y="3" width="7" height="7"/>
            <rect x="14" y="3" width="7" height="7"/>
            <rect x="14" y="14" width="7" height="7"/>
            <rect x="3" y="14" width="7" height="7"/>
          </svg>
          <span>实例管理</span>
        </button>

        <button
          @click="openHelp"
          class="sidebar-btn btn-help"
          title="使用帮助"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"/>
            <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/>
            <line x1="12" y1="17" x2="12.01" y2="17"/>
          </svg>
          <span>使用帮助</span>
        </button>

        <button
          v-if="!isElectron"
          class="sidebar-btn btn-download"
          @click="$emit('show-download-modal')"
          title="下载桌面客户端或插件"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
            <polyline points="7 10 12 15 17 10"/>
            <line x1="12" y1="15" x2="12" y2="3"/>
          </svg>
          <span>下载插件</span>
        </button>

        <button class="sidebar-btn btn-clear" @click="clearConfig" title="清除所有配置">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="3 6 5 6 21 6"/>
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
          </svg>
          <span>清除配置</span>
        </button>

        <!-- 更新按钮 -->
        <UpdateButton
          :visible="showUpdateButton"
          @click="$emit('show-update')"
        />
      </div>
    </div>

    <!-- 右侧边缘提示条 -->
    <div class="sidebar-edge-indicator"></div>
  </div>
</template>

<script>
import { ref, computed, onMounted, onUnmounted, inject } from 'vue'
import LayoutDropdown from './LayoutDropdown.vue'
import UpdateButton from './UpdateButton.vue'
import { useSharedLayouts } from '../composables/useSharedLayouts'
import { useLayoutOperations } from '../composables/useLayoutOperations'
import { useWindowManager } from '../composables/useWindowManager'

export default {
  name: 'ConfigPanel',
  components: {
    LayoutDropdown,
    UpdateButton
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
    refreshOnFullscreenToggle: {
      type: Boolean,
      default: true
    },
    globalMuted: {
      type: Boolean,
      default: false
    },
    showUpdateButton: {
      type: Boolean,
      default: false
    }
  },
  emits: ['switch-layout', 'create-layout', 'delete-layout', 'toggle-keep-alive', 'rename-layout', 'show-download-modal', 'toggle-titles', 'toggle-refresh-on-fullscreen', 'toggle-global-mute', 'manage-sessions', 'show-update'],
  setup(props, { emit }) {
    const showLayoutDropdown = ref(false)
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

    // 处理顶栏鼠标离开（顶栏隐藏时关闭下拉菜单）
    const handlePanelMouseLeave = () => {
      // 如果正在编辑布局名称，不隐藏面板
      if (operations.editingLayoutId.value !== null) {
        return
      }
      showLayoutDropdown.value = false
      clearHideTimer()
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
      return layout ? layout.name : '未命名'
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
        title: '创建新布局',
        message: '请输入新布局名称',
        placeholder: '新布局'
      })
      if (name && name.trim()) {
        emit('create-layout', name.trim())
        showLayoutDropdown.value = false
      }
    }

    const handleDeleteLayout = async (layoutId, event) => {
      event.stopPropagation()
      const layout = props.layouts.find(l => l.id === layoutId)
      if (layout && await showConfirm(`确定要删除布局 "${layout.name}" 吗？`)) {
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
      if (await showConfirm('确定要清除所有配置吗？这将删除所有网站和布局设置。')) {
        // 使用布局管理器的清除功能，确保正确处理多窗口情况
        emit('clear-config')
        window.location.reload()
      }
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

    // 导入布局
    const handleImportLayout = (layout) => {
      showLayoutDropdown.value = false
      showImportModeDialog(layout)
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
    const handleToggleTitles = (event) => {
      emit('toggle-titles', event.target.checked)
    }

    // 切换全屏刷新配置
    const handleToggleRefreshOnFullscreen = (event) => {
      emit('toggle-refresh-on-fullscreen', event.target.checked)
    }

    // 切换全局静音
    const handleToggleGlobalMute = (event) => {
      emit('toggle-global-mute', event.target.checked)
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
      handlePanelMouseLeave,
      handleSwitchToShared,
      handleSearchShared,
      handleImportLayout,
      handleShareLayout,
      handleSyncTemplate,
      handleToggleTitles,
      handleToggleRefreshOnFullscreen,
      handleToggleGlobalMute,
      windowManager,
      handleCreateNewWindow,
      handleSwitchWindow
    }
  }
}
</script>

<style scoped>
.config-panel {
  background: white;
  width: 280px;
  height: 100%;
  border-right: 3px solid var(--primary-color);
  box-shadow: 4px 0 12px rgba(0, 0, 0, 0.15);
  display: flex;
  position: relative;
}

.sidebar-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow-y: auto;
  overflow-x: hidden;
  padding: 20px;
  gap: 25px;
}

/* Logo 区域 */
.logo-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  padding-bottom: 20px;
  border-bottom: 2px solid #f0f0f0;
}

.logo-img {
  width: 64px;
  height: 64px;
  object-fit: contain;
}

.app-title {
  color: var(--primary-color);
  font-size: 24px;
  font-weight: 600;
  margin: 0;
  text-align: center;
}

/* 布局选择器区域 */
.layout-section {
  position: relative;
  flex: 1;
}

/* 操作按钮区域 */
.actions-section {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding-top: 20px;
  border-top: 2px solid #f0f0f0;
}

/* 窗口管理区域 */
.window-management {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.section-title {
  font-size: 13px;
  font-weight: 600;
  color: #888;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 4px;
}

.section-divider {
  height: 1px;
  background: #e0e0e0;
  margin: 8px 0;
}

.btn-window {
  background: var(--primary-color);
  color: white;
}

.btn-window:hover {
  background: var(--primary-hover);
  transform: translateX(2px);
  box-shadow: 0 4px 8px rgba(255, 92, 0, 0.3);
}

.btn-window svg {
  stroke: currentColor;
}

.window-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-top: 8px;
}

.window-list-title {
  font-size: 12px;
  color: #999;
  font-weight: 500;
  padding: 4px 8px;
}

.window-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 13px;
  font-weight: 500;
  font-family: inherit;
  transition: all 0.2s;
  border: 1px solid #e0e0e0;
  background: white;
  color: #666;
}

.window-item:hover {
  background: #f8f8f8;
  border-color: var(--primary-color);
  color: var(--primary-color);
  transform: translateX(2px);
}

.window-item.active {
  background: #fff5f0;
  border-color: var(--primary-color);
  color: var(--primary-color);
}

.window-item svg {
  stroke: currentColor;
  flex-shrink: 0;
}

.current-badge {
  margin-left: auto;
  font-size: 11px;
  padding: 2px 6px;
  background: var(--primary-color);
  color: white;
  border-radius: 4px;
  font-weight: 600;
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

.btn-sessions {
  background: transparent;
  color: #666;
  border: 1px solid #ddd;
}

.btn-sessions:hover {
  background: #fff5f0;
  color: var(--primary-color);
  border-color: var(--primary-color);
  transform: translateX(2px);
}

.btn-sessions svg {
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

/* 右侧边缘提示条 */
.sidebar-edge-indicator {
  position: absolute;
  right: 0;
  top: 50%;
  transform: translateY(-50%);
  width: 4px;
  height: 60px;
  background: var(--primary-color);
  border-radius: 4px 0 0 4px;
  opacity: 0.6;
  transition: all 0.3s;
}

.config-panel:hover .sidebar-edge-indicator {
  opacity: 0.9;
  height: 80px;
}

/* 滚动条样式 */
.sidebar-content::-webkit-scrollbar {
  width: 6px;
}

.sidebar-content::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 3px;
}

.sidebar-content::-webkit-scrollbar-thumb {
  background: #ccc;
  border-radius: 3px;
}

.sidebar-content::-webkit-scrollbar-thumb:hover {
  background: #999;
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
