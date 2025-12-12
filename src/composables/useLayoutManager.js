import { ref, watch } from 'vue'
import { useWindowManager } from './useWindowManager'

/**
 * 布局管理 Composable
 * 提供布局的创建、删除、切换、重命名等功能
 */
export function useLayoutManager() {
  // 窗口管理器（用于数据隔离）
  const windowManager = typeof window !== 'undefined' ? useWindowManager() : null
  
  // 从 localStorage 加载配置
  const loadFromStorage = () => {
    try {
      let saved
      
      // 尝试从多个可能的 key 读取数据（兼容性处理）
      const possibleKeys = [
        'iframe-all-config',  // 当前使用的 key
        'tab-hive-config',     // 可能的旧 key
        'tabhive-config',      // 可能的旧 key
        'quanshijie-config'    // 可能的旧 key（虽然不应该存在，但为了完整性）
      ]
      
      // 辅助函数：验证是否是有效的配置数据
      const isValidConfig = (data) => {
        try {
          const parsed = typeof data === 'string' ? JSON.parse(data) : data
          return parsed && (parsed.layouts || parsed.websites || parsed.currentLayoutId !== undefined)
        } catch (e) {
          return false
        }
      }
      
      // 辅助函数：扫描所有 localStorage key，查找可能包含布局数据的 key
      const scanAllKeys = () => {
        const candidates = []
        try {
          for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i)
            if (key && (key.includes('config') || key.includes('layout') || key.includes('iframe'))) {
              const value = localStorage.getItem(key)
              if (value && isValidConfig(value)) {
                candidates.push({ key, value })
              }
            }
          }
        } catch (e) {
          console.warn('[useLayoutManager] 扫描 localStorage 失败:', e)
        }
        return candidates
      }
      
      if (windowManager && windowManager.windowStorage) {
        // 使用窗口独立的存储
        saved = windowManager.windowStorage.getItem('iframe-all-config')
        
        // 如果是第一个窗口且没有找到数据，尝试从所有可能的 key 读取（向后兼容）
        if (!saved && windowManager.currentWindowId.value === 1) {
          // 首先尝试已知的可能 key
          for (const key of possibleKeys) {
            const candidate = localStorage.getItem(key)
            if (candidate && isValidConfig(candidate)) {
              saved = candidate
              console.log(`[useLayoutManager] 从旧 key "${key}" 加载配置`)
              // 迁移到新 key
              localStorage.setItem('iframe-all-config', candidate)
              console.log(`[useLayoutManager] 已迁移配置到新 key "iframe-all-config"`)
              break
            }
          }
          
          // 如果还没找到，扫描所有 key
          if (!saved) {
            const candidates = scanAllKeys()
            if (candidates.length > 0) {
              // 优先选择包含 'config' 的 key
              const configKey = candidates.find(c => c.key.includes('config'))
              const selected = configKey || candidates[0]
              saved = selected.value
              console.log(`[useLayoutManager] 从扫描到的 key "${selected.key}" 加载配置`)
              // 迁移到新 key
              localStorage.setItem('iframe-all-config', selected.value)
              console.log(`[useLayoutManager] 已迁移配置到新 key "iframe-all-config"`)
            }
          }
        }
      } else {
        // 降级到普通 localStorage，尝试从所有可能的 key 读取
        for (const key of possibleKeys) {
          const candidate = localStorage.getItem(key)
          if (candidate && isValidConfig(candidate)) {
            saved = candidate
            console.log(`[useLayoutManager] 从 key "${key}" 加载配置`)
            // 如果不是当前 key，迁移到新 key
            if (key !== 'iframe-all-config') {
              localStorage.setItem('iframe-all-config', candidate)
              console.log(`[useLayoutManager] 已迁移配置到新 key "iframe-all-config"`)
            }
            break
          }
        }
        
        // 如果还没找到，扫描所有 key
        if (!saved) {
          const candidates = scanAllKeys()
          if (candidates.length > 0) {
            // 优先选择包含 'config' 的 key
            const configKey = candidates.find(c => c.key.includes('config'))
            const selected = configKey || candidates[0]
            saved = selected.value
            console.log(`[useLayoutManager] 从扫描到的 key "${selected.key}" 加载配置`)
            // 迁移到新 key
            if (selected.key !== 'iframe-all-config') {
              localStorage.setItem('iframe-all-config', selected.value)
              console.log(`[useLayoutManager] 已迁移配置到新 key "iframe-all-config"`)
            }
          }
        }
      }
      
      if (saved) {
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
              showTitles: true, // 默认显示标题
              refreshOnFullscreenToggle: true, // 默认全屏切换时刷新选择器类型的视界
              globalMuted: false, // 默认不全局静音
              adBlockEnabled: false // 默认不启用去广告
            }
          }
        }

        // 确保有全局设置
        if (!config.globalSettings) {
          config.globalSettings = {
            showTitles: true, // 默认显示标题
            refreshOnFullscreenToggle: true, // 默认全屏切换时刷新选择器类型的视界
            globalMuted: false, // 默认不全局静音
            adBlockEnabled: false // 默认不启用去广告
          }
        } else {
          // 确保旧配置也有新字段
          if (config.globalSettings.refreshOnFullscreenToggle === undefined) {
            config.globalSettings.refreshOnFullscreenToggle = true
          }
          if (config.globalSettings.globalMuted === undefined) {
            config.globalSettings.globalMuted = false
          }
          if (config.globalSettings.adBlockEnabled === undefined) {
            config.globalSettings.adBlockEnabled = false
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
      console.log('[useLayoutManager] ========== 保存到存储 ==========')
      console.log('[useLayoutManager] 布局数量:', layouts.length)
      console.log('[useLayoutManager] 当前布局ID:', currentLayoutId)
      console.log('[useLayoutManager] 全局设置:', globalSettings)
      
      const config = {
        layouts: layouts,
        currentLayoutId: currentLayoutId,
        globalSettings: globalSettings
      }
      
      console.log('[useLayoutManager] 完整配置:', config)
      
      if (windowManager && windowManager.windowStorage) {
        // 使用窗口独立的存储
        console.log('[useLayoutManager] 使用窗口独立存储')
        windowManager.windowStorage.setItem('iframe-all-config', JSON.stringify(config))
        
        // 如果是第一个窗口，同时保存到原来的名称（向后兼容）
        if (windowManager.currentWindowId.value === 1) {
          localStorage.setItem('iframe-all-config', JSON.stringify(config))
          console.log('[useLayoutManager] 第一个窗口同时保存到原始名称')
        }
      } else {
        // 降级到普通 localStorage
        console.log('[useLayoutManager] 使用普通 localStorage')
        localStorage.setItem('iframe-all-config', JSON.stringify(config))
      }
      console.log('[useLayoutManager] ========== 存储保存完成 ==========')
    } catch (e) {
      console.error('[useLayoutManager] 保存配置失败:', e)
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

  // 全局设置 - 确保合并保存的配置和默认值
  const defaultGlobalSettings = {
    showTitles: true, // 默认显示标题
    refreshOnFullscreenToggle: true, // 默认全屏切换时刷新选择器类型的视界
    globalMuted: false, // 默认不全局静音
    adBlockEnabled: false, // 默认不启用去广告
    customCodeEnabled: true, // 默认启用自定义代码功能
    showCertificateErrorShadow: true // 默认显示证书错误红色阴影
  }
  const globalSettings = ref(savedConfig?.globalSettings 
    ? { ...defaultGlobalSettings, ...savedConfig.globalSettings }
    : defaultGlobalSettings)
  
  // 确保所有字段都存在（兼容旧配置）
  if (savedConfig?.globalSettings) {
    if (savedConfig.globalSettings.adBlockEnabled === undefined) {
      globalSettings.value.adBlockEnabled = false
      console.log('[useLayoutManager] 检测到旧配置，初始化 adBlockEnabled 为 false')
    }
    if (savedConfig.globalSettings.customCodeEnabled === undefined) {
      globalSettings.value.customCodeEnabled = true
      console.log('[useLayoutManager] 检测到旧配置，初始化 customCodeEnabled 为 true')
    }
    if (savedConfig.globalSettings.showCertificateErrorShadow === undefined) {
      globalSettings.value.showCertificateErrorShadow = true
      console.log('[useLayoutManager] 检测到旧配置，初始化 showCertificateErrorShadow 为 true')
    }
  }

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

      console.log('[useLayoutManager] 保存布局:', layout.name, '网站数量:', layout.websites.length)
      console.log('[useLayoutManager] 布局ID:', layout.id)
      console.log('[useLayoutManager] 保存的网站列表:', layout.websites)
      saveToStorage(layouts.value, currentLayoutId.value, globalSettings.value)
      console.log('[useLayoutManager] 保存到存储完成')
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
      keepAlive: options.keepAlive || false, // 是否后台运行
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

  /**
   * 切换布局的后台运行状态
   * @param {number} layoutId - 布局 ID
   * @returns {boolean} 新的 keepAlive 状态
   */
  const toggleKeepAlive = (layoutId) => {
    const layout = layouts.value.find(l => l.id === layoutId)
    if (layout) {
      layout.keepAlive = !layout.keepAlive
      console.log(`[LayoutManager] 布局 "${layout.name}" 后台运行: ${layout.keepAlive ? '开启' : '关闭'}`)
      saveToStorage(layouts.value, currentLayoutId.value, globalSettings.value)
      return layout.keepAlive
    }
    return false
  }

  /**
   * 重新排序布局列表
   * @param {number} fromIndex - 源索引
   * @param {number} toIndex - 目标索引
   */
  const reorderLayouts = (fromIndex, toIndex) => {
    if (fromIndex === toIndex) return
    
    const layoutsArray = [...layouts.value]
    const [movedLayout] = layoutsArray.splice(fromIndex, 1)
    layoutsArray.splice(toIndex, 0, movedLayout)
    
    layouts.value = layoutsArray
    saveToStorage(layouts.value, currentLayoutId.value, globalSettings.value)
    console.log(`[LayoutManager] 布局已重新排序: ${fromIndex} -> ${toIndex}`)
  }

  /**
   * 清除所有配置
   */
  const clearConfig = () => {
    try {
      if (windowManager && windowManager.windowStorage) {
        // 使用窗口独立的存储清除
        windowManager.windowStorage.removeItem('iframe-all-config')
        
        // 如果是第一个窗口，同时清除原来的名称
        if (windowManager.currentWindowId.value === 1) {
          localStorage.removeItem('iframe-all-config')
          console.log('[useLayoutManager] 第一个窗口同时清除原始名称')
        }
      } else {
        // 降级到普通 localStorage
        localStorage.removeItem('iframe-all-config')
      }
      console.log('[useLayoutManager] 配置已清除')
    } catch (e) {
      console.error('[useLayoutManager] 清除配置失败:', e)
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
    toggleKeepAlive,
    reorderLayouts,
    updateGlobalSettings,
    checkTemplateUpdate,
    syncTemplateUpdate,
    saveToStorage,
    clearConfig
  }
}

