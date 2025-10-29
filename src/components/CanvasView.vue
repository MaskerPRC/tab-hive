<template>
  <div class="canvas-view">
    <!-- VueFlow 画布 -->
    <VueFlow
      v-model="elements"
      :default-viewport="{ zoom: 1, x: 0, y: 0 }"
      :min-zoom="0.2"
      :max-zoom="4"
      :snap-to-grid="false"
      :zoom-on-scroll="true"
      :pan-on-scroll="false"
      :pan-on-drag="[1, 2]"
      @node-drag-stop="onNodeDragStop"
      @pane-click="onPaneClick"
      class="vue-flow-canvas"
    >
      <!-- 背景网格 -->
      <Background
        pattern-color="#aaa"
        :gap="20"
        variant="dots"
      />
      
      <!-- 控制面板 -->
      <Controls />
      
      <!-- 小地图 -->
      <MiniMap />
      
      <!-- 自定义节点：网站卡片 -->
      <template #node-website="{ data }">
        <div class="canvas-website-node">
          <div class="node-header">
            <img v-if="data.icon" :src="data.icon" class="node-icon" />
            <span class="node-title">{{ data.title }}</span>
          </div>
          <div class="node-url">{{ data.url }}</div>
        </div>
      </template>
      
      <!-- 自定义节点：手绘区域 -->
      <template #node-drawing="{ data }">
        <div class="canvas-drawing-node">
          <svg
            :width="data.width || 400"
            :height="data.height || 300"
            class="drawing-svg"
          >
            <path
              v-for="(path, index) in data.paths"
              :key="index"
              :d="path.d"
              :stroke="path.color"
              :stroke-width="path.width"
              fill="none"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>
        </div>
      </template>
    </VueFlow>
    
    <!-- 工具栏 -->
    <div class="canvas-toolbar">
      <button
        @click="addWebsiteNode"
        class="toolbar-btn"
        title="添加网站节点"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
          <line x1="12" y1="8" x2="12" y2="16"/>
          <line x1="8" y1="12" x2="16" y2="12"/>
        </svg>
        <span>添加网站</span>
      </button>
      
      <button
        @click="toggleDrawingMode"
        class="toolbar-btn"
        :class="{ 'active': isDrawingMode }"
        title="手写绘制模式"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M12 19l7-7 3 3-7 7-3-3z"/>
          <path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z"/>
          <path d="M2 2l7.586 7.586"/>
          <circle cx="11" cy="11" r="2"/>
        </svg>
        <span>{{ isDrawingMode ? '退出绘制' : '手写绘制' }}</span>
      </button>
      
      <div v-if="isDrawingMode" class="drawing-controls">
        <label class="color-picker">
          <span>颜色:</span>
          <input type="color" v-model="drawingColor" />
        </label>
        
        <label class="width-slider">
          <span>粗细:</span>
          <input type="range" v-model="drawingWidth" min="1" max="20" />
        </label>
        
        <button @click="clearDrawing" class="toolbar-btn btn-clear">
          清除绘制
        </button>
      </div>
      
      <button
        @click="fitView"
        class="toolbar-btn"
        title="适应视图"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="5 9 2 12 5 15"/>
          <polyline points="9 5 12 2 15 5"/>
          <polyline points="15 19 12 22 9 19"/>
          <polyline points="19 9 22 12 19 15"/>
          <line x1="2" y1="12" x2="22" y2="12"/>
          <line x1="12" y1="2" x2="12" y2="22"/>
        </svg>
        <span>适应视图</span>
      </button>
    </div>
    
    <!-- 绘制画布覆盖层 -->
    <div
      v-if="isDrawingMode"
      class="drawing-overlay"
      @mousedown="startDrawing"
      @mousemove="draw"
      @mouseup="stopDrawing"
      @mouseleave="stopDrawing"
    >
      <svg class="drawing-canvas" :width="canvasWidth" :height="canvasHeight">
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
        
        <!-- 已完成的路径 -->
        <path
          v-for="(path, index) in drawingPaths"
          :key="index"
          :d="path.d"
          :stroke="path.color"
          :stroke-width="path.width"
          fill="none"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
      </svg>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { VueFlow, useVueFlow } from '@vue-flow/core'
