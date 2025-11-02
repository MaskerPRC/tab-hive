/**
 * Clash 管理模块
 * 负责 Clash 进程的启动、停止和配置管理
 */

const { spawn } = require('child_process')
const path = require('path')
const fs = require('fs')
const { app } = require('electron')
const YAML = require('yamljs')
const axios = require('axios')

class ClashManager {
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
  }

  /**
   * 为蜂巢启动代理
   */
  async startProxyForHive(hiveId, proxy) {
    try {
      // 如果已有代理在运行，先停止
      if (this.hiveClashProcesses.has(hiveId)) {
        await this.stopProxyForHive(hiveId)
      }

      console.log(`[ClashManager] 获取到的代理信息:`, proxy)

      // 获取端口
      const { httpPort, socksPort, controllerPort } = this.getNextPorts()
      const secret = this.generateApiSecret()

      // 生成 Clash 配置
      const clashConfig = this.generateClashConfig([proxy], httpPort, socksPort, controllerPort, secret)
      const configPath = path.join(app.getPath('userData'), `clash-config-${hiveId}.yaml`)
      const configYaml = YAML.stringify(clashConfig, 4)

      console.log(`[ClashManager] 生成的 Clash 配置:`)
      console.log(configYaml)

      fs.writeFileSync(configPath, configYaml, 'utf8')

      // 启动 Clash 进程
      const clashBinary = this.getClashBinary()
      console.log(`[ClashManager] Clash 二进制文件路径: ${clashBinary}`)
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
        proxyId: proxy.id,
        configPath
      })

      // 等待 Clash 启动
      await this.waitForClashReady(controllerPort, secret)

      console.log(`[ClashManager] 蜂巢 ${hiveId} 的代理已启动，端口: ${httpPort}`)

      return {
        success: true,
        data: {
          httpPort,
          socksPort,
          proxyId: proxy.id
        }
      }
    } catch (error) {
      console.error('[ClashManager] 启动蜂巢代理失败:', error)
      return { success: false, error: error.message }
    }
  }

  /**
   * 停止蜂巢代理
   */
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

      console.log(`[ClashManager] 蜂巢 ${hiveId} 的代理已停止`)

      return { success: true, message: '代理已停止' }
    } catch (error) {
      console.error('[ClashManager] 停止蜂巢代理失败:', error)
      return { success: false, error: error.message }
    }
  }

  /**
   * 获取蜂巢代理信息
   */
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

  /**
   * 生成 Clash 配置
   */
  generateClashConfig(proxies, httpPort, socksPort, controllerPort, secret) {
    const clashConfig = {
      port: httpPort,
      'socks-port': socksPort,
      'allow-lan': false,
      'bind-address': '127.0.0.1',
      mode: 'rule',
      'log-level': 'debug',
      'external-controller': `127.0.0.1:${controllerPort}`,
      secret: secret,

      // 禁用 GeoIP 自动更新
      'geodata-mode': false,
      'geo-auto-update': false,
      'geox-url': {
        'geoip': '',
        'geosite': '',
        'mmdb': ''
      },

      // 简化 DNS 配置
      dns: {
        enable: true,
        ipv6: false,
        'default-nameserver': ['223.5.5.5', '119.29.29.29'],
        'enhanced-mode': 'fake-ip',
        'fake-ip-range': '198.18.0.1/16',
        'use-hosts': true,
        nameserver: ['223.5.5.5', '119.29.29.29', '8.8.8.8']
      },

      proxies: [],
      'proxy-groups': [],
      rules: []
    }

    // 添加代理节点
    proxies.forEach(proxy => {
      const proxyNode = this.convertProxyToClashNode(proxy)
      if (proxyNode) {
        clashConfig.proxies.push(proxyNode)
      }
    })

    // 如果有代理节点，配置代理组和规则
    if (proxies.length > 0) {
      clashConfig['proxy-groups'] = [{
        name: 'Proxy',
        type: 'select',
        proxies: [...clashConfig.proxies.map(p => p.name), 'DIRECT']
      }]

      clashConfig.rules = [
        'DOMAIN-SUFFIX,local,DIRECT',
        'IP-CIDR,127.0.0.0/8,DIRECT',
        'IP-CIDR,172.16.0.0/12,DIRECT',
        'IP-CIDR,192.168.0.0/16,DIRECT',
        'IP-CIDR,10.0.0.0/8,DIRECT',
        'IP-CIDR,17.0.0.0/8,DIRECT',
        'IP-CIDR,100.64.0.0/10,DIRECT',
        'MATCH,Proxy'
      ]
    } else {
      clashConfig.rules = ['MATCH,DIRECT']
    }

    return clashConfig
  }

  /**
   * 转换代理为 Clash 节点格式
   */
  convertProxyToClashNode(proxy) {
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
        proxyNode.cipher = proxy.cipher || 'aes-256-gcm'
        proxyNode.password = proxy.password
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
        if (proxy.udp !== undefined) {
          proxyNode.udp = proxy.udp
        }
        if (proxy.tfo !== undefined) {
          proxyNode.tfo = proxy.tfo
        }
        break
      case 'hysteria2':
        proxyNode.type = 'hysteria2'
        proxyNode.password = proxy.password
        if (proxy.ports) proxyNode.ports = proxy.ports
        if (proxy.skip_cert_verify !== undefined) proxyNode['skip-cert-verify'] = proxy.skip_cert_verify
        if (proxy.sni) proxyNode.sni = proxy.sni
        if (proxy.up !== undefined) proxyNode.up = proxy.up
        if (proxy.down !== undefined) proxyNode.down = proxy.down
        if (proxy.udp !== undefined) proxyNode.udp = proxy.udp
        if (proxy.tfo !== undefined) proxyNode.tfo = proxy.tfo
        break
      case 'hysteria':
        proxyNode.type = 'hysteria'
        if (proxy.auth_str) proxyNode.auth_str = proxy.auth_str
        if (proxy.password) proxyNode.password = proxy.password
        if (proxy.ports) proxyNode.ports = proxy.ports
        if (proxy.skip_cert_verify !== undefined) proxyNode['skip-cert-verify'] = proxy.skip_cert_verify
        if (proxy.sni) proxyNode.sni = proxy.sni
        if (proxy.up !== undefined) proxyNode.up = proxy.up
        if (proxy.down !== undefined) proxyNode.down = proxy.down
        if (proxy.alpn) {
          try {
            proxyNode.alpn = typeof proxy.alpn === 'string' ? JSON.parse(proxy.alpn) : proxy.alpn
          } catch (e) {
            proxyNode.alpn = proxy.alpn
          }
        }
        if (proxy.protocol) proxyNode.protocol = proxy.protocol
        if (proxy.fast_open !== undefined) proxyNode['fast-open'] = proxy.fast_open
        if (proxy.disable_mtu_discovery !== undefined) proxyNode.disable_mtu_discovery = proxy.disable_mtu_discovery
        break
      case 'anytls':
        proxyNode.type = 'anytls'
        proxyNode.password = proxy.password
        if (proxy.client_fingerprint) proxyNode['client-fingerprint'] = proxy.client_fingerprint
        if (proxy.sni) proxyNode.sni = proxy.sni
        if (proxy.skip_cert_verify !== undefined) proxyNode['skip-cert-verify'] = proxy.skip_cert_verify
        if (proxy.udp !== undefined) proxyNode.udp = proxy.udp
        if (proxy.tfo !== undefined) proxyNode.tfo = proxy.tfo
        break
      case 'trojan':
        proxyNode.type = 'trojan'
        proxyNode.password = proxy.password
        if (proxy.skip_cert_verify !== undefined) proxyNode['skip-cert-verify'] = proxy.skip_cert_verify
        if (proxy.sni) proxyNode.sni = proxy.sni
        if (proxy.udp !== undefined) proxyNode.udp = proxy.udp
        if (proxy.network) proxyNode.network = proxy.network
        break
      case 'vmess':
        proxyNode.type = 'vmess'
        proxyNode.uuid = proxy.uuid
        proxyNode.alterId = proxy.alterId || 0
        proxyNode.cipher = proxy.cipher || 'auto'
        if (proxy.network) {
          proxyNode.network = proxy.network
        }
        if (proxy.tls !== undefined && proxy.tls !== null) {
          proxyNode.tls = proxy.tls === true || proxy.tls === 'true' || proxy.tls === 1
        }
        if (proxy['skip-cert-verify'] !== undefined && proxy['skip-cert-verify'] !== null) {
          proxyNode['skip-cert-verify'] = proxy['skip-cert-verify'] === true || proxy['skip-cert-verify'] === 'true' || proxy['skip-cert-verify'] === 1
        }
        if (proxy.servername) {
          proxyNode.servername = proxy.servername
        }
        if (proxy.network === 'ws' || proxy.network === 'websocket') {
          if (proxy['ws-opts']) {
            try {
              proxyNode['ws-opts'] = typeof proxy['ws-opts'] === 'string'
                ? JSON.parse(proxy['ws-opts'])
                : proxy['ws-opts']
            } catch (e) {
              console.warn('[ClashManager] 解析 ws-opts 失败:', e)
            }
          }
          if (proxy['ws-path']) proxyNode['ws-path'] = proxy['ws-path']
          if (proxy['ws-headers']) {
            try {
              proxyNode['ws-headers'] = typeof proxy['ws-headers'] === 'string'
                ? JSON.parse(proxy['ws-headers'])
                : proxy['ws-headers']
            } catch (e) {
              console.warn('[ClashManager] 解析 ws-headers 失败:', e)
            }
          }
        }
        break
    }

    return proxyNode
  }

  /**
   * 转换代理类型
   */
  convertProxyType(type) {
    const typeMap = {
      'http': 'http',
      'https': 'http',
      'socks5': 'socks5',
      'ss': 'ss',
      'vmess': 'vmess',
      'trojan': 'trojan',
      'hysteria': 'hysteria',
      'hysteria2': 'hysteria2',
      'anytls': 'anytls'
    }
    return typeMap[type.toLowerCase()] || 'http'
  }

  /**
   * 等待 Clash 就绪
   */
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
          console.log('[ClashManager] Clash 就绪，版本:', response.data.version)
          return true
        }
      } catch (error) {
        await new Promise(resolve => setTimeout(resolve, 1000))
      }
    }

    throw new Error('Clash 启动超时')
  }

  /**
   * 获取 Clash 可执行文件路径
   */
  getClashBinary() {
    const platform = process.platform
    const arch = process.arch
    const possiblePaths = []

    console.log(`[ClashManager] ========== 查找 Clash 二进制文件 ==========`)
    console.log(`[ClashManager] 平台: ${platform}`)
    console.log(`[ClashManager] 架构: ${arch}`)

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
        if (arch === 'arm64') {
          fileName = 'clash-darwin-arm64'
        } else {
          fileName = 'clash-darwin-amd64'
        }
        break
      case 'linux':
        if (arch === 'arm64') {
          fileName = 'clash-linux-arm64'
        } else {
          fileName = 'clash-linux-amd64'
        }
        break
      default:
        throw new Error(`不支持的平台: ${platform}`)
    }

    console.log(`[ClashManager] 目标文件名: ${fileName}`)

    // 尝试使用架构特定的文件
    for (const resourcesPath of possiblePaths) {
      const binaryPath = path.join(resourcesPath, fileName)
      if (fs.existsSync(binaryPath)) {
        console.log(`[ClashManager] ✅ 找到 Clash 文件: ${binaryPath}`)
        return binaryPath
      }
    }

    // macOS/Linux ARM64 回退到 AMD64
    if ((platform === 'darwin' || platform === 'linux') && arch === 'arm64') {
      const fallbackFileName = platform === 'darwin' ? 'clash-darwin-amd64' : 'clash-linux-amd64'
      console.log(`[ClashManager] ⚠️  未找到 ARM64 版本，尝试回退到: ${fallbackFileName}`)

      for (const resourcesPath of possiblePaths) {
        const binaryPath = path.join(resourcesPath, fallbackFileName)
        if (fs.existsSync(binaryPath)) {
          console.log(`[ClashManager] ✅ 找到回退 Clash 文件: ${binaryPath}`)
          return binaryPath
        }
      }
    }

    const defaultPath = path.join(process.cwd(), 'resources', fileName)
    console.log(`[ClashManager] ⚠️  未找到文件，使用默认路径: ${defaultPath}`)
    return defaultPath
  }

  /**
   * 获取下一个可用端口
   */
  getNextPorts() {
    const offset = this.portCounter * 10
    const httpPort = this.baseHttpPort + offset
    const socksPort = this.baseSocksPort + offset
    const controllerPort = this.baseControllerPort + offset
    this.portCounter++
    return { httpPort, socksPort, controllerPort }
  }

  /**
   * 生成API密钥
   */
  generateApiSecret() {
    return require('crypto').randomBytes(16).toString('hex')
  }
}

module.exports = { ClashManager }

