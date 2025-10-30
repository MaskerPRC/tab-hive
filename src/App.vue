<template>
  <div class="app-container" @mousemove="handleMouseMove">
    <!-- 下载插件/客户端提醒弹窗 -->
    <DownloadModal :visible="showDownloadModal" @close="closeDownloadModal" />

    <!-- 更新通知 -->
    <UpdateNotification
      :visible="showUpdateNotification"
      :currentVersion="currentVersion"
      :latestVersion="latestVersion"
      :updateInfo="updateInfo"
      :downloadStatus="downloadStatus"
      @close="handleCloseUpdateNotification"
      @ignore="handleIgnoreUpdate"
      @update="handleStartDownload"
      @install="handleInstallUpdate"
      @cancel-download="handleCancelDownload"
      @retry-download="handleRetryDownload"
    />

    <!-- 视图切换按钮 -->
    <div v-if="false" class="view-toggle">
      <button
        @click="switchView('grid')"
        class="view-toggle-btn"
        :class="{ active: currentView === 'grid' }"
        title="网格视图"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <rect x="3" y="3" width="7" height="7"/>
          <rect x="14" y="3" width="7" height="7"/>
          <rect x="14" y="14" width="7" height="7"/>
          <rect x="3" y="14" width="7" height="7"/>
        </svg>
      </button>
      <button
        @click="switchView('canvas')"
        class="view-toggle-btn"
        :class="{ active: currentView === 'canvas' }"
        title="画布视图"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M12 19l7-7 3 3-7 7-3-3z"/>
          <path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z"/>
          <path d="M2 2l7.586 7.586"/>
          <circle cx="11" cy="11" r="2"/>
        </svg>
      </button>
    </div>

    <!-- 左侧检测区域和展开标签 -->
    <div
      v-if="fullscreenIndex === null"
      class="left-trigger-area"
      @mouseenter="showPanel = true"
    >
      <div class="sidebar-toggle-indicator" :class="{ 'hidden': showPanel }">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="9 18 15 12 9 6"/>
        </svg>
      </div>
    </div>

    <ConfigPanel
      v-if="fullscreenIndex === null"
      :class="{ 'panel-visible': showPanel }"
      :layouts="layouts"
      :currentLayoutId="currentLayoutId"
      :showTitles="layoutManager.globalSettings.value.showTitles"
      :refreshOnFullscreenToggle="layoutManager.globalSettings.value.refreshOnFullscreenToggle"
      :globalMuted="layoutManager.globalSettings.value.globalMuted"
      :showUpdateButton="showUpdateButton"
      @switch-layout="handleSwitchLayout"
      @create-layout="handleCreateLayout"
      @delete-layout="handleDeleteLayout"
      @rename-layout="renameLayout"
      @toggle-keep-alive="handleToggleKeepAlive"
      @show-download-modal="handleShowDownloadModal"
      @toggle-titles="handleToggleTitles"
      @toggle-refresh-on-fullscreen="handleToggleRefreshOnFullscreen"
      @toggle-global-mute="handleToggleGlobalMute"
      @manage-sessions="handleManageSessions"
      @show-update="handleShowUpdate"
      @clear-config="handleClearConfig"
      @mouseenter="showPanel = true"
      @mouseleave="handlePanelLeave"
    />
    <!-- 网格视图 -->
    <template v-if="currentView === 'grid'">
      <template v-for="layout in layouts" :key="`layout-${layout.id}`">
        <GridView
          v-if="layout.id === currentLayoutId || layout.keepAlive"
          :class="{ 'layout-hidden': layout.id !== currentLayoutId }"
          :websites="layout.id === currentLayoutId ? websites : layout.websites"
          :rows="2"
          :cols="2"
          :fullscreenIndex="layout.id === currentLayoutId ? fullscreenIndex : null"
          :globalSettings="layoutManager.globalSettings.value"
          @fullscreen="layout.id === currentLayoutId ? handleFullscreen($event) : null"
          @exitFullscreen="exitFullscreen"
          @add-website="(data) => layout.id === currentLayoutId ? handleAddWebsite(data) : null"
          @copy-website="(index) => layout.id === currentLayoutId ? handleCopyWebsite(index) : null"
          @remove-website="(index) => layout.id === currentLayoutId ? handleRemoveWebsite(index) : null"
          @update-website="(data) => layout.id === currentLayoutId ? handleUpdateWebsite(data) : null"
        />
      </template>
    </template>

    <!-- 画布视图 -->
    <CanvasView
      v-if="currentView === 'canvas'"
      :websites="websites"
      @add-website="handleAddWebsite"
      @update-website="handleUpdateWebsite"
    />

    <!-- 全局对话框 -->
    <Dialog
      v-model:visible="dialogVisible"
      :type="dialogType"
      :title="dialogTitle"
      :message="dialogMessage"
      :placeholder="dialogPlaceholder"
      :defaultValue="dialogDefaultValue"
      @confirm="handleDialogConfirm"
      @cancel="handleDialogCancel"
    />

    <!-- 导入模式选择对话框 -->
    <ImportModeDialog
      :visible="showImportDialog"
      @close="closeImportDialog"
      @select-mode="handleImportModeSelect"
    />

    <!-- Session实例管理对话框 -->
    <SessionInstanceManager
      :visible="showSessionManager"
      :websites="websites"
      @close="closeSessionManager"
    />
  </div>
