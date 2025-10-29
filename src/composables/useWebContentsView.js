import { ref, watch, onMounted, onUnmounted, nextTick } from 'vue'

/**
 * WebContentsView 管理 Composable
 * 用于在 Electron 环境中管理 WebContentsView
 */
export function useWebContentsView(websites, fullscreenIndex, globalSettings) {
  const isElectron = window.electron?.isElectron || false
  const viewsCreated = ref(new Set())
  const windowBounds = ref({ width: 0, height: 0 })

  /**
   * 获取窗口尺寸
   */
  const updateWindowBounds = async () => {
    if (!isElectron) return

    try {
      const bounds = await window.electron.views.getWindowBounds()
      windowBounds.value = bounds
    } catch (error) {
      console.error('[WebContentsView] 获取窗口尺寸失败:', error)
    }
  }

  /**
   * 计算视图的边界
   * @param {object} item - 网站项目
   * @param {object} itemStyle - 项目样式
   * @returns {object} bounds - {x, y, width, height}
   */
  const calculateViewBounds = (item, itemStyle) => {
    // 从样式中提取位置和大小
    const x = parseInt(itemStyle.left) || 0
    const y = parseInt(itemStyle.top) || 0
    const width = parseInt(itemStyle.width) || 400
    const height = parseInt(itemStyle.height) || 300

    return { x, y, width, height }
  }

  /**
   * 创建或更新视图
   * @param {object} item - 网站项目
   * @param {number} index - 索引
   * @param {object} itemStyle - 项目样式
   * @param {boolean} isFullscreen - 是否全屏
   */
  const createOrUpdateView = async (item, index, itemStyle, isFullscreen) => {
    if (!isElectron || !item.url) return

    const viewId = `website-${item.id}`

    try {
      let bounds
      
      if (isFullscreen) {
        // 全屏模式：占满整个窗口
        bounds = {
          x: 0,
          y: 0,
          width: windowBounds.value.width,
          height: windowBounds.value.height
        }
      } else {
        // 普通模式：根据布局计算位置
        bounds = calculateViewBounds(item, itemStyle)
      }

      const visible = isFullscreen ? (fullscreenIndex.value === index) : true

      // 创建或更新视图
      if (!viewsCreated.value.has(viewId)) {
        console.log(`[WebContentsView] 创建视图:`, viewId, bounds)
        await window.electron.views.createOrUpdate(viewId, item.url, bounds, visible)
        viewsCreated.value.add(viewId)
      } else {
        console.log(`[WebContentsView] 更新视图:`, viewId, bounds)
        await window.electron.views.update(viewId, { bounds, visible })
      }
    } catch (error) {
      console.error(`[WebContentsView] 创建/更新视图失败:`, error)
    }
  }

  /**
   * 删除视图
   * @param {object} item - 网站项目
   */
  const removeView = async (item) => {
    if (!isElectron || !item.url) return

    const viewId = `website-${item.id}`

    try {
      console.log(`[WebContentsView] 删除视图:`, viewId)
      await window.electron.views.remove(viewId)
      viewsCreated.value.delete(viewId)
    } catch (error) {
      console.error(`[WebContentsView] 删除视图失败:`, error)
    }
  }

  /**
   * 刷新视图
   * @param {object} item - 网站项目
   */
  const refreshView = async (item) => {
    if (!isElectron || !item.url) return

    const viewId = `website-${item.id}`

    try {
      console.log(`[WebContentsView] 刷新视图:`, viewId)
      await window.electron.views.refresh(viewId)
    } catch (error) {
      console.error(`[WebContentsView] 刷新视图失败:`, error)
    }
  }

  /**
   * 在视图中执行 JavaScript
   * @param {object} item - 网站项目
   * @param {string} code - 要执行的代码
   */
  const executeInView = async (item, code) => {
    if (!isElectron || !item.url) return

    const viewId = `website-${item.id}`

    try {
      console.log(`[WebContentsView] 在视图中执行 JS:`, viewId)
      const result = await window.electron.views.executeJS(viewId, code)
      return result
    } catch (error) {
      console.error(`[WebContentsView] 执行 JS 失败:`, error)
      throw error
    }
  }

  /**
   * 更新所有视图的布局
   * @param {Array} websites - 网站列表
   * @param {Function} getItemStyle - 获取项目样式的函数
   */
  const updateAllViewsLayout = async (websites, getItemStyle) => {
    if (!isElectron) return

    await updateWindowBounds()

    for (let i = 0; i < websites.value.length; i++) {
      const item = websites.value[i]
      if (item.url) {
        const itemStyle = getItemStyle(item, i, fullscreenIndex.value)
        await createOrUpdateView(item, i, itemStyle, fullscreenIndex.value === i)
      }
    }
  }

  /**
   * 处理全屏切换
   * @param {number|null} index - 全屏索引
   */
  const handleFullscreenChange = async (index) => {
    if (!isElectron) return

    try {
      if (index !== null) {
        // 进入全屏模式
        const item = websites.value[index]
        if (item && item.url) {
          const viewId = `website-${item.id}`
          
          // 隐藏其他所有视图
          await window.electron.views.hideAllExcept(viewId)
          
          // 更新全屏视图的大小
          await window.electron.views.update(viewId, {
            bounds: {
              x: 0,
              y: 0,
              width: windowBounds.value.width,
              height: windowBounds.value.height
            },
            visible: true
          })

          // 如果启用了全屏刷新
          if (globalSettings.value?.refreshOnFullscreenToggle) {
            await refreshView(item)
          }
        }
      } else {
        // 退出全屏模式
        await window.electron.views.showAll()
      }
    } catch (error) {
      console.error('[WebContentsView] 处理全屏切换失败:', error)
    }
  }

  /**
   * 清理所有视图
   */
  const cleanupAllViews = async () => {
    if (!isElectron) return

    for (const viewId of viewsCreated.value) {
      try {
        await window.electron.views.remove(viewId)
      } catch (error) {
        console.error(`[WebContentsView] 清理视图失败 (${viewId}):`, error)
      }
    }
    viewsCreated.value.clear()
  }

  // 监听窗口大小变化
  if (isElectron) {
    const handleWindowResize = (bounds) => {
      console.log('[WebContentsView] 窗口大小变化:', bounds)
      windowBounds.value = bounds
    }

    onMounted(() => {
      updateWindowBounds()
      window.electron.on('window-resized', handleWindowResize)
    })

    onUnmounted(() => {
      window.electron.off('window-resized', handleWindowResize)
      cleanupAllViews()
    })
  }

  // 监听全屏状态变化
  watch(() => fullscreenIndex.value, (newIndex) => {
    handleFullscreenChange(newIndex)
  })

  return {
    isElectron,
    windowBounds,
    viewsCreated,
    createOrUpdateView,
    removeView,
    refreshView,
    executeInView,
    updateAllViewsLayout,
    handleFullscreenChange,
    cleanupAllViews
  }
}

