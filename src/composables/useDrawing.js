import { ref, watch } from 'vue'
import getStroke from 'perfect-freehand'

/**
 * 绘制功能 composable
 * 处理画布上的自由绘制功能
 */
export function useDrawing(props, emit, canvasTransform) {
  // 绘制状态
  const isDrawingMode = ref(false)
  const drawingTool = ref('pen') // 'pen', 'text', 'image'
  const currentPath = ref([])
  const isDrawing = ref(false)
  const drawingColor = ref('#FF5C00')
  const drawingWidth = ref(3)
  const savedDrawings = ref([])
  
  // 文字输入状态
  const textInput = ref({
    show: false,
    x: 0,
    y: 0,
    content: '',
    fontSize: 24,
    color: '#000000'
  })
  
  // 图片上传状态
  const imageUpload = ref({
    show: false,
    x: 0,
    y: 0
  })

  // 从 props 加载绘制数据
  watch(() => props.drawings, (newDrawings) => {
    savedDrawings.value = newDrawings || []
  }, { immediate: true })

  /**
   * 切换绘制模式
   */
  const toggleDrawingMode = () => {
    console.log('[绘制] 切换绘制模式，当前状态:', isDrawingMode.value)
    isDrawingMode.value = !isDrawingMode.value
    if (!isDrawingMode.value) {
      // 退出绘制模式时，保存当前路径
      if (currentPath.value.length > 1) {
        saveCurrentPath()
      }
      currentPath.value = []
      isDrawing.value = false
      textInput.value.show = false
      imageUpload.value.show = false
    } else {
      console.log('[绘制] 绘制模式已激活')
    }
  }
  
  /**
   * 设置绘制工具
   */
  const setDrawingTool = (tool) => {
    drawingTool.value = tool
    console.log('[绘制] 切换工具:', tool)
  }

  /**
   * 获取画布坐标（相对于 grid-container 本地坐标）
   */
  const getCanvasCoordinates = (event) => {
    const svg = event.target.closest('svg.drawing-layer')
    if (!svg) {
      return null
    }
    
    // 获取 canvas-wrapper 的位置（这是未变换的容器）
    const canvasWrapper = event.target.closest('.canvas-wrapper')
    if (!canvasWrapper) {
      return null
    }
    
    const wrapperRect = canvasWrapper.getBoundingClientRect()
    const transform = canvasTransform.value
    
    // 计算鼠标相对于 canvas-wrapper 的屏幕坐标
    const screenX = event.clientX - wrapperRect.left
    const screenY = event.clientY - wrapperRect.top
    
    // 转换为本地坐标：减去 transform 的偏移，再除以缩放
    // 因为 grid-container 有 transform: translate(x, y) scale(zoom)
    // 所以本地坐标 = (屏幕坐标 - 偏移) / 缩放
    const x = (screenX - (transform?.x || 0)) / (transform?.zoom || 1)
    const y = (screenY - (transform?.y || 0)) / (transform?.zoom || 1)
    
    // 加上 SVG 的位置偏移（SVG 的 left: -10000px, top: -10000px）
    // 这样 SVG 坐标系统的原点在 grid-container 的 (-10000, -10000)
    const svgX = x + 10000
    const svgY = y + 10000
    
    return [svgX, svgY]
  }

  /**
   * 开始绘制
   */
  const handleDrawingMouseDown = (event, fullscreenIndex) => {
    // 只响应左键（button === 0），中键用于拖动画布
    if (event.button !== 0) {
      return
    }
    
    if (!isDrawingMode.value) {
      return
    }
    if (fullscreenIndex !== null) {
      return
    }
    
    // 如果点击的是网站卡片或其他元素，不开始绘制
    if (event.target.closest('.grid-item') || 
        event.target.closest('.drawing-toolbar') ||
        event.target.closest('.canvas-controls') ||
        event.target.closest('.text-input-overlay') ||
        event.target.closest('.image-upload-overlay')) {
      return
    }

    event.preventDefault()
    event.stopPropagation()
    
    const coords = getCanvasCoordinates(event)
    if (!coords) return
    
    // 根据不同工具执行不同操作
    if (drawingTool.value === 'pen') {
      // 画笔模式：开始绘制路径
      isDrawing.value = true
      currentPath.value = [coords]
    } else if (drawingTool.value === 'text') {
      // 文字模式：显示文字输入框
      textInput.value = {
        show: true,
        x: coords[0],
        y: coords[1],
        content: '',
        fontSize: 24,
        color: drawingColor.value
      }
    } else if (drawingTool.value === 'image') {
      // 图片模式：显示上传按钮或等待粘贴
      imageUpload.value = {
        show: true,
        x: coords[0],
        y: coords[1]
      }
    }
  }

  /**
   * 绘制中
   */
  const handleDrawingMouseMove = (event) => {
    if (!isDrawing.value || !isDrawingMode.value || drawingTool.value !== 'pen') return
    
    const coords = getCanvasCoordinates(event)
    if (coords) {
      currentPath.value.push(coords)
      // 限制路径长度，避免性能问题
      if (currentPath.value.length > 1000) {
        currentPath.value.shift()
      }
    }
  }

  /**
   * 停止绘制
   */
  const handleDrawingMouseUp = () => {
    if (!isDrawing.value || drawingTool.value !== 'pen') return
    
    if (currentPath.value.length > 1) {
      saveCurrentPath()
    }
    
    currentPath.value = []
    isDrawing.value = false
  }

  /**
   * 保存当前路径
   */
  const saveCurrentPath = () => {
    if (currentPath.value.length < 2) return

    // 使用 perfect-freehand 生成平滑路径
    const stroke = getStroke(currentPath.value, {
      size: parseInt(drawingWidth.value),
      thinning: 0.5,
      smoothing: 0.5,
      streamline: 0.5
    })
    
    const pathData = getSvgPathFromStroke(stroke)
    
    const newPath = {
      type: 'path',
      d: pathData,
      color: drawingColor.value,
      width: drawingWidth.value
    }
    
    savedDrawings.value.push(newPath)
    
    // 通知父组件更新绘制数据
    emit('update-drawings', [...savedDrawings.value])
  }
  
  /**
   * 保存文字
   */
  const saveText = (textContent) => {
    if (!textContent || !textContent.trim()) return
    
    const newText = {
      type: 'text',
      x: textInput.value.x,
      y: textInput.value.y,
      content: textContent,
      fontSize: textInput.value.fontSize,
      color: textInput.value.color
    }
    
    savedDrawings.value.push(newText)
    emit('update-drawings', [...savedDrawings.value])
    
    // 重置文字输入状态
    textInput.value = {
      show: false,
      x: 0,
      y: 0,
      content: '',
      fontSize: 24,
      color: '#000000'
    }
  }
  
  /**
   * 保存图片
   */
  const saveImage = (imageData, width, height) => {
    const newImage = {
      type: 'image',
      x: imageUpload.value.x,
      y: imageUpload.value.y,
      data: imageData, // base64 图片数据
      width: width || 200,
      height: height || 200
    }
    
    savedDrawings.value.push(newImage)
    emit('update-drawings', [...savedDrawings.value])
    
    // 重置图片上传状态
    imageUpload.value = {
      show: false,
      x: 0,
      y: 0
    }
  }
  
  /**
   * 处理图片粘贴
   */
  const handlePaste = async (event) => {
    if (!isDrawingMode.value || drawingTool.value !== 'image') return
    
    const items = event.clipboardData?.items
    if (!items) return
    
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        const file = items[i].getAsFile()
        if (file) {
          const reader = new FileReader()
          reader.onload = (e) => {
            const img = new Image()
            img.onload = () => {
              // 限制最大宽度/高度
              let width = img.width
              let height = img.height
              const maxSize = 400
              
              if (width > maxSize || height > maxSize) {
                if (width > height) {
                  height = (height / width) * maxSize
                  width = maxSize
                } else {
                  width = (width / height) * maxSize
                  height = maxSize
                }
              }
              
              saveImage(e.target.result, width, height)
            }
            img.src = e.target.result
          }
          reader.readAsDataURL(file)
        }
        event.preventDefault()
        break
      }
    }
  }
  
  /**
   * 处理图片文件上传
   */
  const handleImageUpload = (file) => {
    if (!file || !file.type.startsWith('image/')) return
    
    const reader = new FileReader()
    reader.onload = (e) => {
      const img = new Image()
      img.onload = () => {
        // 限制最大宽度/高度
        let width = img.width
        let height = img.height
        const maxSize = 400
        
        if (width > maxSize || height > maxSize) {
          if (width > height) {
            height = (height / width) * maxSize
            width = maxSize
          } else {
            width = (width / height) * maxSize
            height = maxSize
          }
        }
        
        saveImage(e.target.result, width, height)
      }
      img.src = e.target.result
    }
    reader.readAsDataURL(file)
  }

  /**
   * 获取路径数据（临时绘制）
   */
  const getPathData = (points) => {
    if (points.length < 2) return ''
    
    const stroke = getStroke(points, {
      size: parseInt(drawingWidth.value),
      thinning: 0.5,
      smoothing: 0.5,
      streamline: 0.5
    })
    
    return getSvgPathFromStroke(stroke)
  }

  /**
   * 将 stroke 转换为 SVG path
   */
  const getSvgPathFromStroke = (stroke) => {
    if (!stroke.length) return ''
    
    const d = stroke.reduce(
      (acc, [x0, y0], i, arr) => {
        const [x1, y1] = arr[(i + 1) % arr.length]
        acc.push(x0, y0, (x0 + x1) / 2, (y0 + y1) / 2)
        return acc
      },
      ['M', ...stroke[0], 'Q']
    )
    
    d.push('Z')
    return d.join(' ')
  }

  /**
   * 清除所有绘制
   */
  const clearAllDrawings = () => {
    if (confirm('确定要清除所有绘制内容吗？')) {
      savedDrawings.value = []
      currentPath.value = []
      emit('update-drawings', [])
    }
  }

  /**
   * 设置绘制颜色
   */
  const setDrawingColor = (color) => {
    drawingColor.value = color
  }

  /**
   * 设置绘制宽度
   */
  const setDrawingWidth = (width) => {
    drawingWidth.value = parseInt(width)
  }

  return {
    // 状态
    isDrawingMode,
    drawingTool,
    currentPath,
    isDrawing,
    drawingColor,
    drawingWidth,
    savedDrawings,
    textInput,
    imageUpload,
    // 方法
    toggleDrawingMode,
    setDrawingTool,
    handleDrawingMouseDown,
    handleDrawingMouseMove,
    handleDrawingMouseUp,
    getPathData,
    clearAllDrawings,
    setDrawingColor,
    setDrawingWidth,
    saveText,
    saveImage,
    handlePaste,
    handleImageUpload
  }
}

