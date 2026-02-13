<template>
  <div v-if="show" class="api-settings-overlay" @click.self="$emit('close')">
    <div class="api-settings-panel">
      <div class="panel-header">
        <h3>API 服务设置</h3>
        <button class="close-btn" @click="$emit('close')">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
      </div>

      <div class="panel-body">
        <!-- API 服务器设置 -->
        <div class="settings-group">
          <div class="group-title">API 服务器</div>

          <div class="setting-row">
            <label>启用</label>
            <label class="switch">
              <input type="checkbox" v-model="localConfig.apiServerEnabled" @change="saveConfig" />
              <span class="slider"></span>
            </label>
          </div>

          <div class="setting-row">
            <label>绑定地址</label>
            <input type="text" v-model="localConfig.apiServerHost" @blur="saveConfig" class="input-field input-sm" />
          </div>

          <div class="setting-row">
            <label>端口</label>
            <input type="number" v-model.number="localConfig.apiServerPort" @blur="saveConfig" class="input-field input-sm" />
          </div>

          <div class="setting-row">
            <label>API Key</label>
            <div class="api-key-row">
              <input
                :type="showApiKey ? 'text' : 'password'"
                v-model="localConfig.apiServerKey"
                readonly
                class="input-field input-key"
              />
              <button class="icon-btn" @click="showApiKey = !showApiKey" title="显示/隐藏">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <template v-if="showApiKey">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                    <circle cx="12" cy="12" r="3"/>
                  </template>
                  <template v-else>
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
                    <line x1="1" y1="1" x2="23" y2="23"/>
                  </template>
                </svg>
              </button>
              <button class="icon-btn" @click="copyApiKey" title="复制">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
                </svg>
              </button>
              <button class="icon-btn" @click="regenerateApiKey" title="重新生成">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
                </svg>
              </button>
            </div>
          </div>

          <div class="status-row" v-if="serverStatus">
            <span :class="['status-dot', serverStatus.running ? 'running' : 'stopped']"></span>
            <span class="status-text">
              {{ serverStatus.running ? `运行中 (${localConfig.apiServerHost}:${localConfig.apiServerPort})` : '已停止' }}
            </span>
          </div>
        </div>

        <!-- 网络 Hook 设置 -->
        <div class="settings-group">
          <div class="group-title">全局网络 Hook（旁路转发）</div>

          <div class="setting-row">
            <label>启用</label>
            <label class="switch">
              <input type="checkbox" v-model="localConfig.networkHookEnabled" @change="saveConfig" />
              <span class="slider"></span>
            </label>
          </div>

          <div class="setting-row">
            <label>Hook URL</label>
            <input
              type="text"
              v-model="localConfig.networkHookUrl"
              @blur="saveConfig"
              placeholder="http://127.0.0.1:8080/hook"
              class="input-field"
            />
          </div>

          <div class="hint-text">
            页面的网络请求将以 POST JSON 转发到此地址。可在网站编辑中为单个页面设置独立的 Hook URL。
          </div>
        </div>

        <!-- 使用说明 -->
        <div class="settings-group">
          <div class="group-title">使用说明</div>
          <div class="hint-text">
            <p><strong>外部访问 API：</strong></p>
            <p>GET /api/v1/workspaces — 列出工作空间和页面</p>
            <p>POST /api/v1/execute — 多步骤 JS 执行</p>
            <p>GET /api/v1/traffic?websiteId=xxx — 获取网络流量</p>
            <p style="margin-top: 0.5rem">请求头需携带 <code>X-API-Key</code></p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, reactive, onMounted, watch } from 'vue'

