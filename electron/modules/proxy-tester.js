/**
 * 代理测试模块
 * 负责测试代理的连通性和速度
 */

const axios = require('axios')
const { HttpProxyAgent } = require('http-proxy-agent')
const { HttpsProxyAgent } = require('https-proxy-agent')
const { SocksProxyAgent } = require('socks-proxy-agent')
const { spawn } = require('child_process')
const path = require('path')
const fs = require('fs')
const { app } = require('electron')
const YAML = require('yamljs')

class ProxyTester {
  constructor(clashManager) {
    this.clashManager = clashManager
    this.proxyTestTimeout = 10000 // 10秒超时
  }

  /**
   * 测试代理连接
   */
  async testProxy(proxy) {
    try {
      console.log('[ProxyTester] 开始测试代理:', proxy.name)

      // 对于 SS 和 VMess 等复杂协议，需要通过 Clash 测试
      if (['ss', 'vmess', 'trojan', 'hysteria', 'hysteria2', 'anytls'].includes(proxy.type.toLowerCase())) {
        return await this.testProxyThroughClash(proxy)
      } else {
        // HTTP/HTTPS/SOCKS5 可以直接测试
        return await this.testSimpleProxy(proxy)
      }
    } catch (error) {
      console.error('[ProxyTester] 测试代理失败:', error)
      return { success: false, error: error.message }
    }
  }

  /**
   * 测试简单代理（HTTP/SOCKS5）
   */
  async testSimpleProxy(proxy) {
    try {
      const proxyUrl = this.buildProxyUrl(proxy)
      console.log('[ProxyTester] 测试简单代理:', proxyUrl)

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

  /**
   * 通过临时 Clash 测试复杂代理
   */
  async testProxyThroughClash(proxy) {
    let tempClashProcess = null
    let tempConfigPath = null
    const tempPort = 17890 + Math.floor(Math.random() * 1000)
    const tempControllerPort = 19090 + Math.floor(Math.random() * 1000)
    const tempSecret = require('crypto').randomBytes(8).toString('hex')

    try {
      console.log('[ProxyTester] 创建临时 Clash 进行代理测试...')

      const clashBinary = this.clashManager.getClashBinary()
      if (!fs.existsSync(clashBinary)) {
        throw new Error('Clash 可执行文件不存在')
      }

      // 生成临时测试配置
      const tempConfig = this.clashManager.generateClashConfig([proxy], tempPort, tempPort + 1, tempControllerPort, tempSecret)
      tempConfigPath = path.join(app.getPath('temp'), `clash-test-${Date.now()}.yaml`)

      const configYaml = YAML.stringify(tempConfig, 4)
      fs.writeFileSync(tempConfigPath, configYaml, 'utf8')
      console.log('[ProxyTester] 临时配置文件已创建:', tempConfigPath)

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

      console.log('[ProxyTester] 临时 Clash 进程已启动')

      // 等待 Clash 启动
      await this.clashManager.waitForClashReady(tempControllerPort, tempSecret, 20)
      console.log('[ProxyTester] 临时 Clash 就绪')

      // 额外等待，确保代理完全初始化
      await new Promise(resolve => setTimeout(resolve, 2000))

      // 通过 Clash 代理测试
      console.log('[ProxyTester] 开始通过 Clash 代理发送测试请求...')
      const startTime = Date.now()

      try {
        const response = await axios.get('https://api.ipify.org?format=json', {
          proxy: false,
          httpsAgent: new HttpsProxyAgent(`http://127.0.0.1:${tempPort}`),
          httpAgent: new HttpProxyAgent(`http://127.0.0.1:${tempPort}`),
          timeout: 15000
        })
        const responseTime = Date.now() - startTime

        console.log('[ProxyTester] 代理测试成功，响应时间:', responseTime, 'ms')
        console.log('[ProxyTester] 代理IP:', response.data.ip)

        return {
          success: true,
          ip: response.data.ip,
          responseTime: `${responseTime}ms`,
          message: '通过 Clash 代理测试成功'
        }
      } catch (err) {
        console.error('[ProxyTester] 测试请求失败:', err.message)
        throw err
      }
    } catch (error) {
      console.error('[ProxyTester] 代理测试失败:', error)
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
          console.warn('[ProxyTester] 清理临时文件失败:', e)
        }
      }
    }
  }

  /**
   * 构建代理 URL
   */
  buildProxyUrl(proxy) {
    let auth = ''
    if (proxy.username && proxy.password) {
      auth = `${proxy.username}:${proxy.password}@`
    }

    const protocol = proxy.type.toLowerCase() === 'socks5' ? 'socks5' : 'http'
    return `${protocol}://${auth}${proxy.host}:${proxy.port}`
  }
}

module.exports = { ProxyTester }

