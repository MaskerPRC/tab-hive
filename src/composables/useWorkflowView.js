/**
 * 工作流视图管理
 * 管理画布在布局视图和自动化视图之间的切换
 */

import { ref, computed } from 'vue'

// 视图模式枚举
export const VIEW_MODES = {
  LAYOUT: 'layout',        // 布局视图 - 显示网页内容
  AUTOMATION: 'automation' // 自动化视图 - 显示工作流节点和连接
}

export function useWorkflowView() {
  // 当前视图模式
  const viewMode = ref(VIEW_MODES.LAYOUT)
  
  // 当前工作流
  const currentWorkflow = ref(null)
  
  // 工作流节点（Flow 和 WebControl 节点）
  const workflowNodes = ref([])
  
  // 工作流连接
  const workflowConnections = ref([])
  
  // 是否显示端点
  const showPorts = computed(() => viewMode.value === VIEW_MODES.AUTOMATION)
  
  // 是否显示连接线
  const showConnections = computed(() => viewMode.value === VIEW_MODES.AUTOMATION)
  
  /**
   * 切换视图模式
   */
  const toggleViewMode = () => {
    if (viewMode.value === VIEW_MODES.LAYOUT) {
      viewMode.value = VIEW_MODES.AUTOMATION
      console.log('[WorkflowView] 切换到自动化视图')
    } else {
      viewMode.value = VIEW_MODES.LAYOUT
      console.log('[WorkflowView] 切换到布局视图')
    }
  }
  
  /**
   * 设置视图模式
   */
  const setViewMode = (mode) => {
    if (Object.values(VIEW_MODES).includes(mode)) {
      viewMode.value = mode
      console.log('[WorkflowView] 视图模式设置为:', mode)
    }
  }
  
  /**
   * 进入自动化视图
   */
  const enterAutomationMode = () => {
    setViewMode(VIEW_MODES.AUTOMATION)
  }
  
  /**
   * 退出自动化视图
   */
  const exitAutomationMode = () => {
    setViewMode(VIEW_MODES.LAYOUT)
  }
  
  /**
   * 添加工作流节点
   */
  const addWorkflowNode = (node) => {
    workflowNodes.value.push(node)
    console.log('[WorkflowView] 添加工作流节点:', node)
  }
  
  /**
   * 移除工作流节点
   */
  const removeWorkflowNode = (nodeId) => {
    const index = workflowNodes.value.findIndex(n => n.id === nodeId)
    if (index !== -1) {
      workflowNodes.value.splice(index, 1)
      console.log('[WorkflowView] 移除工作流节点:', nodeId)
      
      // 移除相关的连接
      workflowConnections.value = workflowConnections.value.filter(
        conn => conn.from.nodeId !== nodeId && conn.to.nodeId !== nodeId
      )
    }
  }
  
  /**
   * 添加连接
   */
  const addConnection = (connection) => {
    workflowConnections.value.push(connection)
    console.log('[WorkflowView] 添加连接:', connection)
  }
  
  /**
   * 移除连接
   */
  const removeConnection = (connectionId) => {
    const index = workflowConnections.value.findIndex(c => c.id === connectionId)
    if (index !== -1) {
      workflowConnections.value.splice(index, 1)
      console.log('[WorkflowView] 移除连接:', connectionId)
    }
  }
  
  /**
   * 清空所有工作流数据
   */
  const clearWorkflow = () => {
    workflowNodes.value = []
    workflowConnections.value = []
    currentWorkflow.value = null
    console.log('[WorkflowView] 清空工作流数据')
  }
  
  /**
   * 加载工作流
   */
  const loadWorkflow = (workflow) => {
    currentWorkflow.value = workflow
    workflowNodes.value = workflow.nodes || []
    workflowConnections.value = workflow.connections || []
    console.log('[WorkflowView] 加载工作流:', workflow)
  }
  
  return {
    // 状态
    viewMode,
    currentWorkflow,
    workflowNodes,
    workflowConnections,
    showPorts,
    showConnections,
    
    // 方法
    toggleViewMode,
    setViewMode,
    enterAutomationMode,
    exitAutomationMode,
    addWorkflowNode,
    removeWorkflowNode,
    addConnection,
    removeConnection,
    clearWorkflow,
    loadWorkflow
  }
}