import { Background } from '@vue-flow/background'
import { Controls } from '@vue-flow/controls'
import { MiniMap } from '@vue-flow/minimap'
import getStroke from 'perfect-freehand'

export default {
  name: 'CanvasView',
  components: {
    VueFlow,
    Background,
    Controls,
    MiniMap
  },
  props: {
    websites: {
      type: Array,
      default: () => []
    }
  },
  emits: ['add-website', 'update-website'],
  setup(props, { emit }) {
    const elements = ref([])
    const isDrawingMode = ref(false)
    const currentPath = ref([])
    const drawingPaths = ref([])
    const isDrawing = ref(false)
    const drawingColor = ref('#000000')
    const drawingWidth = ref(3)
    const canvasWidth = ref(window.innerWidth)
    const canvasHeight = ref(window.innerHeight)
    
    const { fitView: vueFlowFitView } = useVueFlow()

    // 初始化画布节点
    const initializeCanvas = () => {
      // 将网站转换为节点
      const websiteNodes = props.websites.map((website, index) => ({
        id: `website-${website.id || index}`,
        type: 'website',
        position: website.position || { x: 100 + index * 200, y: 100 },
        data: {
          title: website.title,
          url: website.url,
          icon: `https://www.google.com/s2/favicons?domain=${new URL(website.url).hostname}`
        }
      }))
      
      elements.value = websiteNodes
    }

    // 添加网站节点
    const addWebsiteNode = () => {
      const newNode = {
        id: `website-${Date.now()}`,
        type: 'website',
        position: { x: 100, y: 100 },
        data: {
          title: '新网站',
          url: 'https://www.example.com'
        }
      }
      
      elements.value.push(newNode)
    }

    // 节点拖动结束
    const onNodeDragStop = (event) => {
      console.log('节点拖动结束:', event)
    }

    // 画布点击
    const onPaneClick = (event) => {
      if (!isDrawingMode.value) {
        console.log('画布点击:', event)
      }
    }

    // 切换绘制模式
    const toggleDrawingMode = () => {
      isDrawingMode.value = !isDrawingMode.value
      if (!isDrawingMode.value) {
        // 退出绘制模式时，保存绘制内容
        if (drawingPaths.value.length > 0) {
          saveDrawingAsNode()
        }
      }
    }

    // 开始绘制
    const startDrawing = (event) => {
      if (!isDrawingMode.value) return
      
      isDrawing.value = true
      const rect = event.target.getBoundingClientRect()
      const x = event.clientX - rect.left
      const y = event.clientY - rect.top
      
      currentPath.value = [[x, y]]
    }

    // 绘制
    const draw = (event) => {
      if (!isDrawing.value || !isDrawingMode.value) return
      
      const rect = event.target.getBoundingClientRect()
      const x = event.clientX - rect.left
      const y = event.clientY - rect.top
      
      currentPath.value.push([x, y])
    }

    // 停止绘制
    const stopDrawing = () => {
      if (!isDrawing.value) return
      
      if (currentPath.value.length > 1) {
        // 使用 perfect-freehand 生成平滑路径
        const stroke = getStroke(currentPath.value, {
          size: parseInt(drawingWidth.value),
          thinning: 0.5,
          smoothing: 0.5,
          streamline: 0.5
        })
        
        const pathData = getSvgPathFromStroke(stroke)
        
        drawingPaths.value.push({
          d: pathData,
          color: drawingColor.value,
          width: drawingWidth.value
        })
      }
      
      currentPath.value = []
      isDrawing.value = false
    }

    // 获取路径数据（临时绘制）
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

    // 将 stroke 转换为 SVG path
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

    // 清除绘制
    const clearDrawing = () => {
      drawingPaths.value = []
      currentPath.value = []
    }

    // 保存绘制为节点
    const saveDrawingAsNode = () => {
      if (drawingPaths.value.length === 0) return
      
      const newNode = {
        id: `drawing-${Date.now()}`,
        type: 'drawing',
        position: { x: 100, y: 100 },
        data: {
          paths: [...drawingPaths.value],
          width: 400,
          height: 300
        }
      }
      
      elements.value.push(newNode)
      clearDrawing()
    }

    // 适应视图
    const fitView = () => {
      vueFlowFitView({ padding: 0.2 })
    }

    // 处理窗口大小变化
    const handleResize = () => {
      canvasWidth.value = window.innerWidth
      canvasHeight.value = window.innerHeight
    }

    onMounted(() => {
      initializeCanvas()
      window.addEventListener('resize', handleResize)
    })

    onUnmounted(() => {
      window.removeEventListener('resize', handleResize)
    })

    return {
      elements,
      isDrawingMode,
      currentPath,
      drawingPaths,
      drawingColor,
      drawingWidth,
      canvasWidth,
      canvasHeight,
      addWebsiteNode,
      onNodeDragStop,
      onPaneClick,
      toggleDrawingMode,
      startDrawing,
      draw,
      stopDrawing,
      getPathData,
      clearDrawing,
      fitView
    }
  }
}
</script>

