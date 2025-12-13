/**
 * 管理全局设置的处理器
 * 包括标题显示、全局静音、去广告、自定义代码、证书错误阴影等
 */
export function useGlobalSettingsHandlers(layoutManager, websiteManager) {
  /**
   * 切换标题显示
   */
  const handleToggleTitles = (showTitles) => {
    layoutManager.updateGlobalSettings({ showTitles })
  }
  
  /**
   * 切换全局静音
   */
  const handleToggleGlobalMute = (globalMuted) => {
    layoutManager.updateGlobalSettings({ globalMuted })
    
    // 应用到所有网站
    if (globalMuted) {
      // 静音所有网站
      websiteManager.websites.value.forEach((website, index) => {
        if (!website.muted) {
          websiteManager.updateWebsite({ index, updates: { muted: true } })
        }
      })
    } else {
      // 解除所有网站的静音
      websiteManager.websites.value.forEach((website, index) => {
        if (website.muted) {
          websiteManager.updateWebsite({ index, updates: { muted: false } })
        }
      })
    }
  }
  
  /**
   * 切换去广告
   */
  const handleToggleAdBlock = (adBlockEnabled) => {
    layoutManager.updateGlobalSettings({ adBlockEnabled })
    // 注意：去广告设置变化后，WebsiteCard 组件会自动检测并重新应用
    // 通过 watch 监听 adBlockEnabled prop 的变化
    // 不需要手动刷新所有网站
  }
  
  /**
   * 切换自定义代码
   */
  const handleToggleCustomCode = (customCodeEnabled) => {
    layoutManager.updateGlobalSettings({ customCodeEnabled })
  }
  
  /**
   * 切换证书错误阴影
   */
  const handleToggleCertificateErrorShadow = (showCertificateErrorShadow) => {
    layoutManager.updateGlobalSettings({ showCertificateErrorShadow })
  }
  
  return {
    handleToggleTitles,
    handleToggleGlobalMute,
    handleToggleAdBlock,
    handleToggleCustomCode,
    handleToggleCertificateErrorShadow
  }
}

