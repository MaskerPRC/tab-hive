<template>
  <Transition name="update-notification">
    <div v-if="visible" class="update-notification">
      <div class="update-content">
        <div class="update-header">
          <div class="update-icon">🎉</div>
          <div class="update-title">
            <h3>发现新版本</h3>
            <p class="version-info">
              当前版本: <span class="current">{{ currentVersion }}</span>
              →
              最新版本: <span class="latest">{{ latestVersion }}</span>
            </p>
          </div>
          <button class="close-btn" @click="handleClose" title="关闭">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        <div v-if="updateInfo?.body && !isDownloading && !downloadCompleted" class="update-details">
          <h4>更新内容：</h4>
          <div class="release-notes" v-html="formatReleaseNotes(updateInfo.body)"></div>
        </div>

        <!-- 下载进度 -->
        <div v-if="isDownloading" class="download-progress">
          <h4>正在下载更新...</h4>
          <div class="progress-bar-container">
            <div class="progress-bar" :style="{ width: Math.min(downloadProgress, 100) + '%' }"></div>
          </div>
          <div class="progress-text" v-if="totalBytes > 0">
            {{ formatBytes(downloadedBytes) }} / {{ formatBytes(totalBytes) }}
            ({{ Math.min(downloadProgress, 100).toFixed(1) }}%)
          </div>
          <div class="progress-text" v-else>
            {{ formatBytes(downloadedBytes) }} 已下载
          </div>
        </div>

        <!-- 下载完成 -->
        <div v-if="downloadCompleted" class="download-completed">
          <div class="completed-icon">✓</div>
          <h4>下载完成！</h4>
          <p>更新包已准备就绪，点击下方按钮安装</p>
        </div>

        <!-- 下载失败 -->
        <div v-if="downloadError" class="download-error">
          <div class="error-icon">✗</div>
          <h4>下载失败</h4>
          <p>{{ downloadError }}</p>
        </div>

        <div class="update-actions">
          <button 
            v-if="!isDownloading && !downloadCompleted && !downloadError"
            class="btn-primary" 
            @click="handleUpdate"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
              <polyline points="7 10 12 15 17 10"></polyline>
              <line x1="12" y1="15" x2="12" y2="3"></line>
            </svg>
            立即下载更新
          </button>

          <button 
            v-if="isDownloading"
            class="btn-secondary" 
            @click="handleCancelDownload"
          >
            取消下载
          </button>

          <button 
            v-if="downloadCompleted"
            class="btn-primary btn-install" 
            @click="handleInstall"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
              <polyline points="14 2 14 8 20 8"></polyline>
              <line x1="12" y1="18" x2="12" y2="12"></line>
              <line x1="9" y1="15" x2="15" y2="15"></line>
            </svg>
            安装并重启
          </button>

          <button 
            v-if="downloadError"
            class="btn-primary" 
            @click="handleRetryDownload"
          >
            重试下载
          </button>

          <button 
            v-if="!isDownloading"
            class="btn-secondary" 
            @click="handleIgnore"
          >
            {{ downloadCompleted || downloadError ? '关闭' : '稍后提醒' }}
          </button>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script>
import { ref, watch, onMounted, onUnmounted } from 'vue'

