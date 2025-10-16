<template>
  <div class="config-panel" @mouseleave="handlePanelMouseLeave">
    <div class="config-header">
      <div class="logo-title">
        <img src="/128x128.png" alt="Tab Hive Logo" class="logo-img" />
        <h2>Tab Hive</h2>
      </div>

      <!-- 布局选择器 -->
      <div class="layout-selector">
        <LayoutDropdown
          :visible="showLayoutDropdown"
          :layouts="layouts"
          :currentLayoutId="currentLayoutId"
          :currentLayoutName="currentLayoutName()"
          :editingLayoutId="operations.editingLayoutId.value"
          :editingLayoutName="operations.editingLayoutName.value"
          :sharedLayouts="sharedLayouts.sharedLayouts.value"
          :loadingShared="sharedLayouts.loadingShared.value"
          :searchQuery="sharedLayouts.searchQuery.value"
          @toggle="toggleLayoutDropdown"
          @select-layout="selectLayout"
          @create-layout="handleCreateLayout"
          @start-rename="handleStartRename"
          @confirm-rename="handleConfirmRename"
          @cancel-rename="operations.cancelRename"
          @delete-layout="handleDeleteLayout"
          @share-layout="handleShareLayout"
          @sync-template="handleSyncTemplate"
          @switch-to-shared="handleSwitchToShared"
          @search-shared="handleSearchShared"
          @import-layout="handleImportLayout"
          @clear-hide-timer="clearHideTimer"
          @start-hide-timer="handleDropdownLeave"
          @update:editingLayoutName="operations.editingLayoutName.value = $event"
          @update:searchQuery="sharedLayouts.searchQuery.value = $event"
        />
      </div>

      <div class="right-actions">
        <a
          href="./help.html"
          target="_blank"
          class="btn-help"
          title="使用帮助"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"/>
            <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/>
            <line x1="12" y1="17" x2="12.01" y2="17"/>
          </svg>
          <span>Help</span>
        </a>
        <button
          class="btn-download"
          @click="$emit('show-download-modal')"
          title="下载桌面客户端或插件"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
            <polyline points="7 10 12 15 17 10"/>
            <line x1="12" y1="15" x2="12" y2="3"/>
          </svg>
          <span>下载插件</span>
        </button>
        <button class="btn-clear" @click="clearConfig" title="清除所有配置">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="3 6 5 6 21 6"/>
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
          </svg>
          清除配置
        </button>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted, onUnmounted, inject } from 'vue'
import LayoutDropdown from './LayoutDropdown.vue'
import { useSharedLayouts } from '../composables/useSharedLayouts'
import { useLayoutOperations } from '../composables/useLayoutOperations'

