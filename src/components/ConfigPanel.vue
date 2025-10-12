<template>
  <div class="config-panel">
    <div class="config-header">
      <h2>多网页集成工具</h2>
      <div class="grid-config">
        <div class="config-item">
          <label>横向数量：</label>
          <input 
            type="number" 
            :value="cols" 
            @input="$emit('update:cols', parseInt($event.target.value))"
            min="1"
            max="6"
          />
        </div>
        <div class="config-item">
          <label>竖向数量：</label>
          <input 
            type="number" 
            :value="rows" 
            @input="$emit('update:rows', parseInt($event.target.value))"
            min="1"
            max="6"
          />
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
  setup() {
    const clearConfig = () => {
      if (confirm('确定要清除所有配置吗？这将删除所有网站和布局设置。')) {
        localStorage.removeItem('iframe-all-config')
        window.location.reload()
      }
    }

    return {
      clearConfig
    }
  }
}
</script>

<style scoped>
.config-panel {
  background: white;
  border-bottom: 2px solid var(--primary-color);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
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
}

.grid-config {
  display: flex;
  gap: 20px;
  align-items: center;
}

.config-item {
  display: flex;
  align-items: center;
  gap: 10px;
}

.config-item label {
  font-weight: 500;
  color: #333;
}

.config-item input[type="number"] {
  width: 80px;
  padding: 8px 12px;
  border: 2px solid #e0e0e0;
  border-radius: 6px;
  font-size: 14px;
  transition: border-color 0.3s;
}

.config-item input[type="number"]:focus {
  outline: none;
  border-color: var(--primary-color);
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

