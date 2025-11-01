<template>
  <div v-if="show" class="edit-desktop-capture-overlay" @mousedown="handleOverlayMouseDown" @click="handleOverlayClick">
    <div class="edit-desktop-capture-dialog" @mousedown.stop>
      <h3>{{ editingIndex === -1 ? '添加桌面捕获' : '编辑桌面捕获' }}</h3>
      
      <!-- 核心信息区：标题 -->
      <div class="section-core">
        <div class="section-title">基本信息</div>
        <div class="form-group">
          <label for="desktop-capture-title">名称</label>
          <input
            id="desktop-capture-title"
            v-model="localConfig.title"
            type="text"
            placeholder="请输入桌面捕获名称"
            class="form-input"
            @keyup.enter="handleConfirm"
          />
        </div>
      </div>
      
      <!-- 桌面源选择区 -->
      <div class="section-source">
        <div class="section-title">桌面源</div>
        <div v-if="selectedSource" class="selected-source">
          <div class="source-preview">
            <img :src="selectedSource.thumbnail" :alt="selectedSource.name" />
            <div class="source-info">
              <div class="source-name">{{ selectedSource.name }}</div>
              <div class="source-type">
                {{ selectedSource.id.startsWith('screen:') ? '🖥️ 整个屏幕' : '🪟 应用窗口' }}
              </div>
            </div>
          </div>
          <button @click="showSourceSelector = true" class="btn-change-source">
            更改源
          </button>
        </div>
        <div v-else class="no-source">
          <p>请选择要捕获的桌面源</p>
          <button @click="showSourceSelector = true" class="btn-select-source">
            选择桌面源
          </button>
        </div>
      </div>
      
      <!-- 捕获选项区 -->
      <div class="section-options">
        <div class="section-title">捕获选项</div>
        <div class="options-control">
          <label class="option-button" :class="{ active: localConfig.desktopCaptureOptions.fitScreen }">
            <input
              type="checkbox"
              v-model="localConfig.desktopCaptureOptions.fitScreen"
            />
            <span>适应屏幕大小</span>
          </label>
        </div>
      </div>
      
      <!-- 显示设置区 -->
      <div class="section-display">
        <div class="section-title">显示设置</div>
        <div class="form-row">
          <div class="form-group padding-control">
            <label for="desktop-capture-padding">内边距</label>
            <input
              id="desktop-capture-padding"
              v-model.number="localConfig.padding"
              type="number"
              min="0"
              max="100"
              class="form-input"
              @keyup.enter="handleConfirm"
            />
          </div>
          <div class="form-group muted-control">
            <label for="desktop-capture-muted">静音</label>
            <label class="option-button" :class="{ active: localConfig.muted }">
              <input
                type="checkbox"
                id="desktop-capture-muted"
                v-model="localConfig.muted"
              />
              <span>静音</span>
            </label>
          </div>
        </div>
      </div>
      
      <!-- 操作按钮 -->
      <div class="form-actions">
        <button class="btn-confirm" @click="handleConfirm" :disabled="!canConfirm">确认</button>
        <button class="btn-cancel" @click="$emit('cancel')">取消</button>
      </div>
    </div>
    
    <!-- 桌面源选择器 -->
    <DesktopCaptureSelector
      :visible="showSourceSelector"
      @close="showSourceSelector = false"
      @select="handleSourceSelect"
    />
  </div>
</template>

<script>
import { ref, computed, watch } from 'vue'
import DesktopCaptureSelector from './DesktopCaptureSelector.vue'
import { useOverlayClick } from '../composables/useOverlayClick.js'

