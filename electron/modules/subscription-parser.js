/**
 * 订阅解析模块
 * 负责解析各种代理订阅链接和协议链接
 */

const axios = require('axios')
const YAML = require('yamljs')

class SubscriptionParser {
  /**
   * 导入订阅链接
   */
  async importSubscription(subscriptionUrl) {
    try {
      console.log('[SubscriptionParser] 开始导入订阅链接:', subscriptionUrl)

      // 下载订阅内容，使用 Clash 的 User-Agent 以获取 YAML 格式
      const response = await axios.get(subscriptionUrl, {
        timeout: 30000,
        responseType: 'text',
        headers: {
          'User-Agent': 'clash-verge/v1.3.8'
        }
      })

      let content = response.data
      console.log('[SubscriptionParser] 订阅原始内容长度:', content.length)
      console.log('[SubscriptionParser] 内容开头:', content.substring(0, 100))

      // 检查是否需要 Base64 解码
      const isYaml = content.includes('proxies:') || content.trim().startsWith('-')
      const isLink = content.startsWith('vmess://') || content.startsWith('ss://') ||
                     content.startsWith('trojan://') || content.startsWith('hysteria')

      if (!isYaml && !isLink) {
        try {
          const decoded = Buffer.from(content, 'base64').toString('utf-8')
          if (decoded && (decoded.includes('proxies:') || decoded.includes('://') || decoded.trim().startsWith('-'))) {
            console.log('[SubscriptionParser] Base64 解码成功')
            content = decoded
          }
        } catch (e) {
          console.log('[SubscriptionParser] Base64 解码失败，使用原始内容')
        }
      } else {
        console.log('[SubscriptionParser] 检测到明文格式，跳过 Base64 解码')
      }

      // 解析为代理节点列表
      const proxies = this.parseSubscriptionContent(content)

      if (proxies.length === 0) {
        return { success: false, error: '订阅链接中未找到有效的代理节点' }
      }

      return {
        success: true,
        data: proxies
      }
    } catch (error) {
      console.error('[SubscriptionParser] 导入订阅链接失败:', error)
      return { success: false, error: error.message }
    }
  }

  /**
   * 解析订阅内容
   */
  parseSubscriptionContent(content) {
    const proxies = []

    // 首先尝试解析为 Clash YAML 格式
    try {
      console.log('[SubscriptionParser] 尝试解析 YAML 格式...')
      const config = YAML.parse(content)

      if (config && config.proxies && Array.isArray(config.proxies)) {
        console.log('[SubscriptionParser] 检测到 Clash YAML 格式，包含', config.proxies.length, '个节点')

        for (const node of config.proxies) {
          const proxy = this.convertClashNode(node)
          if (proxy) {
            proxies.push(proxy)
          } else {
            console.warn('[SubscriptionParser] 转换节点失败，跳过:', node.name || '未知节点')
          }
        }
        console.log('[SubscriptionParser] 成功转换', proxies.length, '个节点')
        return proxies
      }
    } catch (e) {
      console.error('[SubscriptionParser] YAML 解析失败:', e.message)
    }

    // 尝试解析为 YAML 节点数组（直接是 proxies 数组）
    try {
      console.log('[SubscriptionParser] 尝试解析为 YAML 节点数组...')
      const nodes = YAML.parse(content)

      if (Array.isArray(nodes)) {
        console.log('[SubscriptionParser] 检测到 YAML 节点数组格式，包含', nodes.length, '个节点')

        for (const node of nodes) {
          const proxy = this.convertClashNode(node)
          if (proxy) {
            proxies.push(proxy)
          }
        }

        if (proxies.length > 0) {
          console.log('[SubscriptionParser] 成功转换', proxies.length, '个节点')
          return proxies
        }
      }
    } catch (e) {
      console.error('[SubscriptionParser] YAML 节点数组解析失败:', e.message)
    }

    // 按行解析链接格式
    const lines = content.split('\n').filter(line => line.trim())

    for (const line of lines) {
      try {
        if (line.startsWith('vmess://')) {
          const proxy = this.parseVMessLink(line)
          if (proxy) proxies.push(proxy)
        } else if (line.startsWith('ss://')) {
          const proxy = this.parseShadowsocksLink(line)
          if (proxy) proxies.push(proxy)
        } else if (line.startsWith('trojan://')) {
          const proxy = this.parseTrojanLink(line)
          if (proxy) proxies.push(proxy)
        } else if (line.startsWith('hysteria2://') || line.startsWith('hy2://')) {
          const proxy = this.parseHysteria2Link(line)
          if (proxy) proxies.push(proxy)
        } else if (line.startsWith('hysteria://')) {
          const proxy = this.parseHysteriaLink(line)
          if (proxy) proxies.push(proxy)
        }
      } catch (error) {
        console.warn('[SubscriptionParser] 解析代理节点失败:', line.substring(0, 50), error.message)
      }
    }

    return proxies
  }