export default {
  name: 'ConfigPanel',
  components: {
    LayoutDropdown
  },
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
  emits: ['switch-layout', 'create-layout', 'delete-layout', 'rename-layout', 'show-download-modal'],
  setup(props, { emit }) {
    const showLayoutDropdown = ref(false)
    let hideTimer = null

    // 从父组件注入对话框方法
    const showPrompt = inject('showPrompt')
    const showConfirm = inject('showConfirm')
    const checkTemplateUpdate = inject('checkTemplateUpdate')
    const syncTemplateUpdate = inject('syncTemplateUpdate')
    const showImportModeDialog = inject('showImportModeDialog')

    // 检测是否在 Electron 环境中
    const isElectron = typeof window !== 'undefined' &&
      (window.electron !== undefined ||
       (navigator.userAgent && navigator.userAgent.toLowerCase().includes('electron')))

    // 使用 composables
    const sharedLayouts = useSharedLayouts(isElectron)
    const operations = useLayoutOperations(isElectron)

    // 点击外部区域关闭下拉菜单
    const handleClickOutside = (event) => {
      const dropdown = document.querySelector('.layout-dropdown')
      if (dropdown && !dropdown.contains(event.target)) {
        showLayoutDropdown.value = false
        clearHideTimer()
      }
    }

    // 开始隐藏倒计时
    const startHideTimer = () => {
      // 如果正在编辑布局名称，不启动隐藏倒计时
      if (operations.editingLayoutId.value !== null) {
        return
      }
      clearHideTimer()
      hideTimer = setTimeout(() => {
        showLayoutDropdown.value = false
      }, 300) // 300ms 延迟，避免鼠标快速移动时闪烁
    }

    // 清除隐藏倒计时
    const clearHideTimer = () => {
      if (hideTimer) {
        clearTimeout(hideTimer)
        hideTimer = null
      }
    }

    // 处理下拉菜单区域的鼠标离开
    const handleDropdownLeave = () => {
      // 如果正在编辑布局名称，不启动隐藏倒计时
      if (operations.editingLayoutId.value !== null) {
        return
      }
      startHideTimer()
    }

    // 处理顶栏鼠标离开（顶栏隐藏时关闭下拉菜单）
    const handlePanelMouseLeave = () => {
      // 如果正在编辑布局名称，不隐藏面板
      if (operations.editingLayoutId.value !== null) {
        return
      }
      showLayoutDropdown.value = false
      clearHideTimer()
    }

    onMounted(() => {
      document.addEventListener('click', handleClickOutside)
    })

    onUnmounted(() => {
      document.removeEventListener('click', handleClickOutside)
      clearHideTimer()
    })

    const currentLayoutName = () => {
      const layout = props.layouts.find(l => l.id === props.currentLayoutId)
      return layout ? layout.name : '未命名'
    }

    const toggleLayoutDropdown = () => {
      showLayoutDropdown.value = !showLayoutDropdown.value
    }

    const selectLayout = (layoutId) => {
      emit('switch-layout', layoutId)
      showLayoutDropdown.value = false
    }

    const handleCreateLayout = async () => {
      const name = await showPrompt('请输入新布局名称：', '新布局')
      if (name && name.trim()) {
        emit('create-layout', name.trim())
        showLayoutDropdown.value = false
      }
    }

    const handleDeleteLayout = async (layoutId, event) => {
      event.stopPropagation()
      const layout = props.layouts.find(l => l.id === layoutId)
      if (layout && await showConfirm(`确定要删除布局 "${layout.name}" 吗？`)) {
        emit('delete-layout', layoutId)
      }
    }

    const handleStartRename = (layoutId, event) => {
      const layout = props.layouts.find(l => l.id === layoutId)
      if (layout) {
        operations.startRename(layoutId, layout.name, event)
      }
    }

    const handleConfirmRename = () => {
      operations.confirmRename((layoutId, newName) => {
        emit('rename-layout', layoutId, newName)
      })
    }

    const clearConfig = async () => {
      if (await showConfirm('确定要清除所有配置吗？这将删除所有网站和布局设置。')) {
        localStorage.removeItem('iframe-all-config')
        window.location.reload()
      }
    }

    // 切换到共享标签页
    const handleSwitchToShared = () => {
      sharedLayouts.loadSharedLayouts()
    }

    // 搜索共享布局
    const handleSearchShared = (query) => {
      sharedLayouts.searchQuery.value = query
      sharedLayouts.searchSharedLayouts(query)
    }

    // 导入布局
    const handleImportLayout = (layout) => {
      showLayoutDropdown.value = false
      showImportModeDialog(layout)
    }

    // 分享布局
    const handleShareLayout = async (layout, event) => {
      event.stopPropagation()
      await operations.shareLayout(layout, showConfirm)
    }

    // 同步模板更新
    const handleSyncTemplate = async (layout, event) => {
      event.stopPropagation()
      await operations.syncTemplate(layout, checkTemplateUpdate, syncTemplateUpdate, showConfirm)
    }

    return {
      showLayoutDropdown,
      sharedLayouts,
      operations,
      currentLayoutName,
      toggleLayoutDropdown,
      selectLayout,
      handleCreateLayout,
      handleDeleteLayout,
      handleStartRename,
      handleConfirmRename,
      clearConfig,
      handleDropdownLeave,
      clearHideTimer,
      startHideTimer,
      handlePanelMouseLeave,
      handleSwitchToShared,
      handleSearchShared,
      handleImportLayout,
      handleShareLayout,
      handleSyncTemplate
    }
  }
}
</script>

<style scoped>
.config-panel {
  background: white;
  border-bottom: 2px solid var(--primary-color);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.config-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px 25px;
  gap: 30px;
}

.logo-title {
  display: flex;
  align-items: center;
  gap: 12px;
}

.logo-img {
  width: 36px;
  height: 36px;
  object-fit: contain;
}

.config-header h2 {
  color: var(--primary-color);
  font-size: 24px;
  font-weight: 600;
  white-space: nowrap;
  margin: 0;
}

/* 布局选择器 */
.layout-selector {
  position: relative;
}

.right-actions {
  display: flex;
  align-items: center;
  gap: 10px;
}

.btn-help {
  display: flex;
  align-items: center;
  gap: 8px;
  background: transparent;
  color: #666;
  border: 1px solid #ddd;
  padding: 10px 18px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  text-decoration: none;
  transition: all 0.3s;
}

.btn-help:hover {
  background: #fff5f0;
  color: var(--primary-color);
  border-color: var(--primary-color);
}

.btn-help svg {
  stroke: currentColor;
}

.btn-download {
  display: flex;
  align-items: center;
  gap: 8px;
  background: var(--primary-color);
  color: white;
  border: none;
  padding: 10px 18px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  text-decoration: none;
  transition: all 0.3s;
}

.btn-download:hover {
  background: var(--primary-hover);
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(255, 92, 0, 0.3);
}

.btn-download svg {
  stroke: currentColor;
}

.btn-clear {
  display: flex;
  align-items: center;
  gap: 6px;
  background: transparent;
  color: #666;
  border: 1px solid #ddd;
  padding: 8px 16px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 13px;
  transition: all 0.3s;
}

.btn-clear:hover {
  background: #fff5f0;
  color: var(--primary-color);
  border-color: var(--primary-color);
}

.btn-clear svg {
  stroke: currentColor;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .config-panel {
    font-size: 14px;
  }
}
</style>
