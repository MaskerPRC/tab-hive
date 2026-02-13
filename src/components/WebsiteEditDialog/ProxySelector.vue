<template>
  <div class="proxy-config">
    <label class="config-label">代理节点</label>
    <div class="selector-wrapper">
      <div class="select-wrapper">
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
        <div class="select-arrow">
          <i class="fa-solid fa-chevron-down"></i>
        </div>
      </div>
      <button
        @click="$emit('manage-proxies')"
        class="manage-btn"
        type="button"
        :title="'管理代理节点'"
      >
        <i class="fa-solid fa-wave-square"></i>
      </button>
    </div>
    <!-- 代理与 Session 实例关系提示 -->
    <div v-if="modelValue" class="proxy-tip">
      <i class="fa-solid fa-circle-check"></i>
      <span class="info-tip">
        将为此网站创建独立的代理会话，不会影响其他网站的访问策略。
      </span>
    </div>
  </div>
</template>

<script>
import { ref, onMounted, watch } from 'vue'

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

    // 加载代理列表
    const loadProxyList = async () => {
      loading.value = true
      try {
        const result = await window.electron.proxy.getList(1, 10000)
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
      loadProxyList()
    })

    // 监听对话框显示状态，打开时重新加载代理列表
    watch(() => props.dialogVisible, (newVal) => {
      if (newVal) {
        loadProxyList()
      }
    })

    return {
      loading,
      proxyList,
      loadProxyList
    }
  }
}
</script>

<style scoped>
.proxy-config {
  margin-bottom: 0;
}

.config-label {
  display: block;
  margin-bottom: 0.5rem;
  color: #374151;
  font-weight: 500;
  font-size: 0.875rem;
}

.selector-wrapper {
  display: flex;
  gap: 0.75rem;
  align-items: center;
}

.select-wrapper {
  position: relative;
  flex: 1;
}

.form-select {
  width: 100%;
  appearance: none;
  background: white;
  border: 1px solid #e5e7eb;
  color: #1f2937;
  padding: 0.625rem 1rem 0.625rem 1rem;
  padding-right: 2rem;
  border-radius: 0.5rem;
  font-size: 0.875rem;
  font-weight: 500;
  transition: all 0.2s;
  cursor: pointer;
}

.form-select:focus {
  outline: none;
  border-color: #f97316;
  box-shadow: 0 0 0 2px rgba(249, 115, 22, 0.1);
}

.form-select:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.select-arrow {
  position: absolute;
  right: 0;
  top: 0;
  bottom: 0;
  display: flex;
  align-items: center;
  padding-right: 0.5rem;
  pointer-events: none;
  color: #6b7280;
}

.select-arrow i {
  font-size: 0.75rem;
}

.manage-btn {
  padding: 0.625rem;
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 0.5rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
  color: #6b7280;
}

.manage-btn:hover {
  background: #f9fafb;
  color: #374151;
}

.manage-btn i {
  font-size: 0.875rem;
}

/* 代理提示样式 */
.proxy-tip {
  margin-top: 0.5rem;
  padding: 0.5rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.75rem;
  line-height: 1.5;
  color: #059669;
}

.proxy-tip i {
  flex-shrink: 0;
  color: #10b981;
  font-size: 0.75rem;
}

.info-tip {
  color: #059669;
}
</style>
