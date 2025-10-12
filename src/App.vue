<template>
  <div class="app-container" @mousemove="handleMouseMove">
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
      // 初始显示顶栏
      showPanel.value = true
      
      // 3秒后自动隐藏
      setTimeout(() => {
        showPanel.value = false
      }, 3000)
    })

    return {
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
</style>

