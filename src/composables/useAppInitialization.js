/**
 * 应用初始化处理器
 * 负责处理应用启动时的各种初始化逻辑
 */

import { onMounted } from 'vue'

export function useAppInitialization(options) {
  const {
    dialogStates,
    viewportStates,
    importExport,
    layoutManager,
    websiteManager,
    handleCreateLayout,
    t
  } = options

  // 检查是否是从双击打开的单网站窗口
  const checkSingleWebsiteMode = () => {
    const urlParams = new URLSearchParams(window.location.search)
    const websiteDataParam = urlParams.get('websiteData')
    
    if (websiteDataParam) {
      try {
        const websiteData = JSON.parse(decodeURIComponent(websiteDataParam))
        console.log('[App] 检测到单网站窗口模式，网站数据:', websiteData)
        
        // 隐藏侧边栏
        viewportStates.closePanel()
        
        // 创建只包含这个网站的布局
        const singleWebsiteLayout = {
          id: Date.now(),
          name: websiteData.title || websiteData.url || '单网站窗口',
          websites: [{
            id: websiteData.id || Date.now(),
            url: websiteData.url,
            title: websiteData.title || websiteData.url,
            type: websiteData.type || 'website',
            deviceType: websiteData.deviceType || 'desktop',
            targetSelector: websiteData.targetSelector,
            targetSelectors: websiteData.targetSelectors,
            padding: websiteData.padding,
            muted: websiteData.muted || false,
            darkMode: websiteData.darkMode || false,
            autoRefreshInterval: websiteData.autoRefreshInterval || 0,
            desktopCaptureSourceId: websiteData.desktopCaptureSourceId,
            desktopCaptureOptions: websiteData.desktopCaptureOptions,
            position: { x: 0, y: 0 },
            size: { width: 1000, height: 700 }
          }],
          drawings: []
        }
        
        // 切换到单网站布局
        layoutManager.createLayout(singleWebsiteLayout.name, singleWebsiteLayout)
        layoutManager.switchLayout(singleWebsiteLayout.id)
        
        // 自动全屏显示这个网站
        setTimeout(() => {
          if (websiteManager.websites.value.length > 0) {
            viewportStates.handleFullscreen(0)
          }
        }, 500)
        
        return true // 单网站窗口模式
      } catch (error) {
        console.error('[App] 解析网站数据失败:', error)
      }
    }
    
    return false // 非单网站窗口模式
  }

  // 处理 URL 参数导入布局
  const handleUrlImport = () => {
    const importedLayout = importExport.importLayoutFromUrlParams()
    if (importedLayout) {
      handleCreateLayout(importedLayout.name, importedLayout)
    }
    return importedLayout
  }

  // 显示侧边栏并可选显示导入成功提示
  const showSidebarAndNotification = (importedLayout) => {
    // 检查是否是第一次启动
    const isFirstLaunch = !localStorage.getItem('hasLaunched')

    if (isFirstLaunch) {
      // 第一次启动：显示侧边栏，3秒后自动隐藏
      localStorage.setItem('hasLaunched', 'true')
      viewportStates.showPanelTemporarily(3000)
    }
    // 非第一次启动：保持用户上次的状态（不做任何改变）

    // 如果成功导入了布局，显示提示
    if (importedLayout) {
      setTimeout(() => {
        alert(t('layout.urlImportSuccess'))
      }, 500)
    }
  }

  // 初始化逻辑
  const initialize = () => {
    onMounted(() => {
      // 检查是否是单网站窗口模式
      const isSingleWebsiteMode = checkSingleWebsiteMode()
      if (isSingleWebsiteMode) {
        return // 单网站窗口模式，不执行后续逻辑
      }

      // 尝试从 URL 参数导入布局
      const importedLayout = handleUrlImport()

      // 显示侧边栏和通知
      showSidebarAndNotification(importedLayout)
    })
  }

  return {
    initialize
  }
}