export default {
  name: 'DesktopCaptureEditDialog',
  components: {
    DesktopCaptureSelector
  },
  props: {
    show: {
      type: Boolean,
      required: true
    },
    editingIndex: {
      type: Number,
      default: -1
    },
    desktopCapture: {
      type: Object,
      default: () => ({
        title: '',
        desktopCaptureSourceId: null,
        desktopCaptureOptions: {
          fitScreen: false
        },
        padding: 10,
        muted: false
      })
    }
  },
  emits: ['confirm', 'cancel'],
  setup(props, { emit }) {
    // 本地配置数据
    const localConfig = ref({
      title: '',
      desktopCaptureSourceId: null,
      desktopCaptureOptions: {
        fitScreen: false
      },
      padding: 10,
      muted: false
    })
    
    // 选中的桌面源信息
    const selectedSource = ref(null)
    const showSourceSelector = ref(false)
    
    // 是否可以确认（需要标题和桌面源）
    const canConfirm = computed(() => {
      return localConfig.value.title.trim() && localConfig.value.desktopCaptureSourceId
    })
    
    // 监听 props 变化，更新本地数据
    watch(() => props.desktopCapture, (newVal) => {
      if (newVal) {
        localConfig.value = {
          title: newVal.title || '',
          desktopCaptureSourceId: newVal.desktopCaptureSourceId || null,
          desktopCaptureOptions: {
            fitScreen: newVal.desktopCaptureOptions?.fitScreen || false // 默认false
          },
          padding: newVal.padding !== undefined ? newVal.padding : 10,
          muted: newVal.muted || false
        }
        
        // 如果有桌面源ID，尝试加载源信息
        if (localConfig.value.desktopCaptureSourceId) {
          loadSourceInfo(localConfig.value.desktopCaptureSourceId)
        } else {
          selectedSource.value = null
        }
      }
    }, { immediate: true, deep: true })
    
    // 加载桌面源信息
    const loadSourceInfo = async (sourceId) => {
      if (!window.electron?.desktopCapture) {
        return
      }
      
      try {
        const result = await window.electron.desktopCapture.getSources({
          types: ['window', 'screen'],
          thumbnailSize: { width: 320, height: 180 },
          fetchWindowIcons: true
        })
        
        if (result.success) {
          const source = result.sources.find(s => s.id === sourceId)
          if (source) {
            selectedSource.value = source
          }
        }
      } catch (e) {
        console.error('[Desktop Capture Edit] 加载源信息失败:', e)
      }
    }
    
    // 处理桌面源选择
    const handleSourceSelect = ({ source, options }) => {
      console.log('[Desktop Capture Edit] 选择桌面源:', source)
      
      selectedSource.value = source
      localConfig.value.desktopCaptureSourceId = source.id
      
      // 如果用户在选择器中设置了选项，使用这些选项
      if (options) {
        if (!localConfig.value.desktopCaptureOptions) {
          localConfig.value.desktopCaptureOptions = {}
        }
        localConfig.value.desktopCaptureOptions.fitScreen = options.fitScreen || false
      }
      
      showSourceSelector.value = false
    }
    
    // 弹窗交互
    const { handleOverlayMouseDown, handleOverlayClick } = useOverlayClick(() => {
      emit('cancel')
    })
    
    // 确认提交
    const handleConfirm = () => {
      if (!canConfirm.value) {
        return
      }
      
      emit('confirm', {
        type: 'desktop-capture',
        title: localConfig.value.title.trim(),
        url: '', // 桌面捕获不需要URL
        desktopCaptureSourceId: localConfig.value.desktopCaptureSourceId,
        desktopCaptureOptions: {
          fitScreen: localConfig.value.desktopCaptureOptions?.fitScreen || false
        },
        padding: localConfig.value.padding || 10,
        muted: localConfig.value.muted || false,
        targetSelectors: [],
        targetSelector: ''
      })
    }
    
    return {
      localConfig,
      selectedSource,
      showSourceSelector,
      canConfirm,
      handleOverlayMouseDown,
      handleOverlayClick,
      handleSourceSelect,
      handleConfirm
    }
  }
}
</script>

