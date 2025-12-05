<template>
  <div class="layout-section">
    <div class="layout-list-header">
      <span class="section-label">我的空间</span>
      <button class="btn-new-layout" @click="$emit('create-layout')" title="新建布局">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="12" y1="5" x2="12" y2="19"/>
          <line x1="5" y1="12" x2="19" y2="12"/>
        </svg>
      </button>
    </div>

    <div class="layout-list">
      <div
        v-for="layout in layouts"
        :key="layout.id"
        class="layout-item"
        :class="{ 'active': layout.id === currentLayoutId }"
        @click="$emit('select-layout', layout.id)"
        @contextmenu.prevent="handleContextMenu($event, layout)"
      >
        <div class="layout-item-content">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="layout-icon">
            <rect x="3" y="3" width="7" height="7"/>
            <rect x="14" y="3" width="7" height="7"/>
            <rect x="14" y="14" width="7" height="7"/>
            <rect x="3" y="14" width="7" height="7"/>
          </svg>
          <span class="layout-item-name">{{ layout.name }}</span>
        </div>
        <div v-if="layout.id === currentLayoutId" class="layout-indicator"></div>
      </div>
    </div>

    <!-- 右键菜单 -->
    <div
      v-if="contextMenuVisible"
      class="context-menu"
      :style="{ left: contextMenuX + 'px', top: contextMenuY + 'px' }"
      @click.stop
    >
      <div class="context-menu-item" @click="handleShare">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="18" cy="5" r="3"/>
          <circle cx="6" cy="12" r="3"/>
          <circle cx="18" cy="19" r="3"/>
          <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/>
          <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
        </svg>
        <span>{{ $t('layout.shareLayout') }}</span>
      </div>
      <div class="context-menu-item" @click="handleExport">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
          <polyline points="7 10 12 15 17 10"/>
          <line x1="12" y1="15" x2="12" y2="3"/>
        </svg>
        <span>{{ $t('layout.exportLayout') }}</span>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted, onUnmounted } from 'vue'

export default {
  name: 'LayoutList',
  props: {
    layouts: {
      type: Array,
      required: true
    },
    currentLayoutId: {
      type: Number,
      required: true
    }
  },
  emits: ['create-layout', 'select-layout', 'share-layout', 'export-layout'],
  setup(props, { emit }) {
    const contextMenuVisible = ref(false)
    const contextMenuX = ref(0)
    const contextMenuY = ref(0)
    const selectedLayout = ref(null)

    const handleContextMenu = (event, layout) => {
      event.preventDefault()
      event.stopPropagation()
      selectedLayout.value = layout
      contextMenuX.value = event.clientX
      contextMenuY.value = event.clientY
      contextMenuVisible.value = true
    }

    const closeContextMenu = () => {
      contextMenuVisible.value = false
      selectedLayout.value = null
    }

    const handleShare = () => {
      if (selectedLayout.value) {
        emit('share-layout', selectedLayout.value)
      }
      closeContextMenu()
    }

    const handleExport = () => {
      if (selectedLayout.value) {
        emit('export-layout', selectedLayout.value)
      }
      closeContextMenu()
    }

    const handleClickOutside = (event) => {
      if (contextMenuVisible.value && !event.target.closest('.context-menu')) {
        closeContextMenu()
      }
    }

    onMounted(() => {
      document.addEventListener('click', handleClickOutside)
    })

    onUnmounted(() => {
      document.removeEventListener('click', handleClickOutside)
    })

    return {
      contextMenuVisible,
      contextMenuX,
      contextMenuY,
      handleContextMenu,
      handleShare,
      handleExport
    }
  }
}
</script>

<style scoped>
.layout-section {
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
}

.layout-list-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.75rem;
  padding: 0 0.5rem;
}

.section-label {
  font-size: 0.75rem;
  font-weight: 600;
  color: #94a3b8;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.btn-new-layout {
  padding: 0.25rem;
  background: transparent;
  border: none;
  border-radius: 0.375rem;
  cursor: pointer;
  color: #94a3b8;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
}

.btn-new-layout:hover {
  background: #f1f5f9;
  color: #64748b;
}

.layout-list {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  flex-shrink: 0;
}

.layout-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.625rem 0.75rem;
  border-radius: 0.5rem;
  cursor: pointer;
  transition: all 0.2s;
  border: 1px solid transparent;
  background: transparent;
  color: #475569;
}

.layout-item:hover {
  background: #f1f5f9;
}

.layout-item.active {
  background: #fff7ed;
  border-color: #fed7aa;
  box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
}

.layout-item.active .layout-icon {
  color: #f97316;
}

.layout-item.active .layout-item-name {
  color: #ea580c;
  font-weight: 600;
}

.layout-item-content {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  overflow: hidden;
  flex: 1;
  min-width: 0;
}

.layout-icon {
  flex-shrink: 0;
  color: #94a3b8;
}

.layout-item-name {
  font-size: 0.875rem;
  font-weight: 500;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.layout-indicator {
  width: 0.375rem;
  height: 0.375rem;
  border-radius: 50%;
  background: #f97316;
  flex-shrink: 0;
}

.context-menu {
  position: fixed;
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  z-index: 1000;
  min-width: 160px;
  padding: 4px;
}

.context-menu-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  cursor: pointer;
  border-radius: 4px;
  font-size: 14px;
  color: #475569;
  transition: background-color 0.2s;
}

.context-menu-item:hover {
  background: #f1f5f9;
}

.context-menu-item svg {
  flex-shrink: 0;
  color: #64748b;
}
</style>

