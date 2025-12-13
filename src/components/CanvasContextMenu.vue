<template>
  <Teleport to="body">
    <div
      v-if="visible"
      class="context-menu"
      :style="{ left: x + 'px', top: y + 'px' }"
      @click.stop
      @mousedown.stop
    >
      <div class="context-menu-item" @click="handleAddWebsite">
        <i class="fa-solid fa-plus"></i>
        <span>添加网站</span>
      </div>
      <div class="context-menu-item" @click="handleAddCustomHtml">
        <i class="fa-solid fa-wand-magic-sparkles"></i>
        <span>AI 生成自定义网页</span>
      </div>
    </div>
  </Teleport>
</template>

<script>
import { Teleport } from 'vue'

export default {
  name: 'CanvasContextMenu',
  components: {
    Teleport
  },
  props: {
    visible: {
      type: Boolean,
      required: true
    },
    x: {
      type: Number,
      default: 0
    },
    y: {
      type: Number,
      default: 0
    }
  },
  emits: ['add-website', 'add-custom-html', 'close'],
  setup(props, { emit }) {
    const handleAddWebsite = () => {
      emit('add-website')
      emit('close')
    }

    const handleAddCustomHtml = () => {
      emit('add-custom-html')
      emit('close')
    }

    return {
      handleAddWebsite,
      handleAddCustomHtml
    }
  }
}
</script>

<style scoped>
.context-menu {
  position: fixed;
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 0.5rem;
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
  padding: 0.25rem;
  z-index: 10000;
  min-width: 200px;
  animation: fadeIn 0.15s ease-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: scale(0.95);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

.context-menu-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.625rem 0.75rem;
  cursor: pointer;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  color: #374151;
  transition: background-color 0.15s;
}

.context-menu-item:hover {
  background: #f3f4f6;
}

.context-menu-item i {
  width: 16px;
  text-align: center;
  color: #6b7280;
}
</style>

