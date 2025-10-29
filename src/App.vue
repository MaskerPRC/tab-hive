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
      :showUpdateButton="showUpdateButton"
      @switch-layout="handleSwitchLayout"
      @create-layout="handleCreateLayout"
      @delete-layout="handleDeleteLayout"
      @rename-layout="renameLayout"
      @show-download-modal="handleShowDownloadModal"
      @toggle-titles="handleToggleTitles"
      @toggle-refresh-on-fullscreen="handleToggleRefreshOnFullscreen"
      @manage-sessions="handleManageSessions"
      @show-update="handleShowUpdate"
      @mouseenter="showPanel = true"
      @mouseleave="handlePanelLeave"
    />
    <GridView
      :websites="websites"
      :rows="2"
      :cols="2"
      :fullscreenIndex="fullscreenIndex"
      :globalSettings="layoutManager.globalSettings.value"
      @fullscreen="handleFullscreen"
      @exitFullscreen="exitFullscreen"
      @add-website="handleAddWebsite"
      @copy-website="handleCopyWebsite"
      @remove-website="handleRemoveWebsite"
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
      websiteManager.addWebsite(websiteData)
    }

    const handleCopyWebsite = (index) => {
      websiteManager.copyWebsite(index)
    }

    const handleRemoveWebsite = (index) => {
      websiteManager.removeWebsite(index)
    }

    const handleUpdateWebsite = (params) => {
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

    // 切换布局
    const handleSwitchLayout = (layoutId) => {
      const websites = layoutManager.switchLayout(layoutId)
      websiteManager.setWebsites(websites)
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
      console.log('网站数量变化，触发保存')
      layoutManager.saveCurrentLayout(websiteManager.websites.value)
    })

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
      renameLayout: layoutManager.renameLayout,
      handleToggleTitles,
      handleToggleRefreshOnFullscreen
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
</style>
