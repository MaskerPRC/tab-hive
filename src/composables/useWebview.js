/**
 * Webview/Iframe 管理 Composable
 * 负责 webview 和 iframe 的引用管理、事件监听、生命周期管理
 */

import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue'
import { useSessionManager } from './useSessionManager.js'

// 全局存储：已设置过事件监听器的 webview 集合
const setupWebviewsSet = new Set()
// 全局存储：每个 webview 的最新 callbacks
const webviewCallbacksMap = new WeakMap()

export function useWebview(props, emit) {
  // 检测是否在 Electron 环境
  const isElectron = computed(() => {
    return window.electron && window.electron.isElectron
  })

  // Webview preload 脚本路径
  const webviewPreloadPath = computed(() => {
    return window.electron?.webviewPreloadPath || ''
  })

  // Webview 和 Iframe 引用
  const webviewRef = ref(null)
  const iframeRef = ref(null)
  const mainWebviewReady = ref(false)

  // 代理设置状态标记
  const proxySetupDone = ref(false)

  // Session 管理
  const { getPartitionName } = useSessionManager()

  // 计算 partition 名称
  const partitionName = computed(() => {
    const instanceId = props.item.sessionInstance || 'default'
    return getPartitionName(instanceId)
  })

  // 设置代理（仅在需要时调用一次）
  const setupProxyIfNeeded = async () => {
    if (!isElectron.value || !window.electron?.proxy || proxySetupDone.value) {
      return true  // 不需要设置代理，返回成功
    }

    const proxyId = props.item.proxyId
    const partition = partitionName.value
    const hiveId = props.item.id

    try {
      if (proxyId) {
        // 设置代理
        console.log(`[useWebview] 首次为视界 ${hiveId} 设置代理 ${proxyId}`)
        const result = await window.electron.proxy.setSessionProxy(partition, hiveId, proxyId)
        if (result.success) {
          console.log(`[useWebview] 代理设置成功，端口: ${result.data?.httpPort}`)
          proxySetupDone.value = true
          return true
        } else {
          console.error(`[useWebview] 代理设置失败: ${result.error}`)
          return false
        }
      } else {
        // 清除代理
        console.log(`[useWebview] 清除视界 ${hiveId} 的代理设置`)
        const result = await window.electron.proxy.setSessionProxy(partition, hiveId, null)
        if (result.success) {
          console.log(`[useWebview] 代理清除成功`)
          proxySetupDone.value = true
          return true
        } else {
          console.error(`[useWebview] 代理清除失败: ${result.error}`)
          return false
        }
      }
    } catch (error) {
      console.error('[useWebview] 设置/清除代理时出错:', error)
      return false
    }
  }

  // 设置 webview 引用
  const setWebviewRef = (el) => {
    // 只在 webview 实例改变时才更新
    if (webviewRef.value !== el) {
      webviewRef.value = el
      proxySetupDone.value = false  // 重置代理设置状态
      if (el) {
        setupWebviewEvents(el)
        // 首次设置代理并加载页面
        setupProxyAndLoadPage(el)
      }
    }
  }

  // 设置代理并加载页面
  const setupProxyAndLoadPage = async (webview) => {
    // 检查 webview 是否已经有 src（比如从双缓冲刷新过来的）
    const hasExistingSrc = webview.src && webview.src !== '' && webview.src !== 'about:blank'
    
    // 确保证书错误处理已设置（支持自签名证书）
    if (isElectron.value && window.electron?.ipc) {
      try {
        const partition = partitionName.value
        await window.electron.ipc.invoke('ensure-certificate-error-handler', partition)
        console.log(`[useWebview] 确保证书错误处理已设置 - partition: ${partition}`)
      } catch (error) {
        console.warn('[useWebview] 设置证书错误处理失败:', error)
      }
    }
    
    // 设置代理
    const proxySetupSuccess = await setupProxyIfNeeded()

    // 延迟一下确保代理完全就绪（缩短延迟时间）
    if (props.item.proxyId && proxySetupSuccess) {
      await new Promise(resolve => setTimeout(resolve, 200))
    }

    // 只有在 webview 没有 src 的情况下才加载页面（首次初始化）
    if (!hasExistingSrc) {
      // 加载实际页面
      let url = props.item.url || props.item.href || 'https://www.google.com'
      // 为 webview 添加 ID 参数和配置参数
      const separator = url.includes('?') ? '&' : '?'
      url = `${url}${separator}__webview_id__=${props.item.id}`
      
      // 添加外部链接配置参数
      if (props.item.openExternalInModal) {
        url = `${url}&__open_external_in_modal__=1`
      }
      
      console.log(`[useWebview] 代理设置完成，直接加载页面: ${url}`)

      // 直接加载目标页面，不进行 IP 检测
      webview.src = url
    }
  }

  // 设置 iframe 引用
  const setIframeRef = (el) => {
    iframeRef.value = el
  }

  // 设置 webview 事件监听
  const setupWebviewEvents = (webview, callbacks = {}) => {
    // 总是更新 callbacks（即使已经设置过事件监听器）
    webviewCallbacksMap.set(webview, callbacks)

    // 防止重复设置事件监听器
    if (setupWebviewsSet.has(webview)) {
      return
    }

    setupWebviewsSet.add(webview)

    // 立即设置new-window事件监听（必须在dom-ready之前）
    const handleNewWindow = (event) => {
      console.log('[useWebview] ========== Webview new-window 事件 ==========')
      console.log('[useWebview] URL:', event.url)
      console.log('[useWebview] frameName:', event.frameName)
      console.log('[useWebview] disposition:', event.disposition)
      console.log('[useWebview] webview ID:', webview?.id)
      console.log('[useWebview] 堆栈跟踪:', new Error().stack)
      
      // 阻止默认行为（打开新窗口）
      event.preventDefault()
      console.log('[useWebview] ✓ 已阻止默认行为')
      
      if (event.url) {
        console.log('[useWebview] 拦截new-window，在当前webview中导航:', event.url)
        
        // 获取当前URL，判断是否同根域名
        try {
          const currentUrl = webview.getURL()
          console.log('[useWebview] 当前webview URL:', currentUrl)
          
          // 判断是否同根域名
          function getRootDomain(hostname) {
            if (!hostname) return ''
            hostname = hostname.split(':')[0]
            if (/^\d+\.\d+\.\d+\.\d+$/.test(hostname)) return hostname
            if (hostname === 'localhost' || hostname === '127.0.0.1') return hostname
            const parts = hostname.split('.')
            if (parts.length >= 2) {
              return parts.slice(-2).join('.')
            }
            return hostname
          }
          
          function isSameRootDomain(url1, url2) {
            try {
              const urlObj1 = new URL(url1)
              const urlObj2 = new URL(url2)
              const rootDomain1 = getRootDomain(urlObj1.hostname)
              const rootDomain2 = getRootDomain(urlObj2.hostname)
              const isSame = rootDomain1 === rootDomain2 && rootDomain1 !== ''
              console.log('[useWebview] 域名比较:', {
                url1: urlObj1.hostname,
                url2: urlObj2.hostname,
                rootDomain1,
                rootDomain2,
                isSame
              })
              return isSame
            } catch (e) {
              console.error('[useWebview] URL解析失败:', e)
              return false
            }
          }
          
          // 如果同根域名，在当前webview中导航
          if (currentUrl && isSameRootDomain(currentUrl, event.url)) {
            console.log('[useWebview] ✓ 同根域名，在当前webview中导航')
            webview.src = event.url
          } else {
            // 不同根域名，触发事件打开模态框
            console.log('[useWebview] ✗ 不同根域名，打开模态框')
            window.dispatchEvent(new CustomEvent('open-external-url-modal', {
              detail: { url: event.url }
            }))
          }
        } catch (error) {
          console.error('[useWebview] 处理new-window失败:', error)
          // 出错时也打开模态框
          window.dispatchEvent(new CustomEvent('open-external-url-modal', {
            detail: { url: event.url }
          }))
        }
      }
    }
    
    // 立即注册new-window事件监听器（必须在webview加载前）
    webview.addEventListener('new-window', handleNewWindow)
    console.log('[useWebview] ✓ 已注册new-window事件监听器')

    // 使用 Promise 来确保 DOM 就绪
    let domReadyPromise = new Promise((resolve) => {
      let resolved = false
      const resolveOnce = () => {
        if (!resolved) {
          resolved = true
          console.log('[useWebview] Webview DOM 已就绪')
          resolve()
        }
      }

      // 监听 DOM 就绪事件
      webview.addEventListener('dom-ready', resolveOnce, { once: true })

      // 如果已经触发过 dom-ready，立即 resolve
      // 检查 webview 的 readyState（如果可用）
      if (webview.getWebContentsId) {
        try {
          // 如果可以获取 WebContents ID，说明可能已经准备好了
          webview.getWebContentsId()
          // 但为了安全，还是等待 dom-ready 事件
        } catch (e) {
          // 如果失败，说明确实还没准备好，等待 dom-ready
        }
      }

      // 超时保护：5秒后强制 resolve（防止永久等待）
      setTimeout(() => {
        if (!resolved) {
          console.warn('[useWebview] ⚠ DOM 就绪等待超时，但继续执行')
          resolveOnce()
        }
      }, 5000)
    })

    // 监听加载完成
    webview.addEventListener('did-finish-load', async () => {
      console.log('[useWebview] Webview 加载完成')
      console.log('[useWebview] 当前 webview ID:', webview?.id)

      // 等待 DOM 就绪 Promise
      await domReadyPromise

      // 额外等待一小段时间确保 webview 完全准备好
      await new Promise(resolve => setTimeout(resolve, 300))

      // 从 WeakMap 获取最新的 callbacks
      const latestCallbacks = webviewCallbacksMap.get(webview) || {}
      console.log('[useWebview] 最新的 callbacks.onLoad 存在:', !!latestCallbacks.onLoad)

      mainWebviewReady.value = true

      // 触发加载完成回调
      if (latestCallbacks.onLoad) {
        console.log('[useWebview] 调用最新的 onLoad 回调')
        try {
          await latestCallbacks.onLoad(webview)
          console.log('[useWebview] onLoad 回调执行完成')
        } catch (error) {
          console.error('[useWebview] onLoad 回调执行失败:', error)
          // 如果是 DOM 未就绪错误，等待后重试一次
          if (error.message && error.message.includes('dom-ready')) {
            console.log('[useWebview] 检测到 DOM 未就绪错误，等待后重试...')
            await new Promise(resolve => setTimeout(resolve, 1000))
            try {
              await latestCallbacks.onLoad(webview)
              console.log('[useWebview] 重试成功')
            } catch (retryError) {
              console.error('[useWebview] 重试也失败:', retryError)
            }
          }
        }
      } else {
        console.log('[useWebview] ⚠️ 没有 onLoad 回调')
      }
    })

    // 监听导航变化
    webview.addEventListener('did-navigate', (event) => {
      const latestCallbacks = webviewCallbacksMap.get(webview) || {}
      if (latestCallbacks.onNavigate) {
        latestCallbacks.onNavigate(event.url)
      }
    })

    webview.addEventListener('did-navigate-in-page', (event) => {
      const latestCallbacks = webviewCallbacksMap.get(webview) || {}
      if (latestCallbacks.onNavigate) {
        latestCallbacks.onNavigate(event.url)
      }
    })

    // 监听导航开始事件（用于检测跨域跳转）
    webview.addEventListener('will-navigate', (event) => {
      console.log('========================================')
      console.log('[useWebview] ========== Webview 即将导航 ==========')
      console.log('[useWebview] 目标 URL:', event.url)
      
      try {
        const currentUrl = webview.getURL()
        console.log('[useWebview] 当前 URL:', currentUrl)
        
        // 判断域名函数
        function getRootDomain(hostname) {
          if (!hostname) return ''
          hostname = hostname.split(':')[0]
          if (/^\d+\.\d+\.\d+\.\d+$/.test(hostname)) return hostname
          if (hostname === 'localhost' || hostname === '127.0.0.1') return hostname
          const parts = hostname.split('.')
          if (parts.length >= 2) {
            return parts.slice(-2).join('.')
          }
          return hostname
        }
        
        const currentDomain = getRootDomain(new URL(currentUrl).hostname)
        const targetDomain = getRootDomain(new URL(event.url).hostname)
        
        console.log('[useWebview] 当前域名:', currentDomain)
        console.log('[useWebview] 目标域名:', targetDomain)
        
        // 如果是跨域导航，根据配置决定是否拦截
        if (currentDomain && targetDomain && currentDomain !== targetDomain) {
          console.log('[useWebview] ✅ 检测到跨域导航（可能是重定向）')
          
          // 检查是否启用了在模态框中打开外部链接
          const openExternalInModal = props.item.openExternalInModal || false
          console.log('[useWebview] 外部链接在模态框中打开配置:', openExternalInModal)
          
          if (openExternalInModal) {
            console.log('[useWebview] 🛑 配置启用：阻止导航，打开模态框')
            
            event.preventDefault()
            
            // 触发自定义事件打开模态框
            console.log('[useWebview] 📢 触发事件: open-external-url-modal')
            window.dispatchEvent(new CustomEvent('open-external-url-modal', {
              detail: { url: event.url }
            }))
            
            console.log('[useWebview] ✓ 已拦截跨域导航')
          } else {
            console.log('[useWebview] ℹ️ 配置未启用：允许跨域导航（在当前页面跳转）')
          }
        } else {
          console.log('[useWebview] ✅ 同域名导航，允许继续')
        }
      } catch (error) {
        console.error('[useWebview] ❌ 处理导航事件失败:', error)
      }
      
      console.log('========================================')
    })

    // 注意：new-window事件监听器已经在上面定义并注册了

    // 监听新窗口打开 - IPC消息
    webview.addEventListener('ipc-message', (event) => {
      console.log('========================================')
      console.log('[useWebview] ========== 收到 Webview IPC 消息 ==========')
      console.log('[useWebview] 消息通道 (channel):', event.channel)
      console.log('[useWebview] 消息参数 (args):', event.args)
      console.log('[useWebview] 完整事件对象:', event)
      
      if (event.channel === 'webview-open-url') {
        console.log('[useWebview] ✅ 消息类型: webview-open-url (同域名导航)')
        console.log('[useWebview] Webview 尝试打开新窗口 (IPC):', event.args[0])
        const { url } = event.args[0]
        if (url) {
          console.log('[useWebview] 🔄 设置 webview.src =', url)
          webview.src = url
          console.log('[useWebview] ✓ webview 导航已触发')
        } else {
          console.warn('[useWebview] ⚠️ URL 为空，忽略')
        }
        console.log('========================================')
      } else if (event.channel === 'webview-open-external-url') {
        // 处理打开外部链接（不同域名）
        console.log('[useWebview] ✅ 消息类型: webview-open-external-url (不同域名)')
        console.log('[useWebview] Webview 请求打开外部链接')
        console.log('[useWebview] 消息数据:', event.args[0])
        const { url } = event.args[0]
        if (url) {
          console.log('[useWebview] 📤 外部链接 URL:', url)
          console.log('[useWebview] 🎯 触发打开外部链接模态框')
          console.log('[useWebview] 触发事件: open-external-url-modal')
          console.log('[useWebview] 事件详情:', { url })
          
          // 触发自定义事件，让App.vue监听
          const customEvent = new CustomEvent('open-external-url-modal', {
            detail: { url }
          })
          
          console.log('[useWebview] 📢 正在派发自定义事件到 window...')
          window.dispatchEvent(customEvent)
          console.log('[useWebview] ✓ 自定义事件已派发')
          console.log('[useWebview] 等待 App.vue 响应...')
        } else {
          console.warn('[useWebview] ⚠️ URL 为空，忽略')
        }
        console.log('========================================')
      } else if (event.channel === 'webview-ready') {
        console.log('[useWebview] ✅ 消息类型: webview-ready')
        console.log('[useWebview] Webview 已准备就绪:', event.args[0])
        console.log('========================================')
      } else {
        console.log('[useWebview] ℹ️ 其他消息类型，不处理')
        console.log('========================================')
      }
    })

    // 监听加载失败
    webview.addEventListener('did-fail-load', (event) => {
      console.error('[useWebview] Webview 加载失败:', {
        errorCode: event.errorCode,
        errorDescription: event.errorDescription,
        validatedURL: event.validatedURL,
        isMainFrame: event.isMainFrame,
        partition: webview.partition,
        sessionInstance: props.item.sessionInstance
      })

      if (callbacks.onLoadFail) {
        callbacks.onLoadFail(event)
      }
    })
  }

  // 执行 JavaScript 代码
  const executeJavaScript = async (code) => {
    if (isElectron.value && webviewRef.value) {
      try {
        return await webviewRef.value.executeJavaScript(code)
      } catch (error) {
        console.error('[useWebview] 执行 JavaScript 失败:', error)
        throw error
      }
    }
    return null
  }

  // 获取当前 URL
  const getCurrentUrl = () => {
    if (isElectron.value && webviewRef.value) {
      try {
        return webviewRef.value.getURL()
      } catch (error) {
        console.error('[useWebview] 获取 URL 失败:', error)
        return ''
      }
    }
    return ''
  }

  // 监听 sessionInstance 变化
  watch(() => props.item.sessionInstance, (newVal, oldVal) => {
    if (oldVal !== undefined && newVal !== oldVal && isElectron.value) {
      console.log('[useWebview] SessionInstance 变化:', {
        old: oldVal,
        new: newVal,
        oldPartition: oldVal ? `persist:${oldVal}` : 'persist:default',
        newPartition: newVal ? `persist:${newVal}` : 'persist:default'
      })
      // webview 的 partition 属性不能动态修改
      // 通过 key 属性变化强制 Vue 重新创建 webview 元素
    }
  })

  // 监听 proxyId 变化
  watch(() => props.item.proxyId, async (newVal, oldVal) => {
    console.log(`[useWebview] proxyId watch 触发: ${oldVal} -> ${newVal}`)
    if (oldVal !== undefined && newVal !== oldVal && isElectron.value && window.electron?.proxy) {
      const partition = partitionName.value
      const hiveId = props.item.id

      try {
        console.log(`[useWebview] 代理配置变化: ${oldVal} -> ${newVal}`)
        proxySetupDone.value = false  // 重置状态，允许重新设置
        const result = await window.electron.proxy.setSessionProxy(partition, hiveId, newVal || null)
        if (result.success) {
          console.log(`[useWebview] 代理配置更新成功`)
          proxySetupDone.value = true
          // 重新加载 webview 以使代理生效
          if (webviewRef.value) {
            webviewRef.value.reload()
          }
        } else {
          console.error(`[useWebview] 代理配置更新失败: ${result.error}`)
        }
      } catch (error) {
        console.error('[useWebview] 更新代理配置时出错:', error)
      }
    }
  })

  // 组件挂载时设置事件监听
  onMounted(() => {
    if (isElectron.value && window.electron) {
      window.electron.on('refresh-webview-from-main', (webviewId) => {
        if (webviewId === props.item.id && emit) {
          console.log('[useWebview] 收到主进程刷新命令')
          emit('refresh-from-main')
        }
      })
      
      // 监听证书错误事件
      window.electron.on('certificate-error-detected', (data) => {
        const partition = partitionName.value
        const currentUrl = props.item.url || ''
        // 检查是否是当前 webview 的证书错误
        if (data.partition === partition && (data.url === currentUrl || currentUrl.includes(new URL(data.url).hostname))) {
          console.log('[useWebview] 检测到证书错误:', data)
          // 通过 emit 通知父组件
          if (emit) {
            emit('certificate-error', {
              type: 'certificate',
              errorCode: -202,
              errorDescription: data.error || 'ERR_CERT_AUTHORITY_INVALID',
              url: data.url
            })
          }
        }
      })
    }
  })

  // 组件卸载时清理
  onBeforeUnmount(() => {
    // 清理事件监听器跟踪
    if (webviewRef.value) {
      setupWebviewsSet.delete(webviewRef.value)
    }

    if (isElectron.value && window.electron && props.item.id) {
      window.electron.webview.unregister(props.item.id).catch(err => {
        console.error('[useWebview] 取消注册失败:', err)
      })

      // 清理代理
      if (props.item.proxyId && window.electron.proxy) {
        const partition = partitionName.value
        window.electron.proxy.setSessionProxy(partition, props.item.id, null).catch(err => {
          console.error('[useWebview] 清理代理失败:', err)
        })
        window.electron.proxy.stopForHive(props.item.id).catch(err => {
          console.error('[useWebview] 停止代理失败:', err)
        })
      }
    }
  })

  return {
    isElectron,
    webviewPreloadPath,
    webviewRef,
    iframeRef,
    mainWebviewReady,
    partitionName,
    setWebviewRef,
    setIframeRef,
    setupWebviewEvents,
    executeJavaScript,
    getCurrentUrl
  }
}

