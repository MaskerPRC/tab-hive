<template>
  <Teleport to="body">
    <div
      v-if="visible"
      class="automation-context-menu"
      :style="{ left: x + 'px', top: y + 'px' }"
      @click.stop
      @mousedown.stop
    >
      <div class="menu-section">
        <div class="menu-section-title">添加节点</div>
        <div class="context-menu-item" @click="handleAddTrigger">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"/>
            <polyline points="12 6 12 12 16 14"/>
          </svg>
          <span>执行触发器</span>
        </div>
        <div class="context-menu-item" @click="handleAddHttp">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
            <circle cx="12" cy="10" r="3"/>
          </svg>
          <span>HTTP 节点</span>
        </div>
        <div class="context-menu-item" @click="handleAddSet">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
            <line x1="9" y1="9" x2="15" y2="9"/>
            <line x1="9" y1="15" x2="15" y2="15"/>
          </svg>
          <span>Set 数据节点</span>
        </div>
        <div class="context-menu-item" @click="handleAddWebAction">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="2" y="3" width="20" height="14" rx="2" ry="2"/>
            <line x1="8" y1="21" x2="16" y2="21"/>
            <line x1="12" y1="17" x2="12" y2="21"/>
          </svg>
          <span>网页操作节点</span>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script>
import { Teleport } from 'vue'

export default {
  name: 'AutomationContextMenu',
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
  emits: ['add-trigger', 'add-http', 'add-set', 'add-web-action', 'close'],
  setup(props, { emit }) {
    const handleAddTrigger = () => {
      emit('add-trigger')
      emit('close')
    }

    const handleAddHttp = () => {
      emit('add-http')
      emit('close')
    }

    const handleAddSet = () => {
      emit('add-set')
      emit('close')
    }

    const handleAddWebAction = () => {
      emit('add-web-action')
      emit('close')
    }

    return {
      handleAddTrigger,
      handleAddHttp,
      handleAddSet,
      handleAddWebAction
    }
  }
}
</script>

<style scoped>
.automation-context-menu {
  position: fixed;
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 0.5rem;
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
  padding: 0.5rem;
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

.menu-section {
  display: flex;
  flex-direction: column;
}

.menu-section-title {
  padding: 0.5rem 0.75rem;
  font-size: 0.75rem;
  font-weight: 600;
  color: #6b7280;
  text-transform: uppercase;
  letter-spacing: 0.05em;
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

.context-menu-item svg {
  flex-shrink: 0;
  color: #6b7280;
}
</style>

