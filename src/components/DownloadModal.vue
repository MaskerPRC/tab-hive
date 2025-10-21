<template>
  <div v-if="visible" class="electron-warning-overlay" @click.self="handleClose">
    <div class="electron-warning-modal">
      <div class="warning-icon">⚠️</div>
      <h2>需要安装插件才能正常使用</h2>
      <p class="warning-message">
        本应用需要在特定环境中运行才能加载 iframe 网页。<br/>
        请选择下列方式之一安装后使用：
      </p>
      <div class="warning-actions">
        <div class="download-options">
          <div class="option-section">
            <h3>🔌 CORS 解除插件（推荐）</h3>
            <p class="option-desc">解除网站 iframe 限制，适用于 Chrome、Edge 等浏览器</p>
            <a
              href="/0.1.2_0.zip"
              download="Allow X-Frame-Options.zip"
              class="download-button primary"
            >
              📥 下载 CORS 解除插件
            </a>
            <p class="install-hint">
              下载后请解压，然后在浏览器中加载解压后的文件夹<br/>
              <a href="https://zhuanlan.zhihu.com/p/16585597394" target="_blank" class="tutorial-link">
                📖 查看详细安装教程
              </a>
            </p>
          </div>
          <div class="divider">+</div>
          <div class="option-section">
            <h3>🎯 选择器插件（可选）</h3>
            <p class="option-desc">支持使用 CSS 选择器定位并全屏显示网页特定元素</p>
            <a
              href="/tab-hive-selector-extension.zip"
              download="Tab-Hive-Selector-Extension.zip"
              class="download-button primary"
            >
              📥 下载选择器插件
            </a>
            <p class="install-hint">
              配合 CORS 插件使用，可聚焦于视频播放器、文章内容等特定区域<br/>
              在编辑网站时填写"目标选择器"字段（如 <code>#player</code>）
            </p>
          </div>
          <div class="divider">或</div>
          <div class="option-section">
            <h3>💻 桌面应用程序</h3>
            <p class="option-desc">独立运行，功能完整，无需安装插件</p>
            <a
              href="https://github.com/MaskerPRC/tab-hive/releases"
              target="_blank"
              class="download-button secondary"
            >
              📥 下载桌面应用
            </a>
          </div>
        </div>
        <button @click="handleClose" class="dismiss-button">
          我知道了（暂时继续浏览）
        </button>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'DownloadModal',
  props: {
    visible: {
      type: Boolean,
      default: false
    }
  },
  emits: ['close'],
  setup(props, { emit }) {
    const handleClose = () => {
      emit('close')
    }

    return {
      handleClose
    }
  }
}
</script>

<style scoped>
/* Electron 环境警告遮罩层 */
.electron-warning-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.85);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10000;
  backdrop-filter: blur(5px);
}

.electron-warning-modal {
  background: white;
  border-radius: 16px;
  padding: 48px;
  max-width: 680px;
  width: 90%;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  text-align: center;
  animation: fadeInScale 0.3s ease-out;
  max-height: 90vh;
  overflow-y: auto;
}

@keyframes fadeInScale {
  from {
    opacity: 0;
    transform: scale(0.9);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

.warning-icon {
  font-size: 64px;
  margin-bottom: 24px;
  animation: pulse 2s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.1);
  }
}

.electron-warning-modal h2 {
  margin: 0 0 16px 0;
  font-size: 28px;
  color: #333;
  font-weight: 600;
}

.warning-message {
  color: #666;
  font-size: 16px;
  line-height: 1.6;
  margin: 0 0 32px 0;
}

.warning-actions {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.download-options {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.option-section {
  background: #f8f9fa;
  padding: 24px;
  border-radius: 12px;
  border: 2px solid #e9ecef;
}

.option-section h3 {
  margin: 0 0 8px 0;
  font-size: 20px;
  color: #333;
}

.option-desc {
  color: #666;
  font-size: 14px;
  margin: 0 0 16px 0;
}

.install-hint {
  color: #888;
  font-size: 12px;
  margin: 12px 0 0 0;
  line-height: 1.8;
}

.install-hint code {
  background: #f5f5f5;
  padding: 2px 6px;
  border-radius: 3px;
  font-family: 'Courier New', monospace;
  color: #FF5C00;
  font-size: 11px;
}

.tutorial-link {
  color: #FF5C00;
  text-decoration: none;
  font-weight: 500;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  margin-top: 6px;
  transition: all 0.2s ease;
}

.tutorial-link:hover {
  color: #FF7A33;
  text-decoration: underline;
}

.divider {
  color: #999;
  font-size: 14px;
  font-weight: 500;
  padding: 8px 0;
}

.download-button {
  display: inline-block;
  padding: 14px 32px;
  color: white;
  text-decoration: none;
  border-radius: 8px;
  font-weight: 600;
  font-size: 16px;
  transition: all 0.3s ease;
}

.download-button.primary {
  background: #FF5C00;
  box-shadow: 0 4px 15px rgba(255, 92, 0, 0.3);
}

.download-button.primary:hover {
  background: #FF7A33;
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(255, 92, 0, 0.4);
}

.download-button.secondary {
  background: #FF5C00;
  box-shadow: 0 4px 15px rgba(255, 92, 0, 0.3);
}

.download-button.secondary:hover {
  background: #FF7A33;
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(255, 92, 0, 0.4);
}

.dismiss-button {
  padding: 12px 32px;
  background: transparent;
  color: #999;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.dismiss-button:hover {
  background: #f5f5f5;
  color: #666;
  border-color: #ccc;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .electron-warning-modal {
    padding: 32px 24px;
    max-width: 95%;
  }

  .electron-warning-modal h2 {
    font-size: 22px;
  }

  .warning-message {
    font-size: 14px;
  }

  .option-section {
    padding: 20px;
  }

  .option-section h3 {
    font-size: 18px;
  }

  .download-button {
    padding: 12px 24px;
    font-size: 14px;
  }
}
</style>

