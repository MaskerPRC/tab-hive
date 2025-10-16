import { ref } from 'vue'

/**
 * 导入导出 Composable
 * 提供布局的导入和导出功能
 */
export function useImportExport() {
  // 导入模式选择对话框
  const showImportDialog = ref(false)
  const selectedLayoutForImport = ref(null)

  /**
   * 从 URL 提取标题
   * @param {string} url - URL 地址
   * @returns {string} 提取的标题
   */
  const extractTitleFromUrl = (url) => {
    try {
      const urlObj = new URL(url)
      return urlObj.hostname.replace('www.', '')
    } catch (e) {
      return '网站'
    }
  }

  /**
   * 从 URL 参数导入布局
   * @returns {Object|null} 导入的布局数据或 null
   */
  const importLayoutFromUrlParams = () => {
    try {
      const urlParams = new URLSearchParams(window.location.search)
      const urlsParam = urlParams.get('urls')

      if (!urlsParam) return null

      let websites = []

      // 尝试解析不同格式的 URLs 参数
      try {
        // 格式1: JSON 数组 - [{"url":"https://google.com","title":"Google"},...]
        const parsed = JSON.parse(urlsParam)
        if (Array.isArray(parsed)) {
          websites = parsed.map((item, index) => {
            if (typeof item === 'string') {
              // 简单字符串数组
              const url = item.startsWith('http') ? item : `https://${item}`
              return {
                id: Date.now() + index,
                url: url,
                title: extractTitleFromUrl(url),
                deviceType: 'desktop'
              }
            } else if (typeof item === 'object' && item.url) {
              // 对象数组
              const url = item.url.startsWith('http') ? item.url : `https://${item.url}`
              return {
                id: Date.now() + index,
                url: url,
                title: item.title || extractTitleFromUrl(url),
                deviceType: item.deviceType || 'desktop'
              }
            }
            return null
          }).filter(Boolean)
        }
      } catch (e) {
        // 格式2: 逗号分隔的 URLs - https://google.com,https://bing.com
        const urlList = urlsParam.split(',').map(u => u.trim()).filter(Boolean)
        websites = urlList.map((urlStr, index) => {
          const url = urlStr.startsWith('http') ? urlStr : `https://${urlStr}`
          return {
            id: Date.now() + index,
            url: url,
            title: extractTitleFromUrl(url),
            deviceType: 'desktop'
          }
        })
      }

      if (websites.length === 0) return null

      // 获取其他可选参数
      const layoutName = urlParams.get('layoutName') || urlParams.get('name') || '导入的布局'

      // 清除 URL 参数（可选）
      if (urlParams.get('clearParams') !== 'false') {
        const newUrl = window.location.pathname + window.location.hash
        window.history.replaceState({}, document.title, newUrl)
      }

      return {
        name: layoutName,
        websites: websites
      }
    } catch (error) {
      console.error('从 URL 参数导入布局失败:', error)
      return null
    }
  }

  /**
   * 显示导入模式选择对话框
   * @param {Object} layout - 要导入的布局
   */
  const showImportModeDialog = (layout) => {
    selectedLayoutForImport.value = layout
    showImportDialog.value = true
  }

  /**
   * 关闭导入对话框
   */
  const closeImportDialog = () => {
    showImportDialog.value = false
    selectedLayoutForImport.value = null
  }

  /**
   * 处理导入模式选择
   * @param {string} mode - 导入模式 ('realtime' 或 'copy')
   * @param {boolean} isElectron - 是否在 Electron 环境
   * @param {Function} onLayoutImport - 导入成功回调
   */
  const handleImportMode = async (mode, isElectron = false, onLayoutImport = null) => {
    if (!selectedLayoutForImport.value) return

    const layout = selectedLayoutForImport.value
    closeImportDialog()

    try {
      const API_BASE_URL = isElectron
        ? 'https://tabs.apexstone.ai/api'
        : (import.meta.env.PROD ? '/api' : 'http://localhost:3101/api')

      const response = await fetch(`${API_BASE_URL}/layouts/${layout.id}`)
      const templateData = await response.json()

      const suffix = mode === 'realtime' ? ' (实时)' : ' (副本)'
      const newLayoutName = `${templateData.name || '共享布局'}${suffix}`

      // 调用回调函数创建新布局
      if (onLayoutImport) {
        onLayoutImport({
          name: newLayoutName,
          websites: templateData.websites || [],
          linkedTemplateId: mode === 'realtime' ? templateData.original_id : null,
          importMode: mode,
          templateVersion: templateData.version
        })
      }

      const modeText = mode === 'realtime' ? '实时同步' : '拷贝'
      alert(`布局已${modeText}导入成功！`)
    } catch (error) {
      console.error('加载布局失败:', error)
      alert('加载布局失败')
    }
  }

  return {
    // 状态
    showImportDialog,
    selectedLayoutForImport,
    // 方法
    importLayoutFromUrlParams,
    showImportModeDialog,
    closeImportDialog,
    handleImportMode,
    extractTitleFromUrl
  }
}

