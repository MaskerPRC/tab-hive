import { ref, watch, onMounted, onUnmounted, computed } from 'vue'

/**
 * 管理iframe选择器功能的composable
 * 用于在Grid模式下只显示iframe中的指定元素，或在全屏模式下显示完整页面
 */
export function useIframeSelector(props) {
  const iframeRef = ref(null)
  const originalStyles = ref(null)
  
  // 检测是否在Electron环境
  const isElectron = computed(() => window.electron?.isElectron || false)

  /**
   * 设置iframe引用
   */
  const setIframeRef = (el) => {
    iframeRef.value = el
  }

  /**
   * 通过Chrome扩展应用选择器
   */
  const applySelectorViaExtension = async () => {
    try {
      const iframe = iframeRef.value
      if (!iframe || !iframe.contentWindow) {
        console.error('[Tab Hive] iframe不可用')
        return
      }

      console.log('[Tab Hive] 向iframe发送消息，请求应用选择器')
      
      const script = `
        (function() {
          const selector = '${props.item.targetSelector.replace(/'/g, "\\'")}';
          const targetElement = document.querySelector(selector);
          
          if (!targetElement) {
            console.warn('[Tab Hive iframe] 未找到选择器:', selector);
            return;
          }
          
          console.log('[Tab Hive iframe] 找到目标元素，应用选择器');
          
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
          
          // 注入样式
          const styleId = 'tabhive-selector-style';
          let style = document.getElementById(styleId);
          if (!style) {
            style = document.createElement('style');
            style.id = styleId;
            document.head.appendChild(style);
          }
          
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
          
          console.log('[Tab Hive iframe] 选择器已应用，隐藏了', hiddenCount, '个元素');
        })();
      `

      iframe.contentWindow.postMessage({
        source: 'tab-hive',
        action: 'executeScriptInIframe',
        selector: props.item.targetSelector
      }, '*')
    } catch (error) {
      console.error('[Tab Hive] Chrome扩展调用失败:', error)
    }
  }

  /**
   * 应用选择器（在Grid模式下只显示指定元素）
   */
  const applySelectorFullscreen = async () => {
    if (!props.item.targetSelector || !iframeRef.value) {
      console.log('[Tab Hive] 跳过应用选择器：', {
        hasSelector: !!props.item.targetSelector,
        hasIframe: !!iframeRef.value
      })
      return
    }
    
    console.log('[Tab Hive] 开始应用选择器（Grid模式）')

    const isElectronEnv = window.electron?.isElectron
    console.log('[Tab Hive] 环境检测:', { isElectron: isElectronEnv })
    
    if (isElectronEnv) {
      // Electron环境：通过IPC注入CSS样式到iframe
      try {
        console.log('[Tab Hive] Electron环境 - 应用选择器:', props.item.targetSelector)
        
        const styleId = `tabhive-selector-style-${props.item.id}`
        const selector = props.item.targetSelector
        
        const code = `
          (function() {
            try {
              const selector = '${selector.replace(/'/g, "\\'")}';
              console.log('[Tab Hive iframe] 应用选择器:', selector);
              
              const oldStyle = document.getElementById('${styleId}');
              if (oldStyle) {
                oldStyle.remove();
              }
              
              const targetElement = document.querySelector(selector);
              if (!targetElement) {
                console.warn('[Tab Hive iframe] 未找到选择器对应的元素:', selector);
                return { success: false, error: '未找到元素' };
              }
              
              console.log('[Tab Hive iframe] 目标元素信息:', {
                tagName: targetElement.tagName,
                className: targetElement.className,
                id: targetElement.id,
                width: targetElement.offsetWidth,
                height: targetElement.offsetHeight,
                computedStyle: window.getComputedStyle(targetElement).display
              });
              
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
              
              console.log('[Tab Hive iframe] 已隐藏 ' + hiddenCount + ' 个兄弟元素');
              
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
              
              setTimeout(() => {
                console.log('[Tab Hive iframe] 样式应用后元素状态:', {
                  display: window.getComputedStyle(targetElement).display,
                  visibility: window.getComputedStyle(targetElement).visibility,
                  width: targetElement.offsetWidth,
                  height: targetElement.offsetHeight,
                  position: targetElement.getBoundingClientRect()
                });
              }, 100);
              
              console.log('[Tab Hive iframe] 选择器全屏已应用');
              return { success: true };
            } catch (e) {
              console.error('[Tab Hive iframe] 错误:', e);
              return { success: false, error: e.message };
            }
          })()
        `

        const result = await window.electron.executeInIframe(`iframe-${props.item.id}`, code)
        if (!result.success) {
          console.warn('[Tab Hive] 选择器应用失败:', result.error)
        }
      } catch (error) {
        console.error('[Tab Hive] 应用选择器失败:', error)
      }
    } else {
      // 浏览器环境：尝试直接操作iframe（同域）或等待Chrome扩展
      console.log('[Tab Hive] 浏览器环境 - 尝试应用选择器')
      console.log('[Tab Hive] iframe引用检查:', {
        hasIframe: !!iframeRef.value,
        hasContentWindow: !!iframeRef.value?.contentWindow,
        hasContentDocument: !!iframeRef.value?.contentDocument
      })
      
      try {
        if (!iframeRef.value) {
          console.warn('[Tab Hive] iframe引用不存在')
          return
        }
        
        if (!iframeRef.value.contentWindow) {
          console.warn('[Tab Hive] iframe.contentWindow不可用')
          return
        }
        
        if (!iframeRef.value.contentDocument) {
          console.warn('[Tab Hive] iframe.contentDocument不可用（跨域iframe）')
          console.info('[Tab Hive] 尝试使用Chrome扩展...')
          await applySelectorViaExtension()
          return
        }
        
        console.log('[Tab Hive] 可以访问iframe内容，开始应用选择器')
        
        const iframeDoc = iframeRef.value.contentDocument
        const targetElement = iframeDoc.querySelector(props.item.targetSelector)
        
        if (!targetElement) {
          console.warn('[Tab Hive] 未找到选择器对应的元素:', props.item.targetSelector)
          return
        }
        
        console.log('[Tab Hive] 直接操作iframe，应用选择器')
        
        let current = targetElement
        let hiddenCount = 0
        
        while (current && current !== iframeDoc.body) {
          const parent = current.parentElement
          if (parent) {
            Array.from(parent.children).forEach(sibling => {
              if (sibling !== current && 
                  !['SCRIPT', 'STYLE', 'LINK', 'META', 'TITLE'].includes(sibling.tagName)) {
                sibling.style.display = 'none'
                sibling.setAttribute('data-tabhive-hidden', 'true')
                hiddenCount++
              }
            })
          }
          current = parent
        }
        
        console.log('[Tab Hive] 已隐藏 ' + hiddenCount + ' 个兄弟元素')
        
        const styleId = `tabhive-selector-style-${props.item.id}`
        let style = iframeDoc.getElementById(styleId)
        if (!style) {
          style = iframeDoc.createElement('style')
          style.id = styleId
          iframeDoc.head.appendChild(style)
        }
        
        style.textContent = `
          html, body {
            margin: 0 !important;
            padding: 0 !important;
            overflow: hidden !important;
            width: 100% !important;
            height: 100% !important;
          }
          
          ${props.item.targetSelector} {
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
          
          ${props.item.targetSelector} * {
            visibility: visible !important;
          }
        `
        
        console.log('[Tab Hive] 选择器已应用（浏览器环境）')
      } catch (error) {
        console.warn('[Tab Hive] 无法直接访问iframe（跨域限制）:', error.message)
        console.info('[Tab Hive] 提示：如需支持跨域网站，请安装Tab Hive Chrome扩展')
      }
    }
  }

  /**
   * 恢复原始样式（移除选择器效果，显示完整网页）
   */
  const restoreOriginalStyles = async () => {
    if (!props.item.targetSelector || !iframeRef.value) {
      console.log('[Tab Hive] 跳过恢复样式：', {
        hasSelector: !!props.item.targetSelector,
        hasIframe: !!iframeRef.value
      })
      return
    }
    
    console.log('[Tab Hive] 开始恢复原始样式（全屏模式）')

    const isElectronEnv = window.electron?.isElectron

    if (isElectronEnv) {
      try {
        console.log('[Tab Hive] 恢复原始样式')
        
        const styleId = `tabhive-selector-style-${props.item.id}`
        
        const code = `
          (function() {
            try {
              const style = document.getElementById('${styleId}');
              if (style) {
                style.remove();
                console.log('[Tab Hive iframe] 样式已移除');
              }
              
              const hiddenElements = document.querySelectorAll('[data-tabhive-hidden]');
              let restoredCount = 0;
              hiddenElements.forEach(el => {
                el.style.display = '';
                el.removeAttribute('data-tabhive-hidden');
                restoredCount++;
              });
              console.log('[Tab Hive iframe] 已恢复 ' + restoredCount + ' 个元素');
              
              return { success: true };
            } catch (e) {
              console.error('[Tab Hive iframe] 移除样式失败:', e);
              return { success: false, error: e.message };
            }
          })()
        `

        await window.electron.executeInIframe(`iframe-${props.item.id}`, code)
      } catch (error) {
        console.error('[Tab Hive] 恢复原始样式失败:', error)
      }
    } else {
      console.log('[Tab Hive] 浏览器环境 - 尝试恢复原始样式')
      
      try {
        if (iframeRef.value && iframeRef.value.contentDocument) {
          const iframeDoc = iframeRef.value.contentDocument
          
          const styleId = `tabhive-selector-style-${props.item.id}`
          const style = iframeDoc.getElementById(styleId)
          if (style) {
            style.remove()
            console.log('[Tab Hive] 样式已移除')
          }
          
          const hiddenElements = iframeDoc.querySelectorAll('[data-tabhive-hidden]')
          let restoredCount = 0
          hiddenElements.forEach(el => {
            el.style.display = ''
            el.removeAttribute('data-tabhive-hidden')
            restoredCount++
          })
          console.log('[Tab Hive] 已恢复 ' + restoredCount + ' 个元素')
        } else if (iframeRef.value && iframeRef.value.contentWindow) {
          console.log('[Tab Hive] 跨域iframe，通过扩展恢复样式')
          
          iframeRef.value.contentWindow.postMessage({
            source: 'tab-hive',
            action: 'restoreTabHiveStyles'
          }, '*')
        }
      } catch (error) {
        console.warn('[Tab Hive] 恢复样式失败:', error.message)
      }
    }
  }

  /**
   * 获取网站URL，支持设备类型
   */
  const getWebsiteUrl = () => {
    if (!props.item.url) return ''

    // 如果是手机版，尝试转换为移动版URL
    if (props.item.deviceType === 'mobile') {
      try {
        const url = new URL(props.item.url)
        const hostname = url.hostname

        let newHostname = hostname
        if (hostname.startsWith('m.')) {
          newHostname = hostname
        } else if (hostname.startsWith('www.')) {
          newHostname = hostname.replace(/^www\./, 'm.')
        } else {
          newHostname = 'm.' + hostname
        }

        url.hostname = newHostname
        return url.toString()
      } catch (e) {
        console.warn('无法解析URL:', props.item.url)
        return props.item.url
      }
    }

    return props.item.url
  }

  /**
   * 设置iframe加载完成监听器
   */
  const setupIframeLoadListener = () => {
    if (iframeRef.value) {
      iframeRef.value.addEventListener('load', async () => {
        console.log('[Tab Hive] iframe加载完成')
        console.log('[Tab Hive] 当前状态 - 全屏:', props.isFullscreen, '选择器:', props.item.targetSelector)
        
        if (!props.isFullscreen && props.item.targetSelector) {
          console.log('[Tab Hive] Grid模式 + 有选择器，等待1秒后应用选择器')
          setTimeout(async () => {
            await applySelectorFullscreen()
          }, 1000)
        } else {
          console.log('[Tab Hive] 全屏模式或无选择器，显示完整页面')
        }
      })
    }
  }


  // 监听全屏状态变化（在setup阶段设置）
  watch(() => props.isFullscreen, async (newVal, oldVal) => {
    console.log('[Tab Hive Watch] 全屏状态变化:', newVal)
    console.log('[Tab Hive Watch] 目标选择器:', props.item.targetSelector)
    console.log('[Tab Hive Watch] iframe引用:', iframeRef.value)
    
    if (props.item.targetSelector && iframeRef.value && oldVal !== undefined) {
      console.log('[Tab Hive Watch] 配置了选择器，刷新iframe以切换显示模式')
      const currentSrc = iframeRef.value.src
      iframeRef.value.src = currentSrc
    }
  })

  // 生命周期
  onMounted(() => {
    setupIframeLoadListener()
  })

  onUnmounted(() => {
    console.log('[Tab Hive] WebsiteCard组件卸载')
  })

  return {
    iframeRef,
    isElectron,
    setIframeRef,
    applySelectorFullscreen,
    restoreOriginalStyles,
    getWebsiteUrl
  }
}

