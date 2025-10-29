import { ref, computed } from 'vue'

// 从localStorage加载session实例列表
const loadSessionInstances = () => {
  try {
    const saved = localStorage.getItem('tab-hive-session-instances')
    if (saved) {
      const instances = JSON.parse(saved)
      // 确保至少有默认实例
      if (!instances.some(inst => inst.id === 'default')) {
        return [
          { id: 'default', name: '默认共享实例', description: '所有网站共享cookie和存储' },
          ...instances
        ]
      }
      return instances
    }
  } catch (e) {
    console.error('加载session实例失败:', e)
  }
  // 默认返回默认实例
  return [
    { id: 'default', name: '默认共享实例', description: '所有网站共享cookie和存储' }
  ]
}

// Session实例列表（单例模式，所有组件共享同一个ref）
const sessionInstances = ref(loadSessionInstances())

// 保存到localStorage
const saveSessionInstances = () => {
  try {
    localStorage.setItem('tab-hive-session-instances', JSON.stringify(sessionInstances.value))
  } catch (e) {
    console.error('保存session实例失败:', e)
  }
}

/**
 * Session实例管理 Composable
 * 提供session实例的创建、删除等功能
 */
export function useSessionManager() {

  /**
   * 添加新的session实例
   * @param {string} name - 实例名称
   * @param {string} description - 实例描述
   * @returns {Object} 新创建的实例
   */
  const addSessionInstance = (name, description = '') => {
    const newInstance = {
      id: `instance-${Date.now()}`,
      name,
      description,
      createdAt: new Date().toISOString()
    }
    
    sessionInstances.value.push(newInstance)
    saveSessionInstances()
    
    console.log('已创建新的session实例:', newInstance)
    return newInstance
  }

  /**
   * 删除session实例
   * @param {string} instanceId - 实例ID
   * @returns {boolean} 是否删除成功
   */
  const deleteSessionInstance = (instanceId) => {
    // 不能删除默认实例
    if (instanceId === 'default') {
      console.warn('不能删除默认实例')
      return false
    }

    const index = sessionInstances.value.findIndex(inst => inst.id === instanceId)
    if (index !== -1) {
      sessionInstances.value.splice(index, 1)
      saveSessionInstances()
      console.log('已删除session实例:', instanceId)
      return true
    }

    return false
  }

  /**
   * 重命名session实例
   * @param {string} instanceId - 实例ID
   * @param {string} newName - 新名称
   * @param {string} newDescription - 新描述
   */
  const renameSessionInstance = (instanceId, newName, newDescription) => {
    const instance = sessionInstances.value.find(inst => inst.id === instanceId)
    if (instance) {
      instance.name = newName
      if (newDescription !== undefined) {
        instance.description = newDescription
      }
      saveSessionInstances()
      console.log('已重命名session实例:', instanceId, '->', newName)
    }
  }

  /**
   * 获取session实例
   * @param {string} instanceId - 实例ID
   * @returns {Object|null} 实例对象
   */
  const getSessionInstance = (instanceId) => {
    return sessionInstances.value.find(inst => inst.id === instanceId) || null
  }

  /**
   * 获取partition名称（用于Electron webview）
   * @param {string} instanceId - 实例ID
   * @returns {string} partition名称
   */
  const getPartitionName = (instanceId) => {
    if (instanceId === 'default' || !instanceId) {
      return 'persist:default'
    }
    return `persist:${instanceId}`
  }

  // 统计每个实例被使用的次数
  const getInstanceUsageCount = (instanceId, websites) => {
    if (!websites) return 0
    return websites.filter(site => (site.sessionInstance || 'default') === instanceId).length
  }

  return {
    // 状态
    sessionInstances,
    // 方法
    addSessionInstance,
    deleteSessionInstance,
    renameSessionInstance,
    getSessionInstance,
    getPartitionName,
    getInstanceUsageCount
  }
}

