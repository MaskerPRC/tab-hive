import { ref } from 'vue'

/**
 * 统一管理所有对话框/弹窗的显示状态
 * 解决 App.vue 中大量分散的状态管理问题
 */
export function useDialogStates() {
  // 代理管理
  const showProxyManager = ref(false)
  
  // LLM 配置
  const showLlmConfig = ref(false)
  
  // Session 实例管理
  const showSessionManager = ref(false)
  
  // 监听规则相关
  const showMonitoringRulesList = ref(false)
  const showMonitoringRuleDialog = ref(false)
  
  // 内容脚本面板
  const showContentScriptPanel = ref(false)
  const contentScriptTargetIframe = ref(null)
  
  // 分享布局弹窗
  const showSharedModal = ref(false)
  
  // 外部链接模态框
  const showExternalUrlModal = ref(false)
  const externalUrl = ref('')
  
  // API 设置面板
  const showApiSettings = ref(false)

  // 导入对话框
  const showImportDialog = ref(false)
  
  /**
   * 打开/关闭方法
   */
  const openProxyManager = () => {
    showProxyManager.value = true
  }
  
  const closeProxyManager = () => {
    showProxyManager.value = false
  }
  
  const openLlmConfig = () => {
    showLlmConfig.value = true
  }
  
  const closeLlmConfig = () => {
    showLlmConfig.value = false
  }
  
  const openSessionManager = () => {
    showSessionManager.value = true
  }
  
  const closeSessionManager = () => {
    showSessionManager.value = false
  }
  
  const openMonitoringRulesList = () => {
    showMonitoringRulesList.value = true
  }
  
  const closeMonitoringRulesList = () => {
    showMonitoringRulesList.value = false
  }
  
  const openMonitoringRuleDialog = () => {
    showMonitoringRuleDialog.value = true
    showMonitoringRulesList.value = false
  }
  
  const closeMonitoringRuleDialog = () => {
    showMonitoringRuleDialog.value = false
    showMonitoringRulesList.value = true
  }
  
  const openContentScriptPanel = (iframe) => {
    contentScriptTargetIframe.value = iframe
    showContentScriptPanel.value = true
  }
  
  const closeContentScriptPanel = () => {
    showContentScriptPanel.value = false
    contentScriptTargetIframe.value = null
  }
  
  const openSharedModal = () => {
    showSharedModal.value = true
  }
  
  const closeSharedModal = () => {
    showSharedModal.value = false
  }
  
  const openExternalUrlModal = (url) => {
    console.log('[useDialogStates] 打开外部链接模态框:', url)
    externalUrl.value = url
    showExternalUrlModal.value = true
  }
  
  const closeExternalUrlModal = () => {
    showExternalUrlModal.value = false
    externalUrl.value = ''
  }
  
  const openApiSettings = () => {
    showApiSettings.value = true
  }

  const closeApiSettings = () => {
    showApiSettings.value = false
  }

  const openImportDialog = () => {
    showImportDialog.value = true
  }

  const closeImportDialog = () => {
    showImportDialog.value = false
  }
  
  return {
    // 状态
    showProxyManager,
    showLlmConfig,
    showSessionManager,
    showMonitoringRulesList,
    showMonitoringRuleDialog,
    showContentScriptPanel,
    contentScriptTargetIframe,
    showSharedModal,
    showExternalUrlModal,
    externalUrl,
    showApiSettings,
    showImportDialog,
    
    // 方法
    openProxyManager,
    closeProxyManager,
    openLlmConfig,
    closeLlmConfig,
    openSessionManager,
    closeSessionManager,
    openMonitoringRulesList,
    closeMonitoringRulesList,
    openMonitoringRuleDialog,
    closeMonitoringRuleDialog,
    openContentScriptPanel,
    closeContentScriptPanel,
    openSharedModal,
    closeSharedModal,
    openExternalUrlModal,
    closeExternalUrlModal,
    openApiSettings,
    closeApiSettings,
    openImportDialog,
    closeImportDialog
  }
}

