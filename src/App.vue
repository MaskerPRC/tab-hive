<template>
  <div class="app-container">
    <!-- 下载插件/客户端提醒弹窗 -->
    <DownloadModal :visible="showDownloadModal" @close="closeDownloadModal" />

    <!-- 代理节点管理 -->
    <ProxyManager :show="showProxyManager" @close="closeProxyManager" />

    <!-- LLM API 配置 -->
    <LlmConfigDialog
      :show="showLlmConfig"
      :config="llmConfig"
      @confirm="handleLlmConfigConfirm"
      @cancel="showLlmConfig = false"
    />

    <!-- 监听规则列表弹窗 -->
    <MonitoringRulesList
      :show="showMonitoringRulesList"
      :website-id="currentMonitoringWebsiteId"
      :dark-mode="currentMonitoringDarkMode"
      @close="showMonitoringRulesList = false"
      @create="handleCreateMonitoringRule"
      @edit="handleEditMonitoringRule"
      @delete="handleDeleteMonitoringRule"
      @toggle="handleToggleMonitoringRule"
    />

    <!-- 监听规则编辑弹窗 -->
    <MonitoringRuleDialog
      :show="showMonitoringRuleDialog"
      :website-id="currentMonitoringWebsiteId"
      :rule="editingMonitoringRule"
      :dark-mode="currentMonitoringDarkMode"
      @close="closeMonitoringRuleDialog"
      @save="handleSaveMonitoringRule"
      @open-api-settings="handleOpenLlmConfig"
    />

    <!-- 工作流编辑器 -->
    <WorkflowEditor
      v-if="showWorkflowEditor"
      :show="showWorkflowEditor"
      :website-id="currentWorkflowWebsiteId"
      :website-name="currentWorkflowWebsiteName"
      :dark-mode="currentWorkflowDarkMode"
      @close="closeWorkflowEditor"
      @save="handleSaveWorkflow"
    />

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

    <!-- 侧边栏切换按钮和当前布局名称 -->
    <div v-if="fullscreenIndex === null" class="sidebar-header" :class="{ 'panel-visible': showPanel }">
      <button
        class="sidebar-toggle-btn"
        @click="showPanel = !showPanel"
        :title="showPanel ? '隐藏侧边栏' : '显示侧边栏'"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <rect x="3" y="3" width="7" height="7"/>
          <rect x="14" y="3" width="7" height="7"/>
          <rect x="14" y="14" width="7" height="7"/>
          <rect x="3" y="14" width="7" height="7"/>
        </svg>
      </button>
      <div class="current-layout-title">
        {{ currentLayoutName }}
      </div>
    </div>

    <ConfigPanel
      v-if="fullscreenIndex === null"
      :class="{ 'panel-visible': showPanel }"
      :layouts="layouts"
      :currentLayoutId="currentLayoutId"
      :showTitles="layoutManager.globalSettings.value.showTitles"
      :globalMuted="layoutManager.globalSettings.value.globalMuted"
      :adBlockEnabled="layoutManager.globalSettings.value.adBlockEnabled"
      :customCodeEnabled="layoutManager.globalSettings.value.customCodeEnabled"
      :showCertificateErrorShadow="layoutManager.globalSettings.value.showCertificateErrorShadow"
      :showUpdateButton="showUpdateButton"
      @switch-layout="handleSwitchLayout"
      @create-layout="handleCreateLayout"
      @delete-layout="handleDeleteLayout"
      @rename-layout="handleRenameLayout"
      @toggle-keep-alive="handleToggleKeepAlive"
      @reorder-layout="handleReorderLayout"
      @show-download-modal="handleShowDownloadModal"
      @toggle-titles="handleToggleTitles"
      @toggle-global-mute="handleToggleGlobalMute"
      @toggle-ad-block="handleToggleAdBlock"
      @toggle-custom-code="handleToggleCustomCode"
      @toggle-certificate-error-shadow="handleToggleCertificateErrorShadow"
      @manage-sessions="handleManageSessions"
      @manage-proxy="handleManageProxy"
      @open-settings="handleOpenSettings"
      @show-update="handleShowUpdate"
      @clear-config="handleClearConfig"
      @close-sidebar="showPanel = false"
      @show-shared-modal="handleShowSharedModal"
      @share-layout="handleShareLayout"
      @export-layout="handleExportLayout"
    />
    <!-- 网格视图 -->
    <template v-for="layout in layouts" :key="`layout-${layout.id}`">
      <GridView
        v-if="layout.id === currentLayoutId || layout.keepAlive"
        :class="{ 'layout-hidden': layout.id !== currentLayoutId, 'panel-visible': showPanel && layout.id === currentLayoutId }"
        :websites="layout.id === currentLayoutId ? websites : layout.websites"
        :rows="2"
        :cols="2"
        :fullscreenIndex="layout.id === currentLayoutId ? fullscreenIndex : null"
        :globalSettings="layoutManager.globalSettings.value"
        :drawings="layout.id === currentLayoutId ? (layout.drawings || []) : (layout.drawings || [])"
        :canvasTransform="layout.canvasTransform || null"
        @fullscreen="layout.id === currentLayoutId ? handleFullscreen($event) : null"
        @exitFullscreen="exitFullscreen"
        @add-website="(data) => layout.id === currentLayoutId ? handleAddWebsite(data) : null"
        @copy-website="(index) => layout.id === currentLayoutId ? handleCopyWebsite(index) : null"
        @remove-website="(index) => layout.id === currentLayoutId ? handleRemoveWebsite(index) : null"
        @update-website="(data) => layout.id === currentLayoutId ? handleUpdateWebsite(data) : null"
        @update-drawings="(drawings) => handleUpdateDrawings(drawings)"
        @update-canvas-transform="(transform) => handleUpdateCanvasTransform(transform, layout.id)"
        @open-script-panel="(iframe) => openContentScriptPanel(iframe)"
        @import-layout-from-image="(layoutData) => handleImportLayoutFromImage(layoutData)"
        @open-monitoring="(websiteId, darkMode) => handleOpenMonitoring(websiteId, darkMode)"
        @open-workflow="(websiteId, websiteName, darkMode) => handleOpenWorkflow(websiteId, websiteName, darkMode)"
      />
    </template>

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

    <!-- 内容脚本面板 -->
    <ContentScriptPanel
      :visible="showContentScriptPanel"
      :target-iframe="contentScriptTargetIframe"
      @close="closeContentScriptPanel"
    />

    <!-- 分享布局弹窗 -->
    <SharedLayoutModal
      :visible="showSharedModal"
      :shared-layouts="sharedLayouts.sharedLayouts.value"
      :loading="sharedLayouts.loadingShared.value"
      :search-query="sharedLayouts.searchQuery.value"
      @close="showSharedModal = false"
      @import-layout="handleImportLayout"
      @search="handleSearchShared"
      @sort="handleSortShared"
    />

    <!-- 外部链接模态框 -->
    <ExternalUrlModal
      :visible="showExternalUrlModal"
      :url="externalUrl"
      @close="closeExternalUrlModal"
    />
  </div>
