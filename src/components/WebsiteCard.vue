<template>
  <div
    class="grid-item"
    :class="{
      'fullscreen': isFullscreen,
      'hidden': isHidden,
      'empty-slot': !item.url,
      'drag-over': isDragOver && isExternalDragging,
      'draggable': true,
      'dragging': isDragging && isCurrentDrag,
      'resizing': isResizing && isCurrentResize,
      'colliding': isColliding && (isCurrentDrag || isCurrentResize)
    }"
    :style="itemStyle"
  >
    <!-- 已有网站显示 -->
    <template v-if="item.url">
      <iframe
        :ref="el => setIframeRef(el)"
        :data-iframe-id="`iframe-${item.id}`"
        :src="websiteUrl"
        frameborder="0"
        v-bind="isElectron ? {} : { sandbox: 'allow-same-origin allow-scripts allow-forms allow-popups allow-popups-to-escape-sandbox allow-downloads' }"
        class="website-iframe"
        :class="{ 'mobile-view': item.deviceType === 'mobile' }"
        :title="item.title"
        :allow="'autoplay; fullscreen; picture-in-picture'"
      ></iframe>
      
      <!-- 拖动手柄 -->
      <div
        class="drag-handle"
        @mousedown="$emit('drag-start', $event, index)"
        @touchstart="$emit('drag-start', $event, index)"
        title="按住拖动"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="9" cy="5" r="1"/>
          <circle cx="9" cy="12" r="1"/>
          <circle cx="9" cy="19" r="1"/>
          <circle cx="15" cy="5" r="1"/>
          <circle cx="15" cy="12" r="1"/>
          <circle cx="15" cy="19" r="1"/>
        </svg>
      </div>
      
      <!-- 拖放捕获层 -->
      <div
        v-if="isExternalDragging"
        class="drop-zone"
        @dragover.prevent="$emit('drag-over', index)"
        @dragleave.prevent="$emit('drag-leave')"
        @drop.prevent="$emit('drop', $event, index)"
      ></div>
      
      <!-- 拖放提示框 -->
      <div v-if="isDragOver && isExternalDragging" class="drop-hint">
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
          <polyline points="7 10 12 15 17 10"/>
          <line x1="12" y1="15" x2="12" y2="3"/>
        </svg>
        <span>替换此网站</span>
      </div>
      
      <!-- 非全屏模式下的浮动按钮 -->
      <div v-if="!isFullscreen" class="floating-actions">
        <button
          class="btn-action btn-refresh"
          @click="$emit('refresh', index)"
          title="刷新页面"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="23 4 23 10 17 10"/>
            <polyline points="1 20 1 14 7 14"/>
            <path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15"/>
          </svg>
        </button>
        <button
          class="btn-action btn-edit"
          @click="$emit('edit', index)"
          title="编辑链接"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
          </svg>
        </button>
        <button
          class="btn-action"
          @click="$emit('fullscreen', index)"
          title="全屏查看"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"/>
          </svg>
        </button>
        <button
          class="btn-action btn-remove"
          @click="$emit('remove', index)"
          title="删除网站"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
          </svg>
        </button>
      </div>

      <!-- 调整大小手柄 -->
      <div class="resize-handles">
        <div class="resize-handle resize-se" @mousedown="$emit('resize-start', $event, index, 'se')"></div>
        <div class="resize-handle resize-e" @mousedown="$emit('resize-start', $event, index, 'e')"></div>
        <div class="resize-handle resize-s" @mousedown="$emit('resize-start', $event, index, 's')"></div>
      </div>
    </template>
  </div>
</template>

<script>
import { computed, ref, watch, onMounted, onUnmounted } from 'vue'

