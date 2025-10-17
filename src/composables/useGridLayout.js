/**
 * 网格布局相关的可组合函数
 * 处理网格项目的位置、大小和吸附逻辑
 */
import { ref, computed, watch, nextTick } from 'vue'

export function useGridLayout(websites) {
  const itemPositions = ref({})
  const itemSizes = ref({})
  
  // 网格吸附配置
  const GRID_SIZE = 20 // 网格单元大小（像素）

  /**
   * 吸附到网格的辅助函数
   */
  const snapToGrid = (value) => {
    return Math.round(value / GRID_SIZE) * GRID_SIZE
  }

  /**
   * 初始化网格布局
   */
  const initializeGridLayout = () => {
    const container = document.querySelector('.grid-container')
    if (!container) return

    const containerWidth = container.clientWidth
    const defaultItemWidth = 400
    const defaultItemHeight = 300
    const spacing = 20

    // 计算每行可以放置多少个项目
    const itemsPerRow = Math.max(1, Math.floor(containerWidth / (defaultItemWidth + spacing)))

    // 为每个项目计算初始位置和大小
    websites.value.forEach((item, index) => {
      // 优先从数据中加载位置和大小
      if (item.position && item.size) {
        itemPositions.value[index] = { ...item.position }
        itemSizes.value[index] = { ...item.size }
      }
      // 如果已经初始化过，则不重新计算
      else if (itemPositions.value[index] && itemSizes.value[index]) {
        return
      }
      // 否则计算默认位置
      else {
        const row = Math.floor(index / itemsPerRow)
        const col = index % itemsPerRow

        const x = col * (defaultItemWidth + spacing) + spacing
        const y = row * (defaultItemHeight + spacing) + spacing

        itemPositions.value[index] = { x, y }
        itemSizes.value[index] = { width: defaultItemWidth, height: defaultItemHeight }
      }
    })
  }

  /**
   * 获取项目样式
   */
  const getItemStyle = (item, index, fullscreenIndex) => {
    // 如果是全屏模式，不应用位置和大小样式（由CSS处理）
    if (fullscreenIndex === index) {
      return {}
    }

    // 如果位置还未初始化，先初始化
    if (!itemPositions.value[index] || !itemSizes.value[index]) {
      // 确保容器已存在
      const container = document.querySelector('.grid-container')
      if (container) {
        // 立即初始化该项目的位置
        const containerWidth = container.clientWidth
        const defaultItemWidth = 400
        const defaultItemHeight = 300
        const spacing = 20
        const itemsPerRow = Math.max(1, Math.floor(containerWidth / (defaultItemWidth + spacing)))

        const row = Math.floor(index / itemsPerRow)
        const col = index % itemsPerRow

        const x = col * (defaultItemWidth + spacing) + spacing
        const y = row * (defaultItemHeight + spacing) + spacing

        itemPositions.value[index] = { x, y }
        itemSizes.value[index] = { width: defaultItemWidth, height: defaultItemHeight }
      }
    }

    const position = itemPositions.value[index] || { x: 20, y: 20 }
    const size = itemSizes.value[index] || { width: 400, height: 300 }

    return {
      position: 'absolute',
      left: `${position.x}px`,
      top: `${position.y}px`,
      width: `${size.width}px`,
      height: `${size.height}px`
    }
  }

  return {
    itemPositions,
    itemSizes,
    GRID_SIZE,
    snapToGrid,
    initializeGridLayout,
    getItemStyle
  }
}

