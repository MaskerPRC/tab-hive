<template>
  <div class="credential-manager" v-if="visible">
    <div class="manager-overlay" @click="$emit('close')"></div>
    
    <div class="manager-dialog">
      <div class="manager-header">
        <h2>🔐 密码管理器</h2>
        <button @click="$emit('close')" class="close-btn">✕</button>
      </div>

      <!-- 未解锁状态 -->
      <div v-if="manager.isLocked.value" class="unlock-section">
        <div v-if="!manager.hasMasterPassword.value" class="setup-master">
          <h3>设置主密码</h3>
          <p>请设置一个主密码来保护您的凭证。主密码至少6个字符。</p>
          <input 
            v-model="newMasterPassword" 
            type="password" 
            placeholder="输入主密码"
            @keyup.enter="setupMasterPassword"
          />
          <input 
            v-model="confirmMasterPassword" 
            type="password" 
            placeholder="确认主密码"
            @keyup.enter="setupMasterPassword"
          />
          <button @click="setupMasterPassword" :disabled="!canSetup">
            设置主密码
          </button>
          <p v-if="error" class="error">{{ error }}</p>
        </div>

        <div v-else class="unlock-master">
          <h3>解锁密码管理器</h3>
          <p>请输入主密码以访问您的凭证。</p>
          <input 
            v-model="unlockPassword" 
            type="password" 
            placeholder="输入主密码"
            @keyup.enter="unlockManager"
          />
          <button @click="unlockManager" :disabled="!unlockPassword">
            解锁
          </button>
          <p v-if="error" class="error">{{ error }}</p>
        </div>
      </div>

      <!-- 已解锁状态 -->
      <div v-else class="manager-content">
        <div class="manager-toolbar">
          <button @click="showAddDialog = true" class="btn-primary">
            ➕ 添加凭证
          </button>
          <button @click="exportCreds" class="btn-secondary">
            📤 导出
          </button>
          <button @click="triggerImport" class="btn-secondary">
            📥 导入
          </button>
          <input 
            ref="importFileInput" 
            type="file" 
            accept=".json"
            style="display: none"
            @change="importCreds"
          />
          <button @click="manager.lock()" class="btn-lock">
            🔒 锁定
          </button>
        </div>

        <div class="credentials-list">
          <div v-if="manager.credentials.value.length === 0" class="empty-state">
            <p>暂无保存的凭证</p>
            <p class="hint">点击"添加凭证"开始保存您的账号密码</p>
          </div>

          <div 
            v-for="cred in manager.credentials.value" 
            :key="cred.id"
            class="credential-item"
          >
            <div class="cred-info">
              <div class="cred-url">{{ getDisplayUrl(cred.url) }}</div>
              <div class="cred-username">{{ cred.username }}</div>
              <div v-if="cred.note" class="cred-note">{{ cred.note }}</div>
              <div class="cred-meta">
                <span class="cred-auto-login" v-if="cred.autoLogin">🤖 自动登录</span>
                <span class="cred-date">{{ formatDate(cred.createdAt) }}</span>
              </div>
            </div>
            
            <div class="cred-actions">
              <button @click="fillForm(cred)" class="btn-action" title="填充表单">
                📝
              </button>
              <button @click="loginAuto(cred)" class="btn-action" title="自动登录">
                🚀
              </button>
              <button @click="editCredential(cred)" class="btn-action" title="编辑">
                ✏️
              </button>
              <button @click="showPassword(cred)" class="btn-action" title="查看密码">
                👁️
              </button>
              <button @click="deleteCredential(cred.id)" class="btn-action btn-danger" title="删除">
                🗑️
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- 添加/编辑凭证对话框 -->
      <div v-if="showAddDialog" class="credential-dialog">
        <div class="dialog-overlay" @click="cancelEdit"></div>
        <div class="dialog-content">
          <h3>{{ editingCred ? '编辑凭证' : '添加凭证' }}</h3>
          
          <div class="form-group">
            <label>网站 URL *</label>
            <input v-model="editForm.url" type="url" placeholder="https://example.com" />
          </div>

          <div class="form-group">
            <label>用户名/邮箱 *</label>
            <input v-model="editForm.username" type="text" placeholder="user@example.com" />
          </div>

          <div class="form-group">
            <label>密码 *</label>
            <input v-model="editForm.password" type="password" placeholder="••••••••" />
          </div>

          <div class="form-group">
            <label>备注</label>
            <input v-model="editForm.note" type="text" placeholder="可选的备注信息" />
          </div>

          <div class="form-group">
            <label>
              <input v-model="editForm.autoLogin" type="checkbox" />
              启用自动登录
            </label>
          </div>

          <div class="dialog-actions">
            <button @click="saveCredential" class="btn-primary">
              {{ editingCred ? '保存' : '添加' }}
            </button>
            <button @click="cancelEdit" class="btn-secondary">取消</button>
          </div>
        </div>
      </div>

      <!-- 查看密码对话框 -->
      <div v-if="showPasswordDialog" class="password-dialog">
        <div class="dialog-overlay" @click="showPasswordDialog = false"></div>
        <div class="dialog-content">
          <h3>密码</h3>
          <div class="password-display">
            <code>{{ displayPassword }}</code>
          </div>
          <button @click="copyPassword" class="btn-primary">复制密码</button>
          <button @click="showPasswordDialog = false" class="btn-secondary">关闭</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed } from 'vue'