export default {
  name: 'ApiSettingsPanel',
  props: {
    show: {
      type: Boolean,
      default: false
    },
    globalSettings: {
      type: Object,
      required: true
    }
  },
  emits: ['close', 'update-settings'],
  setup(props, { emit }) {
    const showApiKey = ref(false)
    const serverStatus = ref(null)

    const localConfig = reactive({
      apiServerEnabled: true,
      apiServerHost: '127.0.0.1',
      apiServerPort: 13900,
      apiServerKey: '',
      networkHookEnabled: false,
      networkHookUrl: ''
    })

    // 从 props 同步到本地
    const syncFromProps = () => {
      localConfig.apiServerEnabled = props.globalSettings.apiServerEnabled ?? true
      localConfig.apiServerHost = props.globalSettings.apiServerHost ?? '127.0.0.1'
      localConfig.apiServerPort = props.globalSettings.apiServerPort ?? 13900
      localConfig.apiServerKey = props.globalSettings.apiServerKey ?? ''
      localConfig.networkHookEnabled = props.globalSettings.networkHookEnabled ?? false
      localConfig.networkHookUrl = props.globalSettings.networkHookUrl ?? ''
    }

    watch(() => props.show, (newVal) => {
      if (newVal) {
        syncFromProps()
        refreshStatus()
      }
    })

    onMounted(() => {
      syncFromProps()
    })

    const saveConfig = () => {
      emit('update-settings', {
        apiServerEnabled: localConfig.apiServerEnabled,
        apiServerHost: localConfig.apiServerHost,
        apiServerPort: localConfig.apiServerPort,
        apiServerKey: localConfig.apiServerKey,
        networkHookEnabled: localConfig.networkHookEnabled,
        networkHookUrl: localConfig.networkHookUrl
      })

      // 同步到主进程
      if (window.electron?.apiServer) {
        window.electron.apiServer.updateConfig({
          apiServerEnabled: localConfig.apiServerEnabled,
          apiServerHost: localConfig.apiServerHost,
          apiServerPort: localConfig.apiServerPort,
          apiServerKey: localConfig.apiServerKey,
          networkHookEnabled: localConfig.networkHookEnabled,
          networkHookUrl: localConfig.networkHookUrl
        })
      }
    }

    const copyApiKey = async () => {
      try {
        await navigator.clipboard.writeText(localConfig.apiServerKey)
      } catch (e) {
        // fallback
        const ta = document.createElement('textarea')
        ta.value = localConfig.apiServerKey
        document.body.appendChild(ta)
        ta.select()
        document.execCommand('copy')
        document.body.removeChild(ta)
      }
    }

    const regenerateApiKey = () => {
      localConfig.apiServerKey = crypto.randomUUID
        ? crypto.randomUUID()
        : Date.now().toString(36) + Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2)
      saveConfig()
    }

    const refreshStatus = async () => {
      if (window.electron?.apiServer) {
        const result = await window.electron.apiServer.getStatus()
        if (result && result.success) {
          serverStatus.value = result.status
        }
      }
    }

    return {
      localConfig,
      showApiKey,
      serverStatus,
      saveConfig,
      copyApiKey,
      regenerateApiKey
    }
  }
}
</script>

<style scoped>
.api-settings-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.3);
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
}

.api-settings-panel {
  background: white;
  border-radius: 0.75rem;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
  width: 480px;
  max-height: 80vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 1.25rem;
  border-bottom: 1px solid #e2e8f0;
  flex-shrink: 0;
}

.panel-header h3 {
  margin: 0;
  font-size: 1rem;
  font-weight: 600;
  color: #1e293b;
}

.close-btn {
  background: none;
  border: none;
  cursor: pointer;
  color: #64748b;
  padding: 0.25rem;
  border-radius: 0.375rem;
}
.close-btn:hover {
  background: #f1f5f9;
  color: #1e293b;
}

.panel-body {
  padding: 1.25rem;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.settings-group {
  background: #f8fafc;
  border: 1px solid #f1f5f9;
  border-radius: 0.625rem;
  padding: 1rem;
}

.group-title {
  font-size: 0.8125rem;
  font-weight: 600;
  color: #475569;
  margin-bottom: 0.75rem;
}

.setting-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  margin-bottom: 0.625rem;
}

.setting-row label {
  font-size: 0.8125rem;
  color: #64748b;
  white-space: nowrap;
  min-width: 5rem;
}

.input-field {
  flex: 1;
  padding: 0.375rem 0.625rem;
  border: 1px solid #e2e8f0;
  border-radius: 0.375rem;
  font-size: 0.8125rem;
  color: #1e293b;
  background: white;
  outline: none;
  transition: border-color 0.2s;
}
.input-field:focus {
  border-color: #f97316;
}
.input-sm {
  max-width: 160px;
}
.input-key {
  font-family: monospace;
  font-size: 0.75rem;
}

.api-key-row {
  display: flex;
  gap: 0.375rem;
  flex: 1;
  align-items: center;
}

.icon-btn {
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 0.375rem;
  padding: 0.375rem;
  cursor: pointer;
  color: #64748b;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.icon-btn:hover {
  background: #fff7ed;
  color: #f97316;
  border-color: #fdba74;
}

.status-row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-top: 0.5rem;
  padding-top: 0.5rem;
  border-top: 1px solid #f1f5f9;
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}
.status-dot.running {
  background: #22c55e;
  box-shadow: 0 0 4px rgba(34, 197, 94, 0.5);
}
.status-dot.stopped {
  background: #94a3b8;
}

.status-text {
  font-size: 0.75rem;
  color: #64748b;
}

.hint-text {
  font-size: 0.75rem;
  color: #94a3b8;
  line-height: 1.5;
}
.hint-text p {
  margin: 0.125rem 0;
}
.hint-text code {
  background: #e2e8f0;
  padding: 0.125rem 0.375rem;
  border-radius: 0.25rem;
  font-size: 0.6875rem;
}

/* Switch toggle */
.switch {
  position: relative;
  display: inline-block;
  width: 36px;
  height: 20px;
}
.switch input {
  opacity: 0;
  width: 0;
  height: 0;
}
.slider {
  position: absolute;
  cursor: pointer;
  inset: 0;
  background: #cbd5e1;
  border-radius: 20px;
  transition: 0.2s;
}
.slider:before {
  content: '';
  position: absolute;
  height: 16px;
  width: 16px;
  left: 2px;
  bottom: 2px;
  background: white;
  border-radius: 50%;
  transition: 0.2s;
}
input:checked + .slider {
  background: #f97316;
}
input:checked + .slider:before {
  transform: translateX(16px);
}
</style>
