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
    type: 'website', // 'website'、'desktop-capture' 或 'custom-html'
    deviceType: 'desktop',
    targetSelector: '',
    targetSelectors: [],
    autoRefreshInterval: 0,
    sessionInstance: 'default',
    padding: 0, // 默认不启用内边距，除非配置了选择器
    muted: false,
    darkMode: false,
    requireModifierForActions: false,
    // 桌面捕获相关
    desktopCaptureSourceId: null,
    desktopCaptureOptions: {
      autoRefresh: false,
      fitScreen: false
    },
    // 自定义 HTML 相关
    html: '',
    // 网络 Hook URL（单页面配置）
    networkHookUrl: ''
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
    
    // 判断是否配置了选择器
    const hasSelectors = targetSelectors.some(s => s && s.trim())
    
    // 决定 padding 默认值：
    // 1. 如果已有 padding 值（包括 0），使用原值
    // 2. 如果是新建且配置了选择器，默认 10
    // 3. 其他情况默认 0
    let paddingValue = 0
    if ('padding' in newVal) {
      paddingValue = newVal.padding
    } else if (props.editingIndex === -1 && hasSelectors) {
      paddingValue = 10
    }
    
    localWebsite.value = {
      ...newVal,
      targetSelectors,
      sessionInstance: newVal.sessionInstance || 'default',
      padding: paddingValue,
      muted: newVal.muted || false,
      darkMode: newVal.darkMode || false,
      requireModifierForActions: newVal.requireModifierForActions || false,
      networkHookUrl: newVal.networkHookUrl || ''
    }
    
    console.log('[WebsiteEditDialog] 加载网站数据:', {
      title: localWebsite.value.title,
      sessionInstance: localWebsite.value.sessionInstance,
      padding: paddingValue,
      hasSelectors
    })
  }, { immediate: true, deep: true })

  /**
   * 监听选择器变化，智能调整内边距
   * 当用户从无选择器变为有选择器时，如果 padding 为 0，自动设置为 10
   */
  watch(() => localWebsite.value.targetSelectors, (newSelectors, oldSelectors) => {
    const hasNewSelectors = newSelectors.some(s => s && s.trim())
    const hadOldSelectors = oldSelectors ? oldSelectors.some(s => s && s.trim()) : false
    
    // 如果从无选择器变为有选择器，且当前 padding 为 0，则自动设置为 10
    if (!hadOldSelectors && hasNewSelectors && localWebsite.value.padding === 0) {
      console.log('[WebsiteEditDialog] 检测到添加了选择器，自动启用内边距')
      localWebsite.value.padding = 10
    }
  }, { deep: true })

  /**
   * 验证并提交表单
   */
  const handleConfirm = () => {
    // 桌面捕获类型不需要验证URL
    if (localWebsite.value.type === 'desktop-capture') {
      if (!localWebsite.value.title || !localWebsite.value.desktopCaptureSourceId) {
        alert('请填写标题并选择桌面源')
        return false
      }
      
      emit('confirm', {
        ...localWebsite.value,
        url: '', // 桌面捕获不需要URL
        targetSelectors: [],
        targetSelector: ''
      })
      return true
    }
    
    // 自定义 HTML 类型不需要验证URL
    if (localWebsite.value.type === 'custom-html') {
      if (!localWebsite.value.title || !localWebsite.value.html) {
        alert('请填写标题和 HTML 代码')
        return false
      }
      
      emit('confirm', {
        ...localWebsite.value,
        url: '', // 自定义 HTML 不需要URL
        targetSelectors: [],
        targetSelector: ''
      })
      return true
    }
    
    // 普通网站类型需要验证URL
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

