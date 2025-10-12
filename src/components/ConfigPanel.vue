<template>
  <div class="config-panel" @mouseleave="handlePanelMouseLeave">
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
                  <span class="layout-item-name">{{ layout.name }}</span>
                  <span class="layout-info">({{ layout.rows }}×{{ layout.cols }}, {{ layout.websites.length }}个网站)</span>
                  <div class="layout-actions">
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
        </div>
      </div>
      
      <div class="grid-config">
        <!-- 横向配置 - 单选按钮 -->
        <div class="config-section">
          <label class="config-label">横向：</label>
          <div class="radio-group">
            <label 
              v-for="n in [2, 3, 4]" 
              :key="'col-' + n"
              class="radio-option"
              :class="{ active: cols === n }"
            >
              <input 
                type="radio" 
                :value="n" 
                :checked="cols === n"
                @change="$emit('update:cols', n)"
              />
              <span>{{ n }}</span>
            </label>
          </div>
        </div>

        <!-- 竖向配置 - 切换按钮 -->
        <div class="config-section">
          <label class="config-label">竖向：</label>
          <div class="stepper">
            <button 
              class="stepper-btn"
              @click="decreaseRows"
              :disabled="rows <= 2"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="5" y1="12" x2="19" y2="12"/>
              </svg>
            </button>
            <div class="stepper-value">{{ rows }}</div>
            <button 
              class="stepper-btn"
              @click="increaseRows"
              :disabled="rows >= 10"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="12" y1="5" x2="12" y2="19"/>
                <line x1="5" y1="12" x2="19" y2="12"/>
              </svg>
            </button>
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
        <a 
          href="https://github.com/MaskerPRC/tab-hive/releases" 
          target="_blank"
          class="btn-download"
          title="下载桌面客户端"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
            <polyline points="7 10 12 15 17 10"/>
            <line x1="12" y1="15" x2="12" y2="3"/>
          </svg>
          <span>下载客户端</span>
        </a>
        <a 
          href="https://chromewebstore.google.com/detail/allow-x-frame-options/jfjdfokifdlmbkbncmcfbcobggohdnif" 
          target="_blank"
          class="btn-extension"
          title="下载Chrome扩展"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="3" y="3" width="7" height="7"/>
            <rect x="14" y="3" width="7" height="7"/>
            <rect x="14" y="14" width="7" height="7"/>
            <rect x="3" y="14" width="7" height="7"/>
          </svg>
          <span>Chrome扩展</span>
        </a>
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
import { ref, onMounted, onUnmounted } from 'vue'

export default {
  name: 'ConfigPanel',
  props: {
    rows: {
      type: Number,
      required: true
    },
    cols: {
      type: Number,
      required: true
    },
    layouts: {
      type: Array,
      required: true
    },
    currentLayoutId: {
      type: Number,
      required: true
    }
  },
  emits: ['update:rows', 'update:cols', 'switch-layout', 'create-layout', 'delete-layout', 'rename-layout'],
  setup(props, { emit }) {
    const showLayoutDropdown = ref(false)
    const editingLayoutId = ref(null)
    const editingLayoutName = ref('')
    let hideTimer = null

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
      startHideTimer()
    }

    // 处理顶栏鼠标离开（顶栏隐藏时关闭下拉菜单）
    const handlePanelMouseLeave = () => {
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

    const handleCreateLayout = () => {
      const name = prompt('请输入新布局名称：')
      if (name && name.trim()) {
        emit('create-layout', name.trim())
        showLayoutDropdown.value = false
      }
    }

    const handleDeleteLayout = (layoutId, event) => {
      event.stopPropagation()
      const layout = props.layouts.find(l => l.id === layoutId)
      if (layout && confirm(`确定要删除布局 "${layout.name}" 吗？`)) {
        emit('delete-layout', layoutId)
      }
    }

    const startRenameLayout = (layoutId, event) => {
      event.stopPropagation()
      const layout = props.layouts.find(l => l.id === layoutId)
      if (layout) {
        editingLayoutId.value = layoutId
        editingLayoutName.value = layout.name
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

    const clearConfig = () => {
      if (confirm('确定要清除所有配置吗？这将删除所有网站和布局设置。')) {
        localStorage.removeItem('iframe-all-config')
        window.location.reload()
      }
    }

    const increaseRows = () => {
      if (props.rows < 10) {
        emit('update:rows', props.rows + 1)
      }
    }

    const decreaseRows = () => {
      if (props.rows > 2) {
        emit('update:rows', props.rows - 1)
      }
    }

    return {
      showLayoutDropdown,
      editingLayoutId,
      editingLayoutName,
      currentLayoutName,
      toggleLayoutDropdown,
      selectLayout,
      handleCreateLayout,
      handleDeleteLayout,
      startRenameLayout,
      confirmRename,
      cancelRename,
      clearConfig,
      increaseRows,
      decreaseRows,
      handleDropdownLeave,
      clearHideTimer,
      startHideTimer,
      handlePanelMouseLeave
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
  min-width: 350px;
  background: white;
  border: 2px solid var(--primary-color);
  border-radius: 12px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
  z-index: 1000;
  overflow: hidden;
  animation: slideDown 0.2s ease-out;
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

.grid-config {
  display: flex;
  gap: 30px;
  align-items: center;
  flex: 1;
}

.config-section {
  display: flex;
  align-items: center;
  gap: 12px;
}

.config-label {
  font-weight: 600;
  color: #333;
  font-size: 15px;
  white-space: nowrap;
}

/* 单选按钮组 */
.radio-group {
  display: flex;
  gap: 8px;
}

.radio-option {
  position: relative;
  cursor: pointer;
}

.radio-option input[type="radio"] {
  position: absolute;
  opacity: 0;
  width: 0;
  height: 0;
}

.radio-option span {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 45px;
  height: 45px;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  font-size: 18px;
  font-weight: 600;
  color: #666;
  background: white;
  transition: all 0.3s;
}

.radio-option:hover span {
  border-color: var(--primary-color);
  background: var(--primary-light);
}

.radio-option.active span {
  border-color: var(--primary-color);
  background: var(--primary-color);
  color: white;
  transform: scale(1.05);
}

/* 步进器 */
.stepper {
  display: flex;
  align-items: center;
  gap: 0;
  background: white;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  overflow: hidden;
}

.stepper-btn {
  width: 45px;
  height: 45px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: white;
  border: none;
  cursor: pointer;
  color: var(--primary-color);
  transition: all 0.3s;
  border-right: 1px solid #e0e0e0;
}

.stepper-btn:last-child {
  border-right: none;
  border-left: 1px solid #e0e0e0;
}

.stepper-btn:hover:not(:disabled) {
  background: var(--primary-light);
}

.stepper-btn:active:not(:disabled) {
  background: var(--primary-color);
  color: white;
}

.stepper-btn:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

.stepper-btn svg {
  display: block;
}

.stepper-value {
  min-width: 50px;
  padding: 0 15px;
  font-size: 20px;
  font-weight: 700;
  color: var(--primary-color);
  text-align: center;
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
</style>

