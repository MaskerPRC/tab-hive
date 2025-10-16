import { ref } from 'vue'

/**
 * 共享布局管理 Composable
 * 提供共享布局的加载、搜索等功能
 */
export function useSharedLayouts(isElectron = false) {
  // 自动检测API地址
  const API_BASE_URL = isElectron
    ? 'https://tabs.apexstone.ai/api'
    : (import.meta.env.PROD ? '/api' : 'http://localhost:3101/api')

  // 共享布局列表
  const sharedLayouts = ref([])
  const loadingShared = ref(false)
  const searchQuery = ref('')
  let searchTimeout = null

  /**
   * 加载共享布局列表
   * @param {number} limit - 加载数量限制
   */
  const loadSharedLayouts = async (limit = 50) => {
    loadingShared.value = true
    try {
      const url = `${API_BASE_URL}/layouts/shared?limit=${limit}`
      const response = await fetch(url)
      const data = await response.json()
      sharedLayouts.value = data.layouts || []
    } catch (error) {
      console.error('加载共享布局失败:', error)
      alert('加载共享布局失败，请确保后端服务正在运行')
    } finally {
      loadingShared.value = false
    }
  }

  /**
   * 搜索共享布局（带防抖）
   * @param {string} query - 搜索关键词
   * @param {number} limit - 加载数量限制
   */
  const searchSharedLayouts = (query, limit = 50) => {
    if (searchTimeout) {
      clearTimeout(searchTimeout)
    }

    searchTimeout = setTimeout(async () => {
      loadingShared.value = true
      try {
        const url = `${API_BASE_URL}/layouts/shared?search=${encodeURIComponent(query)}&limit=${limit}`
        const response = await fetch(url)
        const data = await response.json()
        sharedLayouts.value = data.layouts || []
      } catch (error) {
        console.error('搜索失败:', error)
      } finally {
        loadingShared.value = false
      }
    }, 300)
  }

  return {
    // 状态
    sharedLayouts,
    loadingShared,
    searchQuery,
    API_BASE_URL,
    // 方法
    loadSharedLayouts,
    searchSharedLayouts
  }
}