import { useCredentialManager } from '../composables/useCredentialManager'

export default {
  name: 'CredentialManager',
  props: {
    visible: {
      type: Boolean,
      default: false
    },
    targetIframe: {
      type: Object,
      default: null
    }
  },
  emits: ['close'],
  setup(props) {
    const manager = useCredentialManager()

    // 设置主密码相关
    const newMasterPassword = ref('')
    const confirmMasterPassword = ref('')
    const unlockPassword = ref('')
    const error = ref('')

    // 凭证编辑相关
    const showAddDialog = ref(false)
    const editingCred = ref(null)
    const editForm = ref({
      url: '',
      username: '',
      password: '',
      note: '',
      autoLogin: false
    })

    // 查看密码相关
    const showPasswordDialog = ref(false)
    const displayPassword = ref('')

    // 导入文件相关
    const importFileInput = ref(null)

    const canSetup = computed(() => {
      return newMasterPassword.value.length >= 6 && 
             newMasterPassword.value === confirmMasterPassword.value
    })

    // 设置主密码
    const setupMasterPassword = () => {
      if (!canSetup.value) {
        error.value = '密码长度至少6个字符，且两次输入必须一致'
        return
      }

      try {
        manager.initializeMasterPassword(newMasterPassword.value)
        error.value = ''
        newMasterPassword.value = ''
        confirmMasterPassword.value = ''
      } catch (e) {
        error.value = e.message
      }
    }

    // 解锁管理器
    const unlockManager = () => {
      try {
        manager.verifyMasterPassword(unlockPassword.value)
        error.value = ''
        unlockPassword.value = ''
      } catch (e) {
        error.value = e.message
      }
    }

    // 编辑凭证
    const editCredential = (cred) => {
      editingCred.value = cred
      try {
        const fullCred = manager.getCredentialWithPassword(cred.id)
        editForm.value = {
          url: fullCred.url,
          username: fullCred.username,
          password: fullCred.password,
          note: fullCred.note || '',
          autoLogin: fullCred.autoLogin || false
        }
        showAddDialog.value = true
      } catch (e) {
        alert('获取凭证失败: ' + e.message)
      }
    }

    // 保存凭证
    const saveCredential = () => {
      if (!editForm.value.url || !editForm.value.username || !editForm.value.password) {
        alert('URL、用户名和密码不能为空')
        return
      }

      try {
        if (editingCred.value) {
          // 更新
          manager.updateCredential(editingCred.value.id, editForm.value)
        } else {
          // 添加
          manager.addCredential(editForm.value)
        }
        cancelEdit()
      } catch (e) {
        alert('保存失败: ' + e.message)
      }
    }

    // 取消编辑
    const cancelEdit = () => {
      showAddDialog.value = false
      editingCred.value = null
      editForm.value = {
        url: '',
        username: '',
        password: '',
        note: '',
        autoLogin: false
      }
    }

    // 删除凭证
    const deleteCredential = (id) => {
      if (confirm('确定要删除这个凭证吗？')) {
        try {
          manager.deleteCredential(id)
        } catch (e) {
          alert('删除失败: ' + e.message)
        }
      }
    }

    // 查看密码
    const showPassword = (cred) => {
      try {
        displayPassword.value = manager.getDecryptedPassword(cred.id)
        showPasswordDialog.value = true
      } catch (e) {
        alert('获取密码失败: ' + e.message)
      }
    }

    // 复制密码
    const copyPassword = () => {
      navigator.clipboard.writeText(displayPassword.value)
        .then(() => {
          alert('密码已复制到剪贴板')
          showPasswordDialog.value = false
        })
        .catch(() => alert('复制失败'))
    }

    // 填充表单
    const fillForm = async (cred) => {
      if (!props.targetIframe) {
        alert('请先选择一个网站')
        return
      }

      try {
        await manager.autoFillForm(props.targetIframe, cred.id)
        alert('✅ 表单填充成功')
      } catch (e) {
        alert('❌ 填充失败: ' + e.message)
      }
    }

    // 自动登录
    const loginAuto = async (cred) => {
      if (!props.targetIframe) {
        alert('请先选择一个网站')
        return
      }

      try {
        await manager.autoLogin(props.targetIframe, cred.id)
        alert('✅ 自动登录成功')
      } catch (e) {
        alert('❌ 登录失败: ' + e.message)
      }
    }

    // 导出凭证
    const exportCreds = () => {
      try {
        manager.exportCredentials()
        alert('✅ 凭证已导出')
      } catch (e) {
        alert('❌ 导出失败: ' + e.message)
      }
    }

    // 触发导入
    const triggerImport = () => {
      importFileInput.value?.click()
    }

    // 导入凭证
    const importCreds = async (event) => {
      const file = event.target.files[0]
      if (!file) return

      try {
        const count = await manager.importCredentials(file)
        alert(`✅ 成功导入 ${count} 个凭证`)
        event.target.value = '' // 重置文件输入
      } catch (e) {
        alert('❌ 导入失败: ' + e.message)
      }
    }

    // 工具函数
    const getDisplayUrl = (url) => {
      try {
        const urlObj = new URL(url)
        return urlObj.hostname
      } catch (e) {
        return url
      }
    }

    const formatDate = (dateStr) => {
      const date = new Date(dateStr)
      return date.toLocaleDateString('zh-CN')
    }

    return {
      manager,
      newMasterPassword,
      confirmMasterPassword,
      unlockPassword,
      error,
      canSetup,
      setupMasterPassword,
      unlockManager,
      
      showAddDialog,
      editingCred,
      editForm,
      editCredential,
      saveCredential,
      cancelEdit,
      deleteCredential,
      
      showPasswordDialog,
      displayPassword,
      showPassword,
      copyPassword,
      
      fillForm,
      loginAuto,
      
      exportCreds,
      triggerImport,
      importCreds,
      importFileInput,
      
      getDisplayUrl,
      formatDate
    }
  }
}
</script>

