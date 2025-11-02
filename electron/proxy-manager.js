const { query, run, get } = require('./database')
const axios = require('axios')
const { spawn } = require('child_process')
const path = require('path')
const fs = require('fs')
const { app } = require('electron')
const YAML = require('yamljs')
const { HttpProxyAgent } = require('http-proxy-agent')
const { HttpsProxyAgent } = require('https-proxy-agent')
const { SocksProxyAgent } = require('socks-proxy-agent')

class ProxyManager {
  constructor() {
    // 存储每个蜂巢的 Clash 进程和配置
    // key: hiveId (网站ID), value: { process, port, controllerPort, secret }
    this.hiveClashProcesses = new Map()
    
    // 基础端口配置
    this.baseHttpPort = 7890
    this.baseSocksPort = 7891
    this.baseControllerPort = 9090
    
    // 当前使用的端口计数器
    this.portCounter = 0
    
    this.proxyTestTimeout = 10000 // 10秒超时
  }

  // 获取下一个可用端口
  getNextPorts() {
    const offset = this.portCounter * 10
    const httpPort = this.baseHttpPort + offset
    const socksPort = this.baseSocksPort + offset
    const controllerPort = this.baseControllerPort + offset
    this.portCounter++
    return { httpPort, socksPort, controllerPort }
  }

  // 生成API密钥
  generateApiSecret() {
    return require('crypto').randomBytes(16).toString('hex')
  }

  // 获取代理列表
  async getProxyList(page = 1, pageSize = 10) {
    try {
      console.log(`[ProxyManager] 获取代理列表 - 页码: ${page}, 每页数量: ${pageSize}`)
      
      const offset = (page - 1) * pageSize
      const countResult = await get('SELECT COUNT(*) as total FROM proxies')
      const total = countResult ? countResult.total : 0
      
      if (total === 0) {
        return {
          success: true,
          data: {
            list: [],
            pagination: {
              page: page,
              pageSize: pageSize,
              total: 0,
              totalPages: 0
            }
          }
        }
      }
      
      const proxies = await query(
        'SELECT * FROM proxies ORDER BY created_at DESC LIMIT ? OFFSET ?',
        [pageSize, offset]
      )
      
      return { 
        success: true, 
        data: {
          list: proxies,
          pagination: {
            page: page,
            pageSize: pageSize,
            total: total,
            totalPages: Math.ceil(total / pageSize)
          }
        }
      }
    } catch (error) {
      console.error('获取代理列表失败:', error)
      return { success: false, error: error.message }
    }
  }

