<template>
  <div class="grid-drawing-layer">
    <!-- 绘制层 -->
    <svg
      v-if="isDrawingMode || savedDrawings.length > 0"
      class="drawing-layer"
      :class="{ 'drawing-active': isDrawingMode }"
      xmlns="http://www.w3.org/2000/svg"
      @mousedown="handleDrawingMouseDown"
      @mousemove="handleDrawingMouseMove"
      @mouseup="handleDrawingMouseUp"
      @mouseleave="handleDrawingMouseUp"
    >
      <!-- 已保存的绘制内容 -->
      <template v-for="(item, index) in savedDrawings" :key="`saved-${index}`">
        <!-- 路径 -->
        <g v-if="item.type === 'path'" 
           :class="{ 'draggable-item': true, 'selected': selectedItemIndex === index }"
           @mousedown.stop="startDraggingItem($event, index)"
           style="cursor: move;">
          <!-- 可见的路径（使用 fill 而不是 stroke，因为 perfect-freehand 生成的是轮廓） -->
          <path
            :d="item.d"
            :fill="item.color"
            stroke="none"
            style="pointer-events: auto;"
          />
        </g>
        
        <!-- 文字 -->
        <g v-else-if="item.type === 'text'"
           :class="{ 'draggable-item': true, 'selected': selectedItemIndex === index }"
           @mousedown.stop="startDraggingItem($event, index)"
           style="cursor: move;">
          <!-- 背景框用于点击 -->
          <rect
            :x="item.x - 5"
            :y="item.y - 5"
            :width="getTextWidth(item.content, item.fontSize) + 10"
            :height="item.fontSize + 10"
            fill="transparent"
            :stroke="selectedItemIndex === index ? '#2196F3' : 'transparent'"
            :stroke-width="selectedItemIndex === index ? 2 : 0"
            stroke-dasharray="4"
          />
          <text
            :x="item.x"
            :y="item.y"
            :fill="item.color"
            :font-size="item.fontSize"
            font-family="Arial, sans-serif"
            dominant-baseline="hanging"
            style="pointer-events: none;"
          >{{ item.content }}</text>
        </g>
        
        <!-- 图片 -->
        <g v-else-if="item.type === 'image'"
           :class="{ 'draggable-item': true, 'selected': selectedItemIndex === index }"
           @mousedown.stop="startDraggingItem($event, index)"
           style="cursor: move;">
          <!-- 透明的背景框用于接收鼠标事件 -->
          <rect
            :x="item.x"
            :y="item.y"
            :width="item.width"
            :height="item.height"
            fill="transparent"
            stroke="transparent"
          />
          <!-- 选中时的边框 -->
          <rect
            v-if="selectedItemIndex === index"
            :x="item.x - 2"
            :y="item.y - 2"
            :width="item.width + 4"
            :height="item.height + 4"
            fill="none"
            stroke="#2196F3"
            stroke-width="2"
            stroke-dasharray="4"
            style="pointer-events: none;"
          />
          <!-- 图片本身 -->
          <image
            :x="item.x"
            :y="item.y"
            :width="item.width"
            :height="item.height"
            :href="item.data"
            preserveAspectRatio="xMidYMid meet"
            style="pointer-events: none;"
          />
        </g>
      </template>
      
      <!-- 当前正在绘制的路径 -->
      <path
        v-if="currentPath.length > 0"
        :d="getPathData(currentPath)"
        :fill="drawingColor"
        stroke="none"
      />
      
      <!-- 文字输入覆盖层（作为 SVG foreignObject） -->
      <foreignObject
        v-if="textInput.show"
        :x="textInput.x - 150"
        :y="textInput.y - 75"
        width="300"
        height="150"
      >
        <div xmlns="http://www.w3.org/1999/xhtml" class="text-input-overlay">
          <textarea
            ref="textInputElement"
            v-model="textInput.content"
            class="text-input-field"
            :style="{ color: textInput.color, fontSize: textInput.fontSize + 'px' }"
            placeholder="输入文字..."
            @keydown.enter.ctrl="handleTextSubmit"
            @keydown.esc="handleTextCancel"
            autofocus
          ></textarea>
          <div class="text-input-buttons">
            <button @click="handleTextSubmit" class="text-input-btn text-input-btn-ok">确定</button>
            <button @click="handleTextCancel" class="text-input-btn text-input-btn-cancel">取消</button>
          </div>
        </div>
      </foreignObject>
      
      <!-- 图片上传覆盖层（作为 SVG foreignObject） -->
      <foreignObject
        v-if="imageUpload.show"
        :x="imageUpload.x - 125"
        :y="imageUpload.y - 100"
        width="250"
        height="200"
      >
        <div xmlns="http://www.w3.org/1999/xhtml" class="image-upload-overlay">
          <div class="image-upload-box">
            <p>粘贴图片 (Ctrl+V)</p>
            <p>或</p>
            <label class="image-upload-btn">
              <input
                type="file"
                accept="image/*"
                @change="handleImageFileSelect"
                style="display: none;"
              />
              选择图片
            </label>
            <button @click="handleImageCancel" class="image-upload-btn-cancel">取消</button>
          </div>
        </div>
      </foreignObject>
    </svg>
  </div>
