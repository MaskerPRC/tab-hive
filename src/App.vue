<template>
  <div class="app-container" @mousemove="handleMouseMove">
    <!-- 下载插件/客户端提醒弹窗 -->
    <div v-if="showDownloadModal" class="electron-warning-overlay" @click.self="closeDownloadModal">
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
              <h3>🔌 Chrome 浏览器插件（推荐）</h3>
              <p class="option-desc">适用于 Chrome、Edge 等浏览器</p>
              <a
                href="/0.1.2_0.zip"
                download="Allow X-Frame-Options.zip"
                class="download-button primary"
              >
                📥 下载 Chrome 插件
              </a>
              <p class="install-hint">
                下载后请解压，然后在浏览器中加载解压后的文件夹<br/>
                <a href="https://zhuanlan.zhihu.com/p/16585597394" target="_blank" class="tutorial-link">
                  📖 查看详细安装教程
                </a>
              </p>
            </div>
            <div class="divider">或</div>
            <div class="option-section">
              <h3>💻 桌面应用程序</h3>
              <p class="option-desc">独立运行，功能完整</p>
              <a
                href="https://github.com/MaskerPRC/tab-hive/releases"
                target="_blank"
                class="download-button secondary"
              >
                📥 下载桌面应用
              </a>
            </div>
          </div>
          <button @click="closeDownloadModal" class="dismiss-button">
            我知道了（暂时继续浏览）
          </button>
        </div>
      </div>
    </div>

    <!-- 顶部检测区域 -->
    <div
      v-if="fullscreenIndex === null"
      class="top-trigger-area"
      @mouseenter="showPanel = true"
    ></div>

    <ConfigPanel
      v-if="fullscreenIndex === null"
      :class="{ 'panel-visible': showPanel }"
      :layouts="layouts"
      :currentLayoutId="currentLayoutId"
      @switch-layout="switchLayout"
      @create-layout="(name, options) => createLayout(name, options)"
      @delete-layout="deleteLayout"
      @rename-layout="renameLayout"
      @show-download-modal="handleShowDownloadModal"
      @mouseenter="showPanel = true"
      @mouseleave="handlePanelLeave"
    />
    <GridView
      :websites="websites"
      :rows="2"
      :cols="2"
      :fullscreenIndex="fullscreenIndex"
      @fullscreen="handleFullscreen"
      @exitFullscreen="exitFullscreen"
      @add-website="handleAddWebsite"
      @remove-website="handleRemoveWebsite"
      @update-website="handleUpdateWebsite"
    />

    <!-- 全局对话框 -->
    <Dialog
      v-model:visible="dialogVisible"
      :type="dialogType"
      :title="dialogTitle"
      :message="dialogMessage"
      :placeholder="dialogPlaceholder"
      :defaultValue="dialogDefaultValue"
      @confirm="handleDialogConfirm"
      @cancel="handleDialogCancel"
    />
  </div>
</template>

<script>
import { ref, watch, onMounted, provide } from 'vue'
import ConfigPanel from './components/ConfigPanel.vue'
import GridView from './components/GridView.vue'
import Dialog from './components/Dialog.vue'

