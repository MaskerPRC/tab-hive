<template>
  <div class="config-panel" @mouseleave="handlePanelMouseLeave">
    <!-- 导入模式选择对话框 -->
    <div v-if="showImportDialog" class="import-dialog-overlay" @click.self="closeImportDialog">
      <div class="import-dialog">
        <h3>选择导入模式</h3>
        <p class="dialog-desc">你想如何导入这个布局？</p>
        
        <div class="import-options">
          <div class="import-option" @click="handleImportMode('realtime')">
            <div class="option-icon">🔗</div>
            <div class="option-content">
              <h4>实时同步导入</h4>
              <p>保持与原模板同步，当作者更新模板时自动更新</p>
              <span class="option-note">⚠️ 如果你修改了布局，将自动断开同步链接</span>
            </div>
          </div>
          
          <div class="import-option" @click="handleImportMode('copy')">
            <div class="option-icon">📋</div>
            <div class="option-content">
              <h4>拷贝导入</h4>
              <p>创建一个独立的副本，可以自由修改</p>
              <span class="option-note">💡 不受原模板更新影响</span>
            </div>
          </div>
        </div>
        
        <button class="cancel-btn" @click="closeImportDialog">取消</button>
      </div>
    </div>

    <div class="config-header">
      <div class="logo-title">
        <img src="/128x128.png" alt="Tab Hive Logo" class="logo-img" />
        <h2>Tab Hive</h2>
      </div>

      <!-- 布局选择器 -->
      <div class="layout-selector">
        <div class="layout-dropdown" @mouseleave="handleDropdownLeave">
          <button class="layout-btn" @click="toggleLayoutDropdown" title="切换布局">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="3" y="3" width="7" height="7"/>
              <rect x="14" y="3" width="7" height="7"/>
              <rect x="14" y="14" width="7" height="7"/>
              <rect x="3" y="14" width="7" height="7"/>
            </svg>
            <span class="layout-name">{{ currentLayoutName() }}</span>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="6 9 12 15 18 9"/>
            </svg>
          </button>
          
          <div v-if="showLayoutDropdown" class="dropdown-menu" @mouseenter="clearHideTimer" @mouseleave="startHideTimer">
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
                @click="switchToSharedTab"
              >
                共享布局
              </button>
            </div>

            <!-- 我的布局 -->
            <div v-if="activeTab === 'my'">
              <div class="dropdown-header">
                <span>布局列表</span>
                <button class="btn-new-layout" @click="handleCreateLayout" title="新建布局">
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
                  @click="selectLayout(layout.id)"
                >
                  <div v-if="editingLayoutId === layout.id" class="rename-input-wrapper" @click.stop>
                    <input 
                      v-model="editingLayoutName"
                      type="text"
                      class="rename-input"
                      @keyup.enter="confirmRename"
                      @keyup.esc="cancelRename"
                      @blur="confirmRename"
                      ref="renameInput"
                    />
                  </div>
                  <template v-else>
                    <div class="layout-item-content">
                      <span class="layout-item-name">
                        {{ layout.name }}
                        <span v-if="layout.importMode === 'realtime' && !layout.isModified" class="realtime-badge" title="实时同步">🔗</span>
                        <span v-if="layout.isModified" class="modified-badge" title="已修改，链接已断开">✏️</span>
                        <span v-if="layout.templateVersion" class="version-text">v{{ layout.templateVersion }}</span>
                      </span>
                      <span class="layout-info">({{ layout.websites.length }}个网站)</span>
                    </div>
                    <div class="layout-actions">
                      <button 
                        v-if="layout.importMode === 'realtime' && !layout.isModified"
                        class="btn-icon btn-sync"
                        @click="handleSyncTemplate(layout, $event)"
                        title="检查并同步更新"
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                          <polyline points="23 4 23 10 17 10"/>
                          <polyline points="1 20 1 14 7 14"/>
                          <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
                        </svg>
                      </button>
                      <button 
                        class="btn-icon btn-share"
                        @click="handleShareLayout(layout, $event)"
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
                        @click="startRenameLayout(layout.id, $event)"
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
                        @click="handleDeleteLayout(layout.id, $event)"
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
            <div v-if="activeTab === 'shared'">
              <div class="dropdown-header">
                <input 
                  v-model="searchQuery"
                  type="text"
                  class="search-input"
                  placeholder="搜索共享布局..."
                  @input="searchSharedLayouts"
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
                  @click="showImportModeDialog(layout)"
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
import { ref, onMounted, onUnmounted, nextTick, inject } from 'vue'

