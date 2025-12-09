/**
 * 证书错误处理 Composable
 * 负责证书错误检测、处理和状态管理
 */

import { ref, onMounted, onBeforeUnmount, watch } from 'vue'
import { useCertificateStorage } from './useCertificateStorage.js'

export function useCertificateError(props, { isElectron, websiteUrl, webviewRef, partitionName, getCurrentUrl, executeJavaScript, mainWebviewReady }) {
  // ==================== 状态管理 ====================
  const loadError = ref(null)
  const hasCertificateError = ref(false)
  const certificateHash = ref(null)
  const isCertificateTrusted = ref(false)

  // 证书存储管理
  const { 
    isCertificateTrusted: checkCertificateTrusted, 
    trustCertificate,
    getCertificateHashByUrl,
    saveUrlCertificateMapping
  } = useCertificateStorage()

  // ==================== 处理加载失败 ====================
  const handleLoadFail = (error) => {
    console.log('[WebsiteCard] 加载失败:', error)
    if (error.type === 'certificate') {
      // 保存证书哈希
      if (error.certificateHash) {
        certificateHash.value = error.certificateHash
        // 检查证书是否已信任
        isCertificateTrusted.value = checkCertificateTrusted(error.certificateHash)
        console.log('[WebsiteCard] 证书哈希:', error.certificateHash.substring(0, 16) + '...', '已信任:', isCertificateTrusted.value)
        
        // 如果已信任，只显示红色阴影，不显示提示框
        if (isCertificateTrusted.value) {
          hasCertificateError.value = true
          loadError.value = null // 不显示提示框
        } else {
          // 未信任，显示提示框
          hasCertificateError.value = true
          loadError.value = error
        }
      } else {
        // 没有证书哈希，显示提示框
        hasCertificateError.value = true
        loadError.value = error
      }
    } else {
      loadError.value = error
    }
  }

  // ==================== 检查证书错误 ====================
  const checkCertificateError = async () => {
    if (!isElectron.value || !webviewRef.value) {
      return
    }

    try {
      // 检查 webview 的 URL 是否是错误页面
      const currentUrl = getCurrentUrl()
      if (currentUrl && currentUrl.startsWith('chrome-error://')) {
        console.log('[WebsiteCard] 检测到 chrome-error 页面，可能是证书错误')
        hasCertificateError.value = true
        if (!loadError.value) {
          loadError.value = {
            type: 'certificate',
            errorCode: -202,
            errorDescription: 'ERR_CERT_AUTHORITY_INVALID',
            url: currentUrl
          }
        }
        return
      }

      // 检查当前 URL 是否有已保存的证书哈希
      if (currentUrl && (currentUrl.startsWith('http://') || currentUrl.startsWith('https://'))) {
        const savedHash = getCertificateHashByUrl(currentUrl)
        if (savedHash) {
          console.log('[WebsiteCard] 从映射中找到证书哈希:', savedHash.substring(0, 16) + '...')
          certificateHash.value = savedHash
          isCertificateTrusted.value = checkCertificateTrusted(savedHash)
          
          if (isCertificateTrusted.value) {
            // 证书已信任，只显示红色阴影
            hasCertificateError.value = true
            loadError.value = null
            console.log('[WebsiteCard] 证书已信任，只显示红色阴影（从映射检查）')
            return
          }
        }
      }

      // 尝试执行 JavaScript 检查页面是否有证书警告
      try {
        const result = await executeJavaScript(`
          (function() {
            const title = document.title || '';
            const bodyText = document.body ? document.body.innerText || '' : '';
            const hasCertError = title.includes('证书') || 
                                 title.includes('Certificate') ||
                                 title.includes('安全') ||
                                 title.includes('Security') ||
                                 bodyText.includes('证书') ||
                                 bodyText.includes('Certificate') ||
                                 bodyText.includes('NET::ERR_CERT') ||
                                 window.location.href.startsWith('chrome-error://');
            return { hasCertError, url: window.location.href, title };
          })();
        `)
        
        if (result && result.hasCertError) {
          console.log('[WebsiteCard] 检测到证书错误:', result)
          hasCertificateError.value = true
          if (!loadError.value) {
            loadError.value = {
              type: 'certificate',
              errorCode: -202,
              errorDescription: 'ERR_CERT_AUTHORITY_INVALID',
              url: result.url
            }
          }
        } else {
          // 如果之前有证书错误但现在没有了，清除状态
          if (hasCertificateError.value && currentUrl && !currentUrl.startsWith('chrome-error://')) {
            hasCertificateError.value = false
          }
        }
      } catch (jsError) {
        console.log('[WebsiteCard] 检查证书错误时执行 JavaScript 失败（可能是正常的）:', jsError.message)
      }
    } catch (error) {
      console.error('[WebsiteCard] 检查证书错误失败:', error)
    }
  }

  // ==================== 忽略证书错误 ====================
  const handleIgnoreCertificateError = async () => {
    console.log('[WebsiteCard] 忽略证书错误并继续加载')
    
    // 如果存在证书哈希，保存到信任列表
    if (certificateHash.value) {
      trustCertificate(certificateHash.value)
      isCertificateTrusted.value = true
      console.log('[WebsiteCard] 已保存证书哈希到信任列表:', certificateHash.value.substring(0, 16) + '...')
    }
    
    // 隐藏提示框，但保留红色阴影
    loadError.value = null
    hasCertificateError.value = true
    
    if (isElectron.value && webviewRef.value) {
      try {
        const url = websiteUrl.value
        console.log('[WebsiteCard] 重新加载 URL:', url)
        
        // 先清空，然后重新设置 URL
        webviewRef.value.src = 'about:blank'
        await new Promise(resolve => setTimeout(resolve, 100))
        webviewRef.value.src = url
      } catch (error) {
        console.error('[WebsiteCard] 重新加载失败:', error)
        try {
          webviewRef.value.reload()
        } catch (reloadError) {
          console.error('[WebsiteCard] reload 也失败:', reloadError)
        }
      }
    }
  }

  // ==================== 处理主进程的证书错误通知 ====================
  const setupCertificateErrorListener = () => {
    if (!isElectron.value || !window.electron) {
      return
    }

    const certificateErrorHandler = (data) => {
      console.log('[WebsiteCard] 收到证书错误通知（原始数据）:', data)
      const partition = partitionName.value
      const currentUrl = props.item.url || ''
      
      // 处理 partition 匹配
      let partitionMatch = false
      if (data.partition === undefined || data.partition === 'default') {
        partitionMatch = partition === 'persist:default' || partition === 'default'
      } else {
        partitionMatch = data.partition === partition
      }
      
      // 检查 URL 或 hostname 是否匹配
      let urlMatch = false
      if (data.hostname) {
        try {
          const currentUrlObj = new URL(currentUrl)
          urlMatch = currentUrlObj.hostname === data.hostname
        } catch (e) {
          urlMatch = currentUrl.includes(data.hostname)
        }
      } else if (data.url) {
        try {
          const dataUrlObj = new URL(data.url)
          const currentUrlObj = new URL(currentUrl)
          urlMatch = dataUrlObj.hostname === currentUrlObj.hostname
        } catch (e) {
          urlMatch = currentUrl.includes(data.url)
        }
      }
      
      console.log('[WebsiteCard] 证书错误匹配检查:', {
        dataPartition: data.partition,
        currentPartition: partition,
        dataUrl: data.url,
        dataHostname: data.hostname,
        currentUrl: currentUrl,
        partitionMatch,
        urlMatch
      })
      
      // 检查是否是当前 webview 的证书错误
      if (partitionMatch && urlMatch) {
        console.log('[WebsiteCard] ✓ 匹配成功，设置证书错误状态')
        
        // 保存证书哈希
        if (data.certificateHash) {
          certificateHash.value = data.certificateHash
          // 保存 URL 和证书哈希的映射
          const urlToSave = data.url || currentUrl
          if (urlToSave) {
            saveUrlCertificateMapping(urlToSave, data.certificateHash)
          }
          // 立即检查证书是否已信任
          isCertificateTrusted.value = checkCertificateTrusted(data.certificateHash)
          console.log('[WebsiteCard] 证书哈希:', data.certificateHash.substring(0, 16) + '...', '已信任:', isCertificateTrusted.value)
          
          // 如果已信任，只显示红色阴影，不显示提示框
          if (isCertificateTrusted.value) {
            hasCertificateError.value = true
            loadError.value = null
            console.log('[WebsiteCard] 证书已信任，只显示红色阴影')
          } else {
            // 未信任，显示提示框
            handleLoadFail({
              type: 'certificate',
              errorCode: -202,
              errorDescription: data.error || 'ERR_CERT_AUTHORITY_INVALID',
              url: data.url || currentUrl,
              certificateHash: data.certificateHash
            })
          }
        } else {
          // 没有证书哈希，显示提示框
          handleLoadFail({
            type: 'certificate',
            errorCode: -202,
            errorDescription: data.error || 'ERR_CERT_AUTHORITY_INVALID',
            url: data.url || currentUrl
          })
        }
      } else {
        console.log('[WebsiteCard] ✗ 不匹配，忽略此证书错误通知', {
          partitionMatch,
          urlMatch
        })
      }
    }
    
    window.electron.on('certificate-error-detected', certificateErrorHandler)
    console.log('[WebsiteCard] ✓ 已注册证书错误监听器')
    
    // 保存处理器以便卸载时清理
    onBeforeUnmount(() => {
      if (window.electron && window.electron.off) {
        window.electron.off('certificate-error-detected', certificateErrorHandler)
        console.log('[WebsiteCard] ✓ 已移除证书错误监听器')
      }
    })
  }

  // ==================== 生命周期钩子 ====================
  onMounted(() => {
    setupCertificateErrorListener()
  })

  // 监听 webview 加载完成，检查证书错误
  watch(() => mainWebviewReady.value, (ready) => {
    if (ready && isElectron.value) {
      // 延迟检查，确保页面完全加载
      setTimeout(() => {
        checkCertificateError()
      }, 1000)
    }
  })

  // 监听 URL 变化，清除错误状态
  watch(() => props.item.url, (newUrl, oldUrl) => {
    if (newUrl && newUrl !== oldUrl && oldUrl !== undefined) {
      // 清除之前的错误状态
      loadError.value = null
      hasCertificateError.value = false
      certificateHash.value = null
      isCertificateTrusted.value = false
    }
  })

  return {
    loadError,
    hasCertificateError,
    isCertificateTrusted,
    handleLoadFail,
    handleIgnoreCertificateError,
    checkCertificateError
  }
}

