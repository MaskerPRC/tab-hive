/**
 * 工作流执行引擎（MVP版本）
 * 执行工作流中的节点和连接
 */

import { ref } from 'vue'
import { NODE_TYPES, CONNECTION_TYPES, DATA_MAPPING_TYPES, ACTION_MAPPING_TYPES } from '../models/workflowModels'

export function useWorkflowExecutor() {
  const isExecuting = ref(false)
  const executionLog = ref([])
  const executionResults = ref({})

  /**
   * 记录日志
   */
  const log = (message, type = 'info') => {
    const logItem = {
      time: Date.now(),
      type, // info, success, error
      message
    }
    executionLog.value.push(logItem)
    console.log(`[Workflow ${type}]`, message)
  }

  /**
   * 清空日志
   */
  const clearLog = () => {
    executionLog.value = []
  }

  /**
   * 执行工作流
   */
  const executeWorkflow = async (workflow) => {
    if (isExecuting.value) {
      log('工作流正在执行中，请稍候', 'error')
      return
    }

    isExecuting.value = true
    executionResults.value = {}
    clearLog()

    try {
      log(`开始执行工作流: ${workflow.name}`, 'info')

      // 1. 找到所有起始节点（没有输入连接的Flow节点或WebControl节点）
      const startNodes = findStartNodes(workflow)
      
      if (startNodes.length === 0) {
        log('未找到起始节点，请确保至少有一个Flow节点或Web Control节点', 'error')
        return { success: false, error: '未找到起始节点' }
      }

      log(`找到 ${startNodes.length} 个起始节点`, 'info')

      // 2. 从每个起始节点开始执行
      for (const startNode of startNodes) {
        await executeFromNode(workflow, startNode)
      }

      log('工作流执行完成', 'success')
      return { success: true, results: executionResults.value }

    } catch (error) {
      log(`工作流执行失败: ${error.message}`, 'error')
      return { success: false, error: error.message }
    } finally {
      isExecuting.value = false
    }
  }

  /**
   * 找到起始节点
   */
  const findStartNodes = (workflow) => {
    const { nodes, connections } = workflow
    
    // 找到所有有输入端口的节点ID
    const nodesWithInput = new Set(
      connections
        .filter(c => c.type === CONNECTION_TYPES.EXECUTION_FLOW)
        .map(c => c.to.nodeId)
    )

    // 返回没有输入连接的Flow或WebControl节点
    return nodes.filter(node => 
      (node.type === NODE_TYPES.FLOW || node.type === NODE_TYPES.WEB_CONTROL) &&
      !nodesWithInput.has(node.id)
    )
  }

  /**
   * 从指定节点开始执行
   */
  const executeFromNode = async (workflow, node) => {
    log(`执行节点: ${node.name} (${node.type})`, 'info')

    try {
      let result = null

      if (node.type === NODE_TYPES.FLOW) {
        result = await executeFlowNode(workflow, node)
      } else if (node.type === NODE_TYPES.WEB_CONTROL) {
        result = await executeWebControlNode(workflow, node)
      }

      // 保存执行结果
      executionResults.value[node.id] = result

      // 查找下一个节点并执行
      const nextNodes = findNextNodes(workflow, node)
      for (const nextNode of nextNodes) {
        await executeFromNode(workflow, nextNode)
      }

    } catch (error) {
      log(`节点执行失败 [${node.name}]: ${error.message}`, 'error')
      throw error
    }
  }

  /**
   * 执行Flow节点
   */
  const executeFlowNode = async (workflow, node) => {
    log(`  Flow节点处理数据`, 'info')

    // 1. 收集所有数据映射的输入
    const inputData = await collectDataMappings(workflow, node)
    log(`  收集到数据: ${JSON.stringify(inputData)}`, 'info')

    // 2. MVP: 简单传递数据（后续可添加transform逻辑）
    const output = { ...inputData }

    log(`  输出数据: ${JSON.stringify(output)}`, 'info')
    
    return {
      success: true,
      data: output
    }
  }

  /**
   * 执行Web Control节点
   */
  const executeWebControlNode = async (workflow, node) => {
    log(`  Web Control节点执行交互`, 'info')

    const actionResults = []

    // 执行所有配置的交互控制
    for (const actionControl of node.actionControls) {
      if (!actionControl.targetNodeId || !actionControl.targetActionId) {
        continue
      }

      try {
        // 找到目标网页节点和交互映射
        const targetNode = workflow.nodes.find(n => n.id === actionControl.targetNodeId)
        if (!targetNode || targetNode.type !== NODE_TYPES.WEBPAGE) {
          log(`  ✗ 未找到目标网页节点`, 'error')
          continue
        }

        // 找到对应的交互映射
        let targetAction = null
        let targetSelector = null
        
        for (const selectorConfig of targetNode.selectorConfigs) {
          const action = selectorConfig.actionMappings.find(
            a => a.portId === actionControl.targetActionId
          )
          if (action) {
            targetAction = action
            targetSelector = selectorConfig.selector
            break
          }
        }

        if (!targetAction || !targetSelector) {
          log(`  ✗ 未找到目标交互映射`, 'error')
          continue
        }

        log(`  执行交互: ${targetAction.name} (${targetAction.type})`, 'info')
        log(`    目标选择器: ${targetSelector}`, 'info')

        // 执行交互操作
        const result = await executeAction(
          targetNode.websiteId,
          targetSelector,
          targetAction,
          actionControl.params
        )

        actionResults.push({
          actionId: actionControl.id,
          actionName: targetAction.name,
          success: result.success,
          data: result.data
        })

        if (result.success) {
          log(`  ✓ 交互执行成功`, 'success')
        } else {
          log(`  ✗ 交互执行失败: ${result.error}`, 'error')
        }

      } catch (error) {
        log(`  ✗ 交互执行错误: ${error.message}`, 'error')
        actionResults.push({
          actionId: actionControl.id,
          success: false,
          error: error.message
        })
      }
    }

    return {
      success: actionResults.every(r => r.success),
      actionResults
    }
  }

  /**
   * 收集数据映射
   */
  const collectDataMappings = async (workflow, node) => {
    const data = {}

    // 找到所有指向此节点的数据映射连接
    const dataMappingConnections = workflow.connections.filter(
      c => c.type === CONNECTION_TYPES.DATA_MAPPING && c.to.nodeId === node.id
    )

    for (const conn of dataMappingConnections) {
      // 找到源节点
      const sourceNode = workflow.nodes.find(n => n.id === conn.from.nodeId)
      if (!sourceNode || sourceNode.type !== NODE_TYPES.WEBPAGE) {
        continue
      }

      // 找到对应的数据映射
      let dataMapping = null
      let selector = null

      for (const selectorConfig of sourceNode.selectorConfigs) {
        const mapping = selectorConfig.dataMappings.find(
          m => m.portId === conn.from.portId
        )
        if (mapping) {
          dataMapping = mapping
          selector = selectorConfig.selector
          break
        }
      }

      if (dataMapping && selector) {
        try {
          // 从网页提取数据
          const value = await extractData(
            sourceNode.websiteId,
            selector,
            dataMapping
          )
          data[dataMapping.name] = value
          log(`    数据映射 [${dataMapping.name}]: ${value}`, 'info')
        } catch (error) {
          log(`    ✗ 数据提取失败 [${dataMapping.name}]: ${error.message}`, 'error')
        }
      }
    }

    return data
  }

  /**
   * 从网页提取数据
   */
  const extractData = async (websiteId, selector, dataMapping) => {
    const isElectron = window.electron?.isElectron

    const extractCode = `
      (function() {
        const element = document.querySelector('${selector.replace(/'/g, "\\'")}');
        if (!element) {
          throw new Error('元素不存在: ${selector}');
        }
        
        // 提取数据
        const text = element.textContent?.trim() || '';
        return text;
      })()
    `

    if (isElectron) {
      // Electron环境：通过webview执行
      const webview = document.querySelector(`#webview-${websiteId}`)
      if (!webview || !webview.executeJavaScript) {
        throw new Error('未找到webview或webview不支持executeJavaScript')
      }

      const result = await webview.executeJavaScript(extractCode)
      return result
    } else {
      // 浏览器环境：通过postMessage（需要content script支持）
      throw new Error('浏览器环境暂不支持')
    }
  }

  /**
   * 执行交互操作
   */
  const executeAction = async (websiteId, selector, actionMapping, params) => {
    const isElectron = window.electron?.isElectron

    let actionCode = ''

    if (actionMapping.type === 'click') {
      actionCode = `
        (function() {
          const element = document.querySelector('${selector.replace(/'/g, "\\'")}');
          if (!element) {
            throw new Error('元素不存在: ${selector}');
          }
          element.click();
          return { success: true, action: 'click' };
        })()
      `
    } else if (actionMapping.type === 'input') {
      const inputText = params.text || ''
      actionCode = `
        (function() {
          const element = document.querySelector('${selector.replace(/'/g, "\\'")}');
          if (!element) {
            throw new Error('元素不存在: ${selector}');
          }
          if (element.tagName !== 'INPUT' && element.tagName !== 'TEXTAREA') {
            throw new Error('只能在input或textarea元素上执行输入操作');
          }
          element.value = '${inputText.replace(/'/g, "\\'")}';
          element.dispatchEvent(new Event('input', { bubbles: true }));
          element.dispatchEvent(new Event('change', { bubbles: true }));
          return { success: true, action: 'input', value: '${inputText.replace(/'/g, "\\'")}' };
        })()
      `
    }

    if (isElectron) {
      const webview = document.querySelector(`#webview-${websiteId}`)
      if (!webview || !webview.executeJavaScript) {
        throw new Error('未找到webview或webview不支持executeJavaScript')
      }

      try {
        const result = await webview.executeJavaScript(actionCode)
        return result
      } catch (error) {
        return {
          success: false,
          error: error.message
        }
      }
    } else {
      throw new Error('浏览器环境暂不支持')
    }
  }

  /**
   * 找到下一个要执行的节点
   */
  const findNextNodes = (workflow, currentNode) => {
    const nextNodeIds = new Set()

    // 找到所有从当前节点输出的执行流连接
    const outgoingConnections = workflow.connections.filter(
      c => c.type === CONNECTION_TYPES.EXECUTION_FLOW && c.from.nodeId === currentNode.id
    )

    for (const conn of outgoingConnections) {
      nextNodeIds.add(conn.to.nodeId)
    }

    return Array.from(nextNodeIds).map(nodeId =>
      workflow.nodes.find(n => n.id === nodeId)
    ).filter(Boolean)
  }

  return {
    isExecuting,
    executionLog,
    executionResults,
    executeWorkflow,
    clearLog
  }
}

