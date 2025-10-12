<template>
  <div class="app-container" @mousemove="handleMouseMove">
    <!-- 下载插件/客户端提醒弹窗 -->
    <div v-if="showDownloadModal" class="electron-warning-overlay" @click.self="closeDownloadModal">
      <div class="electron-warning-modal">
        <div class="warning-icon">⚠️</div>
        <h2>需要安装插件才能正常使用</h2>
        <p class="warning-message">
          本应用需要在特定环境中运行才能加载 iframe 网页。<br/>
          请选择下列方式之一安装后使用：
        </p>
        <div class="warning-actions">
          <div class="download-options">
            <div class="option-section">
              <h3>🔌 Chrome 浏览器插件（推荐）</h3>
              <p class="option-desc">适用于 Chrome、Edge 等浏览器</p>
              <a 
                href="/0.1.2_0.zip" 
                download="Allow X-Frame-Options.zip"
                class="download-button primary"
              >
                📥 下载 Chrome 插件
              </a>
              <p class="install-hint">
                下载后请解压，然后在浏览器中加载解压后的文件夹<br/>
                <a href="https://zhuanlan.zhihu.com/p/16585597394" target="_blank" class="tutorial-link">
                  📖 查看详细安装教程
                </a>
              </p>
            </div>
            <div class="divider">或</div>
            <div class="option-section">
              <h3>💻 桌面应用程序</h3>
              <p class="option-desc">独立运行，功能完整</p>
              <a 
                href="https://github.com/MaskerPRC/tab-hive/releases" 
                target="_blank" 
                class="download-button secondary"
              >
                📥 下载桌面应用
              </a>
            </div>
          </div>
          <button @click="closeDownloadModal" class="dismiss-button">
            我知道了（暂时继续浏览）
          </button>
        </div>
      </div>
    </div>

    <!-- 顶部检测区域 -->
    <div 
      v-if="fullscreenIndex === null"
      class="top-trigger-area"
      @mouseenter="showPanel = true"
    ></div>
    
    <ConfigPanel
      v-if="fullscreenIndex === null"
      :class="{ 'panel-visible': showPanel }"
      :rows="rows"
      :cols="cols"
      :layouts="layouts"
      :currentLayoutId="currentLayoutId"
      @update:rows="rows = $event"
      @update:cols="cols = $event"
      @switch-layout="switchLayout"
      @create-layout="createLayout"
      @delete-layout="deleteLayout"
      @rename-layout="renameLayout"
      @show-download-modal="handleShowDownloadModal"
      @mouseenter="showPanel = true"
      @mouseleave="handlePanelLeave"
    />
    <GridView
      :websites="websites"
      :rows="rows"
      :cols="cols"
      :fullscreenIndex="fullscreenIndex"
      @fullscreen="handleFullscreen"
      @exitFullscreen="exitFullscreen"
      @add-website="handleAddWebsite"
      @remove-website="handleRemoveWebsite"
      @update-website="handleUpdateWebsite"
    />
  </div>
</template>

<script>
import { ref, watch, onMounted } from 'vue'
import ConfigPanel from './components/ConfigPanel.vue'
import GridView from './components/GridView.vue'