export default {
  name: 'App',
  components: {
    ConfigPanel,
    GridView,
    Dialog
  },
  setup() {
    // 检测是否在 Electron 环境中
    const isElectron = ref(
      typeof window !== 'undefined' &&
      (window.electron !== undefined ||
       (navigator.userAgent && navigator.userAgent.toLowerCase().includes('electron')))
    )

    // 检查用户是否已经看过首次弹窗
    const hasSeenDownloadModal = () => {
      try {
        return localStorage.getItem('tab-hive-seen-download-modal') === 'true'
      } catch (e) {
        return false
      }
    }

    // 对话框状态
    const dialogVisible = ref(false)
    const dialogType = ref('confirm')
    const dialogTitle = ref('提示')
    const dialogMessage = ref('')
    const dialogPlaceholder = ref('')
    const dialogDefaultValue = ref('')
    let dialogResolve = null

    // 自定义 prompt 方法
    const showPrompt = (message, defaultValue = '') => {
      // Electron 环境下直接返回默认值
      if (isElectron.value) {
        return Promise.resolve(defaultValue || '新布局')
      }

      // 使用自定义对话框
      return new Promise((resolve) => {
        dialogType.value = 'prompt'
        dialogTitle.value = '输入'
        dialogMessage.value = message
        dialogPlaceholder.value = defaultValue
        dialogDefaultValue.value = defaultValue
        dialogVisible.value = true
        dialogResolve = resolve
      })
    }

    // 自定义 confirm 方法
    const showConfirm = (message) => {
      // Electron 环境下直接返回 true
      if (isElectron.value) {
        return Promise.resolve(true)
      }

      // 使用自定义对话框
      return new Promise((resolve) => {
        dialogType.value = 'confirm'
        dialogTitle.value = '确认'
        dialogMessage.value = message
        dialogVisible.value = true
        dialogResolve = resolve
      })
    }

    // 对话框确认
    const handleDialogConfirm = (value) => {
      if (dialogResolve) {
        dialogResolve(value)
        dialogResolve = null
      }
    }

    // 对话框取消
    const handleDialogCancel = () => {
      if (dialogResolve) {
        dialogResolve(dialogType.value === 'prompt' ? null : false)
        dialogResolve = null
      }
    }

    // 控制下载弹窗显示
    // 首次进入：如果不是 Electron 环境且没有看过弹窗，自动显示
    const showDownloadModal = ref(!isElectron.value && !hasSeenDownloadModal())

    // 关闭下载弹窗
    const closeDownloadModal = () => {
      const isFirstTime = !hasSeenDownloadModal()
      showDownloadModal.value = false

      // 保存用户已经看过弹窗的标记
      try {
        localStorage.setItem('tab-hive-seen-download-modal', 'true')
      } catch (e) {
        console.error('保存弹窗状态失败:', e)
      }

      // 如果是首次关闭弹窗，显示顶栏让用户知道
      if (isFirstTime) {
        setTimeout(() => {
          showPanel.value = true

          // 3秒后自动隐藏
          setTimeout(() => {
            showPanel.value = false
          }, 3000)
        }, 300) // 稍微延迟一下，让弹窗关闭动画完成
      }
    }

    // 显示下载弹窗（手动触发）
    const handleShowDownloadModal = () => {
      showDownloadModal.value = true
    }

    // 从 localStorage 加载配置
    const loadFromStorage = () => {
      try {
        const saved = localStorage.getItem('iframe-all-config')
        if (saved) {
          const config = JSON.parse(saved)

          // 如果是旧格式（单个配置），转换为新格式（多布局）
          if (config.websites !== undefined && !config.layouts) {
            return {
              layouts: [{
                id: 1,
                name: '默认布局',
                websites: config.websites || []
              }],
              currentLayoutId: 1
            }
          }

          // 新格式
          return config
        }
      } catch (e) {
        console.error('加载配置失败:', e)
      }
      return null
    }

    // 保存配置到 localStorage
    const saveToStorage = () => {
      try {
        const config = {
          layouts: layouts.value,
          currentLayoutId: currentLayoutId.value
        }
        localStorage.setItem('iframe-all-config', JSON.stringify(config))
      } catch (e) {
        console.error('保存配置失败:', e)
      }
    }

    // 加载保存的配置或使用默认值
    const savedConfig = loadFromStorage()

    // 布局列表
    const layouts = ref(savedConfig ? savedConfig.layouts : [
      {
        id: 1,
        name: '默认布局',
        websites: [
          {
            id: 1,
            url: 'https://www.baidu.com',
            title: '百度',
            deviceType: 'desktop',
            position: { x: 20, y: 20 },
            size: { width: 400, height: 300 }
          },
          {
            id: 2,
            url: 'https://www.bing.com',
            title: 'Bing',
            deviceType: 'desktop',
            position: { x: 440, y: 20 },
            size: { width: 400, height: 300 }
          },
          {
            id: 3,
            url: 'https://www.google.com',
            title: 'Google',
            deviceType: 'desktop',
            position: { x: 20, y: 340 },
            size: { width: 400, height: 300 }
          }
        ]
      }
    ])

    // 当前布局 ID
    const currentLayoutId = ref(savedConfig?.currentLayoutId || 1)

    // 当前布局（计算属性）
    const currentLayout = ref(layouts.value.find(l => l.id === currentLayoutId.value) || layouts.value[0])

    // 网站列表（从当前布局中获取）- 深拷贝避免引用问题
    // 注意：不在这里设置默认position，让GridView自动计算布局
    const websites = ref(currentLayout.value.websites.map(site => ({
      ...site,
      position: site.position ? { ...site.position } : undefined,
      size: site.size ? { ...site.size } : undefined
    })))

    // 全屏状态
    const fullscreenIndex = ref(null)

    // 顶栏显示状态
    const showPanel = ref(false)

    const handleFullscreen = (index) => {
      fullscreenIndex.value = index
    }

    const exitFullscreen = () => {
      fullscreenIndex.value = null
    }

    const handleMouseMove = (event) => {
      // 鼠标在顶部 5px 区域时显示面板
      if (event.clientY < 5) {
        showPanel.value = true
      }
    }

    const handlePanelLeave = () => {
      // 检查是否有输入框正在使用（重命名输入框或搜索框）
      const activeElement = document.activeElement
      if (activeElement && (
        activeElement.classList.contains('rename-input') ||
        activeElement.classList.contains('search-input')
      )) {
        return // 不隐藏面板
      }
      showPanel.value = false
    }

    const handleAddWebsite = (websiteData) => {
      const defaultWidth = 400
      const defaultHeight = 300
      const spacing = 20

      // 查找所有现有网站的最大Y坐标
      let maxY = 20
      if (websites.value.length > 0) {
        websites.value.forEach(site => {
          if (site.position && site.size) {
            const bottomY = site.position.y + site.size.height
            if (bottomY > maxY) {
              maxY = bottomY
            }
          }
        })
      }

      // 新网站放在最下方
      const newX = 20
      const newY = websites.value.length === 0 ? 20 : maxY + spacing

      websites.value.push({
        id: Date.now(),
        url: websiteData.url,
        title: websiteData.title,
        deviceType: websiteData.deviceType || 'desktop',
        position: websiteData.position || { x: newX, y: newY },
        size: websiteData.size || { width: defaultWidth, height: defaultHeight }
      })
    }

    const handleRemoveWebsite = (index) => {
      websites.value.splice(index, 1)
    }

    const handleUpdateWebsite = ({ index, title, url, deviceType, position, size }) => {
      if (websites.value[index]) {
        if (title !== undefined) websites.value[index].title = title
        if (url !== undefined) websites.value[index].url = url
        if (deviceType !== undefined) websites.value[index].deviceType = deviceType
        if (position !== undefined) {
          websites.value[index].position = { ...position }
          console.log('更新位置:', websites.value[index].title, position)
        }
        if (size !== undefined) {
          websites.value[index].size = { ...size }
          console.log('更新大小:', websites.value[index].title, size)
        }

        // 立即触发保存
        saveCurrentLayout()
      }
    }

    // 切换布局
    const switchLayout = (layoutId) => {
      const layout = layouts.value.find(l => l.id === layoutId)
      if (layout) {
        currentLayoutId.value = layoutId
        currentLayout.value = layout
        // 深拷贝网站数据，避免引用问题
        // 注意：不在这里设置默认position，让GridView自动计算布局
        websites.value = layout.websites.map(site => ({
          ...site,
          position: site.position ? { ...site.position } : undefined,
          size: site.size ? { ...site.size } : undefined
        }))
        console.log('切换布局:', layout.name, '加载了', websites.value.length, '个网站')
        saveToStorage()
      }
    }

    // 保存当前布局（更新当前布局的数据）
    const saveCurrentLayout = () => {
      const layout = layouts.value.find(l => l.id === currentLayoutId.value)
      if (layout) {
        // 检查是否是实时导入的模板，如果是则标记为已修改
        if (layout.importMode === 'realtime' && !layout.isModified) {
          // 检查是否真的修改了
          const hasChanged = JSON.stringify(layout.websites) !== JSON.stringify(websites.value)

          if (hasChanged) {
            layout.isModified = true
            console.log('检测到布局修改，已断开实时链接')
          }
        }

        // 深拷贝网站数据，确保位置和大小信息被正确保存
        layout.websites = websites.value.map(site => ({
          ...site,
          position: site.position ? { ...site.position } : undefined,
          size: site.size ? { ...site.size } : undefined
        }))

        console.log('保存布局:', layout.name, '网站数量:', layout.websites.length)
        saveToStorage()
      }
    }

    // 创建新布局
    const createLayout = (name, options = {}) => {
      const newLayout = {
        id: Date.now(),
        name: name || `布局 ${layouts.value.length + 1}`,
        websites: options.websites || [],
        // 模板链接相关字段
        linkedTemplateId: options.linkedTemplateId || null, // 链接的原始模板ID (original_id)
        importMode: options.importMode || null, // 'realtime' 或 'copy' 或 null
        isModified: false, // 用户是否修改过（实时导入时使用）
        templateVersion: options.templateVersion || null // 当前模板版本
      }
      layouts.value.push(newLayout)
      switchLayout(newLayout.id)
      return newLayout
    }

    // 删除布局
    const deleteLayout = (layoutId) => {
      if (layouts.value.length <= 1) {
        alert('至少需要保留一个布局')
        return
      }

      const index = layouts.value.findIndex(l => l.id === layoutId)
      if (index !== -1) {
        layouts.value.splice(index, 1)

        // 如果删除的是当前布局，切换到第一个布局
        if (currentLayoutId.value === layoutId) {
          switchLayout(layouts.value[0].id)
        } else {
          saveToStorage()
        }
      }
    }

    // 重命名布局
    const renameLayout = (layoutId, newName) => {
      const layout = layouts.value.find(l => l.id === layoutId)
      if (layout) {
        layout.name = newName
        saveToStorage()
      }
    }

    // 检查模板更新
    const checkTemplateUpdate = async (layoutId) => {
      const layout = layouts.value.find(l => l.id === layoutId)
      if (!layout || !layout.linkedTemplateId || layout.importMode !== 'realtime' || layout.isModified) {
        return { hasUpdate: false }
      }

      try {
        const API_BASE_URL = isElectron.value
          ? 'https://tabs.apexstone.ai/api'
          : (import.meta.env.PROD ? '/api' : 'http://localhost:3101/api')

        const response = await fetch(
          `${API_BASE_URL}/layouts/${layout.linkedTemplateId}/check-update?currentVersion=${layout.templateVersion || 1}`
        )
        return await response.json()
      } catch (error) {
        console.error('检查更新失败:', error)
        return { hasUpdate: false }
      }
    }

    // 同步模板更新
    const syncTemplateUpdate = async (layoutId) => {
      const layout = layouts.value.find(l => l.id === layoutId)
      if (!layout || !layout.linkedTemplateId) {
        return false
      }

      try {
        const API_BASE_URL = isElectron.value
          ? 'https://tabs.apexstone.ai/api'
          : (import.meta.env.PROD ? '/api' : 'http://localhost:3101/api')

        const response = await fetch(`${API_BASE_URL}/layouts/${layout.linkedTemplateId}/latest`)
        const templateData = await response.json()

        // 更新布局数据
        layout.websites = templateData.websites || []
        layout.templateVersion = templateData.version

        // 如果是当前布局，也更新显示
        if (currentLayoutId.value === layoutId) {
          websites.value = templateData.websites || []
        }

        saveToStorage()
        return true
      } catch (error) {
        console.error('同步更新失败:', error)
        return false
      }
    }

    // 提供给子组件使用
    provide('showPrompt', showPrompt)
    provide('showConfirm', showConfirm)
    provide('checkTemplateUpdate', checkTemplateUpdate)
    provide('syncTemplateUpdate', syncTemplateUpdate)

    // 监听网站添加/删除，自动保存到当前布局
    // 注意：位置和大小的更新在 handleUpdateWebsite 中直接保存，避免频繁触发
    watch(() => websites.value.length, () => {
      console.log('网站数量变化，触发保存')
      saveCurrentLayout()
    })

    // 从 URL 参数导入布局
    const importLayoutFromUrlParams = () => {
      try {
        const urlParams = new URLSearchParams(window.location.search)
        const urlsParam = urlParams.get('urls')

        if (!urlsParam) return false

        let websites = []

        // 尝试解析不同格式的 URLs 参数
        try {
          // 格式1: JSON 数组 - [{"url":"https://google.com","title":"Google"},...]
          const parsed = JSON.parse(urlsParam)
          if (Array.isArray(parsed)) {
            websites = parsed.map((item, index) => {
              if (typeof item === 'string') {
                // 简单字符串数组
                const url = item.startsWith('http') ? item : `https://${item}`
                return {
                  id: Date.now() + index,
                  url: url,
                  title: extractTitleFromUrl(url),
                  deviceType: 'desktop'
                }
              } else if (typeof item === 'object' && item.url) {
                // 对象数组
                const url = item.url.startsWith('http') ? item.url : `https://${item.url}`
                return {
                  id: Date.now() + index,
                  url: url,
                  title: item.title || extractTitleFromUrl(url),
                  deviceType: item.deviceType || 'desktop'
                }
              }
              return null
            }).filter(Boolean)
          }
        } catch (e) {
          // 格式2: 逗号分隔的 URLs - https://google.com,https://bing.com
          const urlList = urlsParam.split(',').map(u => u.trim()).filter(Boolean)
          websites = urlList.map((urlStr, index) => {
            const url = urlStr.startsWith('http') ? urlStr : `https://${urlStr}`
            return {
              id: Date.now() + index,
              url: url,
              title: extractTitleFromUrl(url),
              deviceType: 'desktop'
            }
          })
        }

        if (websites.length === 0) return false

        // 获取其他可选参数
        const layoutName = urlParams.get('layoutName') || urlParams.get('name') || '导入的布局'

        // 创建新布局
        createLayout(layoutName, {
          websites: websites
        })

        // 清除 URL 参数（可选）
        if (urlParams.get('clearParams') !== 'false') {
          const newUrl = window.location.pathname + window.location.hash
          window.history.replaceState({}, document.title, newUrl)
        }

        return true
      } catch (error) {
        console.error('从 URL 参数导入布局失败:', error)
        return false
      }
    }

    // 从 URL 提取标题
    const extractTitleFromUrl = (url) => {
      try {
        const urlObj = new URL(url)
        return urlObj.hostname.replace('www.', '')
      } catch (e) {
        return '网站'
      }
    }

    // 页面加载时自动显示顶栏，然后隐藏
    onMounted(() => {
      // 首先尝试从 URL 参数导入布局
      const imported = importLayoutFromUrlParams()

      // 如果有弹窗显示，等待弹窗关闭后再显示顶栏
      // 否则直接显示顶栏
      if (!showDownloadModal.value) {
        // 初始显示顶栏
        showPanel.value = true

        // 如果成功导入了布局，显示提示
        if (imported) {
          setTimeout(() => {
            alert('已成功从 URL 参数导入布局！')
          }, 500)
        }

        // 3秒后自动隐藏
        setTimeout(() => {
          showPanel.value = false
        }, 3000)
      }
    })

    return {
      isElectron,
      showDownloadModal,
      closeDownloadModal,
      handleShowDownloadModal,
      dialogVisible,
      dialogType,
      dialogTitle,
      dialogMessage,
      dialogPlaceholder,
      dialogDefaultValue,
      handleDialogConfirm,
      handleDialogCancel,
      websites,
      layouts,
      currentLayoutId,
      fullscreenIndex,
      showPanel,
      handleFullscreen,
      exitFullscreen,
      handleMouseMove,
      handlePanelLeave,
      handleAddWebsite,
      handleRemoveWebsite,
      handleUpdateWebsite,
      switchLayout,
      createLayout,
      deleteLayout,
      renameLayout
    }
  }
}
</script>

<style scoped>
.app-container {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  position: relative;
}

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

.top-trigger-area {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 5px;
  z-index: 1000;
  pointer-events: all;
}

.app-container :deep(.config-panel) {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 999;
  transform: translateY(-100%);
  transition: transform 0.3s ease-out;
}

.app-container :deep(.config-panel.panel-visible) {
  transform: translateY(0);
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

