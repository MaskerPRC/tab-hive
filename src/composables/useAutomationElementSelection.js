/**
 * 自动化视图元素选择 Composable
 * 管理自动化模式下的元素选择器、映射类型对话框、映射CRUD操作
 */
import { ref } from 'vue'

/**
 * @param {Object} automationData - useAutomationData() 返回的实例
 * @param {Object} setupResult - useGridViewSetup() 返回的结果（需要 viewMode, allWebsites）
 */
export function useAutomationElementSelection(automationData, setupResult) {
  // 自动化视图的元素选择器状态
  const automationSelectingElement = ref(false)
  const automationTargetIframe = ref(null)
  const automationTargetWebsite = ref(null)
  const pendingElementSelection = ref(null) // 待处理的元素选择结果

  // 映射类型对话框状态
  const showMappingTypeDialog = ref(false)

  // 正在编辑的映射（用于编辑时重新选择元素）
  const editingMapping = ref(null)

  // 处理自动化视图的元素选择
  const handleAutomationElementSelected = (result) => {
    console.log('[GridView] 自动化视图元素选择完成:', result)
    const websiteId = automationTargetWebsite.value?.id

    if (!websiteId) {
      console.error('[GridView] 没有 websiteId')
      return
    }

    // 获取选择器
    const selector = result.selector || result.selectors?.[0]
    if (!selector) {
      console.error('[GridView] 没有选择器')
      return
    }

    // 如果正在编辑映射，直接更新映射的选择器
    if (editingMapping.value) {
      const { type, websiteId: editWebsiteId, mappingId } = editingMapping.value
      if (type === 'data') {
        automationData.updateDataMapping(editWebsiteId, mappingId, { selector })
        console.log('[GridView] 已更新数据映射的选择器')
      } else if (type === 'action') {
        automationData.updateActionMapping(editWebsiteId, mappingId, { selector })
        console.log('[GridView] 已更新交互映射的选择器')
      }
      // 清除编辑状态
      editingMapping.value = null
      // 重置选择器状态
      automationSelectingElement.value = false
      automationTargetIframe.value = null
      automationTargetWebsite.value = null
      return
    }

    // 保存选择结果，等待用户选择映射类型
    pendingElementSelection.value = {
      websiteId,
      selector,
      elementInfo: result.elementInfo
    }

    // 显示选择映射类型的对话框
    showMappingTypeDialog.value = true

    // 重置选择器状态
    automationSelectingElement.value = false
    automationTargetIframe.value = null
    automationTargetWebsite.value = null
  }

  // 选择映射类型并添加
  const handleSelectMappingType = (mappingType) => {
    if (!pendingElementSelection.value) return

    const { websiteId, selector, elementInfo } = pendingElementSelection.value
    const elementName = elementInfo?.tagName?.toLowerCase() || '元素'

    if (mappingType === 'data') {
      // 添加数据映射
      automationData.addDataMapping(websiteId, selector, elementName)
    } else if (mappingType === 'action') {
      // 添加交互映射（默认点击）
      automationData.addActionMapping(websiteId, selector, 'click', elementName)
    }

    // 关闭对话框并清除待处理的选择
    showMappingTypeDialog.value = false
    pendingElementSelection.value = null

    console.log('[GridView] 已添加映射，网站ID:', websiteId)
    console.log('[GridView] 当前数据映射:', automationData.getAutomationData(websiteId).dataMappings)
    console.log('[GridView] 当前交互映射:', automationData.getAutomationData(websiteId).actionMappings)
  }

  // 取消添加映射
  const handleCancelMappingType = () => {
    showMappingTypeDialog.value = false
    pendingElementSelection.value = null
  }

  const handleAutomationElementSelectionCancel = () => {
    console.log('[GridView] 取消自动化视图元素选择')
    automationSelectingElement.value = false
    automationTargetIframe.value = null
    automationTargetWebsite.value = null
    // 清除编辑状态
    editingMapping.value = null
  }

  // 监听来自网站卡片的元素选择请求
  const handleStartAutomationElementSelection = (websiteId) => {
    console.log('[GridView] ========== 开始自动化视图元素选择 ==========')
    console.log('[GridView] websiteId:', websiteId)
    console.log('[GridView] 当前 viewMode:', setupResult.viewMode.value)
    console.log('[GridView] 当前 allWebsites 数量:', setupResult.allWebsites.value.length)

    // 找到对应的网站
    const website = setupResult.allWebsites.value.find(w => {
      // 支持字符串和数字类型的 ID 比较
      const wId = String(w.id)
      const targetId = String(websiteId)
      return wId === targetId
    })

    if (!website) {
      console.error('[GridView] 未找到网站:', websiteId)
      console.error('[GridView] 所有网站ID:', setupResult.allWebsites.value.map(w => ({ id: w.id, type: typeof w.id })))
      alert(`未找到网站 ID: ${websiteId}`)
      return
    }

    console.log('[GridView] 找到网站:', website)
    automationTargetWebsite.value = website

    // 查找对应的 webview 或 iframe
    const isElectron = window.electron?.isElectron
    console.log('[GridView] isElectron:', isElectron)

    if (isElectron) {
      const webviewId = website.type === 'custom-html'
        ? `webview-custom-${website.id}`
        : `webview-${website.id}`
      console.log('[GridView] 查找 webview，ID:', webviewId)

      // 等待一下，确保 webview 已渲染
      setTimeout(() => {
        const webview = document.querySelector(`#${webviewId}`)
        console.log('[GridView] 找到 webview:', !!webview, webview)
        console.log('[GridView] 页面上所有 webview ID:', Array.from(document.querySelectorAll('webview')).map(w => w.id))

        if (webview) {
          automationTargetIframe.value = webview
          automationSelectingElement.value = true
          console.log('[GridView] ✅ 元素选择器已启动')
          console.log('[GridView] automationSelectingElement:', automationSelectingElement.value)
          console.log('[GridView] automationTargetIframe:', automationTargetIframe.value)
          console.log('[GridView] viewMode:', setupResult.viewMode.value)
        } else {
          console.error('[GridView] 未找到 webview，ID:', webviewId)
          console.error('[GridView] 页面上所有 webview:', Array.from(document.querySelectorAll('webview')).map(w => ({ id: w.id, src: w.src?.substring(0, 50) })))
          alert('未找到网页，请确保网页已加载')
        }
      }, 100)
    } else {
      const iframe = document.querySelector(`iframe[data-website-id="${website.id}"]`)
      console.log('[GridView] 查找 iframe，找到:', !!iframe)

      if (iframe) {
        automationTargetIframe.value = iframe
        automationSelectingElement.value = true
        console.log('[GridView] ✅ 元素选择器已启动（iframe）')
      } else {
        console.error('[GridView] 未找到 iframe')
        alert('未找到网页，请确保网页已加载')
      }
    }
  }

  // 获取网站的自动化数据
  const getAutomationDataForWebsite = (websiteId) => {
    return automationData.getAutomationData(websiteId)
  }

  // 处理编辑数据映射
  const handleEditDataMapping = (websiteId, mapping) => {
    console.log('[GridView] 编辑数据映射:', websiteId, mapping)
    // 保存正在编辑的映射信息
    editingMapping.value = {
      type: 'data',
      websiteId,
      mappingId: mapping.id
    }
    // 启动元素选择器，让用户重新选择元素
    handleStartAutomationElementSelection(websiteId)
  }

  // 处理删除数据映射
  const handleDeleteDataMapping = (websiteId, mappingId) => {
    console.log('[GridView] 删除数据映射:', websiteId, mappingId)
    automationData.deleteDataMapping(websiteId, mappingId)
  }

  // 处理编辑交互映射
  const handleEditActionMapping = (websiteId, mapping) => {
    console.log('[GridView] 编辑交互映射:', websiteId, mapping)
    // 保存正在编辑的映射信息
    editingMapping.value = {
      type: 'action',
      websiteId,
      mappingId: mapping.id
    }
    // 启动元素选择器，让用户重新选择元素
    handleStartAutomationElementSelection(websiteId)
  }

  // 处理删除交互映射
  const handleDeleteActionMapping = (websiteId, mappingId) => {
    console.log('[GridView] 删除交互映射:', websiteId, mappingId)
    automationData.deleteActionMapping(websiteId, mappingId)
  }

  return {
    // 元素选择器状态
    automationSelectingElement,
    automationTargetIframe,
    automationTargetWebsite,
    // 映射类型对话框
    showMappingTypeDialog,
    pendingElementSelection,
    // 事件处理
    handleAutomationElementSelected,
    handleAutomationElementSelectionCancel,
    handleStartAutomationElementSelection,
    handleSelectMappingType,
    handleCancelMappingType,
    // 自动化数据
    getAutomationDataForWebsite,
    // 映射 CRUD
    handleEditDataMapping,
    handleDeleteDataMapping,
    handleEditActionMapping,
    handleDeleteActionMapping
  }
}
