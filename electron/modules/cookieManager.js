const { session } = require('electron')

/**
 * Cookie 管理模块
 * 提供 cookie 的导入、查询和清除功能
 */

/**
 * 标准化单个 cookie 对象为 Electron cookies.set() 所需的格式
 */
function normalizeCookie(cookie) {
  const result = {}

  // name 和 value 是必须的
  result.name = cookie.name
  result.value = cookie.value != null ? String(cookie.value) : ''

  // domain → url 转换
  let domain = cookie.domain || ''
  if (domain.startsWith('.')) {
    domain = domain.substring(1)
  }

  const secure = cookie.secure || false
  const protocol = secure ? 'https' : 'http'
  const path = cookie.path || '/'
  result.url = `${protocol}://${domain}${path}`

  if (cookie.domain) {
    result.domain = cookie.domain
  }
  if (cookie.path) {
    result.path = cookie.path
  }
  if (cookie.secure != null) {
    result.secure = !!cookie.secure
  }
  if (cookie.httpOnly != null) {
    result.httpOnly = !!cookie.httpOnly
  }

  // expirationDate (EditThisCookie 格式, 秒级时间戳)
  if (cookie.expirationDate != null) {
    result.expirationDate = cookie.expirationDate
  } else if (cookie.expires != null) {
    // 可能是 ISO 字符串或时间戳
    const ts = typeof cookie.expires === 'string' ? new Date(cookie.expires).getTime() / 1000 : cookie.expires
    if (!isNaN(ts) && ts > 0) {
      result.expirationDate = ts
    }
  }

  // sameSite
  if (cookie.sameSite != null) {
    const sameSiteMap = {
      'lax': 'lax',
      'strict': 'strict',
      'none': 'no_restriction',
      'no_restriction': 'no_restriction',
      'unspecified': 'unspecified'
    }
    const val = String(cookie.sameSite).toLowerCase()
    result.sameSite = sameSiteMap[val] || 'unspecified'
  }

  return result
}

/**
 * 解析并标准化 cookie 数据（支持多种格式）
 */
function parseCookies(data) {
  if (Array.isArray(data)) {
    return data
  }
  if (data && Array.isArray(data.cookies)) {
    return data.cookies
  }
  if (data && typeof data === 'object' && data.name) {
    return [data]
  }
  throw new Error('不支持的 cookie 数据格式')
}

/**
 * 向指定 partition 导入 cookies
 */
async function importCookies(partition, cookiesData) {
  const ses = session.fromPartition(partition)
  const cookies = parseCookies(cookiesData)

  let imported = 0
  let failed = 0
  const errors = []

  for (const cookie of cookies) {
    try {
      if (!cookie.name) {
        failed++
        errors.push({ name: '(empty)', error: 'cookie name is required' })
        continue
      }
      const normalized = normalizeCookie(cookie)
      await ses.cookies.set(normalized)
      imported++
    } catch (err) {
      failed++
      errors.push({ name: cookie.name || '(unknown)', error: err.message })
    }
  }

  return { success: failed === 0, imported, failed, total: cookies.length, errors }
}

/**
 * 获取指定 partition 的 cookies
 */
async function getCookies(partition, filter = {}) {
  const ses = session.fromPartition(partition)
  return await ses.cookies.get(filter)
}

/**
 * 清除指定 partition 的 cookies
 */
async function clearCookies(partition, url) {
  const ses = session.fromPartition(partition)
  if (url) {
    const cookies = await ses.cookies.get({ url })
    for (const cookie of cookies) {
      await ses.cookies.remove(url, cookie.name)
    }
    return { success: true, removed: cookies.length }
  } else {
    await ses.clearStorageData({ storages: ['cookies'] })
    return { success: true }
  }
}

module.exports = {
  importCookies,
  getCookies,
  clearCookies
}
