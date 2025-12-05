<template>
  <Teleport to="body">
    <div v-if="show" class="more-menu" :style="menuStyle" @click.stop>
      <button class="more-menu-item" @click.stop="handleCopy">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
        </svg>
        <span>{{ $t('floatingActions.copy') || '复制' }}</span>
      </button>
      <button v-if="customCodeEnabled" class="more-menu-item" @click.stop="handleScript">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="16 18 22 12 16 6"/>
          <polyline points="8 6 2 12 8 18"/>
        </svg>
        <span>{{ $t('floatingActions.script') || '脚本' }}</span>
      </button>
      <button class="more-menu-item" @click.stop="handleEdit">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
        </svg>
        <span>{{ $t('floatingActions.edit') || '编辑' }}</span>
      </button>
      <div class="more-menu-divider"></div>
      <button class="more-menu-item danger" @click.stop="handleRemove">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="3 6 5 6 21 6"/>
          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
        </svg>
        <span>{{ $t('floatingActions.remove') || '删除' }}</span>
      </button>
    </div>
  </Teleport>
</template>

<script>
export default {
  name: 'WebsiteCardMoreMenu',
  props: {
    show: {
      type: Boolean,
      default: false
    },
    menuStyle: {
      type: Object,
      default: () => ({})
    },
    customCodeEnabled: {
      type: Boolean,
      default: true
    }
  },
  emits: ['copy', 'script', 'edit', 'remove', 'close'],
  setup(props, { emit }) {
    const handleCopy = () => {
      emit('close')
      emit('copy')
    }

    const handleScript = () => {
      emit('close')
      emit('script')
    }

    const handleEdit = () => {
      emit('close')
      emit('edit')
    }

    const handleRemove = () => {
      emit('close')
      emit('remove')
    }

    return {
      handleCopy,
      handleScript,
      handleEdit,
      handleRemove
    }
  }
}
</script>

<style scoped>
.more-menu {
  position: fixed;
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 0.5rem;
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
  min-width: 10rem;
  z-index: 10000;
  padding: 0.25rem;
  pointer-events: auto;
}

.more-menu-item {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0.75rem;
  background: transparent;
  border: none;
  border-radius: 0.375rem;
  color: #475569;
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.2s;
  text-align: left;
}

.more-menu-item:hover {
  background: #f1f5f9;
  color: #1e293b;
}

.more-menu-item.danger {
  color: #dc2626;
}

.more-menu-item.danger:hover {
  background: #fef2f2;
  color: #b91c1c;
}

.more-menu-item svg {
  flex-shrink: 0;
}

.more-menu-divider {
  height: 1px;
  background: #e2e8f0;
  margin: 0.25rem 0;
}
</style>

