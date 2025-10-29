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
  
  const currentVersion = ref('0.0.1') // 从 package.json 读取
  const latestVersion = ref(null)
  const updateAvailable = ref(false)
  const updateInfo = ref(null)
  const showUpdateNotification = ref(false)
  const showUpdateButton = ref(false) // 用户忽略后在左侧栏显示
  const isChecking = ref(false)
  const lastCheckTime = ref(null)

  const GITHUB_REPO = 'MaskerPRC/tab-hive'
  const CHECK_INTERVAL = 24 * 60 * 60 * 1000 // 24小时
  const IGNORED_VERSION_KEY = 'tab-hive-ignored-update-version'
  const LAST_CHECK_KEY = 'tab-hive-last-update-check'

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
   * - 如果用户忽略了该版本，则不显示通知，只显示按钮
   */
  const shouldShowNotification = (version) => {
    try {
      const ignoredVersion = localStorage.getItem(IGNORED_VERSION_KEY)
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

        // 检查是否应该显示通知
        if (shouldShowNotification(latest.version)) {
          showUpdateNotification.value = true
          showUpdateButton.value = false
        } else {
          // 用户已忽略该版本，只显示按钮
          showUpdateNotification.value = false
          showUpdateButton.value = true
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
   * 忽略当前版本更新
   */
  const ignoreUpdate = () => {
    if (latestVersion.value) {
      try {
        localStorage.setItem(IGNORED_VERSION_KEY, latestVersion.value)
        console.log('[更新检测] 已忽略版本:', latestVersion.value)
      } catch (e) {
        console.error('保存忽略版本失败:', e)
      }
    }

    showUpdateNotification.value = false
    showUpdateButton.value = true
  }

  /**
   * 打开更新页面
   */
  const openUpdatePage = () => {
    if (updateInfo.value) {
      window.open(updateInfo.value.htmlUrl, '_blank')
    }
  }

  /**
   * 从按钮点击重新显示更新通知
   */
  const showNotificationFromButton = () => {
    showUpdateButton.value = false
    showUpdateNotification.value = true
  }

  /**
   * 关闭更新通知（不忽略）
   */
  const closeNotification = () => {
    showUpdateNotification.value = false
    // 关闭但不忽略，下次检测还会提示
  }

  /**
   * 启动定时检测
   */
  const startPeriodicCheck = () => {
    // 先检查上次检测时间
    try {
      const lastCheck = localStorage.getItem(LAST_CHECK_KEY)
      if (lastCheck) {
        lastCheckTime.value = parseInt(lastCheck, 10)
        const timeSinceLastCheck = Date.now() - lastCheckTime.value

        console.log('[更新检测] 距离上次检测:', Math.floor(timeSinceLastCheck / 1000 / 60), '分钟')

        // 如果距离上次检测超过24小时，立即检测
        if (timeSinceLastCheck >= CHECK_INTERVAL) {
          console.log('[更新检测] 超过24小时，立即检测')
          checkForUpdates()
        } else {
          console.log('[更新检测] 未超过24小时，等待定时检测')
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

  // 组件挂载时启动
  onMounted(() => {
    console.log('[更新检测] 初始化更新检测器')
    startPeriodicCheck()
  })

  // 组件卸载时清理
  onUnmounted(() => {
    stopPeriodicCheck()
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

    // 方法
    checkForUpdates,
    ignoreUpdate,
    openUpdatePage,
    showNotificationFromButton,
    closeNotification
  }
}

