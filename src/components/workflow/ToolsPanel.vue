<template>
  <div class="tools-panel">
    <div class="tool-section">
      <h4>布局中的网页</h4>
      <div v-if="websites.length === 0" class="empty-hint">
        当前布局暂无网页
      </div>
      <button 
        v-for="website in websites" 
        :key="website.id" 
        @click="$emit('add-webpage-node', website)"
        class="tool-btn website-btn"
        :title="`添加网页节点: ${website.name || website.url}`"
      >
        <span class="tool-icon">🌐</span>
        <span class="website-name">{{ website.name || getShortUrl(website.url) }}</span>
      </button>
    </div>

    <div class="tool-section">
      <h4>添加节点</h4>
      <button @click="$emit('add-flow-node')" class="tool-btn">
        <span class="tool-icon">🔄</span>
        <span>Flow节点</span>
      </button>
      <button @click="$emit('add-web-control-node')" class="tool-btn">
        <span class="tool-icon">⚡</span>
        <span>网页控制</span>
      </button>
    </div>

    <div class="tool-section">
      <h4>网页元素</h4>
      <button @click="$emit('start-element-selection')" class="tool-btn primary">
        <span class="tool-icon">🎯</span>
        <span>选择元素</span>
      </button>
    </div>
  </div>
</template>

<script>
export default {
  name: 'ToolsPanel',
  props: {
    websites: {
      type: Array,
      default: () => []
    }
  },
  emits: ['add-webpage-node', 'add-flow-node', 'add-web-control-node', 'start-element-selection'],
  methods: {
    getShortUrl(url) {
      try {
        const urlObj = new URL(url)
        return urlObj.hostname
      } catch {
        return url.substring(0, 20) + '...'
      }
    }
  }
}
</script>

<style scoped>
.tools-panel {
  width: 200px;
  background: rgba(255, 255, 255, 0.98);
  border-right: 1px solid #e0e0e0;
  padding: 16px;
  overflow-y: auto;
  backdrop-filter: blur(10px);
}

.dark-mode .tools-panel {
  background: rgba(45, 45, 45, 0.98);
  border-right-color: #444;
}

.tool-section {
  margin-bottom: 24px;
}

.tool-section h4 {
  margin: 0 0 12px 0;
  font-size: 14px;
  color: #666;
}

.dark-mode .tool-section h4 {
  color: #aaa;
}

.tool-btn {
  width: 100%;
  padding: 12px;
  background: #fff;
  border: 2px solid #e0e0e0;
  border-radius: 6px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
  transition: all 0.2s;
}

.tool-btn:hover {
  border-color: #4CAF50;
  background: #f9fff9;
}

.tool-btn.primary {
  background: #4CAF50;
  color: #fff;
  border-color: #4CAF50;
}

.tool-btn.primary:hover {
  background: #45a049;
}

.dark-mode .tool-btn {
  background: #3a3a3a;
  border-color: #555;
  color: #e0e0e0;
}

.tool-icon {
  font-size: 20px;
}

.website-btn {
  font-size: 13px;
}

.website-name {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  flex: 1;
  text-align: left;
}

.empty-hint {
  color: #999;
  font-size: 12px;
  padding: 8px 0;
  text-align: center;
}

.dark-mode .empty-hint {
  color: #666;
}
</style>

