/**
 * 工作流自动化引擎
 * 支持创建和执行多步骤自动化工作流
 * 包括：自动点击、数据提取、条件判断、循环等
 */

import { ref, reactive } from 'vue'
import { useContentScriptExecutor } from './useContentScriptExecutor'

export function useWorkflowAutomation() {
  const executor = useContentScriptExecutor()
  
  const workflows = ref([])
  const isExecuting = ref(false)
  const currentWorkflow = ref(null)
  const executionLog = ref([])
  const executionContext = reactive({
    variables: {},
    results: []
  })

  /**
   * 工作流步骤类型定义
   */
  const STEP_TYPES = {
    NAVIGATE: 'navigate', // 导航到URL
    CLICK: 'click', // 点击元素
    INPUT: 'input', // 输入文本
    EXTRACT: 'extract', // 提取数据
    WAIT: 'wait', // 等待
    CONDITION: 'condition', // 条件判断
    LOOP: 'loop', // 循环
    SCRIPT: 'script', // 自定义脚本
    API_CALL: 'api_call', // API调用
    NOTIFICATION: 'notification' // 通知
  }

  /**
   * 创建新工作流
   */
  const createWorkflow = (name, description = '') => {
    const workflow = {
      id: Date.now().toString(),
      name,
      description,
      steps: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
    
    workflows.value.push(workflow)
    saveWorkflows()
    return workflow
  }

  /**
   * 添加步骤到工作流
   */
  const addStep = (workflowId, step) => {
    const workflow = workflows.value.find(w => w.id === workflowId)
    if (!workflow) {
      throw new Error('工作流不存在')
    }

    const newStep = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      type: step.type,
      name: step.name || `步骤 ${workflow.steps.length + 1}`,
      config: step.config || {},
      enabled: true,
      createdAt: new Date().toISOString()
    }

    workflow.steps.push(newStep)
    workflow.updatedAt = new Date().toISOString()
    saveWorkflows()
    return newStep
  }

  /**
   * 更新步骤
   */
  const updateStep = (workflowId, stepId, updates) => {
    const workflow = workflows.value.find(w => w.id === workflowId)
    if (!workflow) {
      throw new Error('工作流不存在')
    }

    const stepIndex = workflow.steps.findIndex(s => s.id === stepId)
    if (stepIndex === -1) {
      throw new Error('步骤不存在')
    }

    workflow.steps[stepIndex] = {
      ...workflow.steps[stepIndex],
      ...updates
    }
    workflow.updatedAt = new Date().toISOString()
    saveWorkflows()
  }

  /**
   * 删除步骤
   */
  const deleteStep = (workflowId, stepId) => {
    const workflow = workflows.value.find(w => w.id === workflowId)
    if (!workflow) {
      throw new Error('工作流不存在')
    }

    const stepIndex = workflow.steps.findIndex(s => s.id === stepId)
    if (stepIndex === -1) {
      throw new Error('步骤不存在')
    }

    workflow.steps.splice(stepIndex, 1)
    workflow.updatedAt = new Date().toISOString()
    saveWorkflows()
  }

  /**
   * 执行工作流
   */
  const executeWorkflow = async (workflowId, target, options = {}) => {
    const workflow = workflows.value.find(w => w.id === workflowId)
    if (!workflow) {
      throw new Error('工作流不存在')
    }

    isExecuting.value = true
    currentWorkflow.value = workflow
    executionLog.value = []
    executionContext.variables = options.variables || {}
    executionContext.results = []

    log(`开始执行工作流: ${workflow.name}`)

    try {
      for (let i = 0; i < workflow.steps.length; i++) {
        const step = workflow.steps[i]
        
        if (!step.enabled) {
          log(`跳过已禁用的步骤: ${step.name}`, 'info')
          continue
        }

        log(`执行步骤 ${i + 1}/${workflow.steps.length}: ${step.name}`, 'info')
        
        const result = await executeStep(step, target, executionContext)
        
        if (!result.success) {
          log(`步骤执行失败: ${result.error}`, 'error')
          if (!options.continueOnError) {
            throw new Error(`步骤 "${step.name}" 执行失败: ${result.error}`)
          }
        } else {
          log(`步骤执行成功`, 'success')
          // 保存步骤结果到上下文
          executionContext.results.push({
            stepId: step.id,
            stepName: step.name,
            result: result.data
          })
        }

        // 等待一下，避免操作过快
        if (options.stepDelay) {
          await sleep(options.stepDelay)
        }
      }

      log(`工作流执行完成`, 'success')
      return {
        success: true,
        results: executionContext.results,
        log: executionLog.value
      }
    } catch (error) {
      log(`工作流执行失败: ${error.message}`, 'error')
      return {
        success: false,
        error: error.message,
        results: executionContext.results,
        log: executionLog.value
      }
    } finally {
      isExecuting.value = false
      currentWorkflow.value = null
    }
  }

  /**
   * 执行单个步骤
   */
  const executeStep = async (step, target, context) => {
    try {
      switch (step.type) {
        case STEP_TYPES.NAVIGATE:
          return await executeNavigateStep(step, target)
        case STEP_TYPES.CLICK:
          return await executeClickStep(step, target)
        case STEP_TYPES.INPUT:
          return await executeInputStep(step, target)
        case STEP_TYPES.EXTRACT:
          return await executeExtractStep(step, target, context)
        case STEP_TYPES.WAIT:
          return await executeWaitStep(step)
        case STEP_TYPES.CONDITION:
          return await executeConditionStep(step, context)
        case STEP_TYPES.LOOP:
          return await executeLoopStep(step, target, context)
        case STEP_TYPES.SCRIPT:
          return await executeScriptStep(step, target, context)
        case STEP_TYPES.API_CALL:
          return await executeApiCallStep(step, context)
        case STEP_TYPES.NOTIFICATION:
          return await executeNotificationStep(step, context)
        default:
          throw new Error(`不支持的步骤类型: ${step.type}`)
      }
    } catch (error) {
      return {
        success: false,
        error: error.message
      }
    }
  }

  /**
   * 执行导航步骤
   */
  const executeNavigateStep = async (step, target) => {
    const url = interpolate(step.config.url, executionContext)
    log(`导航到: ${url}`)
    
    // 在实际应用中，这里应该触发webview/iframe的导航
    // 这里只是示例
    await sleep(1000)
    
    return {
      success: true,
      data: { url }
    }
  }

  /**
   * 执行点击步骤
   */
  const executeClickStep = async (step, target) => {
    const selector = interpolate(step.config.selector, executionContext)
    log(`点击元素: ${selector}`)
    
    const result = await executor.performElementsAction(target, [selector], 'click')
    
    return {
      success: result.result?.success?.length > 0,
      data: result.result
    }
  }

  /**
   * 执行输入步骤
   */
  const executeInputStep = async (step, target) => {
    const selector = interpolate(step.config.selector, executionContext)
    const value = interpolate(step.config.value, executionContext)
    log(`输入文本到 ${selector}: ${value}`)
    
    const script = `
      (function() {
        const element = document.querySelector('${selector}');
        if (!element) return { success: false, error: '元素不存在' };
        element.value = '${value}';
        element.dispatchEvent(new Event('input', { bubbles: true }));
        element.dispatchEvent(new Event('change', { bubbles: true }));
        return { success: true };
      })();
    `
    
    const result = await executor.executeScript(target, script)
    
    return {
      success: result.success,
      data: result.result
    }
  }

  /**
   * 执行数据提取步骤
   */
  const executeExtractStep = async (step, target, context) => {
    const selector = interpolate(step.config.selector, executionContext)
    log(`提取数据: ${selector}`)
    
    const result = await executor.extractElementsData(target, [selector], {
      text: step.config.extractText !== false,
      html: step.config.extractHtml || false,
      attributes: step.config.attributes || []
    })
    
    // 保存提取的数据到变量
    if (step.config.saveToVariable && result.result) {
      context.variables[step.config.saveToVariable] = result.result
    }
    
    return {
      success: result.success,
      data: result.result
    }
  }

  /**
   * 执行等待步骤
   */
  const executeWaitStep = async (step) => {
    const duration = parseInt(step.config.duration) || 1000
    log(`等待 ${duration}ms`)
    await sleep(duration)
    return { success: true, data: { duration } }
  }

  /**
   * 执行条件判断步骤
   */
  const executeConditionStep = async (step, context) => {
    const condition = interpolate(step.config.condition, context)
    log(`判断条件: ${condition}`)
    
    try {
      // 简单的条件评估（实际应该使用更安全的方法）
      const result = eval(condition)
      return {
        success: true,
        data: { condition, result }
      }
    } catch (error) {
      return {
        success: false,
        error: error.message
      }
    }
  }

  /**
   * 执行循环步骤
   */
  const executeLoopStep = async (step, target, context) => {
    const times = parseInt(step.config.times) || 1
    log(`开始循环 ${times} 次`)
    
    const results = []
    for (let i = 0; i < times; i++) {
      log(`循环第 ${i + 1} 次`)
      context.variables.loopIndex = i
      // 这里应该执行子步骤，但为了简化，我们只记录
      results.push({ iteration: i })
    }
    
    return {
      success: true,
      data: { iterations: times, results }
    }
  }

  /**
   * 执行自定义脚本步骤
   */
  const executeScriptStep = async (step, target, context) => {
    const script = interpolate(step.config.script, context)
    log(`执行自定义脚本`)
    
    const result = await executor.executeScript(target, script)
    
    return {
      success: result.success,
      data: result.result
    }
  }

  /**
   * 执行API调用步骤
   */
  const executeApiCallStep = async (step, context) => {
    const url = interpolate(step.config.url, context)
    const method = step.config.method || 'GET'
    log(`API调用: ${method} ${url}`)
    
    try {
      const options = {
        method,
        headers: step.config.headers || {}
      }
      
      if (step.config.body) {
        options.body = interpolate(step.config.body, context)
      }
      
      const response = await fetch(url, options)
      const data = await response.json()
      
      // 保存响应数据到变量
      if (step.config.saveToVariable) {
        context.variables[step.config.saveToVariable] = data
      }
      
      return {
        success: response.ok,
        data
      }
    } catch (error) {
      return {
        success: false,
        error: error.message
      }
    }
  }

  /**
   * 执行通知步骤
   */
  const executeNotificationStep = async (step, context) => {
    const message = interpolate(step.config.message, context)
    log(`通知: ${message}`, 'info')
    
    // 显示浏览器通知（如果有权限）
    if (Notification.permission === 'granted') {
      new Notification('全视界 工作流', {
        body: message,
        icon: '/256x256.png'
      })
    } else if (Notification.permission !== 'denied') {
      await Notification.requestPermission()
    }
    
    return {
      success: true,
      data: { message }
    }
  }

  /**
   * 变量插值
   */
  const interpolate = (template, context) => {
    if (typeof template !== 'string') return template
    
    return template.replace(/\{\{(.+?)\}\}/g, (match, key) => {
      const trimmedKey = key.trim()
      if (context.variables.hasOwnProperty(trimmedKey)) {
        return context.variables[trimmedKey]
      }
      return match
    })
  }

  /**
   * 添加日志
   */
  const log = (message, level = 'info') => {
    const entry = {
      timestamp: new Date().toISOString(),
      level,
      message
    }
    executionLog.value.push(entry)
    console.log(`[Workflow] [${level}] ${message}`)
  }

  /**
   * 睡眠函数
   */
  const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms))

  /**
   * 保存工作流到本地存储
   */
  const saveWorkflows = () => {
    try {
      localStorage.setItem('quanshijie-workflows', JSON.stringify(workflows.value))
    } catch (e) {
      console.error('保存工作流失败:', e)
    }
  }

  /**
   * 从本地存储加载工作流
   */
  const loadWorkflows = () => {
    try {
      const stored = localStorage.getItem('quanshijie-workflows')
      if (stored) {
        workflows.value = JSON.parse(stored)
      }
    } catch (e) {
      console.error('加载工作流失败:', e)
    }
  }

  /**
   * 删除工作流
   */
  const deleteWorkflow = (workflowId) => {
    const index = workflows.value.findIndex(w => w.id === workflowId)
    if (index !== -1) {
      workflows.value.splice(index, 1)
      saveWorkflows()
    }
  }

  /**
   * 导出工作流
   */
  const exportWorkflow = (workflowId) => {
    const workflow = workflows.value.find(w => w.id === workflowId)
    if (!workflow) {
      throw new Error('工作流不存在')
    }

    const json = JSON.stringify(workflow, null, 2)
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `workflow-${workflow.name}-${Date.now()}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  /**
   * 导入工作流
   */
  const importWorkflow = async (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      
      reader.onload = (e) => {
        try {
          const workflow = JSON.parse(e.target.result)
          workflow.id = Date.now().toString()
          workflow.createdAt = new Date().toISOString()
          workflows.value.push(workflow)
          saveWorkflows()
          resolve(workflow)
        } catch (error) {
          reject(error)
        }
      }
      
      reader.onerror = () => reject(new Error('读取文件失败'))
      reader.readAsText(file)
    })
  }

  // 初始化时加载工作流
  loadWorkflows()

  return {
    // 状态
    workflows,
    isExecuting,
    currentWorkflow,
    executionLog,
    executionContext,
    STEP_TYPES,

    // 方法
    createWorkflow,
    addStep,
    updateStep,
    deleteStep,
    executeWorkflow,
    deleteWorkflow,
    exportWorkflow,
    importWorkflow,
    saveWorkflows,
    loadWorkflows
  }
}

