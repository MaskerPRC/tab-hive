<template>
  <div class="desktop-capture-selector" v-if="visible">
    <div class="selector-overlay" @click="$emit('close')"></div>
    
    <div class="selector-dialog">
      <div class="selector-header">
        <h2>📺 选择要捕获的桌面源</h2>
        <button @click="$emit('close')" class="close-btn">✕</button>
      </div>

      <div class="selector-tabs">
        <button 
          :class="['tab-btn', { active: activeTab === 'screen' }]"
          @click="activeTab = 'screen'"
        >
          🖥️ 整个屏幕
        </button>
        <button 
          :class="['tab-btn', { active: activeTab === 'window' }]"
          @click="activeTab = 'window'"
        >
          🪟 应用窗口
        </button>
      </div>

      <div class="selector-content">
        <div v-if="loading" class="loading-state">
          <div class="spinner"></div>
          <p>正在加载可用源...</p>
        </div>

        <div v-else-if="error" class="error-state">
          <p>❌ {{ error }}</p>
          <button @click="loadSources" class="btn-retry">重新加载</button>
        </div>

        <div v-else class="sources-grid">
          <div 
            v-for="source in filteredSources" 
            :key="source.id"
            :class="['source-item', { selected: selectedSource === source.id }]"
            @click="selectSource(source.id)"
          >
            <div class="source-thumbnail">
              <img :src="source.thumbnail" :alt="source.name" />
              <div v-if="source.appIcon" class="source-icon">
                <img :src="source.appIcon" :alt="source.name" />
              </div>
            </div>
            <div class="source-name">{{ source.name }}</div>
          </div>
        </div>
      </div>

      <div class="selector-footer">
        <div class="capture-options">
          <label>
            <input type="checkbox" v-model="captureOptions.autoRefresh" />
            自动刷新（每秒更新画面）
          </label>
          <label>
            <input type="checkbox" v-model="captureOptions.fitScreen" />
            适应屏幕大小
          </label>
        </div>
        
        <div class="action-buttons">
          <button @click="confirmCapture" :disabled="!selectedSource" class="btn-confirm">
            开始捕获
          </button>
          <button @click="$emit('close')" class="btn-cancel">
            取消
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted, watch } from 'vue'

export default {
  name: 'DesktopCaptureSelector',
  props: {
    visible: {
      type: Boolean,
      default: false
    }
  },
  emits: ['close', 'select'],
  setup(props, { emit }) {
    const sources = ref([])
    const loading = ref(false)
    const error = ref('')
    const activeTab = ref('screen')
    const selectedSource = ref(null)
    const captureOptions = ref({
      autoRefresh: false,
      fitScreen: true
    })

    const filteredSources = computed(() => {
      return sources.value.filter(source => {
        if (activeTab.value === 'screen') {
          return source.id.startsWith('screen:')
        } else {
          return source.id.startsWith('window:')
        }
      })
    })

    const loadSources = async () => {
      if (!window.electron?.desktopCapture) {
        error.value = '桌面捕获功能仅在 Electron 环境中可用'
        return
      }

      loading.value = true
      error.value = ''
      
      try {
        const result = await window.electron.desktopCapture.getSources({
          types: ['window', 'screen'],
          thumbnailSize: { width: 320, height: 180 },
          fetchWindowIcons: true
        })

        if (result.success) {
          sources.value = result.sources
          console.log('[Desktop Capture] 加载了', sources.value.length, '个源')
        } else {
          error.value = result.error || '获取桌面源失败'
        }
      } catch (e) {
        console.error('[Desktop Capture] 加载失败:', e)
        error.value = e.message
      } finally {
        loading.value = false
      }
    }

    const selectSource = (sourceId) => {
      selectedSource.value = sourceId
    }

    const confirmCapture = () => {
      if (!selectedSource.value) return

      const source = sources.value.find(s => s.id === selectedSource.value)
      if (!source) return

      emit('select', {
        source,
        options: captureOptions.value
      })
    }

    // 监听 visible 变化，打开时加载源
    watch(() => props.visible, (newVal) => {
      if (newVal) {
        loadSources()
      }
    })

    onMounted(() => {
      if (props.visible) {
        loadSources()
      }
    })

    return {
      sources,
      loading,
      error,
      activeTab,
      selectedSource,
      captureOptions,
      filteredSources,
      loadSources,
      selectSource,
      confirmCapture
    }
  }
}
</script>

