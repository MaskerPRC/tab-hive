/**
 * 布局操作处理器
 * 负责处理布局的切换、创建、删除、重命名、排序等操作
 */

export function useLayoutHandlers(layoutManager, websiteManager, dialog, t) {
  // 切换布局
  const handleSwitchLayout = (layoutId) => {
    const websites = layoutManager.switchLayout(layoutId)
    websiteManager.setWebsites(websites)
    
    // 如果全局静音已开启，应用到新布局的所有网站
    if (layoutManager.globalSettings.value.globalMuted) {
      console.log('[App] 全局静音已开启，应用到新布局的所有网站')
      websiteManager.websites.value.forEach((website, index) => {
        if (!website.muted) {
          websiteManager.updateWebsite({ index, updates: { muted: true } })
        }
      })
    }
  }

  // 创建新布局
  const handleCreateLayout = (name, options = {}) => {
    console.log('[useLayoutHandlers] ========== handleCreateLayout 被调用 ==========')
    console.log('[useLayoutHandlers] 布局名称:', name)
    console.log('[useLayoutHandlers] 选项:', options)
    console.log('[useLayoutHandlers] 网站数量:', options.websites?.length || 0)
    console.log('[useLayoutHandlers] 调用 createLayout')
    
    const newLayout = layoutManager.createLayout(name, options)
    
    console.log('[useLayoutHandlers] 新布局已创建:', newLayout)
    console.log('[useLayoutHandlers] 新布局ID:', newLayout.id)
    console.log('[useLayoutHandlers] 调用 handleSwitchLayout')
    
    handleSwitchLayout(newLayout.id)
    
    console.log('[useLayoutHandlers] handleSwitchLayout 完成')
  }

  // 删除布局
  const handleDeleteLayout = async (layoutId) => {
    if (layoutManager.layouts.value.length <= 1) {
      await dialog.showAlert({
        title: t('layout.warning') || '提示',
        message: t('layout.atLeastOne')
      })
      return
    }

    const result = layoutManager.deleteLayout(layoutId)

    // 如果删除的是当前布局，切换到第一个布局
    if (typeof result === 'number') {
      handleSwitchLayout(result)
    }
  }

  // 切换布局后台运行状态
  const handleToggleKeepAlive = async (layoutId) => {
    const newState = layoutManager.toggleKeepAlive(layoutId)
    const layout = layoutManager.layouts.value.find(l => l.id === layoutId)
    if (layout) {
      const message = newState
        ? t('layout.keepAliveEnabled', { name: layout.name })
        : t('layout.keepAliveDisabled', { name: layout.name })
      await dialog.showAlert({
        title: t('layout.success') || '提示',
        message: message
      })
    }
  }

  // 重命名布局
  const handleRenameLayout = (layoutId, newName) => {
    layoutManager.renameLayout(layoutId, newName)
  }

  // 重新排序布局
  const handleReorderLayout = (fromIndex, toIndex) => {
    layoutManager.reorderLayouts(fromIndex, toIndex)
  }

  // 处理清除配置
  const handleClearConfig = () => {
    layoutManager.clearConfig()
  }

  // 更新绘制数据
  const handleUpdateDrawings = (drawings) => {
    const layout = layoutManager.layouts.value.find(l => l.id === layoutManager.currentLayoutId.value)
    if (layout) {
      layout.drawings = drawings
      layoutManager.saveCurrentLayout(websiteManager.websites.value)
    }
  }

  // 更新画布变换数据
  const handleUpdateCanvasTransform = (transform, layoutId) => {
    const layout = layoutManager.layouts.value.find(l => l.id === layoutId)
    if (layout) {
      layout.canvasTransform = { ...transform }
      layoutManager.saveCurrentLayout(websiteManager.websites.value)
    }
  }

  return {
    handleSwitchLayout,
    handleCreateLayout,
    handleDeleteLayout,
    handleToggleKeepAlive,
    handleRenameLayout,
    handleReorderLayout,
    handleClearConfig,
    handleUpdateDrawings,
    handleUpdateCanvasTransform
  }
}

