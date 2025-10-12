<template>
  <div class="config-panel">
    <div class="config-header">
      <h2>🐝 Tab Hive</h2>
      
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
    }
  },
  emits: ['update:rows', 'update:cols'],
  setup(props, { emit }) {
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
      clearConfig,
      increaseRows,
      decreaseRows
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

.config-header h2 {
  color: var(--primary-color);
  font-size: 24px;
  font-weight: 600;
  white-space: nowrap;
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

