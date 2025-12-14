/**
 * 布局操作 Composable
 * 处理自动排列、重排列、适应屏幕等布局相关操作
 */
import { computed } from 'vue'

export function useLayoutOperations(props, { 
  allWebsites, 
  itemPositions, 
  itemSizes, 
  snapToGrid,
  canvasTransform,
  emit 
}) {
  /**
   * 自动适应屏幕：调整画板缩放以适应所有内容
   */
  const handleAutoArrange = () => {
    // 计算所有网站的边界框
    let minX = Infinity, minY = Infinity
    let maxX = -Infinity, maxY = -Infinity
    
    allWebsites.value.forEach((site, index) => {
      const pos = itemPositions.value[index]
      const size = itemSizes.value[index]
      
      if (pos && size) {
        minX = Math.min(minX, pos.x)
        minY = Math.min(minY, pos.y)
        maxX = Math.max(maxX, pos.x + size.width)
        maxY = Math.max(maxY, pos.y + size.height)
      }
    })
    
    if (!isFinite(minX) || !isFinite(minY)) {
      console.warn('[适应屏幕] 没有有效的网站位置')
      return
    }
    
    // 获取容器尺寸
    const container = document.querySelector('.canvas-wrapper')
    if (!container) {
      console.warn('[适应屏幕] 未找到容器')
      return
    }
    
    // 检查左栏是否显示（通过检查 grid-view 是否有 panel-visible class）
    const gridView = container.closest('.grid-view')
    const isPanelVisible = gridView && gridView.classList.contains('panel-visible')
    const sidebarWidth = 288 // 左栏宽度
    
    // 如果左栏显示，需要从容器宽度中减去左栏宽度
    const containerWidth = isPanelVisible 
      ? container.clientWidth - sidebarWidth 
      : container.clientWidth
    const containerHeight = container.clientHeight
    
    // 计算内容的实际尺寸（加上边距）
    const contentWidth = maxX - minX + 40  // 左右各留20px边距
    const contentHeight = maxY - minY + 40 // 上下各留20px边距
    
    // 计算缩放比例
    const scaleX = containerWidth / contentWidth
    const scaleY = containerHeight / contentHeight
    const newZoom = Math.min(scaleX, scaleY, 1) // 不放大，只缩小
    
    // 计算居中偏移
    const offsetX = (containerWidth - contentWidth * newZoom) / 2 - minX * newZoom + 20 * newZoom
    const offsetY = (containerHeight - contentHeight * newZoom) / 2 - minY * newZoom + 20 * newZoom
    
    // 应用缩放和平移
    canvasTransform.value = {
      x: offsetX,
      y: offsetY,
      zoom: newZoom
    }
    
    console.log('[适应屏幕] 内容边界:', { minX, minY, maxX, maxY })
    console.log('[适应屏幕] 左栏显示:', isPanelVisible)
    console.log('[适应屏幕] 容器尺寸:', { containerWidth, containerHeight })
    console.log('[适应屏幕] 新缩放:', newZoom)
  }

  /**
   * 处理重排确认：按网格重新排列所有网站
   */
  const handleRearrangeConfirm = (config) => {
    console.log('[重排] 配置:', config)
    
    const { cols, width, height, scale } = config
    const spacing = 20
    const updates = {}
    
    // 计算实际窗口大小（应用放大倍数）
    const actualWidth = Math.round(width * scale)
    const actualHeight = Math.round(height * scale)
    
    // 计算所有网站的新位置和大小
    allWebsites.value.forEach((item, index) => {
      const row = Math.floor(index / cols)
      const col = index % cols
      
      // 使用实际窗口大小计算位置，避免重叠
      const x = snapToGrid(col * (actualWidth + spacing) + spacing)
      const y = snapToGrid(row * (actualHeight + spacing) + spacing)
      
      // 更新位置和大小
      itemPositions.value[index] = { x, y }
      itemSizes.value[index] = { 
        width: actualWidth, 
        height: actualHeight 
      }
      
      updates[index] = {
        position: { x, y },
        size: { 
          width: actualWidth, 
          height: actualHeight 
        }
      }
    })
    
    // 创建索引映射
    const indexMap = new Map()
    let originalIndex = 0
    
    allWebsites.value.forEach((site, filteredIndex) => {
      while (originalIndex < props.websites.length) {
        const originalSite = props.websites[originalIndex]
        if (originalSite && 
            ((originalSite.url && originalSite.url === site.url) || 
             (originalSite.id && originalSite.id === site.id) ||
             (originalSite.type === 'desktop-capture' && site.type === 'desktop-capture'))) {
          indexMap.set(filteredIndex, originalIndex)
          originalIndex++
          break
        }
        originalIndex++
      }
    })
    
    // 发送更新事件
    Object.keys(updates).forEach(indexStr => {
      const filteredIndex = parseInt(indexStr)
      const origIdx = indexMap.get(filteredIndex)
      const update = updates[filteredIndex]
      
      if (update && origIdx !== undefined) {
        emit('update-website', {
          index: origIdx,
          position: update.position,
          size: update.size
        })
      }
    })
    
    console.log('[重排] 完成，共重排', allWebsites.value.length, '个窗口')
    console.log('[重排] 布局:', cols, '列，窗口大小:', `${actualWidth}x${actualHeight}`)
  }

  return {
    handleAutoArrange,
    handleRearrangeConfirm
  }
}
