import { ref, onMounted, onBeforeUnmount } from 'vue'

/**
 * 管理 Basic Auth 弹窗的逻辑
 * 监听主进程发来的 basic-auth-required 事件，显示认证弹窗，回传结果
 */
export function useBasicAuth() {
  const showBasicAuth = ref(false)
  const basicAuthRequestId = ref('')
  const basicAuthHost = ref('')
  const basicAuthRealm = ref('')

  let authCallback = null

  const handleAuthRequired = (data) => {
    console.log('[useBasicAuth] 收到认证请求:', data.host, data.realm)
    basicAuthRequestId.value = data.requestId
    basicAuthHost.value = data.host + (data.port ? ':' + data.port : '')
    basicAuthRealm.value = data.realm || ''
    showBasicAuth.value = true
    authCallback = data.requestId
  }

  const handleSubmit = ({ requestId, username, password }) => {
    console.log('[useBasicAuth] 用户提交凭据:', requestId)
    if (window.electron?.basicAuth) {
      window.electron.basicAuth.respond({
        requestId,
        submitted: true,
        username,
        password
      })
    }
    showBasicAuth.value = false
  }

  const handleCancel = ({ requestId }) => {
    console.log('[useBasicAuth] 用户取消认证:', requestId)
    if (window.electron?.basicAuth) {
      window.electron.basicAuth.respond({
        requestId,
        submitted: false
      })
    }
    showBasicAuth.value = false
  }

  onMounted(() => {
    if (window.electron?.on) {
      window.electron.on('basic-auth-required', handleAuthRequired)
    }
  })

  onBeforeUnmount(() => {
    if (window.electron?.off) {
      window.electron.off('basic-auth-required', handleAuthRequired)
    }
  })

  return {
    showBasicAuth,
    basicAuthRequestId,
    basicAuthHost,
    basicAuthRealm,
    handleSubmit,
    handleCancel
  }
}