<style scoped>
.desktop-capture-selector {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 10000;
  display: flex;
  align-items: center;
  justify-content: center;
}

.selector-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(4px);
}

.selector-dialog {
  position: relative;
  width: 900px;
  max-height: 90vh;
  background: white;
  border-radius: 16px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.selector-header {
  padding: 24px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.selector-header h2 {
  margin: 0;
  font-size: 24px;
}

.close-btn {
  background: rgba(255, 255, 255, 0.2);
  border: none;
  color: white;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  cursor: pointer;
  font-size: 20px;
  transition: all 0.3s;
}

.close-btn:hover {
  background: rgba(255, 255, 255, 0.3);
  transform: rotate(90deg);
}

.selector-tabs {
  display: flex;
  background: #f5f5f5;
  border-bottom: 1px solid #e0e0e0;
}

.tab-btn {
  flex: 1;
  padding: 16px;
  border: none;
  background: transparent;
  font-size: 16px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s;
  border-bottom: 3px solid transparent;
}

.tab-btn:hover {
  background: rgba(102, 126, 234, 0.1);
}

.tab-btn.active {
  background: white;
  border-bottom-color: #667eea;
  color: #667eea;
}

.selector-content {
  flex: 1;
  padding: 24px;
  overflow-y: auto;
  min-height: 400px;
}

.loading-state,
.error-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 400px;
  color: #666;
}

.spinner {
  width: 50px;
  height: 50px;
  border: 4px solid #f3f3f3;
  border-top: 4px solid #667eea;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 16px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.btn-retry {
  margin-top: 16px;
  padding: 10px 24px;
  background: #667eea;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.3s;
}

.btn-retry:hover {
  background: #5568d3;
}

.sources-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 16px;
}

.source-item {
  border: 2px solid #e5e7eb;
  border-radius: 12px;
  padding: 12px;
  cursor: pointer;
  transition: all 0.3s;
  background: white;
}

.source-item:hover {
  border-color: #667eea;
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.2);
  transform: translateY(-2px);
}

.source-item.selected {
  border-color: #667eea;
  background: #f0f4ff;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.2);
}

.source-thumbnail {
  position: relative;
  width: 100%;
  aspect-ratio: 16 / 9;
  border-radius: 8px;
  overflow: hidden;
  background: #f3f4f6;
  margin-bottom: 8px;
}

.source-thumbnail img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.source-icon {
  position: absolute;
  bottom: 8px;
  right: 8px;
  width: 32px;
  height: 32px;
  background: white;
  border-radius: 6px;
  padding: 4px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
}

.source-icon img {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.source-name {
  font-size: 14px;
  font-weight: 500;
  color: #374151;
  text-align: center;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.selector-footer {
  padding: 24px;
  border-top: 1px solid #e5e7eb;
  background: #f9fafb;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.capture-options {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.capture-options label {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  color: #374151;
  cursor: pointer;
}

.capture-options input[type="checkbox"] {
  width: 16px;
  height: 16px;
  cursor: pointer;
}

.action-buttons {
  display: flex;
  gap: 12px;
}

.btn-confirm,
.btn-cancel {
  padding: 10px 24px;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s;
}

.btn-confirm {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.btn-confirm:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}

.btn-confirm:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-cancel {
  background: #e5e7eb;
  color: #374151;
}

.btn-cancel:hover {
  background: #d1d5db;
}
</style>

