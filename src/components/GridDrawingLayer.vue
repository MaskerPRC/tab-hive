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
        <path
          v-if="item.type === 'path'"
          :d="item.d"
          :stroke="item.color"
          :stroke-width="item.width"
          fill="none"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
        
        <!-- 文字 -->
        <text
          v-else-if="item.type === 'text'"
          :x="item.x"
          :y="item.y"
          :fill="item.color"
          :font-size="item.fontSize"
          font-family="Arial, sans-serif"
          dominant-baseline="hanging"
        >{{ item.content }}</text>
        
        <!-- 图片 -->
        <image
          v-else-if="item.type === 'image'"
          :x="item.x"
          :y="item.y"
          :width="item.width"
          :height="item.height"
          :href="item.data"
          preserveAspectRatio="xMidYMid meet"
        />
      </template>
      
      <!-- 当前正在绘制的路径 -->
      <path
        v-if="currentPath.length > 0"
        :d="getPathData(currentPath)"
        :stroke="drawingColor"
        :stroke-width="drawingWidth"
        fill="none"
        stroke-linecap="round"
        stroke-linejoin="round"
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
    }
  },
  emits: [
    'drawing-mouse-down',
    'drawing-mouse-move',
    'drawing-mouse-up',
    'text-submit',
    'text-cancel',
    'image-file-select',
    'image-cancel'
  ],
  setup(props, { emit }) {
    const textInputElement = ref(null)

    // ========== 绘制事件处理 ==========
    
    const handleDrawingMouseDown = (event) => {
      emit('drawing-mouse-down', event)
    }
    
    const handleDrawingMouseMove = (event) => {
      emit('drawing-mouse-move', event)
    }
    
    const handleDrawingMouseUp = (event) => {
      emit('drawing-mouse-up', event)
    }
    
    // ========== 路径数据生成 ==========
    
    const getPathData = (path) => {
      if (path.length === 0) return ''
      
      // 支持数组格式 [x, y] 和对象格式 {x, y}
      const getCoords = (point) => {
        if (Array.isArray(point)) {
          return { x: point[0], y: point[1] }
        }
        return point
      }
      
      const firstPoint = getCoords(path[0])
      let d = `M ${firstPoint.x} ${firstPoint.y}`
      for (let i = 1; i < path.length; i++) {
        const point = getCoords(path[i])
        d += ` L ${point.x} ${point.y}`
      }
      return d
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
      handleDrawingMouseDown,
      handleDrawingMouseMove,
      handleDrawingMouseUp,
      getPathData,
      handleTextSubmit,
      handleTextCancel,
      handleImageFileSelect,
      handleImageCancel
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

