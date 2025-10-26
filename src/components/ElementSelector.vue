<template>
  <div
    v-if="isActive"
    class="element-selector-overlay"
    @mousemove="handleMouseMove"
    @click="handleElementClick"
    @keydown.esc="cancel"
  >
    <div class="selector-toolbar">
      <div class="selector-info">
        <span v-if="hoveredSelector">{{ hoveredSelector }}</span>
        <span v-else>移动鼠标到元素上选择，按 ESC 取消</span>
      </div>
      <button class="btn-cancel" @click="cancel">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="18" y1="6" x2="6" y2="18"/>
          <line x1="6" y1="6" x2="18" y2="18"/>
        </svg>
        取消
      </button>
    </div>
    <div
      v-if="highlightedElement"
      class="element-highlight"
      :style="highlightStyle"
    ></div>
  </div>
</template>

<script>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { getCssSelector } from 'css-selector-generator'

export default {
  name: 'ElementSelector',
  props: {
    isActive: {
      type: Boolean,
      default: false
    },
    targetIframe: {
      type: Object,
      default: null
    }
  },
  emits: ['select', 'cancel'],
  setup(props, { emit }) {
    const highlightedElement = ref(null)
    const hoveredSelector = ref('')
    const highlightRect = ref(null)

    const highlightStyle = computed(() => {
      if (!highlightRect.value) return {}
      return {
        top: `${highlightRect.value.top}px`,
        left: `${highlightRect.value.left}px`,
        width: `${highlightRect.value.width}px`,
        height: `${highlightRect.value.height}px`
      }
    })

    /**
     * 生成CSS选择器
     */
    const generateSelector = (element) => {
      try {
        return getCssSelector(element, {
          selectors: ['id', 'class', 'tag', 'attribute'],
          maxCombinations: 100
        })
      } catch (error) {
        console.error('生成选择器失败:', error)
        return null
      }
    }

    /**
     * 处理鼠标移动事件
     */
    const handleMouseMove = (event) => {
      event.preventDefault()
      event.stopPropagation()

      let targetDoc = document
      let offsetX = 0
      let offsetY = 0

      // 如果是在iframe中选择
      if (props.targetIframe && props.targetIframe.contentDocument) {
        try {
          targetDoc = props.targetIframe.contentDocument
          const iframeRect = props.targetIframe.getBoundingClientRect()
          offsetX = iframeRect.left
          offsetY = iframeRect.top
        } catch (error) {
          console.warn('无法访问iframe内容:', error)
          return
        }
      }

      const x = event.clientX - offsetX
      const y = event.clientY - offsetY

      // 获取鼠标位置的元素
      const elements = targetDoc.elementsFromPoint(x, y)
      
      // 过滤掉我们自己的覆盖层和工具栏
      const targetElement = elements.find(el => 
        !el.classList.contains('element-selector-overlay') &&
        !el.classList.contains('selector-toolbar') &&
        !el.classList.contains('element-highlight') &&
        el.tagName !== 'HTML' &&
        el.tagName !== 'BODY'
      )

      if (targetElement && targetElement !== highlightedElement.value) {
        highlightedElement.value = targetElement
        hoveredSelector.value = generateSelector(targetElement)

        // 获取元素位置
        const rect = targetElement.getBoundingClientRect()
        highlightRect.value = {
          top: rect.top + offsetY,
          left: rect.left + offsetX,
          width: rect.width,
          height: rect.height
        }
      }
    }

    /**
     * 处理元素点击事件
     */
    const handleElementClick = (event) => {
      event.preventDefault()
      event.stopPropagation()

      if (highlightedElement.value && hoveredSelector.value) {
        emit('select', {
          element: highlightedElement.value,
          selector: hoveredSelector.value
        })
        reset()
      }
    }

    /**
     * 取消选择
     */
    const cancel = () => {
      emit('cancel')
      reset()
    }

    /**
     * 重置状态
     */
    const reset = () => {
      highlightedElement.value = null
      hoveredSelector.value = ''
      highlightRect.value = null
    }

    /**
     * 处理ESC键
     */
    const handleKeyDown = (event) => {
      if (event.key === 'Escape' && props.isActive) {
        cancel()
      }
    }

    onMounted(() => {
      document.addEventListener('keydown', handleKeyDown)
    })

    onUnmounted(() => {
      document.removeEventListener('keydown', handleKeyDown)
    })

    return {
      highlightedElement,
      hoveredSelector,
      highlightStyle,
      handleMouseMove,
      handleElementClick,
      cancel
    }
  }
}
</script>

<style scoped>
.element-selector-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 10000;
  cursor: crosshair;
  background: rgba(0, 0, 0, 0.1);
}

.selector-toolbar {
  position: fixed;
  top: 20px;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(255, 92, 0, 0.95);
  color: white;
  padding: 12px 20px;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
  backdrop-filter: blur(10px);
  display: flex;
  align-items: center;
  gap: 20px;
  z-index: 10002;
  font-size: 14px;
  animation: slideDown 0.3s ease-out;
}

@keyframes slideDown {
  from {
    transform: translateX(-50%) translateY(-100%);
    opacity: 0;
  }
  to {
    transform: translateX(-50%) translateY(0);
    opacity: 1;
  }
}

.selector-info {
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 13px;
  max-width: 600px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.btn-cancel {
  display: flex;
  align-items: center;
  gap: 6px;
  background: rgba(255, 255, 255, 0.2);
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 13px;
  font-weight: 500;
  transition: all 0.2s;
  white-space: nowrap;
}

.btn-cancel:hover {
  background: rgba(255, 255, 255, 0.3);
}

.btn-cancel svg {
  display: block;
}

.element-highlight {
  position: fixed;
  border: 2px solid #ff5c00;
  background: rgba(255, 92, 0, 0.1);
  pointer-events: none;
  z-index: 10001;
  transition: all 0.1s ease-out;
  box-shadow: 0 0 0 2px rgba(255, 92, 0, 0.3);
}

.element-highlight::before {
  content: '';
  position: absolute;
  top: -2px;
  left: -2px;
  right: -2px;
  bottom: -2px;
  border: 2px dashed rgba(255, 92, 0, 0.5);
  animation: dash 0.5s linear infinite;
}

@keyframes dash {
  to {
    stroke-dashoffset: -20;
  }
}
</style>

