import { ref } from 'vue'

/**
 * Webview 设置和事件监听 composable
 * 用于管理主 webview 和缓冲 webview 的 ref 设置和事件回调
 * 
 * @param {Object} props - 组件 props
 * @param {Object} options - 配置选项
 * @param {import('vue').Ref<boolean>} options.isElectron - 是否为 Electron 环境
 * @param {import('vue').ComputedRef<string>} options.websiteUrl - 计算的网站 URL
 * @param {import('vue').Ref<HTMLElement>} options.webviewRef - webview 元素引用
 * @param {Function} options.setWebviewRefBase - 基础的 webview ref 设置函数
 * @param {Function} options.setBufferWebviewRefBase - 缓冲 webview ref 设置函数
 * @param {Function} options.setupWebviewEvents - 设置 webview 事件的函数
 * @param {Function} options.applyMuteState - 应用静音状态的函数
 * @param {Function} options.applyAdBlock - 应用去广告的函数
 * @param {Function} options.applyDarkMode - 应用暗色主题的函数
 * @param {Function} options.applySelector - 应用选择器的函数
 * @param {Function} options.applyPadding - 应用内边距的函数
 * @param {Function} options.checkNavigationState - 检查导航状态的函数
 * @param {Function} options.checkUrlChange - 检查 URL 变化的函数
 * @param {Function} options.onLoadFail - 加载失败回调函数
 * @returns {Object} webview 设置方法
 */
