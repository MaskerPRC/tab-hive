/**
 * 代理管理器主类
 * 整合各个模块，提供统一的代理管理接口
 */

const { get } = require('./database')
const { ProxyDatabase } = require('./modules/proxy-database')
const { SubscriptionParser } = require('./modules/subscription-parser')
const { ProxyTester } = require('./modules/proxy-tester')
const { ClashManager } = require('./modules/clash-manager')

class ProxyManager {
  constructor() {
    // 初始化各个模块
    this.database = new ProxyDatabase()
    this.parser = new SubscriptionParser()
    this.clashManager = new ClashManager()
    this.tester = new ProxyTester(this.clashManager)
  }

  // ==================== 代理列表管理 ====================

  /**
   * 获取代理列表
   */
  async getProxyList(page = 1, pageSize = 10) {
    return await this.database.getProxyList(page, pageSize)
  }

  /**
   * 添加代理
   */
  async addProxy(proxyConfig) {
    return await this.database.addProxy(proxyConfig)
  }

  /**
   * 更新代理
   */
  async updateProxy(proxyId, proxyConfig) {
    return await this.database.updateProxy(proxyId, proxyConfig)
  }

  /**
   * 删除代理
   */
  async deleteProxy(proxyId) {
    return await this.database.deleteProxy(proxyId)
  }

  // ==================== 订阅管理 ====================

  /**
   * 导入订阅链接
   */
  async importSubscription(subscriptionUrl) {
    try {
      // 解析订阅获取代理列表
      const parseResult = await this.parser.importSubscription(subscriptionUrl)
      
      if (!parseResult.success) {
        return parseResult
      }

      const proxies = parseResult.data

      // 批量导入代理节点
      let importedCount = 0
      for (const proxy of proxies) {
        try {
          console.log('[ProxyManager] 准备导入代理:', proxy)
          await this.addProxy(proxy)
          importedCount++
        } catch (error) {
          console.warn('[ProxyManager] 导入代理节点失败:', proxy.name, error.message)
        }
      }

      return {
        success: true,
        data: {
          imported: importedCount,
          total: proxies.length
        }
      }
    } catch (error) {
      console.error('[ProxyManager] 导入订阅链接失败:', error)
      return { success: false, error: error.message }
    }
  }

  // ==================== 代理测试 ====================

  /**
   * 测试代理连接
   */
  async testProxy(proxyId) {
    try {
      const proxyResult = await this.database.getProxyById(proxyId)
      if (!proxyResult.success) {
        return proxyResult
      }

      const proxy = proxyResult.data
      return await this.tester.testProxy(proxy)
    } catch (error) {
      console.error('[ProxyManager] 测试代理失败:', error)
      return { success: false, error: error.message }
    }
  }

  // ==================== 蜂巢代理管理 ====================

  /**
   * 为蜂巢启动代理
   */
  async startProxyForHive(hiveId, proxyId) {
    try {
      const proxyResult = await this.database.getProxyById(proxyId)
      if (!proxyResult.success) {
        return proxyResult
      }

      const proxy = proxyResult.data
      return await this.clashManager.startProxyForHive(hiveId, proxy)
    } catch (error) {
      console.error('[ProxyManager] 启动蜂巢代理失败:', error)
      return { success: false, error: error.message }
    }
  }

  /**
   * 停止蜂巢代理
   */
  async stopProxyForHive(hiveId) {
    return await this.clashManager.stopProxyForHive(hiveId)
  }

  /**
   * 获取蜂巢代理信息
   */
  getHiveProxyInfo(hiveId) {
    return this.clashManager.getHiveProxyInfo(hiveId)
  }

  // ==================== 辅助方法（向后兼容） ====================

  /**
   * 获取 Clash 可执行文件路径
   */
  getClashBinary() {
    return this.clashManager.getClashBinary()
  }

  /**
   * 生成 Clash 配置（暴露给测试模块使用）
   */
  generateClashConfig(proxies, httpPort, socksPort, controllerPort, secret) {
    return this.clashManager.generateClashConfig(proxies, httpPort, socksPort, controllerPort, secret)
  }

  /**
   * 等待 Clash 就绪（暴露给测试模块使用）
   */
  async waitForClashReady(controllerPort, secret, maxAttempts = 10) {
    return await this.clashManager.waitForClashReady(controllerPort, secret, maxAttempts)
  }
}

module.exports = { ProxyManager }