  /**
   * 解析 VMess 链接
   */
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
      console.error('[SubscriptionParser] 解析 VMess 链接失败:', error)
      return null
    }
  }

  /**
   * 解析 Shadowsocks 链接 (SIP002 格式)
   */
  parseShadowsocksLink(ssUrl) {
    try {
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
        name: name.trim(),
        type: 'ss',
        host: server,
        port: port,
        password: password,
        cipher: method
      }

      // 解析插件参数
      if (pluginStr) {
        const pluginParams = new URLSearchParams(pluginStr)
        const pluginValue = pluginParams.get('plugin')
        
        if (pluginValue) {
          const parts = pluginValue.split(';')
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

        const udpParam = pluginParams.get('udp')
        if (udpParam !== null) {
          result.udp = udpParam === '1' || udpParam === 'true'
        }

        const tfoParam = pluginParams.get('tfo')
        if (tfoParam !== null) {
          result.tfo = tfoParam === '1' || tfoParam === 'true'
        }
      }

      if (result.udp === undefined) {
        result.udp = true
      }

      return result
    } catch (error) {
      console.error('[SubscriptionParser] 解析 Shadowsocks 链接失败:', error)
      return null
    }
  }

  /**
   * 解析 Trojan 链接
   */
  parseTrojanLink(trojanUrl) {
    try {
      let linkContent = trojanUrl.replace('trojan://', '')

      // 提取名称
      let name = 'Trojan节点'
      const hashIndex = linkContent.indexOf('#')
      if (hashIndex !== -1) {
        name = decodeURIComponent(linkContent.substring(hashIndex + 1))
        linkContent = linkContent.substring(0, hashIndex)
      }

      // 提取查询参数
      let queryStr = ''
      const queryIndex = linkContent.indexOf('?')
      if (queryIndex !== -1) {
        queryStr = linkContent.substring(queryIndex + 1)
        linkContent = linkContent.substring(0, queryIndex)
      }

      // 解析主要内容
      const [password, serverInfo] = linkContent.split('@')
      const [server, port] = serverInfo.split(':')

      const result = {
        name: name.trim(),
        type: 'trojan',
        host: server,
        port: parseInt(port),
        password: password
      }

      // 解析查询参数
      if (queryStr) {
        const params = new URLSearchParams(queryStr)

        if (params.has('sni')) result.sni = params.get('sni')
        if (params.has('type')) result.network = params.get('type')
        if (params.has('security')) result.security = params.get('security')
        if (params.has('alpn')) result.alpn = params.get('alpn')

        const skipCertVerify = params.get('allowInsecure') || params.get('skip-cert-verify')
        if (skipCertVerify !== null) {
          result.skipCertVerify = skipCertVerify === '1' || skipCertVerify === 'true'
        }

        const udp = params.get('udp')
        if (udp !== null) {
          result.udp = udp === '1' || udp === 'true'
        }
      }

      return result
    } catch (error) {
      console.error('[SubscriptionParser] 解析 Trojan 链接失败:', error)
      return null
    }
  }

  /**
   * 解析 Hysteria2 链接
   */
  parseHysteria2Link(hy2Url) {
    try {
      let linkContent = hy2Url.replace('hysteria2://', '').replace('hy2://', '')

      let name = 'Hysteria2节点'
      const hashIndex = linkContent.indexOf('#')
      if (hashIndex !== -1) {
        name = decodeURIComponent(linkContent.substring(hashIndex + 1))
        linkContent = linkContent.substring(0, hashIndex)
      }

      let queryStr = ''
      const queryIndex = linkContent.indexOf('?')
      if (queryIndex !== -1) {
        queryStr = linkContent.substring(queryIndex + 1)
        linkContent = linkContent.substring(0, queryIndex)
      }

      const [password, serverInfo] = linkContent.split('@')
      const [server, port] = serverInfo.split(':')

      const result = {
        name: name.trim(),
        type: 'hysteria2',
        host: server,
        port: parseInt(port),
        password: password
      }

      if (queryStr) {
        const params = new URLSearchParams(queryStr)

        if (params.has('sni')) result.sni = params.get('sni')
        if (params.has('ports')) result.ports = params.get('ports')
        if (params.has('up')) result.up = parseInt(params.get('up'))
        if (params.has('down')) result.down = parseInt(params.get('down'))

        const insecure = params.get('insecure') || params.get('skip-cert-verify')
        if (insecure !== null) {
          result.skipCertVerify = insecure === '1' || insecure === 'true'
        }

        const udp = params.get('udp')
        if (udp !== null) {
          result.udp = udp === '1' || udp === 'true'
        }
      }

      return result
    } catch (error) {
      console.error('[SubscriptionParser] 解析 Hysteria2 链接失败:', error)
      return null
    }
  }

  /**
   * 解析 Hysteria 链接
   */
  parseHysteriaLink(hyUrl) {
    try {
      let linkContent = hyUrl.replace('hysteria://', '')

      let name = 'Hysteria节点'
      const hashIndex = linkContent.indexOf('#')
      if (hashIndex !== -1) {
        name = decodeURIComponent(linkContent.substring(hashIndex + 1))
        linkContent = linkContent.substring(0, hashIndex)
      }

      let queryStr = ''
      const queryIndex = linkContent.indexOf('?')
      if (queryIndex !== -1) {
        queryStr = linkContent.substring(queryIndex + 1)
        linkContent = linkContent.substring(0, queryIndex)
      }

      const [server, port] = linkContent.split(':')

      const result = {
        name: name.trim(),
        type: 'hysteria',
        host: server,
        port: parseInt(port)
      }

      if (queryStr) {
        const params = new URLSearchParams(queryStr)

        if (params.has('auth')) result.authStr = params.get('auth')
        if (params.has('password')) result.password = params.get('password')
        if (params.has('peer') || params.has('sni')) result.sni = params.get('peer') || params.get('sni')
        if (params.has('alpn')) result.alpn = params.get('alpn')
        if (params.has('protocol')) result.protocol = params.get('protocol')
        if (params.has('upmbps')) result.up = parseInt(params.get('upmbps'))
        if (params.has('downmbps')) result.down = parseInt(params.get('downmbps'))

        const insecure = params.get('insecure') || params.get('allowInsecure')
        if (insecure !== null) {
          result.skipCertVerify = insecure === '1' || insecure === 'true'
        }

        const fastOpen = params.get('fastopen') || params.get('fast-open')
        if (fastOpen !== null) {
          result.fastOpen = fastOpen === '1' || fastOpen === 'true'
        }
      }

      return result
    } catch (error) {
      console.error('[SubscriptionParser] 解析 Hysteria 链接失败:', error)
      return null
    }
  }

  /**
   * 转换 Clash 节点格式
   */
  convertClashNode(node) {
    try {
      if (!node || !node.server || node.port === undefined) {
        console.warn('[SubscriptionParser] 节点缺少必要字段 (server/port):', node?.name || '未知节点')
        return null
      }

      let type = node.type?.toLowerCase()
      if (!type) {
        console.warn('[SubscriptionParser] 节点缺少 type 字段:', node.name || '未知节点')
        return null
      }

      if (type === 'shadowsocks' || type === 'ss') {
        type = 'ss'
      } else if (type === 'ssr') {
        console.warn(`[SubscriptionParser] 不支持的代理类型 ${type}，转换为 socks5`)
        type = 'socks5'
      } else if (!['http', 'https', 'socks5', 'ss', 'vmess', 'trojan', 'hysteria', 'hysteria2', 'anytls'].includes(type)) {
        console.warn(`[SubscriptionParser] 未知的代理类型 ${type}，跳过节点: ${node.name || '未知'}`)
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
        if (node.plugin) proxy.plugin = node.plugin
        if (node['plugin-opts']) {
          proxy.pluginOpts = typeof node['plugin-opts'] === 'string'
            ? node['plugin-opts']
            : JSON.stringify(node['plugin-opts'])
        }
        if (node.udp !== undefined) proxy.udp = node.udp
        if (node.tfo !== undefined) proxy.tfo = node.tfo
      } else if (type === 'hysteria2') {
        proxy.password = node.password
        if (node.ports) proxy.ports = node.ports
        if (node['skip-cert-verify'] !== undefined) proxy.skipCertVerify = node['skip-cert-verify']
        if (node.sni) proxy.sni = node.sni
        if (node.up !== undefined) proxy.up = node.up
        if (node.down !== undefined) proxy.down = node.down
        if (node.udp !== undefined) proxy.udp = node.udp
        if (node.tfo !== undefined) proxy.tfo = node.tfo
      } else if (type === 'hysteria') {
        if (node.auth_str) proxy.authStr = node.auth_str
        if (node.password) proxy.password = node.password
        if (node.ports) proxy.ports = node.ports
        if (node['skip-cert-verify'] !== undefined) proxy.skipCertVerify = node['skip-cert-verify']
        if (node.sni) proxy.sni = node.sni
        if (node.up !== undefined) proxy.up = node.up
        if (node.down !== undefined) proxy.down = node.down
        if (node.alpn) proxy.alpn = Array.isArray(node.alpn) ? JSON.stringify(node.alpn) : node.alpn
        if (node.protocol) proxy.protocol = node.protocol
        if (node['fast-open'] !== undefined) proxy.fastOpen = node['fast-open']
        if (node.disable_mtu_discovery !== undefined) proxy.disableMtuDiscovery = node.disable_mtu_discovery
      } else if (type === 'anytls') {
        proxy.password = node.password
        if (node['client-fingerprint']) proxy.clientFingerprint = node['client-fingerprint']
        if (node.sni) proxy.sni = node.sni
        if (node['skip-cert-verify'] !== undefined) proxy.skipCertVerify = node['skip-cert-verify']
        if (node.udp !== undefined) proxy.udp = node.udp
        if (node.tfo !== undefined) proxy.tfo = node.tfo
      } else if (type === 'trojan') {
        proxy.password = node.password
        if (node['skip-cert-verify'] !== undefined) proxy.skipCertVerify = node['skip-cert-verify']
        if (node.sni) proxy.sni = node.sni
        if (node.udp !== undefined) proxy.udp = node.udp
        if (node.network) proxy.network = node.network
      } else if (type === 'vmess') {
        proxy.uuid = node.uuid
        proxy.alterId = node.alterId || 0
        proxy.network = node.network || 'tcp'
        proxy.cipher = node.cipher || 'auto'
        if (node.tls !== undefined) proxy.tls = node.tls
        if (node['skip-cert-verify'] !== undefined) proxy['skip-cert-verify'] = node['skip-cert-verify']
        if (node.servername) proxy.servername = node.servername
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

      return proxy
    } catch (error) {
      console.error('[SubscriptionParser] 转换 Clash 节点失败:', error)
      return null
    }
  }
}

module.exports = { SubscriptionParser }

