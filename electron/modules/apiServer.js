/**
 * 本地 API 服务器模块
 * 提供外部访问接口，支持多步骤 JS 执行和网络流量查询
 */

const http = require('http')
const { BrowserWindow, webContents: electronWebContents } = require('electron')

class ApiServer {
  constructor() {
    this.server = null
    this.config = {
      host: '127.0.0.1',
      port: 13900,
      apiKey: ''
    }
    this.networkInterceptor = null
    console.log('[ApiServer] API 服务器模块已初始化')
  }

  /**
   * 设置网络拦截器引用
   */
  setNetworkInterceptor(interceptor) {
    this.networkInterceptor = interceptor
  }

  /**
   * 启动 HTTP 服务器
   * @param {Object} config - { host, port, apiKey }
   */
  start(config) {
    if (this.server) {
      this.stop()
    }

    this.config = { ...this.config, ...config }

    if (!this.config.apiKey) {
      console.warn('[ApiServer] ⚠ API Key 未设置，服务器不会启动')
      return
    }

    this.server = http.createServer((req, res) => this.handleRequest(req, res))

    this.server.on('error', (err) => {
      console.error('[ApiServer] ✗ 服务器启动失败:', err.message)
    })

    this.server.listen(this.config.port, this.config.host, () => {
      console.log(`[ApiServer] ✓ 服务器已启动: http://${this.config.host}:${this.config.port}`)
    })
  }

  /**
   * 停止服务器
   */
  stop() {
    if (this.server) {
      this.server.close(() => {
        console.log('[ApiServer] ✓ 服务器已停止')
      })
      this.server = null
    }
  }

  /**
   * 更新配置，必要时重启
   */
  updateConfig(config) {
    const needRestart = config.host !== this.config.host ||
                        config.port !== this.config.port ||
                        config.apiKey !== this.config.apiKey

    this.config = { ...this.config, ...config }

    if (needRestart && this.server) {
      this.start(this.config)
    }
  }

  /**
   * 获取服务器状态
   */
  getStatus() {
    return {
      running: !!this.server,
      host: this.config.host,
      port: this.config.port,
      hasApiKey: !!this.config.apiKey
    }
  }

  /**
   * 请求处理入口
   */
  async handleRequest(req, res) {
    // CORS 头
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-API-Key')

    // 处理预检请求
    if (req.method === 'OPTIONS') {
      res.writeHead(204)
      res.end()
      return
    }

    // API Key 鉴权
    if (!this.authenticate(req)) {
      this.sendError(res, 401, '无效的 API Key')
      return
    }

    // 路由分发
    const url = new URL(req.url, `http://${req.headers.host}`)
    const pathname = url.pathname

    try {
      if (req.method === 'GET' && pathname === '/api/v1/workspaces') {
        await this.handleListWorkspaces(req, res)
      } else if (req.method === 'POST' && pathname === '/api/v1/execute') {
        await this.handleExecuteJs(req, res)
      } else if (req.method === 'GET' && pathname === '/api/v1/traffic') {
        await this.handleGetTraffic(req, res, url)
      } else {
        this.sendError(res, 404, '未找到接口')
      }
    } catch (error) {
      console.error('[ApiServer] 请求处理失败:', error)
      this.sendError(res, 500, error.message)
    }
  }

  /**
   * API Key 鉴权
   */
  authenticate(req) {
    const apiKey = req.headers['x-api-key']
    return apiKey && apiKey === this.config.apiKey
  }

  /**
   * 列出所有工作空间和页面
   */
  async handleListWorkspaces(req, res) {
    const windows = BrowserWindow.getAllWindows()
    let workspaces = []

    for (const win of windows) {
      if (win.isDestroyed()) continue

      try {
        const data = await win.webContents.executeJavaScript(`
          (function() {
            try {
              const raw = localStorage.getItem('iframe-all-config')
              if (!raw) return null
              const config = JSON.parse(raw)
              return {
                layouts: (config.layouts || []).map(function(l) {
                  return {
                    id: l.id,
                    name: l.name,
                    keepAlive: !!l.keepAlive,
                    websites: (l.websites || []).map(function(w) {
                      return {
                        id: w.id,
                        title: w.title || '',
                        url: w.url || '',
                        type: w.type || 'website',
                        networkHookUrl: w.networkHookUrl || ''
                      }
                    })
                  }
                }),
                currentLayoutId: config.currentLayoutId
              }
            } catch(e) {
              return null
            }
          })()
        `)

        if (data && data.layouts) {
          // 获取已注册的 webview 列表，检查哪些页面可访问
          const registeredWebviews = await this.getRegisteredWebviewIds(win)

          workspaces = data.layouts.map(layout => ({
            id: layout.id,
            name: layout.name,
            isCurrent: layout.id === data.currentLayoutId,
            keepAlive: layout.keepAlive,
            pages: layout.websites.map(w => ({
              id: w.id,
              title: w.title,
              url: w.url,
              type: w.type,
              networkHookUrl: w.networkHookUrl,
              isAccessible: registeredWebviews.includes(String(w.id))
            }))
          }))
          break // 只需要从一个窗口获取即可
        }
      } catch (error) {
        console.error('[ApiServer] 获取工作空间数据失败:', error.message)
        continue
      }
    }

    this.sendJson(res, { success: true, workspaces })
  }

