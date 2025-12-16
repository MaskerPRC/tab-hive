/**
 * Session 实例操作
 * 处理会话实例的创建和管理操作
 */
import { inject } from 'vue'
import { useI18n } from 'vue-i18n'
import { useSessionManager } from './useSessionManager.js'

export function useSessionOperations(localWebsite) {
  const { t } = useI18n()
  const { sessionInstances, addSessionInstance } = useSessionManager()
  const showPrompt = inject('showPrompt')
  const openSessionManager = inject('openSessionManager')
  const openProxyManager = inject('openProxyManager')

  /**
   * 创建新的session实例
   */
  const handleCreateNewInstance = async () => {
    // 使用当前视界的名称作为实例的默认命名
    const defaultName = localWebsite.value.title 
      ? `${localWebsite.value.title}` 
      : `${t('sessionInstance.defaultInstanceName')} ${sessionInstances.value.length}`
    
    if (!showPrompt) {
      const name = prompt(t('sessionInstance.createNewInstanceMessage'), defaultName)
      if (name && name.trim()) {
        const newInstance = addSessionInstance(name.trim())
        localWebsite.value.sessionInstance = newInstance.id
      }
      return
    }

    const name = await showPrompt({
      title: t('sessionInstance.createNewInstance'),
      message: t('sessionInstance.createNewInstanceMessage'),
      placeholder: defaultName
    })

    if (name && name.trim()) {
      const newInstance = addSessionInstance(name.trim())
      localWebsite.value.sessionInstance = newInstance.id
    }
  }

  /**
   * 打开实例管理器
   */
  const handleOpenSessionManager = () => {
    if (openSessionManager) {
      openSessionManager()
    }
  }

  /**
   * 打开代理管理器
   */
  const handleOpenProxyManager = () => {
    if (openProxyManager) {
      openProxyManager()
    }
  }

  return {
    sessionInstances,
    handleCreateNewInstance,
    handleOpenSessionManager,
    handleOpenProxyManager
  }
}

