<template>
  <div class="proxy-list">
    <!-- 加载状态 -->
    <div v-if="loading" class="loading-overlay">
      <div class="loading-spinner"></div>
      <p>加载中...</p>
    </div>
    
    <!-- 空状态 -->
    <div v-else-if="proxyList.length === 0" class="empty-state">
      <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
        <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
      </svg>
      <p>暂无代理节点</p>
      <button class="btn-primary" @click="$emit('add')">添加第一个代理</button>
    </div>

    <!-- 代理表格 -->
    <table v-else class="proxy-table">
      <thead>
        <tr>
          <th class="col-checkbox">
            <input 
              type="checkbox" 
              :checked="isAllSelected" 
              @change="$emit('toggle-select-all', $event.target.checked)"
              class="checkbox-input"
            />
          </th>
          <th class="col-name">名称</th>
          <th class="col-type">类型</th>
          <th class="col-address">地址</th>
          <th class="col-status">状态</th>
          <th class="col-actions">操作</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="proxy in proxyList" :key="proxy.id">
          <td class="col-checkbox">
            <input 
              type="checkbox" 
              :checked="selectedProxies.includes(proxy.id)"
              @change="$emit('toggle-select', proxy.id)"
              class="checkbox-input"
            />
          </td>
          <td class="col-name">
            <span class="text-ellipsis" :title="proxy.name">{{ proxy.name }}</span>
          </td>
          <td class="col-type">
            <span class="proxy-type" :class="`type-${proxy.type}`">
              {{ proxy.type.toUpperCase() }}
            </span>
          </td>
          <td class="col-address">
            <span class="text-ellipsis" :title="`${proxy.host}:${proxy.port}`">{{ proxy.host }}:{{ proxy.port }}</span>
          </td>
          <td class="col-status">
            <span class="status-badge" :class="proxy.is_enabled ? 'enabled' : 'disabled'">
              {{ proxy.is_enabled ? '启用' : '禁用' }}
            </span>
          </td>
          <td class="col-actions">
            <div class="actions-row">
              <button 
                class="btn-small btn-test" 
                @click="$emit('test', proxy.id)"
                :disabled="testingId === proxy.id"
                :title="testingId === proxy.id ? '测试中...' : '测试连接'"
              >
                {{ testingId === proxy.id ? '测试中' : '测试' }}
              </button>
              <button class="btn-small btn-edit" @click="$emit('edit', proxy)" title="编辑代理">编辑</button>
              <button class="btn-small btn-delete" @click="$emit('delete', proxy.id)" title="删除代理">删除</button>
            </div>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script>
export default {
  name: 'ProxyTable',
  props: {
    loading: {
      type: Boolean,
      default: false
    },
    proxyList: {
      type: Array,
      default: () => []
    },
    selectedProxies: {
      type: Array,
      default: () => []
    },
    isAllSelected: {
      type: Boolean,
      default: false
    },
    testingId: {
      type: [Number, String],
      default: null
    }
  },
  emits: ['add', 'edit', 'delete', 'test', 'toggle-select', 'toggle-select-all']
}
</script>

<style scoped>
.proxy-list {
  min-height: 200px;
}

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
  table-layout: fixed;
}

.proxy-table th {
  text-align: left;
  padding: 10px 8px;
  background: #f8f8f8;
  font-weight: 600;
  color: #333;
  border-bottom: 2px solid #e0e0e0;
  font-size: 13px;
  white-space: nowrap;
}

.proxy-table td {
  padding: 10px 8px;
  border-bottom: 1px solid #f0f0f0;
  font-size: 13px;
  vertical-align: middle;
}

/* 固定列宽 */
.col-checkbox {
  width: 36px;
  text-align: center;
}

.col-name {
  width: 140px;
}

.col-type {
  width: 70px;
}

.col-address {
  width: 180px;
}

.col-status {
  width: 60px;
}

.col-actions {
  width: 150px;
}

/* 文本省略号 */
.text-ellipsis {
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 100%;
}

.checkbox-input {
  width: 16px;
  height: 16px;
  cursor: pointer;
  accent-color: var(--primary-color, #FF5C00);
}

.proxy-type {
  display: inline-block;
  padding: 3px 6px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 500;
}

.type-http { background: #e3f2fd; color: #1976d2; }
.type-https { background: #e8f5e9; color: #388e3c; }
.type-socks5 { background: #fff3e0; color: #f57c00; }
.type-ss { background: #fce4ec; color: #c2185b; }
.type-vmess { background: #f3e5f5; color: #7b1fa2; }

.status-badge {
  display: inline-block;
  padding: 3px 6px;
  border-radius: 4px;
  font-size: 11px;
}

.status-badge.enabled {
  background: #e8f5e9;
  color: #388e3c;
}

.status-badge.disabled {
  background: #f5f5f5;
  color: #999;
}

/* 操作按钮横向排列 */
.actions-row {
  display: flex;
  flex-direction: row;
  gap: 4px;
  flex-wrap: nowrap;
}

.btn-small {
  padding: 4px 8px;
  border-radius: 4px;
  border: none;
  cursor: pointer;
  font-size: 11px;
  transition: all 0.2s;
  white-space: nowrap;
  flex-shrink: 0;
}

.btn-small:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-test {
  background: #e3f2fd;
  color: #1976d2;
}

.btn-test:hover:not(:disabled) {
  background: #bbdefb;
}

.btn-edit {
  background: #fff3e0;
  color: #f57c00;
}

.btn-edit:hover:not(:disabled) {
  background: #ffe0b2;
}

.btn-delete {
  background: #ffebee;
  color: #d32f2f;
}

.btn-delete:hover:not(:disabled) {
  background: #ffcdd2;
}

.btn-primary {
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
  background: var(--primary-color, #FF5C00);
  color: white;
}

.btn-primary:hover {
  background: var(--primary-hover, #e64e00);
}
</style>

