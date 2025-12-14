<template>
  <Transition name="modal-fade">
    <div v-if="visible" class="external-url-modal-overlay" @click.self="handleClose">
      <div class="external-url-modal-container" @click.stop>
        <div class="external-url-modal-header">
          <div class="modal-title">外部链接</div>
          <button class="modal-close-btn" @click="handleClose" title="关闭">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>
        <div class="external-url-modal-body">
          <webview
            v-if="url"
            :src="webviewUrl"
            :preload="webviewPreloadPath"
            class="external-url-webview"
            :partition="partitionName"
            webpreferences="javascript=yes,webSecurity=no,allowRunningInsecureContent=yes,contextIsolation=no,sandbox=no"
            allowpopups
            @did-finish-load="handleWebviewLoad"
            @did-fail-load="handleWebviewFail"
          ></webview>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script>
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue'
import { useSessionManager } from '../composables/useSessionManager.js'

export default {
  name: 'ExternalUrlModal',
  props: {
    visible: {
      type: Boolean,
      default: false
    },
    url: {
      type: String,
      default: ''
    }
  },
  emits: ['close'],
  setup(props, { emit }) {
    const { getPartitionName } = useSessionManager()
    
    // 检测是否在 Electron 环境
    const isElectron = computed(() => {
      return window.electron && window.electron.isElectron
    })

    // Webview preload 脚本路径
    const webviewPreloadPath = computed(() => {
      return window.electron?.webviewPreloadPath || ''
    })

    // 使用独立的session实例，避免与主页面冲突
    const sessionInstance = ref('external-modal-' + Date.now())
    const partitionName = computed(() => {
      return getPartitionName(sessionInstance.value)
    })

    // Webview URL（添加webview ID参数）
    const webviewUrl = computed(() => {
      if (!props.url) return ''
      const separator = props.url.includes('?') ? '&' : '?'
      return `${props.url}${separator}__webview_id__=external-modal-${sessionInstance.value}`
    })

    // 处理关闭
    const handleClose = () => {
      emit('close')
    }

    // Webview加载完成
    const handleWebviewLoad = (event) => {
      console.log('[ExternalUrlModal] Webview加载完成:', event.url)
      // 注意：新窗口打开已由主进程全局拦截
    }

    // Webview加载失败
    const handleWebviewFail = (event) => {
      console.error('[ExternalUrlModal] Webview加载失败:', event)
    }

    // 监听URL变化，重置session实例
    watch(() => props.url, (newUrl) => {
      if (newUrl) {
        // 每次打开新URL时，使用新的session实例
        sessionInstance.value = 'external-modal-' + Date.now()
      }
    })

    // 注意：新窗口打开已由主进程全局拦截，不需要在渲染进程处理

    // 监听ESC键关闭
    const handleKeyDown = (event) => {
      if (event.key === 'Escape' && props.visible) {
        handleClose()
      }
    }

    onMounted(() => {
      window.addEventListener('keydown', handleKeyDown)
    })

    onBeforeUnmount(() => {
      window.removeEventListener('keydown', handleKeyDown)
    })

    return {
      isElectron,
      webviewPreloadPath,
      partitionName,
      webviewUrl,
      handleClose,
      handleWebviewLoad,
      handleWebviewFail
    }
  }
}
</script>

<style scoped>
.external-url-modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10000;
  animation: modal-fade-in 0.2s ease-out;
}

.external-url-modal-container {
  width: 90%;
  height: 90%;
  max-width: 1400px;
  max-height: 900px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  animation: modal-scale-in 0.2s ease-out;
}

.external-url-modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid #e0e0e0;
  background: #f8f9fa;
  flex-shrink: 0;
}

.modal-title {
  font-size: 16px;
  font-weight: 600;
  color: #333;
}

.modal-close-btn {
  width: 32px;
  height: 32px;
  border: none;
  background: transparent;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: #666;
  transition: all 0.2s;
}

.modal-close-btn:hover {
  background: #e0e0e0;
  color: #333;
}

.external-url-modal-body {
  flex: 1;
  overflow: hidden;
  position: relative;
}

.external-url-webview {
  width: 100%;
  height: 100%;
  border: none;
}

@keyframes modal-fade-in {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes modal-scale-in {
  from {
    opacity: 0;
    transform: scale(0.95);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

.modal-fade-enter-active,
.modal-fade-leave-active {
  transition: opacity 0.2s ease;
}

.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;
}
</style>

