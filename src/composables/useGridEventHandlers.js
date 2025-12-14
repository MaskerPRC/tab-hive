/**
 * 网格视图事件处理器 Composable
 * 整合所有事件处理逻辑
 */

export function useGridEventHandlers(props, context) {
  const {
    emit,
    allWebsites,
    editingSlot,
    // 对话框方法
    openWebsiteEditDialog,
    closeEditDialog,
    openCustomHtmlDialog,
    closeCustomHtmlDialog,
    openRearrangeDialog,
    closeRearrangeDialog,
    openContextMenu,
    closeContextMenu,
    // 网站操作
    confirmAddWebsite,
    handleRefreshWebsite,
    handleCopyWebsite,
    handleRemoveWebsite,
    handleToggleMute,
    handleUpdateUrl,
    // 拖拽相关
    startDragItem,
    startResizeItem,
    handleDropBase,
    handleDropOnEmptyBase,
    handleDropOnEmptyFiles,
    handleDragOverOnEmptyFiles,
    // 绘制相关
    handleDrawingMouseDown,
    // 全屏相关
    fullscreenIndexRef,
    // 其他
    dragOverIndex
  } = context

  /**
   * 开始添加网站
   */
  const startAddWebsite = (index) => {
    openWebsiteEditDialog(index, index === -1 ? null : allWebsites.value[index])
  }

  /**
   * 编辑网站
   */
  const handleEditWebsite = (index) => {
    openWebsiteEditDialog(index, allWebsites.value[index])
  }

  /**
   * 取消添加网站
   */
  const cancelAddWebsite = () => {
    closeEditDialog()
  }

  /**
   * 确认添加网站包装器
   */
  const onConfirmAddWebsite = (websiteData) => {
    confirmAddWebsite(websiteData, handleRefreshWebsite, editingSlot.value)
    closeEditDialog()
  }

  /**
   * 处理自定义 HTML 确认
   */
  const handleCustomHtmlConfirm = (data) => {
    console.log('[GridView] 自定义 HTML 数据:', data)
    closeCustomHtmlDialog()
    
    // 创建网站数据
    const websiteData = {
      type: 'custom-html',
      title: data.title || '自定义网页',
      url: '', // 自定义 HTML 不需要 URL
      html: data.html || '',
      deviceType: 'desktop',
      padding: 0,
      muted: false,
      darkMode: false,
      requireModifierForActions: false,
      targetSelectors: [],
      targetSelector: '',
      autoRefreshInterval: 0,
      sessionInstance: 'default'
    }
    
    onConfirmAddWebsite(websiteData)
  }

  /**
   * 右键菜单：添加网站
   */
  const handleContextMenuAddWebsite = () => {
    startAddWebsite(-1)
    closeContextMenu()
  }

  /**
   * 右键菜单：添加自定义 HTML
   */
  const handleContextMenuAddCustomHtml = () => {
    openCustomHtmlDialog()
    closeContextMenu()
  }

  /**
   * 自定义的右键菜单处理
   */
  const handleContextMenu = (event) => {
    const target = event.target
    if (target.closest('webview') || 
        target.closest('iframe') || 
        target.closest('.grid-item')) {
      return
    }
    event.preventDefault()
    openContextMenu(event.clientX, event.clientY)
  }

  /**
   * 开始拖拽
   */
  const startDrag = (event, index) => {
    startDragItem(event, index, allWebsites.value.length)
  }

  /**
   * 开始调整大小
   */
  const startResize = (event, index, handle) => {
    const target = event.target
    if (target.classList.contains('resize-se')) {
      startResizeItem(event, index, 'se')
    } else if (target.classList.contains('resize-e')) {
      startResizeItem(event, index, 'e')
    } else if (target.classList.contains('resize-s')) {
      startResizeItem(event, index, 's')
    }
  }

  /**
   * 处理全屏切换
   */
  const handleFullscreenToggle = (index) => {
    if (props.fullscreenIndex === index) {
      emit('fullscreen', null)
    } else {
      emit('fullscreen', index)
    }
  }

  /**
   * 处理打开脚本面板
   */
  const handleOpenScriptPanel = (iframe) => {
    emit('open-script-panel', iframe)
  }

  /**
   * 处理打开工作流
   */
  const handleOpenWorkflow = (websiteId, websiteName, darkMode) => {
    console.log('[GridView] 接收到 open-workflow 事件')
    console.log('[GridView] websiteId:', websiteId)
    console.log('[GridView] websiteName:', websiteName)
    console.log('[GridView] darkMode:', darkMode)
    console.log('[GridView] 向上传递事件到 App.vue')
    emit('open-workflow', websiteId, websiteName, darkMode)
  }

  /**
   * 处理全屏模式下的刷新
   */
  const handleFullscreenRefresh = () => {
    console.log('[GridView] ========== handleFullscreenRefresh 被调用 ==========')
    console.log('[GridView] fullscreenIndex:', props.fullscreenIndex)
    if (props.fullscreenIndex !== null) {
      console.log('[GridView] 准备刷新网站到首页')
      handleRefreshWebsite(props.fullscreenIndex)
    } else {
      console.warn('[GridView] fullscreenIndex 为 null，无法刷新')
    }
  }

  /**
   * 包装 handleDrop，传递正确的参数
   */
  const handleDrop = (event, index) => {
    handleDropBase(event, index, allWebsites.value, emit)
  }

  /**
   * 处理空白区域的拖放（整合文件拖放和URL拖放）
   */
  const handleDragOverOnEmpty = (event) => {
    handleDragOverOnEmptyFiles(event, dragOverIndex)
  }

  /**
   * 处理空白区域的放置
   */
  const handleDropOnEmpty = async (event) => {
    await handleDropOnEmptyFiles(event, emit, handleDropOnEmptyBase)
  }

  /**
   * 绘制鼠标按下包装器
   */
  const handleDrawingMouseDownWrapper = (event) => {
    handleDrawingMouseDown(event, props.fullscreenIndex)
  }

  /**
   * 文字输入处理
   */
  const handleTextSubmit = (textInput, saveText) => {
    if (textInput.value.content && textInput.value.content.trim()) {
      saveText(textInput.value.content)
    } else {
      textInput.value.show = false
    }
  }
  
  /**
   * 取消文字输入
   */
  const handleTextCancel = (textInput) => {
    textInput.value.show = false
  }
  
  /**
   * 图片上传处理
   */
  const handleImageFileSelect = (event, handleImageUpload) => {
    const file = event.target.files?.[0]
    if (file) {
      handleImageUpload(file)
    }
  }
  
  /**
   * 取消图片上传
   */
  const handleImageCancel = (imageUpload) => {
    imageUpload.value.show = false
  }

  return {
    // 网站操作
    startAddWebsite,
    handleEditWebsite,
    cancelAddWebsite,
    onConfirmAddWebsite,
    handleCustomHtmlConfirm,
    handleCopyWebsite,
    handleRemoveWebsite,
    handleRefreshWebsite,
    handleToggleMute,
    handleUpdateUrl,
    handleOpenScriptPanel,
    handleOpenWorkflow,
    // 右键菜单
    handleContextMenu,
    handleContextMenuAddWebsite,
    handleContextMenuAddCustomHtml,
    // 拖拽和调整大小
    startDrag,
    startResize,
    handleDrop,
    handleDragOverOnEmpty,
    handleDropOnEmpty,
    // 全屏
    handleFullscreenToggle,
    handleFullscreenRefresh,
    // 绘制
    handleDrawingMouseDownWrapper,
    handleTextSubmit,
    handleTextCancel,
    handleImageFileSelect,
    handleImageCancel
  }
}

