/**
 * 证书存储管理 Composable
 * 管理已同意的证书哈希
 */

import { ref } from 'vue'
import { useWindowManager } from './useWindowManager'

const CERTIFICATE_STORAGE_KEY = 'trusted-certificates'
const URL_CERTIFICATE_MAP_KEY = 'url-certificate-map' // URL 到证书哈希的映射

export function useCertificateStorage() {
  const windowManager = typeof window !== 'undefined' ? useWindowManager() : null

  // 加载已信任的证书哈希列表
  const loadTrustedCertificates = () => {
    try {
      let saved
      
      if (windowManager && windowManager.windowStorage) {
        // 使用窗口独立存储
        const savedStr = windowManager.windowStorage.getItem(CERTIFICATE_STORAGE_KEY)
        saved = savedStr ? JSON.parse(savedStr) : []
        
        // 如果是第一个窗口，同时从原始名称读取（向后兼容）
        if (windowManager.currentWindowId.value === 1) {
          const savedStr2 = localStorage.getItem(CERTIFICATE_STORAGE_KEY)
          if (savedStr2) {
            saved = JSON.parse(savedStr2)
          }
        }
      } else {
        // 降级到普通 localStorage
        const savedStr = localStorage.getItem(CERTIFICATE_STORAGE_KEY)
        saved = savedStr ? JSON.parse(savedStr) : []
      }
      
      return Array.isArray(saved) ? saved : []
    } catch (e) {
      console.error('[useCertificateStorage] 加载证书列表失败:', e)
      return []
    }
  }

  // 保存已信任的证书哈希列表
  const saveTrustedCertificates = (certificates) => {
    try {
      const data = JSON.stringify(certificates)
      
      if (windowManager && windowManager.windowStorage) {
        // 使用窗口独立存储
        windowManager.windowStorage.setItem(CERTIFICATE_STORAGE_KEY, data)
        
        // 如果是第一个窗口，同时保存到原始名称（向后兼容）
        if (windowManager.currentWindowId.value === 1) {
          localStorage.setItem(CERTIFICATE_STORAGE_KEY, data)
        }
      } else {
        // 降级到普通 localStorage
        localStorage.setItem(CERTIFICATE_STORAGE_KEY, data)
      }
      
      console.log('[useCertificateStorage] 证书列表已保存，数量:', certificates.length)
    } catch (e) {
      console.error('[useCertificateStorage] 保存证书列表失败:', e)
    }
  }

  // 加载 URL 到证书哈希的映射
  const loadUrlCertificateMap = () => {
    try {
      let saved
      
      if (windowManager && windowManager.windowStorage) {
        const savedStr = windowManager.windowStorage.getItem(URL_CERTIFICATE_MAP_KEY)
        saved = savedStr ? JSON.parse(savedStr) : {}
        
        if (windowManager.currentWindowId.value === 1) {
          const savedStr2 = localStorage.getItem(URL_CERTIFICATE_MAP_KEY)
          if (savedStr2) {
            saved = JSON.parse(savedStr2)
          }
        }
      } else {
        const savedStr = localStorage.getItem(URL_CERTIFICATE_MAP_KEY)
        saved = savedStr ? JSON.parse(savedStr) : {}
      }
      
      return saved || {}
    } catch (e) {
      console.error('[useCertificateStorage] 加载 URL 证书映射失败:', e)
      return {}
    }
  }

  // 保存 URL 到证书哈希的映射
  const saveUrlCertificateMap = (map) => {
    try {
      const data = JSON.stringify(map)
      
      if (windowManager && windowManager.windowStorage) {
        windowManager.windowStorage.setItem(URL_CERTIFICATE_MAP_KEY, data)
        
        if (windowManager.currentWindowId.value === 1) {
          localStorage.setItem(URL_CERTIFICATE_MAP_KEY, data)
        }
      } else {
        localStorage.setItem(URL_CERTIFICATE_MAP_KEY, data)
      }
    } catch (e) {
      console.error('[useCertificateStorage] 保存 URL 证书映射失败:', e)
    }
  }

  // 根据 URL 获取证书哈希
  const getCertificateHashByUrl = (url) => {
    try {
      const map = loadUrlCertificateMap()
      const urlObj = new URL(url)
      const hostname = urlObj.hostname
      // 尝试匹配完整 URL 或 hostname
      return map[url] || map[hostname] || null
    } catch (e) {
      console.error('[useCertificateStorage] 获取证书哈希失败:', e)
      return null
    }
  }

  // 保存 URL 和证书哈希的映射
  const saveUrlCertificateMapping = (url, certificateHash) => {
    try {
      const map = loadUrlCertificateMap()
      const urlObj = new URL(url)
      const hostname = urlObj.hostname
      // 同时保存完整 URL 和 hostname 的映射
      map[url] = certificateHash
      map[hostname] = certificateHash
      saveUrlCertificateMap(map)
      console.log('[useCertificateStorage] 已保存 URL 证书映射:', { url, hostname, hash: certificateHash.substring(0, 16) + '...' })
    } catch (e) {
      console.error('[useCertificateStorage] 保存 URL 证书映射失败:', e)
    }
  }

  // 检查证书哈希是否已信任
  const isCertificateTrusted = (certificateHash) => {
    const trusted = loadTrustedCertificates()
    return trusted.includes(certificateHash)
  }

  // 添加证书哈希到信任列表
  const trustCertificate = (certificateHash) => {
    const trusted = loadTrustedCertificates()
    if (!trusted.includes(certificateHash)) {
      trusted.push(certificateHash)
      saveTrustedCertificates(trusted)
      console.log('[useCertificateStorage] 已添加证书到信任列表:', certificateHash)
      
      // 通知主进程记录日志
      if (typeof window !== 'undefined' && window.electron?.ipc?.invoke) {
        window.electron.ipc.invoke('certificate:trust', certificateHash).catch(err => {
          console.warn('[useCertificateStorage] 通知主进程失败:', err)
        })
      }
    }
  }

  // 移除证书哈希（取消信任）
  const untrustCertificate = (certificateHash) => {
    const trusted = loadTrustedCertificates()
    const index = trusted.indexOf(certificateHash)
    if (index > -1) {
      trusted.splice(index, 1)
      saveTrustedCertificates(trusted)
      console.log('[useCertificateStorage] 已从信任列表移除证书:', certificateHash)
    }
  }

  return {
    loadTrustedCertificates,
    saveTrustedCertificates,
    isCertificateTrusted,
    trustCertificate,
    untrustCertificate,
    getCertificateHashByUrl,
    saveUrlCertificateMapping
  }
}

