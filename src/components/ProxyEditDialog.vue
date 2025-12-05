<template>
  <div v-if="show" class="edit-overlay" @click="$emit('close')">
    <div class="edit-dialog" @click.stop>
      <h4>{{ editingProxy ? '编辑代理' : '添加代理' }}</h4>
      <form @submit.prevent="handleSubmit">
        <div class="form-group">
          <label>名称</label>
          <input v-model="form.name" type="text" required placeholder="代理名称" />
        </div>
        <div class="form-group">
          <label>类型</label>
          <select v-model="form.type" required>
            <option value="http">HTTP</option>
            <option value="https">HTTPS</option>
            <option value="socks5">SOCKS5</option>
            <option value="ss">Shadowsocks</option>
            <option value="vmess">VMess</option>
          </select>
        </div>
        <div class="form-group">
          <label>主机</label>
          <input v-model="form.host" type="text" required placeholder="服务器地址" />
        </div>
        <div class="form-group">
          <label>端口</label>
          <input v-model.number="form.port" type="number" required placeholder="端口号" />
        </div>
        
        <!-- HTTP/HTTPS/SOCKS5 认证选项 -->
        <div class="form-group" v-if="['http', 'https', 'socks5'].includes(form.type)">
          <label>用户名（可选）</label>
          <input v-model="form.username" type="text" placeholder="用户名" />
        </div>
        <div class="form-group" v-if="['http', 'https', 'socks5'].includes(form.type)">
          <label>密码（可选）</label>
          <input v-model="form.password" type="password" placeholder="密码" />
        </div>
        
        <!-- Shadowsocks 特有选项 -->
        <div class="form-group" v-if="form.type === 'ss'">
          <label>密码</label>
          <input v-model="form.password" type="password" required placeholder="Shadowsocks 密码" />
        </div>
        <div class="form-group" v-if="form.type === 'ss'">
          <label>加密方法</label>
          <input v-model="form.cipher" type="text" placeholder="aes-256-gcm" />
        </div>
        <div class="form-group" v-if="form.type === 'ss'">
          <label>插件（可选）</label>
          <input v-model="form.plugin" type="text" placeholder="obfs-local" />
        </div>
        <div class="form-group" v-if="form.type === 'ss' && form.plugin">
          <label>插件选项（JSON格式）</label>
          <textarea v-model="form.pluginOpts" rows="2" placeholder='{"mode":"http","host":"example.com"}'></textarea>
        </div>
        <div class="form-group" v-if="form.type === 'ss'">
          <label class="checkbox-label">
            <input type="checkbox" v-model="form.udp" />
            <span>启用 UDP</span>
          </label>
        </div>
        <div class="form-group" v-if="form.type === 'ss'">
          <label class="checkbox-label">
            <input type="checkbox" v-model="form.tfo" />
            <span>启用 TCP Fast Open</span>
          </label>
        </div>
        
        <!-- VMess 特有选项 -->
        <div class="form-group" v-if="form.type === 'vmess'">
          <label>UUID</label>
          <input v-model="form.uuid" type="text" required placeholder="VMess UUID" />
        </div>
        
        <div class="form-actions">
          <button type="button" class="btn-secondary" @click="$emit('close')">取消</button>
          <button type="submit" class="btn-primary" :disabled="saving">
            {{ saving ? '保存中...' : '保存' }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script>
import { ref, watch } from 'vue'

export default {
  name: 'ProxyEditDialog',
  props: {
    show: {
      type: Boolean,
      default: false
    },
    editingProxy: {
      type: Object,
      default: null
    },
    saving: {
      type: Boolean,
      default: false
    }
  },
  emits: ['close', 'save'],
  setup(props, { emit }) {
    const defaultForm = {
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

    const form = ref({ ...defaultForm })

    // 监听 editingProxy 变化，更新表单
    watch(() => props.editingProxy, (proxy) => {
      if (proxy) {
        form.value = {
          ...proxy,
          plugin: proxy.plugin || '',
          pluginOpts: proxy.plugin_opts || '',
          udp: proxy.udp || false,
          tfo: proxy.tfo || false
        }
      } else {
        form.value = { ...defaultForm }
      }
    }, { immediate: true })

    // 监听 show 变化，重置表单
    watch(() => props.show, (show) => {
      if (show && !props.editingProxy) {
        form.value = { ...defaultForm }
      }
    })

    const handleSubmit = () => {
      emit('save', { ...form.value })
    }

    return {
      form,
      handleSubmit
    }
  }
}
</script>

<style scoped>
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
</style>

