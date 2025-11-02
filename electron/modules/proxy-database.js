/**
 * 代理数据库操作模块
 * 负责代理的增删改查操作
 */

const { query, run, get } = require('../database')

class ProxyDatabase {
  /**
   * 获取代理列表（分页）
   */
  async getProxyList(page = 1, pageSize = 10) {
    try {
      console.log(`[ProxyDatabase] 获取代理列表 - 页码: ${page}, 每页数量: ${pageSize}`)

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
      console.error('[ProxyDatabase] 获取代理列表失败:', error)
      return { success: false, error: error.message }
    }
  }

  /**
   * 添加代理
   */
  async addProxy(proxyConfig) {
    try {
      const {
        name, type, host, port, username, password, cipher, uuid, alterId, network,
        plugin, pluginOpts, udp, tfo, ports, skipCertVerify, sni, clientFingerprint,
        up, down, authStr, alpn, protocol, fastOpen, disableMtuDiscovery
      } = proxyConfig

      if (!name || !type || !host || !port) {
        throw new Error('代理名称、类型、主机和端口不能为空')
      }

      const result = await run(
        `INSERT INTO proxies (name, type, host, port, username, password, cipher, uuid, alterId, network, 
          plugin, plugin_opts, udp, tfo, ports, skip_cert_verify, sni, client_fingerprint,
          up, down, auth_str, alpn, protocol, fast_open, disable_mtu_discovery) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          name, type, host, port,
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
          ports || null,
          skipCertVerify !== undefined ? skipCertVerify : null,
          sni || null,
          clientFingerprint || null,
          up !== undefined ? up : null,
          down !== undefined ? down : null,
          authStr || null,
          alpn || null,
          protocol || null,
          fastOpen !== undefined ? fastOpen : null,
          disableMtuDiscovery !== undefined ? disableMtuDiscovery : null
        ]
      )

      return { success: true, data: { id: result.id, ...proxyConfig } }
    } catch (error) {
      console.error('[ProxyDatabase] 添加代理失败:', error)
      return { success: false, error: error.message }
    }
  }

  /**
   * 更新代理
   */
  async updateProxy(proxyId, proxyConfig) {
    try {
      const {
        name, type, host, port, username, password, is_enabled, cipher, uuid, alterId, network,
        plugin, pluginOpts, udp, tfo, ports, skipCertVerify, sni, clientFingerprint,
        up, down, authStr, alpn, protocol, fastOpen, disableMtuDiscovery
      } = proxyConfig

      const result = await run(
        `UPDATE proxies 
         SET name = ?, type = ?, host = ?, port = ?, username = ?, password = ?, 
             cipher = ?, uuid = ?, alterId = ?, network = ?, plugin = ?, plugin_opts = ?, udp = ?, tfo = ?,
             ports = ?, skip_cert_verify = ?, sni = ?, client_fingerprint = ?,
             up = ?, down = ?, auth_str = ?, alpn = ?, protocol = ?, fast_open = ?, disable_mtu_discovery = ?,
             is_enabled = ?, updated_at = CURRENT_TIMESTAMP 
         WHERE id = ?`,
        [
          name, type, host, port,
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
          ports || null,
          skipCertVerify !== undefined ? skipCertVerify : null,
          sni || null,
          clientFingerprint || null,
          up !== undefined ? up : null,
          down !== undefined ? down : null,
          authStr || null,
          alpn || null,
          protocol || null,
          fastOpen !== undefined ? fastOpen : null,
          disableMtuDiscovery !== undefined ? disableMtuDiscovery : null,
          is_enabled,
          proxyId
        ]
      )

      if (result.changes === 0) {
        throw new Error('代理不存在')
      }

      return { success: true, message: '代理更新成功' }
    } catch (error) {
      console.error('[ProxyDatabase] 更新代理失败:', error)
      return { success: false, error: error.message }
    }
  }

  /**
   * 删除代理
   */
  async deleteProxy(proxyId) {
    try {
      const result = await run('DELETE FROM proxies WHERE id = ?', [proxyId])
      if (result.changes === 0) {
        throw new Error('代理不存在')
      }

      return { success: true, message: '代理删除成功' }
    } catch (error) {
      console.error('[ProxyDatabase] 删除代理失败:', error)
      return { success: false, error: error.message }
    }
  }

  /**
   * 获取单个代理
   */
  async getProxyById(proxyId) {
    try {
      const proxy = await get('SELECT * FROM proxies WHERE id = ?', [proxyId])
      if (!proxy) {
        throw new Error('代理不存在')
      }
      return { success: true, data: proxy }
    } catch (error) {
      console.error('[ProxyDatabase] 获取代理失败:', error)
      return { success: false, error: error.message }
    }
  }
}

module.exports = { ProxyDatabase }

