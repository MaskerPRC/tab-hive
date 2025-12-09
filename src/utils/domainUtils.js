/**
 * 域名工具函数
 * 用于判断两个URL是否同根域名
 */

/**
 * 获取根域名
 * 例如：
 * - www.example.com -> example.com
 * - subdomain.example.com -> example.com
 * - example.co.uk -> example.co.uk (处理特殊TLD)
 * @param {string} hostname - 主机名
 * @returns {string} 根域名
 */
export function getRootDomain(hostname) {
  if (!hostname) return ''
  
  // 移除端口号
  hostname = hostname.split(':')[0]
  
  // 处理IP地址
  if (/^\d+\.\d+\.\d+\.\d+$/.test(hostname)) {
    return hostname
  }
  
  // 处理localhost
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return hostname
  }
  
  // 处理特殊TLD（如.co.uk, .com.au等）
  const specialTlds = [
    'co.uk', 'com.au', 'com.br', 'co.jp', 'co.kr',
    'com.mx', 'com.ar', 'com.tr', 'co.za', 'com.cn'
  ]
  
  for (const tld of specialTlds) {
    if (hostname.endsWith('.' + tld)) {
      const parts = hostname.split('.')
      // 取最后3部分（如 example.co.uk）
      if (parts.length >= 3) {
        return parts.slice(-3).join('.')
      }
    }
  }
  
  // 标准处理：取最后2部分（如 example.com）
  const parts = hostname.split('.')
  if (parts.length >= 2) {
    return parts.slice(-2).join('.')
  }
  
  return hostname
}

/**
 * 判断两个URL是否同根域名
 * 二级域名不同没关系，只要根域名相同就返回true
 * @param {string} url1 - 第一个URL
 * @param {string} url2 - 第二个URL
 * @returns {boolean} 是否同根域名
 */
export function isSameRootDomain(url1, url2) {
  if (!url1 || !url2) return false
  
  try {
    const urlObj1 = new URL(url1)
    const urlObj2 = new URL(url2)
    
    const rootDomain1 = getRootDomain(urlObj1.hostname)
    const rootDomain2 = getRootDomain(urlObj2.hostname)
    
    return rootDomain1 === rootDomain2 && rootDomain1 !== ''
  } catch (error) {
    console.error('[domainUtils] URL解析失败:', error)
    return false
  }
}

/**
 * 从URL中提取根域名
 * @param {string} url - URL字符串
 * @returns {string} 根域名，如果解析失败返回空字符串
 */
export function extractRootDomain(url) {
  if (!url) return ''
  
  try {
    const urlObj = new URL(url)
    return getRootDomain(urlObj.hostname)
  } catch (error) {
    console.error('[domainUtils] URL解析失败:', error)
    return ''
  }
}

