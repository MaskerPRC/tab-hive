import { ref, watch } from 'vue'

/**
 * 网站表单数据管理
 * 处理表单数据的初始化、更新和验证
 */
export function useWebsiteForm(props, emit) {
  // 本地表单数据
  const localWebsite = ref({
    title: '',
    url: '',
    deviceType: 'desktop',
    targetSelector: '',
    targetSelectors: [],
    autoRefreshInterval: 0,
    sessionInstance: 'default',
    padding: 0,
    muted: false,
    darkMode: false
  })

  /**
   * 处理 targetSelector 到 targetSelectors 的兼容性转换
   */
  const convertTargetSelectors = (website) => {
    let targetSelectors = []
    
    if (website.targetSelectors && Array.isArray(website.targetSelectors) && website.targetSelectors.length > 0) {
      // 新格式：使用 targetSelectors 数组
      targetSelectors = website.targetSelectors.filter(s => s && s.trim())
    } else if (website.targetSelector && website.targetSelector.trim()) {
      // 旧格式：从 targetSelector 字符串转换
      targetSelectors = [website.targetSelector.trim()]
    }
    
    // 确保至少有一个空输入框
    if (targetSelectors.length === 0) {
      targetSelectors = ['']
    }
    
    return targetSelectors
  }

  /**
   * 监听 website prop 变化，更新本地数据
   */
  watch(() => props.website, (newVal) => {
    const targetSelectors = convertTargetSelectors(newVal)
    
    localWebsite.value = { 
      ...newVal,
      targetSelectors,
      sessionInstance: newVal.sessionInstance || 'default',
      padding: newVal.padding || 0,
      muted: newVal.muted || false,
      darkMode: newVal.darkMode || false
    }
    
    console.log('[WebsiteEditDialog] 加载网站数据:', {
      title: localWebsite.value.title,
      sessionInstance: localWebsite.value.sessionInstance
    })
  }, { immediate: true, deep: true })

  /**
   * 验证并提交表单
   */
  const handleConfirm = () => {
    if (!localWebsite.value.title || !localWebsite.value.url) {
      return false
    }

    let url = localWebsite.value.url.trim()

    // 如果URL不是以 http:// 或 https:// 开头，自动添加 https://
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      url = 'https://' + url
    }

    // 验证URL格式
    try {
      new URL(url)
    } catch (e) {
      alert('请输入有效的网址格式，例如：google.com 或 https://google.com')
      return false
    }

    // 过滤空选择器并保存
    const targetSelectors = localWebsite.value.targetSelectors
      .filter(s => s && s.trim())
      .map(s => s.trim())

    emit('confirm', {
      ...localWebsite.value,
      url,
      targetSelectors,
      // 为了兼容性，同时保留 targetSelector（第一个选择器）
      targetSelector: targetSelectors.length > 0 ? targetSelectors[0] : ''
    })

    return true
  }

  return {
    localWebsite,
    handleConfirm
  }
}

