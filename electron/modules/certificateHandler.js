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
    
    // ========== 详细日志：记录所有证书验证信息 ==========
    console.log('[证书验证] setCertificateVerifyProc 被调用:', {
      hostname,
      verificationResult,
      verificationResultType: typeof verificationResult,
      verificationResultValue: JSON.stringify(verificationResult),
      hasCertificate: !!certificate,
      certificateIssuerName: certificate?.issuerName,
      certificateSubjectName: certificate?.subjectName,
      partition: sessionInstance.partition || 'default'
    })
    
    // 检查证书验证结果
    // verificationResult: 0 或 'net::OK' = 成功, 其他值 = 证书错误
    const check1 = verificationResult !== 0
    const check2 = verificationResult !== 'net::OK'
    const check3 = verificationResult !== undefined
    const check4 = verificationResult !== null
    const check5 = typeof verificationResult === 'string'
    const check6 = check5 && verificationResult.includes('ERR_CERT')
    const check7 = check5 && verificationResult.includes('CERT')
    const check8 = check5 && verificationResult.startsWith('net::ERR_CERT')
    
    console.log('[证书验证] 判断条件详情:', {
      check1_notEqual0: check1,
      check2_notEqualNetOK: check2,
      check3_notUndefined: check3,
      check4_notNull: check4,
      check5_isString: check5,
      check6_includesERR_CERT: check6,
      check7_includesCERT: check7,
      check8_startsWithNetERR_CERT: check8
    })
    
    const isCertificateError = check1 && 
                               check2 &&
                               check3 &&
                               check4 &&
                               (check6 || check7 || check8)
    
    console.log('[证书验证] 最终判断结果:', {
      isCertificateError,
      willNotify: isCertificateError && !!certificate,
      reason: isCertificateError 
        ? `verificationResult=${verificationResult} 不满足正常条件` 
        : `verificationResult=${verificationResult} 是正常值`
    })
    
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
    // ========== 详细日志：记录 certificate-error 事件 ==========
    console.log('[证书错误事件] certificate-error 事件被触发:', {
      url,
      error,
      errorType: typeof error,
      errorValue: JSON.stringify(error),
      hasCertificate: !!certificate,
      certificateKeys: certificate ? Object.keys(certificate) : [],
      partition: sessionInstance.partition || 'default',
      timestamp: new Date().toISOString()
    })
    
    // 获取 partition
    const partition = sessionInstance.partition || 'default'
    
    // 从 URL 中提取 hostname
    let hostname = ''
    try {
      const urlObj = new URL(url)
      hostname = urlObj.hostname
    } catch (e) {
      hostname = url.split('/')[2]?.split(':')[0] || ''
      console.log('[证书错误事件] URL 解析失败，使用备用方法提取 hostname:', hostname)
    }
    
    // 分析错误类型
    const errorAnalysis = {
      isString: typeof error === 'string',
      isNumber: typeof error === 'number',
      includesERR_CERT: typeof error === 'string' && error.includes('ERR_CERT'),
      includesCERT: typeof error === 'string' && error.includes('CERT'),
      isCommonCertError: typeof error === 'string' && (
        error.includes('ERR_CERT_AUTHORITY_INVALID') ||
        error.includes('ERR_CERT_INVALID') ||
        error.includes('ERR_CERT_REVOKED') ||
        error.includes('ERR_CERT_DATE_INVALID') ||
        error.includes('ERR_CERT_COMMON_NAME_INVALID')
      )
    }
    
    console.log('[证书错误事件] 错误分析:', errorAnalysis)
    
    // 计算证书指纹
    let certificateHash = ''
    if (certificate) {
      try {
        const crypto = require('crypto')
        const certData = certificate.data || certificate.issuerCert?.data || ''
        if (certData) {
          certificateHash = crypto.createHash('sha256').update(certData).digest('hex')
          console.log('[证书错误事件] 使用证书数据计算哈希')
        } else {
          certificateHash = crypto.createHash('sha256')
            .update(`${certificate.issuerName || ''}:${certificate.subjectName || ''}:${hostname}`)
            .digest('hex')
          console.log('[证书错误事件] 使用备用方法计算哈希（无证书数据）')
        }
      } catch (err) {
        console.error('[证书错误事件] 计算证书哈希失败:', err.message, err.stack)
        const crypto = require('crypto')
        certificateHash = crypto.createHash('sha256')
          .update(`${certificate.issuerName || ''}:${certificate.subjectName || ''}:${hostname}`)
          .digest('hex')
      }
    } else {
      console.log('[证书错误事件] 警告：没有证书对象')
    }
    
    console.log('[证书错误事件] certificate-error 事件详细信息:', {
      url,
      error,
      errorAnalysis,
      hostname,
      issuerName: certificate?.issuerName,
      subjectName: certificate?.subjectName,
      partition: partition,
      certificateHash: certificateHash ? (certificateHash.substring(0, 16) + '...') : '(无)',
      willNotify: !!onCertificateError
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

