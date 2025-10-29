import { ref, watch, onMounted, onBeforeUnmount, computed } from 'vue'

/**
 * 管理 webview 选择器功能的 composable
 * 用于在 Grid 模式下只显示 webview 中的指定元素,或在全屏模式下显示完整页面
 */
export function useWebviewSelector(props) {
  const webviewRef = ref(null)
  
  // 检测是否在 Electron 环境
  const isElectron = computed(() => window.electron?.isElectron || false)
  
  // 主 webview 加载完成回调
  let onMainWebviewReadyCallback = null

  /**
   * 设置 webview 引用
   */
  const setWebviewRef = (el) => {
    webviewRef.value = el
    if (el) {
      setupWebviewEvents(el)
    }
  }

  /**
   * 设置 webview 事件监听
   */
  const setupWebviewEvents = (webview) => {
    console.log('[Webview Selector] 设置 webview 事件监听')

    // 监听加载完成
    webview.addEventListener('did-finish-load', async () => {
      console.log('[Webview Selector] Webview 加载完成')
      
      // 通知回调
      if (onMainWebviewReadyCallback) {
        onMainWebviewReadyCallback()
      }

      // 应用选择器(如果需要)
      if (!props.isFullscreen && props.item.targetSelector) {
        console.log('[Webview Selector] Grid 模式,等待后应用选择器')
        setTimeout(async () => {
          await applySelector(webview, props.item)
        }, 1000)
      }
    })

    // 监听新窗口打开
    webview.addEventListener('ipc-message', (event) => {
      if (event.channel === 'webview-open-url') {
        console.log('[Webview Selector] Webview 尝试打开新窗口:', event.args[0])
        // 在当前 webview 中导航
        const { url } = event.args[0]
        if (url) {
          webview.src = url
        }
      } else if (event.channel === 'webview-ready') {
        console.log('[Webview Selector] Webview 已准备就绪')
      }
    })

    // 监听加载失败
    webview.addEventListener('did-fail-load', (event) => {
      console.error('[Webview Selector] Webview 加载失败:', event.errorDescription)
    })
  }

  /**
   * 应用选择器到 webview
   * @param {HTMLElement} targetWebview - 目标 webview 元素
   * @param {Object} item - 网站数据对象
   * @returns {Promise<boolean>} 返回选择器是否成功应用
   */
  const applySelector = async (targetWebview, item) => {
    if (!item.targetSelector || !targetWebview) {
      console.log('[Webview Selector] 跳过应用选择器:', {
        hasSelector: !!item.targetSelector,
        hasWebview: !!targetWebview
      })
      return false
    }
    
    console.log('[Webview Selector] 开始应用选择器:', item.targetSelector)

    try {
      // 等待一段时间确保页面完全加载
      await new Promise(resolve => setTimeout(resolve, 500))

      // 构造选择器代码
      const styleId = `tabhive-selector-style-${item.id}`
      const selector = item.targetSelector

      const selectorCode = `
        (function() {
          try {
            const selector = '${selector.replace(/'/g, "\\'")}';
            console.log('[Webview Selector] 应用选择器:', selector);
            
            // 移除旧样式
            const oldStyle = document.getElementById('${styleId}');
            if (oldStyle) {
              oldStyle.remove();
            }
            
            // 查找目标元素
            const targetElement = document.querySelector(selector);
            if (!targetElement) {
              console.warn('[Webview Selector] 未找到选择器对应的元素:', selector);
              return { success: false, error: '未找到元素' };
            }
            
            console.log('[Webview Selector] 目标元素信息:', {
              tagName: targetElement.tagName,
              className: targetElement.className,
              id: targetElement.id
            });
            
            // 隐藏兄弟元素
            let current = targetElement;
            let hiddenCount = 0;
            
            while (current && current !== document.body) {
              const parent = current.parentElement;
              if (parent) {
                Array.from(parent.children).forEach(sibling => {
                  if (sibling !== current && 
                      !['SCRIPT', 'STYLE', 'LINK', 'META', 'TITLE'].includes(sibling.tagName)) {
                    sibling.style.display = 'none';
                    sibling.setAttribute('data-tabhive-hidden', 'true');
                    hiddenCount++;
                  }
                });
              }
              current = parent;
            }
            
            console.log('[Webview Selector] 已隐藏', hiddenCount, '个兄弟元素');
            
            // 添加样式
            const style = document.createElement('style');
            style.id = '${styleId}';
            style.textContent = \`
              html, body {
                margin: 0 !important;
                padding: 0 !important;
                overflow: hidden !important;
                width: 100% !important;
                height: 100% !important;
              }
              
              \${selector} {
                display: block !important;
                visibility: visible !important;
                position: fixed !important;
                top: 0 !important;
                left: 0 !important;
                width: 100vw !important;
                height: 100vh !important;
                margin: 0 !important;
                padding: 0 !important;
                z-index: 999999 !important;
                object-fit: contain !important;
              }
              
              \${selector} * {
                visibility: visible !important;
              }
            \`;
            
            document.head.appendChild(style);
            console.log('[Webview Selector] 选择器已应用,隐藏了', hiddenCount, '个元素');
            return { success: true, hiddenCount: hiddenCount };
          } catch (e) {
            console.error('[Webview Selector] 错误:', e);
            return { success: false, error: e.message };
          }
        })();
      `

      // 执行选择器代码
      const result = await targetWebview.executeJavaScript(selectorCode)
      
      if (result && result.success) {
        console.log('[Webview Selector] ✓ 选择器应用成功,隐藏了', result.hiddenCount, '个元素')
        return true
      } else {
        console.warn('[Webview Selector] ✗ 选择器应用失败:', result?.error)
        return false
      }
    } catch (error) {
      console.error('[Webview Selector] 应用选择器失败:', error)
      return false
    }
  }

  /**
   * 恢复原始样式(移除选择器效果,显示完整网页)
   */
  const restoreOriginalStyles = async () => {
    if (!props.item.targetSelector || !webviewRef.value) {
      console.log('[Webview Selector] 跳过恢复样式:', {
        hasSelector: !!props.item.targetSelector,
        hasWebview: !!webviewRef.value
      })
      return
    }
    
    console.log('[Webview Selector] 开始恢复原始样式(全屏模式)')

    try {
      const styleId = `tabhive-selector-style-${props.item.id}`
      
      const code = `
        (function() {
          try {
            const style = document.getElementById('${styleId}');
            if (style) {
              style.remove();
              console.log('[Webview Selector] 样式已移除');
            }
            
            const hiddenElements = document.querySelectorAll('[data-tabhive-hidden]');
            let restoredCount = 0;
            hiddenElements.forEach(el => {
              el.style.display = '';
              el.removeAttribute('data-tabhive-hidden');
              restoredCount++;
            });
            console.log('[Webview Selector] 已恢复', restoredCount, '个元素');
            
            return { success: true, restoredCount };
          } catch (e) {
            console.error('[Webview Selector] 移除样式失败:', e);
            return { success: false, error: e.message };
          }
        })();
      `

      const result = await webviewRef.value.executeJavaScript(code)
      
      if (result && result.success) {
        console.log('[Webview Selector] ✓ 恢复样式成功,恢复了', result.restoredCount, '个元素')
      } else {
        console.warn('[Webview Selector] ✗ 恢复样式失败:', result?.error)
      }
    } catch (error) {
      console.error('[Webview Selector] 恢复原始样式失败:', error)
    }
  }

  /**
   * 获取网站 URL,支持设备类型
   */
  const getWebsiteUrl = () => {
    if (!props.item.url) return ''

    let url = props.item.url

    // 如果是手机版,尝试转换为移动版 URL
    if (props.item.deviceType === 'mobile') {
      try {
        const urlObj = new URL(url)
        const hostname = urlObj.hostname

        let newHostname = hostname
        if (hostname.startsWith('m.')) {
          newHostname = hostname
        } else if (hostname.startsWith('www.')) {
          newHostname = hostname.replace(/^www\./, 'm.')
        } else {
          newHostname = 'm.' + hostname
        }

        urlObj.hostname = newHostname
        url = urlObj.toString()
      } catch (e) {
        console.warn('无法解析 URL:', url)
      }
    }

    // Electron 环境下,为 webview 添加 ID 参数
    if (isElectron.value) {
      const separator = url.includes('?') ? '&' : '?'
      url = `${url}${separator}__webview_id__=${props.item.id}`
    }

    return url
  }

  /**
   * 设置主 webview 加载完成回调
   */
  const setOnMainWebviewReady = (callback) => {
    onMainWebviewReadyCallback = callback
  }

  // 监听全屏状态变化
  watch(() => props.isFullscreen, async (newVal, oldVal) => {
    console.log('[Webview Selector] 全屏状态变化:', newVal)
    console.log('[Webview Selector] 目标选择器:', props.item.targetSelector)
    console.log('[Webview Selector] Webview 引用:', webviewRef.value)
    console.log('[Webview Selector] 全屏切换刷新配置:', props.refreshOnFullscreenToggle)
    
    // 检查是否需要在全屏切换时刷新
    const shouldRefresh = props.refreshOnFullscreenToggle !== false // 默认为 true
    
    if (props.item.targetSelector && webviewRef.value && oldVal !== undefined) {
      if (shouldRefresh) {
        // 刷新模式:重新加载 webview
        console.log('[Webview Selector] 配置了选择器且允许刷新,刷新 webview 以切换显示模式')
        const currentSrc = webviewRef.value.src
        webviewRef.value.src = ''
        setTimeout(() => {
          webviewRef.value.src = currentSrc
        }, 10)
      } else {
        // 不刷新模式:动态切换选择器应用
        console.log('[Webview Selector] 配置了选择器但不刷新,动态切换显示模式')
        
        if (newVal) {
          // 进入全屏:恢复被隐藏的元素
          console.log('[Webview Selector] 进入全屏,恢复原始样式')
          await restoreOriginalStyles()
        } else {
          // 退出全屏:重新应用选择器
          console.log('[Webview Selector] 退出全屏,重新应用选择器')
          // 等待一小段时间确保 DOM 稳定
          await new Promise(resolve => setTimeout(resolve, 100))
          await applySelector(webviewRef.value, props.item)
        }
      }
    }
  })

  // 组件卸载时清理
  onBeforeUnmount(() => {
    console.log('[Webview Selector] 组件卸载')
    
    // 取消注册 webview
    if (isElectron.value && window.electron && props.item.id) {
      window.electron.webview.unregister(props.item.id).catch(err => {
        console.error('[Webview Selector] 取消注册失败:', err)
      })
    }
  })

  return {
    webviewRef,
    isElectron,
    setWebviewRef,
    applySelector,
    restoreOriginalStyles,
    getWebsiteUrl,
    setOnMainWebviewReady
  }
}

