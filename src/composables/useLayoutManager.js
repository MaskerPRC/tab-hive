import { ref, watch } from 'vue'

/**
 * 布局管理 Composable
 * 提供布局的创建、删除、切换、重命名等功能
 */
export function useLayoutManager() {
  // 从 localStorage 加载配置
  const loadFromStorage = () => {
    try {
      const saved = localStorage.getItem('iframe-all-config')
      
      // 🔍 调试信息：显示所有 localStorage 的键
      console.log('[布局管理] 当前 localStorage 中的所有键:', Object.keys(localStorage))
      console.log('[布局管理] 查找配置键: iframe-all-config')
      console.log('[布局管理] 配置是否存在:', !!saved)
      
      if (saved) {
        console.log('[布局管理] ✓ 找到配置，大小:', saved.length, '字符')
        const config = JSON.parse(saved)

        // 如果是旧格式（单个配置），转换为新格式（多布局）
        if (config.websites !== undefined && !config.layouts) {
          return {
            layouts: [{
              id: 1,
              name: '默认布局',
              websites: config.websites || []
            }],
            currentLayoutId: 1,
            globalSettings: {
              showTitles: false, // 默认不显示标题
              refreshOnFullscreenToggle: true // 默认全屏切换时刷新选择器类型的蜂巢
            }
          }
        }

        // 确保有全局设置
        if (!config.globalSettings) {
          config.globalSettings = {
            showTitles: false, // 默认不显示标题
            refreshOnFullscreenToggle: true // 默认全屏切换时刷新选择器类型的蜂巢
          }
        } else {
          // 确保旧配置也有新字段
          if (config.globalSettings.refreshOnFullscreenToggle === undefined) {
            config.globalSettings.refreshOnFullscreenToggle = true
          }
        }

        // 新格式
        return config
      }
    } catch (e) {
      console.error('加载配置失败:', e)
    }
    return null
  }

  // 保存配置到 localStorage
  const saveToStorage = (layouts, currentLayoutId, globalSettings) => {
    try {
      const config = {
        layouts: layouts,
        currentLayoutId: currentLayoutId,
        globalSettings: globalSettings
      }
      localStorage.setItem('iframe-all-config', JSON.stringify(config))
    } catch (e) {
      console.error('保存配置失败:', e)
    }
  }

  // 加载保存的配置或使用默认值
  const savedConfig = loadFromStorage()

  // 布局列表
  const layouts = ref(savedConfig ? savedConfig.layouts : [
    {
      id: 1,
      name: '默认布局',
      websites: [
        {
          id: 1,
          url: 'https://www.baidu.com',
          title: '百度',
          deviceType: 'desktop',
          position: { x: 20, y: 20 },
          size: { width: 400, height: 300 }
        },
        {
          id: 2,
          url: 'https://www.bing.com',
          title: 'Bing',
          deviceType: 'desktop',
          position: { x: 440, y: 20 },
          size: { width: 400, height: 300 }
        },
        {
          id: 3,
          url: 'https://www.google.com',
          title: 'Google',
          deviceType: 'desktop',
          position: { x: 20, y: 340 },
          size: { width: 400, height: 300 }
        }
      ]
    }
  ])

  // 当前布局 ID
  const currentLayoutId = ref(savedConfig?.currentLayoutId || 1)

  // 全局设置
  const globalSettings = ref(savedConfig?.globalSettings || {
    showTitles: false, // 默认不显示标题
    refreshOnFullscreenToggle: true // 默认全屏切换时刷新选择器类型的蜂巢
  })

  // 当前布局（计算属性）
  const currentLayout = ref(layouts.value.find(l => l.id === currentLayoutId.value) || layouts.value[0])

  /**
   * 切换布局
   * @param {number} layoutId - 要切换到的布局 ID
   * @returns {Array} 新布局的网站列表
   */
  const switchLayout = (layoutId) => {
    const layout = layouts.value.find(l => l.id === layoutId)
    if (layout) {
      currentLayoutId.value = layoutId
      currentLayout.value = layout
      // 深拷贝网站数据，避免引用问题
      const websites = layout.websites.map(site => ({
        ...site,
        position: site.position ? { ...site.position } : undefined,
        size: site.size ? { ...site.size } : undefined
      }))
      console.log('切换布局:', layout.name, '加载了', websites.length, '个网站')
      saveToStorage(layouts.value, currentLayoutId.value, globalSettings.value)
      return websites
    }
    return []
  }

  /**
   * 保存当前布局（更新当前布局的数据）
   * @param {Array} websites - 要保存的网站列表
   */
  const saveCurrentLayout = (websites) => {
    const layout = layouts.value.find(l => l.id === currentLayoutId.value)
    if (layout) {
      // 检查是否是实时导入的模板，如果是则标记为已修改
      if (layout.importMode === 'realtime' && !layout.isModified) {
        // 检查是否真的修改了
        const hasChanged = JSON.stringify(layout.websites) !== JSON.stringify(websites)

        if (hasChanged) {
          layout.isModified = true
          console.log('检测到布局修改，已断开实时链接')
        }
      }

      // 深拷贝网站数据，确保位置和大小信息被正确保存
      layout.websites = websites.map(site => ({
        ...site,
        position: site.position ? { ...site.position } : undefined,
        size: site.size ? { ...site.size } : undefined
      }))

      console.log('保存布局:', layout.name, '网站数量:', layout.websites.length)
      saveToStorage(layouts.value, currentLayoutId.value, globalSettings.value)
    }
  }

  /**
   * 创建新布局
   * @param {string} name - 布局名称
   * @param {Object} options - 可选参数
   * @returns {Object} 新创建的布局
   */
  const createLayout = (name, options = {}) => {
    const newLayout = {
      id: Date.now(),
      name: name || `布局 ${layouts.value.length + 1}`,
      websites: options.websites || [],
      // 模板链接相关字段
      linkedTemplateId: options.linkedTemplateId || null, // 链接的原始模板ID (original_id)
      importMode: options.importMode || null, // 'realtime' 或 'copy' 或 null
      isModified: false, // 用户是否修改过（实时导入时使用）
      templateVersion: options.templateVersion || null // 当前模板版本
    }
    layouts.value.push(newLayout)
    return newLayout
  }

  /**
   * 删除布局
   * @param {number} layoutId - 要删除的布局 ID
   * @returns {boolean} 是否删除成功
   */
  const deleteLayout = (layoutId) => {
    if (layouts.value.length <= 1) {
      return false
    }

    const index = layouts.value.findIndex(l => l.id === layoutId)
    if (index !== -1) {
      layouts.value.splice(index, 1)
      
      // 如果删除的是当前布局，返回第一个布局的 ID
      if (currentLayoutId.value === layoutId) {
        return layouts.value[0].id
      } else {
        saveToStorage(layouts.value, currentLayoutId.value, globalSettings.value)
        return true
      }
    }
    return false
  }

  /**
   * 重命名布局
   * @param {number} layoutId - 布局 ID
   * @param {string} newName - 新名称
   */
  const renameLayout = (layoutId, newName) => {
    const layout = layouts.value.find(l => l.id === layoutId)
    if (layout) {
      layout.name = newName
      saveToStorage(layouts.value, currentLayoutId.value, globalSettings.value)
    }
  }

  /**
   * 更新全局设置
   * @param {Object} settings - 新的设置
   */
  const updateGlobalSettings = (settings) => {
    globalSettings.value = { ...globalSettings.value, ...settings }
    saveToStorage(layouts.value, currentLayoutId.value, globalSettings.value)
  }

  /**
   * 检查模板更新
   * @param {number} layoutId - 布局 ID
   * @param {boolean} isElectron - 是否在 Electron 环境
   * @returns {Promise<Object>} 更新信息
   */
  const checkTemplateUpdate = async (layoutId, isElectron = false) => {
    const layout = layouts.value.find(l => l.id === layoutId)
    if (!layout || !layout.linkedTemplateId || layout.importMode !== 'realtime' || layout.isModified) {
      return { hasUpdate: false }
    }

    try {
      const API_BASE_URL = isElectron
        ? 'https://tabs.apexstone.ai/api'
        : (import.meta.env.PROD ? '/api' : 'http://localhost:3101/api')

      const response = await fetch(
        `${API_BASE_URL}/layouts/${layout.linkedTemplateId}/check-update?currentVersion=${layout.templateVersion || 1}`
      )
      return await response.json()
    } catch (error) {
      console.error('检查更新失败:', error)
      return { hasUpdate: false }
    }
  }

  /**
   * 同步模板更新
   * @param {number} layoutId - 布局 ID
   * @param {boolean} isElectron - 是否在 Electron 环境
   * @param {Function} onWebsitesUpdate - 网站列表更新回调
   * @returns {Promise<boolean>} 是否同步成功
   */
  const syncTemplateUpdate = async (layoutId, isElectron = false, onWebsitesUpdate = null) => {
    const layout = layouts.value.find(l => l.id === layoutId)
    if (!layout || !layout.linkedTemplateId) {
      return false
    }

    try {
      const API_BASE_URL = isElectron
        ? 'https://tabs.apexstone.ai/api'
        : (import.meta.env.PROD ? '/api' : 'http://localhost:3101/api')

      const response = await fetch(`${API_BASE_URL}/layouts/${layout.linkedTemplateId}/latest`)
      const templateData = await response.json()

      // 更新布局数据
      layout.websites = templateData.websites || []
      layout.templateVersion = templateData.version
      // 重置修改标记，因为已经同步到最新版本
      layout.isModified = false

      // 如果是当前布局，也通知更新显示
      if (currentLayoutId.value === layoutId && onWebsitesUpdate) {
        onWebsitesUpdate(templateData.websites || [])
      }

      saveToStorage(layouts.value, currentLayoutId.value, globalSettings.value)
      return true
    } catch (error) {
      console.error('同步更新失败:', error)
      return false
    }
  }

  return {
    // 状态
    layouts,
    currentLayoutId,
    currentLayout,
    globalSettings,
    // 方法
    switchLayout,
    saveCurrentLayout,
    createLayout,
    deleteLayout,
    renameLayout,
    updateGlobalSettings,
    checkTemplateUpdate,
    syncTemplateUpdate,
    saveToStorage
  }
}

