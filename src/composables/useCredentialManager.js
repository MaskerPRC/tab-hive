/**
 * 凭证管理器
 * 用于本地加密存储和管理网站的登录账号密码
 * 支持自动填充和自动登录功能
 */

import { ref, computed } from 'vue'

// 简单的加密/解密函数（使用 AES 算法的简化版本）
// 注意：这是一个简化的实现，生产环境应该使用更强的加密库如 crypto-js
class SimpleCrypto {
  constructor(secret) {
    this.secret = secret
  }

  // 简单的 XOR 加密（仅用于演示，实际应使用更强的加密）
  encrypt(text) {
    if (!text) return ''
    const encrypted = []
    for (let i = 0; i < text.length; i++) {
      const charCode = text.charCodeAt(i) ^ this.secret.charCodeAt(i % this.secret.length)
      encrypted.push(String.fromCharCode(charCode))
    }
    return btoa(encrypted.join('')) // Base64 编码
  }

  decrypt(encrypted) {
    if (!encrypted) return ''
    try {
      const text = atob(encrypted) // Base64 解码
      const decrypted = []
      for (let i = 0; i < text.length; i++) {
        const charCode = text.charCodeAt(i) ^ this.secret.charCodeAt(i % this.secret.length)
        decrypted.push(String.fromCharCode(charCode))
      }
      return decrypted.join('')
    } catch (e) {
      console.error('解密失败:', e)
      return ''
    }
  }
}

