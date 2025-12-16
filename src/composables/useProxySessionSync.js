/**
 * 代理与会话同步管理
 * 处理代理设置与会话实例之间的自动同步关系
 */
import { watch } from 'vue'

export function useProxySessionSync(localWebsite, sessionInstances, websiteProps) {
  /**
   * 设置代理与会话的同步监听
   * 当设置代理时，自动创建并切换到代理专用的session
   * 当清除代理时，切换回默认session
   */
  const setupProxySessionWatch = () => {
    watch(() => localWebsite.value.proxyId, (newProxyId, oldProxyId) => {
      const currentSessionId = localWebsite.value.sessionInstance
      const isCurrentlyUsingProxySession = currentSessionId && currentSessionId.startsWith('proxy-')
      
      if (newProxyId && newProxyId !== oldProxyId) {
        // 当设置了代理时
        if (!isCurrentlyUsingProxySession) {
          // 如果当前不是使用代理专用的 session，则创建一个新的代理专用 session
          // 注意：这里不包含 proxyId，这样切换代理时可以保持同一个 session
          const proxySessionId = `proxy-${websiteProps.website.id || Date.now()}`
          
          // 检查是否已经存在该隐藏实例
          const existingInstance = sessionInstances.value.find(inst => inst.id === proxySessionId)
          
          if (!existingInstance) {
            // 创建隐藏的 session 实例
            const hiddenInstance = {
              id: proxySessionId,
              name: `代理专用 (${localWebsite.value.title || '未命名'})`,
              description: '为代理设置自动创建的隐藏实例',
              hidden: true, // 标记为隐藏
              createdAt: new Date().toISOString()
            }
            sessionInstances.value.push(hiddenInstance)
          }
          
          // 切换到代理专用的 session 实例
          localWebsite.value.sessionInstance = proxySessionId
        }
        // 如果已经在使用代理专用的 session，则保持不变，只更新 proxyId（由 v-model 自动处理）
      } else if (!newProxyId && oldProxyId) {
        // 当清除代理时，切换回默认 session 实例
        if (isCurrentlyUsingProxySession) {
          localWebsite.value.sessionInstance = 'default'
        }
      }
    })
  }

  return {
    setupProxySessionWatch
  }
}