export default {
  name: 'App',
  components: {
    ConfigPanel,
    GridView
  },
  setup() {
    // 检测是否在 Electron 环境中
    const isElectron = ref(
      typeof window !== 'undefined' && 
      (window.electron !== undefined || 
       (navigator.userAgent && navigator.userAgent.toLowerCase().includes('electron')))
    )

    // 检查用户是否已经看过首次弹窗
    const hasSeenDownloadModal = () => {
      try {
        return localStorage.getItem('tab-hive-seen-download-modal') === 'true'
      } catch (e) {
        return false
      }
    }

    // 控制下载弹窗显示
    // 首次进入：如果不是 Electron 环境且没有看过弹窗，自动显示
    const showDownloadModal = ref(!isElectron.value && !hasSeenDownloadModal())

    // 关闭下载弹窗
    const closeDownloadModal = () => {
      const isFirstTime = !hasSeenDownloadModal()
      showDownloadModal.value = false
      
      // 保存用户已经看过弹窗的标记
      try {
        localStorage.setItem('tab-hive-seen-download-modal', 'true')
      } catch (e) {
        console.error('保存弹窗状态失败:', e)
      }
      
      // 如果是首次关闭弹窗，显示顶栏让用户知道
      if (isFirstTime) {
        setTimeout(() => {
          showPanel.value = true
          
          // 3秒后自动隐藏
          setTimeout(() => {
            showPanel.value = false
          }, 3000)
        }, 300) // 稍微延迟一下，让弹窗关闭动画完成
      }
    }

    // 显示下载弹窗（手动触发）
    const handleShowDownloadModal = () => {
      showDownloadModal.value = true
    }

    // 从 localStorage 加载配置
    const loadFromStorage = () => {
      try {
        const saved = localStorage.getItem('iframe-all-config')
        if (saved) {
          const config = JSON.parse(saved)
          
          // 如果是旧格式（单个配置），转换为新格式（多布局）
          if (config.websites !== undefined && !config.layouts) {
            return {
              layouts: [{
                id: 1,
                name: '默认布局',
                rows: config.rows || 2,
                cols: config.cols || 2,
                websites: config.websites || []
              }],
              currentLayoutId: 1
            }
          }
          
          // 新格式
          return config
        }
      } catch (e) {
        console.error('加载配置失败:', e)
      }
      return null
    }

    // 保存配置到 localStorage
    const saveToStorage = () => {
      try {
        const config = {
          layouts: layouts.value,
          currentLayoutId: currentLayoutId.value
        }
        localStorage.setItem('iframe-all-config', JSON.stringify(config))
      } catch (e) {
        console.error('保存配置失败:', e)
      }
    }

    // 加载保存的配置或使用默认值
    const savedConfig = loadFromStorage()
    
    // 布局列表
    const layouts = ref(savedConfig ? savedConfig.layouts : [
      {
        id: 1,
        name: '默认布局',
        rows: 2,
        cols: 2,
        websites: [
          { id: 1, url: 'https://www.baidu.com', title: '百度' },
          { id: 2, url: 'https://www.bing.com', title: 'Bing' },
          { id: 3, url: 'https://www.google.com', title: 'Google' }
        ]
      }
    ])

    // 当前布局 ID
    const currentLayoutId = ref(savedConfig?.currentLayoutId || 1)

    // 当前布局（计算属性）
    const currentLayout = ref(layouts.value.find(l => l.id === currentLayoutId.value) || layouts.value[0])
    
    // 网站列表（从当前布局中获取）
    const websites = ref(currentLayout.value.websites)
    
    // Grid 配置（从当前布局中获取）
    const rows = ref(currentLayout.value.rows)
    const cols = ref(currentLayout.value.cols)

    // 全屏状态
    const fullscreenIndex = ref(null)
    
    // 顶栏显示状态
    const showPanel = ref(false)

    const handleFullscreen = (index) => {
      fullscreenIndex.value = index
    }

    const exitFullscreen = () => {
      fullscreenIndex.value = null
    }

    const handleMouseMove = (event) => {
      // 鼠标在顶部 5px 区域时显示面板
      if (event.clientY < 5) {
        showPanel.value = true
      }
    }

    const handlePanelLeave = () => {
      // 检查是否有输入框正在使用（重命名输入框或搜索框）
      const activeElement = document.activeElement
      if (activeElement && (
        activeElement.classList.contains('rename-input') ||
        activeElement.classList.contains('search-input')
      )) {
        return // 不隐藏面板
      }
      showPanel.value = false
    }

    const handleAddWebsite = (websiteData) => {
      websites.value.push({
        id: Date.now(),
        url: websiteData.url,
        title: websiteData.title
      })
    }

    const handleRemoveWebsite = (index) => {
      websites.value.splice(index, 1)
    }

    const handleUpdateWebsite = ({ index, title, url }) => {
      if (websites.value[index]) {
        websites.value[index].title = title
        websites.value[index].url = url
      }
    }

    // 切换布局
    const switchLayout = (layoutId) => {
      const layout = layouts.value.find(l => l.id === layoutId)
      if (layout) {
        currentLayoutId.value = layoutId
        currentLayout.value = layout
        websites.value = layout.websites
        rows.value = layout.rows
        cols.value = layout.cols
        saveToStorage()
      }
    }

    // 保存当前布局（更新当前布局的数据）
    const saveCurrentLayout = () => {
      const layout = layouts.value.find(l => l.id === currentLayoutId.value)
      if (layout) {
        layout.websites = [...websites.value]
        layout.rows = rows.value
        layout.cols = cols.value
        saveToStorage()
      }
    }

    // 创建新布局
    const createLayout = (name) => {
      const newLayout = {
        id: Date.now(),
        name: name || `布局 ${layouts.value.length + 1}`,
        rows: 2,
        cols: 2,
        websites: []
      }
      layouts.value.push(newLayout)
      switchLayout(newLayout.id)
    }

    // 删除布局
    const deleteLayout = (layoutId) => {
      if (layouts.value.length <= 1) {
        alert('至少需要保留一个布局')
        return
      }
      
      const index = layouts.value.findIndex(l => l.id === layoutId)
      if (index !== -1) {
        layouts.value.splice(index, 1)
        
        // 如果删除的是当前布局，切换到第一个布局
        if (currentLayoutId.value === layoutId) {
          switchLayout(layouts.value[0].id)
        } else {
          saveToStorage()
        }
      }
    }

    // 重命名布局
    const renameLayout = (layoutId, newName) => {
      const layout = layouts.value.find(l => l.id === layoutId)
      if (layout) {
        layout.name = newName
        saveToStorage()
      }
    }

    // 监听配置变化，自动保存到当前布局
    watch([websites, rows, cols], () => {
      saveCurrentLayout()
    }, { deep: true })

    // 页面加载时自动显示顶栏，然后隐藏
    onMounted(() => {
      // 如果有弹窗显示，等待弹窗关闭后再显示顶栏
      // 否则直接显示顶栏
      if (!showDownloadModal.value) {
        // 初始显示顶栏
        showPanel.value = true
        
        // 3秒后自动隐藏
        setTimeout(() => {
          showPanel.value = false
        }, 3000)
      }
    })

    return {
      isElectron,
      showDownloadModal,
      closeDownloadModal,
      handleShowDownloadModal,
      websites,
      rows,
      cols,
      layouts,
      currentLayoutId,
      fullscreenIndex,
      showPanel,
      handleFullscreen,
      exitFullscreen,
      handleMouseMove,
      handlePanelLeave,
      handleAddWebsite,
      handleRemoveWebsite,
      handleUpdateWebsite,
      switchLayout,
      createLayout,
      deleteLayout,
      renameLayout
    }
  }
}
</script>