</template>

<script>
import { ref, watch, onMounted, provide, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import ConfigPanel from './components/ConfigPanel.vue'
import GridView from './components/GridView.vue'
import Dialog from './components/Dialog.vue'
import DownloadModal from './components/DownloadModal.vue'
import ImportModeDialog from './components/ImportModeDialog.vue'
import SessionInstanceManager from './components/SessionInstanceManager.vue'
import UpdateNotification from './components/UpdateNotification.vue'
import ProxyManager from './components/ProxyManager.vue'
import LlmConfigDialog from './components/LlmConfigDialog.vue'
import MonitoringRulesList from './components/MonitoringRulesList.vue'
import MonitoringRuleDialog from './components/MonitoringRuleDialog.vue'
import WorkflowEditor from './components/workflow/WorkflowEditor.vue'
import ContentScriptPanel from './components/ContentScriptPanel.vue'
import SharedLayoutModal from './components/SharedLayoutModal.vue'
import ExternalUrlModal from './components/ExternalUrlModal.vue'
import { useDialog } from './composables/useDialog'
import { useLayoutManager } from './composables/useLayoutManager'
import { useLlmConfig } from './composables/useLlmConfig'
import { useWebsiteManager } from './composables/useWebsiteManager'
import { useImportExport } from './composables/useImportExport'
import { useUpdateChecker } from './composables/useUpdateChecker'
import { useSharedLayouts } from './composables/useSharedLayouts'
import { useDialogStates } from './composables/useDialogStates'
import { useMonitoringRules } from './composables/useMonitoringRules'
import { useViewportStates } from './composables/useViewportStates'
import { useGlobalSettingsHandlers } from './composables/useGlobalSettingsHandlers'
import { useExternalUrlModalListeners } from './composables/useExternalUrlModal'
import { useLayoutHandlers } from './composables/useLayoutHandlers'
import { useWebsiteHandlers } from './composables/useWebsiteHandlers'
import { useUpdateHandlers } from './composables/useUpdateHandlers'
import { useLayoutShareExport } from './composables/useLayoutShareExport'
import { useMonitoringHandlers } from './composables/useMonitoringHandlers'
import { useSharedLayoutHandlers } from './composables/useSharedLayoutHandlers'
import { useDownloadModalHandlers } from './composables/useDownloadModalHandlers'
import { useAppInitialization } from './composables/useAppInitialization'

export default {
  name: 'App',
  components: {
    ConfigPanel,
    GridView,
    Dialog,
    DownloadModal,
    ImportModeDialog,
    SessionInstanceManager,
    UpdateNotification,
    ProxyManager,
    LlmConfigDialog,
    MonitoringRulesList,
    MonitoringRuleDialog,
    WorkflowEditor,
    ContentScriptPanel,
    SharedLayoutModal,
    ExternalUrlModal
  },
  setup() {
    const { t } = useI18n()
    
    // 使用 composables
    const dialog = useDialog()
    const layoutManager = useLayoutManager()
    const importExport = useImportExport()
    const updateChecker = useUpdateChecker()
    
    // 检测是否在 Electron 环境中
    const isElectron = computed(() => {
      return typeof window !== 'undefined' &&
        (window.electron !== undefined ||
         (navigator.userAgent && navigator.userAgent.toLowerCase().includes('electron')))
    })

    // 获取当前布局名称
    const currentLayoutName = computed(() => {
      const layout = layoutManager.layouts.value.find(l => l.id === layoutManager.currentLayoutId.value)
      return layout ? layout.name : '未命名布局'
    })
    
    // 共享布局管理
    const sharedLayouts = useSharedLayouts(isElectron.value)

    // 初始化网站管理器
    const websiteManager = useWebsiteManager(layoutManager.currentLayout.value.websites)

    // 使用状态管理 composables
    const dialogStates = useDialogStates()
    const monitoringRules = useMonitoringRules()
    const viewportStates = useViewportStates()
    const globalSettingsHandlers = useGlobalSettingsHandlers(layoutManager, websiteManager)

    // 下载弹窗处理器
    const downloadModalHandlers = useDownloadModalHandlers(dialogStates, viewportStates)
    
    // 控制下载弹窗显示（初始状态）
    dialogStates.showDownloadModal.value = !dialog.isElectron.value && !downloadModalHandlers.hasSeenDownloadModal()

    // LLM API 配置
    const { config: llmConfig } = useLlmConfig()

    // 监听规则处理器
    const monitoringHandlers = useMonitoringHandlers(monitoringRules, dialogStates, llmConfig)

    // 更新检测处理器
    const updateHandlers = useUpdateHandlers(updateChecker)

    // 布局操作处理器
    const layoutHandlers = useLayoutHandlers(layoutManager, websiteManager, dialog, t)

    // 网站操作处理器
    const websiteHandlers = useWebsiteHandlers(websiteManager, layoutManager)

    // 布局分享导出处理器
    const layoutShareExport = useLayoutShareExport(dialog, t, layoutManager)

    // 共享布局处理器
    const sharedLayoutHandlers = useSharedLayoutHandlers(sharedLayouts, dialogStates, importExport)

    // 处理从图片导入布局
    const handleImportLayoutFromImage = (layoutData) => {
      layoutShareExport.handleImportLayoutFromImage(layoutData, layoutHandlers.handleCreateLayout)
    }

    // 处理导入模式选择
    const handleImportModeSelect = (mode) => {
      importExport.handleImportMode(
        mode,
        dialog.isElectron.value,
        (layoutData) => {
          layoutHandlers.handleCreateLayout(layoutData.name, layoutData)
        }
      )
    }

    // 提供给子组件使用
    provide('showPrompt', dialog.showPrompt)
    provide('showConfirm', dialog.showConfirm)
    provide('showAlert', dialog.showAlert)
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
    provide('openSessionManager', dialogStates.openSessionManager)
    provide('openProxyManager', dialogStates.openProxyManager)

    // 监听网站添加/删除，自动保存到当前布局
    watch(() => websiteManager.websites.value.length, () => {
      console.log('[App] ========== 网站数量变化 ==========')
      console.log('[App] 新数量:', websiteManager.websites.value.length)
      console.log('[App] 网站列表:', websiteManager.websites.value)
      console.log('[App] 准备保存到布局:', layoutManager.currentLayoutId.value)
      layoutManager.saveCurrentLayout(websiteManager.websites.value)
      console.log('[App] 保存完成')
    })

    // 设置外部链接模态框监听器
    useExternalUrlModalListeners(dialogStates)

    // 应用初始化
    const appInitialization = useAppInitialization({
      dialogStates,
      viewportStates,
      importExport,
      layoutManager,
      websiteManager,
      handleCreateLayout: layoutHandlers.handleCreateLayout,
      t
    })
    
    // 执行初始化
    appInitialization.initialize()

    return {
      // 视口状态
      fullscreenIndex: viewportStates.fullscreenIndex,
      showPanel: viewportStates.showPanel,
      
      // 网站和布局
      websites: websiteManager.websites,
      layouts: layoutManager.layouts,
      currentLayoutId: layoutManager.currentLayoutId,
      currentLayoutName,
      layoutManager,
      
      // 更新检测状态
      showUpdateNotification: updateChecker.showUpdateNotification,
      showUpdateButton: updateChecker.showUpdateButton,
      currentVersion: updateChecker.currentVersion,
      latestVersion: updateChecker.latestVersion,
      updateInfo: updateChecker.updateInfo,
      downloadStatus: updateChecker.downloadStatus,
      
      // 对话框状态（来自 dialogStates）
      showDownloadModal: dialogStates.showDownloadModal,
      showSessionManager: dialogStates.showSessionManager,
      showProxyManager: dialogStates.showProxyManager,
      showLlmConfig: dialogStates.showLlmConfig,
      showMonitoringRulesList: dialogStates.showMonitoringRulesList,
      showMonitoringRuleDialog: dialogStates.showMonitoringRuleDialog,
      showWorkflowEditor: dialogStates.showWorkflowEditor,
      currentWorkflowWebsiteId: dialogStates.currentWorkflowWebsiteId,
      currentWorkflowWebsiteName: dialogStates.currentWorkflowWebsiteName,
      currentWorkflowDarkMode: dialogStates.currentWorkflowDarkMode,
      showContentScriptPanel: dialogStates.showContentScriptPanel,
      contentScriptTargetIframe: dialogStates.contentScriptTargetIframe,
      showSharedModal: dialogStates.showSharedModal,
      showExternalUrlModal: dialogStates.showExternalUrlModal,
      externalUrl: dialogStates.externalUrl,
      showImportDialog: dialogStates.showImportDialog,
      
      // 监听规则状态（来自 monitoringRules）
      editingMonitoringRule: monitoringRules.editingMonitoringRule,
      currentMonitoringWebsiteId: monitoringRules.currentMonitoringWebsiteId,
      currentMonitoringDarkMode: monitoringRules.currentMonitoringDarkMode,
      
      // 通用对话框
      dialogVisible: dialog.dialogVisible,
      dialogType: dialog.dialogType,
      dialogTitle: dialog.dialogTitle,
      dialogMessage: dialog.dialogMessage,
      dialogPlaceholder: dialog.dialogPlaceholder,
      dialogDefaultValue: dialog.dialogDefaultValue,
      handleDialogConfirm: dialog.handleDialogConfirm,
      handleDialogCancel: dialog.handleDialogCancel,
      
      // LLM 配置
      llmConfig,
      
      // 对话框操作方法
      closeDownloadModal: downloadModalHandlers.closeDownloadModal,
      handleShowDownloadModal: dialogStates.openDownloadModal,
      handleManageSessions: dialogStates.openSessionManager,
      closeSessionManager: dialogStates.closeSessionManager,
      handleManageProxy: dialogStates.openProxyManager,
      closeProxyManager: dialogStates.closeProxyManager,
      handleOpenSettings: dialogStates.openLlmConfig,
      handleLlmConfigConfirm: monitoringHandlers.handleLlmConfigConfirm,
      openContentScriptPanel: dialogStates.openContentScriptPanel,
      closeContentScriptPanel: dialogStates.closeContentScriptPanel,
      closeExternalUrlModal: dialogStates.closeExternalUrlModal,
      closeImportDialog: dialogStates.closeImportDialog,
      handleImportModeSelect,
      
      // 监听规则方法
      handleOpenMonitoring: monitoringHandlers.handleOpenMonitoring,
      handleCreateMonitoringRule: monitoringHandlers.handleCreateMonitoringRule,
      handleEditMonitoringRule: monitoringHandlers.handleEditMonitoringRule,
      closeMonitoringRuleDialog: dialogStates.closeMonitoringRuleDialog,
      handleSaveMonitoringRule: monitoringHandlers.handleSaveMonitoringRule,
      handleDeleteMonitoringRule: monitoringHandlers.handleDeleteMonitoringRule,
      handleToggleMonitoringRule: monitoringHandlers.handleToggleMonitoringRule,
      handleOpenLlmConfig: monitoringHandlers.handleOpenLlmConfig,
      
      // 工作流方法
      handleOpenWorkflow: (websiteId, websiteName, darkMode) => {
        console.log('[App.vue] handleOpenWorkflow 被调用')
        console.log('[App.vue] websiteId:', websiteId)
        console.log('[App.vue] websiteName:', websiteName)
        console.log('[App.vue] darkMode:', darkMode)
        console.log('[App.vue] 调用 dialogStates.openWorkflowEditor')
        dialogStates.openWorkflowEditor(websiteId, websiteName, darkMode)
        console.log('[App.vue] showWorkflowEditor 状态:', dialogStates.showWorkflowEditor.value)
      },
      closeWorkflowEditor: dialogStates.closeWorkflowEditor,
      handleSaveWorkflow: (workflow) => {
        console.log('[App.vue] 工作流已保存:', workflow)
        dialogStates.closeWorkflowEditor()
      },
      
      // 更新检测方法
      handleShowUpdate: updateHandlers.handleShowUpdate,
      handleCloseUpdateNotification: updateHandlers.handleCloseUpdateNotification,
      handleIgnoreUpdate: updateHandlers.handleIgnoreUpdate,
      handleStartDownload: updateHandlers.handleStartDownload,
      handleInstallUpdate: updateHandlers.handleInstallUpdate,
      handleCancelDownload: updateHandlers.handleCancelDownload,
      handleRetryDownload: updateHandlers.handleRetryDownload,
      
      // 视口操作方法
      handleFullscreen: viewportStates.handleFullscreen,
      exitFullscreen: viewportStates.exitFullscreen,
      toggleSidebar: viewportStates.toggleSidebar,
      
      // 网站操作方法
      handleAddWebsite: websiteHandlers.handleAddWebsite,
      handleCopyWebsite: websiteHandlers.handleCopyWebsite,
      handleRemoveWebsite: websiteHandlers.handleRemoveWebsite,
      handleUpdateWebsite: websiteHandlers.handleUpdateWebsite,
      
      // 布局操作方法
      handleSwitchLayout: layoutHandlers.handleSwitchLayout,
      handleCreateLayout: layoutHandlers.handleCreateLayout,
      handleDeleteLayout: layoutHandlers.handleDeleteLayout,
      handleToggleKeepAlive: layoutHandlers.handleToggleKeepAlive,
      handleRenameLayout: layoutHandlers.handleRenameLayout,
      handleReorderLayout: layoutHandlers.handleReorderLayout,
      renameLayout: layoutManager.renameLayout,
      handleClearConfig: layoutHandlers.handleClearConfig,
      handleUpdateDrawings: layoutHandlers.handleUpdateDrawings,
      handleUpdateCanvasTransform: layoutHandlers.handleUpdateCanvasTransform,
      
      // 全局设置方法（来自 globalSettingsHandlers）
      handleToggleTitles: globalSettingsHandlers.handleToggleTitles,
      handleToggleGlobalMute: globalSettingsHandlers.handleToggleGlobalMute,
      handleToggleAdBlock: globalSettingsHandlers.handleToggleAdBlock,
      handleToggleCustomCode: globalSettingsHandlers.handleToggleCustomCode,
      handleToggleCertificateErrorShadow: globalSettingsHandlers.handleToggleCertificateErrorShadow,
      
      // 分享布局方法
      handleShowSharedModal: sharedLayoutHandlers.handleShowSharedModal,
      handleImportLayout: sharedLayoutHandlers.handleImportLayout,
      handleSearchShared: sharedLayoutHandlers.handleSearchShared,
      handleSortShared: sharedLayoutHandlers.handleSortShared,
      sharedLayouts,
      handleShareLayout: layoutShareExport.handleShareLayout,
      handleExportLayout: layoutShareExport.handleExportLayout,
      handleImportLayoutFromImage
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

.sidebar-header {
  position: fixed;
  top: 12px;
  left: 12px;
  display: flex;
  align-items: center;
  gap: 12px;
  z-index: 30;
  transition: all 0.3s ease-out;
}

.sidebar-header.panel-visible {
  left: 300px; /* 左栏宽度 288px + 12px 间距 */
}

.sidebar-toggle-btn {
  width: 40px;
  height: 40px;
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  cursor: pointer;
  transition: all 0.3s ease-out;
  color: #64748b;
  flex-shrink: 0;
}

.sidebar-toggle-btn:hover {
  background: #f8fafc;
  color: #f97316;
  border-color: #f97316;
  box-shadow: 0 4px 12px rgba(249, 115, 22, 0.2);
}

.sidebar-toggle-btn svg {
  width: 20px;
  height: 20px;
}

.current-layout-title {
  background: white;
  padding: 8px 16px;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  font-size: 16px;
  font-weight: 700;
  color: #1e293b;
  white-space: nowrap;
  transition: all 0.3s ease-out;
  opacity: 1;
  transform: translateX(0);
  pointer-events: auto;
}

.sidebar-header.panel-visible .current-layout-title {
  opacity: 0;
  transform: translateX(-10px);
  pointer-events: none;
}

.app-container :deep(.config-panel) {
  position: fixed;
  top: 0;
  left: 0;
  bottom: 0;
  z-index: 20;
  transform: translateX(-100%);
  transition: transform 0.3s ease-in-out;
  opacity: 0;
  overflow: hidden;
}

.app-container :deep(.config-panel.panel-visible) {
  transform: translateX(0);
  opacity: 1;
}

/* 当侧边栏显示时，主内容区域向右移动 */
.app-container :deep(.grid-view.panel-visible) {
  margin-left: 288px;
  transition: margin-left 0.3s ease-in-out;
}

.app-container :deep(.grid-view:not(.panel-visible)) {
  margin-left: 0;
  transition: margin-left 0.3s ease-in-out;
}
</style>
