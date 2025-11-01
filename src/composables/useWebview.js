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

  // Session 管理
  const { getPartitionName } = useSessionManager()
  
  // 计算 partition 名称
  const partitionName = computed(() => {
    const instanceId = props.item.sessionInstance || 'default'
    return getPartitionName(instanceId)
  })

  // 设置 webview 引用
  const setWebviewRef = (el) => {
    // 只在 webview 实例改变时才更新
    if (webviewRef.value !== el) {
      webviewRef.value = el
      if (el) {
        setupWebviewEvents(el)
      }
    }
  }

  // 设置 iframe 引用
  const setIframeRef = (el) => {
    iframeRef.value = el
  }

  // 设置 webview 事件监听
  const setupWebviewEvents = (webview, callbacks = {}) => {
    console.log('[useWebview] ========== setupWebviewEvents 被调用 ==========')
    console.log('[useWebview] webview 元素:', webview?.id)
    console.log('[useWebview] 是否已设置过:', setupWebviewsSet.has(webview))
    console.log('[useWebview] callbacks.onLoad 存在:', !!callbacks.onLoad)
    
    // 总是更新 callbacks（即使已经设置过事件监听器）
    webviewCallbacksMap.set(webview, callbacks)
    console.log('[useWebview] 已更新 callbacks 到 WeakMap')
    
    // 防止重复设置事件监听器
    if (setupWebviewsSet.has(webview)) {
      console.log('[useWebview] 已设置过事件监听器，但已更新 callbacks，跳过重复设置')
      return
    }
    
    console.log('[useWebview] 首次设置 webview 事件监听')
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

    // 监听新窗口打开
    webview.addEventListener('ipc-message', (event) => {
      if (event.channel === 'webview-open-url') {
        console.log('[useWebview] Webview 尝试打开新窗口:', event.args[0])
        const { url } = event.args[0]
        if (url) {
          webview.src = url
        }
      } else if (event.channel === 'webview-ready') {
        console.log('[useWebview] Webview 已准备就绪:', event.args[0])
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

  // 组件挂载时设置事件监听
  onMounted(() => {
    if (isElectron.value && window.electron) {
      window.electron.on('refresh-webview-from-main', (webviewId) => {
        if (webviewId === props.item.id && emit) {
          console.log('[useWebview] 收到主进程刷新命令')
          emit('refresh-from-main')
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

