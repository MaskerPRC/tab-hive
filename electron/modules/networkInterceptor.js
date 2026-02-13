/**
 * 网络流量拦截器模块
 * 拦截 webview 中的网络请求，缓冲并转发到外部 hook
 */

const { net } = require('electron')

class NetworkInterceptor {
  constructor() {
    // websiteId -> 环形缓冲数组
    this.trafficBuffer = new Map()
    this.maxBufferPerPage = 500
    // Hook URL 配置
    this.globalHookUrl = ''
    this.globalHookEnabled = false
    this.pageHookUrls = new Map() // websiteId -> hookUrl
    // 已挂载的 webContents
    this.attachedWebContents = new Map() // websiteId -> webContents
    // webContentsId -> websiteId 路由表（支持多 webview 共享 session）
    this.wcIdToWebsiteId = new Map()
    // 已设置监听器的 session（避免重复注册覆盖）
    this.attachedSessions = new Set()
    console.log('[NetworkInterceptor] 网络拦截器已初始化')
  }

  /**
   * 更新 hook 配置
   * @param {Object} config - { globalHookEnabled, globalHookUrl, pageHookUrls }
   */
  configure(config) {
    if (config.globalHookEnabled !== undefined) {
      this.globalHookEnabled = config.globalHookEnabled
    }
    if (config.globalHookUrl !== undefined) {
      this.globalHookUrl = config.globalHookUrl
    }
    if (config.pageHookUrls) {
      this.pageHookUrls.clear()
      for (const [id, url] of Object.entries(config.pageHookUrls)) {
        if (url) {
          this.pageHookUrls.set(String(id), url)
        }
      }
    }
    console.log('[NetworkInterceptor] 配置已更新:', {
      globalHookEnabled: this.globalHookEnabled,
      globalHookUrl: this.globalHookUrl,
      pageHookUrls: this.pageHookUrls.size
    })
  }

  /**
   * 挂载到 webview 的 webContents 进行网络拦截
   * @param {Electron.WebContents} webContents - webview 的 webContents
   * @param {string} websiteId - 网站 ID
   */
  attachToWebContents(webContents, websiteId) {
    const id = String(websiteId)

    // 防止重复挂载
    if (this.attachedWebContents.has(id)) {
      console.log(`[NetworkInterceptor] websiteId=${id} 已挂载，跳过`)
      return
    }

    this.attachedWebContents.set(id, webContents)
    this.wcIdToWebsiteId.set(webContents.id, id)

    // 初始化缓冲区
    if (!this.trafficBuffer.has(id)) {
      this.trafficBuffer.set(id, [])
    }

    // 为 session 设置监听器（每个 session 仅一次，避免覆盖）
    const ses = webContents.session
    const sessionKey = ses.storagePath || 'default-session'

    if (!this.attachedSessions.has(sessionKey)) {
      this.attachedSessions.add(sessionKey)
      const filter = { urls: ['<all_urls>'] }

      // onCompleted: 请求完成时记录
      ses.webRequest.onCompleted(filter, (details) => {
        const wsId = this.wcIdToWebsiteId.get(details.webContentsId)
        if (!wsId) return

        this.recordTraffic(wsId, {
          method: details.method,
          url: details.url,
          statusCode: details.statusCode,
          resourceType: details.resourceType,
          requestHeaders: details.requestHeaders || {},
          responseHeaders: details.responseHeaders || {},
          fromCache: details.fromCache || false,
          statusLine: details.statusLine || ''
        })
      })

      // onErrorOccurred: 请求出错时也记录
      ses.webRequest.onErrorOccurred(filter, (details) => {
        const wsId = this.wcIdToWebsiteId.get(details.webContentsId)
        if (!wsId) return

        this.recordTraffic(wsId, {
          method: details.method,
          url: details.url,
          statusCode: -1,
          resourceType: details.resourceType,
          error: details.error,
          fromCache: false
        })
      })

      console.log(`[NetworkInterceptor] ✓ session 监听器已设置: ${sessionKey}`)
    }

    // webContents 销毁时自动清理
    webContents.on('destroyed', () => {
      this.wcIdToWebsiteId.delete(webContents.id)
      this.detachFromWebContents(id)
    })

    console.log(`[NetworkInterceptor] ✓ 已挂载到 websiteId=${id}, wcId=${webContents.id}`)
  }

  /**
   * 卸载拦截
   */
  detachFromWebContents(websiteId) {
    const id = String(websiteId)
    this.attachedWebContents.delete(id)
    console.log(`[NetworkInterceptor] 已卸载 websiteId=${id}`)
  }

  /**
   * 记录流量并转发
   */
  recordTraffic(websiteId, details) {
    const record = {
      id: Date.now() + Math.random(),
      websiteId,
      timestamp: new Date().toISOString(),
      method: details.method,
      url: details.url,
      statusCode: details.statusCode,
      resourceType: details.resourceType || '',
      requestHeaders: details.requestHeaders || {},
      responseHeaders: details.responseHeaders || {},
      fromCache: details.fromCache || false,
      error: details.error || null
    }

    // 写入环形缓冲
    const buffer = this.trafficBuffer.get(websiteId)
    if (buffer) {
      buffer.push(record)
      if (buffer.length > this.maxBufferPerPage) {
        buffer.shift()
      }
    }

    // 异步转发到 hook
    this.forwardToHook(websiteId, record)
  }

  /**
   * 转发到 hook URL（异步、非阻塞）
   */
  forwardToHook(websiteId, record) {
    // 确定 hook URL：单页面配置优先，然后全局配置
    const pageHookUrl = this.pageHookUrls.get(websiteId)
    let hookUrl = null

    if (pageHookUrl) {
      hookUrl = pageHookUrl
    } else if (this.globalHookEnabled && this.globalHookUrl) {
      hookUrl = this.globalHookUrl
    }

    if (!hookUrl) return

    try {
      const request = net.request({
        method: 'POST',
        url: hookUrl
      })

      request.setHeader('Content-Type', 'application/json')

      request.on('error', () => {
        // 静默处理转发失败，避免日志刷屏
      })

      request.on('response', () => {
        // 忽略响应
      })

      request.write(JSON.stringify(record))
      request.end()
    } catch (err) {
      // 静默处理
    }
  }

  /**
   * 查询缓冲的流量数据
   */
  getTraffic(websiteId, since = 0, limit = 100) {
    const id = String(websiteId)
    const buffer = this.trafficBuffer.get(id) || []
    return buffer
      .filter(r => new Date(r.timestamp).getTime() > since)
      .slice(-limit)
  }

  /**
   * 清理所有资源
   */
  cleanup() {
    this.trafficBuffer.clear()
    this.attachedWebContents.clear()
    this.wcIdToWebsiteId.clear()
    this.attachedSessions.clear()
    console.log('[NetworkInterceptor] ✓ 资源已清理')
  }
}

// 单例模式
let instance = null
function getNetworkInterceptor() {
  if (!instance) {
    instance = new NetworkInterceptor()
  }
  return instance
}

module.exports = { getNetworkInterceptor }
