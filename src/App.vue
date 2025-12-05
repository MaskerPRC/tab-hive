<template>
  <div class="app-container">
    <!-- 下载插件/客户端提醒弹窗 -->
    <DownloadModal :visible="showDownloadModal" @close="closeDownloadModal" />

    <!-- 代理节点管理 -->
    <ProxyManager :show="showProxyManager" @close="closeProxyManager" />

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
      :showUpdateButton="showUpdateButton"
      @switch-layout="handleSwitchLayout"
      @create-layout="handleCreateLayout"
      @delete-layout="handleDeleteLayout"
      @rename-layout="renameLayout"
      @toggle-keep-alive="handleToggleKeepAlive"
      @show-download-modal="handleShowDownloadModal"
      @toggle-titles="handleToggleTitles"
      @toggle-global-mute="handleToggleGlobalMute"
      @toggle-ad-block="handleToggleAdBlock"
      @toggle-custom-code="handleToggleCustomCode"
      @manage-sessions="handleManageSessions"
      @manage-proxy="handleManageProxy"
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
        @fullscreen="layout.id === currentLayoutId ? handleFullscreen($event) : null"
        @exitFullscreen="exitFullscreen"
        @add-website="(data) => layout.id === currentLayoutId ? handleAddWebsite(data) : null"
        @copy-website="(index) => layout.id === currentLayoutId ? handleCopyWebsite(index) : null"
        @remove-website="(index) => layout.id === currentLayoutId ? handleRemoveWebsite(index) : null"
        @update-website="(data) => layout.id === currentLayoutId ? handleUpdateWebsite(data) : null"
        @update-drawings="(drawings) => handleUpdateDrawings(drawings)"
        @open-script-panel="(iframe) => openContentScriptPanel(iframe)"
        @import-layout-from-image="(layoutData) => handleImportLayoutFromImage(layoutData)"
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
import ContentScriptPanel from './components/ContentScriptPanel.vue'
import SharedLayoutModal from './components/SharedLayoutModal.vue'
import { useDialog } from './composables/useDialog'
import { useLayoutManager } from './composables/useLayoutManager'
import { useWebsiteManager } from './composables/useWebsiteManager'
import { useImportExport } from './composables/useImportExport'
import { useUpdateChecker } from './composables/useUpdateChecker'
import { useSharedLayouts } from './composables/useSharedLayouts'

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
    ContentScriptPanel,
    SharedLayoutModal
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

    // 代理节点管理对话框显示状态
    const showProxyManager = ref(false)

    // 内容脚本面板显示状态
    const showContentScriptPanel = ref(false)
    const contentScriptTargetIframe = ref(null)

    // 分享布局弹窗显示状态
    const showSharedModal = ref(false)

    // 打开Session实例管理对话框
    const handleManageSessions = () => {
      showSessionManager.value = true
    }

    // 关闭Session实例管理对话框
    const closeSessionManager = () => {
      showSessionManager.value = false
    }

    // 打开代理节点管理对话框
    const handleManageProxy = () => {
      showProxyManager.value = true
    }

    // 关闭代理节点管理对话框
    const closeProxyManager = () => {
      showProxyManager.value = false
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

    // 切换侧边栏显示状态
    const toggleSidebar = () => {
      showPanel.value = !showPanel.value
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

    // 切换去广告
    const handleToggleAdBlock = (adBlockEnabled) => {
      layoutManager.updateGlobalSettings({ adBlockEnabled })
      // 注意：去广告设置变化后，WebsiteCard 组件会自动检测并重新应用
      // 通过 watch 监听 adBlockEnabled prop 的变化
      // 不需要手动刷新所有网站
    }

    // 切换自定义代码
    const handleToggleCustomCode = (customCodeEnabled) => {
      layoutManager.updateGlobalSettings({ customCodeEnabled })
    }

    // 打开内容脚本面板
    const openContentScriptPanel = (iframe) => {
      contentScriptTargetIframe.value = iframe
      showContentScriptPanel.value = true
    }

    // 关闭内容脚本面板
    const closeContentScriptPanel = () => {
      showContentScriptPanel.value = false
      contentScriptTargetIframe.value = null
    }

    // 显示分享布局弹窗
    const handleShowSharedModal = () => {
      showSharedModal.value = true
      sharedLayouts.loadSharedLayouts()
    }

    // 导入布局
    const handleImportLayout = (layout) => {
      showSharedModal.value = false
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
    const handleDeleteLayout = (layoutId) => {
      if (layoutManager.layouts.value.length <= 1) {
        alert(t('layout.atLeastOne'))
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
          ? t('layout.keepAliveEnabled', { name: layout.name })
          : t('layout.keepAliveDisabled', { name: layout.name })
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
            alert(t('layout.urlImportSuccess'))
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
      currentLayoutName,
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
      handleManageProxy,
      closeProxyManager,
      showProxyManager,
      handleToggleCustomCode,
      showContentScriptPanel,
      contentScriptTargetIframe,
      openContentScriptPanel,
      closeContentScriptPanel,
      handleShowUpdate,
      handleCloseUpdateNotification,
      handleIgnoreUpdate,
      handleStartDownload,
      handleInstallUpdate,
      handleCancelDownload,
      handleRetryDownload,
      handleFullscreen,
      exitFullscreen,
      toggleSidebar,
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
      handleToggleGlobalMute,
      handleToggleAdBlock,
      handleClearConfig,
      handleUpdateDrawings,
      showSharedModal,
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
