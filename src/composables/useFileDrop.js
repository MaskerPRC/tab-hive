/**
 * 文件拖放功能
 * 处理文件（特别是图片）和URL的拖放操作
 */
import { ref } from 'vue'

export function useFileDrop() {
  /**
   * 处理空白区域的拖放悬停
   */
  const handleDragOverOnEmpty = (event, dragOverIndex) => {
    const types = event.dataTransfer.types
    // 支持文件拖拽和URL拖拽
    if (types.includes('Files') || types.includes('text/uri-list') || types.includes('text/plain') || types.includes('text/x-moz-url')) {
      const target = event.target
      if (target.closest('.grid-item')) {
        return
      }
      event.preventDefault()
      dragOverIndex.value = null
    }
  }
  
  /**
   * 处理文件拖拽进入
   */
  const handleDragEnterForFiles = (event) => {
    const types = event.dataTransfer.types
    if (types.includes('Files')) {
      event.preventDefault()
      console.log('[useFileDrop] 文件拖拽进入画布')
    }
  }

  /**
   * 处理空白区域的拖放
   * 支持：1. 图片文件（提取布局数据） 2. URL拖拽
   */
  const handleDropOnEmpty = async (event, emit, handleDropOnEmptyBase) => {
    console.log('[useFileDrop] handleDropOnEmpty 被调用')
    const types = event.dataTransfer.types
    console.log('[useFileDrop] 拖拽类型:', types)
    
    const target = event.target
    if (target.closest('.grid-item')) {
      console.log('[useFileDrop] 拖拽到卡片上，跳过')
      return
    }
    
    // 检查是否是文件拖拽（图片文件）
    if (types.includes('Files')) {
      console.log('[useFileDrop] 检测到文件拖拽')
      const files = event.dataTransfer.files
      if (files.length > 0) {
        const file = files[0]
        console.log('[useFileDrop] 文件:', file.name, file.type, file.size)
        
        // 检查是否是图片文件
        if (file.type.startsWith('image/')) {
          console.log('[useFileDrop] 是图片文件，尝试提取布局数据')
          try {
            const { extractLayoutFromImage } = await import('../utils/layoutImageUtils.js')
            const layoutData = await extractLayoutFromImage(file)
            
            console.log('[useFileDrop] 从拖拽图片提取的布局数据:', layoutData)
            
            if (layoutData && layoutData.websites && Array.isArray(layoutData.websites)) {
              console.log('[useFileDrop] 从拖拽图片检测到布局数据，触发导入事件')
              emit('import-layout-from-image', layoutData)
              return
            } else {
              console.log('[useFileDrop] 图片中没有找到布局数据')
            }
          } catch (error) {
            console.error('[useFileDrop] 处理拖拽图片失败:', error)
          }
        }
      }
    }
    
    // 处理URL拖拽
    if (types.includes('text/uri-list') || types.includes('text/plain') || types.includes('text/x-moz-url')) {
      handleDropOnEmptyBase(event, emit)
    }
  }

  return {
    handleDragOverOnEmpty,
    handleDragEnterForFiles,
    handleDropOnEmpty
  }
}