export default {
  name: 'UpdateNotification',
  props: {
    visible: {
      type: Boolean,
      default: false
    },
    currentVersion: {
      type: String,
      required: true
    },
    latestVersion: {
      type: String,
      required: true
    },
    updateInfo: {
      type: Object,
      default: null
    },
    downloadStatus: {
      type: Object,
      default: null
    }
  },
  emits: ['close', 'ignore', 'update', 'install', 'cancel-download', 'retry-download'],
  setup(props, { emit }) {
    const isDownloading = ref(false)
    const downloadProgress = ref(0)
    const downloadedBytes = ref(0)
    const totalBytes = ref(0)
    const downloadCompleted = ref(false)
    const downloadError = ref(null)
    const installerPath = ref(null)

    // 检查是否在 Electron 环境中
    const isElectron = typeof window !== 'undefined' && window.electron !== undefined

    const handleClose = () => {
      emit('close')
    }

    const handleIgnore = () => {
      emit('ignore')
    }

    const handleUpdate = () => {
      emit('update')
    }

    const handleInstall = () => {
      emit('install', installerPath.value)
    }

    const handleCancelDownload = () => {
      emit('cancel-download')
    }

    const handleRetryDownload = () => {
      downloadError.value = null
      emit('retry-download')
    }

    const formatBytes = (bytes) => {
      if (bytes === 0) return '0 B'
      const k = 1024
      const sizes = ['B', 'KB', 'MB', 'GB']
      const i = Math.floor(Math.log(bytes) / Math.log(k))
      return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
    }

    const formatReleaseNotes = (body) => {
      if (!body) return ''

      // 简单的 Markdown 转换
      return body
        .replace(/^### (.+)$/gm, '<h5>$1</h5>')
        .replace(/^## (.+)$/gm, '<h4>$1</h4>')
        .replace(/^# (.+)$/gm, '<h3>$1</h3>')
        .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.+?)\*/g, '<em>$1</em>')
        .replace(/^- (.+)$/gm, '<li>$1</li>')
        .replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>')
        .replace(/\n/g, '<br>')
        .substring(0, 500) + (body.length > 500 ? '...' : '')
    }

    // 监听下载状态
    watch(() => props.downloadStatus, (status) => {
      if (status) {
        isDownloading.value = status.isDownloading
        downloadProgress.value = status.progress
        downloadedBytes.value = status.downloaded
        totalBytes.value = status.total
        downloadCompleted.value = status.completed
        downloadError.value = status.error
        if (status.savePath) {
          installerPath.value = status.savePath
        }
      }
    }, { deep: true, immediate: true })

    // 监听 Electron 的下载事件
    const setupElectronListeners = () => {
      if (!isElectron) return

      // 下载进度
      window.electron.on('update-download-progress', (data) => {
        isDownloading.value = true
        downloadedBytes.value = data.downloaded
        totalBytes.value = data.total
        downloadProgress.value = data.progress
      })

      // 下载完成
      window.electron.on('update-download-complete', (data) => {
        isDownloading.value = false
        downloadCompleted.value = true
        installerPath.value = data.savePath
      })

      // 下载失败
      window.electron.on('update-download-error', (data) => {
        isDownloading.value = false
        downloadError.value = data.error
      })
    }

    const cleanupElectronListeners = () => {
      if (!isElectron) return
      // 清理事件监听器
      window.electron.off('update-download-progress')
      window.electron.off('update-download-complete')
      window.electron.off('update-download-error')
    }

    onMounted(() => {
      setupElectronListeners()
    })

    onUnmounted(() => {
      cleanupElectronListeners()
    })

    return {
      isDownloading,
      downloadProgress,
      downloadedBytes,
      totalBytes,
      downloadCompleted,
      downloadError,
      installerPath,
      handleClose,
      handleIgnore,
      handleUpdate,
      handleInstall,
      handleCancelDownload,
      handleRetryDownload,
      formatBytes,
      formatReleaseNotes
    }
  }
}
</script>

<style scoped>
.update-notification {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: white;
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
  max-width: 500px;
  width: 90%;
  z-index: 10000;
  overflow: hidden;
}

.update-content {
  padding: 24px;
  background: white;
}

.update-header {
  display: flex;
  align-items: flex-start;
  gap: 16px;
  margin-bottom: 20px;
}

.update-icon {
  font-size: 32px;
  line-height: 1;
  flex-shrink: 0;
}

.update-title {
  flex: 1;
  min-width: 0;
}

.update-title h3 {
  margin: 0 0 8px 0;
  font-size: 20px;
  font-weight: 600;
  color: #333;
}

.version-info {
  margin: 0;
  font-size: 14px;
  color: #666;
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
}

.version-info .current {
  color: #999;
  font-weight: 500;
}

.version-info .latest {
  color: #ff5c00;
  font-weight: 600;
}

.close-btn {
  background: none;
  border: none;
  color: #999;
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
  transition: all 0.2s;
  flex-shrink: 0;
}

.close-btn:hover {
  background: #f5f5f5;
  color: #333;
}

.update-details {
  background: #f8f9fa;
  padding: 16px;
  border-radius: 8px;
  margin-bottom: 20px;
  max-height: 200px;
  overflow-y: auto;
}

.update-details h4 {
  margin: 0 0 12px 0;
  font-size: 14px;
  font-weight: 600;
  color: #333;
}

.release-notes {
  font-size: 13px;
  line-height: 1.6;
  color: #666;
}

.release-notes :deep(h3),
.release-notes :deep(h4),
.release-notes :deep(h5) {
  margin: 12px 0 8px 0;
  font-size: 13px;
  font-weight: 600;
  color: #333;
}

.release-notes :deep(ul) {
  margin: 8px 0;
  padding-left: 20px;
}

.release-notes :deep(li) {
  margin: 4px 0;
}

.release-notes :deep(strong) {
  font-weight: 600;
  color: #333;
}

.update-actions {
  display: flex;
  gap: 12px;
}

.btn-primary,
.btn-secondary {
  flex: 1;
  padding: 12px 20px;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.btn-primary {
  background: #ff5c00;
  color: white;
}

.btn-primary:hover {
  background: #ff4500;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(255, 92, 0, 0.3);
}

.btn-secondary {
  background: #f0f0f0;
  color: #666;
}

.btn-secondary:hover {
  background: #e0e0e0;
  color: #333;
}

/* 动画 */
.update-notification-enter-active,
.update-notification-leave-active {
  transition: all 0.3s ease;
}

.update-notification-enter-from,
.update-notification-leave-to {
  opacity: 0;
  transform: translate(-50%, -50%) scale(0.9);
}

/* 滚动条样式 */
.update-details::-webkit-scrollbar {
  width: 6px;
}

.update-details::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 3px;
}

.update-details::-webkit-scrollbar-thumb {
  background: #ccc;
  border-radius: 3px;
}

.update-details::-webkit-scrollbar-thumb:hover {
  background: #999;
}

/* 下载进度 */
.download-progress {
  padding: 20px;
  background: #f8f9fa;
  border-radius: 8px;
  margin-bottom: 20px;
}

.download-progress h4 {
  margin: 0 0 16px 0;
  font-size: 14px;
  font-weight: 600;
  color: #333;
  text-align: center;
}

.progress-bar-container {
  width: 100%;
  height: 20px;
  background: #e0e0e0;
  border-radius: 10px;
  overflow: hidden;
  margin-bottom: 12px;
  position: relative;
}

.progress-bar {
  height: 100%;
  background: linear-gradient(90deg, #ff5c00 0%, #ff7a33 100%);
  border-radius: 10px;
  transition: width 0.3s ease;
  position: relative;
  overflow: hidden;
}

.progress-bar::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  bottom: 0;
  right: 0;
  background: linear-gradient(
    90deg,
    transparent,
    rgba(255, 255, 255, 0.3),
    transparent
  );
  animation: shimmer 2s infinite;
}

@keyframes shimmer {
  0% {
    transform: translateX(-100%);
  }
  100% {
    transform: translateX(100%);
  }
}

.progress-text {
  text-align: center;
  font-size: 13px;
  color: #666;
  font-weight: 500;
}

/* 下载完成 */
.download-completed {
  padding: 30px 20px;
  text-align: center;
  background: #f0fdf4;
  border-radius: 8px;
  margin-bottom: 20px;
}

.completed-icon {
  width: 60px;
  height: 60px;
  margin: 0 auto 16px;
  background: #22c55e;
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 32px;
  font-weight: bold;
  animation: scaleIn 0.5s ease;
}

@keyframes scaleIn {
  0% {
    transform: scale(0);
    opacity: 0;
  }
  50% {
    transform: scale(1.1);
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
}

.download-completed h4 {
  margin: 0 0 8px 0;
  font-size: 18px;
  font-weight: 600;
  color: #166534;
}

.download-completed p {
  margin: 0;
  font-size: 14px;
  color: #16a34a;
}

/* 下载失败 */
.download-error {
  padding: 30px 20px;
  text-align: center;
  background: #fef2f2;
  border-radius: 8px;
  margin-bottom: 20px;
}

.error-icon {
  width: 60px;
  height: 60px;
  margin: 0 auto 16px;
  background: #ef4444;
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 32px;
  font-weight: bold;
  animation: shake 0.5s ease;
}

@keyframes shake {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-10px); }
  75% { transform: translateX(10px); }
}

.download-error h4 {
  margin: 0 0 8px 0;
  font-size: 18px;
  font-weight: 600;
  color: #991b1b;
}

.download-error p {
  margin: 0;
  font-size: 13px;
  color: #dc2626;
}

/* 安装按钮特殊样式 */
.btn-install {
  background: #22c55e;
  animation: pulse-green 2s ease-in-out infinite;
}

.btn-install:hover {
  background: #16a34a;
  box-shadow: 0 4px 12px rgba(34, 197, 94, 0.4);
}

@keyframes pulse-green {
  0%, 100% {
    box-shadow: 0 0 0 0 rgba(34, 197, 94, 0.7);
  }
  50% {
    box-shadow: 0 0 0 10px rgba(34, 197, 94, 0);
  }
}

/* 背景遮罩 */
.update-notification::before {
  content: '';
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: -1;
}
</style>

