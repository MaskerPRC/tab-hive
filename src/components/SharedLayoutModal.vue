<template>
  <Transition name="modal-fade">
    <div v-if="visible" class="modal-overlay" @click="handleOverlayClick">
      <div class="modal-container" @click.stop>
        <!-- Modal Header -->
        <div class="modal-header">
          <div>
            <h2 class="modal-title">{{ $t('layout.sharedLayouts') || '发现社区灵感' }}</h2>
            <p class="modal-subtitle">{{ $t('layout.sharedLayoutsDesc') || '浏览并导入网友分享的 全视界 布局配置' }}</p>
          </div>
          <button @click="handleClose" class="modal-close-btn">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        <!-- Modal Toolbar -->
        <div class="modal-toolbar">
          <div class="search-wrapper">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="search-icon">
              <circle cx="11" cy="11" r="8"/>
              <path d="m21 21-4.35-4.35"/>
            </svg>
            <input 
              type="text" 
              :placeholder="$t('layout.searchPlaceholder') || '搜索布局名称、标签...'"
              :value="searchQuery"
              @input="handleSearchInput"
              class="search-input"
            />
          </div>
          <select class="sort-select" @change="handleSortChange">
            <option value="hot">{{ $t('layout.sortHot') || '最热下载' }}</option>
            <option value="latest">{{ $t('layout.sortLatest') || '最新发布' }}</option>
          </select>
        </div>

        <!-- Modal Content Grid -->
        <div class="modal-content">
          <div v-if="loading" class="loading-state">
            <div class="loading-spinner"></div>
            <p>{{ $t('layout.loadingShared') || '加载中...' }}</p>
          </div>
          <div v-else-if="sharedLayouts.length === 0" class="empty-state">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="empty-icon">
              <rect x="3" y="3" width="7" height="7"/>
              <rect x="14" y="3" width="7" height="7"/>
              <rect x="14" y="14" width="7" height="7"/>
              <rect x="3" y="14" width="7" height="7"/>
            </svg>
            <p>{{ $t('layout.noSharedLayouts') || '暂无共享布局' }}</p>
          </div>
          <div v-else class="layout-grid">
            <div
              v-for="layout in sharedLayouts"
              :key="layout.id"
              class="layout-card"
              @click="handleImportLayout(layout)"
            >
              <!-- 缩略图占位 -->
              <div class="layout-thumbnail">
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="thumbnail-icon">
                  <rect x="3" y="3" width="7" height="7"/>
                  <rect x="14" y="3" width="7" height="7"/>
                  <rect x="14" y="14" width="7" height="7"/>
                  <rect x="3" y="14" width="7" height="7"/>
                </svg>
                <div class="thumbnail-overlay">
                  <button class="preview-btn">{{ $t('layout.preview') || '预览' }}</button>
                </div>
              </div>
              <!-- 内容 -->
              <div class="layout-card-content">
                <div class="layout-card-header">
                  <h3 class="layout-card-title">{{ layout.layout_name }}</h3>
                  <span class="layout-downloads">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <circle cx="12" cy="12" r="10"/>
                      <path d="M12 6v6l4 2"/>
                    </svg>
                    {{ layout.views || 0 }}
                  </span>
                </div>
                <div class="layout-card-author">
                  <div class="author-avatar"></div>
                  <span class="author-name">{{ layout.author || '匿名用户' }}</span>
                </div>
                <div class="layout-card-footer">
                  <div class="layout-tags">
                    <span v-for="tag in (layout.tags || [])" :key="tag" class="layout-tag">{{ tag }}</span>
                  </div>
                  <button class="import-btn" @click.stop="handleImportLayout(layout)" :title="$t('layout.importLayout') || '导入配置'">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <line x1="12" y1="5" x2="12" y2="19"/>
                      <line x1="5" y1="12" x2="19" y2="12"/>
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script>
import { ref, watch } from 'vue'

export default {
  name: 'SharedLayoutModal',
  props: {
    visible: {
      type: Boolean,
      default: false
    },
    sharedLayouts: {
      type: Array,
      default: () => []
    },
    loading: {
      type: Boolean,
      default: false
    },
    searchQuery: {
      type: String,
      default: ''
    }
  },
  emits: ['close', 'import-layout', 'search', 'sort'],
  setup(props, { emit }) {
    const mouseDownOnOverlay = ref(false)

    const handleClose = () => {
      emit('close')
    }

    const handleOverlayClick = (event) => {
      if (event.target === event.currentTarget && mouseDownOnOverlay.value) {
        handleClose()
      }
      mouseDownOnOverlay.value = false
    }

    const handleOverlayMouseDown = (event) => {
      if (event.target === event.currentTarget) {
        mouseDownOnOverlay.value = true
      } else {
        mouseDownOnOverlay.value = false
      }
    }

    const handleSearchInput = (event) => {
      emit('search', event.target.value)
    }

    const handleSortChange = (event) => {
      emit('sort', event.target.value)
    }

    const handleImportLayout = (layout) => {
      console.log('[SharedLayoutModal] ========== handleImportLayout 被触发 ==========')
      console.log('[SharedLayoutModal] 点击的布局:', layout)
      console.log('[SharedLayoutModal] 布局ID:', layout?.id)
      console.log('[SharedLayoutModal] 布局名称:', layout?.layout_name)
      console.log('[SharedLayoutModal] 准备触发 import-layout 事件')
      emit('import-layout', layout)
      console.log('[SharedLayoutModal] import-layout 事件已触发')
    }

    return {
      handleClose,
      handleOverlayClick,
      handleOverlayMouseDown,
      handleSearchInput,
      handleSortChange,
      handleImportLayout
    }
  }
}
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  inset: 0;
  z-index: 50;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
  background: rgba(15, 23, 42, 0.3);
  backdrop-filter: blur(4px);
}

