<template>
  <div class="app-container">
    <ConfigPanel
      v-if="fullscreenIndex === null"
      :rows="rows"
      :cols="cols"
      @update:rows="rows = $event"
      @update:cols="cols = $event"
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
import { ref, watch } from 'vue'
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
          return {
            websites: config.websites || [],
            rows: config.rows || 2,
            cols: config.cols || 2
          }
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
          websites: websites.value,
          rows: rows.value,
          cols: cols.value
        }
        localStorage.setItem('iframe-all-config', JSON.stringify(config))
      } catch (e) {
        console.error('保存配置失败:', e)
      }
    }

    // 加载保存的配置或使用默认值
    const savedConfig = loadFromStorage()
    
    // 网站列表
    const websites = ref(savedConfig?.websites.length > 0 ? savedConfig.websites : [
      { id: 1, url: 'https://www.baidu.com', title: '百度' },
      { id: 2, url: 'https://www.bing.com', title: 'Bing' },
      { id: 3, url: 'https://www.google.com', title: 'Google' }
    ])

    // Grid 配置
    const rows = ref(savedConfig?.rows || 2)
    const cols = ref(savedConfig?.cols || 2)

    // 全屏状态
    const fullscreenIndex = ref(null)

    const handleFullscreen = (index) => {
      fullscreenIndex.value = index
    }

    const exitFullscreen = () => {
      fullscreenIndex.value = null
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

    // 监听配置变化，自动保存
    watch([websites, rows, cols], () => {
      saveToStorage()
    }, { deep: true })

    return {
      websites,
      rows,
      cols,
      fullscreenIndex,
      handleFullscreen,
      exitFullscreen,
      handleAddWebsite,
      handleRemoveWebsite,
      handleUpdateWebsite
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
}
</style>