</template>

<script>
import { ref } from 'vue'
import getStroke from 'perfect-freehand'

/**
 * GridDrawingLayer - 绘制层组件
 * 负责管理画布上的绘制功能，包括：
 * - SVG 绘制路径
 * - 文字输入
 * - 图片上传
 */
export default {
  name: 'GridDrawingLayer',
  props: {
    isDrawingMode: {
      type: Boolean,
      default: false
    },
    savedDrawings: {
      type: Array,
      default: () => []
    },
    currentPath: {
      type: Array,
      default: () => []
    },
    drawingColor: {
      type: String,
      default: '#f97316'
    },
    drawingWidth: {
      type: Number,
      default: 3
    },
    textInput: {
      type: Object,
      default: () => ({
        show: false,
        x: 0,
        y: 0,
        content: '',
        color: '#000000',
        fontSize: 24
      })
    },
    imageUpload: {
      type: Object,
      default: () => ({
        show: false,
        x: 0,
        y: 0
      })
    },
    canvasTransform: {
      type: Object,
      default: () => ({ x: 0, y: 0, zoom: 1 })
    }
  },
  emits: [
    'drawing-mouse-down',
    'drawing-mouse-move',
    'drawing-mouse-up',
    'text-submit',
    'text-cancel',
    'image-file-select',
    'image-cancel',
    'update-drawing-item'
  ],
  setup(props, { emit }) {
    const textInputElement = ref(null)
    
    // ========== 拖动状态管理 ==========
    
    const selectedItemIndex = ref(null)
    const draggingItemIndex = ref(null)
    const dragStartPos = ref({ x: 0, y: 0 })
    const dragItemStartPos = ref({ x: 0, y: 0 })
    const dragAnimationFrame = ref(null)
    
    // ========== 绘制事件处理 ==========
    
    const handleDrawingMouseDown = (event) => {
      // 如果正在拖动项，不触发绘制事件
      if (draggingItemIndex.value !== null) {
        return
      }
      emit('drawing-mouse-down', event)
    }
    
    const handleDrawingMouseMove = (event) => {
      // 如果正在拖动项，处理拖动
      if (draggingItemIndex.value !== null) {
        handleItemDrag(event)
        return
      }
      emit('drawing-mouse-move', event)
    }
    
    const handleDrawingMouseUp = (event) => {
      // 如果正在拖动项，停止拖动
      if (draggingItemIndex.value !== null) {
        stopDraggingItem()
        return
      }
      emit('drawing-mouse-up', event)
    }
    
    // ========== 拖动功能实现 ==========
    
    /**
     * 获取 SVG 坐标（与 useDrawing.js 中的 getCanvasCoordinates 保持一致）
     */
    const getSVGCoordinates = (event) => {
      // 找到 canvas-wrapper 容器
      const canvasWrapper = event.target.closest('.canvas-wrapper')
      if (!canvasWrapper) {
        console.error('[拖动] 无法找到 canvas-wrapper')
        return { x: 0, y: 0 }
      }
      
      const wrapperRect = canvasWrapper.getBoundingClientRect()
      const transform = props.canvasTransform || { x: 0, y: 0, zoom: 1 }
      
      // 计算鼠标相对于 canvas-wrapper 的屏幕坐标
      const screenX = event.clientX - wrapperRect.left
      const screenY = event.clientY - wrapperRect.top
      
      // 转换为本地坐标：减去 transform 的偏移，再除以缩放
      const x = (screenX - (transform.x || 0)) / (transform.zoom || 1)
      const y = (screenY - (transform.y || 0)) / (transform.zoom || 1)
      
      // 加上 SVG 的位置偏移（SVG 的 left: -10000px, top: -10000px）
      const svgX = x + 10000
      const svgY = y + 10000
      
      return { x: svgX, y: svgY }
    }
    
    /**
     * 开始拖动项
     */
    const startDraggingItem = (event, index) => {
      if (!props.isDrawingMode) {
        // 只有在绘制模式下才能拖动
        return
      }
      
      event.preventDefault()
      event.stopPropagation()
      
      selectedItemIndex.value = index
      draggingItemIndex.value = index
      
      const coords = getSVGCoordinates(event)
      dragStartPos.value = { x: coords.x, y: coords.y }
      
      const item = props.savedDrawings[index]
      if (item.type === 'path') {
        // 路径类型：记录路径数据的初始状态
        dragItemStartPos.value = { d: item.d }
      } else {
        // 文字和图片：记录位置
        dragItemStartPos.value = { x: item.x, y: item.y }
      }
    }
    
    /**
     * 拖动项（使用 requestAnimationFrame 优化性能）
     */
    const handleItemDrag = (event) => {
      if (draggingItemIndex.value === null) return
      
      // 取消之前的动画帧
      if (dragAnimationFrame.value) {
        cancelAnimationFrame(dragAnimationFrame.value)
      }
      
      // 使用 requestAnimationFrame 节流更新
      dragAnimationFrame.value = requestAnimationFrame(() => {
        const coords = getSVGCoordinates(event)
        const dx = coords.x - dragStartPos.value.x
        const dy = coords.y - dragStartPos.value.y
        
        const index = draggingItemIndex.value
        const item = props.savedDrawings[index]
        
        if (item.type === 'path') {
          // 路径类型：移动整个路径
          const newD = offsetPath(dragItemStartPos.value.d, dx, dy)
          emit('update-drawing-item', { index, updates: { d: newD } })
        } else {
          // 文字和图片：更新位置
          const newX = dragItemStartPos.value.x + dx
          const newY = dragItemStartPos.value.y + dy
          emit('update-drawing-item', { index, updates: { x: newX, y: newY } })
        }
      })
    }
    
    /**
     * 停止拖动项
     */
    const stopDraggingItem = () => {
      if (draggingItemIndex.value !== null) {
        // 取消任何待处理的动画帧
        if (dragAnimationFrame.value) {
          cancelAnimationFrame(dragAnimationFrame.value)
          dragAnimationFrame.value = null
        }
      }
      draggingItemIndex.value = null
      dragStartPos.value = { x: 0, y: 0 }
      dragItemStartPos.value = { x: 0, y: 0 }
    }
    
    /**
     * 偏移 SVG 路径（支持 M、L、Q 命令）
     */
    const offsetPath = (pathData, dx, dy) => {
      // 匹配所有数字并偏移
      // perfect-freehand 生成的路径格式: M x0 y0 Q x1 y1 x2 y2 x3 y3 ... Z
      return pathData.replace(/([\d.]+)\s+([\d.]+)/g, (match, x, y) => {
        const newX = parseFloat(x) + dx
        const newY = parseFloat(y) + dy
        return `${newX} ${newY}`
      })
    }
    
    /**
     * 估算文字宽度
     */
    const getTextWidth = (text, fontSize) => {
      // 简单估算：每个字符约为 fontSize * 0.6 宽度
      return text.length * fontSize * 0.6
    }
    
    // ========== 路径数据生成 ==========
    
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
     * 获取路径数据（与 useDrawing.js 保持一致，使用 perfect-freehand）
     */
    const getPathData = (path) => {
      if (path.length < 2) return ''
      
      // 使用 perfect-freehand 生成平滑路径
      const stroke = getStroke(path, {
        size: parseInt(props.drawingWidth),
        thinning: 0.5,
        smoothing: 0.5,
        streamline: 0.5
      })
      
      return getSvgPathFromStroke(stroke)
    }
    
    // ========== 文字输入处理 ==========
    
    const handleTextSubmit = () => {
      emit('text-submit')
    }
    
    const handleTextCancel = () => {
      emit('text-cancel')
    }
    
    // ========== 图片上传处理 ==========
    
    const handleImageFileSelect = (event) => {
      emit('image-file-select', event)
    }
    
    const handleImageCancel = () => {
      emit('image-cancel')
    }

    return {
      textInputElement,
      selectedItemIndex,
      handleDrawingMouseDown,
      handleDrawingMouseMove,
      handleDrawingMouseUp,
      getPathData,
      handleTextSubmit,
      handleTextCancel,
      handleImageFileSelect,
      handleImageCancel,
      startDraggingItem,
      getTextWidth
    }
  }
}
</script>