export function useCredentialManager() {
  const credentials = ref([])
  const isLocked = ref(true)
  const masterPassword = ref('')
  const crypto = ref(null)

  // 从 localStorage 加载凭证
  const loadCredentials = () => {
    try {
      const stored = localStorage.getItem('quanshijie-credentials')
      if (stored) {
        const data = JSON.parse(stored)
        credentials.value = data.credentials || []
        return true
      }
    } catch (e) {
      console.error('加载凭证失败:', e)
    }
    return false
  }

  // 保存凭证到 localStorage
  const saveCredentials = () => {
    try {
      const data = {
        credentials: credentials.value,
        version: '1.0'
      }
      localStorage.setItem('quanshijie-credentials', JSON.stringify(data))
      return true
    } catch (e) {
      console.error('保存凭证失败:', e)
      return false
    }
  }

  // 初始化主密码
  const initializeMasterPassword = (password) => {
    if (!password || password.length < 6) {
      throw new Error('主密码长度至少为6个字符')
    }
    
    masterPassword.value = password
    crypto.value = new SimpleCrypto(password)
    
    // 保存主密码哈希（用于验证）
    const hash = btoa(password) // 简化版，实际应使用 SHA-256
    localStorage.setItem('quanshijie-master-hash', hash)
    
    isLocked.value = false
    return true
  }

  // 验证主密码
  const verifyMasterPassword = (password) => {
    const storedHash = localStorage.getItem('quanshijie-master-hash')
    if (!storedHash) {
      throw new Error('未设置主密码')
    }
    
    const hash = btoa(password)
    if (hash !== storedHash) {
      throw new Error('主密码错误')
    }
    
    masterPassword.value = password
    crypto.value = new SimpleCrypto(password)
    isLocked.value = false
    loadCredentials()
    return true
  }

  // 锁定凭证管理器
  const lock = () => {
    masterPassword.value = ''
    crypto.value = null
    isLocked.value = true
    credentials.value = []
  }

  // 添加凭证
  const addCredential = (credential) => {
    if (isLocked.value) {
      throw new Error('凭证管理器已锁定')
    }

    const { url, username, password, note, autoLogin } = credential

    if (!url || !username || !password) {
      throw new Error('URL、用户名和密码不能为空')
    }

    // 加密密码
    const encryptedPassword = crypto.value.encrypt(password)
    
    const newCredential = {
      id: Date.now().toString(),
      url,
      username,
      password: encryptedPassword,
      note: note || '',
      autoLogin: autoLogin || false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

    credentials.value.push(newCredential)
    saveCredentials()
    
    return newCredential
  }

  // 更新凭证
  const updateCredential = (id, updates) => {
    if (isLocked.value) {
      throw new Error('凭证管理器已锁定')
    }

    const index = credentials.value.findIndex(c => c.id === id)
    if (index === -1) {
      throw new Error('凭证不存在')
    }

    const credential = credentials.value[index]
    
    // 如果更新密码，需要重新加密
    if (updates.password) {
      updates.password = crypto.value.encrypt(updates.password)
    }

    credentials.value[index] = {
      ...credential,
      ...updates,
      updatedAt: new Date().toISOString()
    }

    saveCredentials()
    return credentials.value[index]
  }

  // 删除凭证
  const deleteCredential = (id) => {
    if (isLocked.value) {
      throw new Error('凭证管理器已锁定')
    }

    const index = credentials.value.findIndex(c => c.id === id)
    if (index === -1) {
      throw new Error('凭证不存在')
    }

    credentials.value.splice(index, 1)
    saveCredentials()
    return true
  }

  // 根据 URL 查找凭证
  const findCredentialsByUrl = (url) => {
    if (isLocked.value) {
      return []
    }

    try {
      const targetUrl = new URL(url)
      return credentials.value.filter(c => {
        try {
          const credUrl = new URL(c.url)
          return credUrl.hostname === targetUrl.hostname
        } catch (e) {
          return false
        }
      })
    } catch (e) {
      return []
    }
  }

  // 获取解密后的密码
  const getDecryptedPassword = (id) => {
    if (isLocked.value) {
      throw new Error('凭证管理器已锁定')
    }

    const credential = credentials.value.find(c => c.id === id)
    if (!credential) {
      throw new Error('凭证不存在')
    }

    return crypto.value.decrypt(credential.password)
  }

  // 获取凭证的完整信息（包括解密后的密码）
  const getCredentialWithPassword = (id) => {
    if (isLocked.value) {
      throw new Error('凭证管理器已锁定')
    }

    const credential = credentials.value.find(c => c.id === id)
    if (!credential) {
      throw new Error('凭证不存在')
    }

    return {
      ...credential,
      password: crypto.value.decrypt(credential.password)
    }
  }

  // 自动填充表单
  const autoFillForm = async (target, credentialId) => {
    if (isLocked.value) {
      throw new Error('凭证管理器已锁定')
    }

    const credential = getCredentialWithPassword(credentialId)
    const isElectron = window.electron?.isElectron || false

    const script = `
      (function() {
        const username = ${JSON.stringify(credential.username)};
        const password = ${JSON.stringify(credential.password)};
        
        // 查找用户名输入框
        const usernameInputs = [
          ...document.querySelectorAll('input[type="text"]'),
          ...document.querySelectorAll('input[type="email"]'),
          ...document.querySelectorAll('input[name*="user"]'),
          ...document.querySelectorAll('input[name*="email"]'),
          ...document.querySelectorAll('input[id*="user"]'),
          ...document.querySelectorAll('input[id*="email"]'),
          ...document.querySelectorAll('input[placeholder*="用户"]'),
          ...document.querySelectorAll('input[placeholder*="邮箱"]'),
          ...document.querySelectorAll('input[placeholder*="账号"]')
        ];
        
        // 查找密码输入框
        const passwordInputs = [
          ...document.querySelectorAll('input[type="password"]'),
          ...document.querySelectorAll('input[name*="pass"]'),
          ...document.querySelectorAll('input[id*="pass"]')
        ];
        
        let filled = { username: false, password: false };
        
        // 填充用户名
        if (usernameInputs.length > 0) {
          const usernameInput = usernameInputs[0];
          usernameInput.value = username;
          usernameInput.dispatchEvent(new Event('input', { bubbles: true }));
          usernameInput.dispatchEvent(new Event('change', { bubbles: true }));
          filled.username = true;
        }
        
        // 填充密码
        if (passwordInputs.length > 0) {
          const passwordInput = passwordInputs[0];
          passwordInput.value = password;
          passwordInput.dispatchEvent(new Event('input', { bubbles: true }));
          passwordInput.dispatchEvent(new Event('change', { bubbles: true }));
          filled.password = true;
        }
        
        return filled;
      })();
    `

    if (isElectron && target.send) {
      // Electron webview
      return await window.electron.executeInIframe(target.id, script)
    } else if (target.contentWindow) {
      // Browser iframe
      return new Promise((resolve, reject) => {
        const requestId = `autofill-${Date.now()}`
        const timeout = setTimeout(() => {
          window.removeEventListener('message', handler)
          reject(new Error('自动填充超时'))
        }, 5000)

        const handler = (event) => {
          if (event.data && 
              event.data.source === 'quanshijie-content-executor' &&
              event.data.requestId === requestId) {
            clearTimeout(timeout)
            window.removeEventListener('message', handler)
            resolve(event.data.result)
          }
        }

        window.addEventListener('message', handler)

        target.contentWindow.postMessage({
          source: 'quanshijie',
          action: 'executeScript',
          requestId,
          script
        }, '*')
      })
    }

    throw new Error('不支持的目标类型')
  }

  // 自动登录（填充并提交）
  const autoLogin = async (target, credentialId) => {
    if (isLocked.value) {
      throw new Error('凭证管理器已锁定')
    }

    // 先填充表单
    const fillResult = await autoFillForm(target, credentialId)
    
    if (!fillResult.username || !fillResult.password) {
      throw new Error('无法找到登录表单')
    }

    // 等待一会儿让表单处理输入
    await new Promise(resolve => setTimeout(resolve, 500))

    // 查找并点击登录按钮
    const isElectron = window.electron?.isElectron || false
    const script = `
      (function() {
        // 查找登录按钮
        const loginButtons = [
          ...document.querySelectorAll('button[type="submit"]'),
          ...document.querySelectorAll('input[type="submit"]'),
          ...document.querySelectorAll('button:contains("登录")'),
          ...document.querySelectorAll('button:contains("登陆")'),
          ...document.querySelectorAll('button:contains("Sign In")'),
          ...document.querySelectorAll('button:contains("Log In")'),
          ...document.querySelectorAll('button[class*="login"]'),
          ...document.querySelectorAll('button[class*="signin"]')
        ];
        
        if (loginButtons.length > 0) {
          loginButtons[0].click();
          return { submitted: true };
        }
        
        // 如果没找到按钮，尝试提交表单
        const forms = document.querySelectorAll('form');
        if (forms.length > 0) {
          forms[0].submit();
          return { submitted: true };
        }
        
        return { submitted: false, reason: '未找到登录按钮或表单' };
      })();
    `

    if (isElectron && target.send) {
      return await window.electron.executeInIframe(target.id, script)
    } else if (target.contentWindow) {
      return new Promise((resolve, reject) => {
        const requestId = `autologin-${Date.now()}`
        const timeout = setTimeout(() => {
          window.removeEventListener('message', handler)
          reject(new Error('自动登录超时'))
        }, 5000)

        const handler = (event) => {
          if (event.data && 
              event.data.source === 'quanshijie-content-executor' &&
              event.data.requestId === requestId) {
            clearTimeout(timeout)
            window.removeEventListener('message', handler)
            resolve(event.data.result)
          }
        }

        window.addEventListener('message', handler)

        target.contentWindow.postMessage({
          source: 'quanshijie',
          action: 'executeScript',
          requestId,
          script
        }, '*')
      })
    }

    throw new Error('不支持的目标类型')
  }

  // 导出凭证（加密）
  const exportCredentials = () => {
    if (isLocked.value) {
      throw new Error('凭证管理器已锁定')
    }

    const data = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      credentials: credentials.value
    }

    const json = JSON.stringify(data, null, 2)
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `quanshijie-credentials-${Date.now()}.json`
    a.click()
    URL.revokeObjectURL(url)
    
    return true
  }

  // 导入凭证
  const importCredentials = async (file) => {
    if (isLocked.value) {
      throw new Error('凭证管理器已锁定')
    }

    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      
      reader.onload = (e) => {
        try {
          const data = JSON.parse(e.target.result)
          
          if (!data.credentials || !Array.isArray(data.credentials)) {
            reject(new Error('无效的凭证文件格式'))
            return
          }

          // 合并凭证（避免重复）
          data.credentials.forEach(newCred => {
            const exists = credentials.value.find(c => 
              c.url === newCred.url && c.username === newCred.username
            )
            if (!exists) {
              credentials.value.push({
                ...newCred,
                id: Date.now().toString() + Math.random().toString(36).substr(2, 9)
              })
            }
          })

          saveCredentials()
          resolve(data.credentials.length)
        } catch (error) {
          reject(error)
        }
      }

      reader.onerror = () => reject(new Error('读取文件失败'))
      reader.readAsText(file)
    })
  }

  // 检查是否已设置主密码
  const hasMasterPassword = computed(() => {
    return !!localStorage.getItem('quanshijie-master-hash')
  })

  // 凭证数量
  const credentialCount = computed(() => credentials.value.length)

  return {
    // 状态
    credentials,
    isLocked,
    hasMasterPassword,
    credentialCount,

    // 方法
    initializeMasterPassword,
    verifyMasterPassword,
    lock,
    addCredential,
    updateCredential,
    deleteCredential,
    findCredentialsByUrl,
    getDecryptedPassword,
    getCredentialWithPassword,
    autoFillForm,
    autoLogin,
    exportCredentials,
    importCredentials
  }
}

