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
import { ref } from 'vue'
import ConfigPanel from './components/ConfigPanel.vue'
import GridView from './components/GridView.vue'

export default {
  name: 'App',
  components: {
    ConfigPanel,
    GridView
  },
  setup() {
    // 默认网站列表
    const websites = ref([
      { id: 1, url: 'https://www.baidu.com', title: '百度' },
      { id: 2, url: 'https://www.bing.com', title: 'Bing' },
      { id: 3, url: 'https://www.google.com', title: 'Google' }
    ])

    // Grid 配置
    const rows = ref(2)
    const cols = ref(2)

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

