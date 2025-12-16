/**
 * 进阶功能区域状态管理
 * 管理进阶功能的展开/折叠状态
 */
import { ref, watch } from 'vue'

export function useAdvancedSection() {
  // 进阶功能折叠状态
  const showAdvanced = ref(false)

  /**
   * 检查是否配置了进阶功能
   * @param {Object} website - 网站配置对象
   * @returns {boolean} 是否有进阶配置
   */
  const hasAdvancedConfig = (website) => {
    // 检查是否配置了选择器（不为空数组）
    const hasSelectors = website.targetSelectors && 
                        Array.isArray(website.targetSelectors) && 
                        website.targetSelectors.length > 0
    
    // 检查是否配置了自动刷新（不为默认值0）
    const hasAutoRefresh = website.autoRefreshInterval && 
                          website.autoRefreshInterval !== 0
    
    // 检查是否是自定义 HTML 类型
    const isCustomHtml = website.type === 'custom-html'
    
    return hasSelectors || hasAutoRefresh || isCustomHtml
  }

  /**
   * 设置进阶功能展开状态监听
   * @param {Function} getWebsite - 获取当前网站配置的函数
   * @param {Function} getShow - 获取对话框显示状态的函数
   */
  const setupAdvancedWatch = (getWebsite, getShow) => {
    watch(getShow, (newShow) => {
      if (newShow) {
        // 对话框打开时，检查当前网站是否配置了进阶功能
        showAdvanced.value = hasAdvancedConfig(getWebsite())
      }
    })
  }

  return {
    showAdvanced,
    hasAdvancedConfig,
    setupAdvancedWatch
  }
}