.modal-container {
  background: white;
  width: 100%;
  max-width: 56rem;
  max-height: 85vh;
  border-radius: 1rem;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  animation: scale-in 0.2s ease-out;
}

@keyframes scale-in {
  from {
    opacity: 0;
    transform: scale(0.95);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

.modal-header {
  padding: 1.25rem;
  border-bottom: 1px solid #f1f5f9;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  background: white;
}

.modal-title {
  font-size: 1.25rem;
  font-weight: 700;
  color: #1e293b;
  margin: 0;
}

.modal-subtitle {
  font-size: 0.875rem;
  color: #64748b;
  margin: 0.25rem 0 0 0;
}

.modal-close-btn {
  padding: 0.5rem;
  background: transparent;
  border: none;
  border-radius: 9999px;
  cursor: pointer;
  color: #94a3b8;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
}

.modal-close-btn:hover {
  background: #f1f5f9;
  color: #64748b;
}

.modal-toolbar {
  padding: 0.75rem 1.25rem;
  background: #f8fafc;
  border-bottom: 1px solid #e2e8f0;
  display: flex;
  gap: 0.75rem;
}

.search-wrapper {
  position: relative;
  flex: 1;
  display: flex;
  align-items: center;
}

.search-icon {
  position: absolute;
  left: 0.75rem;
  color: #94a3b8;
  pointer-events: none;
}

.search-input {
  width: 100%;
  padding: 0.5rem 0.75rem 0.5rem 2.25rem;
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 0.5rem;
  font-size: 0.875rem;
  outline: none;
  transition: all 0.2s;
}

.search-input:focus {
  border-color: #f97316;
  box-shadow: 0 0 0 3px rgba(249, 115, 22, 0.1);
}

.sort-select {
  padding: 0.5rem 0.75rem;
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 0.5rem;
  font-size: 0.875rem;
  color: #475569;
  cursor: pointer;
  outline: none;
}

.modal-content {
  flex: 1;
  overflow-y: auto;
  padding: 1.25rem;
  background: #f8fafc;
}

.loading-state,
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem 1rem;
  color: #94a3b8;
}

.loading-spinner {
  width: 2rem;
  height: 2rem;
  border: 3px solid #e2e8f0;
  border-top-color: #f97316;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 1rem;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.empty-icon {
  margin-bottom: 1rem;
  color: #cbd5e1;
}

.layout-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 1rem;
}

.layout-card {
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 0.75rem;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.2s;
}

.layout-card:hover {
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
  border-color: #f97316;
}

.layout-thumbnail {
  height: 8rem;
  background: #f1f5f9;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.2s;
}

.layout-card:hover .layout-thumbnail {
  background: #fff7ed;
}

.thumbnail-icon {
  color: #cbd5e1;
  transition: color 0.2s;
}

.layout-card:hover .thumbnail-icon {
  color: #f97316;
}

.thumbnail-overlay {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.05);
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.2s;
}

.layout-card:hover .thumbnail-overlay {
  opacity: 1;
}

.preview-btn {
  background: white;
  color: #f97316;
  padding: 0.375rem 1rem;
  border-radius: 9999px;
  font-size: 0.875rem;
  font-weight: 600;
  border: none;
  box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
  transform: translateY(0.5rem);
  transition: transform 0.2s;
}

.layout-card:hover .preview-btn {
  transform: translateY(0);
}

.layout-card-content {
  padding: 1rem;
}

.layout-card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 0.5rem;
}

.layout-card-title {
  font-weight: 600;
  color: #1e293b;
  font-size: 0.875rem;
  margin: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  flex: 1;
}

.layout-downloads {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  font-size: 0.75rem;
  background: #f1f5f9;
  color: #475569;
  padding: 0.125rem 0.5rem;
  border-radius: 0.25rem;
}

.layout-card-author {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.75rem;
}

.author-avatar {
  width: 1.25rem;
  height: 1.25rem;
  border-radius: 9999px;
  background: linear-gradient(to bottom right, #3b82f6, #6366f1);
}

.author-name {
  font-size: 0.75rem;
  color: #64748b;
}

.layout-card-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 0.75rem;
  padding-top: 0.75rem;
  border-top: 1px solid #f1f5f9;
}

.layout-tags {
  display: flex;
  gap: 0.25rem;
  flex-wrap: wrap;
}

.layout-tag {
  font-size: 0.625rem;
  color: #475569;
  background: #f1f5f9;
  padding: 0.125rem 0.375rem;
  border-radius: 0.25rem;
}

.import-btn {
  color: #f97316;
  padding: 0.375rem;
  background: transparent;
  border: none;
  border-radius: 0.5rem;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
}

.import-btn:hover {
  background: #fff7ed;
  color: #ea580c;
}

.modal-fade-enter-active,
.modal-fade-leave-active {
  transition: opacity 0.2s;
}

.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;
}
</style>

