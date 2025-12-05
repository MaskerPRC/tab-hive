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
  </div>
</template>

<script>
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
  emits: ['create-layout', 'select-layout']
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
</style>

