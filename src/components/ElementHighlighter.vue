<template>
  <!-- SVG 高亮层 - 用于在选择元素时显示可视化高亮效果 -->
  <svg
    v-if="!disabled"
    class="element-highlighter"
    :style="{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      pointerEvents: 'none',
      zIndex: 10001
    }"
  >
    <!-- 悬停元素高亮 (黄色) -->
    <rect
      v-for="(rect, index) in hoveredElements"
      :key="`hover-${index}`"
      :x="rect.x"
      :y="rect.y"
      :width="rect.width"
      :height="rect.height"
      fill="rgba(251, 191, 36, 0.15)"
      stroke="#fbbf24"
      stroke-width="2"
      rx="2"
    />
    
    <!-- 选中元素高亮 (蓝色) -->
    <rect
      v-for="(rect, index) in selectedElements"
      :key="`select-${index}`"
      :x="rect.x"
      :y="rect.y"
      :width="rect.width"
      :height="rect.height"
      :fill="rect.isActive ? 'rgba(248, 113, 113, 0.15)' : 'rgba(37, 99, 235, 0.15)'"
      :stroke="rect.isActive ? '#f87171' : '#2563EB'"
      stroke-width="2"
      rx="2"
    />
  </svg>
  
  <!-- 覆盖层 - 仅用于改变鼠标样式，不阻止交互 -->
  <div
    v-if="!disabled"
    class="selector-overlay"
    :style="{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      zIndex: 10000,
      cursor: 'crosshair',
      pointerEvents: 'none'
    }"
  ></div>
</template>

<script>
import { ref, watch } from 'vue'

export default {
  name: 'ElementHighlighter',
  props: {
    // 是否禁用高亮
    disabled: {
      type: Boolean,
      default: false
    },
    // 悬停的元素矩形数组
    hoveredElements: {
      type: Array,
      default: () => []
    },
    // 选中的元素矩形数组
    selectedElements: {
      type: Array,
      default: () => []
    }
  },
  setup(props) {
    // 所有高亮逻辑由父组件管理，这里只负责渲染
    return {}
  }
}
</script>

<style scoped>
.element-highlighter {
  pointer-events: none;
}

.selector-overlay {
  background: rgba(0, 0, 0, 0.02);
  pointer-events: none !important;
}
</style>

