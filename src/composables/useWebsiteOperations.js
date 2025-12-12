import { ref } from 'vue'

/**
 * 网站操作 Composable
 * 处理网站的添加、编辑、删除、复制、刷新、静音等操作
 */
export function useWebsiteOperations(props, emit) {
  // 编辑网站状态
  const editingSlot = ref(null)
  const editingDialogType = ref('website') // 'website' 或 'desktop-capture'
  const newWebsite = ref(createEmptyWebsite())

  /**
   * 创建空白网站对象
   */
  function createEmptyWebsite() {
    return {
      title: '',
      url: '',
      deviceType: 'desktop',
      targetSelector: '',
      targetSelectors: [],
      autoRefreshInterval: 0,
      sessionInstance: 'default',
      padding: 0,
      muted: false,
      darkMode: false,
      requireModifierForActions: false,
      openExternalInModal: false
    }
  }

  /**
   * 开始添加网站
   */
  const startAddWebsite = (index) => {
    editingSlot.value = index
    editingDialogType.value = 'website' // 默认是普通网站
    newWebsite.value = createEmptyWebsite()
  }

  /**
   * 开始添加桌面捕获（从快捷按钮触发）
   */
  const startAddDesktopCapture = () => {
    editingSlot.value = -1
    editingDialogType.value = 'desktop-capture'
  }

  /**
   * 确认添加网站
   */
  const confirmAddWebsite = (websiteData, handleRefreshWebsite) => {
    console.log('[GridView] ========== 确认添加/更新网站 ==========')
    console.log('[GridView] editingSlot:', editingSlot.value)
    console.log('[GridView] websiteData:', websiteData)

    // 如果提交的是桌面捕获类型，确保对话框类型正确（用于后续编辑）
    if (websiteData.type === 'desktop-capture') {
      editingDialogType.value = 'desktop-capture'
    } else {
      editingDialogType.value = 'website'
    }

    // 如果是编辑模式
    if (editingSlot.value !== -1 && editingSlot.value !== null) {
      console.log('[GridView] 模式：编辑现有网站')

      // 检查是否需要刷新（选择器或暗色模式变化）
      const oldWebsite = props.websites[editingSlot.value]
      let needsRefresh = false

      if (oldWebsite) {
        // 检查暗色模式是否变化
        if (websiteData.darkMode !== oldWebsite.darkMode) {
          console.log('[GridView] 暗色模式已变化，需要刷新')
          needsRefresh = true
        }

        // 检查选择器是否变化
        const oldSelectors = oldWebsite.targetSelectors || (oldWebsite.targetSelector ? [oldWebsite.targetSelector] : [])
        const newSelectors = websiteData.targetSelectors || []

        // 比较选择器数组
        if (oldSelectors.length !== newSelectors.length ||
            !oldSelectors.every((sel, idx) => sel === newSelectors[idx])) {
          console.log('[GridView] 选择器已变化，需要刷新')
          console.log('[GridView] 旧选择器:', oldSelectors)
          console.log('[GridView] 新选择器:', newSelectors)
          needsRefresh = true
        }
      }

      const websiteIndex = editingSlot.value

      emit('update-website', {
        index: websiteIndex,
        ...websiteData
      })

      // 如果需要刷新，延迟一小段时间后自动刷新
      if (needsRefresh && handleRefreshWebsite) {
        console.log('[GridView] 将在更新后自动刷新网站')
        setTimeout(() => {
          handleRefreshWebsite(websiteIndex)
        }, 100)
      }
    } else {
      // 添加模式
      console.log('[GridView] 模式：添加新网站')
      emit('add-website', websiteData)
    }

    // 关闭对话框并重置状态
    editingSlot.value = null
    editingDialogType.value = 'website'
    newWebsite.value = createEmptyWebsite()
    console.log('[GridView] ========== 添加/更新流程完成 ==========')
  }

  /**
   * 取消添加网站
   */
  const cancelAddWebsite = () => {
    editingSlot.value = null
    editingDialogType.value = 'website'
    newWebsite.value = createEmptyWebsite()
  }

  /**
   * 复制网站
   */
  const handleCopyWebsite = (index) => {
    emit('copy-website', index)
  }

  /**
   * 删除网站
   */
  const handleRemoveWebsite = (index) => {
    if (confirm(`确定要删除 "${props.websites[index].title}" 吗？`)) {
      emit('remove-website', index)
    }
  }

  /**
   * 切换网站静音状态
   */
  const handleToggleMute = (index) => {
    const website = props.websites[index]
    if (website) {
      emit('update-website', {
        index,
        updates: {
          muted: !website.muted
        }
      })
    }
  }

  /**
   * 更新网站URL
   * 当URL变化时，清除选择器配置，因为选择器是针对特定页面的
   */
  const handleUpdateUrl = (index, newUrl) => {
    console.log('[GridView] 更新网站 URL:', { index, newUrl })
    console.log('[GridView] 同时清除选择器配置（URL已变化，原选择器不再适用）')
    emit('update-website', {
      index,
      updates: {
        url: newUrl,
        targetSelector: '',
        targetSelectors: []
      }
    })
  }

  /**
   * 刷新网站（导航到首页原始URL）
   */
  const handleRefreshWebsite = (index) => {
    console.log('[GridView] ========== handleRefreshWebsite 被调用 ==========')
    console.log('[GridView] 刷新网站索引:', index)

    // 获取网站的原始URL
    const website = props.websites[index]
    if (!website || !website.url) {
      console.warn('[GridView] 无效的网站数据或URL')
      return
    }

    const originalUrl = website.url
    console.log('[GridView] 导航到原始URL（首页）:', originalUrl)

    // 检测是否在 Electron 环境
    const isElectron = window.electron?.isElectron

    if (isElectron) {
      // Electron 环境：通过 ID 查找 webview 并导航到原始URL
      const webview = document.querySelector(`#webview-${website.id}`)
      if (webview) {
        console.log('[GridView] 找到 webview，导航到原始URL')
        // 构建带 webview ID 的URL
        const separator = originalUrl.includes('?') ? '&' : '?'
        const urlWithId = `${originalUrl}${separator}__webview_id__=${website.id}`
        webview.src = urlWithId
      } else {
        console.warn('[GridView] 未找到 webview')
      }
    } else {
      // 浏览器环境：通过 data-website-id 查找 iframe 并导航到原始URL
      const iframe = document.querySelector(`iframe[data-website-id="${website.id}"]`)
      if (iframe) {
        console.log('[GridView] 找到 iframe，导航到原始URL')
        // 先设置为空白页，再设置原始URL，确保刷新
        iframe.src = 'about:blank'
        setTimeout(() => {
          iframe.src = originalUrl
        }, 10)
      } else {
        console.warn('[GridView] 未找到 iframe')
      }
    }
  }

  /**
   * 编辑网站
   */
  const handleEditWebsite = (index) => {
    const website = props.websites[index]
    if (website) {
      // 根据网站类型决定显示哪个对话框
      editingDialogType.value = website.type === 'desktop-capture' ? 'desktop-capture' : 'website'
      editingSlot.value = index
      newWebsite.value = {
        title: website.title,
        url: website.url,
        deviceType: website.deviceType || 'desktop',
        targetSelector: website.targetSelector || '',
        targetSelectors: website.targetSelectors || [],
        autoRefreshInterval: website.autoRefreshInterval || 0,
        sessionInstance: website.sessionInstance || 'default',
        padding: website.padding !== undefined ? website.padding : 0,
        muted: website.muted || false,
        darkMode: website.darkMode || false,
        requireModifierForActions: website.requireModifierForActions || false
      }
      console.log('[GridView] 编辑网站:', {
        title: website.title,
        sessionInstance: newWebsite.value.sessionInstance,
        targetSelectors: newWebsite.value.targetSelectors
      })
    }
  }

  return {
    // 状态
    editingSlot,
    editingDialogType,
    newWebsite,
    // 方法
    startAddWebsite,
    startAddDesktopCapture,
    confirmAddWebsite,
    cancelAddWebsite,
    handleCopyWebsite,
    handleRemoveWebsite,
    handleToggleMute,
    handleUpdateUrl,
    handleRefreshWebsite,
    handleEditWebsite
  }
}