  // 添加代理
  async addProxy(proxyConfig) {
    try {
      const { name, type, host, port, username, password, cipher, uuid, alterId, network, plugin, pluginOpts, udp, tfo } = proxyConfig
      
      if (!name || !type || !host || !port) {
        throw new Error('代理名称、类型、主机和端口不能为空')
      }

      const result = await run(
        `INSERT INTO proxies (name, type, host, port, username, password, cipher, uuid, alterId, network, plugin, plugin_opts, udp, tfo) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          name, 
          type, 
          host, 
          port, 
          username || null, 
          password || null,
          cipher || null,
          uuid || null,
          alterId || null,
          network || null,
          plugin || null,
          pluginOpts || null,
          udp !== undefined ? udp : null,
          tfo !== undefined ? tfo : null
        ]
      )

      return { success: true, data: { id: result.id, ...proxyConfig } }
    } catch (error) {
      console.error('添加代理失败:', error)
      return { success: false, error: error.message }
    }
  }

  // 解析订阅链接
  async importSubscription(subscriptionUrl) {
    try {
      console.log('[ProxyManager] 开始导入订阅链接:', subscriptionUrl)
      
      // 下载订阅内容
      const response = await axios.get(subscriptionUrl, {
        timeout: 30000,
        responseType: 'text'
      })
      
      let content = response.data
      
      // 尝试 Base64 解码
      try {
        content = Buffer.from(content, 'base64').toString('utf-8')
      } catch (e) {
        // 如果不是 Base64，直接使用原始内容
      }
      
      // 解析为代理节点列表
      const proxies = this.parseSubscriptionContent(content)
      
      if (proxies.length === 0) {
        return { success: false, error: '订阅链接中未找到有效的代理节点' }
      }
      
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
      console.error('导入订阅链接失败:', error)
      return { success: false, error: error.message }
    }
  }

  // 解析订阅内容
  parseSubscriptionContent(content) {
    const proxies = []
    
    // 首先尝试解析为 Clash YAML 格式
    try {
      console.log('[ProxyManager] 尝试解析 YAML 格式...')
      console.log('[ProxyManager] 内容预览:', content.substring(0, 500))
      
      const config = YAML.parse(content)
      console.log('[ProxyManager] YAML 解析结果:', config ? 'success' : 'failed')
      
      if (config && config.proxies && Array.isArray(config.proxies)) {
        console.log('[ProxyManager] 检测到 Clash YAML 格式，包含', config.proxies.length, '个节点')
        console.log('[ProxyManager] 第一个节点示例:', JSON.stringify(config.proxies[0]))
        
        for (const node of config.proxies) {
          const proxy = this.convertClashNode(node)
          if (proxy) {
            proxies.push(proxy)
          }
        }
        return proxies
      }
    } catch (e) {
      console.error('[ProxyManager] YAML 解析失败:', e.message)
      // 不是 YAML 格式，继续尝试其他格式
    }

    // 按行解析链接格式
    const lines = content.split('\n').filter(line => line.trim())
    
    for (const line of lines) {
      try {
        // 解析 vmess:// 链接
        if (line.startsWith('vmess://')) {
          const proxy = this.parseVMessLink(line)
          if (proxy) proxies.push(proxy)
        }
        // 解析 ss:// 链接
        else if (line.startsWith('ss://')) {
          const proxy = this.parseShadowsocksLink(line)
          if (proxy) proxies.push(proxy)
        }
      } catch (error) {
        console.warn('[ProxyManager] 解析代理节点失败:', line.substring(0, 50), error.message)
      }
    }
    
    return proxies
  }

  // 解析 VMess 链接
  parseVMessLink(vmessUrl) {
    try {
      const base64 = vmessUrl.replace('vmess://', '')
      const decoded = Buffer.from(base64, 'base64').toString('utf-8')
      const config = JSON.parse(decoded)
      
      return {
        name: config.ps || `VMess-${config.add}:${config.port}`,
        type: 'vmess',
        host: config.add,
        port: config.port,
        uuid: config.id,
        alterId: config.aid || 0,
        cipher: config.scy || 'auto',
        network: config.net || 'tcp'
      }
    } catch (error) {
      console.error('解析 VMess 链接失败:', error)
      return null
    }
  }

  // 解析 Shadowsocks 链接 (SIP002 格式)
  parseShadowsocksLink(ssUrl) {
    try {
      // 格式: ss://base64(method:password)@server:port/?plugin=xxx#name
      // 或: ss://base64(method:password@server:port)#name
      
      let linkContent = ssUrl.replace('ss://', '')
      
      // 提取名称（# 后面的部分）
      let name = 'SS节点'
      const hashIndex = linkContent.indexOf('#')
      if (hashIndex !== -1) {
        name = decodeURIComponent(linkContent.substring(hashIndex + 1))
        linkContent = linkContent.substring(0, hashIndex)
      }
      
      // 提取插件参数（? 后面的部分）
      let pluginStr = ''
      const queryIndex = linkContent.indexOf('?')
      if (queryIndex !== -1) {
        pluginStr = linkContent.substring(queryIndex + 1)
        linkContent = linkContent.substring(0, queryIndex)
      }
      
      // 解析主要内容
      let method, password, server, port
      
      if (linkContent.includes('@')) {
        // 新格式: base64(method:password)@server:port
        const [userInfo, serverInfo] = linkContent.split('@')
        const decoded = Buffer.from(userInfo, 'base64').toString('utf-8')
        const [m, p] = decoded.split(':')
        method = m
        password = p
        
        const [s, po] = serverInfo.split(':')
        server = s
        port = parseInt(po)
      } else {
        // 旧格式: base64(method:password@server:port)
        const decoded = Buffer.from(linkContent, 'base64').toString('utf-8')
        const match = decoded.match(/^(.+?):(.+?)@(.+?):(\d+)$/)
        if (match) {
          method = match[1]
          password = match[2]
          server = match[3]
          port = parseInt(match[4])
        } else {
          throw new Error('无法解析 SS 链接格式')
        }
      }
      
      const result = {
        name: name.trim(),  // 去除名称中的空白字符
        type: 'ss',
        host: server,
        port: port,
        password: password,
        cipher: method
      }
      
      // 解析插件参数和其他查询参数
      if (pluginStr) {
        const pluginParams = new URLSearchParams(pluginStr)
        
        // 解析插件配置
        const pluginValue = pluginParams.get('plugin')
        if (pluginValue) {
          // 格式: obfs-local;obfs=http;obfs-host=xxx.com;tfo=1
          const parts = pluginValue.split(';')
          
          // 转换插件名：obfs-local -> obfs (Clash 使用 obfs)
          let pluginName = parts[0]
          if (pluginName === 'obfs-local') {
            pluginName = 'obfs'
          }
          result.plugin = pluginName
          
          const opts = {}
          for (let i = 1; i < parts.length; i++) {
            const [key, value] = parts[i].split('=')
            if (key === 'obfs') {
              opts.mode = value
            } else if (key === 'obfs-host') {
              opts.host = value
            } else if (key === 'tfo') {
              result.tfo = value === '1' || value === 'true'
            } else if (key === 'udp') {
              result.udp = value === '1' || value === 'true'
            }
          }
          
          if (Object.keys(opts).length > 0) {
            result.pluginOpts = JSON.stringify(opts)
          }
        }
        
        // 检查其他独立的查询参数
        const udpParam = pluginParams.get('udp')
        if (udpParam !== null) {
          result.udp = udpParam === '1' || udpParam === 'true'
        }
        
        const tfoParam = pluginParams.get('tfo')
        if (tfoParam !== null) {
          result.tfo = tfoParam === '1' || tfoParam === 'true'
        }
      }
      
      // 默认启用 UDP（如果没有明确指定）
      if (result.udp === undefined) {
        result.udp = true
      }
      
      return result
    } catch (error) {
      console.error('解析 Shadowsocks 链接失败:', error)
      return null
    }
  }

  // 转换 Clash 节点格式
  convertClashNode(node) {
    try {
      console.log('[ProxyManager] 原始节点数据:', JSON.stringify(node))
      
      // 验证必要字段
      if (!node || !node.server || node.port === undefined) {
        console.warn('[ProxyManager] 节点缺少必要字段:', node)
        return null
      }

      // 类型映射
      let type = node.type?.toLowerCase()
      if (type === 'shadowsocks' || type === 'ss') {
        type = 'ss'
      } else if (type === 'trojan' || type === 'ssr') {
        // 暂时将不支持的类型转换为 socks5
        console.warn(`[ProxyManager] 不支持的代理类型 ${type}，转换为 socks5`)
        type = 'socks5'
      } else if (!['http', 'https', 'socks5', 'ss', 'vmess'].includes(type)) {
        console.warn(`[ProxyManager] 未知的代理类型 ${type}，跳过`)
        return null
      }

      const proxy = {
        name: node.name || `${type}-${node.server}:${node.port}`,
        type: type,
        host: node.server,
        port: parseInt(node.port)
      }
      
      // 根据类型处理不同的字段
      if (type === 'ss') {
        proxy.password = node.password
        proxy.cipher = node.cipher || 'aes-256-gcm'
        // 保留插件信息
        if (node.plugin) proxy.plugin = node.plugin
        if (node['plugin-opts']) {
          proxy.pluginOpts = typeof node['plugin-opts'] === 'string' 
            ? node['plugin-opts'] 
            : JSON.stringify(node['plugin-opts'])
        }
        // 保留 UDP 和 TCP Fast Open 配置
        if (node.udp !== undefined) proxy.udp = node.udp
        if (node.tfo !== undefined) proxy.tfo = node.tfo
      } else if (type === 'vmess') {
        proxy.uuid = node.uuid
        proxy.alterId = node.alterId || 0
        proxy.network = node.network || 'tcp'
        proxy.cipher = node.cipher || 'auto'
        // 处理 TLS 相关配置
        if (node.tls !== undefined) proxy.tls = node.tls
        if (node['skip-cert-verify'] !== undefined) proxy['skip-cert-verify'] = node['skip-cert-verify']
        if (node.servername) proxy.servername = node.servername
        // 处理 WS 配置（如果 network 是 ws）
        if (node.network === 'ws') {
          if (node['ws-opts']) {
            proxy['ws-opts'] = typeof node['ws-opts'] === 'string' 
              ? node['ws-opts'] 
              : JSON.stringify(node['ws-opts'])
          }
          if (node['ws-path']) proxy['ws-path'] = node['ws-path']
          if (node['ws-headers']) proxy['ws-headers'] = typeof node['ws-headers'] === 'string'
            ? node['ws-headers']
            : JSON.stringify(node['ws-headers'])
        }
      } else {
        if (node.username) proxy.username = node.username
        if (node.password) proxy.password = node.password
      }
      
      console.log('[ProxyManager] 转换后的代理:', JSON.stringify(proxy))
      return proxy
    } catch (error) {
      console.error('转换 Clash 节点失败:', error)
      return null
    }
  }

  // 更新代理
  async updateProxy(proxyId, proxyConfig) {
    try {
      const { name, type, host, port, username, password, is_enabled, cipher, uuid, alterId, network, plugin, pluginOpts, udp, tfo } = proxyConfig
      
      const result = await run(
        `UPDATE proxies 
         SET name = ?, type = ?, host = ?, port = ?, username = ?, password = ?, 
             cipher = ?, uuid = ?, alterId = ?, network = ?, plugin = ?, plugin_opts = ?, udp = ?, tfo = ?,
             is_enabled = ?, updated_at = CURRENT_TIMESTAMP 
         WHERE id = ?`,
        [
          name, 
          type, 
          host, 
          port, 
          username || null, 
          password || null, 
          cipher || null,
          uuid || null,
          alterId || null,
          network || null,
          plugin || null,
          pluginOpts || null,
          udp !== undefined ? udp : null,
          tfo !== undefined ? tfo : null,
          is_enabled, 
          proxyId
        ]
      )

      if (result.changes === 0) {
        throw new Error('代理不存在')
      }

      return { success: true, message: '代理更新成功' }
    } catch (error) {
      console.error('更新代理失败:', error)
      return { success: false, error: error.message }
    }
  }

  // 删除代理
  async deleteProxy(proxyId) {
    try {
      const result = await run('DELETE FROM proxies WHERE id = ?', [proxyId])
      if (result.changes === 0) {
        throw new Error('代理不存在')
      }

      return { success: true, message: '代理删除成功' }
    } catch (error) {
      console.error('删除代理失败:', error)
      return { success: false, error: error.message }
    }
  }

  // 测试代理连接（真实通过代理访问）
  async testProxy(proxyId) {
    try {
      const proxy = await get('SELECT * FROM proxies WHERE id = ?', [proxyId])
      if (!proxy) {
        throw new Error('代理不存在')
      }

      console.log('[ProxyManager] 开始测试代理:', proxy.name)
      
      // 对于 SS 和 VMess 等复杂协议，需要通过 Clash 测试
      if (['ss', 'vmess', 'trojan'].includes(proxy.type.toLowerCase())) {
        return await this.testProxyThroughClash(proxy)
      } else {
        // HTTP/HTTPS/SOCKS5 可以直接测试
        return await this.testSimpleProxy(proxy)
      }
    } catch (error) {
      console.error('测试代理失败:', error)
      return { success: false, error: error.message }
    }
  }

  // 测试简单代理（HTTP/SOCKS5）
  async testSimpleProxy(proxy) {
    try {
      const proxyUrl = this.buildProxyUrl(proxy)
      console.log('[ProxyManager] 测试简单代理:', proxyUrl)
      
      let agent
      if (proxy.type.toLowerCase() === 'socks5') {
        agent = new SocksProxyAgent(proxyUrl)
      } else {
        agent = new HttpsProxyAgent(proxyUrl)
      }
      
      const startTime = Date.now()
      const response = await axios.get('https://api.ipify.org?format=json', {
        httpsAgent: agent,
        timeout: 15000
      })
      const responseTime = Date.now() - startTime
      
      return {
        success: true,
        ip: response.data.ip,
        responseTime: `${responseTime}ms`,
        message: '代理测试成功'
      }
    } catch (error) {
      return {
        success: false,
        error: error.message || '代理连接失败'
      }
    }
  }

  // 通过临时 Clash 测试复杂代理
  async testProxyThroughClash(proxy) {
    let tempClashProcess = null
    let tempConfigPath = null
    const tempPort = 17890 + Math.floor(Math.random() * 1000)
    const tempControllerPort = 19090 + Math.floor(Math.random() * 1000)
    const tempSecret = require('crypto').randomBytes(8).toString('hex')
    
    try {
      console.log('[ProxyManager] 创建临时 Clash 进行代理测试...')
      
      const clashBinary = this.getClashBinary()
      if (!fs.existsSync(clashBinary)) {
        throw new Error('Clash 可执行文件不存在')
      }
      
      // 生成临时测试配置
      const tempConfig = this.generateClashConfig([proxy], tempPort, tempPort + 1, tempControllerPort, tempSecret)
      tempConfigPath = path.join(app.getPath('temp'), `clash-test-${Date.now()}.yaml`)
      
      const configYaml = YAML.stringify(tempConfig, 4)
      fs.writeFileSync(tempConfigPath, configYaml, 'utf8')
      console.log('[ProxyManager] 临时配置文件已创建:', tempConfigPath)
      console.log('[ProxyManager] 临时配置内容:\n', configYaml)
      
      // 启动临时 Clash
      tempClashProcess = spawn(clashBinary, [
        '-f', tempConfigPath,
        '-d', path.dirname(tempConfigPath)
      ], {
        stdio: ['pipe', 'pipe', 'pipe'],
        detached: false,
        windowsHide: true,
        cwd: path.dirname(clashBinary)
      })
      
      // 监听输出用于调试
      tempClashProcess.stdout.on('data', (data) => {
        console.log(`[TempClash] 输出:`, data.toString().trim())
      })
      
      tempClashProcess.stderr.on('data', (data) => {
        console.log(`[TempClash] 错误:`, data.toString().trim())
      })
      
      console.log('[ProxyManager] 临时 Clash 进程已启动')
      
      // 等待 Clash 启动
      await this.waitForClashReady(tempControllerPort, tempSecret, 20)
      console.log('[ProxyManager] 临时 Clash 就绪')
      
      // 额外等待，确保代理完全初始化
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      // 通过 Clash 代理测试
      console.log('[ProxyManager] 开始通过 Clash 代理发送测试请求...')
      const startTime = Date.now()
      
      try {
        const response = await axios.get('https://api.ipify.org?format=json', {
          proxy: false,
          httpsAgent: new HttpsProxyAgent(`http://127.0.0.1:${tempPort}`),
          httpAgent: new HttpProxyAgent(`http://127.0.0.1:${tempPort}`),
          timeout: 15000
        })
        const responseTime = Date.now() - startTime
        
        console.log('[ProxyManager] 代理测试成功，响应时间:', responseTime, 'ms')
        console.log('[ProxyManager] 代理IP:', response.data.ip)
        
        return {
          success: true,
          ip: response.data.ip,
          responseTime: `${responseTime}ms`,
          message: '通过 Clash 代理测试成功'
        }
      } catch (err) {
        console.error('[ProxyManager] 测试请求失败:', err.message)
        throw err
      }
    } catch (error) {
      console.error('[ProxyManager] 代理测试失败:', error)
      return {
        success: false,
        error: error.message || '代理功能测试失败'
      }
    } finally {
      // 清理临时资源
      if (tempClashProcess) {
        tempClashProcess.kill()
      }
      
      if (tempConfigPath && fs.existsSync(tempConfigPath)) {
        try {
          fs.unlinkSync(tempConfigPath)
        } catch (e) {
          console.warn('[ProxyManager] 清理临时文件失败:', e)
        }
      }
    }
  }

  // 构建代理 URL
  buildProxyUrl(proxy) {
    let auth = ''
    if (proxy.username && proxy.password) {
      auth = `${proxy.username}:${proxy.password}@`
    }
    
    const protocol = proxy.type.toLowerCase() === 'socks5' ? 'socks5' : 'http'
    return `${protocol}://${auth}${proxy.host}:${proxy.port}`
  }

  // 为蜂巢启动代理
  async startProxyForHive(hiveId, proxyId) {
    try {
      // 如果已有代理在运行，先停止
      if (this.hiveClashProcesses.has(hiveId)) {
        await this.stopProxyForHive(hiveId)
      }

      const proxy = await get('SELECT * FROM proxies WHERE id = ?', [proxyId])
      if (!proxy) {
        throw new Error('代理不存在')
      }
      
      console.log(`[ProxyManager] 获取到的代理信息:`, proxy)

      // 获取端口
      const { httpPort, socksPort, controllerPort } = this.getNextPorts()
      const secret = this.generateApiSecret()

      // 生成 Clash 配置
      const clashConfig = this.generateClashConfig([proxy], httpPort, socksPort, controllerPort, secret)
      const configPath = path.join(app.getPath('userData'), `clash-config-${hiveId}.yaml`)
      const configYaml = YAML.stringify(clashConfig, 4)
      
      console.log(`[ProxyManager] 生成的 Clash 配置:`)
      console.log(configYaml)
      
      fs.writeFileSync(configPath, configYaml, 'utf8')

      // 启动 Clash 进程
      const clashBinary = this.getClashBinary()
      console.log(`[ProxyManager] Clash 二进制文件路径: ${clashBinary}`)
      if (!fs.existsSync(clashBinary)) {
        throw new Error(`Clash 可执行文件不存在: ${clashBinary}，请确保已放置在 resources 目录下`)
      }

      const clashProcess = spawn(clashBinary, [
        '-f', configPath,
        '-d', path.dirname(configPath)
      ], {
        stdio: ['pipe', 'pipe', 'pipe'],
        detached: false,
        windowsHide: true,
        cwd: path.dirname(clashBinary)
      })

      // 监听 Clash 输出
      clashProcess.stdout.on('data', (data) => {
        console.log(`[Clash ${hiveId}] 输出:`, data.toString())
      })
      
      clashProcess.stderr.on('data', (data) => {
        console.error(`[Clash ${hiveId}] 错误:`, data.toString())
      })
      
      clashProcess.on('error', (error) => {
        console.error(`[Clash ${hiveId}] 进程错误:`, error)
      })
      
      clashProcess.on('exit', (code, signal) => {
        console.log(`[Clash ${hiveId}] 进程退出，代码:`, code, '信号:', signal)
        this.hiveClashProcesses.delete(hiveId)
      })

      // 保存进程信息
      this.hiveClashProcesses.set(hiveId, {
        process: clashProcess,
        httpPort,
        socksPort,
        controllerPort,
        secret,
        proxyId,
        configPath
      })

      // 等待 Clash 启动
      await this.waitForClashReady(controllerPort, secret)

      console.log(`[ProxyManager] 蜂巢 ${hiveId} 的代理已启动，端口: ${httpPort}`)

      return {
        success: true,
        data: {
          httpPort,
          socksPort,
          proxyId: proxy.id
        }
      }
    } catch (error) {
      console.error('启动蜂巢代理失败:', error)
      return { success: false, error: error.message }
    }
  }

  // 停止蜂巢代理
  async stopProxyForHive(hiveId) {
    try {
      const clashInfo = this.hiveClashProcesses.get(hiveId)
      if (!clashInfo) {
        return { success: true, message: '代理未运行' }
      }

      if (clashInfo.process) {
        clashInfo.process.kill()
      }

      // 删除配置文件
      if (clashInfo.configPath && fs.existsSync(clashInfo.configPath)) {
        fs.unlinkSync(clashInfo.configPath)
      }

      this.hiveClashProcesses.delete(hiveId)

      console.log(`[ProxyManager] 蜂巢 ${hiveId} 的代理已停止`)

      return { success: true, message: '代理已停止' }
    } catch (error) {
      console.error('停止蜂巢代理失败:', error)
      return { success: false, error: error.message }
    }
  }

  // 获取蜂巢代理信息
  getHiveProxyInfo(hiveId) {
    const clashInfo = this.hiveClashProcesses.get(hiveId)
    if (!clashInfo) {
      return null
    }

    return {
      httpPort: clashInfo.httpPort,
      socksPort: clashInfo.socksPort,
      proxyId: clashInfo.proxyId
    }
  }

  // 生成 Clash 配置
  generateClashConfig(proxies, httpPort, socksPort, controllerPort, secret) {
    const clashConfig = {
      port: httpPort,
      'socks-port': socksPort,
      'allow-lan': false,
      'bind-address': '127.0.0.1',
      mode: 'rule',  // 使用规则模式
      'log-level': 'debug',  // 改为 debug 获取更详细的日志
      'external-controller': `127.0.0.1:${controllerPort}`,
      secret: secret,
      
      // 禁用 GeoIP 自动更新，避免启动时下载失败
      'geodata-mode': false,
      'geo-auto-update': false,
      'geox-url': {
        'geoip': '',
        'geosite': '',
        'mmdb': ''
      },
      
      // 简化 DNS 配置，不使用需要 GeoIP 的 fallback 功能
      dns: {
        enable: true,
        ipv6: false,
        'default-nameserver': ['223.5.5.5', '119.29.29.29'],
        'enhanced-mode': 'fake-ip',
        'fake-ip-range': '198.18.0.1/16',
        'use-hosts': true,
        nameserver: ['223.5.5.5', '119.29.29.29', '8.8.8.8']
        // 移除 fallback 配置，因为它需要 GeoIP 数据库
      },
      
      proxies: [],
      'proxy-groups': [],
      rules: []
    }

    // 添加代理节点
    proxies.forEach(proxy => {
      const proxyNode = {
        name: proxy.name,
        type: this.convertProxyType(proxy.type),
        server: proxy.host,
        port: proxy.port
      }

      switch (proxy.type.toLowerCase()) {
        case 'http':
        case 'https':
          if (proxy.username && proxy.password) {
            proxyNode.username = proxy.username
            proxyNode.password = proxy.password
          }
          break
        case 'socks5':
          proxyNode.type = 'socks5'
          if (proxy.username && proxy.password) {
            proxyNode.username = proxy.username
            proxyNode.password = proxy.password
          }
          break
        case 'ss':
          proxyNode.type = 'ss'
          // Shadowsocks 配置
          proxyNode.cipher = proxy.cipher || 'aes-256-gcm'
          proxyNode.password = proxy.password
          // 插件配置
          if (proxy.plugin) {
            proxyNode.plugin = proxy.plugin
          }
          if (proxy.plugin_opts) {
            try {
              proxyNode['plugin-opts'] = typeof proxy.plugin_opts === 'string' 
                ? JSON.parse(proxy.plugin_opts)
                : proxy.plugin_opts
            } catch (e) {
              proxyNode['plugin-opts'] = proxy.plugin_opts
            }
          }
          // UDP 和 TCP Fast Open
          if (proxy.udp !== undefined) {
            proxyNode.udp = proxy.udp
          }
          if (proxy.tfo !== undefined) {
            proxyNode.tfo = proxy.tfo
          }
          break
        case 'vmess':
          proxyNode.type = 'vmess'
          proxyNode.uuid = proxy.uuid
          proxyNode.alterId = proxy.alterId || 0
          proxyNode.cipher = proxy.cipher || 'auto'
          if (proxy.network) {
            proxyNode.network = proxy.network
          }
          // VMess 可能需要的额外配置（TLS）
          if (proxy.tls !== undefined && proxy.tls !== null) {
            proxyNode.tls = proxy.tls === true || proxy.tls === 'true' || proxy.tls === 1
          }
          if (proxy['skip-cert-verify'] !== undefined && proxy['skip-cert-verify'] !== null) {
            proxyNode['skip-cert-verify'] = proxy['skip-cert-verify'] === true || proxy['skip-cert-verify'] === 'true' || proxy['skip-cert-verify'] === 1
          }
          if (proxy.servername) {
            proxyNode.servername = proxy.servername
          }
          // 处理 WebSocket 配置（如果 network 是 ws）
          if (proxy.network === 'ws' || proxy.network === 'websocket') {
            if (proxy['ws-opts']) {
              try {
                proxyNode['ws-opts'] = typeof proxy['ws-opts'] === 'string' 
                  ? JSON.parse(proxy['ws-opts'])
                  : proxy['ws-opts']
              } catch (e) {
                console.warn('[ProxyManager] 解析 ws-opts 失败:', e)
              }
            }
            if (proxy['ws-path']) proxyNode['ws-path'] = proxy['ws-path']
            if (proxy['ws-headers']) {
              try {
                proxyNode['ws-headers'] = typeof proxy['ws-headers'] === 'string'
                  ? JSON.parse(proxy['ws-headers'])
                  : proxy['ws-headers']
              } catch (e) {
                console.warn('[ProxyManager] 解析 ws-headers 失败:', e)
              }
            }
          }
          break
      }

      clashConfig.proxies.push(proxyNode)
    })

    // 如果有代理节点，配置代理组和规则
    if (proxies.length > 0) {
      // 创建代理组，包含代理节点和 DIRECT 作为后备
      clashConfig['proxy-groups'] = [{
        name: 'Proxy',
        type: 'select',
        proxies: [...clashConfig.proxies.map(p => p.name), 'DIRECT']  // 添加 DIRECT 作为后备
      }]
      
      // 设置规则：本地网络直连，其他走代理
      clashConfig.rules = [
        // 本地网络直连
        'DOMAIN-SUFFIX,local,DIRECT',
        'IP-CIDR,127.0.0.0/8,DIRECT',
        'IP-CIDR,172.16.0.0/12,DIRECT',
        'IP-CIDR,192.168.0.0/16,DIRECT',
        'IP-CIDR,10.0.0.0/8,DIRECT',
        'IP-CIDR,17.0.0.0/8,DIRECT',
        'IP-CIDR,100.64.0.0/10,DIRECT',
        // 其他全部走代理
        'MATCH,Proxy'
      ]
    } else {
      // 没有代理时使用直连
      clashConfig.rules = ['MATCH,DIRECT']
    }

    return clashConfig
  }

  // 转换代理类型
  convertProxyType(type) {
    const typeMap = {
      'http': 'http',
      'https': 'http',
      'socks5': 'socks5',
      'ss': 'ss',
      'vmess': 'vmess',
      'trojan': 'trojan'
    }
    return typeMap[type.toLowerCase()] || 'http'
  }

  // 等待 Clash 就绪
  async waitForClashReady(controllerPort, secret, maxAttempts = 10) {
    for (let i = 0; i < maxAttempts; i++) {
      try {
        const response = await axios.get(
          `http://127.0.0.1:${controllerPort}/version`,
          {
            headers: { 'Authorization': `Bearer ${secret}` },
            timeout: 2000
          }
        )
        
        if (response.data) {
          console.log('Clash 就绪，版本:', response.data.version)
          return true
        }
      } catch (error) {
        await new Promise(resolve => setTimeout(resolve, 1000))
      }
    }
    
    throw new Error('Clash 启动超时')
  }

  // 获取 Clash 可执行文件路径
  getClashBinary() {
    const platform = process.platform
    const arch = process.arch
    const possiblePaths = []
    
    console.log(`[ProxyManager] ========== 查找 Clash 二进制文件 ==========`)
    console.log(`[ProxyManager] 平台: ${platform}`)
    console.log(`[ProxyManager] 架构: ${arch}`)
    console.log(`[ProxyManager] process.resourcesPath: ${process.resourcesPath}`)
    console.log(`[ProxyManager] __dirname: ${__dirname}`)
    console.log(`[ProxyManager] process.cwd(): ${process.cwd()}`)
    
    if (process.resourcesPath) {
      possiblePaths.push(path.join(process.resourcesPath, 'resources'))
    }
    
    possiblePaths.push(path.join(__dirname, '../../resources'))
    possiblePaths.push(path.join(process.cwd(), 'resources'))
    
    // 根据平台和架构确定文件名
    let fileName
    switch (platform) {
      case 'win32':
        fileName = 'clash-windows-amd64.exe'
        break
      case 'darwin':
        // macOS 需要根据架构选择
        if (arch === 'arm64') {
          fileName = 'clash-darwin-arm64'
          console.log(`[ProxyManager] 检测到 ARM64 Mac，使用: ${fileName}`)
        } else {
          fileName = 'clash-darwin-amd64'
          console.log(`[ProxyManager] 检测到 x64 Mac，使用: ${fileName}`)
        }
        break
      case 'linux':
        // Linux 也需要根据架构选择
        if (arch === 'arm64') {
          fileName = 'clash-linux-arm64'
          console.log(`[ProxyManager] 检测到 ARM64 Linux，使用: ${fileName}`)
        } else {
          fileName = 'clash-linux-amd64'
          console.log(`[ProxyManager] 检测到 x64 Linux，使用: ${fileName}`)
        }
        break
      default:
        throw new Error(`不支持的平台: ${platform}`)
    }
    
    console.log(`[ProxyManager] 目标文件名: ${fileName}`)
    console.log(`[ProxyManager] 搜索路径:`, possiblePaths)
    
    // 首先尝试使用架构特定的文件
    for (const resourcesPath of possiblePaths) {
      const binaryPath = path.join(resourcesPath, fileName)
      console.log(`[ProxyManager] 检查路径: ${binaryPath}`)
      if (fs.existsSync(binaryPath)) {
        console.log(`[ProxyManager] ✅ 找到 Clash 文件: ${binaryPath}`)
        console.log(`[ProxyManager] =========================================`)
        return binaryPath
      }
    }
    
    // 如果在 macOS/Linux 上没找到架构特定的文件，尝试回退到 amd64（兼容性）
    if ((platform === 'darwin' || platform === 'linux') && arch === 'arm64') {
      const fallbackFileName = platform === 'darwin' ? 'clash-darwin-amd64' : 'clash-linux-amd64'
      console.log(`[ProxyManager] ⚠️  未找到 ARM64 版本，尝试回退到: ${fallbackFileName}`)
      
      for (const resourcesPath of possiblePaths) {
        const binaryPath = path.join(resourcesPath, fallbackFileName)
        console.log(`[ProxyManager] 检查回退路径: ${binaryPath}`)
        if (fs.existsSync(binaryPath)) {
          console.log(`[ProxyManager] ✅ 找到回退 Clash 文件: ${binaryPath}`)
          console.log(`[ProxyManager] =========================================`)
          return binaryPath
        }
      }
    }
    
    const defaultPath = path.join(process.cwd(), 'resources', fileName)
    console.log(`[ProxyManager] ⚠️  未找到文件，使用默认路径: ${defaultPath}`)
    console.log(`[ProxyManager] =========================================`)
    return defaultPath
  }
}

module.exports = { ProxyManager }
