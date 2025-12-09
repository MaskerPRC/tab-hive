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
        v-for="(layout, index) in layouts"
        :key="layout.id"
        class="layout-item"
        :class="{ 
          'active': layout.id === currentLayoutId,
          'dragging': draggedIndex === index,
          'drag-over': dragOverIndex === index
        }"
        draggable="true"
        @click="$emit('select-layout', layout.id)"
        @contextmenu.prevent="handleContextMenu($event, layout)"
        @dragstart="handleDragStart($event, index)"
        @dragend="handleDragEnd"
        @dragover.prevent="handleDragOver($event, index)"
        @dragenter.prevent="handleDragEnter($event, index)"
        @dragleave="handleDragLeave"
        @drop.prevent="handleDrop($event, index)"
      >
        <div class="layout-item-content">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="layout-icon drag-handle">
            <rect x="3" y="3" width="7" height="7"/>
            <rect x="14" y="3" width="7" height="7"/>
            <rect x="14" y="14" width="7" height="7"/>
            <rect x="3" y="14" width="7" height="7"/>
          </svg>
          <span class="layout-item-name">{{ layout.name }}</span>
          <span v-if="layout.keepAlive" class="keep-alive-badge" title="后台运行中">❄️</span>
        </div>
        <div v-if="layout.id === currentLayoutId" class="layout-indicator"></div>
      </div>
    </div>

    <!-- 右键菜单 - 使用 Teleport 渲染到 body 避免被父容器裁剪 -->
    <Teleport to="body">
      <div
        v-if="contextMenuVisible"
        class="context-menu"
        :style="{ left: contextMenuX + 'px', top: contextMenuY + 'px' }"
        @click.stop
      >
      <div class="context-menu-item" @click="handleRename">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
        </svg>
        <span>{{ $t('layout.renameLayout') }}</span>
      </div>
      <div class="context-menu-divider"></div>
      <div class="context-menu-item" @click="handleToggleKeepAlive">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
        </svg>
        <span>{{ selectedLayout && selectedLayout.keepAlive ? $t('layout.disableKeepAlive') : $t('layout.enableKeepAlive') }}</span>
      </div>
      <div class="context-menu-divider"></div>
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
      <div class="context-menu-divider"></div>
      <div 
        class="context-menu-item context-menu-item-danger" 
        @click="handleDelete"
        :class="{ 'disabled': layouts.length <= 1 }"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="3 6 5 6 21 6"/>
          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
        </svg>
        <span>{{ $t('layout.deleteLayout') }}</span>
      </div>
      </div>
    </Teleport>
  </div>
</template>

<script>
import { ref, onMounted, onUnmounted, inject } from 'vue'
import { useI18n } from 'vue-i18n'

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
  emits: ['create-layout', 'select-layout', 'share-layout', 'export-layout', 'delete-layout', 'toggle-keep-alive', 'rename-layout', 'reorder-layout'],
  setup(props, { emit }) {
    const { t } = useI18n()
    const showPrompt = inject('showPrompt')
    const showConfirm = inject('showConfirm')
    const showAlert = inject('showAlert')
    
    const contextMenuVisible = ref(false)
    const contextMenuX = ref(0)
    const contextMenuY = ref(0)
    const selectedLayout = ref(null)
    
    // 拖拽相关状态
    const draggedIndex = ref(-1)
    const dragOverIndex = ref(-1)

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

    const handleDelete = async () => {
      if (!selectedLayout.value) return
      
      if (props.layouts.length <= 1) {
        if (showAlert) {
          await showAlert({
            title: t('layout.warning') || '提示',
            message: t('layout.atLeastOne')
          })
        } else {
          alert(t('layout.atLeastOne'))
        }
        closeContextMenu()
        return
      }

      const confirmed = await showConfirm(
        t('layout.delete', { name: selectedLayout.value.name })
      )
      
      if (confirmed) {
        emit('delete-layout', selectedLayout.value.id)
      }
      closeContextMenu()
    }

    const handleToggleKeepAlive = () => {
      if (selectedLayout.value) {
        emit('toggle-keep-alive', selectedLayout.value.id)
      }
      closeContextMenu()
    }

    const handleRename = async () => {
      if (!selectedLayout.value) return
      
      const newName = await showPrompt({
        title: t('layout.renameLayout'),
        message: t('layout.rename'),
        placeholder: selectedLayout.value.name,
        defaultValue: selectedLayout.value.name
      })
      
      if (newName && newName.trim() && newName.trim() !== selectedLayout.value.name) {
        emit('rename-layout', selectedLayout.value.id, newName.trim())
      }
      closeContextMenu()
    }

    // 拖拽处理函数
    const handleDragStart = (event, index) => {
      draggedIndex.value = index
      event.dataTransfer.effectAllowed = 'move'
      event.dataTransfer.setData('text/html', index)
      // 添加拖拽时的样式
      event.target.style.opacity = '0.5'
    }

    const handleDragEnd = (event) => {
      event.target.style.opacity = ''
      draggedIndex.value = -1
      dragOverIndex.value = -1
    }

    const handleDragOver = (event, index) => {
      event.preventDefault()
      event.dataTransfer.dropEffect = 'move'
      if (draggedIndex.value !== index) {
        dragOverIndex.value = index
      }
    }

    const handleDragEnter = (event, index) => {
      event.preventDefault()
      if (draggedIndex.value !== index) {
        dragOverIndex.value = index
      }
    }

    const handleDragLeave = (event) => {
      // 只有当离开整个元素时才清除 dragOverIndex
      const rect = event.currentTarget.getBoundingClientRect()
      const x = event.clientX
      const y = event.clientY
      if (x < rect.left || x > rect.right || y < rect.top || y > rect.bottom) {
        dragOverIndex.value = -1
      }
    }

    const handleDrop = (event, dropIndex) => {
      event.preventDefault()
      const dragIndex = draggedIndex.value
      
      if (dragIndex !== -1 && dragIndex !== dropIndex) {
        emit('reorder-layout', dragIndex, dropIndex)
      }
      
      draggedIndex.value = -1
      dragOverIndex.value = -1
      event.target.style.opacity = ''
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
      selectedLayout,
      draggedIndex,
      dragOverIndex,
      handleContextMenu,
      handleShare,
      handleExport,
      handleDelete,
      handleToggleKeepAlive,
      handleRename,
      handleDragStart,
      handleDragEnd,
      handleDragOver,
      handleDragEnter,
      handleDragLeave,
      handleDrop
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
  position: relative;
  user-select: none;
}

.layout-item:hover {
  background: #f1f5f9;
}

.layout-item.dragging {
  opacity: 0.5;
}

.layout-item.drag-over {
  border-color: #f97316;
  background: #fff7ed;
  transform: translateY(-2px);
  box-shadow: 0 2px 8px rgba(249, 115, 22, 0.2);
}

.drag-handle {
  cursor: grab;
}

.layout-item:active .drag-handle {
  cursor: grabbing;
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

.keep-alive-badge {
  font-size: 0.75rem;
  margin-left: 0.25rem;
  flex-shrink: 0;
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
  z-index: 10003;
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

.context-menu-divider {
  height: 1px;
  background: #e2e8f0;
  margin: 4px 0;
}

.context-menu-item-danger {
  color: #dc2626;
}

.context-menu-item-danger:hover {
  background: #fee2e2;
  color: #991b1b;
}

.context-menu-item.disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.context-menu-item.disabled:hover {
  background: transparent;
}
</style>

