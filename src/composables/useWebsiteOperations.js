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
      padding: 10,
      muted: false,
      darkMode: false,
      requireModifierForActions: false
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
   */
  const handleUpdateUrl = (index, newUrl) => {
    console.log('[GridView] 更新网站 URL:', { index, newUrl })
    emit('update-website', {
      index,
      updates: {
        url: newUrl
      }
    })
  }

  /**
   * 刷新网站
   */
  const handleRefreshWebsite = (index) => {
    console.log('[GridView] ========== handleRefreshWebsite 被调用 ==========')
    console.log('[GridView] 刷新网站索引:', index)

    // 注意：WebsiteCard 组件内部已经处理了双缓冲刷新
    // GridView 不需要直接操作 DOM，避免与内部刷新机制冲突

    // 处理 iframe 刷新（非 Electron 环境）
    const iframe = document.querySelector(`.grid-item:nth-child(${index + 1}) iframe:not(.buffer-iframe)`)
    if (iframe) {
      console.log('[GridView] 刷新 iframe')
      // 通过重新设置src来刷新iframe
      const currentSrc = iframe.src
      iframe.src = 'about:blank'
      // 使用setTimeout确保浏览器识别到URL变化
      setTimeout(() => {
        iframe.src = currentSrc
      }, 10)
    }

    // Webview 刷新由 WebsiteCard 内部的双缓冲机制处理
    // 不再直接操作 webview DOM
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
        padding: website.padding !== undefined ? website.padding : 10,
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

