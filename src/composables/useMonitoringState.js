import { ref } from 'vue'

/**
 * 管理监听规则的状态（用于 App.vue）
 * 提供监听规则相关的状态和方法
 */
export function useMonitoringState() {
  // 当前正在编辑的规则
  const editingMonitoringRule = ref(null)
  
  // 当前监听规则的网站ID
  const currentMonitoringWebsiteId = ref(null)
  
  // 当前监听规则的暗色模式
  const currentMonitoringDarkMode = ref(false)

  /**
   * 配置 LLM API
   */
  const configureLLM = async (config) => {
    if (!window.electron || !window.electron.monitoring) return
    
    try {
      await window.electron.monitoring.configureLLM(config)
    } catch (error) {
      console.error('[useMonitoringState] 配置 LLM 失败:', error)
    }
  }

  /**
   * 打开监听规则列表
   */
  const openMonitoring = (websiteId, darkMode, openDialogFn) => {
    currentMonitoringWebsiteId.value = websiteId
    currentMonitoringDarkMode.value = darkMode || false
    editingMonitoringRule.value = null
    if (openDialogFn) {
      openDialogFn()
    }
  }

  /**
   * 创建监听规则
   */
  const createMonitoringRule = (openDialogFn) => {
    editingMonitoringRule.value = null
    if (openDialogFn) {
      openDialogFn()
    }
  }

  /**
   * 编辑监听规则
   */
  const editMonitoringRule = (rule, openDialogFn) => {
    editingMonitoringRule.value = rule
    if (openDialogFn) {
      openDialogFn()
    }
  }

  /**
   * 保存监听规则
   */
  const saveMonitoringRule = async (ruleData, closeDialogFn) => {
    if (!window.electron || !window.electron.monitoring) return
    
    try {
      if (editingMonitoringRule.value) {
        // 更新现有规则
        await window.electron.monitoring.updateRule(
          editingMonitoringRule.value.id,
          ruleData
        )
      } else {
        // 创建新规则
        await window.electron.monitoring.createRule({
          ...ruleData,
          website_id: currentMonitoringWebsiteId.value
        })
      }
      
      // 重置编辑状态
      editingMonitoringRule.value = null
      
      if (closeDialogFn) {
        closeDialogFn()
      }
    } catch (error) {
      console.error('[useMonitoringState] 保存监听规则失败:', error)
      throw error
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
      console.error('[useMonitoringState] 删除监听规则失败:', error)
      throw error
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
      console.error('[useMonitoringState] 切换监听规则状态失败:', error)
      throw error
    }
  }

  return {
    editingMonitoringRule,
    currentMonitoringWebsiteId,
    currentMonitoringDarkMode,
    configureLLM,
    openMonitoring,
    createMonitoringRule,
    editMonitoringRule,
    saveMonitoringRule,
    deleteMonitoringRule,
    toggleMonitoringRule
  }
}