<style scoped>
.app-container {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  position: relative;
}

/* Electron 环境警告遮罩层 */
.electron-warning-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.85);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10000;
  backdrop-filter: blur(5px);
}

.electron-warning-modal {
  background: white;
  border-radius: 16px;
  padding: 48px;
  max-width: 680px;
  width: 90%;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  text-align: center;
  animation: fadeInScale 0.3s ease-out;
  max-height: 90vh;
  overflow-y: auto;
}

@keyframes fadeInScale {
  from {
    opacity: 0;
    transform: scale(0.9);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

.warning-icon {
  font-size: 64px;
  margin-bottom: 24px;
  animation: pulse 2s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.1);
  }
}

.electron-warning-modal h2 {
  margin: 0 0 16px 0;
  font-size: 28px;
  color: #333;
  font-weight: 600;
}

.warning-message {
  color: #666;
  font-size: 16px;
  line-height: 1.6;
  margin: 0 0 32px 0;
}

.warning-actions {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.download-options {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.option-section {
  background: #f8f9fa;
  padding: 24px;
  border-radius: 12px;
  border: 2px solid #e9ecef;
}

.option-section h3 {
  margin: 0 0 8px 0;
  font-size: 20px;
  color: #333;
}

.option-desc {
  color: #666;
  font-size: 14px;
  margin: 0 0 16px 0;
}

.install-hint {
  color: #888;
  font-size: 12px;
  margin: 12px 0 0 0;
  line-height: 1.8;
}

.tutorial-link {
  color: #FF5C00;
  text-decoration: none;
  font-weight: 500;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  margin-top: 6px;
  transition: all 0.2s ease;
}

.tutorial-link:hover {
  color: #FF7A33;
  text-decoration: underline;
}

.divider {
  color: #999;
  font-size: 14px;
  font-weight: 500;
  padding: 8px 0;
}

.download-button {
  display: inline-block;
  padding: 14px 32px;
  color: white;
  text-decoration: none;
  border-radius: 8px;
  font-weight: 600;
  font-size: 16px;
  transition: all 0.3s ease;
}

.download-button.primary {
  background: #FF5C00;
  box-shadow: 0 4px 15px rgba(255, 92, 0, 0.3);
}

.download-button.primary:hover {
  background: #FF7A33;
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(255, 92, 0, 0.4);
}

.download-button.secondary {
  background: #FF5C00;
  box-shadow: 0 4px 15px rgba(255, 92, 0, 0.3);
}

.download-button.secondary:hover {
  background: #FF7A33;
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(255, 92, 0, 0.4);
}

.dismiss-button {
  padding: 12px 32px;
  background: transparent;
  color: #999;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.dismiss-button:hover {
  background: #f5f5f5;
  color: #666;
  border-color: #ccc;
}

.top-trigger-area {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 5px;
  z-index: 1000;
  pointer-events: all;
}

.app-container :deep(.config-panel) {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 999;
  transform: translateY(-100%);
  transition: transform 0.3s ease-out;
}

.app-container :deep(.config-panel.panel-visible) {
  transform: translateY(0);
}

/* 响应式设计 */
@media (max-width: 768px) {
  .electron-warning-modal {
    padding: 32px 24px;
    max-width: 95%;
  }

  .electron-warning-modal h2 {
    font-size: 22px;
  }

  .warning-message {
    font-size: 14px;
  }

  .option-section {
    padding: 20px;
  }

  .option-section h3 {
    font-size: 18px;
  }

  .download-button {
    padding: 12px 24px;
    font-size: 14px;
  }
}
</style>

