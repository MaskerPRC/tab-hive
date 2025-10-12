<template>
  <div class="config-panel">
    <div class="config-header">
      <h2>多网页集成工具</h2>
      
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

      <button class="btn-clear" @click="clearConfig" title="清除所有配置">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="3 6 5 6 21 6"/>
          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
        </svg>
        清除配置
      </button>
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