<style scoped>
.credential-manager {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 10000;
  display: flex;
  align-items: center;
  justify-content: center;
}

.manager-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(4px);
}

.manager-dialog {
  position: relative;
  width: 700px;
  max-height: 80vh;
  background: white;
  border-radius: 16px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.manager-header {
  padding: 24px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.manager-header h2 {
  margin: 0;
  font-size: 24px;
}

.close-btn {
  background: rgba(255, 255, 255, 0.2);
  border: none;
  color: white;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  cursor: pointer;
  font-size: 20px;
  transition: all 0.3s;
}

.close-btn:hover {
  background: rgba(255, 255, 255, 0.3);
  transform: rotate(90deg);
}

.unlock-section,
.manager-content {
  padding: 32px;
  overflow-y: auto;
}

.setup-master,
.unlock-master {
  max-width: 400px;
  margin: 0 auto;
  text-align: center;
}

.setup-master h3,
.unlock-master h3 {
  margin: 0 0 16px 0;
  font-size: 20px;
  color: #333;
}

.setup-master p,
.unlock-master p {
  margin: 0 0 24px 0;
  color: #666;
  line-height: 1.6;
}

.setup-master input,
.unlock-master input {
  width: 100%;
  padding: 12px 16px;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  font-size: 14px;
  margin-bottom: 16px;
  transition: border-color 0.3s;
}

.setup-master input:focus,
.unlock-master input:focus {
  outline: none;
  border-color: #667eea;
}

.setup-master button,
.unlock-master button {
  width: 100%;
  padding: 12px 24px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
}

.setup-master button:hover:not(:disabled),
.unlock-master button:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}

.setup-master button:disabled,
.unlock-master button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.error {
  color: #ef4444;
  font-size: 14px;
  margin-top: 12px;
}

.manager-toolbar {
  display: flex;
  gap: 12px;
  margin-bottom: 24px;
}

.btn-primary,
.btn-secondary,
.btn-lock {
  padding: 10px 20px;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s;
}

.btn-primary {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.btn-secondary {
  background: #f3f4f6;
  color: #374151;
}

.btn-lock {
  background: #fef3c7;
  color: #92400e;
  margin-left: auto;
}

.btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}

.btn-secondary:hover {
  background: #e5e7eb;
}

.btn-lock:hover {
  background: #fde68a;
}

.credentials-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.empty-state {
  text-align: center;
  padding: 60px 20px;
  color: #9ca3af;
}

.empty-state .hint {
  font-size: 14px;
  margin-top: 8px;
}

.credential-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  background: #f9fafb;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
  transition: all 0.3s;
}

