import { onMounted, onUnmounted } from 'vue'

/**
 * 键盘快捷键 composable
 * 处理画布的键盘快捷键
 */
export function useKeyboardShortcuts(options) {
  const {
    fullscreenIndex,
    zoomIn,
    zoomOut,
    resetTransform,
    extractUrlFromText,
    emit,
    canvasTransform
  } = options

  // 跟踪鼠标位置
  let lastMousePosition = { x: 0, y: 0 }
  
  // 监听鼠标移动以跟踪位置
  const handleMouseMove = (event) => {
    lastMousePosition = { x: event.clientX, y: event.clientY }
  }

  /**
   * 将屏幕坐标转换为画布坐标
   */
  const screenToCanvas = (screenX, screenY) => {
    // 获取 canvas-wrapper 元素
    const canvasWrapper = document.querySelector('.canvas-wrapper')
    if (!canvasWrapper) {
      // 如果没有找到画布，返回默认位置
      return { x: 100, y: 100 }
    }

    const wrapperRect = canvasWrapper.getBoundingClientRect()
    const transform = canvasTransform?.value || { x: 0, y: 0, zoom: 1 }
    
    // 计算鼠标相对于 canvas-wrapper 的屏幕坐标
    const relativeX = screenX - wrapperRect.left
    const relativeY = screenY - wrapperRect.top
    
    // 检查鼠标是否在画布区域内
    const isInCanvas = relativeX >= 0 && relativeX <= wrapperRect.width &&
                       relativeY >= 0 && relativeY <= wrapperRect.height
    
    // 如果鼠标不在画布上，使用画布中心位置
    if (!isInCanvas) {
      const centerX = wrapperRect.width / 2
      const centerY = wrapperRect.height / 2
      const canvasX = (centerX - transform.x) / transform.zoom
      const canvasY = (centerY - transform.y) / transform.zoom
      return { x: canvasX, y: canvasY }
    }
    
    // 转换为画布坐标：减去 transform 的偏移，再除以缩放
    const canvasX = (relativeX - transform.x) / transform.zoom
    const canvasY = (relativeY - transform.y) / transform.zoom
    
    return { x: canvasX, y: canvasY }
  }

  /**
   * 键盘快捷键处理函数
   */
  const handleKeyDown = async (event) => {
    // 如果全屏模式，禁用画布缩放快捷键
    if (fullscreenIndex.value !== null) {
      return
    }

    // Ctrl + Plus 放大
    if (event.ctrlKey && (event.key === '+' || event.key === '=')) {
      event.preventDefault()
      zoomIn()
    }
    // Ctrl + Minus 缩小
    if (event.ctrlKey && event.key === '-') {
      event.preventDefault()
      zoomOut()
    }
    // Ctrl + 0 重置
    if (event.ctrlKey && event.key === '0') {
      event.preventDefault()
      resetTransform()
    }

    // Ctrl+V 或 Cmd+V 粘贴链接或布局图片
    // 注意：实际处理在 paste 事件中，这里只记录日志
    if ((event.ctrlKey || event.metaKey) && event.key === 'v') {
      console.log('[useKeyboardShortcuts] Ctrl+V 被按下（keydown事件），等待 paste 事件处理')
      // 不在这里处理，让 paste 事件处理更可靠
    }
  }

  /**
   * 处理粘贴事件（更可靠的方式）
   */
  let clipboardTimeoutId = null
  const handlePaste = async (event) => {
    console.log('[useKeyboardShortcuts] ========== paste 事件被触发 ==========')
    console.log('[useKeyboardShortcuts] 事件目标:', event.target)
    console.log('[useKeyboardShortcuts] 当前焦点元素:', document.activeElement)
    
    // 清除之前的 setTimeout（如果存在）
    if (clipboardTimeoutId !== null) {
      clearTimeout(clipboardTimeoutId)
      clipboardTimeoutId = null
    }
    
    // 检查是否在输入框中（不应该触发粘贴创建网站）
    const activeElement = document.activeElement
    if (activeElement && (
      activeElement.tagName === 'INPUT' ||
      activeElement.tagName === 'TEXTAREA' ||
      activeElement.isContentEditable
    )) {
      console.log('[useKeyboardShortcuts] 在输入框中，跳过处理')
      return // 在输入框中，不处理
    }

    // 检查是否在 iframe 内部
    if (activeElement && activeElement.tagName === 'IFRAME') {
      console.log('[useKeyboardShortcuts] 焦点在 iframe 内，跳过处理')
      return
    }

    console.log('[useKeyboardShortcuts] 开始处理粘贴事件')
    
    // 标记是否已成功处理
    let handled = false
    
    // 首先尝试从 event.clipboardData 读取（更可靠，不需要权限）
    const clipboardData = event.clipboardData
    if (clipboardData) {
      console.log('[useKeyboardShortcuts] 使用 event.clipboardData')
      console.log('[useKeyboardShortcuts] clipboardData.types:', Array.from(clipboardData.types))
      
      // 检查是否有图片文件
      const files = clipboardData.files
      if (files && files.length > 0) {
        console.log('[useKeyboardShortcuts] 检测到文件:', files.length, '个')
        const file = files[0]
        console.log('[useKeyboardShortcuts] 文件信息:', file.name, file.type, file.size)
        
        if (file.type.startsWith('image/')) {
          console.log('[useKeyboardShortcuts] 是图片文件，尝试提取布局数据')
          try {
            const { extractLayoutFromImage } = await import('../utils/layoutImageUtils.js')
            const layoutData = await extractLayoutFromImage(file)
            
            console.log('[useKeyboardShortcuts] 提取的布局数据:', layoutData)
            
            if (layoutData && layoutData.websites && Array.isArray(layoutData.websites)) {
              console.log('[useKeyboardShortcuts] 从粘贴图片检测到布局数据:', layoutData)
              console.log('[useKeyboardShortcuts] 网站数量:', layoutData.websites.length)
              
              // 触发导入布局事件
              if (emit) {
                console.log('[useKeyboardShortcuts] 触发 import-layout-from-image 事件')
                emit('import-layout-from-image', layoutData)
                handled = true
                return // 成功处理，直接返回
              } else {
                console.error('[useKeyboardShortcuts] emit 函数不存在！')
              }
            } else {
              console.log('[useKeyboardShortcuts] 图片中没有找到有效的布局数据')
            }
          } catch (error) {
            console.error('[useKeyboardShortcuts] 处理图片失败:', error)
          }
        }
      }
      
      // 检查是否有文本数据
      const text = clipboardData.getData('text/plain')
      if (text) {
        console.log('[useKeyboardShortcuts] clipboardData 中的文本:', text.substring(0, 100))
        const urlData = extractUrlFromText(text)
        if (urlData) {
          console.log('[useKeyboardShortcuts] 从 clipboardData 检测到 URL:', urlData)
          // 获取鼠标位置并转换为画布坐标
          const canvasPos = screenToCanvas(lastMousePosition.x, lastMousePosition.y)
          console.log('[useKeyboardShortcuts] 鼠标位置（屏幕）:', lastMousePosition)
          console.log('[useKeyboardShortcuts] 鼠标位置（画布）:', canvasPos)
          emit('add-website', { 
            title: urlData.title, 
            url: urlData.url,
            position: canvasPos
          })
          handled = true
          return // 成功处理，直接返回
        }
      }
    }
    
    // 降级方案：使用 navigator.clipboard API（需要权限）
    // 只有在 event.clipboardData 无法处理时才使用
    if (!handled) {
      clipboardTimeoutId = setTimeout(async () => {
        try {
          console.log('[useKeyboardShortcuts] 尝试使用 navigator.clipboard.read()')
          
          // 首先尝试读取图片（优先级更高，因为图片可能包含布局数据）
          const clipboardItems = await navigator.clipboard.read()
          console.log('[useKeyboardShortcuts] 剪贴板项目数量:', clipboardItems.length)
          
          let layoutFound = false

          for (const item of clipboardItems) {
            console.log('[useKeyboardShortcuts] 剪贴板项目类型:', item.types)
            
            // 检查是否有图片类型
            if (item.types.includes('image/png') || item.types.includes('image/jpeg') || item.types.includes('image/webp')) {
              console.log('[useKeyboardShortcuts] 检测到剪贴板中的图片')
              
              let imageBlob = null
              if (item.types.includes('image/png')) {
                imageBlob = await item.getType('image/png')
              } else if (item.types.includes('image/jpeg')) {
                imageBlob = await item.getType('image/jpeg')
              } else if (item.types.includes('image/webp')) {
                imageBlob = await item.getType('image/webp')
              }
              
              if (!imageBlob) {
                console.warn('[useKeyboardShortcuts] 无法获取图片Blob')
                continue
              }
              
              console.log('[useKeyboardShortcuts] 图片Blob大小:', imageBlob.size, 'bytes')
              
              // 尝试从图片中提取布局数据
              const { extractLayoutFromImage } = await import('../utils/layoutImageUtils.js')
              const layoutData = await extractLayoutFromImage(imageBlob)
              
              console.log('[useKeyboardShortcuts] 提取的布局数据:', layoutData)
              
              if (layoutData && layoutData.websites && Array.isArray(layoutData.websites)) {
                console.log('[useKeyboardShortcuts] 从剪贴板图片检测到布局数据:', layoutData)
                console.log('[useKeyboardShortcuts] 网站数量:', layoutData.websites.length)
                layoutFound = true
                
                // 触发导入布局事件
                if (emit) {
                  console.log('[useKeyboardShortcuts] 触发 import-layout-from-image 事件')
                  emit('import-layout-from-image', layoutData)
                } else {
                  console.error('[useKeyboardShortcuts] emit 函数不存在！')
                }
                break
              } else {
                console.log('[useKeyboardShortcuts] 图片中没有找到有效的布局数据')
              }
            }
          }

          // 如果没有找到布局数据，尝试读取文本（URL）
          if (!layoutFound) {
            console.log('[useKeyboardShortcuts] 未找到布局数据，尝试读取文本')
            try {
              const text = await navigator.clipboard.readText()
              if (text) {
                console.log('[useKeyboardShortcuts] 剪贴板文本:', text.substring(0, 100))
                // 尝试提取 URL
                const urlData = extractUrlFromText(text)
                if (urlData) {
                  console.log('[useKeyboardShortcuts] 从剪贴板检测到 URL:', urlData)
                  // 获取鼠标位置并转换为画布坐标
                  const canvasPos = screenToCanvas(lastMousePosition.x, lastMousePosition.y)
                  console.log('[useKeyboardShortcuts] 鼠标位置（屏幕）:', lastMousePosition)
                  console.log('[useKeyboardShortcuts] 鼠标位置（画布）:', canvasPos)
                  // 创建新网站
                  emit('add-website', { 
                    title: urlData.title, 
                    url: urlData.url,
                    position: canvasPos
                  })
                }
              }
            } catch (textError) {
              // 如果无法读取文本，静默失败
              console.warn('[useKeyboardShortcuts] 无法读取剪贴板文本:', textError)
            }
          }
        } catch (error) {
          // 如果无法读取剪贴板（可能是权限问题），静默失败
          console.warn('[useKeyboardShortcuts] navigator.clipboard.read() 失败:', error)
        }
        clipboardTimeoutId = null
      }, 50)
    }
  }

  /**
   * 设置键盘快捷键监听
   */
  const setupKeyboardListeners = () => {
    console.log('[useKeyboardShortcuts] 设置事件监听器')
    window.addEventListener('keydown', handleKeyDown)
    // 只在 document 上监听 paste 事件，使用 capture 模式确保能捕获到所有事件
    // 不需要同时在 window 上监听，避免重复触发
    document.addEventListener('paste', handlePaste, true) // capture 模式
    // 监听鼠标移动以跟踪位置
    document.addEventListener('mousemove', handleMouseMove, { passive: true })
    console.log('[useKeyboardShortcuts] 事件监听器已设置')
  }

  /**
   * 清理键盘快捷键监听
   */
  const cleanupKeyboardListeners = () => {
    console.log('[useKeyboardShortcuts] 清理事件监听器')
    window.removeEventListener('keydown', handleKeyDown)
    document.removeEventListener('paste', handlePaste, true)
    document.removeEventListener('mousemove', handleMouseMove)
    // 清除可能存在的 setTimeout
    if (clipboardTimeoutId !== null) {
      clearTimeout(clipboardTimeoutId)
      clipboardTimeoutId = null
    }
  }

  // 自动设置和清理
  onMounted(() => {
    console.log('[useKeyboardShortcuts] 组件已挂载，设置事件监听器')
    setupKeyboardListeners()
    
    // 添加一个测试：手动触发一次检查
    console.log('[useKeyboardShortcuts] 测试：检查 navigator.clipboard 是否可用')
    if (navigator.clipboard) {
      console.log('[useKeyboardShortcuts] ✓ navigator.clipboard 可用')
    } else {
      console.warn('[useKeyboardShortcuts] ✗ navigator.clipboard 不可用')
    }
  })

  onUnmounted(() => {
    console.log('[useKeyboardShortcuts] 组件已卸载，清理事件监听器')
    cleanupKeyboardListeners()
  })

  return {
    handleKeyDown,
    handlePaste,
    setupKeyboardListeners,
    cleanupKeyboardListeners
  }
}

