/**
 * Gridstack 集成 - 使用成熟的网格布局库处理碰撞推开
 */
import { ref, onMounted, onUnmounted, nextTick } from 'vue'
import { GridStack } from 'gridstack'
import 'gridstack/dist/gridstack.min.css'

// 网格配置
const GRID_CONFIG = {
  cellHeight: 100,        // 单元格高度（像素）
  margin: 20,             // 元素间距
  column: 12,             // 列数
  float: false,           // 关键：不浮动，自动推开碰撞元素
  animate: true,          // 启用动画
  disableOneColumnMode: true,  // 禁用单列模式
  resizable: {
    handles: 'e, se, s'   // 可调整大小的手柄方向
  },
  draggable: {
    handle: '.drag-handle'  // 拖拽手柄
  }
}

// 像素到网格单位的转换比例
const PIXEL_TO_GRID_WIDTH = 100  // 每个网格宽度单位对应的像素
const PIXEL_TO_GRID_HEIGHT = 100 // 每个网格高度单位对应的像素

/**
 * 将像素坐标转换为网格单位
 */
function pixelToGrid(pixelPos, pixelSize) {
  return {
    x: Math.round(pixelPos.x / PIXEL_TO_GRID_WIDTH),
    y: Math.round(pixelPos.y / PIXEL_TO_GRID_HEIGHT),
    w: Math.max(2, Math.round(pixelSize.width / PIXEL_TO_GRID_WIDTH)),   // 最小 2 个单位宽
    h: Math.max(2, Math.round(pixelSize.height / PIXEL_TO_GRID_HEIGHT))  // 最小 2 个单位高
  }
}

/**
 * 将网格单位转换为像素坐标
 */
function gridToPixel(gridPos) {
  return {
    x: gridPos.x * PIXEL_TO_GRID_WIDTH,
    y: gridPos.y * PIXEL_TO_GRID_HEIGHT,
    width: gridPos.w * PIXEL_TO_GRID_WIDTH,
    height: gridPos.h * PIXEL_TO_GRID_HEIGHT
  }
}

export function useGridstack(websites, emit) {
  const gridInstance = ref(null)
  const gridContainer = ref(null)
  const isInitialized = ref(false)

  console.log('[Gridstack] 初始化 useGridstack')

  /**
   * 初始化 Gridstack
   */
  const initGridstack = async () => {
    if (isInitialized.value || !gridContainer.value) {
      console.log('[Gridstack] 跳过初始化', { isInitialized: isInitialized.value, hasContainer: !!gridContainer.value })
      return
    }

    console.log('[Gridstack] 开始初始化 Gridstack')

    await nextTick()

    try {
      // 初始化 Gridstack
      gridInstance.value = GridStack.init(GRID_CONFIG, gridContainer.value)
      isInitialized.value = true

      console.log('[Gridstack] Gridstack 初始化成功')

      // 监听变化事件
      gridInstance.value.on('change', (event, items) => {
        console.log('[Gridstack] 布局变化', items)
        
        if (!items || items.length === 0) return

        items.forEach(item => {
          const index = parseInt(item.id)
          if (isNaN(index)) return

          // 转换网格单位为像素
          const pixelData = gridToPixel({
            x: item.x,
            y: item.y,
            w: item.w,
            h: item.h
          })

          console.log('[Gridstack] 更新网站位置和大小', {
            index,
            gridData: { x: item.x, y: item.y, w: item.w, h: item.h },
            pixelData
          })

          // 发送更新事件
          emit('update-website', {
            index,
            position: { x: pixelData.x, y: pixelData.y },
            size: { width: pixelData.width, height: pixelData.height }
          })
        })
      })

      // 监听调整大小开始
      gridInstance.value.on('resizestart', (event, el) => {
        console.log('[Gridstack] 开始调整大小', el.gridstackNode)
        document.body.classList.add('resizing-item')
      })

      // 监听调整大小结束
      gridInstance.value.on('resizestop', (event, el) => {
        console.log('[Gridstack] 结束调整大小', el.gridstackNode)
        document.body.classList.remove('resizing-item')
      })

      // 监听拖拽开始
      gridInstance.value.on('dragstart', (event, el) => {
        console.log('[Gridstack] 开始拖拽', el.gridstackNode)
        document.body.classList.add('dragging-item')
      })

      // 监听拖拽结束
      gridInstance.value.on('dragstop', (event, el) => {
        console.log('[Gridstack] 结束拖拽', el.gridstackNode)
        document.body.classList.remove('dragging-item')
      })

    } catch (error) {
      console.error('[Gridstack] 初始化失败', error)
    }
  }

  /**
   * 添加网站到网格
   */
  const addWebsiteToGrid = (website, index) => {
    if (!gridInstance.value || !website) return

    console.log('[Gridstack] 添加网站到网格', { website, index })

    // 转换为网格单位
    const gridPos = pixelToGrid(
      website.position || { x: 0, y: 0 },
      website.size || { width: 400, height: 300 }
    )

    const widget = {
      id: String(index),
      x: gridPos.x,
      y: gridPos.y,
      w: gridPos.w,
      h: gridPos.h,
      minW: 2,
      minH: 2,
      content: `<div class="grid-item-placeholder" data-index="${index}"></div>`
    }

    console.log('[Gridstack] 添加 widget', widget)

    try {
      gridInstance.value.addWidget(widget)
    } catch (error) {
      console.error('[Gridstack] 添加 widget 失败', error)
    }
  }

  /**
   * 从网格中移除网站
   */
  const removeWebsiteFromGrid = (index) => {
    if (!gridInstance.value) return

    console.log('[Gridstack] 移除网站', index)

    const el = gridContainer.value?.querySelector(`[gs-id="${index}"]`)
    if (el) {
      gridInstance.value.removeWidget(el, false)
    }
  }

  /**
   * 更新网站在网格中的位置和大小
   */
  const updateWebsiteInGrid = (index, position, size) => {
    if (!gridInstance.value) return

    console.log('[Gridstack] 更新网站', { index, position, size })

    const el = gridContainer.value?.querySelector(`[gs-id="${index}"]`)
    if (el) {
      const gridPos = pixelToGrid(position, size)
      gridInstance.value.update(el, {
        x: gridPos.x,
        y: gridPos.y,
        w: gridPos.w,
        h: gridPos.h
      })
    }
  }

  /**
   * 刷新网格布局
   */
  const refreshGrid = () => {
    if (!gridInstance.value) return

    console.log('[Gridstack] 刷新网格')
    
    // 清空现有网格
    gridInstance.value.removeAll(false)

    // 重新添加所有网站
    websites.value.forEach((website, index) => {
      addWebsiteToGrid(website, index)
    })
  }

  /**
   * 清理
   */
  const cleanup = () => {
    if (gridInstance.value) {
      console.log('[Gridstack] 清理 Gridstack')
      gridInstance.value.destroy(false)
      gridInstance.value = null
      isInitialized.value = false
    }
  }

  // 组件挂载时初始化
  onMounted(() => {
    console.log('[Gridstack] onMounted')
  })

  // 组件卸载时清理
  onUnmounted(() => {
    cleanup()
  })

  return {
    gridContainer,
    gridInstance,
    isInitialized,
    initGridstack,
    addWebsiteToGrid,
    removeWebsiteFromGrid,
    updateWebsiteInGrid,
    refreshGrid,
    cleanup,
    pixelToGrid,
    gridToPixel
  }
}