<style scoped>
.edit-desktop-capture-overlay {
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
  backdrop-filter: blur(5px);
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

.edit-desktop-capture-dialog {
  background: white;
  border-radius: 16px;
  padding: 32px;
  max-width: 700px;
  width: 90%;
  max-height: 85vh;
  overflow-y: auto;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  animation: slideUp 0.3s ease-out;
  /* 自定义滚动条 */
  scrollbar-width: 10px;
  scrollbar-color: #FF5C00 transparent;
}

.edit-desktop-capture-dialog::-webkit-scrollbar {
  width: 10px;
}

.edit-desktop-capture-dialog::-webkit-scrollbar-track {
  background: transparent;
}

.edit-desktop-capture-dialog::-webkit-scrollbar-thumb {
  background: #FF5C00;
  border-radius: 5px;
  transition: background 0.3s ease;
  margin: 2px;
}

.edit-desktop-capture-dialog::-webkit-scrollbar-thumb:hover {
  background: #e64e00;
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

.edit-desktop-capture-dialog h3 {
  color: var(--primary-color);
  margin: 0 0 24px 0;
  font-size: 24px;
  text-align: center;
}

.section-core,
.section-source,
.section-options,
.section-display {
  margin-bottom: 24px;
  padding: 16px;
  background: #fafafa;
  border-radius: 12px;
  border: 1px solid #e8e8e8;
}

.section-title {
  font-size: 15px;
  font-weight: 600;
  color: #333;
  margin-bottom: 16px;
}

.form-group {
  margin-bottom: 16px;
}

.form-group:last-child {
  margin-bottom: 0;
}

.form-group label {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  color: #374151;
  cursor: pointer;
  margin-bottom: 8px;
}

.form-group label input[type="checkbox"] {
  width: 16px;
  height: 16px;
  cursor: pointer;
  accent-color: #FF5C00;
}

/* 选项按钮样式（整个按钮作为勾选框） */
.options-control {
  display: flex;
  gap: 12px;
  margin-top: 8px;
}

.option-button {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s;
  background: white;
  font-size: 14px;
  font-weight: 500;
  color: #374151;
  user-select: none;
}

.option-button:hover {
  border-color: #FF5C00;
  background: #fff5f0;
  color: #FF5C00;
}

.option-button.active {
  border-color: #FF5C00;
  background: #FF5C00;
  color: white;
}

.option-button input[type="checkbox"] {
  display: none;
}

.option-button span {
  display: flex;
  align-items: center;
  gap: 6px;
}

.form-input {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 14px;
  transition: border-color 0.3s;
}

.form-input:focus {
  outline: none;
  border-color: var(--primary-color);
}

.form-row {
  display: flex;
  gap: 16px;
}

.form-row .form-group {
  flex: 1;
}

.muted-control {
  display: flex;
  flex-direction: column;
}

.muted-control > label:first-child {
  margin-bottom: 8px;
}

.padding-control {
  display: flex;
  flex-direction: column;
}

.padding-control .form-input {
  width: 120px;
  margin-bottom: 4px;
}

.input-unit {
  font-size: 12px;
  color: #999;
  margin-top: 2px;
}

/* 桌面源选择区域 */
.selected-source {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.source-preview {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: white;
  border: 2px solid #e5e7eb;
  border-radius: 8px;
  transition: border-color 0.3s;
}

.source-preview:hover {
  border-color: #FF5C00;
}

.source-preview img {
  width: 120px;
  height: 68px;
  object-fit: cover;
  border-radius: 6px;
}

.source-info {
  flex: 1;
}

.source-name {
  font-size: 14px;
  font-weight: 500;
  color: #374151;
  margin-bottom: 4px;
}

.source-type {
  font-size: 12px;
  color: #6b7280;
}

.btn-change-source {
  padding: 8px 16px;
  background: #fff5f0;
  color: #FF5C00;
  border: 1px solid #FF5C00;
  border-radius: 6px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.3s;
  font-weight: 500;
}

.btn-change-source:hover {
  background: #FF5C00;
  color: white;
}

.no-source {
  text-align: center;
  padding: 24px;
}

.no-source p {
  margin-bottom: 16px;
  color: #6b7280;
  font-size: 14px;
}

.btn-select-source {
  padding: 10px 24px;
  background: var(--primary-color);
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.3s;
}

.btn-select-source:hover {
  background: var(--primary-hover);
}

.form-actions {
  display: flex;
  gap: 10px;
  justify-content: center;
  margin-top: 24px;
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

.btn-confirm:hover:not(:disabled) {
  background: var(--primary-hover);
}

.btn-confirm:disabled {
  opacity: 0.5;
  cursor: not-allowed;
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
</style>

