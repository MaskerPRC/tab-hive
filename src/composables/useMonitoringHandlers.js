/**
 * 监听规则处理器
 * 负责处理监听规则的打开、创建、编辑、保存、删除、切换等操作
 */

export function useMonitoringHandlers(monitoringRules, dialogStates, llmConfig) {
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

  // 打开监听规则列表
  const handleOpenMonitoring = (websiteId, darkMode) => {
    monitoringRules.openMonitoring(websiteId, darkMode, dialogStates.openMonitoringRulesList)
  }

  // 创建监听规则
  const handleCreateMonitoringRule = () => {
    monitoringRules.createMonitoringRule(dialogStates.openMonitoringRuleDialog)
  }

  // 编辑监听规则
  const handleEditMonitoringRule = (rule) => {
    monitoringRules.editMonitoringRule(rule, dialogStates.openMonitoringRuleDialog)
  }

  // 保存监听规则
  const handleSaveMonitoringRule = async (ruleData) => {
    await monitoringRules.saveMonitoringRule(ruleData, dialogStates.closeMonitoringRuleDialog)
  }

  // 删除监听规则
  const handleDeleteMonitoringRule = async (ruleId) => {
    await monitoringRules.deleteMonitoringRule(ruleId)
  }

  // 切换监听规则启用状态
  const handleToggleMonitoringRule = async (ruleId, enabled) => {
    await monitoringRules.toggleMonitoringRule(ruleId, enabled)
  }

  return {
    handleLlmConfigConfirm,
    handleOpenLlmConfig,
    handleOpenMonitoring,
    handleCreateMonitoringRule,
    handleEditMonitoringRule,
    handleSaveMonitoringRule,
    handleDeleteMonitoringRule,
    handleToggleMonitoringRule
  }
}