</template>

<script>
import { ref, watch, onMounted, provide } from 'vue'
import ConfigPanel from './components/ConfigPanel.vue'
import GridView from './components/GridView.vue'
import CanvasView from './components/CanvasView.vue'
import Dialog from './components/Dialog.vue'
import DownloadModal from './components/DownloadModal.vue'
import ImportModeDialog from './components/ImportModeDialog.vue'
import SessionInstanceManager from './components/SessionInstanceManager.vue'
import UpdateNotification from './components/UpdateNotification.vue'
import { useDialog } from './composables/useDialog'
import { useLayoutManager } from './composables/useLayoutManager'
import { useWebsiteManager } from './composables/useWebsiteManager'
import { useImportExport } from './composables/useImportExport'
import { useUpdateChecker } from './composables/useUpdateChecker'

export default {
  name: 'App',
  components: {
    ConfigPanel,
    GridView,
    CanvasView,
    Dialog,
    DownloadModal,
    ImportModeDialog,
    SessionInstanceManager,
    UpdateNotification
  },
  setup() {
    // 使用 composables
    const dialog = useDialog()
    const layoutManager = useLayoutManager()
    const importExport = useImportExport()
    const updateChecker = useUpdateChecker()

    // 初始化网站管理器
    const websiteManager = useWebsiteManager(layoutManager.currentLayout.value.websites)

    // 检查用户是否已经看过首次弹窗
    const hasSeenDownloadModal = () => {
      try {
        return localStorage.getItem('tab-hive-seen-download-modal') === 'true'
      } catch (e) {
        return false
      }
    }

    // 控制下载弹窗显示
    const showDownloadModal = ref(!dialog.isElectron.value && !hasSeenDownloadModal())

    // 全屏状态
    const fullscreenIndex = ref(null)

    // 侧边栏显示状态
    const showPanel = ref(false)

    // Session实例管理对话框显示状态
    const showSessionManager = ref(false)

    // 当前视图：grid 或 canvas
    const currentView = ref('grid')

    // 打开Session实例管理对话框
    const handleManageSessions = () => {
      showSessionManager.value = true
    }

    // 关闭Session实例管理对话框
    const closeSessionManager = () => {
      showSessionManager.value = false
    }

    // 显示更新通知（从按钮点击）
    const handleShowUpdate = () => {
      updateChecker.showNotificationFromButton()
    }

    // 更新检测相关处理函数
    const handleCloseUpdateNotification = () => {
      updateChecker.closeNotification()
    }

    const handleIgnoreUpdate = () => {
      updateChecker.ignoreUpdate()
    }

    const handleStartDownload = () => {
      updateChecker.startDownload()
    }

    const handleInstallUpdate = (filePath) => {
      updateChecker.openInstaller(filePath)
    }

    const handleCancelDownload = () => {
      updateChecker.cancelDownload()
    }

    const handleRetryDownload = () => {
      updateChecker.retryDownload()
    }

    // 关闭下载弹窗
    const closeDownloadModal = () => {
      const isFirstTime = !hasSeenDownloadModal()
      showDownloadModal.value = false

      // 保存用户已经看过弹窗的标记
      try {
        localStorage.setItem('tab-hive-seen-download-modal', 'true')
      } catch (e) {
        console.error('保存弹窗状态失败:', e)
      }

      // 如果是首次关闭弹窗，显示侧边栏让用户知道
      if (isFirstTime) {
        setTimeout(() => {
          showPanel.value = true

          // 3秒后自动隐藏
          setTimeout(() => {
            showPanel.value = false
          }, 3000)
        }, 300) // 稍微延迟一下，让弹窗关闭动画完成
      }
    }

    // 显示下载弹窗（手动触发）
    const handleShowDownloadModal = () => {
      showDownloadModal.value = true
    }

    const handleFullscreen = (index) => {
      fullscreenIndex.value = index
    }

    const exitFullscreen = () => {
      fullscreenIndex.value = null
    }

    const handleMouseMove = (event) => {
      // 鼠标在左侧 5px 区域时显示面板
      if (event.clientX < 5) {
        showPanel.value = true
      }
    }

    const handlePanelLeave = () => {
      // 检查是否有输入框正在使用（重命名输入框或搜索框）
      const activeElement = document.activeElement
      if (activeElement && (
        activeElement.classList.contains('rename-input') ||
        activeElement.classList.contains('search-input')
      )) {
        return // 不隐藏面板
      }
      showPanel.value = false
    }

    const handleAddWebsite = (websiteData) => {
      console.log('[App] 准备添加网站，数据:', websiteData)
      websiteManager.addWebsite(websiteData)
      console.log('[App] 添加网站后，当前网站列表:', websiteManager.websites.value)
      console.log('[App] 当前布局ID:', layoutManager.currentLayoutId.value)
    }

    const handleCopyWebsite = (index) => {
      websiteManager.copyWebsite(index)
    }

    const handleRemoveWebsite = (index) => {
      websiteManager.removeWebsite(index)
    }

    const handleUpdateWebsite = (params) => {
      console.log('[App] ========== handleUpdateWebsite 被调用 ==========')
      console.log('[App] 接收到的参数:', params)
      console.log('[App] 参数的键:', Object.keys(params))
      websiteManager.updateWebsite(params)
      // 立即触发保存
      layoutManager.saveCurrentLayout(websiteManager.websites.value)
    }

    // 切换标题显示
    const handleToggleTitles = (showTitles) => {
      layoutManager.updateGlobalSettings({ showTitles })
    }

    // 切换全屏刷新配置
    const handleToggleRefreshOnFullscreen = (refreshOnFullscreenToggle) => {
      layoutManager.updateGlobalSettings({ refreshOnFullscreenToggle })
    }

    // 切换全局静音
    const handleToggleGlobalMute = (globalMuted) => {
      layoutManager.updateGlobalSettings({ globalMuted })
      // 应用到所有网站
      if (globalMuted) {
        // 静音所有网站
        websiteManager.websites.value.forEach((website, index) => {
          if (!website.muted) {
            websiteManager.updateWebsite({ index, updates: { muted: true } })
          }
        })
      } else {
        // 解除所有网站的静音
        websiteManager.websites.value.forEach((website, index) => {
          if (website.muted) {
            websiteManager.updateWebsite({ index, updates: { muted: false } })
          }
        })
      }
    }

    // 切换布局
    const handleSwitchLayout = (layoutId) => {
      const websites = layoutManager.switchLayout(layoutId)
      websiteManager.setWebsites(websites)
      
      // 如果全局静音已开启，应用到新布局的所有网站
      if (layoutManager.globalSettings.value.globalMuted) {
        console.log('[App] 全局静音已开启，应用到新布局的所有网站')
        websiteManager.websites.value.forEach((website, index) => {
          if (!website.muted) {
            websiteManager.updateWebsite({ index, updates: { muted: true } })
          }
        })
      }
    }

    // 创建新布局
    const handleCreateLayout = (name, options = {}) => {
      const newLayout = layoutManager.createLayout(name, options)
      handleSwitchLayout(newLayout.id)
    }

    // 删除布局
    const handleDeleteLayout = (layoutId) => {
      if (layoutManager.layouts.value.length <= 1) {
        alert('至少需要保留一个布局')
        return
      }

      const result = layoutManager.deleteLayout(layoutId)

      // 如果删除的是当前布局，切换到第一个布局
      if (typeof result === 'number') {
        handleSwitchLayout(result)
      }
    }

    // 切换布局后台运行状态
    const handleToggleKeepAlive = (layoutId) => {
      const newState = layoutManager.toggleKeepAlive(layoutId)
      const layout = layoutManager.layouts.value.find(l => l.id === layoutId)
      if (layout) {
        const message = newState
          ? `布局 "${layout.name}" 已开启后台运行\n\n切换到其他布局时，该布局将保持运行状态，不会被卸载。`
          : `布局 "${layout.name}" 已关闭后台运行\n\n切换到其他布局时，该布局将被卸载以节省资源。`
        alert(message)
      }
    }

    // 处理导入模式选择
    const handleImportModeSelect = (mode) => {
      importExport.handleImportMode(
        mode,
        dialog.isElectron.value,
        (layoutData) => {
          handleCreateLayout(layoutData.name, layoutData)
        }
      )
    }

    // 处理清除配置
    const handleClearConfig = () => {
      layoutManager.clearConfig()
    }

    // 提供给子组件使用
    provide('showPrompt', dialog.showPrompt)
    provide('showConfirm', dialog.showConfirm)
    provide('checkTemplateUpdate', (layoutId) =>
      layoutManager.checkTemplateUpdate(layoutId, dialog.isElectron.value)
    )
    provide('syncTemplateUpdate', (layoutId) =>
      layoutManager.syncTemplateUpdate(
        layoutId,
        dialog.isElectron.value,
        (websites) => websiteManager.setWebsites(websites)
      )
    )
    provide('showImportModeDialog', importExport.showImportModeDialog)
    provide('openSessionManager', handleManageSessions)

    // 监听网站添加/删除，自动保存到当前布局
    watch(() => websiteManager.websites.value.length, () => {
      console.log('[App] ========== 网站数量变化 ==========')
      console.log('[App] 新数量:', websiteManager.websites.value.length)
      console.log('[App] 网站列表:', websiteManager.websites.value)
      console.log('[App] 准备保存到布局:', layoutManager.currentLayoutId.value)
      layoutManager.saveCurrentLayout(websiteManager.websites.value)
      console.log('[App] 保存完成')
    })

    // 切换视图
    const switchView = (view) => {
      currentView.value = view
      console.log('[App] 切换到视图:', view)
    }

    // 页面加载时自动显示左侧栏，然后隐藏
    onMounted(() => {
      // 首先尝试从 URL 参数导入布局
      const importedLayout = importExport.importLayoutFromUrlParams()
      if (importedLayout) {
        handleCreateLayout(importedLayout.name, importedLayout)
      }

      // 如果有弹窗显示，等待弹窗关闭后再显示侧边栏
      // 否则直接显示侧边栏
      if (!showDownloadModal.value) {
        // 初始显示侧边栏
        showPanel.value = true

        // 如果成功导入了布局，显示提示
        if (importedLayout) {
          setTimeout(() => {
            alert('已成功从 URL 参数导入布局！')
          }, 500)
        }

        // 3秒后自动隐藏
        setTimeout(() => {
          showPanel.value = false
        }, 3000)
      }
    })

    return {
      // 状态
      showDownloadModal,
      fullscreenIndex,
      showPanel,
      showSessionManager,
      websites: websiteManager.websites,
      layouts: layoutManager.layouts,
      currentLayoutId: layoutManager.currentLayoutId,
      layoutManager,
      // 更新检测状态
      showUpdateNotification: updateChecker.showUpdateNotification,
      showUpdateButton: updateChecker.showUpdateButton,
      currentVersion: updateChecker.currentVersion,
      latestVersion: updateChecker.latestVersion,
      updateInfo: updateChecker.updateInfo,
      downloadStatus: updateChecker.downloadStatus,
      // 对话框
      dialogVisible: dialog.dialogVisible,
      dialogType: dialog.dialogType,
      dialogTitle: dialog.dialogTitle,
      dialogMessage: dialog.dialogMessage,
      dialogPlaceholder: dialog.dialogPlaceholder,
      dialogDefaultValue: dialog.dialogDefaultValue,
      handleDialogConfirm: dialog.handleDialogConfirm,
      handleDialogCancel: dialog.handleDialogCancel,
      // 导入对话框
      showImportDialog: importExport.showImportDialog,
      closeImportDialog: importExport.closeImportDialog,
      handleImportModeSelect,
      // 方法
      closeDownloadModal,
      handleShowDownloadModal,
      handleManageSessions,
      closeSessionManager,
      handleShowUpdate,
      handleCloseUpdateNotification,
      handleIgnoreUpdate,
      handleStartDownload,
      handleInstallUpdate,
      handleCancelDownload,
      handleRetryDownload,
      handleFullscreen,
      exitFullscreen,
      handleMouseMove,
      handlePanelLeave,
      handleAddWebsite,
      handleCopyWebsite,
      handleRemoveWebsite,
      handleUpdateWebsite,
      handleSwitchLayout,
      handleCreateLayout,
      handleDeleteLayout,
      handleToggleKeepAlive,
      renameLayout: layoutManager.renameLayout,
      handleToggleTitles,
      handleToggleRefreshOnFullscreen,
      handleToggleGlobalMute,
      currentView,
      switchView
    }
  }
}
</script>

