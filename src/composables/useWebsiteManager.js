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

    websites.value.push({
      id: Date.now(),
      url: websiteData.url,
      title: websiteData.title,
      deviceType: websiteData.deviceType || 'desktop',
      targetSelector: websiteData.targetSelector || '',
      position: websiteData.position || { x: newX, y: newY },
      size: websiteData.size || { width: defaultWidth, height: defaultHeight }
    })
  }

  /**
   * 删除网站
   * @param {number} index - 网站索引
   */
  const removeWebsite = (index) => {
    websites.value.splice(index, 1)
  }

  /**
   * 更新网站
   * @param {Object} params - 更新参数
   * @param {number} params.index - 网站索引
   * @param {string} params.title - 标题
   * @param {string} params.url - URL
   * @param {string} params.deviceType - 设备类型
   * @param {string} params.targetSelector - 目标选择器
   * @param {Object} params.position - 位置
   * @param {Object} params.size - 大小
   */
  const updateWebsite = ({ index, title, url, deviceType, targetSelector, position, size }) => {
    if (websites.value[index]) {
      if (title !== undefined) websites.value[index].title = title
      if (url !== undefined) websites.value[index].url = url
      if (deviceType !== undefined) websites.value[index].deviceType = deviceType
      if (targetSelector !== undefined) websites.value[index].targetSelector = targetSelector
      if (position !== undefined) {
        websites.value[index].position = { ...position }
        console.log('更新位置:', websites.value[index].title, position)
      }
      if (size !== undefined) {
        websites.value[index].size = { ...size }
        console.log('更新大小:', websites.value[index].title, size)
      }
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
    updateWebsite,
    setWebsites
  }
}

