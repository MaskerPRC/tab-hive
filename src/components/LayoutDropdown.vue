<template>
  <div class="layout-dropdown" @mouseleave="handleDropdownLeave">
    <button class="layout-btn" @click="toggleDropdown" title="切换布局">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <rect x="3" y="3" width="7" height="7"/>
        <rect x="14" y="3" width="7" height="7"/>
        <rect x="14" y="14" width="7" height="7"/>
        <rect x="3" y="14" width="7" height="7"/>
      </svg>
      <span class="layout-name">{{ currentLayoutName }}</span>
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <polyline points="6 9 12 15 18 9"/>
      </svg>
    </button>

    <div v-if="visible" class="dropdown-menu" @mouseenter="clearHideTimer" @mouseleave="startHideTimer">
      <!-- 标签页切换 -->
      <div class="dropdown-tabs">
        <button
          class="tab-btn"
          :class="{ active: activeTab === 'my' }"
          @click="activeTab = 'my'"
        >
          我的布局
        </button>
        <button
          class="tab-btn"
          :class="{ active: activeTab === 'shared' }"
          @click="handleSwitchToShared"
        >
          共享布局
        </button>
      </div>

      <!-- 我的布局 -->
      <div v-if="activeTab === 'my'" class="tab-content">
        <div class="dropdown-header">
          <span>布局列表</span>
          <button class="btn-new-layout" @click="$emit('create-layout')" title="新建布局">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"/>
              <line x1="12" y1="8" x2="12" y2="16"/>
              <line x1="8" y1="12" x2="16" y2="12"/>
            </svg>
          </button>
        </div>
        <div class="dropdown-list">
          <div
            v-for="layout in layouts"
            :key="layout.id"
            class="dropdown-item"
            :class="{ active: layout.id === currentLayoutId }"
            @click="$emit('select-layout', layout.id)"
          >
            <div v-if="editingLayoutId === layout.id" class="rename-input-wrapper" @click.stop>
              <input
                :value="editingLayoutName"
                @input="$emit('update:editingLayoutName', $event.target.value)"
                type="text"
                class="rename-input"
                @keyup.enter="$emit('confirm-rename')"
                @keyup.esc="$emit('cancel-rename')"
                @blur="$emit('confirm-rename')"
                ref="renameInput"
              />
            </div>
            <template v-else>
              <div class="layout-item-content">
                <span class="layout-item-name">
                  {{ layout.name }}
                  <span v-if="layout.importMode === 'realtime' && !layout.isModified" class="realtime-badge" title="实时同步">🔗</span>
                  <span v-if="layout.isModified" class="modified-badge" title="已修改（同步更新时会覆盖改动）">✏️</span>
                  <span v-if="layout.templateVersion" class="version-text">v{{ layout.templateVersion }}</span>
                </span>
                <span class="layout-info">({{ layout.websites.length }}个网站)</span>
              </div>
              <div class="layout-actions">
                <button
                  class="btn-icon btn-freeze"
                  :class="{ 'btn-freeze-active': layout.keepAlive }"
                  @click="$emit('toggle-keep-alive', layout.id, $event)"
                  :title="layout.keepAlive ? '关闭后台运行（切换布局时卸载）' : '开启后台运行（切换布局时保持运行）'"
                >
                  <span class="freeze-icon">{{ layout.keepAlive ? '❄️' : '💤' }}</span>
                </button>
                <button
                  v-if="layout.importMode === 'realtime'"
                  class="btn-icon btn-sync"
                  :class="{ 'btn-sync-modified': layout.isModified }"
                  @click="$emit('sync-template', layout, $event)"
                  :title="layout.isModified ? '检查并同步更新（将覆盖你的改动）' : '检查并同步更新'"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polyline points="23 4 23 10 17 10"/>
                    <polyline points="1 20 1 14 7 14"/>
                    <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
                  </svg>
                </button>
                <button
                  class="btn-icon btn-share"
                  @click="$emit('share-layout', layout, $event)"
                  title="分享布局"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="18" cy="5" r="3"/>
                    <circle cx="6" cy="12" r="3"/>
                    <circle cx="18" cy="19" r="3"/>
                    <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/>
                    <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
                  </svg>
                </button>
                <button
                  class="btn-icon btn-rename"
                  @click="$emit('start-rename', layout.id, $event)"
                  title="重命名"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                  </svg>
                </button>
                <button
                  v-if="layouts.length > 1"
                  class="btn-icon btn-delete"
                  @click="$emit('delete-layout', layout.id, $event)"
                  title="删除"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polyline points="3 6 5 6 21 6"/>
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                  </svg>
                </button>
              </div>
            </template>
          </div>
        </div>
      </div>

      <!-- 共享布局 -->
      <div v-if="activeTab === 'shared'" class="tab-content">
        <div class="dropdown-header">
          <input
            :value="searchQuery"
            type="text"
            class="search-input"
            placeholder="搜索共享布局..."
            @input="handleSearchInput"
          />
        </div>
        <div class="dropdown-list">
          <div v-if="loadingShared" class="loading-message">
            加载中...
          </div>
          <div v-else-if="sharedLayouts.length === 0" class="empty-message">
            暂无共享布局
          </div>
          <div
            v-else
            v-for="layout in sharedLayouts"
            :key="layout.id"
            class="dropdown-item shared-item"
            @click="$emit('import-layout', layout)"
          >
            <span class="layout-item-name">{{ layout.layout_name }}</span>
            <span class="layout-info">
              ({{ layout.website_count }}个网站)
              <span class="views-count">👁 {{ layout.views }}</span>
              <span class="version-badge">v{{ layout.version }}</span>
            </span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'LayoutDropdown',
  props: {
    visible: {
      type: Boolean,
      default: false
    },
    layouts: {
      type: Array,
      required: true
    },
    currentLayoutId: {
      type: Number,
      required: true
    },
    currentLayoutName: {
      type: String,
      required: true
    },
    editingLayoutId: {
      type: Number,
      default: null
    },
    editingLayoutName: {
      type: String,
      default: ''
    },
    sharedLayouts: {
      type: Array,
      default: () => []
    },
    loadingShared: {
      type: Boolean,
      default: false
    },
    searchQuery: {
      type: String,
      default: ''
    }
  },
  emits: [
    'toggle',
    'select-layout',
    'create-layout',
    'start-rename',
    'confirm-rename',
    'cancel-rename',
    'delete-layout',
    'toggle-keep-alive',
    'share-layout',
    'sync-template',
    'switch-to-shared',
    'search-shared',
    'import-layout',
    'clear-hide-timer',
    'start-hide-timer',
    'update:editingLayoutName',
    'update:searchQuery'
  ],
  data() {
    return {
      activeTab: 'my'
    }
  },
  methods: {
    toggleDropdown() {
      this.$emit('toggle')
    },
    handleSwitchToShared() {
      this.activeTab = 'shared'
      this.$emit('switch-to-shared')
    },
    handleSearchInput(event) {
      const value = event.target.value
      this.$emit('update:searchQuery', value)
      this.$emit('search-shared', value)
    },
    handleDropdownLeave() {
      this.$emit('start-hide-timer')
    },
    clearHideTimer() {
      this.$emit('clear-hide-timer')
    },
    startHideTimer() {
      this.$emit('start-hide-timer')
    }
  }
}
</script>

