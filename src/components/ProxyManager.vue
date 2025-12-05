<template>
  <div v-if="show" class="proxy-manager-overlay" @mousedown="handleOverlayMouseDown" @click="handleOverlayClick">
    <div class="proxy-manager-dialog" @mousedown.stop>
      <div class="dialog-header">
        <h3>代理节点管理</h3>
        <button class="close-btn" @click="$emit('close')">×</button>
      </div>

      <div class="dialog-content">
        <!-- 操作栏 -->
        <div class="toolbar">
          <button class="btn-primary" @click="showEditDialog = true; editingProxy = null">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="12" y1="5" x2="12" y2="19"/>
              <line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            添加代理
          </button>
          <button class="btn-primary" @click="showImportSubDialog = true">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
              <polyline points="7 10 12 15 17 10"/>
              <line x1="12" y1="15" x2="12" y2="3"/>
            </svg>
            导入订阅链接
          </button>
          <button class="btn-secondary" @click="loadProxyList" :disabled="loading">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="23 4 23 10 17 10"/>
              <polyline points="1 20 1 14 7 14"/>
              <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
            </svg>
            刷新
          </button>
          
          <!-- 批量操作 -->
          <div class="batch-actions" v-if="selectedProxies.length > 0">
            <span class="selected-count">已选择 {{ selectedProxies.length }} 项</span>
            <button class="btn-success" @click="batchEnable" :disabled="batchOperating">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
              批量启用
            </button>
            <button class="btn-danger" @click="batchDelete" :disabled="batchOperating">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="3 6 5 6 21 6"/>
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
              </svg>
              批量删除
            </button>
          </div>
        </div>

        <!-- 代理列表 -->
        <ProxyTable
          :loading="loading"
          :proxy-list="proxyList"
          :selected-proxies="selectedProxies"
          :is-all-selected="isAllSelected"
          :testing-id="testingId"
          @add="showEditDialog = true; editingProxy = null"
          @edit="handleEdit"
          @delete="deleteProxy"
          @test="testProxy"
          @toggle-select="toggleSelectProxy"
          @toggle-select-all="toggleSelectAll"
        />
      </div>
    </div>

    <!-- 添加/编辑代理对话框 -->
    <ProxyEditDialog
      :show="showEditDialog"
      :editing-proxy="editingProxy"
      :saving="saving"
      @close="showEditDialog = false"
      @save="handleSave"
    />

    <!-- 导入订阅链接对话框 -->
    <ProxyImportDialog
      :show="showImportSubDialog"
      :importing="importing"
      @close="showImportSubDialog = false"
      @import="handleImport"
    />
  </div>
</template>

<script>
import { ref, onMounted, watch } from 'vue'
import ProxyTable from './ProxyTable.vue'
import ProxyEditDialog from './ProxyEditDialog.vue'
import ProxyImportDialog from './ProxyImportDialog.vue'
import { useProxyOperations } from '../composables/useProxyOperations'

export default {
  name: 'ProxyManager',
  components: {
    ProxyTable,
    ProxyEditDialog,
    ProxyImportDialog
  },
  props: {
    show: {
      type: Boolean,
      default: false
    }
  },
  emits: ['close'],
  setup(props, { emit }) {
    // 对话框状态
    const showEditDialog = ref(false)
    const showImportSubDialog = ref(false)
    const editingProxy = ref(null)

    // 使用 composable
    const {
      loading,
      saving,
      importing,
      testingId,
      proxyList,
      selectedProxies,
      batchOperating,
      isAllSelected,
      loadProxyList,
      saveProxy,
      deleteProxy,
      testProxy,
      importSubscription,
      toggleSelectAll,
      toggleSelectProxy,
      batchEnable,
      batchDelete,
      clearSelection
    } = useProxyOperations()

    // 处理编辑
    const handleEdit = (proxy) => {
      editingProxy.value = proxy
      showEditDialog.value = true
    }

    // 处理保存
    const handleSave = async (formData) => {
      const success = await saveProxy(formData, editingProxy.value)
      if (success) {
        showEditDialog.value = false
        editingProxy.value = null
      }
    }

    // 处理导入
    const handleImport = async (url) => {
      const success = await importSubscription(url)
      if (success) {
        showImportSubDialog.value = false
      }
    }

    // 处理遮罩点击
    const handleOverlayMouseDown = (e) => {
      if (e.target === e.currentTarget) {
        emit('close')
      }
    }

    const handleOverlayClick = (e) => {
      if (e.target === e.currentTarget) {
        emit('close')
      }
    }

    onMounted(() => {
      if (props.show) {
        loadProxyList()
      }
    })

    // 监听 show 变化
    watch(() => props.show, (newVal) => {
      if (newVal) {
        loadProxyList()
      } else {
        clearSelection()
      }
    })

    return {
      // 对话框状态
      showEditDialog,
      showImportSubDialog,
      editingProxy,
      // Composable 状态
      loading,
      saving,
      importing,
      testingId,
      proxyList,
      selectedProxies,
      batchOperating,
      isAllSelected,
      // 方法
      loadProxyList,
      deleteProxy,
      testProxy,
      toggleSelectAll,
      toggleSelectProxy,
      batchEnable,
      batchDelete,
      handleEdit,
      handleSave,
      handleImport,
      handleOverlayMouseDown,
      handleOverlayClick
    }
  }
}
</script>

<style scoped>
.proxy-manager-overlay {
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
}

.proxy-manager-dialog {
  background: white;
  border-radius: 12px;
  width: 90%;
  max-width: 900px;
  max-height: 80vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
}

.dialog-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  border-bottom: 1px solid #e0e0e0;
}

.dialog-header h3 {
  margin: 0;
  color: var(--primary-color, #FF5C00);
  font-size: 20px;
}

.close-btn {
  background: none;
  border: none;
  font-size: 28px;
  cursor: pointer;
  color: #999;
  line-height: 1;
  padding: 0;
  width: 32px;
  height: 32px;
}

.close-btn:hover {
  color: #333;
}

.dialog-content {
  flex: 1;
  overflow-y: auto;
  padding: 24px;
}

.toolbar {
  display: flex;
  gap: 12px;
  margin-bottom: 20px;
  flex-wrap: wrap;
}

.btn-primary,
.btn-secondary {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 10px 16px;
  border-radius: 6px;
  border: none;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.3s;
}

.btn-primary {
  background: var(--primary-color, #FF5C00);
  color: white;
}

.btn-primary:hover {
  background: var(--primary-hover, #e64e00);
}

.btn-secondary {
  background: #f0f0f0;
  color: #666;
}

.btn-secondary:hover {
  background: #e0e0e0;
}

.btn-primary:disabled,
.btn-secondary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.batch-actions {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-left: auto;
  padding-left: 12px;
  border-left: 1px solid #e0e0e0;
}

.selected-count {
  font-size: 14px;
  color: #666;
  font-weight: 500;
}

.btn-success {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 10px 16px;
  border-radius: 6px;
  border: none;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.3s;
  background: #4caf50;
  color: white;
}

.btn-success:hover:not(:disabled) {
  background: #45a049;
}

.btn-success:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-danger {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 10px 16px;
  border-radius: 6px;
  border: none;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.3s;
  background: #f44336;
  color: white;
}

.btn-danger:hover:not(:disabled) {
  background: #da190b;
}

.btn-danger:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
