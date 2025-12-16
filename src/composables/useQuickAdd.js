/**
 * 快捷添加网站功能
 * 提供预设网站（百度、谷歌、Excalidraw等）的快速添加功能
 */
import { useI18n } from 'vue-i18n'
import { useSessionManager } from './useSessionManager.js'

export function useQuickAdd(localWebsite, handleConfirm) {
  const { t } = useI18n()
  const { addSessionInstance } = useSessionManager()

  /**
   * 快捷添加百度
   */
  const quickAddBaidu = () => {
    localWebsite.value.title = t('websiteEdit.baidu')
    localWebsite.value.url = 'https://www.baidu.com'
    // 自动提交
    handleConfirm()
  }

  /**
   * 快捷添加谷歌
   */
  const quickAddGoogle = () => {
    localWebsite.value.title = t('websiteEdit.google')
    localWebsite.value.url = 'https://www.google.com'
    // 自动提交
    handleConfirm()
  }

  /**
   * 快捷添加 Excalidraw
   * 会自动创建独立的 session 实例
   */
  const quickAddExcalidraw = () => {
    localWebsite.value.title = t('websiteEdit.excalidraw')
    localWebsite.value.url = 'https://excalidraw.com/'
    // 自动创建新的 session 实例
    const excalidrawName = t('websiteEdit.excalidraw')
    const newInstance = addSessionInstance(excalidrawName, 'Excalidraw 专用会话实例')
    localWebsite.value.sessionInstance = newInstance.id
    console.log('[useQuickAdd] 为 Excalidraw 创建新 session:', newInstance)
    // 自动提交
    handleConfirm()
  }

  return {
    quickAddBaidu,
    quickAddGoogle,
    quickAddExcalidraw
  }
}

