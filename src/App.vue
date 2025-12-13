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

    // 使用新的 composables 来管理状态
    const dialogStates = useDialogStates()
    const monitoringRules = useMonitoringRules()
    const viewportStates = useViewportStates()
    const globalSettingsHandlers = useGlobalSettingsHandlers(layoutManager, websiteManager)

    // 检查用户是否已经看过首次弹窗
    const hasSeenDownloadModal = () => {
      try {
        return localStorage.getItem('quanshijie-seen-download-modal') === 'true'
      } catch (e) {
        return false
      }
    }

    // 控制下载弹窗显示（初始状态）
    dialogStates.showDownloadModal.value = !dialog.isElectron.value && !hasSeenDownloadModal()

    // LLM API 配置
    const { config: llmConfig } = useLlmConfig()

    // 处理 LLM 配置确认
    const handleLlmConfigConfirm = async (newConfig) => {
      console.log('[App] 保存 LLM 配置:', newConfig)
      Object.assign(llmConfig.value, newConfig)
      console.log('[App] 配置已更新:', llmConfig.value)
      console.log('[App] localStorage 内容:', localStorage.getItem('llm-api-config'))
      dialogStates.closeLlmConfig()
      
      // 同时配置到监听管理器
      await monitoringRules.configureLLM(newConfig)
    }

    // 打开 LLM 配置（从监听规则调用）
    const handleOpenLlmConfig = () => {
      dialogStates.closeMonitoringRuleDialog()
      dialogStates.openLlmConfig()
    }

    // 监听规则相关处理器
    const handleOpenMonitoring = (websiteId, darkMode) => {
      monitoringRules.openMonitoring(websiteId, darkMode, dialogStates.openMonitoringRulesList)
    }

    const handleCreateMonitoringRule = () => {
      monitoringRules.createMonitoringRule(dialogStates.openMonitoringRuleDialog)
    }

    const handleEditMonitoringRule = (rule) => {
      monitoringRules.editMonitoringRule(rule, dialogStates.openMonitoringRuleDialog)
    }

    const handleSaveMonitoringRule = async (ruleData) => {
      await monitoringRules.saveMonitoringRule(ruleData, dialogStates.closeMonitoringRuleDialog)
    }

    const handleDeleteMonitoringRule = async (ruleId) => {
      await monitoringRules.deleteMonitoringRule(ruleId)
    }

    const handleToggleMonitoringRule = async (ruleId, enabled) => {
      await monitoringRules.toggleMonitoringRule(ruleId, enabled)
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
      dialogStates.closeDownloadModal()

      // 保存用户已经看过弹窗的标记
      try {
        localStorage.setItem('quanshijie-seen-download-modal', 'true')
      } catch (e) {
        console.error('保存弹窗状态失败:', e)
      }

      // 如果是首次关闭弹窗，显示侧边栏让用户知道
      if (isFirstTime) {
        setTimeout(() => {
          viewportStates.showPanelTemporarily(3000)
        }, 300) // 稍微延迟一下，让弹窗关闭动画完成
      }
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

    // 显示分享布局弹窗
    const handleShowSharedModal = () => {
      dialogStates.openSharedModal()
      sharedLayouts.loadSharedLayouts()
    }

    // 导入布局
    const handleImportLayout = (layout) => {
      dialogStates.closeSharedModal()
      // 使用导入模式对话框
      importExport.showImportModeDialog(layout)
    }

    // 搜索共享布局
    const handleSearchShared = (query) => {
      sharedLayouts.searchQuery.value = query
      sharedLayouts.searchSharedLayouts(query)
    }

    // 排序共享布局
    const handleSortShared = (sortType) => {
      // TODO: 实现排序逻辑
      console.log('Sort shared layouts:', sortType)
    }

    // 处理分享布局（带截图）
    const handleShareLayout = async (layout) => {
      try {
        // 询问用户是否要截图
        const shouldCapture = await dialog.showConfirm({
          title: t('layout.shareLayout'),
          message: t('layout.shareWithScreenshotConfirm')
        })

        if (!shouldCapture) {
          // 用户取消，使用原来的分享方式
          const layoutOperations = (await import('./composables/useLayoutOperations.js')).useLayoutOperations(dialog.isElectron.value)
          await layoutOperations.shareLayout(layout, dialog.showConfirm)
          return
        }

        // 用户确认，进行截图
        const { captureScreenshot, embedLayoutInImage, copyImageToClipboard } = await import('./utils/layoutImageUtils.js')
        
        // 显示提示
        alert(t('layout.capturingScreenshot'))
        
        // 截图
        const screenshotBlob = await captureScreenshot()
        
        // 准备布局数据（只包含必要信息）
        const layoutData = {
          name: layout.name,
          websites: layout.websites,
          version: 1,
          exportedAt: new Date().toISOString()
        }
        
        // 嵌入布局数据到图片
        const imageWithLayout = await embedLayoutInImage(screenshotBlob, layoutData)
        
        // 复制到剪贴板
        const copied = await copyImageToClipboard(imageWithLayout)
        
        if (copied) {
          alert(t('layout.screenshotCopied'))
        } else {
          // 如果复制失败，下载图片
          const { downloadImage } = await import('./utils/layoutImageUtils.js')
          downloadImage(imageWithLayout, `${layout.name || 'layout'}.png`)
          alert(t('layout.screenshotDownloaded'))
        }

        // 同时执行原来的分享逻辑（上传到服务器）
        const layoutOperations = (await import('./composables/useLayoutOperations.js')).useLayoutOperations(dialog.isElectron.value)
        await layoutOperations.shareLayout(layout, dialog.showConfirm)
      } catch (error) {
        console.error('分享布局失败:', error)
        alert(t('layout.shareFailed') + ': ' + error.message)
      }
    }

    // 处理导出布局（带截图）
    const handleExportLayout = async (layout) => {
      try {
        // 询问用户是否要截图
        const shouldCapture = await dialog.showConfirm({
          title: t('layout.exportLayout'),
          message: t('layout.exportWithScreenshotConfirm')
        })

        if (!shouldCapture) {
          // 用户取消，只导出JSON
          const layoutJson = JSON.stringify(layout, null, 2)
          const blob = new Blob([layoutJson], { type: 'application/json' })
          const url = URL.createObjectURL(blob)
          const a = document.createElement('a')
          a.href = url
          a.download = `${layout.name || 'layout'}.json`
          document.body.appendChild(a)
          a.click()
          document.body.removeChild(a)
          URL.revokeObjectURL(url)
          return
        }

        // 用户确认，进行截图
        const { captureScreenshot, embedLayoutInImage, downloadImage } = await import('./utils/layoutImageUtils.js')
        
        // 显示提示
        alert(t('layout.capturingScreenshot'))
        
        // 截图
        const screenshotBlob = await captureScreenshot()
        
        // 准备布局数据
        const layoutData = {
          name: layout.name,
          websites: layout.websites,
          version: 1,
          exportedAt: new Date().toISOString()
        }
        
        // 嵌入布局数据到图片
        const imageWithLayout = await embedLayoutInImage(screenshotBlob, layoutData)
        
        // 下载图片
        downloadImage(imageWithLayout, `${layout.name || 'layout'}.png`)
        alert(t('layout.exportSuccess'))
      } catch (error) {
        console.error('导出布局失败:', error)
        alert(t('layout.exportFailed') + ': ' + error.message)
      }
    }

    // 处理从图片导入布局
    const handleImportLayoutFromImage = async (layoutData) => {
      try {
        if (!layoutData || !layoutData.websites || !Array.isArray(layoutData.websites)) {
          alert(t('layout.invalidLayoutData'))
          return
        }

        // 询问用户是否要导入
        const shouldImport = await dialog.showConfirm({
          title: t('layout.importLayout'),
          message: t('layout.importLayoutFromImageConfirm', { name: layoutData.name || t('layout.unnamedLayout') })
        })

        if (!shouldImport) {
          return
        }

        // 创建新布局
        const layoutName = layoutData.name || `${t('layout.importedLayout')} ${new Date().toLocaleString()}`
        handleCreateLayout(layoutName, {
          websites: layoutData.websites
        })

        alert(t('layout.importSuccess'))
      } catch (error) {
        console.error('导入布局失败:', error)
        alert(t('layout.importFailed') + ': ' + error.message)
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
    const handleDeleteLayout = async (layoutId) => {
      if (layoutManager.layouts.value.length <= 1) {
        await dialog.showAlert({
          title: t('layout.warning') || '提示',
          message: t('layout.atLeastOne')
        })
        return
      }

      const result = layoutManager.deleteLayout(layoutId)

      // 如果删除的是当前布局，切换到第一个布局
      if (typeof result === 'number') {
        handleSwitchLayout(result)
      }
    }

    // 切换布局后台运行状态
    const handleToggleKeepAlive = async (layoutId) => {
      const newState = layoutManager.toggleKeepAlive(layoutId)
      const layout = layoutManager.layouts.value.find(l => l.id === layoutId)
      if (layout) {
        const message = newState
          ? t('layout.keepAliveEnabled', { name: layout.name })
          : t('layout.keepAliveDisabled', { name: layout.name })
        await dialog.showAlert({
          title: t('layout.success') || '提示',
          message: message
        })
      }
    }

    // 重命名布局
    const handleRenameLayout = (layoutId, newName) => {
      layoutManager.renameLayout(layoutId, newName)
    }

    // 重新排序布局
    const handleReorderLayout = (fromIndex, toIndex) => {
      layoutManager.reorderLayouts(fromIndex, toIndex)
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
    provide('openSessionManager', handleManageSessions)
    provide('openProxyManager', handleManageProxy)

    // 监听网站添加/删除，自动保存到当前布局
    watch(() => websiteManager.websites.value.length, () => {
      console.log('[App] ========== 网站数量变化 ==========')
      console.log('[App] 新数量:', websiteManager.websites.value.length)
      console.log('[App] 网站列表:', websiteManager.websites.value)
      console.log('[App] 准备保存到布局:', layoutManager.currentLayoutId.value)
      layoutManager.saveCurrentLayout(websiteManager.websites.value)
      console.log('[App] 保存完成')
    })

    // 更新绘制数据
    const handleUpdateDrawings = (drawings) => {
      const layout = layoutManager.layouts.value.find(l => l.id === layoutManager.currentLayoutId.value)
      if (layout) {
        layout.drawings = drawings
        layoutManager.saveCurrentLayout(websiteManager.websites.value)
      }
    }

    // 更新画布变换数据
    const handleUpdateCanvasTransform = (transform, layoutId) => {
      const layout = layoutManager.layouts.value.find(l => l.id === layoutId)
      if (layout) {
        layout.canvasTransform = { ...transform }
        layoutManager.saveCurrentLayout(websiteManager.websites.value)
      }
    }


    // 设置外部链接模态框监听器
    useExternalUrlModalListeners(dialogStates)

    // 页面加载时自动显示左侧栏，然后隐藏
    onMounted(() => {
      
      // 检查是否是从双击打开的单网站窗口
      // 检查是否是从双击打开的单网站窗口
      const urlParams = new URLSearchParams(window.location.search)
      const websiteDataParam = urlParams.get('websiteData')
      
      if (websiteDataParam) {
        try {
          const websiteData = JSON.parse(decodeURIComponent(websiteDataParam))
          console.log('[App] 检测到单网站窗口模式，网站数据:', websiteData)
          
          // 隐藏侧边栏
          viewportStates.closePanel()
          
          // 创建只包含这个网站的布局
          const singleWebsiteLayout = {
            id: Date.now(),
            name: websiteData.title || websiteData.url || '单网站窗口',
            websites: [{
              id: websiteData.id || Date.now(),
              url: websiteData.url,
              title: websiteData.title || websiteData.url,
              type: websiteData.type || 'website',
              deviceType: websiteData.deviceType || 'desktop',
              targetSelector: websiteData.targetSelector,
              targetSelectors: websiteData.targetSelectors,
              padding: websiteData.padding,
              muted: websiteData.muted || false,
              darkMode: websiteData.darkMode || false,
              autoRefreshInterval: websiteData.autoRefreshInterval || 0,
              desktopCaptureSourceId: websiteData.desktopCaptureSourceId,
              desktopCaptureOptions: websiteData.desktopCaptureOptions,
              position: { x: 0, y: 0 },
              size: { width: 1000, height: 700 }
            }],
            drawings: []
          }
          
          // 切换到单网站布局
          layoutManager.createLayout(singleWebsiteLayout.name, singleWebsiteLayout)
          layoutManager.switchLayout(singleWebsiteLayout.id)
          
          // 自动全屏显示这个网站
          setTimeout(() => {
            if (websiteManager.websites.value.length > 0) {
              viewportStates.handleFullscreen(0)
            }
          }, 500)
          
          return // 单网站窗口模式，不执行后续逻辑
        } catch (error) {
          console.error('[App] 解析网站数据失败:', error)
        }
      }

      // 首先尝试从 URL 参数导入布局
      const importedLayout = importExport.importLayoutFromUrlParams()
      if (importedLayout) {
        handleCreateLayout(importedLayout.name, importedLayout)
      }

      // 如果有弹窗显示，等待弹窗关闭后再显示侧边栏
      // 否则直接显示侧边栏
      if (!dialogStates.showDownloadModal.value) {
        // 初始显示侧边栏，3秒后自动隐藏
        viewportStates.showPanelTemporarily(3000)

        // 如果成功导入了布局，显示提示
        if (importedLayout) {
          setTimeout(() => {
            alert(t('layout.urlImportSuccess'))
          }, 500)
        }
      }
    })

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
      closeDownloadModal,
      handleShowDownloadModal: dialogStates.openDownloadModal,
      handleManageSessions: dialogStates.openSessionManager,
      closeSessionManager: dialogStates.closeSessionManager,
      handleManageProxy: dialogStates.openProxyManager,
      closeProxyManager: dialogStates.closeProxyManager,
      handleOpenSettings: dialogStates.openLlmConfig,
      handleLlmConfigConfirm,
      openContentScriptPanel: dialogStates.openContentScriptPanel,
      closeContentScriptPanel: dialogStates.closeContentScriptPanel,
      closeExternalUrlModal: dialogStates.closeExternalUrlModal,
      closeImportDialog: dialogStates.closeImportDialog,
      handleImportModeSelect,
      
      // 监听规则方法
      handleOpenMonitoring,
      handleCreateMonitoringRule,
      handleEditMonitoringRule,
      closeMonitoringRuleDialog: dialogStates.closeMonitoringRuleDialog,
      handleSaveMonitoringRule,
      handleDeleteMonitoringRule,
      handleToggleMonitoringRule,
      handleOpenLlmConfig,
      
      // 更新检测方法
      handleShowUpdate,
      handleCloseUpdateNotification,
      handleIgnoreUpdate,
      handleStartDownload,
      handleInstallUpdate,
      handleCancelDownload,
      handleRetryDownload,
      
      // 视口操作方法
      handleFullscreen: viewportStates.handleFullscreen,
      exitFullscreen: viewportStates.exitFullscreen,
      toggleSidebar: viewportStates.toggleSidebar,
      
      // 网站操作方法
      handleAddWebsite,
      handleCopyWebsite,
      handleRemoveWebsite,
      handleUpdateWebsite,
      
      // 布局操作方法
      handleSwitchLayout,
      handleCreateLayout,
      handleDeleteLayout,
      handleToggleKeepAlive,
      handleRenameLayout,
      handleReorderLayout,
      renameLayout: layoutManager.renameLayout,
      handleClearConfig,
      handleUpdateDrawings,
      handleUpdateCanvasTransform,
      
      // 全局设置方法（来自 globalSettingsHandlers）
      handleToggleTitles: globalSettingsHandlers.handleToggleTitles,
      handleToggleGlobalMute: globalSettingsHandlers.handleToggleGlobalMute,
      handleToggleAdBlock: globalSettingsHandlers.handleToggleAdBlock,
      handleToggleCustomCode: globalSettingsHandlers.handleToggleCustomCode,
      handleToggleCertificateErrorShadow: globalSettingsHandlers.handleToggleCertificateErrorShadow,
      
      // 分享布局方法
      handleShowSharedModal,
      handleImportLayout,
      handleSearchShared,
      handleSortShared,
      sharedLayouts,
      handleShareLayout,
      handleExportLayout,
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
