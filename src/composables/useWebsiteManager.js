import { ref } from 'vue'

/**
 * 网站管理 Composable
 * 提供网站的添加、删除、更新等功能
 */
export function useWebsiteManager(initialWebsites = []) {
  // 网站列表
  const websites = ref(initialWebsites.map(site => ({
    ...site,
    position: site.position ? { ...site.position } : undefined,
    size: site.size ? { ...site.size } : undefined
  })))

  /**
   * 添加网站
   * @param {Object} websiteData - 网站数据
   */
  const addWebsite = (websiteData) => {
    console.log('[useWebsiteManager] ========== 开始添加网站 ==========')
    console.log('[useWebsiteManager] 接收到的网站数据:', websiteData)
    console.log('[useWebsiteManager] 当前网站数量:', websites.value.length)
    
    const defaultWidth = 400
    const defaultHeight = 300
    const spacing = 20

    // 查找所有现有网站的最大Y坐标
    let maxY = 20
    if (websites.value.length > 0) {
      websites.value.forEach(site => {
        if (site.position && site.size) {
          const bottomY = site.position.y + site.size.height
          if (bottomY > maxY) {
            maxY = bottomY
          }
        }
      })
    }

    // 新网站放在最下方
    const newX = 20
    const newY = websites.value.length === 0 ? 20 : maxY + spacing

    const newWebsite = {
      id: Date.now(),
      url: websiteData.url || '',
      title: websiteData.title,
      type: websiteData.type || 'website', // 'website' 或 'desktop-capture'
      deviceType: websiteData.deviceType || 'desktop',
      targetSelector: websiteData.targetSelector || '',
      targetSelectors: websiteData.targetSelectors || [],
      autoRefreshInterval: websiteData.autoRefreshInterval || 0,
      sessionInstance: websiteData.sessionInstance || 'default', // Session实例ID
      padding: websiteData.padding !== undefined ? websiteData.padding : 10,
      muted: websiteData.muted || false,
      darkMode: websiteData.darkMode || false,
      requireModifierForActions: websiteData.requireModifierForActions || false,
      position: websiteData.position || { x: newX, y: newY },
      size: websiteData.size || { width: defaultWidth, height: defaultHeight },
      // 桌面捕获相关配置
      desktopCaptureSourceId: websiteData.desktopCaptureSourceId || null,
      desktopCaptureOptions: websiteData.desktopCaptureOptions || {
        autoRefresh: false,
        fitScreen: false
      }
    }
    
    console.log('[useWebsiteManager] 计算的位置:', { x: newX, y: newY })
    console.log('[useWebsiteManager] 创建的新网站对象:', newWebsite)
    
    websites.value.push(newWebsite)
    
    console.log('[useWebsiteManager] 添加后网站总数:', websites.value.length)
    console.log('[useWebsiteManager] 最新的网站列表:', websites.value)
    console.log('[useWebsiteManager] ========== 添加网站完成 ==========')
  }

  /**
   * 删除网站
   * @param {number} index - 网站索引
   */
  const removeWebsite = (index) => {
    websites.value.splice(index, 1)
  }

  /**
   * 复制网站
   * @param {number} index - 要复制的网站索引
   */
  const copyWebsite = (index) => {
    if (!websites.value[index]) {
      console.error('无效的索引:', index)
      return
    }

    const sourceSite = websites.value[index]
    const spacing = 20

    // 计算新位置：在原网站右侧或下方
    let newX = sourceSite.position.x + sourceSite.size.width + spacing
    let newY = sourceSite.position.y

    // 如果右侧空间不够（超出视口宽度80%），则放在下方
    const maxX = window.innerWidth * 0.8
    if (newX + sourceSite.size.width > maxX) {
      newX = sourceSite.position.x
      newY = sourceSite.position.y + sourceSite.size.height + spacing
    }

    // 创建复制的网站
    const copiedSite = {
      id: Date.now(),
      url: sourceSite.url || '',
      title: `${sourceSite.title} - 副本`,
      type: sourceSite.type || 'website',
      deviceType: sourceSite.deviceType || 'desktop',
      targetSelector: sourceSite.targetSelector || '',
      targetSelectors: sourceSite.targetSelectors || [],
      autoRefreshInterval: sourceSite.autoRefreshInterval || 0,
      sessionInstance: sourceSite.sessionInstance || 'default', // 复制session实例设置
      padding: sourceSite.padding !== undefined ? sourceSite.padding : 10,
      muted: sourceSite.muted || false,
      darkMode: sourceSite.darkMode || false,
      requireModifierForActions: sourceSite.requireModifierForActions || false,
      position: { x: newX, y: newY },
      size: { ...sourceSite.size },
      // 复制桌面捕获配置
      desktopCaptureSourceId: sourceSite.desktopCaptureSourceId || null,
      desktopCaptureOptions: sourceSite.desktopCaptureOptions ? { ...sourceSite.desktopCaptureOptions } : {
        autoRefresh: false,
        fitScreen: false
      }
    }

    websites.value.push(copiedSite)
    console.log('已复制网站:', sourceSite.title, '->', copiedSite.title)
  }

  /**
   * 更新网站
   * @param {Object} params - 更新参数
   * @param {number} params.index - 网站索引
   * @param {string} params.title - 标题
   * @param {string} params.url - URL
   * @param {string} params.deviceType - 设备类型
   * @param {string} params.targetSelector - 目标选择器
   * @param {number} params.autoRefreshInterval - 自动刷新间隔（秒）
   * @param {string} params.sessionInstance - Session实例ID
   * @param {boolean} params.muted - 静音状态
   * @param {boolean} params.darkMode - 暗色模式
   * @param {number} params.padding - 内边距
   * @param {Object} params.position - 位置
   * @param {Object} params.size - 大小
   */
  const updateWebsite = (params) => {
    console.log('[useWebsiteManager] ========== updateWebsite 被调用 ==========')
    console.log('[useWebsiteManager] 接收到的完整参数对象:', params)
    console.log('[useWebsiteManager] 参数的键:', Object.keys(params))
    
    // 支持两种参数格式：
    // 1. 扁平格式: { index, title, url, deviceType, targetSelector, ... }
    // 2. 嵌套格式: { index, updates: { title, url, ... } }
    const { index, updates } = params
    const data = updates || params // 如果有 updates 字段，使用 updates；否则使用整个 params
    
    console.log('[useWebsiteManager] 解析后的 index:', index)
    console.log('[useWebsiteManager] 解析后的 data:', data)
    
    if (websites.value[index]) {
      console.log('[useWebsiteManager] 更新前的网站数据:', websites.value[index])
      
      const { title, url, type, deviceType, targetSelector, targetSelectors, autoRefreshInterval, sessionInstance, position, size, muted, darkMode, padding, requireModifierForActions, desktopCaptureSourceId, desktopCaptureOptions, proxyId } = data
      
      if (title !== undefined) websites.value[index].title = title
      if (url !== undefined) {
        console.log('[useWebsiteManager] 更新 URL:', url)
        websites.value[index].url = url
      }
      if (type !== undefined) websites.value[index].type = type
      if (deviceType !== undefined) websites.value[index].deviceType = deviceType
      if (desktopCaptureSourceId !== undefined) websites.value[index].desktopCaptureSourceId = desktopCaptureSourceId
      if (desktopCaptureOptions !== undefined) websites.value[index].desktopCaptureOptions = desktopCaptureOptions
      if (targetSelector !== undefined) {
        console.log('[useWebsiteManager] 更新 targetSelector:', targetSelector)
        websites.value[index].targetSelector = targetSelector
      }
      if (targetSelectors !== undefined) {
        console.log('[useWebsiteManager] 更新 targetSelectors:', targetSelectors)
        websites.value[index].targetSelectors = targetSelectors
      }
      if (autoRefreshInterval !== undefined) websites.value[index].autoRefreshInterval = autoRefreshInterval
      if (sessionInstance !== undefined) websites.value[index].sessionInstance = sessionInstance
      if (muted !== undefined) {
        console.log('[useWebsiteManager] 更新 muted:', muted)
        websites.value[index].muted = muted
      }
      if (darkMode !== undefined) {
        console.log('[useWebsiteManager] 更新 darkMode:', darkMode)
        websites.value[index].darkMode = darkMode
      }
      if (padding !== undefined) {
        console.log('[useWebsiteManager] 更新 padding:', padding)
        websites.value[index].padding = padding
      }
      if (requireModifierForActions !== undefined) {
        console.log('[useWebsiteManager] 更新 requireModifierForActions:', requireModifierForActions)
        websites.value[index].requireModifierForActions = requireModifierForActions
      }
      if (proxyId !== undefined) {
        console.log('[useWebsiteManager] 更新 proxyId:', proxyId)
        websites.value[index].proxyId = proxyId
      }
      if (position !== undefined) {
        websites.value[index].position = { ...position }
        console.log('[useWebsiteManager] 更新位置:', websites.value[index].title, position)
      }
      if (size !== undefined) {
        websites.value[index].size = { ...size }
        console.log('[useWebsiteManager] 更新大小:', websites.value[index].title, size)
      }
      
      console.log('[useWebsiteManager] 更新后的网站数据:', websites.value[index])
    } else {
      console.error('[useWebsiteManager] 无效的索引:', index)
    }
  }

  /**
   * 设置网站列表
   * @param {Array} newWebsites - 新的网站列表
   */
  const setWebsites = (newWebsites) => {
    websites.value = newWebsites.map(site => ({
      ...site,
      position: site.position ? { ...site.position } : undefined,
      size: site.size ? { ...site.size } : undefined
    }))
  }

  return {
    // 状态
    websites,
    // 方法
    addWebsite,
    removeWebsite,
    copyWebsite,
    updateWebsite,
    setWebsites
  }
}