  /**
   * 获取已注册的 webview ID 列表
   */
  async getRegisteredWebviewIds(win) {
    try {
      const result = await win.webContents.executeJavaScript(`
        (function() {
          var webviews = document.querySelectorAll('webview[data-webview-id]')
          var ids = []
          webviews.forEach(function(w) {
            var id = w.getAttribute('data-webview-id')
            if (id) ids.push(id)
          })
          return ids
        })()
      `)
      return result || []
    } catch (error) {
      return []
    }
  }

  /**
   * 多步骤 JS 执行
   */
  async handleExecuteJs(req, res) {
    const body = await this.readBody(req)
    const { websiteId, steps, timeout = 30000 } = body

    if (!websiteId || !Array.isArray(steps) || steps.length === 0) {
      this.sendError(res, 400, '缺少 websiteId 或 steps 参数')
      return
    }

    // 查找目标 webview 的 webContents
    const targetWc = await this.findWebviewWebContents(websiteId)
    if (!targetWc) {
      this.sendError(res, 404, `未找到 websiteId=${websiteId} 对应的页面（页面可能未加载或不在当前/冻结工作空间中）`)
      return
    }

    const results = []
    let previousResult = undefined
    const stepTimeout = Math.max(5000, Math.floor(timeout / steps.length))

    for (let i = 0; i < steps.length; i++) {
      const step = steps[i]
      let code = step.code

      // 注入上一步结果
      if (step.usePrevious && previousResult !== undefined) {
        const prevJson = JSON.stringify(previousResult)
        code = `(function() {
          var __prev__ = ${prevJson};
          return (${code})(__prev__);
        })()`
      }

      try {
        const result = await Promise.race([
          targetWc.executeJavaScript(code),
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error('步骤执行超时')), stepTimeout)
          )
        ])

        results.push({ step: i, success: true, result })
        previousResult = result

        if (step.timeout) {
          await new Promise(resolve => setTimeout(resolve, parseInt(step.timeout) || 1000))
        }
      } catch (error) {
        results.push({ step: i, success: false, error: error.message })
        break // 某步失败则停止
      }
    }

    this.sendJson(res, { success: true, results })
  }

  /**
   * 获取网络流量数据
   */
  async handleGetTraffic(req, res, url) {
    if (!this.networkInterceptor) {
      this.sendError(res, 503, '网络拦截器未初始化')
      return
    }

    const websiteId = url.searchParams.get('websiteId')
    const since = parseInt(url.searchParams.get('since') || '0', 10)
    const limit = parseInt(url.searchParams.get('limit') || '100', 10)

    if (!websiteId) {
      this.sendError(res, 400, '缺少 websiteId 参数')
      return
    }

    const traffic = this.networkInterceptor.getTraffic(websiteId, since, limit)
    this.sendJson(res, { success: true, traffic })
  }

  /**
   * 查找 webview 的 webContents（支持当前页面和冻结页面）
   */
  async findWebviewWebContents(websiteId) {
    const windows = BrowserWindow.getAllWindows()

    for (const win of windows) {
      if (win.isDestroyed()) continue

      try {
        const webviewInfo = await win.webContents.executeJavaScript(`
          (function() {
            var webview = document.querySelector('[data-webview-id="${websiteId}"]')
            if (webview && webview.getWebContentsId) {
              return { found: true, webContentsId: webview.getWebContentsId() }
            }
            return { found: false }
          })()
        `)

        if (webviewInfo && webviewInfo.found) {
          const wc = electronWebContents.fromId(webviewInfo.webContentsId)
          if (wc && !wc.isDestroyed()) {
            return wc
          }
        }
      } catch (error) {
        continue
      }
    }

    return null
  }

  /**
   * 读取请求体
   */
  readBody(req) {
    return new Promise((resolve, reject) => {
      let body = ''
      req.on('data', chunk => { body += chunk })
      req.on('end', () => {
        try {
          resolve(body ? JSON.parse(body) : {})
        } catch (e) {
          reject(new Error('无效的 JSON 请求体'))
        }
      })
      req.on('error', reject)
    })
  }

  /**
   * 发送 JSON 响应
   */
  sendJson(res, data) {
    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' })
    res.end(JSON.stringify(data))
  }

  /**
   * 发送错误响应
   */
  sendError(res, statusCode, message) {
    res.writeHead(statusCode, { 'Content-Type': 'application/json; charset=utf-8' })
    res.end(JSON.stringify({ success: false, error: message }))
  }
}

// 单例模式
let instance = null
function getApiServer() {
  if (!instance) {
    instance = new ApiServer()
  }
  return instance
}

module.exports = { getApiServer }