<style scoped>
.grid-drawing-layer {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 100;
}

.drawing-layer {
  position: absolute;
  top: -10000px;
  left: -10000px;
  width: 20000px;
  height: 20000px;
  pointer-events: none;
  z-index: 100;
  overflow: visible;
}

.drawing-layer path {
  pointer-events: none;
}

.drawing-layer.drawing-active {
  pointer-events: auto;
  cursor: crosshair;
  z-index: 100;
}

.draggable-item {
  cursor: move;
}

.draggable-item:hover {
  opacity: 0.9;
}

.draggable-item.selected {
  opacity: 1;
}

/* 文字输入覆盖层 */
.text-input-overlay {
  width: 100%;
  height: 100%;
  background: white;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  padding: 12px;
  box-sizing: border-box;
  pointer-events: auto;
}

.text-input-field {
  width: 100%;
  min-height: 80px;
  padding: 8px;
  border: 1px solid #e2e8f0;
  border-radius: 4px;
  font-family: Arial, sans-serif;
  resize: vertical;
  outline: none;
  margin-bottom: 8px;
}

.text-input-field:focus {
  border-color: #f97316;
  box-shadow: 0 0 0 3px rgba(249, 115, 22, 0.1);
}

.text-input-buttons {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
}

.text-input-btn {
  padding: 6px 16px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.2s;
}

.text-input-btn-ok {
  background: #f97316;
  color: white;
}

.text-input-btn-ok:hover {
  background: #ea580c;
}

.text-input-btn-cancel {
  background: #e2e8f0;
  color: #475569;
}

.text-input-btn-cancel:hover {
  background: #cbd5e1;
}

/* 图片上传覆盖层 */
.image-upload-overlay {
  width: 100%;
  height: 100%;
  background: white;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  padding: 16px;
  box-sizing: border-box;
  pointer-events: auto;
}

.image-upload-box {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  min-width: 200px;
}

.image-upload-box p {
  margin: 0;
  color: #64748b;
  font-size: 14px;
}

.image-upload-btn {
  padding: 8px 20px;
  background: #f97316;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.2s;
}

.image-upload-btn:hover {
  background: #ea580c;
}

.image-upload-btn-cancel {
  padding: 6px 16px;
  background: #e2e8f0;
  color: #475569;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.2s;
}

.image-upload-btn-cancel:hover {
  background: #cbd5e1;
}
</style>