export default {
  name: 'WebsiteCard',
  props: {
    item: {
      type: Object,
      required: true
    },
    index: {
      type: Number,
      required: true
    },
    itemStyle: {
      type: Object,
      default: () => ({})
    },
    isFullscreen: {
      type: Boolean,
      default: false
    },
    isHidden: {
      type: Boolean,
      default: false
    },
    isDragOver: {
      type: Boolean,
      default: false
    },
    isExternalDragging: {
      type: Boolean,
      default: false
    },
    isDragging: {
      type: Boolean,
      default: false
    },
    isCurrentDrag: {
      type: Boolean,
      default: false
    },
    isResizing: {
      type: Boolean,
      default: false
    },
    isCurrentResize: {
      type: Boolean,
      default: false
    },
    isColliding: {
      type: Boolean,
      default: false
    }
  },
  emits: ['drag-start', 'drag-over', 'drag-leave', 'drop', 'refresh', 'edit', 'fullscreen', 'remove', 'resize-start'],
  setup(props) {
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
        // 直接向iframe内注入消息，让content script接收
        const iframe = iframeRef.value
        if (!iframe || !iframe.contentWindow) {
          console.error('[Tab Hive] iframe不可用')
          return
        }

        console.log('[Tab Hive] 向iframe发送消息，请求应用选择器')
        
        // 注入执行代码的函数到iframe
        // 由于跨域，我们需要通过扩展来执行
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

        // 向iframe发送postMessage，iframe内的content script会接收
        console.log('[Tab Hive] 向iframe.contentWindow发送消息，选择器:', props.item.targetSelector)
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
     * 获取网站URL，支持设备类型
     */
    const websiteUrl = computed(() => {
      if (!props.item.url) return ''

      // 如果是手机版，尝试转换为移动版URL
      if (props.item.deviceType === 'mobile') {
        try {
          const url = new URL(props.item.url)
          const hostname = url.hostname

          // 应用转换规则
          let newHostname = hostname
          if (hostname.startsWith('m.')) {
            // 已经是移动版，不变
            newHostname = hostname
          } else if (hostname.startsWith('www.')) {
            newHostname = hostname.replace(/^www\./, 'm.')
          } else {
            newHostname = 'm.' + hostname
          }

          url.hostname = newHostname
          return url.toString()
        } catch (e) {
          // URL 解析失败，返回原始URL
          console.warn('无法解析URL:', props.item.url)
          return props.item.url
        }
      }

      return props.item.url
    })

    /**
     * 应用选择器（在Grid模式下只显示指定元素）
     */
    const applySelectorFullscreen = async () => {
      // 必须有选择器和iframe引用
      if (!props.item.targetSelector || !iframeRef.value) {
        console.log('[Tab Hive] 跳过应用选择器：', {
          hasSelector: !!props.item.targetSelector,
          hasIframe: !!iframeRef.value
        })
        return
      }
      
      console.log('[Tab Hive] 开始应用选择器（Grid模式）')

      // 检查是否在Electron环境
      const isElectronEnv = window.electron?.isElectron

      console.log('[Tab Hive] 环境检测:', { isElectron: isElectronEnv })
      
      if (isElectronEnv) {
        // Electron环境：通过IPC注入CSS样式到iframe
        try {
          console.log('[Tab Hive] Electron环境 - 应用选择器:', props.item.targetSelector)
          
          const styleId = `tabhive-selector-style-${props.item.id}`
          const selector = props.item.targetSelector
          
          // 创建style标签注入到iframe
          const code = `
            (function() {
              try {
                const selector = '${selector.replace(/'/g, "\\'")}';
                console.log('[Tab Hive iframe] 应用选择器:', selector);
                
                // 移除旧的style
                const oldStyle = document.getElementById('${styleId}');
                if (oldStyle) {
                  oldStyle.remove();
                }
                
                // 检查元素是否存在
                const targetElement = document.querySelector(selector);
                if (!targetElement) {
                  console.warn('[Tab Hive iframe] 未找到选择器对应的元素:', selector);
                  return { success: false, error: '未找到元素' };
                }
                
                // 输出调试信息
                console.log('[Tab Hive iframe] 目标元素信息:', {
                  tagName: targetElement.tagName,
                  className: targetElement.className,
                  id: targetElement.id,
                  width: targetElement.offsetWidth,
                  height: targetElement.offsetHeight,
                  computedStyle: window.getComputedStyle(targetElement).display
                });
                
                // 遍历父元素链，隐藏每一层的兄弟元素
                let current = targetElement;
                let hiddenCount = 0;
                
                while (current && current !== document.body) {
                  // 获取所有兄弟元素
                  const parent = current.parentElement;
                  if (parent) {
                    Array.from(parent.children).forEach(sibling => {
                      // 如果不是当前元素，且不是script/style/link，就隐藏
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
                
                // 创建style标签，让目标元素填满
                const style = document.createElement('style');
                style.id = '${styleId}';
                style.textContent = \`
                  /* Tab Hive - 让选择器元素填满整个区域 */
                  
                  /* 重置body和html */
                  html, body {
                    margin: 0 !important;
                    padding: 0 !important;
                    overflow: hidden !important;
                    width: 100% !important;
                    height: 100% !important;
                  }
                  
                  /* 目标元素：fixed定位，填满整个视口 */
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
                  
                  /* 确保子元素可见 */
                  \${selector} * {
                    visibility: visible !important;
                  }
                \`;
                
                document.head.appendChild(style);
                
                // 检查应用后的状态
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
          // 尝试直接访问iframe（如果同域）
          if (!iframeRef.value) {
            console.warn('[Tab Hive] iframe引用不存在')
            return
          }
          
          if (!iframeRef.value.contentWindow) {
            console.warn('[Tab Hive] iframe.contentWindow不可用')
            return
          }
          
          if (!iframeRef.value.contentDocument) {
            // 跨域iframe - 尝试通过Chrome扩展
            console.warn('[Tab Hive] iframe.contentDocument不可用（跨域iframe）')
            console.info('[Tab Hive] 尝试使用Chrome扩展...')
            
            // 通过postMessage与Chrome扩展通信
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
          
          // 遍历父元素链，隐藏每一层的兄弟元素
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
          
          // 创建style标签
          const styleId = `tabhive-selector-style-${props.item.id}`
          let style = iframeDoc.getElementById(styleId)
          if (!style) {
            style = iframeDoc.createElement('style')
            style.id = styleId
            iframeDoc.head.appendChild(style)
          }
          
          style.textContent = `
            /* Tab Hive - 让选择器元素填满整个区域 */
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
                // 移除注入的style标签
                const style = document.getElementById('${styleId}');
                if (style) {
                  style.remove();
                  console.log('[Tab Hive iframe] 样式已移除');
                }
                
                // 恢复所有被隐藏的兄弟元素
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
        // 浏览器环境：尝试直接清理
        console.log('[Tab Hive] 浏览器环境 - 尝试恢复原始样式')
        
        try {
          if (iframeRef.value && iframeRef.value.contentDocument) {
            // 同域iframe - 直接操作
            const iframeDoc = iframeRef.value.contentDocument
            
            // 移除style标签
            const styleId = `tabhive-selector-style-${props.item.id}`
            const style = iframeDoc.getElementById(styleId)
            if (style) {
              style.remove()
              console.log('[Tab Hive] 样式已移除')
            }
            
            // 恢复被隐藏的元素
            const hiddenElements = iframeDoc.querySelectorAll('[data-tabhive-hidden]')
            let restoredCount = 0
            hiddenElements.forEach(el => {
              el.style.display = ''
              el.removeAttribute('data-tabhive-hidden')
              restoredCount++
            })
            console.log('[Tab Hive] 已恢复 ' + restoredCount + ' 个元素')
          } else if (iframeRef.value && iframeRef.value.contentWindow) {
            // 跨域iframe - 通过Chrome扩展
            console.log('[Tab Hive] 跨域iframe，通过扩展恢复样式')
            const script = `
              (function() {
                const styleId = 'tabhive-selector-style';
                const style = document.getElementById(styleId);
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
                console.log('[Tab Hive iframe] 已恢复', restoredCount, '个元素');
              })();
            `
            
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

    // 监听全屏状态变化
    watch(() => props.isFullscreen, async (newVal, oldVal) => {
      console.log('[Tab Hive Watch] 全屏状态变化:', newVal)
      console.log('[Tab Hive Watch] 目标选择器:', props.item.targetSelector)
      console.log('[Tab Hive Watch] iframe引用:', iframeRef.value)
      
      // 如果配置了选择器，全屏切换时刷新iframe
      if (props.item.targetSelector && iframeRef.value && oldVal !== undefined) {
        console.log('[Tab Hive Watch] 配置了选择器，刷新iframe以切换显示模式')
        // 刷新iframe
        const currentSrc = iframeRef.value.src
        iframeRef.value.src = currentSrc
      }
      
      // 如果没有配置选择器，不做任何处理（保留用户输入）
    })

    // 监听iframe加载完成
    onMounted(() => {
      if (iframeRef.value) {
        iframeRef.value.addEventListener('load', async () => {
          console.log('[Tab Hive] iframe加载完成')
          console.log('[Tab Hive] 当前状态 - 全屏:', props.isFullscreen, '选择器:', props.item.targetSelector)
          
          // 如果不是全屏状态且有选择器，应用选择器
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
    })

    onUnmounted(() => {
      // 组件卸载时不需要特别清理，因为iframe会被销毁
      console.log('[Tab Hive] WebsiteCard组件卸载')
    })

    return {
      websiteUrl,
      isElectron,
      setIframeRef
    }
  }
}
</script>

<style scoped>
.grid-item {
  background: white;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  position: relative;
  min-height: 300px;
  cursor: move;
  border: solid 1px #FF5C00;
}

.grid-item.draggable:hover {
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
}

/* 拖动和调整大小时禁用所有动画 */
.grid-item.dragging,
.grid-item.resizing {
  transition: none !important;
}

/* 拖动时保持正在拖动的元素可交互 */
.grid-item.dragging {
  z-index: 9999 !important;
}

.grid-item.resizing {
  z-index: 9999 !important;
}

/* 碰撞时的视觉反馈 */
.grid-item.colliding {
  box-shadow: 0 0 0 3px rgba(255, 0, 0, 0.5) !important;
  animation: shake 0.3s ease-in-out;
}

@keyframes shake {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-2px); }
  75% { transform: translateX(2px); }
}

.grid-item.hidden {
  display: none;
}

.grid-item.fullscreen {
  position: fixed !important;
  top: 0 !important;
  left: 0 !important;
  width: 100vw !important;
  height: 100vh !important;
  z-index: 9999 !important;
  border-radius: 0;
  box-shadow: none;
  margin: 0;
  padding: 0;
}

.grid-item.drag-over {
  border: 3px dashed var(--primary-color);
  background: var(--primary-light);
  box-shadow: 0 4px 12px rgba(255, 92, 0, 0.3);
}

.website-iframe {
  width: 100%;
  height: 100%;
  border: none;
}

/* 拖动或调整大小时，禁用iframe的鼠标事件，防止操作中断 */
.grid-item.dragging .website-iframe,
.grid-item.resizing .website-iframe {
  pointer-events: none;
}

.website-iframe.mobile-view {
  max-width: 375px;
  margin: 0 auto;
  border: 2px solid #ddd;
  border-radius: 20px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
}

/* 拖动手柄 */
.drag-handle {
  position: absolute;
  top: 8px;
  left: 8px;
  width: 32px;
  height: 32px;
  background: rgba(255, 92, 0, 0.9);
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: move;
  opacity: 0;
  transition: opacity 0.2s, background 0.2s;
  z-index: 150;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
}

.grid-item:hover .drag-handle {
  opacity: 1;
}

.drag-handle:hover {
  background: rgba(255, 92, 0, 1);
  transform: scale(1.05);
}

.drag-handle:active {
  transform: scale(0.95);
}

.drag-handle svg {
  display: block;
  stroke: white;
  fill: white;
}

/* 拖动时保持手柄可见 */
.grid-item.dragging .drag-handle {
  opacity: 1;
}

/* 全屏模式下隐藏拖动手柄 */
.grid-item.fullscreen .drag-handle {
  display: none;
}

.drop-zone {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 100;
  pointer-events: all;
}

.drop-hint {
  position: absolute;
  top: 10px;
  left: 10px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 15px 20px;
  background: rgba(255, 92, 0, 0.15);
  border: 2px dashed var(--primary-color);
  border-radius: 8px;
  color: var(--primary-color);
  font-weight: 600;
  font-size: 14px;
  z-index: 101;
  backdrop-filter: blur(4px);
  pointer-events: none;
  animation: pulse 1.5s ease-in-out infinite;
}

.drop-hint svg {
  stroke: var(--primary-color);
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
    transform: scale(1);
  }
  50% {
    opacity: 0.85;
    transform: scale(1.02);
  }
}

.floating-actions {
  position: absolute;
  top: 10px;
  right: 10px;
  display: flex;
  gap: 8px;
  z-index: 101;
  opacity: 0;
  transition: opacity 0.2s ease;
  pointer-events: none;
}

.grid-item:hover .floating-actions {
  opacity: 1;
  pointer-events: all;
}

.btn-action {
  background: rgba(255, 92, 0, 0.7);
  color: white;
  border: none;
  padding: 8px;
  border-radius: 6px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s;
  backdrop-filter: blur(4px);
}

.btn-action:hover {
  background: rgba(255, 92, 0, 0.9);
  transform: scale(1.1);
}

.btn-action svg {
  display: block;
}

.btn-remove {
  background: rgba(255, 68, 68, 0.7) !important;
}

.btn-remove:hover {
  background: rgba(255, 0, 0, 0.9) !important;
}

.btn-refresh {
  background: rgba(76, 175, 80, 0.7) !important;
}

.btn-refresh:hover {
  background: rgba(76, 175, 80, 0.9) !important;
}

.btn-edit {
  background: rgba(33, 150, 243, 0.7) !important;
}

.btn-edit:hover {
  background: rgba(33, 150, 243, 0.9) !important;
}

/* 调整大小手柄 */
.resize-handles {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 102;
}

.resize-handle {
  position: absolute;
  background: var(--primary-color);
  opacity: 0;
  transition: opacity 0.2s;
  pointer-events: all;
}

.grid-item:hover .resize-handle {
  opacity: 0.8;
}

.resize-handle:hover {
  opacity: 1 !important;
  background: var(--primary-hover);
}

.resize-se {
  bottom: 0;
  right: 0;
  width: 12px;
  height: 12px;
  cursor: se-resize;
  border-radius: 0 0 8px 0;
}

.resize-e {
  top: 50%;
  right: 0;
  width: 4px;
  height: 20px;
  transform: translateY(-50%);
  cursor: e-resize;
}

.resize-s {
  bottom: 0;
  left: 50%;
  width: 20px;
  height: 4px;
  transform: translateX(-50%);
  cursor: s-resize;
}
</style>

