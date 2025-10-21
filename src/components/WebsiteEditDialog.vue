<template>
  <div v-if="show" class="edit-website-overlay" @mousedown="handleOverlayMouseDown" @click="handleOverlayClick">
    <div class="edit-website-dialog" @mousedown.stop>
      <h3>{{ editingIndex === -1 ? '添加网站' : '编辑网站' }}</h3>
      <div class="form-group">
        <label>网站名称：</label>
        <input
          v-model="localWebsite.title"
          type="text"
          placeholder="例如：Google"
          class="form-input"
          @keyup.enter="handleConfirm"
          ref="titleInput"
        />
      </div>
      <div class="form-group">
        <label>网站地址：</label>
        <input
          v-model="localWebsite.url"
          type="text"
          placeholder="例如：bbc.com 或 https://bbc.com"
          class="form-input"
          @keyup.enter="handleConfirm"
        />
      </div>
      <div class="form-group">
        <label>设备类型：</label>
        <div class="device-type-selector">
          <label class="device-option" :class="{ active: localWebsite.deviceType === 'desktop' }">
            <input
              type="radio"
              value="desktop"
              v-model="localWebsite.deviceType"
            />
            <span>🖥️ PC版</span>
          </label>
          <label class="device-option" :class="{ active: localWebsite.deviceType === 'mobile' }">
            <input
              type="radio"
              value="mobile"
              v-model="localWebsite.deviceType"
            />
            <span>📱 手机版</span>
          </label>
        </div>
        <div class="device-hint" v-if="localWebsite.deviceType === 'mobile'">
          💡 手机版会自动将域名转换为移动版（如 www.xxx.com → m.xxx.com）<br>
          并限制视口宽度为 375px，适合查看响应式网站的移动布局
        </div>
      </div>
      <div class="form-group">
        <label>目标选择器（可选）：</label>
        <input
          v-model="localWebsite.targetSelector"
          type="text"
          placeholder="例如：#main-content 或 .video-player"
          class="form-input"
          @keyup.enter="handleConfirm"
        />
        <div class="selector-hint">
          💡 Grid模式下只显示匹配此CSS选择器的元素，全屏时显示完整页面<br>
          • Electron版本：完全支持所有网站<br>
          • 浏览器版本：仅支持同域iframe（跨域网站请使用Electron）<br>
          留空则始终显示整个页面
        </div>
      </div>
      <div class="form-group">
        <label>自动刷新间隔（可选）：</label>
        
        <!-- 常用预设 -->
        <div class="refresh-presets">
          <button
            v-for="preset in refreshPresets"
            :key="preset.value"
            type="button"
            class="preset-btn"
            :class="{ active: isPresetActive(preset.value) }"
            @click="selectPreset(preset.value)"
          >
            {{ preset.label }}
          </button>
        </div>
        
        <!-- 自定义配置 -->
        <div class="refresh-custom">
          <div class="custom-label">自定义：</div>
          <div class="refresh-interval-selector">
            <input
              v-model.number="customValue"
              type="number"
              min="0"
              step="1"
              placeholder="0"
              class="form-input refresh-input"
              @keyup.enter="handleConfirm"
              @input="handleCustomInput"
            />
            <select
              v-model="timeUnit"
              class="form-input unit-select"
              @change="handleUnitChange"
            >
              <option value="seconds">秒</option>
              <option value="minutes">分钟</option>
              <option value="hours">小时</option>
              <option value="days">天</option>
            </select>
          </div>
        </div>
        
        <div class="refresh-hint">
          💡 设置iframe自动刷新的时间间隔<br>
          • 点击预设快速选择，或自定义时间和单位<br>
          • 设置为 0 表示不自动刷新<br>
          • 建议最小值：30秒（避免频繁刷新影响性能）<br>
          • 适用场景：实时监控、数据大屏等需要定期更新的页面
        </div>
      </div>
      <div class="form-actions">
        <button class="btn-confirm" @click="handleConfirm">确定</button>
        <button class="btn-cancel" @click="$emit('cancel')">取消</button>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, watch, nextTick, computed } from 'vue'

