<template>
  <div class="desktop-capture-view">
    <video
      ref="videoRef"
      autoplay
      playsinline
      class="capture-video"
      :class="{ 'fit-screen': fitScreen }"
    ></video>
    
    <!-- 加载状态 -->
    <div v-if="loading" class="loading-overlay">
      <div class="spinner"></div>
      <p>{{ $t('desktopCapture.connecting') }}</p>
    </div>
    
    <!-- 错误状态 -->
    <div v-if="error" class="error-overlay">
      <p>❌ {{ error }}</p>
      <button @click="retry" class="btn-retry">{{ $t('common.retry') }}</button>
    </div>
    
    <!-- 只读提示 -->
    <div v-if="!loading && !error" class="readonly-hint">
      {{ $t('desktopCapture.readonlyMode') }}
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useI18n } from 'vue-i18n'

export default {
  name: 'DesktopCaptureView',
  props: {
    sourceId: {
      type: String,
      required: true
    },
    options: {
      type: Object,
      default: () => ({
        fitScreen: false
      })
    }
  },
  emits: ['error', 'ready'],
  setup(props, { emit }) {
    const { t } = useI18n()
    const videoRef = ref(null)
    const loading = ref(true)
    const error = ref('')
    const stream = ref(null)
    
    const fitScreen = computed(() => props.options?.fitScreen || false) // 默认false
    
    // 开始捕获
    const startCapture = async () => {
      if (!props.sourceId) {
        error.value = t('desktopCapture.noSourceSpecified')
        loading.value = false
        return
      }
      
      if (!window.electron?.desktopCapture) {
        error.value = t('desktopCapture.electronOnly')
        loading.value = false
        emit('error', error.value)
        return
      }
      
      try {
        loading.value = true
        error.value = ''
        
        // 在 Electron 中，使用 getUserMedia 获取桌面捕获流
        // constraints 需要包含 chromeMediaSource 和 chromeMediaSourceId
        const constraints = {
          audio: false,
          video: {
            mandatory: {
              chromeMediaSource: 'desktop',
              chromeMediaSourceId: props.sourceId
            }
          }
        }
        
        // 获取媒体流
        const mediaStream = await navigator.mediaDevices.getUserMedia(constraints)
        stream.value = mediaStream
        
        // 将流分配给 video 元素
        if (videoRef.value) {
          videoRef.value.srcObject = mediaStream
          await videoRef.value.play()
          loading.value = false
          emit('ready')
        }
      } catch (err) {
        console.error('[Desktop Capture] 捕获失败:', err)
        error.value = err.message || '捕获桌面源失败'
        loading.value = false
        emit('error', error.value)
        
        // 清理
        stopCapture()
      }
    }
    
    // 停止捕获
    const stopCapture = () => {
      // 停止媒体流
      if (stream.value) {
        stream.value.getTracks().forEach(track => track.stop())
        stream.value = null
      }
      
      // 清除 video 元素
      if (videoRef.value) {
        videoRef.value.srcObject = null
      }
    }
    
    // 重试
    const retry = () => {
      stopCapture()
      startCapture()
    }
    
    // 监听 sourceId 变化
    watch(() => props.sourceId, (newId, oldId) => {
      if (newId !== oldId) {
        stopCapture()
        startCapture()
      }
    })
    
    onMounted(() => {
      startCapture()
    })
    
    onUnmounted(() => {
      stopCapture()
    })
    
    return {
      videoRef,
      loading,
      error,
      fitScreen,
      retry
    }
  }
}
</script>

<style scoped>
.desktop-capture-view {
  width: 100%;
  height: 100%;
  position: relative;
  background: #000;
  overflow: hidden;
}

.capture-video {
  width: 100%;
  height: 100%;
  object-fit: contain;
  display: block;
}

.capture-video.fit-screen {
  object-fit: cover;
}

/* 禁用所有交互 */
.capture-video {
  pointer-events: none;
  user-select: none;
}

.loading-overlay,
.error-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.7);
  color: white;
  z-index: 10;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid rgba(255, 255, 255, 0.3);
  border-top: 4px solid white;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 16px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.btn-retry {
  margin-top: 16px;
  padding: 8px 20px;
  background: #FF5C00;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  transition: background 0.3s;
}

.btn-retry:hover {
  background: #e64e00;
}

.readonly-hint {
  position: absolute;
  bottom: 8px;
  left: 8px;
  background: rgba(0, 0, 0, 0.7);
  color: white;
  padding: 6px 12px;
  border-radius: 6px;
  font-size: 12px;
  pointer-events: none;
  z-index: 5;
}
</style>

