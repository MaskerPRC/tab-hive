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

    // 检查 URL 是否为 HTTP 协议
    let isHttpUrl = false
    try {
      const url = props.item.url || props.item.href || ''
      if (url) {
        const urlObj = new URL(url)
        isHttpUrl = urlObj.protocol === 'http:'
      }
    } catch (error) {
      // URL 解析失败，继续按原逻辑处理
    }

    // 如果是 HTTP 协议，不设置代理
    if (isHttpUrl && proxyId) {
      console.log(`[useWebview] HTTP 协议网页，跳过代理设置`)
      proxySetupDone.value = true
      return true
    }

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
    
    // 获取要加载的 URL
    let url = props.item.url || props.item.href || 'https://www.google.com'
    
    // 检查 URL 协议类型
    let isHttpUrl = false
    try {
      const urlObj = new URL(url)
      isHttpUrl = urlObj.protocol === 'http:'
      if (isHttpUrl) {
        console.log(`[useWebview] 检测到 HTTP 协议网页: ${url}，将禁用代理设置`)
      }
    } catch (error) {
      console.warn('[useWebview] URL 解析失败:', url, error)
    }
    
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
    
    // 如果是 HTTP 协议，强制清除代理；否则按需设置代理
    let proxySetupSuccess = true
    if (isHttpUrl) {
      // HTTP 协议：强制清除代理
      if (isElectron.value && window.electron?.proxy && props.item.proxyId) {
        console.log(`[useWebview] HTTP 协议网页，强制清除代理设置`)
        try {
          const partition = partitionName.value
          const hiveId = props.item.id
          const result = await window.electron.proxy.setSessionProxy(partition, hiveId, null)
          if (result.success) {
            console.log(`[useWebview] 代理已清除（HTTP 协议）`)
            proxySetupDone.value = true
          } else {
            console.error(`[useWebview] 清除代理失败: ${result.error}`)
          }
        } catch (error) {
          console.error('[useWebview] 清除代理时出错:', error)
        }
      }
    } else {
      // HTTPS 或其他协议：按需设置代理
      proxySetupSuccess = await setupProxyIfNeeded()
      // 延迟一下确保代理完全就绪（缩短延迟时间）
      if (props.item.proxyId && proxySetupSuccess) {
        await new Promise(resolve => setTimeout(resolve, 200))
      }
    }

    // 只有在 webview 没有 src 的情况下才加载页面（首次初始化）
    if (!hasExistingSrc) {
      // 为 webview 添加 ID 参数
      const separator = url.includes('?') ? '&' : '?'
      url = `${url}${separator}__webview_id__=${props.item.id}`
      
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

      // 检查当前 URL 是否为 HTTP 协议
      let isHttpUrl = false
      try {
        const url = props.item.url || props.item.href || ''
        if (url) {
          const urlObj = new URL(url)
          isHttpUrl = urlObj.protocol === 'http:'
          if (isHttpUrl) {
            console.log(`[useWebview] 检测到 HTTP 协议网页，禁止切换代理设置`)
          }
        }
      } catch (error) {
        console.warn('[useWebview] URL 解析失败:', error)
      }

      try {
        console.log(`[useWebview] 代理配置变化: ${oldVal} -> ${newVal}`)
        proxySetupDone.value = false  // 重置状态，允许重新设置
        
        // 如果是 HTTP 协议，强制清除代理；否则按照新配置设置
        const proxyIdToSet = isHttpUrl ? null : (newVal || null)
        if (isHttpUrl && newVal) {
          console.log(`[useWebview] HTTP 协议网页，忽略代理设置请求，强制清除代理`)
        }
        
        const result = await window.electron.proxy.setSessionProxy(partition, hiveId, proxyIdToSet)
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