export default {
  name: 'WebsiteEditDialog',
  props: {
    show: {
      type: Boolean,
      required: true
    },
    editingIndex: {
      type: Number,
      default: null
    },
    website: {
      type: Object,
      default: () => ({
        title: '',
        url: '',
        deviceType: 'desktop',
        targetSelector: '',
        autoRefreshInterval: 0
      })
    }
  },
  emits: ['confirm', 'cancel'],
  setup(props, { emit }) {
    const titleInput = ref(null)
    const mouseDownOnOverlay = ref(false)
    const localWebsite = ref({
      title: '',
      url: '',
      deviceType: 'desktop',
      targetSelector: '',
      autoRefreshInterval: 0
    })

    // 自定义时间值和单位
    const customValue = ref(0)
    const timeUnit = ref('seconds')

    // 常用预设（单位：秒）
    const refreshPresets = [
      { label: '不刷新', value: 0 },
      { label: '30秒', value: 30 },
      { label: '1分钟', value: 60 },
      { label: '5分钟', value: 300 },
      { label: '30分钟', value: 1800 },
      { label: '1小时', value: 3600 },
      { label: '1天', value: 86400 }
    ]

    // 时间单位转换为秒的系数
    const unitToSeconds = {
      seconds: 1,
      minutes: 60,
      hours: 3600,
      days: 86400
    }

    // 将秒转换为最合适的单位和值
    const convertSecondsToUnit = (seconds) => {
      if (seconds === 0) {
        return { value: 0, unit: 'seconds' }
      }
      
      // 尝试从大到小的单位
      if (seconds >= 86400 && seconds % 86400 === 0) {
        return { value: seconds / 86400, unit: 'days' }
      }
      if (seconds >= 3600 && seconds % 3600 === 0) {
        return { value: seconds / 3600, unit: 'hours' }
      }
      if (seconds >= 60 && seconds % 60 === 0) {
        return { value: seconds / 60, unit: 'minutes' }
      }
      return { value: seconds, unit: 'seconds' }
    }

    // 监听 website prop 变化，更新本地数据
    watch(() => props.website, (newVal) => {
      localWebsite.value = { ...newVal }
      
      // 将秒数转换为合适的单位显示
      const converted = convertSecondsToUnit(newVal.autoRefreshInterval || 0)
      customValue.value = converted.value
      timeUnit.value = converted.unit
    }, { immediate: true, deep: true })

    // 监听对话框显示，自动聚焦到标题输入框
    watch(() => props.show, (newVal) => {
      if (newVal) {
        mouseDownOnOverlay.value = false
        nextTick(() => {
          if (titleInput.value) {
            titleInput.value.focus()
          }
        })
      }
    })

    // 选择预设
    const selectPreset = (seconds) => {
      localWebsite.value.autoRefreshInterval = seconds
      const converted = convertSecondsToUnit(seconds)
      customValue.value = converted.value
      timeUnit.value = converted.unit
    }

    // 判断预设是否被激活
    const isPresetActive = (presetValue) => {
      return localWebsite.value.autoRefreshInterval === presetValue
    }

    // 处理自定义输入
    const handleCustomInput = () => {
      const seconds = (customValue.value || 0) * unitToSeconds[timeUnit.value]
      localWebsite.value.autoRefreshInterval = seconds
    }

    // 处理单位变化
    const handleUnitChange = () => {
      const seconds = (customValue.value || 0) * unitToSeconds[timeUnit.value]
      localWebsite.value.autoRefreshInterval = seconds
    }

    const handleConfirm = () => {
      if (localWebsite.value.title && localWebsite.value.url) {
        let url = localWebsite.value.url.trim()

        // 如果URL不是以 http:// 或 https:// 开头，自动添加 https://
        if (!url.startsWith('http://') && !url.startsWith('https://')) {
          url = 'https://' + url
        }

        // 验证URL格式
        try {
          new URL(url)
        } catch (e) {
          alert('请输入有效的网址格式，例如：google.com 或 https://google.com')
          return
        }

        emit('confirm', {
          ...localWebsite.value,
          url
        })
      }
    }

    const handleOverlayMouseDown = (event) => {
      // 只有当直接点击 overlay 时才标记
      if (event.target === event.currentTarget) {
        mouseDownOnOverlay.value = true
      } else {
        mouseDownOnOverlay.value = false
      }
    }

    const handleOverlayClick = (event) => {
      // 只有当 mousedown 和 click 都发生在 overlay 上时才关闭
      if (event.target === event.currentTarget && mouseDownOnOverlay.value) {
        emit('cancel')
      }
      mouseDownOnOverlay.value = false
    }

    return {
      titleInput,
      localWebsite,
      customValue,
      timeUnit,
      refreshPresets,
      selectPreset,
      isPresetActive,
      handleCustomInput,
      handleUnitChange,
      handleConfirm,
      handleOverlayMouseDown,
      handleOverlayClick
    }
  }
}
</script>