<style scoped>
.layout-dropdown {
  position: relative;
}

.layout-btn {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 8px;
  background: white;
  border: 2px solid #e0e0e0;
  padding: 12px 14px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  color: #333;
  transition: all 0.3s;
  white-space: nowrap;
}

.layout-btn:hover {
  border-color: var(--primary-color);
  background: var(--primary-light);
  transform: translateX(2px);
}

.layout-btn svg {
  flex-shrink: 0;
}

.layout-name {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  text-align: left;
}

.dropdown-menu {
  position: fixed;
  top: 180px;
  left: 20px;
  width: 240px;
  max-height: calc(100vh - 200px);
  background: white;
  border: 2px solid var(--primary-color);
  border-radius: 12px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
  z-index: 1001;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  animation: slideRight 0.2s ease-out;
}

.dropdown-tabs {
  display: flex;
  background: #f5f5f5;
  border-bottom: 2px solid var(--primary-color);
}

.tab-btn {
  flex: 1;
  padding: 10px 12px;
  background: transparent;
  border: none;
  cursor: pointer;
  font-weight: 600;
  font-size: 13px;
  color: #666;
  transition: all 0.3s;
  border-bottom: 3px solid transparent;
}

.tab-btn:hover {
  background: var(--primary-light);
  color: var(--primary-color);
}

.tab-btn.active {
  background: white;
  color: var(--primary-color);
  border-bottom-color: var(--primary-color);
}

@keyframes slideRight {
  from {
    opacity: 0;
    transform: translateX(-10px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

.dropdown-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 12px;
  background: var(--primary-light);
  border-bottom: 1px solid #e0e0e0;
  font-weight: 600;
  font-size: 13px;
  color: var(--primary-color);
}

.btn-new-layout {
  background: var(--primary-color);
  color: white;
  border: none;
  padding: 6px;
  border-radius: 6px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s;
}

.btn-new-layout:hover {
  background: var(--primary-hover);
  transform: scale(1.1);
}

.tab-content {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0; /* 重要：让 flex 容器可以收缩 */
  overflow: hidden;
}

.dropdown-list {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  min-height: 0; /* 重要：让滚动生效 */
}

.dropdown-list::-webkit-scrollbar {
  width: 8px;
}

.dropdown-list::-webkit-scrollbar-track {
  background: #f0f0f0;
  border-radius: 4px;
  margin: 4px 0;
}

.dropdown-list::-webkit-scrollbar-thumb {
  background: rgba(255, 92, 0, 0.5);
  border-radius: 4px;
  min-height: 30px;
  border: 1px solid transparent;
}

.dropdown-list::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 92, 0, 0.8);
  border: 1px solid rgba(255, 92, 0, 0.3);
}

