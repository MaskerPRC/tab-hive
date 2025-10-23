import React, { useEffect, useRef } from 'react'
import GridLayout from 'react-grid-layout'
import 'react-grid-layout/css/styles.css'
import 'react-resizable/css/styles.css'

/**
 * 单个网格项组件 - 确保只在首次渲染时调用 renderItem
 */
const GridItem = ({ item, index, layout, renderItem }) => {
  const containerRef = useRef(null)
  const mountedRef = useRef(false)

  useEffect(() => {
    // 只在首次挂载时渲染
    if (!mountedRef.current && containerRef.current && renderItem) {
      console.log('[GridItem] 首次渲染', item.id)
      renderItem(containerRef.current, item, index)
      mountedRef.current = true
    }
  }, []) // 空依赖数组确保只在首次渲染时执行

  return (
    <div data-grid={layout}>
      <div 
        ref={containerRef}
        style={{ width: '100%', height: '100%' }}
      />
    </div>
  )
}

/**
 * React Grid Layout 包装组件
 * 用于在 Vue 中通过 veaury 使用
 */
const ReactGridLayoutWrapper = ({ 
  layout, 
  onLayoutChange,
  items = [],
  renderItem,
  cols = 12,
  rowHeight = 100,
  width = 1200,
  margin = [20, 20],
  containerPadding = [15, 15],
  compactType = 'vertical',
  preventCollision = false,
  isDraggable = true,
  isResizable = true,
  resizeHandles = ['se', 'e', 's']
}) => {
  
  console.log('[ReactGridLayout] 渲染', { layout, cols, width, itemsCount: items.length })

  const handleLayoutChange = (newLayout) => {
    console.log('[ReactGridLayout] 布局改变', newLayout)
    if (onLayoutChange) {
      onLayoutChange(newLayout)
    }
  }

  const handleDragStart = (layout, oldItem, newItem) => {
    console.log('[ReactGridLayout] 开始拖拽', { oldItem, newItem })
  }

  const handleDragStop = (layout, oldItem, newItem) => {
    console.log('[ReactGridLayout] 结束拖拽', { oldItem, newItem })
  }

  const handleResizeStart = (layout, oldItem, newItem) => {
    console.log('[ReactGridLayout] 开始调整大小', { oldItem, newItem })
  }

  const handleResizeStop = (layout, oldItem, newItem) => {
    console.log('[ReactGridLayout] 结束调整大小', { oldItem, newItem })
  }

  return (
    <GridLayout
      className="react-grid-layout"
      layout={layout}
      cols={cols}
      rowHeight={rowHeight}
      width={width}
      margin={margin}
      containerPadding={containerPadding}
      compactType={compactType}
      preventCollision={preventCollision}
      isDraggable={isDraggable}
      isResizable={isResizable}
      resizeHandles={resizeHandles}
      onLayoutChange={handleLayoutChange}
      onDragStart={handleDragStart}
      onDragStop={handleDragStop}
      onResizeStart={handleResizeStart}
      onResizeStop={handleResizeStop}
      useCSSTransforms={true}
      draggableCancel=".no-drag"
    >
      {items.map((item, index) => (
        <GridItem
          key={item.id}
          item={item}
          index={index}
          layout={layout[index]}
          renderItem={renderItem}
        />
      ))}
    </GridLayout>
  )
}

export default ReactGridLayoutWrapper

