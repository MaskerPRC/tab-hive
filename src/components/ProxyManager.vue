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
          <button class="btn-primary" @click="showAddDialog">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="12" y1="5" x2="12" y2="19"/>
              <line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            添加代理
          </button>
          <button class="btn-primary" @click="showImportDialog">
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
        <div class="proxy-list">
          <!-- 加载状态 -->
          <div v-if="loading" class="loading-overlay">
            <div class="loading-spinner"></div>
            <p>加载中...</p>
          </div>
          <div v-if="!loading && proxyList.length === 0" class="empty-state">
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
              <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
            </svg>
            <p>暂无代理节点</p>
            <button class="btn-primary" @click="showAddDialog">添加第一个代理</button>
          </div>

          <table v-else-if="!loading" class="proxy-table">
            <thead>
              <tr>
                <th class="checkbox-column">
                  <input 
                    type="checkbox" 
                    :checked="isAllSelected" 
                    @change="toggleSelectAll"
                    class="checkbox-input"
                  />
                </th>
                <th>名称</th>
                <th>类型</th>
                <th>地址</th>
                <th>状态</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="proxy in proxyList" :key="proxy.id">
                <td class="checkbox-column">
                  <input 
                    type="checkbox" 
                    :checked="selectedProxies.includes(proxy.id)"
                    @change="toggleSelectProxy(proxy.id)"
                    class="checkbox-input"
                  />
                </td>
                <td>{{ proxy.name }}</td>
                <td>
                  <span class="proxy-type" :class="`type-${proxy.type}`">
                    {{ proxy.type.toUpperCase() }}
                  </span>
                </td>
                <td>{{ proxy.host }}:{{ proxy.port }}</td>
                <td>
                  <span class="status-badge" :class="proxy.is_enabled ? 'enabled' : 'disabled'">
                    {{ proxy.is_enabled ? '启用' : '禁用' }}
                  </span>
                </td>
                <td class="actions">
                  <button 
                    class="btn-small btn-test" 
                    @click="testProxy(proxy.id)"
                    :disabled="testingId === proxy.id"
                  >
                    {{ testingId === proxy.id ? '测试中...' : '测试' }}
                  </button>
                  <button class="btn-small btn-edit" @click="editProxy(proxy)">编辑</button>
                  <button class="btn-small btn-delete" @click="deleteProxy(proxy.id)">删除</button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- 添加/编辑代理对话框 -->
    <div v-if="showEditDialog" class="edit-overlay" @click="showEditDialog = false">
      <div class="edit-dialog" @click.stop>
        <h4>{{ editingProxy ? '编辑代理' : '添加代理' }}</h4>
        <form @submit.prevent="saveProxy">
          <div class="form-group">
            <label>名称</label>
            <input v-model="proxyForm.name" type="text" required placeholder="代理名称" />
          </div>
          <div class="form-group">
            <label>类型</label>
            <select v-model="proxyForm.type" required>
              <option value="http">HTTP</option>
              <option value="https">HTTPS</option>
              <option value="socks5">SOCKS5</option>
              <option value="ss">Shadowsocks</option>
              <option value="vmess">VMess</option>
            </select>
          </div>
          <div class="form-group">
            <label>主机</label>
            <input v-model="proxyForm.host" type="text" required placeholder="服务器地址" />
          </div>
          <div class="form-group">
            <label>端口</label>
            <input v-model.number="proxyForm.port" type="number" required placeholder="端口号" />
          </div>
          <div class="form-group" v-if="['http', 'https', 'socks5'].includes(proxyForm.type)">
            <label>用户名（可选）</label>
            <input v-model="proxyForm.username" type="text" placeholder="用户名" />
          </div>
          <div class="form-group" v-if="['http', 'https', 'socks5'].includes(proxyForm.type)">
            <label>密码（可选）</label>
            <input v-model="proxyForm.password" type="password" placeholder="密码" />
          </div>
          <div class="form-group" v-if="proxyForm.type === 'ss'">
            <label>密码</label>
            <input v-model="proxyForm.password" type="password" required placeholder="Shadowsocks 密码" />
          </div>
          <div class="form-group" v-if="proxyForm.type === 'ss'">
            <label>加密方法</label>
            <input v-model="proxyForm.cipher" type="text" placeholder="aes-256-gcm" />
          </div>
          <div class="form-group" v-if="proxyForm.type === 'ss'">
            <label>插件（可选）</label>
            <input v-model="proxyForm.plugin" type="text" placeholder="obfs-local" />
          </div>
          <div class="form-group" v-if="proxyForm.type === 'ss' && proxyForm.plugin">
            <label>插件选项（JSON格式）</label>
            <textarea v-model="proxyForm.pluginOpts" rows="2" placeholder='{"mode":"http","host":"example.com"}'></textarea>
          </div>
          <div class="form-group" v-if="proxyForm.type === 'ss'">
            <label class="checkbox-label">
              <input type="checkbox" v-model="proxyForm.udp" />
              <span>启用 UDP</span>
            </label>
          </div>
          <div class="form-group" v-if="proxyForm.type === 'ss'">
            <label class="checkbox-label">
              <input type="checkbox" v-model="proxyForm.tfo" />
              <span>启用 TCP Fast Open</span>
            </label>
          </div>
          <div class="form-group" v-if="proxyForm.type === 'vmess'">
            <label>UUID</label>
            <input v-model="proxyForm.uuid" type="text" required placeholder="VMess UUID" />
          </div>
          <div class="form-actions">
            <button type="button" class="btn-secondary" @click="showEditDialog = false">取消</button>
            <button type="submit" class="btn-primary" :disabled="saving">
              {{ saving ? '保存中...' : '保存' }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- 导入订阅链接对话框 -->
    <div v-if="showImportSubDialog" class="edit-overlay" @click="showImportSubDialog = false">
      <div class="edit-dialog" @click.stop>
        <h4>导入订阅链接</h4>
        <div class="form-group">
          <label>订阅链接</label>
          <textarea 
            v-model="subscriptionUrl" 
            rows="3" 
            placeholder="输入订阅链接（支持 vmess://、ss:// 等格式）"
          ></textarea>
        </div>
        <div class="form-actions">
          <button type="button" class="btn-secondary" @click="showImportSubDialog = false">取消</button>
          <button type="button" class="btn-primary" @click="importSubscription" :disabled="importing">
            {{ importing ? '导入中...' : '导入' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted, watch } from 'vue'

export default {
  name: 'ProxyManager',
  props: {
    show: {
      type: Boolean,
      default: false
    }
  },
  emits: ['close'],
  setup(props, { emit }) {
    const loading = ref(false)
    const saving = ref(false)
    const importing = ref(false)
    const testingId = ref(null)
    const proxyList = ref([])
    const showEditDialog = ref(false)
    const showImportSubDialog = ref(false)
    const editingProxy = ref(null)
    const subscriptionUrl = ref('')
    const selectedProxies = ref([])
    const batchOperating = ref(false)

    const proxyForm = ref({
      name: '',
      type: 'http',
      host: '',
      port: 8080,
      username: '',
      password: '',
      cipher: '',
      uuid: '',
      plugin: '',
      pluginOpts: '',
      udp: false,
      tfo: false
    })

    // 加载代理列表
    const loadProxyList = async () => {
      if (!window.electron?.proxy) return
      
      loading.value = true
      try {
        const result = await window.electron.proxy.getList(1, 100)
        if (result.success) {
          proxyList.value = result.data.list || []
        } else {
          alert('加载失败: ' + result.error)
        }
      } catch (error) {
        console.error('加载代理列表失败:', error)
        alert('加载失败: ' + error.message)
      } finally {
        loading.value = false
      }
    }

    // 显示添加对话框
    const showAddDialog = () => {
      editingProxy.value = null
      proxyForm.value = {
        name: '',
        type: 'http',
        host: '',
        port: 8080,
        username: '',
        password: '',
        cipher: '',
        uuid: '',
        plugin: '',
        pluginOpts: '',
        udp: false,
        tfo: false
      }
      showEditDialog.value = true
    }

    // 编辑代理
    const editProxy = (proxy) => {
      editingProxy.value = proxy
      proxyForm.value = { 
        ...proxy,
        plugin: proxy.plugin || '',
        pluginOpts: proxy.plugin_opts || '',
        udp: proxy.udp || false,
        tfo: proxy.tfo || false
      }
      showEditDialog.value = true
    }

    // 保存代理
    const saveProxy = async () => {
      if (!window.electron?.proxy) return
      
      saving.value = true
      try {
        let result
        if (editingProxy.value) {
          result = await window.electron.proxy.update(editingProxy.value.id, proxyForm.value)
        } else {
          result = await window.electron.proxy.add(proxyForm.value)
        }
        
        if (result.success) {
          showEditDialog.value = false
          loadProxyList()
          alert(editingProxy.value ? '更新成功' : '添加成功')
        } else {
          alert('保存失败: ' + result.error)
        }
      } catch (error) {
        console.error('保存代理失败:', error)
        alert('保存失败: ' + error.message)
      } finally {
        saving.value = false
      }
    }

    // 删除代理
    const deleteProxy = async (proxyId) => {
      if (!confirm('确定要删除这个代理吗？')) return
      if (!window.electron?.proxy) return
      
      try {
        const result = await window.electron.proxy.delete(proxyId)
        if (result.success) {
          loadProxyList()
          alert('删除成功')
        } else {
          alert('删除失败: ' + result.error)
        }
      } catch (error) {
        console.error('删除代理失败:', error)
        alert('删除失败: ' + error.message)
      }
    }

    // 测试代理
    const testProxy = async (proxyId) => {
      if (!window.electron?.proxy) return
      
      testingId.value = proxyId
      try {
        const result = await window.electron.proxy.test(proxyId)
        if (result.success) {
          alert('代理连接成功')
        } else {
          alert('代理连接失败: ' + result.error)
        }
      } catch (error) {
        console.error('测试代理失败:', error)
        alert('测试失败: ' + error.message)
      } finally {
        testingId.value = null
      }
    }

    // 显示导入对话框
    const showImportDialog = () => {
      subscriptionUrl.value = ''
      showImportSubDialog.value = true
    }

    // 导入订阅链接
    const importSubscription = async () => {
      if (!subscriptionUrl.value.trim()) {
        alert('请输入订阅链接')
        return
      }
      if (!window.electron?.proxy) return
      
      importing.value = true
      try {
        const result = await window.electron.proxy.importSubscription(subscriptionUrl.value.trim())
        if (result.success) {
          showImportSubDialog.value = false
          loadProxyList()
          alert(`导入成功！共导入 ${result.data.imported} 个代理节点`)
        } else {
          alert('导入失败: ' + result.error)
        }
      } catch (error) {
        console.error('导入订阅链接失败:', error)
        alert('导入失败: ' + error.message)
      } finally {
        importing.value = false
      }
    }

    // 全选/取消全选
    const toggleSelectAll = (event) => {
      if (event.target.checked) {
        selectedProxies.value = proxyList.value.map(proxy => proxy.id)
      } else {
        selectedProxies.value = []
      }
    }

    // 切换单个代理的选择状态
    const toggleSelectProxy = (proxyId) => {
      const index = selectedProxies.value.indexOf(proxyId)
      if (index > -1) {
        selectedProxies.value.splice(index, 1)
      } else {
        selectedProxies.value.push(proxyId)
      }
    }

    // 计算是否全选
    const isAllSelected = computed(() => {
      return proxyList.value.length > 0 && selectedProxies.value.length === proxyList.value.length
    })

    // 批量启用
    const batchEnable = async () => {
      if (selectedProxies.value.length === 0) {
        alert('请先选择要启用的代理')
        return
      }
      if (!confirm(`确定要启用选中的 ${selectedProxies.value.length} 个代理吗？`)) return
      if (!window.electron?.proxy) return

      batchOperating.value = true
      let successCount = 0
      let failCount = 0

      try {
        for (const proxyId of selectedProxies.value) {
          const proxy = proxyList.value.find(p => p.id === proxyId)
          if (!proxy) continue

          try {
            // 确保字段名正确映射，与 editProxy 保持一致
            const updateData = {
              ...proxy,
              plugin: proxy.plugin || '',
              pluginOpts: proxy.plugin_opts || proxy.pluginOpts || '',
              udp: proxy.udp || false,
              tfo: proxy.tfo || false,
              is_enabled: true
            }
            const result = await window.electron.proxy.update(proxyId, updateData)
            if (result.success) {
              successCount++
            } else {
              failCount++
            }
          } catch (error) {
            console.error(`启用代理 ${proxyId} 失败:`, error)
            failCount++
          }
        }

        selectedProxies.value = []
        loadProxyList()
        
        if (failCount === 0) {
          alert(`成功启用 ${successCount} 个代理`)
        } else {
          alert(`启用完成：成功 ${successCount} 个，失败 ${failCount} 个`)
        }
      } catch (error) {
        console.error('批量启用失败:', error)
        alert('批量启用失败: ' + error.message)
      } finally {
        batchOperating.value = false
      }
    }

    // 批量删除
    const batchDelete = async () => {
      if (selectedProxies.value.length === 0) {
        alert('请先选择要删除的代理')
        return
      }
      if (!confirm(`确定要删除选中的 ${selectedProxies.value.length} 个代理吗？此操作不可恢复！`)) return
      if (!window.electron?.proxy) return

      batchOperating.value = true
      let successCount = 0
      let failCount = 0

      try {
        for (const proxyId of selectedProxies.value) {
          try {
            const result = await window.electron.proxy.delete(proxyId)
            if (result.success) {
              successCount++
            } else {
              failCount++
            }
          } catch (error) {
            console.error(`删除代理 ${proxyId} 失败:`, error)
            failCount++
          }
        }

        selectedProxies.value = []
        loadProxyList()
        
        if (failCount === 0) {
          alert(`成功删除 ${successCount} 个代理`)
        } else {
          alert(`删除完成：成功 ${successCount} 个，失败 ${failCount} 个`)
        }
      } catch (error) {
        console.error('批量删除失败:', error)
        alert('批量删除失败: ' + error.message)
      } finally {
        batchOperating.value = false
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
        // 关闭对话框时清空选择
        selectedProxies.value = []
      }
    })

    // 监听代理列表变化，清空已删除的代理选择
    watch(proxyList, (newList) => {
      selectedProxies.value = selectedProxies.value.filter(id => 
        newList.some(proxy => proxy.id === id)
      )
    })

    return {
      loading,
      saving,
      importing,
      testingId,
      proxyList,
      showEditDialog,
      showImportSubDialog,
      editingProxy,
      subscriptionUrl,
      proxyForm,
      selectedProxies,
      batchOperating,
      isAllSelected,
      loadProxyList,
      showAddDialog,
      editProxy,
      saveProxy,
      deleteProxy,
      testProxy,
      showImportDialog,
      importSubscription,
      toggleSelectAll,
      toggleSelectProxy,
      batchEnable,
      batchDelete,
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

.checkbox-column {
  width: 40px;
  text-align: center;
}

.checkbox-input {
  width: 18px;
  height: 18px;
  cursor: pointer;
  accent-color: var(--primary-color, #FF5C00);
}

.empty-state {
  text-align: center;
  padding: 60px 20px;
  color: #999;
}

.empty-state svg {
  margin-bottom: 20px;
  opacity: 0.5;
}

.empty-state p {
  margin: 16px 0;
  font-size: 16px;
}

.proxy-table {
  width: 100%;
  border-collapse: collapse;
}

.proxy-table th {
  text-align: left;
  padding: 12px;
  background: #f8f8f8;
  font-weight: 600;
  color: #333;
  border-bottom: 2px solid #e0e0e0;
}

.proxy-table td {
  padding: 12px;
  border-bottom: 1px solid #f0f0f0;
}

.proxy-type {
  display: inline-block;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
}

.type-http { background: #e3f2fd; color: #1976d2; }
.type-https { background: #e8f5e9; color: #388e3c; }
.type-socks5 { background: #fff3e0; color: #f57c00; }
.type-ss { background: #fce4ec; color: #c2185b; }
.type-vmess { background: #f3e5f5; color: #7b1fa2; }

.status-badge {
  display: inline-block;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
}

.status-badge.enabled {
  background: #e8f5e9;
  color: #388e3c;
}

.status-badge.disabled {
  background: #f5f5f5;
  color: #999;
}

.actions {
  display: flex;
  gap: 8px;
}

.btn-small {
  padding: 6px 12px;
  border-radius: 4px;
  border: none;
  cursor: pointer;
  font-size: 12px;
  transition: all 0.3s;
}

.btn-test {
  background: #e3f2fd;
  color: #1976d2;
}

.btn-test:hover {
  background: #bbdefb;
}

.btn-edit {
  background: #fff3e0;
  color: #f57c00;
}

.btn-edit:hover {
  background: #ffe0b2;
}

.btn-delete {
  background: #ffebee;
  color: #d32f2f;
}

.btn-delete:hover {
  background: #ffcdd2;
}

.edit-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10001;
}

.edit-dialog {
  background: white;
  border-radius: 12px;
  padding: 24px;
  width: 90%;
  max-width: 500px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
}

.edit-dialog h4 {
  margin: 0 0 20px 0;
  color: var(--primary-color, #FF5C00);
}

.form-group {
  margin-bottom: 16px;
}

.form-group label {
  display: block;
  margin-bottom: 6px;
  font-weight: 500;
  color: #333;
}

.form-group input,
.form-group select,
.form-group textarea {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 14px;
  font-family: inherit;
}

.form-group textarea {
  resize: vertical;
  min-height: 80px;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  margin-bottom: 0 !important;
}

.checkbox-label input[type="checkbox"] {
  width: auto;
  cursor: pointer;
}

.checkbox-label span {
  font-weight: normal;
  color: #666;
}

 .form-actions {
   display: flex;
   gap: 12px;
   justify-content: flex-end;
   margin-top: 24px;
 }
 
 /* 加载状态 */
 .loading-overlay {
   display: flex;
   flex-direction: column;
   align-items: center;
   justify-content: center;
   padding: 60px 20px;
   color: #999;
 }
 
 .loading-spinner {
   width: 40px;
   height: 40px;
   border: 4px solid #f3f3f3;
   border-top: 4px solid var(--primary-color, #FF5C00);
   border-radius: 50%;
   animation: spin 1s linear infinite;
   margin-bottom: 16px;
 }
 
 @keyframes spin {
   0% { transform: rotate(0deg); }
   100% { transform: rotate(360deg); }
 }
 
 .loading-overlay p {
   margin: 0;
   font-size: 14px;
 }
 </style>
