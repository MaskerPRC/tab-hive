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

        <div v-if="updateInfo?.body" class="update-details">
          <h4>更新内容：</h4>
          <div class="release-notes" v-html="formatReleaseNotes(updateInfo.body)"></div>
        </div>

        <div class="update-actions">
          <button class="btn-primary" @click="handleUpdate">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
              <polyline points="7 10 12 15 17 10"></polyline>
              <line x1="12" y1="15" x2="12" y2="3"></line>
            </svg>
            立即更新
          </button>
          <button class="btn-secondary" @click="handleIgnore">
            稍后提醒
          </button>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script>
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
    }
  },
  emits: ['close', 'ignore', 'update'],
  methods: {
    handleClose() {
      this.$emit('close')
    },
    handleIgnore() {
      this.$emit('ignore')
    },
    handleUpdate() {
      this.$emit('update')
    },
    formatReleaseNotes(body) {
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

