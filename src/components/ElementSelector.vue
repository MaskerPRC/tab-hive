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
        
        console.log('[Tab Hive] 发送ping消息检测扩展')
        window.postMessage({
          source: 'tab-hive',
          action: 'ping'
        }, '*')
      })
    }

    /**
     * 启动元素选择器（Electron和浏览器使用相同方式）
     */
    const startSelector = () => {
      if (!props.targetIframe || !props.targetIframe.contentWindow) {
        console.error('[Tab Hive] iframe不可用')
        emit('cancel')
        return
      }

      const env = isElectron.value ? 'Electron' : '浏览器'
      console.log(`[Tab Hive] ${env}环境 - 通过postMessage启动元素选择器`)

      const reqId = ++requestId

      // 向iframe发送启动选择器的消息（Electron和Chrome扩展相同）
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
      console.log('[Tab Hive] 🔔 message事件触发, source:', event.data?.source, 'data:', event.data)
      
      if (!event.data) return
      
      // 调试：记录所有消息
      if (event.data.source === 'tab-hive-extension' || event.data.source === 'tab-hive-electron') {
        console.log('[Tab Hive] 📨 收到消息:', event.data)
      }

      // Chrome扩展消息
      if (event.data.source === 'tab-hive-extension') {
        const { action, selector } = event.data
        console.log('[Tab Hive] 收到Chrome扩展消息:', action, selector)

        if (action === 'elementHovered') {
          hoveredSelector.value = selector || ''
        } else if (action === 'elementSelected') {
          console.log('[Tab Hive] 接收到选中的元素:', selector)
          emit('select', { selector })
          hoveredSelector.value = ''
        } else if (action === 'elementSelectorCancelled') {
          console.log('[Tab Hive] 用户在iframe中取消了元素选择')
          cancel()
        }
      }

      // Electron消息
      if (event.data.source === 'tab-hive-electron') {
        const { action, selector } = event.data
        console.log('[Tab Hive] 收到Electron消息:', action, '选择器:', selector)

        if (action === 'elementHovered') {
          hoveredSelector.value = selector || ''
          console.log('[Tab Hive] 更新悬停选择器:', selector)
        } else if (action === 'elementSelected') {
          console.log('[Tab Hive] ✅ 接收到选中的元素:', selector)
          emit('select', { selector })
          hoveredSelector.value = ''
        } else if (action === 'elementSelectorCancelled') {
          console.log('[Tab Hive] 用户在iframe中按ESC取消了元素选择')
          cancel()
        } else if (action === 'elementSelectorStarted') {
          console.log('[Tab Hive] Electron元素选择器已在iframe中启动')
        }
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
      emit('cancel')
    }

    /**
     * 初始化
     */
    const initialize = async () => {
      if (isElectron.value) {
        // Electron环境直接启动
        startSelector()
      } else {
        // 浏览器环境先检测扩展
        hasExtension.value = await detectExtension()
        
        if (!hasExtension.value) {
          alert('未检测到Tab Hive Chrome扩展。\n\n请安装Chrome扩展以使用元素选择器功能。\n\n扩展位置: chrome-extension文件夹')
          emit('cancel')
          return
        }

        startSelector()
      }
    }

    /**
     * 清理
     */
    const cleanup = () => {
      if (props.targetIframe && props.targetIframe.contentWindow) {
        // 发送停止选择器消息
        console.log('[Tab Hive] 发送停止选择器消息到iframe')
        props.targetIframe.contentWindow.postMessage({
          source: 'tab-hive',
          action: 'stopElementSelector',
          requestId: ++requestId
        }, '*')
      }
      hoveredSelector.value = ''
    }

    // 监听isActive变化
    watch(() => props.isActive, (newVal, oldVal) => {
      console.log('[Tab Hive] isActive变化:', oldVal, '->', newVal)
      if (newVal && !oldVal) {
        // 从false变为true，初始化
        initialize()
      } else if (!newVal && oldVal) {
        // 从true变为false，清理
        cleanup()
      }
    })

    // 生命周期
    onMounted(() => {
      console.log('[Tab Hive] ElementSelector组件已挂载，添加事件监听器')
      messageListener = handleMessage
      keydownListener = handleKeyDown
      
      window.addEventListener('message', messageListener)
      document.addEventListener('keydown', keydownListener)
      
      console.log('[Tab Hive] 消息监听器已添加到window')
    })

    onUnmounted(() => {
      if (messageListener) {
        window.removeEventListener('message', messageListener)
      }
      if (keydownListener) {
        document.removeEventListener('keydown', keydownListener)
      }
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