export default {
  name: 'ConfigPanel',
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
    const editingLayoutId = ref(null)
    const editingLayoutName = ref('')
    const activeTab = ref('my')
    const searchQuery = ref('')
    const sharedLayouts = ref([])
    const loadingShared = ref(false)
    const showImportDialog = ref(false)
    const selectedLayoutForImport = ref(null)
    let hideTimer = null
    let searchTimeout = null
    
    // 从父组件注入对话框方法
    const showPrompt = inject('showPrompt')
    const showConfirm = inject('showConfirm')
    const checkTemplateUpdate = inject('checkTemplateUpdate')
    const syncTemplateUpdate = inject('syncTemplateUpdate')
    
    // 检测是否在 Electron 环境中
    const isElectron = typeof window !== 'undefined' && 
      (window.electron !== undefined || 
       (navigator.userAgent && navigator.userAgent.toLowerCase().includes('electron')))
    
    // 自动检测API地址：
    // 1. Electron 客户端 -> 使用远程 API 地址 https://tabs.apexstone.ai/api
    // 2. 生产环境 Web 版 -> 使用相对路径（通过代理）
    // 3. 开发环境 -> 使用 localhost
    const API_BASE_URL = isElectron 
      ? 'https://tabs.apexstone.ai/api' 
      : (import.meta.env.PROD ? '/api' : 'http://localhost:3001/api')

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
      if (editingLayoutId.value !== null) {
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
      if (editingLayoutId.value !== null) {
        return
      }
      startHideTimer()
    }

    // 处理顶栏鼠标离开（顶栏隐藏时关闭下拉菜单）
    const handlePanelMouseLeave = () => {
      // 如果正在编辑布局名称，不隐藏面板
      if (editingLayoutId.value !== null) {
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

    const startRenameLayout = (layoutId, event) => {
      event.stopPropagation()
      const layout = props.layouts.find(l => l.id === layoutId)
      if (layout) {
        editingLayoutId.value = layoutId
        editingLayoutName.value = layout.name
        // 下一帧自动聚焦到输入框
        nextTick(() => {
          const input = document.querySelector('.rename-input')
          if (input) {
            input.focus()
            input.select() // 选中全部文本，方便用户直接输入
          }
        })
      }
    }

    const confirmRename = () => {
      if (editingLayoutName.value.trim()) {
        emit('rename-layout', editingLayoutId.value, editingLayoutName.value.trim())
        editingLayoutId.value = null
        editingLayoutName.value = ''
      }
    }

    const cancelRename = () => {
      editingLayoutId.value = null
      editingLayoutName.value = ''
    }

    const clearConfig = async () => {
      if (await showConfirm('确定要清除所有配置吗？这将删除所有网站和布局设置。')) {
        localStorage.removeItem('iframe-all-config')
        window.location.reload()
      }
    }

    // 切换到共享标签页
    const switchToSharedTab = () => {
      activeTab.value = 'shared'
      loadSharedLayouts()
    }

    // 加载共享布局列表
    const loadSharedLayouts = async () => {
      loadingShared.value = true
      try {
        const url = `${API_BASE_URL}/layouts/shared?limit=50`
        const response = await fetch(url)
        const data = await response.json()
        sharedLayouts.value = data.layouts || []
      } catch (error) {
        console.error('加载共享布局失败:', error)
        alert('加载共享布局失败，请确保后端服务正在运行')
      } finally {
        loadingShared.value = false
      }
    }

    // 搜索共享布局（带防抖）
    const searchSharedLayouts = () => {
      if (searchTimeout) {
        clearTimeout(searchTimeout)
      }
      
      searchTimeout = setTimeout(async () => {
        loadingShared.value = true
        try {
          const url = `${API_BASE_URL}/layouts/shared?search=${encodeURIComponent(searchQuery.value)}&limit=50`
          const response = await fetch(url)
          const data = await response.json()
          sharedLayouts.value = data.layouts || []
        } catch (error) {
          console.error('搜索失败:', error)
        } finally {
          loadingShared.value = false
        }
      }, 300)
    }

    // 显示导入模式选择对话框
    const showImportModeDialog = (layout) => {
      selectedLayoutForImport.value = layout
      showImportDialog.value = true
    }

    // 关闭导入对话框
    const closeImportDialog = () => {
      showImportDialog.value = false
      selectedLayoutForImport.value = null
    }

    // 处理导入模式选择
    const handleImportMode = async (mode) => {
      if (!selectedLayoutForImport.value) return
      
      const layout = selectedLayoutForImport.value
      closeImportDialog()
      
      try {
        const response = await fetch(`${API_BASE_URL}/layouts/${layout.id}`)
        const templateData = await response.json()
        
        const suffix = mode === 'realtime' ? ' (实时)' : ' (副本)'
        const newLayoutName = `${templateData.name || '共享布局'}${suffix}`
        
        // 创建新布局并导入数据
        emit('create-layout', newLayoutName, {
          rows: templateData.rows,
          cols: templateData.cols,
          websites: templateData.websites || [],
          linkedTemplateId: mode === 'realtime' ? templateData.original_id : null,
          importMode: mode,
          templateVersion: templateData.version
        })
        
        showLayoutDropdown.value = false
        
        const modeText = mode === 'realtime' ? '实时同步' : '拷贝'
        alert(`布局已${modeText}导入成功！`)
      } catch (error) {
        console.error('加载布局失败:', error)
        alert('加载布局失败')
      }
    }

    // 加载共享布局并应用（保留旧版本兼容）
    const loadSharedLayout = async (layoutId) => {
      try {
        const response = await fetch(`${API_BASE_URL}/layouts/${layoutId}`)
        const layout = await response.json()
        
        // 创建新布局并导入数据
        emit('create-layout', `${layout.name || '共享布局'} (导入)`, {
          rows: layout.rows,
          cols: layout.cols,
          websites: layout.websites || []
        })
        
        showLayoutDropdown.value = false
        alert('布局导入成功！')
      } catch (error) {
        console.error('加载布局失败:', error)
        alert('加载布局失败')
      }
    }

    // 同步模板更新
    const handleSyncTemplate = async (layout, event) => {
      event.stopPropagation()
      
      try {
        const updateInfo = await checkTemplateUpdate(layout.id)
        
        if (!updateInfo.hasUpdate) {
          alert('已是最新版本！')
          return
        }
        
        if (await showConfirm(`发现新版本 v${updateInfo.latestVersion}，是否立即同步更新？`)) {
          const success = await syncTemplateUpdate(layout.id)
          if (success) {
            alert(`已成功更新到 v${updateInfo.latestVersion}`)
          } else {
            alert('更新失败，请稍后重试')
          }
        }
      } catch (error) {
        console.error('检查更新失败:', error)
        alert('检查更新失败')
      }
    }

    // 分享布局
    const handleShareLayout = async (layout, event) => {
      event.stopPropagation()
      
      if (!layout.websites || layout.websites.length === 0) {
        alert('该布局没有网站，无法分享')
        return
      }
      
      if (!await showConfirm(`确定要分享布局 "${layout.name}" 吗？\n\n分享后其他用户将可以查看和使用此布局。\n每个IP每天最多分享10个布局。`)) {
        return
      }
      
      try {
        const response = await fetch(`${API_BASE_URL}/layouts/share`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ layout })
        })
        
        const data = await response.json()
        
        if (response.ok) {
          alert(`分享成功！\n今日还可分享 ${data.remaining} 次`)
        } else {
          alert(data.error || '分享失败')
        }
      } catch (error) {
        console.error('分享失败:', error)
        alert('分享失败，请确保后端服务正在运行')
      }
    }

    return {
      showLayoutDropdown,
      editingLayoutId,
      editingLayoutName,
      activeTab,
      searchQuery,
      sharedLayouts,
      loadingShared,
      showImportDialog,
      selectedLayoutForImport,
      currentLayoutName,
      toggleLayoutDropdown,
      selectLayout,
      handleCreateLayout,
      handleDeleteLayout,
      startRenameLayout,
      confirmRename,
      cancelRename,
      clearConfig,
      handleDropdownLeave,
      clearHideTimer,
      startHideTimer,
      handlePanelMouseLeave,
      switchToSharedTab,
      searchSharedLayouts,
      loadSharedLayout,
      handleShareLayout,
      showImportModeDialog,
      closeImportDialog,
      handleImportMode,
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

.layout-dropdown {
  position: relative;
}

.layout-btn {
  display: flex;
  align-items: center;
  gap: 10px;
  background: white;
  border: 2px solid #e0e0e0;
  padding: 10px 16px;
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
}

.layout-btn svg {
  flex-shrink: 0;
}

.layout-name {
  max-width: 150px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.dropdown-menu {
  position: absolute;
  top: calc(100% + 8px);
  left: 0;
  min-width: 400px;
  background: white;
  border: 2px solid var(--primary-color);
  border-radius: 12px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
  z-index: 1000;
  overflow: hidden;
  animation: slideDown 0.2s ease-out;
}

.dropdown-tabs {
  display: flex;
  background: #f5f5f5;
  border-bottom: 2px solid var(--primary-color);
}

.tab-btn {
  flex: 1;
  padding: 12px 16px;
  background: transparent;
  border: none;
  cursor: pointer;
  font-weight: 600;
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

@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.dropdown-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background: var(--primary-light);
  border-bottom: 1px solid #e0e0e0;
  font-weight: 600;
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

.dropdown-list {
  max-height: 400px;
  overflow-y: auto;
}

.dropdown-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 16px;
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

.layout-item-name {
  font-weight: 600;
  flex-shrink: 0;
}

.layout-info {
  font-size: 12px;
  color: #999;
  flex: 1;
}

.layout-actions {
  display: flex;
  gap: 6px;
  opacity: 0;
  transition: opacity 0.2s;
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

.search-input {
  flex: 1;
  padding: 8px 12px;
  border: 2px solid #e0e0e0;
  border-radius: 6px;
  font-size: 14px;
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

.btn-extension {
  display: flex;
  align-items: center;
  gap: 8px;
  background: #4285f4;
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

.btn-extension:hover {
  background: #3367d6;
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(66, 133, 244, 0.3);
}

.btn-extension svg {
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

/* 导入模式对话框 */
.import-dialog-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10000;
  animation: fadeIn 0.2s ease-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

.import-dialog {
  background: white;
  border-radius: 16px;
  padding: 32px;
  max-width: 600px;
  width: 90%;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  animation: slideUp 0.3s ease-out;
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.import-dialog h3 {
  margin: 0 0 12px 0;
  font-size: 24px;
  color: #333;
  font-weight: 600;
}

.dialog-desc {
  color: #666;
  font-size: 14px;
  margin: 0 0 24px 0;
}

.import-options {
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin-bottom: 24px;
}

.import-option {
  display: flex;
  align-items: flex-start;
  gap: 16px;
  padding: 20px;
  border: 2px solid #e0e0e0;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.3s;
}

.import-option:hover {
  border-color: var(--primary-color);
  background: var(--primary-light);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(255, 92, 0, 0.2);
}

.option-icon {
  font-size: 36px;
  flex-shrink: 0;
}

.option-content {
  flex: 1;
}

.option-content h4 {
  margin: 0 0 8px 0;
  font-size: 18px;
  color: #333;
  font-weight: 600;
}

.option-content p {
  margin: 0 0 8px 0;
  font-size: 14px;
  color: #666;
  line-height: 1.5;
}

.option-note {
  font-size: 12px;
  color: #999;
  font-style: italic;
}

.cancel-btn {
  width: 100%;
  padding: 12px;
  background: transparent;
  color: #999;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.3s;
}

.cancel-btn:hover {
  background: #f5f5f5;
  color: #666;
  border-color: #ccc;
}

/* 布局项内容 */
.layout-item-content {
  display: flex;
  flex-direction: column;
  gap: 4px;
  flex: 1;
  min-width: 0;
}

.layout-item-name {
  display: flex;
  align-items: center;
  gap: 6px;
  font-weight: 600;
}

.realtime-badge,
.modified-badge {
  font-size: 12px;
}

.version-text {
  font-size: 11px;
  color: #999;
  font-weight: 400;
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

/* 同步按钮 */
.btn-sync {
  color: #2196f3;
}

.btn-sync:hover {
  background: rgba(33, 150, 243, 0.1) !important;
}

.dropdown-item.active .btn-sync:hover {
  background: rgba(255, 255, 255, 0.2) !important;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .import-dialog {
    padding: 24px;
    width: 95%;
  }

  .import-dialog h3 {
    font-size: 20px;
  }

  .import-option {
    padding: 16px;
  }

  .option-icon {
    font-size: 28px;
  }

  .option-content h4 {
    font-size: 16px;
  }
}
</style>