.credential-item:hover {
  background: #f3f4f6;
  border-color: #667eea;
}

.cred-info {
  flex: 1;
}

.cred-url {
  font-size: 16px;
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 4px;
}

.cred-username {
  font-size: 14px;
  color: #6b7280;
  margin-bottom: 4px;
}

.cred-note {
  font-size: 12px;
  color: #9ca3af;
  margin-bottom: 8px;
}

.cred-meta {
  display: flex;
  gap: 12px;
  font-size: 11px;
}

.cred-auto-login {
  color: #10b981;
  font-weight: 500;
}

.cred-date {
  color: #9ca3af;
}

.cred-actions {
  display: flex;
  gap: 6px;
}

.btn-action {
  padding: 8px 12px;
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  font-size: 16px;
  cursor: pointer;
  transition: all 0.3s;
}

.btn-action:hover {
  background: #f3f4f6;
  border-color: #667eea;
  transform: translateY(-2px);
}

.btn-action.btn-danger:hover {
  background: #fef2f2;
  border-color: #ef4444;
}

.credential-dialog,
.password-dialog {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 10001;
  display: flex;
  align-items: center;
  justify-content: center;
}

.dialog-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
}

.dialog-content {
  position: relative;
  width: 500px;
  background: white;
  border-radius: 12px;
  padding: 32px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
}

.dialog-content h3 {
  margin: 0 0 24px 0;
  font-size: 20px;
  color: #333;
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  font-size: 14px;
  font-weight: 500;
  color: #374151;
}

.form-group input[type="text"],
.form-group input[type="url"],
.form-group input[type="password"] {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 14px;
  transition: border-color 0.3s;
}

.form-group input:focus {
  outline: none;
  border-color: #667eea;
}

.form-group input[type="checkbox"] {
  margin-right: 8px;
}

.dialog-actions {
  display: flex;
  gap: 12px;
  margin-top: 24px;
}

.dialog-actions button {
  flex: 1;
}

.password-display {
  padding: 16px;
  background: #f3f4f6;
  border-radius: 8px;
  margin-bottom: 20px;
  text-align: center;
}

.password-display code {
  font-size: 18px;
  font-family: 'Courier New', monospace;
  color: #1f2937;
  letter-spacing: 2px;
}
</style>

