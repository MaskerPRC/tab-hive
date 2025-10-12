<template>
  <div class="grid-view" :class="{ 'fullscreen-mode': fullscreenIndex !== null }">
    <div 
      class="grid-container"
      :style="gridStyle"
    >
      <div
        v-for="(item, index) in allWebsites"
        :key="item.id"
        class="grid-item"
        :class="{ 
          'fullscreen': fullscreenIndex === index,
          'hidden': isHidden(index),
          'empty-slot': !item.url,
          'drag-over': dragOverIndex === index
        }"
        @dragover.prevent="handleDragOver(index)"
        @dragleave="handleDragLeave"
        @drop.prevent="handleDrop($event, index)"
      >
        <!-- 已有网站显示 -->
        <template v-if="item.url">
          <iframe 
            :src="item.url"
            frameborder="0"
            class="website-iframe"
            :title="item.title"
          ></iframe>
          <div class="floating-actions">
            <button 
              v-if="fullscreenIndex !== index"
              class="btn-action btn-remove"
              @click="handleRemoveWebsite(index)"
              title="删除网站"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
              </svg>
            </button>
            <button 
              v-if="fullscreenIndex === index"
              class="btn-action"
              @click="$emit('exitFullscreen')"
              title="退出全屏"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3"/>
              </svg>
            </button>
            <button 
              v-else
              class="btn-action"
              @click="$emit('fullscreen', index)"
              title="全屏查看"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"/>
              </svg>
            </button>
          </div>
        </template>

        <!-- 空白槽位显示添加表单 -->
        <template v-else>
          <div v-if="editingSlot === index" class="add-website-form">
            <h3>添加网站</h3>
            <div class="form-group">
              <label>网站名称：</label>
              <input 
                v-model="newWebsite.title"
                type="text" 
                placeholder="例如：Google"
                class="form-input"
                @keyup.enter="confirmAddWebsite"
              />
            </div>
            <div class="form-group">
              <label>网站地址：</label>
              <input 
                v-model="newWebsite.url"
                type="url" 
                placeholder="https://example.com"
                class="form-input"
                @keyup.enter="confirmAddWebsite"
              />
            </div>
            <div class="form-actions">
              <button class="btn-confirm" @click="confirmAddWebsite">确定</button>
              <button class="btn-cancel" @click="cancelAddWebsite">取消</button>
            </div>
          </div>
          <div v-else class="empty-placeholder" @click="startAddWebsite(index)">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"/>
              <line x1="12" y1="8" x2="12" y2="16"/>
              <line x1="8" y1="12" x2="16" y2="12"/>
            </svg>
            <p>点击添加网站</p>
          </div>
        </template>
      </div>
    </div>
  </div>
</template>

<script>
import { computed, ref } from 'vue'

export default {
  name: 'GridView',
  props: {
    websites: {
      type: Array,
      required: true
    },
    rows: {
      type: Number,
      required: true
    },
    cols: {
      type: Number,
      required: true
    },
    fullscreenIndex: {
      type: Number,
      default: null
    }
  },
  emits: ['fullscreen', 'exitFullscreen', 'add-website', 'remove-website', 'update-website'],
  setup(props, { emit }) {
    const editingSlot = ref(null)
    const newWebsite = ref({
      title: '',
      url: ''
    })
    const dragOverIndex = ref(null)
    const gridStyle = computed(() => {
      if (props.fullscreenIndex !== null) {
        return {
          display: 'grid',
          gridTemplateColumns: '1fr',
          gridTemplateRows: '1fr'
        }
      }
      return {
        display: 'grid',
        gridTemplateColumns: `repeat(${props.cols}, 1fr)`,
        gridTemplateRows: `repeat(${props.rows}, 1fr)`,
        gap: '10px'
      }
    })

    // 始终保持所有网站在DOM中，包括填充的空白槽位
    const allWebsites = computed(() => {
      const totalSlots = props.rows * props.cols
      const result = []
      
      // 填充网站或空白槽位
      for (let i = 0; i < totalSlots; i++) {
        if (i < props.websites.length) {
          result.push(props.websites[i])
        } else {
          // 使用固定的id格式，确保相同位置的空白槽位key不变
          result.push({
            id: `empty-slot-${i}`,
            url: '',
            title: `空白 ${i + 1}`
          })
        }
      }
      
      return result
    })

    // 判断某个索引的网站是否应该隐藏
    const isHidden = (index) => {
      // 如果是全屏模式，隐藏所有非全屏的网站
      if (props.fullscreenIndex !== null) {
        return index !== props.fullscreenIndex
      }
      // 非全屏模式，不隐藏任何网站
      return false
    }

    const startAddWebsite = (index) => {
      editingSlot.value = index
      newWebsite.value = {
        title: '',
        url: ''
      }
    }

    const confirmAddWebsite = () => {
      if (newWebsite.value.title && newWebsite.value.url) {
        emit('add-website', {
          title: newWebsite.value.title,
          url: newWebsite.value.url
        })
        editingSlot.value = null
        newWebsite.value = { title: '', url: '' }
      }
    }

    const cancelAddWebsite = () => {
      editingSlot.value = null
      newWebsite.value = { title: '', url: '' }
    }

    const handleRemoveWebsite = (index) => {
      if (confirm(`确定要删除 "${props.websites[index].title}" 吗？`)) {
        emit('remove-website', index)
      }
    }

    const handleDragOver = (index) => {
      dragOverIndex.value = index
    }

    const handleDragLeave = () => {
      dragOverIndex.value = null
    }

    const handleDrop = (event, index) => {
      dragOverIndex.value = null
      
      // 获取拖放的数据
      let url = ''
      let title = ''
      
      // 尝试从不同的数据格式中获取URL
      if (event.dataTransfer.getData('text/uri-list')) {
        url = event.dataTransfer.getData('text/uri-list')
      } else if (event.dataTransfer.getData('text/plain')) {
        url = event.dataTransfer.getData('text/plain')
      } else if (event.dataTransfer.getData('URL')) {
        url = event.dataTransfer.getData('URL')
      }
      
      // 尝试获取标题
      if (event.dataTransfer.getData('text/x-moz-url')) {
        const mozUrl = event.dataTransfer.getData('text/x-moz-url').split('\n')
        url = mozUrl[0]
        title = mozUrl[1] || ''
      }
      
      // 清理URL（移除可能的换行符）
      url = url.trim().split('\n')[0]
      
      if (!url || !url.startsWith('http')) {
        alert('请拖入有效的网址')
        return
      }
      
      // 如果没有标题，尝试从URL提取
      if (!title) {
        try {
          const urlObj = new URL(url)
          title = urlObj.hostname.replace('www.', '')
        } catch (e) {
          title = '新网站'
        }
      }
      
      // 如果是空白槽位，直接添加
      if (index >= props.websites.length) {
        emit('add-website', { title, url })
      } else {
        // 如果已有网站，提示用户
        const currentWebsite = props.websites[index]
        if (confirm(`是否将 "${currentWebsite.title}" 替换为 "${title}"？`)) {
          emit('update-website', { index, title, url })
        }
      }
    }

    return {
      gridStyle,
      allWebsites,
      isHidden,
      editingSlot,
      newWebsite,
      dragOverIndex,
      startAddWebsite,
      confirmAddWebsite,
      cancelAddWebsite,
      handleRemoveWebsite,
      handleDragOver,
      handleDragLeave,
      handleDrop
    }
  }
}
</script>

