/**
 * 网站操作处理器
 * 负责处理网站的添加、复制、删除、更新等操作
 */

export function useWebsiteHandlers(websiteManager, layoutManager) {
  // 添加网站
  const handleAddWebsite = (websiteData) => {
    console.log('[App] 准备添加网站，数据:', websiteData)
    websiteManager.addWebsite(websiteData)
    console.log('[App] 添加网站后，当前网站列表:', websiteManager.websites.value)
    console.log('[App] 当前布局ID:', layoutManager.currentLayoutId.value)
  }

  // 复制网站
  const handleCopyWebsite = (index) => {
    websiteManager.copyWebsite(index)
  }

  // 删除网站
  const handleRemoveWebsite = (index) => {
    websiteManager.removeWebsite(index)
  }

  // 更新网站
  const handleUpdateWebsite = (params) => {
    console.log('[App] ========== handleUpdateWebsite 被调用 ==========')
    console.log('[App] 接收到的参数:', params)
    console.log('[App] 参数的键:', Object.keys(params))
    websiteManager.updateWebsite(params)
    // 立即触发保存
    layoutManager.saveCurrentLayout(websiteManager.websites.value)
  }

  return {
    handleAddWebsite,
    handleCopyWebsite,
    handleRemoveWebsite,
    handleUpdateWebsite
  }
}

