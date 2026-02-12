import { ref, watch } from 'vue'

/**
 * 管理视口状态：全屏和侧边栏
 * 处理全屏进入/退出、侧边栏显示/隐藏的逻辑
 */
export function useViewportStates() {
  // 全屏网站的索引
  const fullscreenIndex = ref(null)
  
  // 从 localStorage 读取侧边栏状态，如果不存在则默认为 false
  const getSavedPanelState = () => {
    const saved = localStorage.getItem('sidebarPanelState')
    return saved === 'true'
  }
  
  // 侧边栏显示状态
  const showPanel = ref(getSavedPanelState())
  
  // 监听侧边栏状态变化，保存到 localStorage
  watch(showPanel, (newValue) => {
    localStorage.setItem('sidebarPanelState', String(newValue))
  })

  /**
   * 进入全屏（仅在右侧区域内全屏，不影响侧边栏）
   */
  const handleFullscreen = (index) => {
    fullscreenIndex.value = index
  }

  /**
   * 退出全屏
   */
  const exitFullscreen = () => {
    fullscreenIndex.value = null
  }
  
  /**
   * 切换侧边栏显示状态
   */
  const toggleSidebar = () => {
    showPanel.value = !showPanel.value
  }
  
  /**
   * 显示侧边栏
   */
  const openPanel = () => {
    showPanel.value = true
  }
  
  /**
   * 隐藏侧边栏
   */
  const closePanel = () => {
    showPanel.value = false
  }
  
  /**
   * 显示侧边栏并在一定时间后自动隐藏
   */
  const showPanelTemporarily = (duration = 3000) => {
    showPanel.value = true
    setTimeout(() => {
      showPanel.value = false
    }, duration)
  }
  
  return {
    // 状态
    fullscreenIndex,
    showPanel,
    
    // 方法
    handleFullscreen,
    exitFullscreen,
    toggleSidebar,
    openPanel,
    closePanel,
    showPanelTemporarily
  }
}