<style scoped>
.edit-website-overlay {
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

.edit-website-dialog {
  background: white;
  border-radius: 16px;
  padding: 32px;
  max-width: 500px;
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

.edit-website-dialog h3 {
  color: var(--primary-color);
  margin: 0 0 24px 0;
  font-size: 24px;
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

.device-type-selector {
  display: flex;
  gap: 12px;
  margin-top: 8px;
}

.device-hint {
  margin-top: 10px;
  padding: 10px;
  background: #f0f7ff;
  border-left: 3px solid #3b82f6;
  border-radius: 4px;
  font-size: 12px;
  line-height: 1.6;
  color: #1e40af;
}

.selector-hint {
  margin-top: 8px;
  padding: 10px;
  background: #fff4e6;
  border-left: 3px solid #ff9800;
  border-radius: 4px;
  font-size: 12px;
  line-height: 1.6;
  color: #e65100;
}

.device-option {
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
}

.device-option:hover {
  border-color: var(--primary-color);
  background: var(--primary-light);
}

.device-option.active {
  border-color: var(--primary-color);
  background: var(--primary-color);
  color: white;
}

.device-option input[type="radio"] {
  display: none;
}

.device-option span {
  display: flex;
  align-items: center;
  gap: 6px;
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

.refresh-presets {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 16px;
}

.preset-btn {
  flex: 0 0 auto;
  padding: 8px 14px;
  border: 2px solid #e0e0e0;
  border-radius: 6px;
  background: white;
  color: #333;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  white-space: nowrap;
}

.preset-btn:hover {
  border-color: var(--primary-color);
  background: var(--primary-light);
  transform: translateY(-1px);
  box-shadow: 0 2px 4px rgba(255, 92, 0, 0.1);
}

.preset-btn.active {
  border-color: var(--primary-color);
  background: var(--primary-color);
  color: white;
  box-shadow: 0 2px 8px rgba(255, 92, 0, 0.3);
}

.refresh-custom {
  margin-top: 12px;
}

.custom-label {
  font-size: 13px;
  color: #666;
  margin-bottom: 8px;
  font-weight: 500;
}

.refresh-interval-selector {
  display: flex;
  align-items: center;
  gap: 10px;
}

.refresh-input {
  flex: 1;
  min-width: 0;
}

.unit-select {
  flex: 0 0 90px;
  cursor: pointer;
  padding: 12px 10px;
  font-size: 14px;
}

.unit-select:focus {
  outline: none;
  border-color: var(--primary-color);
}

.interval-unit {
  font-size: 14px;
  color: #666;
  font-weight: 500;
  white-space: nowrap;
}

.refresh-hint {
  margin-top: 12px;
  padding: 10px;
  background: #f0fdf4;
  border-left: 3px solid #10b981;
  border-radius: 4px;
  font-size: 12px;
  line-height: 1.6;
  color: #065f46;
}
</style>