.dropdown-item {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 10px 12px;
  cursor: pointer;
  transition: all 0.2s;
  border-bottom: 1px solid #f0f0f0;
}

.dropdown-item:last-child {
  border-bottom: none;
}

.dropdown-item:hover {
  background: var(--primary-light);
}

.dropdown-item.active {
  background: var(--primary-color);
  color: white;
}

.dropdown-item.active .layout-info {
  color: rgba(255, 255, 255, 0.8);
}

.layout-item-content {
  display: flex;
  flex-direction: column;
  gap: 4px;
  flex: 1;
  min-width: 0;
  width: 100%;
}

.layout-item-name {
  display: flex;
  align-items: center;
  gap: 4px;
  font-weight: 600;
  font-size: 13px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.layout-info {
  font-size: 11px;
  color: #999;
  flex: 1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.layout-actions {
  display: flex;
  gap: 6px;
  opacity: 0;
  transition: opacity 0.2s;
  justify-content: flex-end;
  width: 100%;
}

.dropdown-item:hover .layout-actions {
  opacity: 1;
}

.dropdown-item.active .layout-actions {
  opacity: 1;
}

.btn-icon {
  background: transparent;
  border: none;
  padding: 4px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  transition: all 0.2s;
}

.btn-icon:hover {
  background: rgba(0, 0, 0, 0.1);
}

.dropdown-item.active .btn-icon:hover {
  background: rgba(255, 255, 255, 0.2);
}

.btn-icon svg {
  stroke: currentColor;
}

.btn-share {
  color: #4caf50;
}

.btn-share:hover {
  background: rgba(76, 175, 80, 0.1) !important;
}

.dropdown-item.active .btn-share:hover {
  background: rgba(255, 255, 255, 0.2) !important;
}

.btn-sync {
  color: #2196f3;
}

.btn-sync:hover {
  background: rgba(33, 150, 243, 0.1) !important;
}

.dropdown-item.active .btn-sync:hover {
  background: rgba(255, 255, 255, 0.2) !important;
}

.btn-sync-modified {
  color: #ff9800;
}

.btn-sync-modified:hover {
  background: rgba(255, 152, 0, 0.1) !important;
}

.dropdown-item.active .btn-sync-modified:hover {
  background: rgba(255, 255, 255, 0.2) !important;
}

.btn-freeze {
  color: #9ca3af;
  font-size: 14px;
}

.btn-freeze:hover {
  background: rgba(156, 163, 175, 0.1) !important;
}

.btn-freeze-active {
  color: #06b6d4;
}

.btn-freeze-active:hover {
  background: rgba(6, 182, 212, 0.1) !important;
}

.dropdown-item.active .btn-freeze:hover {
  background: rgba(255, 255, 255, 0.2) !important;
}

.freeze-icon {
  display: inline-block;
  font-size: 14px;
  line-height: 1;
}

.search-input {
  width: 100%;
  padding: 8px 10px;
  border: 2px solid #e0e0e0;
  border-radius: 6px;
  font-size: 13px;
  outline: none;
  transition: border-color 0.3s;
}

.search-input:focus {
  border-color: var(--primary-color);
}

.loading-message, .empty-message {
  padding: 30px 16px;
  text-align: center;
  color: #999;
  font-size: 14px;
}

.shared-item {
  cursor: pointer;
}

.shared-item:hover {
  background: var(--primary-light);
}

.views-count {
  margin-left: 8px;
  color: #4caf50;
  font-weight: 600;
}

.version-badge {
  display: inline-block;
  padding: 2px 6px;
  background: #4caf50;
  color: white;
  border-radius: 4px;
  font-size: 10px;
  font-weight: 600;
  margin-left: 4px;
}

.rename-input-wrapper {
  flex: 1;
}

.rename-input {
  width: 100%;
  padding: 6px 10px;
  border: 2px solid var(--primary-color);
  border-radius: 6px;
  font-size: 14px;
  font-weight: 600;
  outline: none;
}

.realtime-badge,
.modified-badge {
  font-size: 11px;
  flex-shrink: 0;
}

.version-text {
  font-size: 10px;
  color: #999;
  font-weight: 400;
  flex-shrink: 0;
}

.version-badge {
  font-size: 10px !important;
  padding: 1px 4px !important;
}

.views-count {
  font-size: 10px !important;
}
</style>

