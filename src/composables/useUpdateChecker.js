import { ref, onMounted, onUnmounted } from 'vue'

/**
 * 更新检测 Composable
 * 功能：
 * - 启动时检测更新
 * - 每24小时定时检测
 * - 通过 GitHub releases API 检测最新版本
 */
export function useUpdateChecker() {
  console.log('[更新检测] useUpdateChecker 初始化...')

  // 从构建时注入的版本号获取（通过 vite.config.js 的 define 功能）
  // @ts-ignore - __APP_VERSION__ 是通过 Vite define 注入的全局变量
  const currentVersion = ref(__APP_VERSION__ || 'v0.0.1')
  const latestVersion = ref(null)
  const updateAvailable = ref(false)
  const updateInfo = ref(null)
  const showUpdateNotification = ref(false)
  const showUpdateButton = ref(false) // 用户忽略后在左侧栏显示
  const isChecking = ref(false)
  const lastCheckTime = ref(null)

  // 下载状态
  const downloadStatus = ref({
    isDownloading: false,
    progress: 0,
    downloaded: 0,
    total: 0,
    completed: false,
    error: null,
    savePath: null
  })

  // 检查是否在 Electron 环境中
  const isElectron = typeof window !== 'undefined' && window.electron !== undefined

  const GITHUB_REPO = 'MaskerPRC/tab-hive'
  const CHECK_INTERVAL = 24 * 60 * 60 * 1000 // 24小时
  const IGNORED_VERSION_KEY = 'quanshijie-ignored-update-version'
  const LAST_CHECK_KEY = 'quanshijie-last-update-check'

  let checkInterval = null

  console.log('[更新检测] 当前版本:', currentVersion.value)
  console.log('[更新检测] GitHub 仓库:', GITHUB_REPO)

  /**
   * 比较版本号
   * @param {string} v1 - 版本1 (例如: "0.5.2")
   * @param {string} v2 - 版本2
   * @returns {number} - v1 > v2 返回1, v1 < v2 返回-1, 相等返回0
   */
  const compareVersions = (v1, v2) => {
    const parts1 = v1.replace(/^v/, '').split('.').map(Number)
    const parts2 = v2.replace(/^v/, '').split('.').map(Number)

    for (let i = 0; i < Math.max(parts1.length, parts2.length); i++) {
      const part1 = parts1[i] || 0
      const part2 = parts2[i] || 0

      if (part1 > part2) return 1
      if (part1 < part2) return -1
    }

    return 0
  }

  /**
   * 从 GitHub API 获取最新版本信息
   */
  const fetchLatestVersion = async () => {
    try {
      const response = await fetch(
        `https://api.github.com/repos/${GITHUB_REPO}/releases/latest`,
        {
          headers: {
            'Accept': 'application/vnd.github.v3+json'
          }
        }
      )

      if (!response.ok) {
        throw new Error(`GitHub API 请求失败: ${response.status}`)
      }

      const data = await response.json()
      return {
        version: data.tag_name,
        name: data.name,
        body: data.body,
        publishedAt: data.published_at,
        htmlUrl: data.html_url,
        assets: data.assets
      }
    } catch (error) {
      console.error('获取最新版本失败:', error)
      return null
    }
  }

  /**
   * 检查是否应该显示更新提示
   * - 如果用户点击了"稍后提醒"，则不显示通知，只显示按钮
   */
  const shouldShowNotification = (version) => {
    try {
      const ignoredVersion = localStorage.getItem(IGNORED_VERSION_KEY)
      // 只有完全匹配才算忽略
      return ignoredVersion !== version
    } catch (e) {
      return true
    }
  }

  /**
   * 检查更新
   */
  const checkForUpdates = async (silent = false) => {
    if (isChecking.value) {
      console.log('[更新检测] 正在检测中，跳过')
      return
    }

    isChecking.value = true
    console.log('[更新检测] 开始检测更新...')

    try {
      const latest = await fetchLatestVersion()

      if (!latest) {
        console.log('[更新检测] 获取最新版本信息失败')
        return
      }

      latestVersion.value = latest.version
      updateInfo.value = latest
      lastCheckTime.value = Date.now()

      // 保存检测时间
      try {
        localStorage.setItem(LAST_CHECK_KEY, lastCheckTime.value.toString())
      } catch (e) {
        console.error('保存检测时间失败:', e)
      }

      console.log('[更新检测] 当前版本:', currentVersion.value)
      console.log('[更新检测] 最新版本:', latest.version)

      // 比较版本
      const comparison = compareVersions(latest.version, currentVersion.value)

      if (comparison > 0) {
        console.log('[更新检测] 发现新版本!')
        updateAvailable.value = true

        // 重要：只要有新版本，左侧栏就显示更新按钮
        showUpdateButton.value = true

        // 检查是否应该显示弹窗通知
        // 只有用户点击了"稍后提醒"才会记录忽略状态
        // 如果点击了"关闭"或"立即更新"，下次检测还会弹窗
        if (shouldShowNotification(latest.version)) {
          console.log('[更新检测] 显示更新通知弹窗 + 左侧栏按钮')
          showUpdateNotification.value = true
        } else {
          // 用户已点击"稍后提醒"，不弹窗但显示左侧栏按钮
          console.log('[更新检测] 用户之前选择了稍后提醒，只显示左侧栏按钮')
          showUpdateNotification.value = false
        }
      } else {
        console.log('[更新检测] 已是最新版本')
        updateAvailable.value = false
        showUpdateNotification.value = false
        showUpdateButton.value = false
      }
    } catch (error) {
      console.error('[更新检测] 检测失败:', error)
    } finally {
      isChecking.value = false
    }
  }

  /**
   * 稍后提醒（真正的忽略弹窗）
   * 只有点击"稍后提醒"才会记录忽略状态
   * 关闭弹窗但保持左侧栏按钮显示
   */
  const ignoreUpdate = () => {
    if (latestVersion.value) {
      try {
        localStorage.setItem(IGNORED_VERSION_KEY, latestVersion.value)
        console.log('[更新检测] 用户选择稍后提醒，已记录版本:', latestVersion.value)
      } catch (e) {
        console.error('保存忽略版本失败:', e)
      }
    }

    // 关闭弹窗，但左侧栏按钮继续显示
    showUpdateNotification.value = false
    // showUpdateButton.value 保持 true，因为有新版本
  }

  /**
   * 获取适合当前平台的下载资源
   */
  const getPlatformAsset = () => {
    if (!updateInfo.value || !updateInfo.value.assets) {
      return null
    }

    const platform = isElectron ? window.electron.platform : 'win32'
    const assets = updateInfo.value.assets

    // 根据平台选择合适的安装包
    let targetAsset = null

    if (platform === 'win32') {
      // Windows: 查找 .exe 文件
      targetAsset = assets.find(asset => asset.name.endsWith('.exe'))
    } else if (platform === 'darwin') {
      // macOS: 查找 .dmg 文件
      targetAsset = assets.find(asset => asset.name.endsWith('.dmg'))
    } else if (platform === 'linux') {
      // Linux: 查找 .AppImage 文件
      targetAsset = assets.find(asset => asset.name.endsWith('.AppImage'))
    }

    return targetAsset
  }

  /**
   * 开始下载更新
   * 注意：开始下载不等于忽略，如果下载失败或未完成，下次检测还会提示
   */
  const startDownload = async () => {
    console.log('[更新检测] 用户点击立即更新（不记录忽略状态）')

    if (!isElectron) {
      // 非 Electron 环境，打开网页
      if (updateInfo.value) {
        window.open(updateInfo.value.htmlUrl, '_blank')
      }
      return
    }

    const asset = getPlatformAsset()
    if (!asset) {
      console.error('[更新检测] 未找到适合当前平台的安装包')
      downloadStatus.value.error = '未找到适合当前平台的安装包'
      return
    }

    console.log('[更新检测] 开始下载:', asset.name)
    console.log('[更新检测] 下载地址:', asset.browser_download_url)

    // 重置下载状态
    downloadStatus.value = {
      isDownloading: true,
      progress: 0,
      downloaded: 0,
      total: asset.size || 0,
      completed: false,
      error: null,
      savePath: null
    }

    try {
      const result = await window.electron.update.download(
        asset.browser_download_url,
        asset.name
      )

      if (!result.success) {
        console.error('[更新检测] 下载启动失败:', result.error)
        downloadStatus.value.error = result.error
        downloadStatus.value.isDownloading = false
      } else {
        console.log('[更新检测] 下载已启动')
      }
    } catch (error) {
      console.error('[更新检测] 下载失败:', error)
      downloadStatus.value.error = error.message
      downloadStatus.value.isDownloading = false
    }
  }

  /**
   * 取消下载
   */
  const cancelDownload = async () => {
    if (!isElectron) return

    console.log('[更新检测] 取消下载')

    try {
      await window.electron.update.cancel()
      downloadStatus.value.isDownloading = false
      downloadStatus.value.error = '用户取消'
    } catch (error) {
      console.error('[更新检测] 取消下载失败:', error)
    }
  }

  /**
   * 重试下载
   */
  const retryDownload = () => {
    downloadStatus.value.error = null
    startDownload()
  }

  /**
   * 打开安装文件并退出应用
   */
  const openInstaller = async (filePath) => {
    if (!isElectron) return

    console.log('[更新检测] 打开安装文件:', filePath)

    try {
      const result = await window.electron.update.openInstaller(filePath)

      if (!result.success) {
        console.error('[更新检测] 打开安装文件失败:', result.error)
        downloadStatus.value.error = result.error
      }
    } catch (error) {
      console.error('[更新检测] 打开安装文件失败:', error)
      downloadStatus.value.error = error.message
    }
  }

  /**
   * 打开更新页面（备用方案）
   */
  const openUpdatePage = () => {
    if (updateInfo.value) {
      window.open(updateInfo.value.htmlUrl, '_blank')
    }
  }

  /**
   * 从左侧栏按钮点击，重新显示更新通知
   * 不清除忽略状态，因为按钮始终显示
   */
  const showNotificationFromButton = () => {
    console.log('[更新检测] 用户从左侧栏打开更新通知')
    showUpdateNotification.value = true
    // 左侧栏按钮继续显示，不隐藏
  }

  /**
   * 关闭更新通知（临时关闭，不记录忽略状态）
   * 用户点击关闭按钮，下次检测时还会弹窗
   * 左侧栏按钮继续显示
   */
  const closeNotification = () => {
    console.log('[更新检测] 用户关闭通知（临时），下次检测还会提示，左侧栏按钮继续显示')
    showUpdateNotification.value = false
    // 注意：这里不记录忽略状态，所以下次检测还会弹窗
    // 左侧栏按钮继续显示（showUpdateButton 保持 true）
  }

  /**
   * 启动定时检测
   */
  const startPeriodicCheck = () => {
    // 先检查是否有忽略的版本记录
    // 如果有，说明用户之前选择了"稍后提醒"，应该强制检测一次以恢复按钮状态
    let hasIgnoredVersion = false
    try {
      const ignoredVersion = localStorage.getItem(IGNORED_VERSION_KEY)
      if (ignoredVersion) {
        hasIgnoredVersion = true
        console.log('[更新检测] 检测到之前忽略的版本:', ignoredVersion)
      }
    } catch (e) {
      // 忽略错误
    }

    // 先检查上次检测时间
    try {
      const lastCheck = localStorage.getItem(LAST_CHECK_KEY)
      if (lastCheck) {
        lastCheckTime.value = parseInt(lastCheck, 10)
        const timeSinceLastCheck = Date.now() - lastCheckTime.value

        console.log('[更新检测] 距离上次检测:', Math.floor(timeSinceLastCheck / 1000 / 60), '分钟')

        // 如果距离上次检测超过24小时，或者有忽略的版本记录，立即检测
        if (timeSinceLastCheck >= CHECK_INTERVAL || hasIgnoredVersion) {
          if (hasIgnoredVersion) {
            console.log('[更新检测] 有忽略的版本记录，强制检测以恢复按钮状态')
          } else {
            console.log('[更新检测] 超过24小时，立即检测')
          }
          checkForUpdates()
        } else {
          console.log('[更新检测] 未超过24小时且无忽略记录，等待定时检测')
        }
      } else {
        // 首次启动，立即检测
        console.log('[更新检测] 首次启动，立即检测')
        checkForUpdates()
      }
    } catch (e) {
      // 读取失败，立即检测
      console.log('[更新检测] 读取上次检测时间失败，立即检测')
      checkForUpdates()
    }

    // 设置定时检测（每24小时）
    checkInterval = setInterval(() => {
      console.log('[更新检测] 定时检测触发')
      checkForUpdates()
    }, CHECK_INTERVAL)

    console.log('[更新检测] 定时检测已启动（24小时间隔）')
  }

  /**
   * 停止定时检测
   */
  const stopPeriodicCheck = () => {
    if (checkInterval) {
      clearInterval(checkInterval)
      checkInterval = null
      console.log('[更新检测] 定时检测已停止')
    }
  }

  // 设置 Electron 事件监听器
  const setupElectronListeners = () => {
    if (!isElectron) return

    // 监听下载进度
    window.electron.on('update-download-progress', (data) => {
      downloadStatus.value.isDownloading = true
      downloadStatus.value.downloaded = data.downloaded
      downloadStatus.value.total = data.total
      downloadStatus.value.progress = data.progress
    })

    // 监听下载完成
    window.electron.on('update-download-complete', (data) => {
      downloadStatus.value.isDownloading = false
      downloadStatus.value.completed = true
      downloadStatus.value.savePath = data.savePath
      downloadStatus.value.progress = 100
      console.log('[更新检测] 下载完成:', data.savePath)
    })

    // 监听下载失败
    window.electron.on('update-download-error', (data) => {
      downloadStatus.value.isDownloading = false
      downloadStatus.value.error = data.error
      console.error('[更新检测] 下载失败:', data.error)
    })
  }

  // 清理 Electron 事件监听器
  const cleanupElectronListeners = () => {
    if (!isElectron) return
    window.electron.off('update-download-progress')
    window.electron.off('update-download-complete')
    window.electron.off('update-download-error')
  }

  // 组件挂载时启动
  onMounted(() => {
    console.log('[更新检测] 初始化更新检测器')
    startPeriodicCheck()
    setupElectronListeners()
  })

  // 组件卸载时清理
  onUnmounted(() => {
    stopPeriodicCheck()
    cleanupElectronListeners()
  })

  return {
    // 状态
    currentVersion,
    latestVersion,
    updateAvailable,
    updateInfo,
    showUpdateNotification,
    showUpdateButton,
    isChecking,
    lastCheckTime,
    downloadStatus,

    // 方法
    checkForUpdates,
    ignoreUpdate,
    openUpdatePage,
    showNotificationFromButton,
    closeNotification,
    startDownload,
    cancelDownload,
    retryDownload,
    openInstaller
  }
}

