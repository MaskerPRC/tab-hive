/**
 * 代理处理模块
 * 负责代理相关的 IPC 处理
 */

const { session } = require('electron')

/**
 * 设置代理处理器
 * @param {Object} proxyManager - 代理管理器实例
 * @param {Function} ensureCertificateHandler - 确保证书处理的函数
 * @returns {Object} 所有代理相关的 IPC 处理器
 */
function setupProxyHandlers(proxyManager, ensureCertificateHandler) {
  return {
    /**
     * 获取代理列表
     */
    async getProxyList(page = 1, pageSize = 10) {
      if (!proxyManager) {
        return { success: false, error: '代理管理器未初始化' }
      }
      return await proxyManager.getProxyList(page, pageSize)
    },

    /**
     * 导入订阅链接
     */
    async importSubscription(subscriptionUrl) {
      if (!proxyManager) {
        return { success: false, error: '代理管理器未初始化' }
      }
      return await proxyManager.importSubscription(subscriptionUrl)
    },

    /**
     * 添加代理
     */
    async addProxy(proxyConfig) {
      if (!proxyManager) {
        return { success: false, error: '代理管理器未初始化' }
      }
      return await proxyManager.addProxy(proxyConfig)
    },

    /**
     * 更新代理
     */
    async updateProxy(proxyId, proxyConfig) {
      if (!proxyManager) {
        return { success: false, error: '代理管理器未初始化' }
      }
      return await proxyManager.updateProxy(proxyId, proxyConfig)
    },

    /**
     * 删除代理
     */
    async deleteProxy(proxyId) {
      if (!proxyManager) {
        return { success: false, error: '代理管理器未初始化' }
      }
      return await proxyManager.deleteProxy(proxyId)
    },

    /**
     * 测试代理
     */
    async testProxy(proxyId) {
      if (!proxyManager) {
        return { success: false, error: '代理管理器未初始化' }
      }
      return await proxyManager.testProxy(proxyId)
    },

    /**
     * 为视界启动代理
     */
    async startProxyForHive(hiveId, proxyId) {
      if (!proxyManager) {
        return { success: false, error: '代理管理器未初始化' }
      }
      return await proxyManager.startProxyForHive(hiveId, proxyId)
    },

    /**
     * 停止视界代理
     */
    async stopProxyForHive(hiveId) {
      if (!proxyManager) {
        return { success: false, error: '代理管理器未初始化' }
      }
      return await proxyManager.stopProxyForHive(hiveId)
    },

    /**
     * 获取视界代理信息
     */
    async getHiveProxyInfo(hiveId) {
      if (!proxyManager) {
        return { success: false, error: '代理管理器未初始化' }
      }
      const info = proxyManager.getHiveProxyInfo(hiveId)
      return { success: true, data: info }
    },

    /**
     * 为 webview session 设置代理
     */
    async setSessionProxy(partition, hiveId, proxyId) {
      console.log(`[Proxy] 设置代理请求 - partition: ${partition}, hiveId: ${hiveId}, proxyId: ${proxyId}`)

      if (!proxyManager) {
        return { success: false, error: '代理管理器未初始化' }
      }

      try {
        // 如果已有代理在运行，先停止
        const existingInfo = proxyManager.getHiveProxyInfo(hiveId)
        if (existingInfo) {
          console.log(`[Proxy] 停止现有代理 - hiveId: ${hiveId}`)
          await proxyManager.stopProxyForHive(hiveId)
        }

        // 启动新的代理
        if (proxyId) {
          console.log(`[Proxy] 启动新代理 - hiveId: ${hiveId}, proxyId: ${proxyId}`)
          const result = await proxyManager.startProxyForHive(hiveId, proxyId)
          console.log(`[Proxy] 代理启动结果:`, result)

          if (result.success) {
            // 为 session 设置代理
            const webviewSession = session.fromPartition(partition)
            // 确保证书错误处理已设置
            ensureCertificateHandler(partition)
            const proxyConfig = {
              proxyRules: `http=127.0.0.1:${result.data.httpPort};https=127.0.0.1:${result.data.httpPort};socks4=127.0.0.1:${result.data.socksPort};socks5=127.0.0.1:${result.data.socksPort}`,
              proxyBypassRules: 'localhost,127.0.0.1'
            }
            console.log(`[Proxy] 应用代理配置:`, proxyConfig)
            await webviewSession.setProxy(proxyConfig)
            console.log(`[Proxy] 代理配置已应用到分区 ${partition}`)
            return { success: true, data: result.data }
          } else {
            return result
          }
        } else {
          // 清除代理
          console.log(`[Proxy] 清除代理 - partition: ${partition}, hiveId: ${hiveId}`)
          const webviewSession = session.fromPartition(partition)
          // 确保证书错误处理已设置
          ensureCertificateHandler(partition)
          // 使用空对象完全清除代理设置
          await webviewSession.setProxy({})
          await proxyManager.stopProxyForHive(hiveId)
          console.log(`[Proxy] 代理已清除`)
          return { success: true }
        }
      } catch (error) {
        console.error('[Proxy] 设置 session 代理失败:', error)
        return { success: false, error: error.message }
      }
    }
  }
}

module.exports = {
  setupProxyHandlers
}

