import { ref, computed, onMounted } from 'vue'

/**
 * 窗口管理 Composable
 * 提供多窗口支持和窗口间数据隔离
 */
export function useWindowManager() {
  // 当前窗口 ID
  const currentWindowId = ref(null)
  
  // 所有窗口列表
  const windows = ref([])

  // 检测是否在 Electron 环境中
  const isElectron = computed(() => {
    return typeof window !== 'undefined' &&
      (window.electron !== undefined ||
       (navigator.userAgent && navigator.userAgent.toLowerCase().includes('electron')))
  })

  /**
   * 获取当前窗口 ID
   */
  const getCurrentWindowId = async () => {
    if (isElectron.value && window.electron.window) {
      try {
        const result = await window.electron.window.getId()
        if (result.success) {
          currentWindowId.value = result.windowId
          console.log('[窗口管理] 当前窗口 ID:', currentWindowId.value)
        }
      } catch (error) {
        console.error('[窗口管理] 获取窗口 ID 失败:', error)
      }
    } else {
      // 非 Electron 环境，从 URL 参数获取
      const urlParams = new URLSearchParams(window.location.search)
      const wid = urlParams.get('windowId')
      currentWindowId.value = wid ? parseInt(wid) : 1
    }
    
    return currentWindowId.value
  }

  /**
   * 获取带窗口前缀的 localStorage key
   * @param {string} key - 原始 key
   * @returns {string} 带窗口前缀的 key
   */
  const getWindowStorageKey = (key) => {
    const wid = currentWindowId.value || 1
    // 第一个窗口使用原来的名称，保持向后兼容性
    if (wid === 1) {
      return key
    }
    return `window-${wid}-${key}`
  }

  /**
   * 窗口独立的 localStorage 操作
   */
  const windowStorage = {
    setItem: (key, value) => {
      const windowKey = getWindowStorageKey(key)
      localStorage.setItem(windowKey, value)
    },
    
    getItem: (key) => {
      const windowKey = getWindowStorageKey(key)
      return localStorage.getItem(windowKey)
    },
    
    removeItem: (key) => {
      const windowKey = getWindowStorageKey(key)
      localStorage.removeItem(windowKey)
    },
    
    clear: () => {
      const wid = currentWindowId.value || 1
      const prefix = `window-${wid}-`
      const keysToRemove = []
      
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (key.startsWith(prefix)) {
          keysToRemove.push(key)
        }
      }
      
      keysToRemove.forEach(key => localStorage.removeItem(key))
    }
  }

  /**
   * 创建新窗口
   */
  const createNewWindow = async () => {
    if (isElectron.value && window.electron.window) {
      try {
        const result = await window.electron.window.createNew()
        if (result.success) {
          console.log('[窗口管理] ✓ 新窗口已创建, ID:', result.windowId)
          await refreshWindowList()
          return result
        }
      } catch (error) {
        console.error('[窗口管理] 创建窗口失败:', error)
      }
    } else {
      console.warn('[窗口管理] 非 Electron 环境，无法创建新窗口')
    }
    return { success: false }
  }

  /**
   * 刷新窗口列表
   */
  const refreshWindowList = async () => {
    if (isElectron.value && window.electron.window) {
      try {
        const result = await window.electron.window.getAll()
        if (result.success) {
          windows.value = result.windows
          console.log('[窗口管理] 窗口列表已更新:', windows.value.length)
        }
      } catch (error) {
        console.error('[窗口管理] 获取窗口列表失败:', error)
      }
    }
  }

  /**
   * 切换到指定窗口
   */
  const switchToWindow = async (windowId) => {
    if (isElectron.value && window.electron.window) {
      try {
        const result = await window.electron.window.focus(windowId)
        if (result.success) {
          console.log('[窗口管理] ✓ 已切换到窗口:', windowId)
        }
      } catch (error) {
        console.error('[窗口管理] 切换窗口失败:', error)
      }
    }
  }

  // 初始化
  onMounted(async () => {
    await getCurrentWindowId()
    await refreshWindowList()
  })

  return {
    // 状态
    currentWindowId,
    windows,
    isElectron,
    
    // 方法
    getCurrentWindowId,
    getWindowStorageKey,
    windowStorage,
    createNewWindow,
    refreshWindowList,
    switchToWindow
  }
}