<style scoped>
.grid-view {
  flex: 1;
  padding: 15px;
  overflow: hidden;
}

.fullscreen-mode {
  padding: 0;
}

.grid-container {
  width: 100%;
  height: 100%;
}

.grid-item {
  background: white;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  position: relative;
  transition: all 0.3s ease;
  min-height: 0;
}

.grid-item.hidden {
  display: none;
}

.grid-item.fullscreen {
  border-radius: 0;
  box-shadow: none;
}

.grid-item.drag-over {
  border: 3px dashed var(--primary-color);
  background: var(--primary-light);
  box-shadow: 0 4px 12px rgba(255, 92, 0, 0.3);
}

.website-iframe {
  width: 100%;
  height: 100%;
  border: none;
}

.floating-actions {
  position: absolute;
  top: 10px;
  right: 10px;
  display: flex;
  gap: 8px;
  z-index: 10;
}

.btn-action {
  background: rgba(255, 92, 0, 0.7);
  color: white;
  border: none;
  padding: 8px;
  border-radius: 6px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s;
  backdrop-filter: blur(4px);
}

.btn-action:hover {
  background: rgba(255, 92, 0, 0.9);
  transform: scale(1.1);
}

.btn-action svg {
  display: block;
}

.btn-remove {
  background: rgba(255, 68, 68, 0.7) !important;
}

.btn-remove:hover {
  background: rgba(255, 0, 0, 0.9) !important;
}

.empty-placeholder {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #999;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.3s;
  gap: 12px;
}

.empty-slot .empty-placeholder:hover {
  background: var(--primary-light);
  color: var(--primary-color);
}

.empty-slot .empty-placeholder:hover svg {
  stroke: var(--primary-color);
  transform: scale(1.1);
}

.empty-placeholder svg {
  transition: all 0.3s;
}

.add-website-form {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding: 30px;
  background: white;
}

.add-website-form h3 {
  color: var(--primary-color);
  margin-bottom: 20px;
  font-size: 20px;
  text-align: center;
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  color: #333;
  font-weight: 500;
  font-size: 14px;
}

.form-input {
  width: 100%;
  padding: 12px 15px;
  border: 2px solid #e0e0e0;
  border-radius: 6px;
  font-size: 14px;
  transition: border-color 0.3s;
}

.form-input:focus {
  outline: none;
  border-color: var(--primary-color);
}

.form-actions {
  display: flex;
  gap: 10px;
  justify-content: center;
  margin-top: 10px;
}

.btn-confirm {
  background: var(--primary-color);
  color: white;
  border: none;
  padding: 12px 30px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: background 0.3s;
}

.btn-confirm:hover {
  background: var(--primary-hover);
}

.btn-cancel {
  background: #e0e0e0;
  color: #666;
  border: none;
  padding: 12px 30px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: background 0.3s;
}

.btn-cancel:hover {
  background: #d0d0d0;
}

.btn-remove {
  background: #ff4444 !important;
}

.btn-remove:hover {
  background: #ff0000 !important;
}
</style>

