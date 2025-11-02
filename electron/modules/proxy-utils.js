/**
 * 代理工具函数模块
 * 提供各种辅助函数
 */

/**
 * 构建代理 URL
 */
function buildProxyUrl(proxy) {
  let auth = ''
  if (proxy.username && proxy.password) {
    auth = `${proxy.username}:${proxy.password}@`
  }

  const protocol = proxy.type.toLowerCase() === 'socks5' ? 'socks5' : 'http'
  return `${protocol}://${auth}${proxy.host}:${proxy.port}`
}

/**
 * 生成随机 API 密钥
 */
function generateApiSecret() {
  return require('crypto').randomBytes(16).toString('hex')
}

/**
 * 验证代理配置
 */
function validateProxyConfig(proxyConfig) {
  const { name, type, host, port } = proxyConfig

  if (!name || !type || !host || !port) {
    return {
      valid: false,
      error: '代理名称、类型、主机和端口不能为空'
    }
  }

  // 验证端口范围
  const portNum = parseInt(port)
  if (isNaN(portNum) || portNum < 1 || portNum > 65535) {
    return {
      valid: false,
      error: '端口号必须在 1-65535 之间'
    }
  }

  // 验证代理类型
  const validTypes = ['http', 'https', 'socks5', 'ss', 'vmess', 'trojan', 'hysteria', 'hysteria2', 'anytls']
  if (!validTypes.includes(type.toLowerCase())) {
    return {
      valid: false,
      error: `不支持的代理类型: ${type}`
    }
  }

  return { valid: true }
}

/**
 * 格式化响应时间
 */
function formatResponseTime(ms) {
  if (ms < 1000) {
    return `${ms}ms`
  } else {
    return `${(ms / 1000).toFixed(2)}s`
  }
}

/**
 * 检测订阅内容类型
 */
function detectSubscriptionType(content) {
  // YAML 格式
  if (content.includes('proxies:') || content.trim().startsWith('-')) {
    return 'yaml'
  }

  // 链接格式
  if (content.startsWith('vmess://') || content.startsWith('ss://') ||
      content.startsWith('trojan://') || content.startsWith('hysteria')) {
    return 'links'
  }

  // Base64 编码（需要尝试解码）
  try {
    const decoded = Buffer.from(content, 'base64').toString('utf-8')
    if (decoded && (decoded.includes('proxies:') || decoded.includes('://') || decoded.trim().startsWith('-'))) {
      return 'base64'
    }
  } catch (e) {
    // 不是 base64
  }

  return 'unknown'
}

module.exports = {
  buildProxyUrl,
  generateApiSecret,
  validateProxyConfig,
  formatResponseTime,
  detectSubscriptionType
}

