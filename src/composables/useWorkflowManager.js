/**
 * 工作流管理器
 * 管理工作流的创建、编辑、保存和加载
 */

import { ref, computed } from 'vue'
import {
  createWorkflow,
  createWebPageNode,
  createSelectorConfig,
  createFlowNode,
  createWebControlNode,
  createConnection,
  NODE_TYPES,
  CONNECTION_TYPES
} from '../models/workflowModels'

// 全局工作流存储
const workflows = ref([])
const currentWorkflow = ref(null)
const currentWebsiteId = ref(null)

export function useWorkflowManager() {
  /**
   * 创建新工作流
   */
  const createNewWorkflow = (layoutId, layoutName, websites = []) => {
    console.log('[useWorkflowManager] createNewWorkflow 被调用')
    console.log('[useWorkflowManager] layoutId:', layoutId)
    console.log('[useWorkflowManager] layoutName:', layoutName)
    console.log('[useWorkflowManager] websites:', websites)
    
    const workflow = createWorkflow(`${layoutName}的工作流`, layoutId)
    console.log('[useWorkflowManager] 工作流已创建:', workflow)
    
    // 不再自动创建网页节点，让用户从工具面板中手动添加
    // 这样用户可以选择布局中的哪些网页需要参与工作流
    
    currentWorkflow.value = workflow
    currentWebsiteId.value = null  // 不再关联单个网站
    workflows.value.push(workflow)
    
    // 保存到localStorage
    saveWorkflows()
    
    console.log('[useWorkflowManager] 工作流创建完成')
    return workflow
  }

  /**
   * 添加网页节点到当前工作流
   */
  const addWebpageNode = (websiteId, websiteName) => {
    if (!currentWorkflow.value) {
      console.error('[useWorkflowManager] 没有当前工作流')
      return
    }

    console.log('[useWorkflowManager] 添加网页节点')
    console.log('[useWorkflowManager] websiteId:', websiteId)
    console.log('[useWorkflowManager] websiteName:', websiteName)
    
    // 检查是否已经存在该网页的节点
    const existingNode = currentWorkflow.value.nodes.find(
      node => node.type === NODE_TYPES.WEBPAGE && node.websiteId === websiteId
    )
    
    if (existingNode) {
      console.log('[useWorkflowManager] 该网页节点已存在，不重复添加')
      return existingNode
    }
    
    const webpageNode = createWebPageNode(websiteId, websiteName)
    console.log('[useWorkflowManager] 网页节点已创建:', webpageNode)
    
    // 在一个合适的位置创建节点（相对于已有节点偏移）
    const existingWebpageNodes = currentWorkflow.value.nodes.filter(
      n => n.type === NODE_TYPES.WEBPAGE
    )
    webpageNode.position = {
      x: 100,
      y: 100 + existingWebpageNodes.length * 150
    }
    
    currentWorkflow.value.nodes.push(webpageNode)
    currentWorkflow.value.updatedAt = new Date().toISOString()
    saveWorkflows()
    
    console.log('[useWorkflowManager] 网页节点已添加到工作流')
    return webpageNode
  }

  /**
   * 添加节点到当前工作流
   */
  const addNode = (node) => {
    if (!currentWorkflow.value) {
      console.error('没有当前工作流')
      return
    }
    
    currentWorkflow.value.nodes.push(node)
    currentWorkflow.value.updatedAt = new Date().toISOString()
    saveWorkflows()
  }

  /**
   * 删除节点
   */
  const removeNode = (nodeId) => {
    if (!currentWorkflow.value) return
    
    // 删除节点
    const index = currentWorkflow.value.nodes.findIndex(n => n.id === nodeId)
    if (index !== -1) {
      currentWorkflow.value.nodes.splice(index, 1)
    }
    
    // 删除相关连接
    currentWorkflow.value.connections = currentWorkflow.value.connections.filter(
      conn => conn.from.nodeId !== nodeId && conn.to.nodeId !== nodeId
    )
    
    currentWorkflow.value.updatedAt = new Date().toISOString()
    saveWorkflows()
  }

  /**
   * 更新节点
   */
  const updateNode = (nodeId, updates) => {
    if (!currentWorkflow.value) return
    
    const node = currentWorkflow.value.nodes.find(n => n.id === nodeId)
    if (node) {
      Object.assign(node, updates)
      currentWorkflow.value.updatedAt = new Date().toISOString()
      saveWorkflows()
    }
  }

  /**
   * 添加连接
   */
  const addConnection = (type, from, to) => {
    if (!currentWorkflow.value) return
    
    const connection = createConnection(type, from, to)
    currentWorkflow.value.connections.push(connection)
    
    // 处理端口自增逻辑
    handlePortAutoIncrement(from, to)
    
    currentWorkflow.value.updatedAt = new Date().toISOString()
    saveWorkflows()
    
    return connection
  }

  /**
   * 删除连接
   */
  const removeConnection = (connectionId) => {
    if (!currentWorkflow.value) return
    
    const index = currentWorkflow.value.connections.findIndex(c => c.id === connectionId)
    if (index !== -1) {
      currentWorkflow.value.connections.splice(index, 1)
      currentWorkflow.value.updatedAt = new Date().toISOString()
      saveWorkflows()
    }
  }

  /**
   * 端口自增逻辑
   */
  const handlePortAutoIncrement = (from, to) => {
    // 源节点输出端口自增
    const fromNode = currentWorkflow.value.nodes.find(n => n.id === from.nodeId)
    if (fromNode && fromNode.outputPorts) {
      const lastPort = fromNode.outputPorts[fromNode.outputPorts.length - 1]
      if (lastPort.id === from.portId) {
        const newPort = {
          id: `out-${fromNode.outputPorts.length + 1}-${Date.now()}`,
          name: `输出${fromNode.outputPorts.length + 1}`
        }
        fromNode.outputPorts.push(newPort)
      }
    }
    
    // 目标节点输入端口自增
    const toNode = currentWorkflow.value.nodes.find(n => n.id === to.nodeId)
    if (toNode && toNode.inputPorts) {
      const lastPort = toNode.inputPorts[toNode.inputPorts.length - 1]
      if (lastPort.id === to.portId) {
        const newPort = {
          id: `in-${toNode.inputPorts.length + 1}-${Date.now()}`,
          name: `输入${toNode.inputPorts.length + 1}`
        }
        toNode.inputPorts.push(newPort)
      }
    }
    
    // Web Control节点的交互控制自增
    if (fromNode && fromNode.type === NODE_TYPES.WEB_CONTROL && fromNode.actionControls) {
      const lastControl = fromNode.actionControls[fromNode.actionControls.length - 1]
      if (lastControl && lastControl.id === from.controlId) {
        const newControl = {
          id: `ctrl-${fromNode.actionControls.length + 1}-${Date.now()}`,
          name: `交互${fromNode.actionControls.length + 1}`,
          targetNodeId: null,
          targetActionId: null,
          params: {}
        }
        fromNode.actionControls.push(newControl)
        
        // 同时添加输出端口
        const newOutput = {
          id: `out-${fromNode.outputPorts.length + 1}-${Date.now()}`,
          name: `输出${fromNode.outputPorts.length}`
        }
        fromNode.outputPorts.push(newOutput)
      }
    }
  }

  /**
   * 保存工作流到localStorage
   */
  const saveWorkflows = () => {
    try {
      localStorage.setItem('quanshijie-workflows', JSON.stringify(workflows.value))
    } catch (error) {
      console.error('保存工作流失败:', error)
    }
  }

  /**
   * 从localStorage加载工作流
   */
  const loadWorkflows = () => {
    try {
      const saved = localStorage.getItem('quanshijie-workflows')
      if (saved) {
        workflows.value = JSON.parse(saved)
      }
    } catch (error) {
      console.error('加载工作流失败:', error)
    }
  }

  /**
   * 获取网站的工作流
   */
  const getWorkflowsByWebsite = (websiteId) => {
    return workflows.value.filter(workflow => {
      return workflow.nodes.some(
        node => node.type === NODE_TYPES.WEBPAGE && node.websiteId === websiteId
      )
    })
  }

  /**
   * 加载工作流
   */
  const loadWorkflow = (workflowId) => {
    const workflow = workflows.value.find(w => w.id === workflowId)
    if (workflow) {
      currentWorkflow.value = workflow
      // 找到网页节点的websiteId
      const webpageNode = workflow.nodes.find(n => n.type === NODE_TYPES.WEBPAGE)
      if (webpageNode) {
        currentWebsiteId.value = webpageNode.websiteId
      }
    }
  }

  /**
   * 删除工作流
   */
  const deleteWorkflow = (workflowId) => {
    const index = workflows.value.findIndex(w => w.id === workflowId)
    if (index !== -1) {
      workflows.value.splice(index, 1)
      if (currentWorkflow.value?.id === workflowId) {
        currentWorkflow.value = null
      }
      saveWorkflows()
    }
  }

  /**
   * 添加选择器配置到网页节点
   */
  const addSelectorToWebPageNode = (nodeId, selectorConfig) => {
    if (!currentWorkflow.value) return
    
    const node = currentWorkflow.value.nodes.find(n => n.id === nodeId)
    if (node && node.type === NODE_TYPES.WEBPAGE) {
      node.selectorConfigs.push(selectorConfig)
      currentWorkflow.value.updatedAt = new Date().toISOString()
      saveWorkflows()
    }
  }

  /**
   * 更新选择器配置
   */
  const updateSelectorConfig = (nodeId, selectorConfigId, updates) => {
    if (!currentWorkflow.value) return
    
    const node = currentWorkflow.value.nodes.find(n => n.id === nodeId)
    if (node && node.type === NODE_TYPES.WEBPAGE) {
      const config = node.selectorConfigs.find(c => c.id === selectorConfigId)
      if (config) {
        Object.assign(config, updates)
        currentWorkflow.value.updatedAt = new Date().toISOString()
        saveWorkflows()
      }
    }
  }

  /**
   * 删除选择器配置
   */
  const removeSelectorConfig = (nodeId, selectorConfigId) => {
    if (!currentWorkflow.value) return
    
    const node = currentWorkflow.value.nodes.find(n => n.id === nodeId)
    if (node && node.type === NODE_TYPES.WEBPAGE) {
      const index = node.selectorConfigs.findIndex(c => c.id === selectorConfigId)
      if (index !== -1) {
        node.selectorConfigs.splice(index, 1)
        
        // 删除相关连接
        currentWorkflow.value.connections = currentWorkflow.value.connections.filter(
          conn => {
            // 检查是否使用了该选择器配置的任何端口
            const config = node.selectorConfigs[index]
            if (!config) return true
            
            const dataPortIds = config.dataMappings.map(m => m.portId)
            const actionPortIds = config.actionMappings.map(m => m.portId)
            const allPortIds = [...dataPortIds, ...actionPortIds]
            
            return !allPortIds.includes(conn.from.portId) && 
                   !allPortIds.includes(conn.to.portId)
          }
        )
        
        currentWorkflow.value.updatedAt = new Date().toISOString()
        saveWorkflows()
      }
    }
  }

  // 初始化时加载
  loadWorkflows()

  return {
    workflows,
    currentWorkflow,
    currentWebsiteId,
    createNewWorkflow,
    addWebpageNode,
    addNode,
    removeNode,
    updateNode,
    addConnection,
    removeConnection,
    loadWorkflow,
    deleteWorkflow,
    getWorkflowsByWebsite,
    addSelectorToWebPageNode,
    updateSelectorConfig,
    removeSelectorConfig,
    saveWorkflows
  }
}