<style scoped>
.canvas-view {
  width: 100%;
  height: 100%;
  position: relative;
  background: #f8f9fa;
}

.vue-flow-canvas {
  width: 100%;
  height: 100%;
}

/* 工具栏 */
.canvas-toolbar {
  position: fixed;
  top: 20px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  z-index: 10;
}

.toolbar-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 6px;
  background: white;
  cursor: pointer;
  font-size: 13px;
  font-weight: 500;
  transition: all 0.2s;
  color: #666;
}

.toolbar-btn:hover {
  background: #f8f9fa;
  border-color: var(--primary-color);
  color: var(--primary-color);
}

.toolbar-btn.active {
  background: var(--primary-color);
  border-color: var(--primary-color);
  color: white;
}

.toolbar-btn svg {
  stroke: currentColor;
}

.btn-clear {
  background: #ff4444;
  color: white;
  border-color: #ff4444;
}

.btn-clear:hover {
  background: #cc0000;
  border-color: #cc0000;
}

/* 绘制控制 */
.drawing-controls {
  display: flex;
  align-items: center;
  gap: 12px;
  padding-left: 12px;
  border-left: 1px solid #ddd;
}

.color-picker,
.width-slider {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: #666;
}

.color-picker input[type="color"] {
  width: 32px;
  height: 32px;
  border: 1px solid #ddd;
  border-radius: 4px;
  cursor: pointer;
}

.width-slider input[type="range"] {
  width: 80px;
}

/* 自定义节点样式 */
.canvas-website-node {
  padding: 12px;
  background: white;
  border: 2px solid #ddd;
  border-radius: 8px;
  min-width: 200px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.node-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 6px;
}

.node-icon {
  width: 20px;
  height: 20px;
}

.node-title {
  font-weight: 600;
  font-size: 14px;
  color: #333;
}

.node-url {
  font-size: 12px;
  color: #888;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.canvas-drawing-node {
  background: white;
  border: 2px solid #ddd;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.drawing-svg {
  display: block;
}

/* 绘制覆盖层 */
.drawing-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 5;
  cursor: crosshair;
}

.drawing-canvas {
  width: 100%;
  height: 100%;
}
</style>

<style>
/* VueFlow 全局样式 */
@import '@vue-flow/core/dist/style.css';
@import '@vue-flow/core/dist/theme-default.css';
@import '@vue-flow/controls/dist/style.css';
@import '@vue-flow/minimap/dist/style.css';
</style>

