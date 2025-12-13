import { ref } from 'vue'

/**
 * 管理监听规则相关的业务逻辑
 * 包括创建、编辑、删除、切换规则等操作
 */
export function useMonitoringRules() {
  // 当前正在编辑的规则
  const editingMonitoringRule = ref(null)
  
  // 当前监听的网站ID
  const currentMonitoringWebsiteId = ref('')
  
  // 当前网站的暗黑模式状态
  const currentMonitoringDarkMode = ref(false)
  
  /**
   * 打开监听规则设置
   */
  const openMonitoring = (websiteId, darkMode, openRulesList) => {
    currentMonitoringWebsiteId.value = websiteId
    currentMonitoringDarkMode.value = darkMode
    openRulesList()
  }
  
  /**
   * 创建监听规则
   */
  const createMonitoringRule = (openRuleDialog) => {
    editingMonitoringRule.value = null
    openRuleDialog()
  }
  
  /**
   * 编辑监听规则
   */
  const editMonitoringRule = (rule, openRuleDialog) => {
    editingMonitoringRule.value = rule
    openRuleDialog()
  }
  
  /**
   * 保存监听规则
   */
  const saveMonitoringRule = async (ruleData, closeDialog) => {
    if (!window.electron || !window.electron.monitoring) return
    
    try {
      if (editingMonitoringRule.value) {
        // 更新规则
        await window.electron.monitoring.updateRule(ruleData.id, ruleData)
      } else {
        // 创建规则
        await window.electron.monitoring.createRule(ruleData)
      }
      
      closeDialog()
    } catch (error) {
      console.error('[useMonitoringRules] 保存监听规则失败:', error)
      alert('保存失败: ' + error.message)
    }
  }
  
  /**
   * 删除监听规则
   */
  const deleteMonitoringRule = async (ruleId) => {
    if (!window.electron || !window.electron.monitoring) return
    
    try {
      await window.electron.monitoring.deleteRule(ruleId)
    } catch (error) {
      console.error('[useMonitoringRules] 删除监听规则失败:', error)
    }
  }
  
  /**
   * 切换监听规则启用状态
   */
  const toggleMonitoringRule = async (ruleId, enabled) => {
    if (!window.electron || !window.electron.monitoring) return
    
    try {
      await window.electron.monitoring.toggleRule(ruleId, enabled)
    } catch (error) {
      console.error('[useMonitoringRules] 切换监听规则状态失败:', error)
    }
  }
  
  /**
   * 配置 LLM
   */
  const configureLLM = async (config) => {
    if (!window.electron || !window.electron.monitoring) return
    
    try {
      await window.electron.monitoring.configureLLM(config)
    } catch (error) {
      console.error('[useMonitoringRules] 配置监听管理器 LLM 失败:', error)
    }
  }
  
  return {
    // 状态
    editingMonitoringRule,
    currentMonitoringWebsiteId,
    currentMonitoringDarkMode,
    
    // 方法
    openMonitoring,
    createMonitoringRule,
    editMonitoringRule,
    saveMonitoringRule,
    deleteMonitoringRule,
    toggleMonitoringRule,
    configureLLM
  }
}