<style scoped>
.app-container {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  position: relative;
}

/* 布局后台运行：隐藏非激活布局但保持DOM存在 */
.layout-hidden {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  visibility: hidden;
  pointer-events: none;
  z-index: -1;
}

.left-trigger-area {
  position: fixed;
  top: 0;
  left: 0;
  width: 5px;
  height: 100%;
  z-index: 1000;
  pointer-events: all;
}

.sidebar-toggle-indicator {
  position: fixed;
  left: 0;
  top: 50%;
  transform: translateY(-50%);
  width: 30px;
  height: 80px;
  background: var(--primary-color);
  border-radius: 0 8px 8px 0;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 2px 0 8px rgba(0, 0, 0, 0.15);
  cursor: pointer;
  transition: all 0.3s ease-out;
  opacity: 0.7;
  z-index: 998;
}

.sidebar-toggle-indicator:hover {
  opacity: 1;
  width: 35px;
  box-shadow: 2px 0 12px rgba(255, 92, 0, 0.3);
}

.sidebar-toggle-indicator svg {
  color: white;
  animation: pulse 2s ease-in-out infinite;
}

.sidebar-toggle-indicator.hidden {
  opacity: 0;
  pointer-events: none;
}

@keyframes pulse {
  0%, 100% {
    transform: translateX(0);
  }
  50% {
    transform: translateX(3px);
  }
}

.app-container :deep(.config-panel) {
  position: fixed;
  top: 0;
  left: 0;
  bottom: 0;
  z-index: 999;
  transform: translateX(-100%);
  transition: transform 0.3s ease-out;
}

.app-container :deep(.config-panel.panel-visible) {
  transform: translateX(0);
}

/* 视图切换按钮 */
.view-toggle {
  position: fixed;
  top: 20px;
  right: 20px;
  display: flex;
  gap: 8px;
  z-index: 999;
  background: white;
  padding: 8px;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.view-toggle-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  border: 2px solid #ddd;
  border-radius: 8px;
  background: white;
  cursor: pointer;
  transition: all 0.3s;
  color: #666;
}

.view-toggle-btn:hover {
  background: #f8f9fa;
  border-color: var(--primary-color);
  color: var(--primary-color);
}

.view-toggle-btn.active {
  background: var(--primary-color);
  border-color: var(--primary-color);
  color: white;
}

.view-toggle-btn svg {
  stroke: currentColor;
}
</style>
