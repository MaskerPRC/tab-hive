/**
 * 自动化数据管理
 * 管理每个网站的自动化配置（数据映射和交互映射）
 */

import { ref, reactive, computed } from 'vue'
import { createDataMapping, createActionMapping } from '../models/workflowModels'

// 全局存储：每个网站的自动化数据
const automationDataMap = reactive(new Map())

/**
 * 获取或创建网站的自动化数据
 */
const getOrCreateAutomationData = (websiteId) => {
  const id = String(websiteId) // 统一转换为字符串
  if (!automationDataMap.has(id)) {
    // 使用 reactive 确保响应式
    automationDataMap.set(id, reactive({
      dataMappings: [],
      actionMappings: []
    }))
  }
  return automationDataMap.get(id)
}

export function useAutomationData() {
  /**
   * 获取网站的自动化数据
   */
  const getAutomationData = (websiteId) => {
    const id = String(websiteId)
    return getOrCreateAutomationData(id)
  }

  /**
   * 添加数据映射
   */
  const addDataMapping = (websiteId, selector, elementName = '元素') => {
    const id = String(websiteId)
    const data = getOrCreateAutomationData(id)
    const mapping = createDataMapping('text', elementName)
    mapping.selector = selector
    data.dataMappings.push(mapping)
    console.log('[AutomationData] 添加数据映射:', mapping, '网站ID:', id)
    console.log('[AutomationData] 当前数据映射数量:', data.dataMappings.length)
    saveAutomationData()
    return mapping
  }

  /**
   * 更新数据映射
   */
  const updateDataMapping = (websiteId, mappingId, updates) => {
    const id = String(websiteId)
    const data = getOrCreateAutomationData(id)
    const mapping = data.dataMappings.find(m => m.id === mappingId)
    if (mapping) {
      Object.assign(mapping, updates)
      console.log('[AutomationData] 更新数据映射:', mapping)
      saveAutomationData()
    }
  }

  /**
   * 删除数据映射
   */
  const deleteDataMapping = (websiteId, mappingId) => {
    const id = String(websiteId)
    const data = getOrCreateAutomationData(id)
    const index = data.dataMappings.findIndex(m => m.id === mappingId)
    if (index !== -1) {
      data.dataMappings.splice(index, 1)
      console.log('[AutomationData] 删除数据映射:', mappingId)
      saveAutomationData()
    }
  }

  /**
   * 添加交互映射
   */
  const addActionMapping = (websiteId, selector, actionType = 'click', elementName = '元素') => {
    const id = String(websiteId)
    const data = getOrCreateAutomationData(id)
    const mapping = createActionMapping(actionType, elementName)
    mapping.selector = selector
    data.actionMappings.push(mapping)
    console.log('[AutomationData] 添加交互映射:', mapping, '网站ID:', id)
    console.log('[AutomationData] 当前交互映射数量:', data.actionMappings.length)
    saveAutomationData()
    return mapping
  }

  /**
   * 更新交互映射
   */
  const updateActionMapping = (websiteId, mappingId, updates) => {
    const id = String(websiteId)
    const data = getOrCreateAutomationData(id)
    const mapping = data.actionMappings.find(m => m.id === mappingId)
    if (mapping) {
      Object.assign(mapping, updates)
      console.log('[AutomationData] 更新交互映射:', mapping)
      saveAutomationData()
    }
  }

  /**
   * 删除交互映射
   */
  const deleteActionMapping = (websiteId, mappingId) => {
    const id = String(websiteId)
    const data = getOrCreateAutomationData(id)
    const index = data.actionMappings.findIndex(m => m.id === mappingId)
    if (index !== -1) {
      data.actionMappings.splice(index, 1)
      console.log('[AutomationData] 删除交互映射:', mappingId)
      saveAutomationData()
    }
  }

  /**
   * 保存自动化数据到 localStorage
   */
  const saveAutomationData = () => {
    try {
      const data = Object.fromEntries(automationDataMap)
      localStorage.setItem('automation-data', JSON.stringify(data))
      console.log('[AutomationData] 已保存自动化数据')
    } catch (error) {
      console.error('[AutomationData] 保存失败:', error)
    }
  }

  /**
   * 从 localStorage 加载自动化数据
   */
  const loadAutomationData = () => {
    try {
      const saved = localStorage.getItem('automation-data')
      if (saved) {
        const data = JSON.parse(saved)
        Object.entries(data).forEach(([websiteId, automationData]) => {
          // 使用 reactive 确保响应式
          automationDataMap.set(websiteId, reactive({
            dataMappings: automationData.dataMappings || [],
            actionMappings: automationData.actionMappings || []
          }))
        })
        console.log('[AutomationData] 已加载自动化数据，网站数量:', automationDataMap.size)
      }
    } catch (error) {
      console.error('[AutomationData] 加载失败:', error)
    }
  }

  // 初始化时加载
  loadAutomationData()

  return {
    getAutomationData,
    addDataMapping,
    updateDataMapping,
    deleteDataMapping,
    addActionMapping,
    updateActionMapping,
    deleteActionMapping,
    saveAutomationData,
    loadAutomationData
  }
}

