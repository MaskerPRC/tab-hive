/**
 * 证书错误处理模块
 * 负责处理自签名证书和证书验证错误
 */

const { session } = require('electron')

// 存储已设置证书处理的 session
const certificateHandledSessions = new Set()

/**
 * 为指定 session 设置证书错误处理
 * @param {Electron.Session} sessionInstance - Session 实例
 * @param {Function} onCertificateError - 证书错误回调，参数为 {url, error, partition, hostname, certificateHash}
 */
function setupCertificateErrorHandler(sessionInstance, onCertificateError) {
  sessionInstance.setCertificateVerifyProc((request, callback) => {
    const { hostname, certificate, verificationResult } = request
    
    // 检查证书验证结果
    // verificationResult: 0 或 'net::OK' = 成功, 其他值 = 证书错误
    const isCertificateError = verificationResult !== 0 && 
                               verificationResult !== 'net::OK' &&
                               verificationResult !== undefined &&
                               verificationResult !== null &&
                               (typeof verificationResult === 'string' && 
                                (verificationResult.includes('ERR_CERT') || 
                                 verificationResult.includes('CERT') ||
                                 verificationResult.startsWith('net::ERR_CERT')))
    
    if (isCertificateError && certificate) {
      // 获取 partition
      const partition = sessionInstance.partition || 'default'
      
      // 计算证书指纹（使用 SHA-256）
      let certificateHash = ''
      try {
        const crypto = require('crypto')
        const issuerName = certificate.issuerName || ''
        const subjectName = certificate.subjectName || ''
        
        // 使用 issuerName + subjectName + hostname 的组合作为稳定的标识
        const stableIdentifier = `${issuerName}:${subjectName}:${hostname}`
        certificateHash = crypto.createHash('sha256').update(stableIdentifier).digest('hex')
        
        console.log('[证书处理] 证书哈希计算:', {
          issuerName: issuerName.substring(0, 50),
          subjectName: subjectName.substring(0, 50),
          hostname,
          hash: certificateHash
        })
      } catch (err) {
        console.error('[证书处理] 计算证书哈希失败:', err.message)
        // 使用备用方法
        const crypto = require('crypto')
        certificateHash = crypto.createHash('sha256')
          .update(`${certificate.issuerName || ''}:${certificate.subjectName || ''}:${hostname}`)
          .digest('hex')
      }
      
      console.log('[证书处理] 检测到证书问题:', {
        hostname,
        verificationResult,
        issuerName: certificate?.issuerName,
        subjectName: certificate?.subjectName,
        partition: partition,
        certificateHash: certificateHash
      })
      
      // 调用回调通知证书错误
      if (onCertificateError) {
        const url = `https://${hostname}`
        onCertificateError({
          url: url,
          error: `Certificate verification failed: ${verificationResult}`,
          partition: partition,
          hostname: hostname,
          certificateHash: certificateHash
        })
      }
    }
    
    // 自动接受所有证书（包括自签名证书）
    callback(0) // 0 表示接受证书
  })

  // 监听证书错误事件，自动接受
  sessionInstance.on('certificate-error', (event, url, error, certificate, callback) => {
    // 获取 partition
    const partition = sessionInstance.partition || 'default'
    
    // 从 URL 中提取 hostname
    let hostname = ''
    try {
      const urlObj = new URL(url)
      hostname = urlObj.hostname
    } catch (e) {
      hostname = url.split('/')[2]?.split(':')[0] || ''
    }
    
    // 计算证书指纹
    let certificateHash = ''
    if (certificate) {
      try {
        const crypto = require('crypto')
        const certData = certificate.data || certificate.issuerCert?.data || ''
        if (certData) {
          certificateHash = crypto.createHash('sha256').update(certData).digest('hex')
        } else {
          certificateHash = crypto.createHash('sha256')
            .update(`${certificate.issuerName || ''}:${certificate.subjectName || ''}:${hostname}`)
            .digest('hex')
        }
      } catch (err) {
        console.error('[证书处理] 计算证书哈希失败:', err.message)
        const crypto = require('crypto')
        certificateHash = crypto.createHash('sha256')
          .update(`${certificate.issuerName || ''}:${certificate.subjectName || ''}:${hostname}`)
          .digest('hex')
      }
    }
    
    console.log('[证书处理] certificate-error 事件检测到证书错误:', {
      url,
      error,
      issuerName: certificate?.issuerName,
      subjectName: certificate?.subjectName,
      partition: partition,
      certificateHash: certificateHash.substring(0, 16) + '...'
    })
    
    // 调用回调通知证书错误
    if (onCertificateError) {
      onCertificateError({
        url,
        error,
        partition: partition,
        hostname: hostname,
        certificateHash: certificateHash
      })
    }
    
    // 自动接受证书错误（允许自签名证书）
    event.preventDefault()
    callback(true) // true 表示接受证书
  })
}

/**
 * 为指定 partition 的 session 设置证书错误处理
 * @param {string} partition - Session partition
 * @param {Function} onCertificateError - 证书错误回调
 */
function ensureCertificateErrorHandler(partition, onCertificateError) {
  if (!partition || certificateHandledSessions.has(partition)) {
    return
  }

  try {
    const webviewSession = session.fromPartition(partition)
    setupCertificateErrorHandler(webviewSession, onCertificateError)
    certificateHandledSessions.add(partition)
    console.log(`[证书处理] ✓ Partition ${partition} 证书错误处理已设置`)
  } catch (error) {
    console.error(`[证书处理] ✗ 设置 partition ${partition} 证书错误处理失败:`, error.message)
  }
}

/**
 * 清理证书处理 session 记录
 * @param {string} partition - Session partition
 */
function clearCertificateHandler(partition) {
  certificateHandledSessions.delete(partition)
}

module.exports = {
  setupCertificateErrorHandler,
  ensureCertificateErrorHandler,
  clearCertificateHandler
}

