<template>
  <!-- 父页面的工具栏 -->
  <div v-if="isActive" class="selector-toolbar">
    <div class="selector-info">
      <span v-if="hoveredSelector">{{ hoveredSelector }}</span>
      <span v-else>移动鼠标到iframe中的元素上选择，按 ESC 取消</span>
    </div>
    <button class="btn-cancel" @click="cancel">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <line x1="18" y1="6" x2="6" y2="18"/>
        <line x1="6" y1="6" x2="18" y2="18"/>
      </svg>
      取消
    </button>
  </div>
</template>

<script>
import { ref, watch, computed, onMounted, onUnmounted } from 'vue'

export default {
  name: 'ElementSelector',
  props: {
    isActive: {
      type: Boolean,
      default: false
    },
    targetIframe: {
      type: Object,
      default: null
    }
  },
  emits: ['select', 'cancel'],
  setup(props, { emit }) {
    const hoveredSelector = ref('')
    const isElectron = computed(() => window.electron?.isElectron || false)
    const hasExtension = ref(false)
    let messageListener = null
    let keydownListener = null
    let requestId = 0

    /**
     * 检测Chrome扩展是否已加载
     */
    const detectExtension = () => {
      return new Promise((resolve) => {
        // 检查是否已经收到过extensionLoaded消息（存储在window上）
        if (window.__tabHiveExtensionDetected) {
          console.log('[Tab Hive] 扩展已检测到（从缓存）')
          resolve(true)
          return
        }

        const timeout = setTimeout(() => {
          console.log('[Tab Hive] 扩展检测超时')
          resolve(false)
        }, 2000)

        const handler = (event) => {
          if (event.data && event.data.source === 'tab-hive-extension') {
            console.log('[Tab Hive] 收到扩展消息:', event.data.action)
            if (event.data.action === 'extensionLoaded' || event.data.action === 'pong') {
              clearTimeout(timeout)
              window.removeEventListener('message', handler)
              window.__tabHiveExtensionDetected = true
              resolve(true)
            }
          }
        }

        window.addEventListener('message', handler)
        
        // 请求扩展响应
        console.log('[Tab Hive] 发送ping消息检测扩展')
        window.postMessage({
          source: 'tab-hive',
          action: 'ping'
        }, '*')
      })
    }

    /**
     * 在Electron环境中启动元素选择器
     */
    const startSelectorInElectron = async () => {
      if (!props.targetIframe) {
        console.error('[Tab Hive] 未提供targetIframe')
        emit('cancel')
        return
      }

      const iframeId = props.targetIframe.getAttribute('data-iframe-id')
      if (!iframeId) {
        console.error('[Tab Hive] iframe没有data-iframe-id属性')
        emit('cancel')
        return
      }

      try {
        console.log('[Tab Hive] Electron环境 - 启动元素选择器')
        
        const code = `
          (function() {
            // 注入样式
            const styleId = 'tabhive-element-selector-styles';
            if (!document.getElementById(styleId)) {
              const style = document.createElement('style');
              style.id = styleId;
              style.textContent = \`
                .tabhive-selector-overlay {
                  position: fixed !important;
                  top: 0 !important;
                  left: 0 !important;
                  right: 0 !important;
                  bottom: 0 !important;
                  z-index: 2147483646 !important;
                  cursor: crosshair !important;
                  background: rgba(0, 0, 0, 0.05) !important;
                }
                .tabhive-element-highlight {
                  position: absolute !important;
                  border: 2px solid #ff5c00 !important;
                  background: rgba(255, 92, 0, 0.1) !important;
                  pointer-events: none !important;
                  z-index: 2147483647 !important;
                  box-shadow: 0 0 0 2px rgba(255, 92, 0, 0.3) !important;
                }
              \`;
              document.head.appendChild(style);
            }
            
            // 创建覆盖层和高亮
            window.__tabhiveSelector = {
              overlay: document.createElement('div'),
              highlight: document.createElement('div'),
              currentElement: null
            };
            
            window.__tabhiveSelector.overlay.className = 'tabhive-selector-overlay';
            window.__tabhiveSelector.highlight.className = 'tabhive-element-highlight';
            window.__tabhiveSelector.highlight.style.display = 'none';
            
            document.body.appendChild(window.__tabhiveSelector.overlay);
            document.body.appendChild(window.__tabhiveSelector.highlight);
            
            // 生成选择器
            window.__generateSelector = function(element) {
              if (element.id) return '#' + element.id;
              if (element.className && typeof element.className === 'string') {
                const classes = element.className.trim().split(/\\s+/).filter(c => c && !c.startsWith('tabhive-'));
                if (classes.length > 0) return element.tagName.toLowerCase() + '.' + classes[0];
              }
              return element.tagName.toLowerCase();
            };
            
            // 鼠标悬停
            window.__selectorMouseOver = function(event) {
              const el = event.target;
              if (el.classList.contains('tabhive-selector-overlay') || 
                  el.classList.contains('tabhive-element-highlight') ||
                  el.tagName === 'HTML' || el.tagName === 'BODY') return;
              
              window.__tabhiveSelector.currentElement = el;
              const rect = el.getBoundingClientRect();
              const h = window.__tabhiveSelector.highlight;
              h.style.top = (rect.top + window.scrollY) + 'px';
              h.style.left = (rect.left + window.scrollX) + 'px';
              h.style.width = rect.width + 'px';
              h.style.height = rect.height + 'px';
              h.style.display = 'block';
              
              return window.__generateSelector(el);
            };
            
            document.addEventListener('mouseover', function(e) {
              const sel = window.__selectorMouseOver(e);
              if (sel) {
                // 通过设置window属性传递选择器
                window.__currentSelector = sel;
              }
            }, true);
            
            // 点击选择
            window.__selectorClick = function(event) {
              event.preventDefault();
              event.stopPropagation();
              if (window.__tabhiveSelector.currentElement) {
                return window.__generateSelector(window.__tabhiveSelector.currentElement);
              }
              return null;
            };
            
            document.addEventListener('click', function(e) {
              const sel = window.__selectorClick(e);
              if (sel) {
                window.__selectedSelector = sel;
              }
            }, true);
            
            return { success: true };
          })()
        `

        await window.electron.executeInIframe(iframeId, code)
        console.log('[Tab Hive] Electron元素选择器已启动')

        // 轮询选择器状态
        startElectronPolling(iframeId)
      } catch (error) {
        console.error('[Tab Hive] Electron启动选择器失败:', error)
        alert('启动元素选择器失败: ' + error.message)
        emit('cancel')
      }
    }

    /**
     * 轮询Electron中的选择器状态
     */
    let electronPollingInterval = null
    const startElectronPolling = (iframeId) => {
      electronPollingInterval = setInterval(async () => {
        try {
          // 检查当前悬停的选择器
          const hoverResult = await window.electron.executeInIframe(iframeId, 
            'window.__currentSelector || ""')
          if (hoverResult && hoverResult.result) {
            hoveredSelector.value = hoverResult.result
          }

          // 检查是否已选择
          const selectResult = await window.electron.executeInIframe(iframeId, 
            'window.__selectedSelector || ""')
          if (selectResult && selectResult.result) {
            const selector = selectResult.result
            stopElectronPolling()
            cleanupElectronSelector(iframeId)
            emit('select', { selector })
          }
        } catch (error) {
          console.warn('[Tab Hive] 轮询选择器状态失败:', error)
        }
      }, 100)
    }

    const stopElectronPolling = () => {
      if (electronPollingInterval) {
        clearInterval(electronPollingInterval)
        electronPollingInterval = null
      }
    }

    /**
     * 清理Electron选择器
     */
    const cleanupElectronSelector = async (iframeId) => {
      try {
        await window.electron.executeInIframe(iframeId, `
          (function() {
            // 隐藏并移除高亮元素
            if (window.__tabhiveSelector) {
              if (window.__tabhiveSelector.highlight) {
                window.__tabhiveSelector.highlight.style.display = 'none';
                if (window.__tabhiveSelector.highlight.parentNode) {
                  window.__tabhiveSelector.highlight.parentNode.removeChild(window.__tabhiveSelector.highlight);
                }
              }
              if (window.__tabhiveSelector.overlay && window.__tabhiveSelector.overlay.parentNode) {
                window.__tabhiveSelector.overlay.parentNode.removeChild(window.__tabhiveSelector.overlay);
              }
              window.__tabhiveSelector = null;
            }
            // 移除样式
            const style = document.getElementById('tabhive-element-selector-styles');
            if (style && style.parentNode) {
              style.parentNode.removeChild(style);
            }
            // 重置变量
            window.__currentSelector = null;
            window.__selectedSelector = null;
            console.log('[Tab Hive Electron] 选择器已清理，高亮已隐藏');
          })()
        `)
        console.log('[Tab Hive] Electron选择器清理完成')
      } catch (error) {
        console.warn('[Tab Hive] 清理Electron选择器失败:', error)
      }
    }

    /**
     * 在浏览器环境中通过Chrome扩展启动元素选择器
     */
    const startSelectorViaChromeExtension = () => {
      if (!props.targetIframe || !props.targetIframe.contentWindow) {
        console.error('[Tab Hive] iframe不可用')
        emit('cancel')
        return
      }

      console.log('[Tab Hive] 浏览器环境 - 通过Chrome扩展启动元素选择器')

      const reqId = ++requestId

      // 向iframe发送启动选择器的消息
      props.targetIframe.contentWindow.postMessage({
        source: 'tab-hive',
        action: 'startElementSelector',
        requestId: reqId
      }, '*')

      console.log('[Tab Hive] 已发送启动元素选择器消息')
    }

    /**
     * 处理来自iframe的消息
     */
    const handleMessage = (event) => {
      if (!event.data || event.data.source !== 'tab-hive-extension') {
        return
      }

      const { action, selector } = event.data
      console.log('[Tab Hive] 收到iframe消息:', action, selector)

      if (action === 'elementHovered') {
        // 元素悬停
        hoveredSelector.value = selector || ''
        console.log('[Tab Hive] 更新悬停选择器:', selector)
      } else if (action === 'elementSelected') {
        // 元素已选择
        console.log('[Tab Hive] 接收到选中的元素:', selector)
        emit('select', { selector })
        hoveredSelector.value = ''
      } else if (action === 'elementSelectorCancelled') {
        // 用户取消
        console.log('[Tab Hive] 用户在iframe中取消了元素选择')
        cancel()
      } else if (action === 'elementSelectorStarted') {
        console.log('[Tab Hive] 元素选择器已在iframe中启动')
      }
    }

    /**
     * 处理ESC键
     */
    const handleKeyDown = (event) => {
      if (event.key === 'Escape' && props.isActive) {
        cancel()
      }
    }

    /**
     * 取消选择（用户主动取消，如按ESC键）
     */
    const cancel = () => {
      console.log('[Tab Hive] 用户取消元素选择器')
      // 只emit事件，清理工作由watch处理
      emit('cancel')
    }

    /**
     * 初始化
     */
    const initialize = async () => {
      if (isElectron.value) {
        await startSelectorInElectron()
      } else {
        // 检测Chrome扩展
        hasExtension.value = await detectExtension()
        
        if (!hasExtension.value) {
          alert('未检测到Tab Hive Chrome扩展。\n\n请安装Chrome扩展以使用元素选择器功能。\n\n扩展位置: chrome-extension文件夹')
          emit('cancel')
          return
        }

        startSelectorViaChromeExtension()
      }
    }

    // 监听isActive变化
    watch(() => props.isActive, (newVal, oldVal) => {
      console.log('[Tab Hive] isActive变化:', oldVal, '->', newVal)
      if (newVal && !oldVal) {
        // 从false变为true，初始化
        initialize()
      } else if (!newVal && oldVal) {
        // 从true变为false，清理
        if (isElectron.value) {
          stopElectronPolling()
          if (props.targetIframe) {
            const iframeId = props.targetIframe.getAttribute('data-iframe-id')
            if (iframeId) {
              cleanupElectronSelector(iframeId)
            }
          }
        } else if (hasExtension.value && props.targetIframe && props.targetIframe.contentWindow) {
          // 发送停止选择器消息
          props.targetIframe.contentWindow.postMessage({
            source: 'tab-hive',
            action: 'stopElementSelector',
            requestId: ++requestId
          }, '*')
        }
        hoveredSelector.value = ''
      }
    })

    // 生命周期
    onMounted(() => {
      messageListener = handleMessage
      keydownListener = handleKeyDown
      
      window.addEventListener('message', messageListener)
      document.addEventListener('keydown', keydownListener)
    })

    onUnmounted(() => {
      if (messageListener) {
        window.removeEventListener('message', messageListener)
      }
      if (keydownListener) {
        document.removeEventListener('keydown', keydownListener)
      }
      stopElectronPolling()
    })

    return {
      hoveredSelector,
      cancel
    }
  }
}
</script>

<style scoped>
.selector-toolbar {
  position: fixed;
  top: 70px;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(255, 92, 0, 0.95);
  color: white;
  padding: 12px 20px;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
  backdrop-filter: blur(10px);
  display: flex;
  align-items: center;
  gap: 20px;
  z-index: 10002;
  font-size: 14px;
  animation: slideDown 0.3s ease-out;
  max-width: 90%;
}

@keyframes slideDown {
  from {
    transform: translateX(-50%) translateY(-100%);
    opacity: 0;
  }
  to {
    transform: translateX(-50%) translateY(0);
    opacity: 1;
  }
}

.selector-info {
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 13px;
  max-width: 600px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.btn-cancel {
  display: flex;
  align-items: center;
  gap: 6px;
  background: rgba(255, 255, 255, 0.2);
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 13px;
  font-weight: 500;
  transition: all 0.2s;
  white-space: nowrap;
}

.btn-cancel:hover {
  background: rgba(255, 255, 255, 0.3);
}

.btn-cancel svg {
  display: block;
}
</style>
