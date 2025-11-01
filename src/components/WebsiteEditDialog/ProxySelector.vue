<template>
  <div class="form-group">
    <label>代理节点</label>
    <div class="selector-wrapper">
      <select
        :value="modelValue"
        @change="$emit('update:modelValue', $event.target.value ? Number($event.target.value) : '')"
        class="form-select"
        :disabled="loading"
      >
        <option value="">不使用代理</option>
        <option v-for="proxy in proxyList" :key="proxy.id" :value="proxy.id">
          {{ proxy.name }} ({{ proxy.type.toUpperCase() }})
        </option>
      </select>
      <button
        v-if="isElectron"
        @click="$emit('manage-proxies')"
        class="manage-btn"
        type="button"
        :title="'管理代理节点'"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
        </svg>
      </button>
    </div>
  </div>
</template>

<script>
import { ref, onMounted, computed, watch } from 'vue'

export default {
  name: 'ProxySelector',
  props: {
    modelValue: {
      type: [String, Number],
      default: ''
    },
    // 接收父组件的 show 状态，以便在对话框打开时加载代理列表
    dialogVisible: {
      type: Boolean,
      default: false
    }
  },
  emits: ['update:modelValue', 'manage-proxies'],
  setup(props, { emit }) {
    const loading = ref(false)
    const proxyList = ref([])

    const isElectron = computed(() => {
      return typeof window !== 'undefined' && window.electron?.proxy !== undefined
    })

    // 加载代理列表
    const loadProxyList = async () => {
      if (!isElectron.value) return
      
      loading.value = true
      try {
        const result = await window.electron.proxy.getList(1, 100)
        if (result.success) {
          proxyList.value = (result.data.list || []).filter(p => p.is_enabled)
        }
      } catch (error) {
        console.error('加载代理列表失败:', error)
      } finally {
        loading.value = false
      }
    }

    onMounted(() => {
      if (isElectron.value) {
        loadProxyList()
      }
    })

    // 监听对话框显示状态，打开时重新加载代理列表
    watch(() => props.dialogVisible, (newVal) => {
      if (newVal && isElectron.value) {
        loadProxyList()
      }
    })

    return {
      loading,
      proxyList,
      isElectron,
      loadProxyList
    }
  }
}
</script>

<style scoped>
.selector-wrapper {
  display: flex;
  gap: 8px;
  align-items: center;
}

.form-select {
  flex: 1;
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 14px;
  font-family: inherit;
  background: white;
  cursor: pointer;
  transition: border-color 0.3s;
}

.form-select:focus {
  outline: none;
  border-color: var(--primary-color, #FF5C00);
}

.form-select:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.manage-btn {
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 6px;
  background: white;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s;
  color: #666;
}

.manage-btn:hover {
  background: #fff5f0;
  border-color: var(--primary-color, #FF5C00);
  color: var(--primary-color, #FF5C00);
}

.manage-btn svg {
  stroke: currentColor;
}
</style>
