import { ref, watch } from 'vue'

/**
 * 管理监听规则的逻辑
 * @param {Object} props - 组件属性
 * @param {Object} emit - Vue emit 函数
 * @returns {Object} 监听规则相关的状态和方法
 */
export function useMonitoringRules(props, emit) {
  const activeRulesCount = ref(0)

  /**
   * 加载激活的规则数量
   */
  const loadActiveRulesCount = async () => {
    if (!window.electron || !window.electron.monitoring || !props.item.id) return

    try {
      const rules = await window.electron.monitoring.getRules(props.item.id)
      activeRulesCount.value = rules.filter(r => r.enabled).length
    } catch (error) {
      console.error('[useMonitoringRules] 加载监听规则数量失败:', error)
    }
  }

  /**
   * 点击监听设置按钮
   */
  const handleMonitoringClick = () => {
    emit('open-monitoring', props.item.id, props.item.darkMode)
  }

  /**
   * 工作流按钮点击
   * 工作流现在是针对整个布局的，不再针对单个网站
   */
  const handleWorkflowClick = () => {
    console.log('[useMonitoringRules] 工作流按钮被点击')
    console.log('[useMonitoringRules] 触发 open-workflow 事件（布局级别）')
    emit('open-workflow')
  }

  /**
   * 提供刷新规则计数的方法（供父组件调用）
   */
  const refreshRulesCount = () => {
    loadActiveRulesCount()
  }

  // 组件挂载时加载规则数量
  watch(() => props.item.id, () => {
    if (props.item.id) {
      loadActiveRulesCount()
    }
  }, { immediate: true })

  return {
    activeRulesCount,
    handleMonitoringClick,
    handleWorkflowClick,
    refreshRulesCount
  }
}