export function useWebviewSetup(props, {
  isElectron,
  websiteUrl,
  webviewRef,
  setWebviewRefBase,
  setBufferWebviewRefBase,
  setupWebviewEvents,
  applyMuteState,
  applyAdBlock,
  applyDarkMode,
  applySelector,
  applyPadding,
  checkNavigationState,
  checkUrlChange,
  onLoadFail
}) {
  // 跟踪已设置的主 webview
  let lastMainWebview = null
  // 跟踪已设置的缓冲 webview
  let lastBufferWebview = null

  /**
   * 设置主 webview 引用（带事件监听）
   * @param {HTMLElement} el - webview 元素
   */
  const setWebviewRef = (el) => {
    console.log('[useWebviewSetup] ========== setWebviewRef 被调用 ==========')
    console.log('[useWebviewSetup] 新的 webview 元素:', el?.id)
    console.log('[useWebviewSetup] 上次的 webview 元素:', lastMainWebview?.id)
    console.log('[useWebviewSetup] 是否为新元素:', lastMainWebview !== el)
    
    // 更新 webview ref
    if (lastMainWebview !== el) {
      console.log('[useWebviewSetup] webview 元素已改变')
      lastMainWebview = el
      setWebviewRefBase(el)
    }
    
    // 每次都设置/更新 webview 事件回调（即使元素没变，callbacks 也可能需要更新）
    if (el) {
      console.log('[useWebviewSetup] 设置/更新 webview 事件回调')
      // 设置 webview 事件监听，传入回调
      setupWebviewEvents(el, {
        onLoad: async (webview) => {
          console.log('[useWebviewSetup] ========== onLoad 回调被调用 ==========')
          console.log('[useWebviewSetup] webview ID:', props.item.id)
          console.log('[useWebviewSetup] isFullscreen:', props.isFullscreen)
          console.log('[useWebviewSetup] targetSelector:', props.item.targetSelector)
          console.log('[useWebviewSetup] targetSelectors:', props.item.targetSelectors)
          
          // 应用静音状态
          applyMuteState(webview)
          
          // 应用去广告
          if (props.adBlockEnabled) {
            await applyAdBlock(webview)
          }

          // 应用暗色主题
          if (props.item.darkMode) {
            await applyDarkMode(webview)
          }

          // 应用选择器
          const hasSelectors = (props.item.targetSelectors && props.item.targetSelectors.length > 0) ||
                              (props.item.targetSelector && props.item.targetSelector.trim())
          console.log('[useWebviewSetup] hasSelectors:', hasSelectors)
          console.log('[useWebviewSetup] 是否应用选择器:', !props.isFullscreen && hasSelectors)
          
          if (!props.isFullscreen && hasSelectors) {
            console.log('[useWebviewSetup] 开始应用选择器')
            await applySelector(webview, false)
            console.log('[useWebviewSetup] 选择器应用完成')
          } else if (!props.isFullscreen && !hasSelectors) {
            // 网页模式：应用内边距
            console.log('[useWebviewSetup] 网页模式，应用内边距')
            await applyPadding(webview)
          } else {
            console.log('[useWebviewSetup] 跳过应用选择器/内边距，原因:', 
              props.isFullscreen ? '处于全屏状态' : '没有选择器且无内边距')
          }
          
          // 加载完成后检查导航状态
          checkNavigationState()
          
          // 检查证书错误（延迟检查，确保页面完全加载）
          if (onLoadFail) {
            setTimeout(async () => {
              try {
                const currentUrl = webview.getURL()
                if (currentUrl && currentUrl.startsWith('chrome-error://')) {
                  console.log('[useWebviewSetup] 检测到 chrome-error 页面，可能是证书错误')
                  onLoadFail({
                    type: 'certificate',
                    errorCode: -202,
                    errorDescription: 'ERR_CERT_AUTHORITY_INVALID',
                    url: currentUrl
                  })
                }
              } catch (error) {
                console.log('[useWebviewSetup] 检查证书错误时出错:', error.message)
              }
            }, 500)
          }
        },
        onNavigate: (url) => {
          checkUrlChange(url)
          // 导航后检查导航状态
          checkNavigationState()
        },
        onLoadFail: (event) => {
          // 检测证书错误
          const isCertificateError = event.errorCode === -202 || 
                                    event.errorCode === -200 ||
                                    event.errorDescription?.includes('CERT') ||
                                    event.errorDescription === 'ERR_CERT_AUTHORITY_INVALID' ||
                                    event.errorDescription === 'ERR_CERT_INVALID' ||
                                    event.errorDescription === 'ERR_CERT_REVOKED' ||
                                    event.errorDescription === 'ERR_CERT_DATE_INVALID'
          
          if (isCertificateError && onLoadFail) {
            console.log('[useWebviewSetup] 检测到证书错误:', {
              errorCode: event.errorCode,
              errorDescription: event.errorDescription,
              url: event.validatedURL
            })
            onLoadFail({
              type: 'certificate',
              errorCode: event.errorCode,
              errorDescription: event.errorDescription,
              url: event.validatedURL
            })
          } else if (onLoadFail) {
            // 其他类型的错误
            onLoadFail({
              type: 'other',
              errorCode: event.errorCode,
              errorDescription: event.errorDescription,
              url: event.validatedURL
            })
          }
        }
      })
    }
  }

  /**
   * 设置缓冲 webview 引用（带事件监听）
   * @param {HTMLElement} el - webview 元素
   */
  const setBufferWebviewRef = (el) => {
    // 只在 webview 实例改变时才设置事件监听器
    if (lastBufferWebview !== el) {
      lastBufferWebview = el
      setBufferWebviewRefBase(el)
      if (el) {
        setupWebviewEvents(el, {
          onLoad: async (webview) => {
            // 应用去广告
            if (props.adBlockEnabled) {
              await applyAdBlock(webview)
            }
            
            // 应用暗色主题
            if (props.item.darkMode) {
              await applyDarkMode(webview)
            }
            
            // 应用选择器或内边距
            const hasSelectors = (props.item.targetSelectors && props.item.targetSelectors.length > 0) ||
                                (props.item.targetSelector && props.item.targetSelector.trim())
            if (!props.isFullscreen && hasSelectors) {
              await applySelector(webview, true)
            } else if (!props.isFullscreen && !hasSelectors) {
              // 网页模式：应用内边距
              await applyPadding(webview)
            }
          }
        })
      }
    }
  }

  return {
    setWebviewRef,
    setBufferWebviewRef
  }
}

