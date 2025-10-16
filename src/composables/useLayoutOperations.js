import { ref, nextTick } from 'vue'

/**
 * 布局操作 Composable
 * 提供布局的重命名、分享、同步等操作
 */
export function useLayoutOperations(isElectron = false) {
  // 自动检测API地址
  const API_BASE_URL = isElectron
    ? 'https://tabs.apexstone.ai/api'
    : (import.meta.env.PROD ? '/api' : 'http://localhost:3101/api')

  // 重命名状态
  const editingLayoutId = ref(null)
  const editingLayoutName = ref('')

  /**
   * 开始重命名布局
   * @param {number} layoutId - 布局 ID
   * @param {string} currentName - 当前名称
   * @param {Event} event - 事件对象
   */
  const startRename = (layoutId, currentName, event) => {
    event?.stopPropagation()
    editingLayoutId.value = layoutId
    editingLayoutName.value = currentName
    // 下一帧自动聚焦到输入框
    nextTick(() => {
      const input = document.querySelector('.rename-input')
      if (input) {
        input.focus()
        input.select() // 选中全部文本，方便用户直接输入
      }
    })
  }

  /**
   * 确认重命名
   * @param {Function} onRename - 重命名回调函数
   */
  const confirmRename = (onRename) => {
    if (editingLayoutName.value.trim() && onRename) {
      onRename(editingLayoutId.value, editingLayoutName.value.trim())
      editingLayoutId.value = null
      editingLayoutName.value = ''
    }
  }

  /**
   * 取消重命名
   */
  const cancelRename = () => {
    editingLayoutId.value = null
    editingLayoutName.value = ''
  }

  /**
   * 分享布局
   * @param {Object} layout - 布局对象
   * @param {Function} showConfirm - 确认对话框函数
   */
  const shareLayout = async (layout, showConfirm) => {
    if (!layout.websites || layout.websites.length === 0) {
      alert('该布局没有网站，无法分享')
      return
    }

    try {
      // 首先检查是否已经分享过同名布局
      const checkResponse = await fetch(
        `${API_BASE_URL}/layouts/check-own?layoutName=${encodeURIComponent(layout.name)}`
      )
      const checkData = await checkResponse.json()

      console.log('检查同名布局结果:', checkData)

      let isUpdate = false
      let originalId = null

      // 如果找到同名布局，询问是否更新版本
      if (checkData.exists) {
        const confirmUpdate = await showConfirm(
          `检测到你之前已经分享过名为 "${layout.name}" 的布局（当前版本 v${checkData.currentVersion}）。\n\n` +
          `是否要更新为新版本 v${checkData.currentVersion + 1}？\n\n` +
          `点击"确定"将更新版本，点击"取消"将创建新的分享布局。`
        )
        
        if (confirmUpdate) {
          isUpdate = true
          originalId = checkData.originalId
          console.log('用户选择更新版本，originalId:', originalId)
        } else {
          console.log('用户选择创建新的分享布局')
        }
      } else {
        console.log('未找到同名布局，将创建新的分享')
        // 如果不是更新，显示普通的分享确认
        if (!await showConfirm(`确定要分享布局 "${layout.name}" 吗？\n\n分享后其他用户将可以查看和使用此布局。\n每个IP每天最多分享10个布局。`)) {
          return
        }
      }

      // 为兼容数据库表结构，添加已废弃的 rows 和 cols 字段（使用默认值）
      const layoutData = {
        ...layout,
        rows: layout.rows || 1,  // 使用默认值 1（字段已废弃，仅为满足数据库约束）
        cols: layout.cols || 1   // 使用默认值 1（字段已废弃，仅为满足数据库约束）
      }

      const requestBody = { 
        layout: layoutData,
        isUpdate: isUpdate,
        originalId: originalId
      }

      console.log('准备发送分享请求:', {
        layoutName: layoutData.name,
        isUpdate,
        originalId,
        websiteCount: layoutData.websites?.length
      })

      const response = await fetch(`${API_BASE_URL}/layouts/share`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      })

      const data = await response.json()

      console.log('分享响应:', { status: response.status, data })

      if (response.ok) {
        if (isUpdate) {
          alert(`版本更新成功！已更新到 v${data.version}`)
        } else {
          alert(`分享成功！\n今日还可分享 ${data.remaining} 次`)
        }
      } else {
        console.error('分享失败，服务器返回错误:', data)
        alert(data.error || '分享失败')
      }
    } catch (error) {
      console.error('分享失败:', error)
      alert('分享失败，请确保后端服务正在运行')
    }
  }

  /**
   * 同步模板更新
   * @param {Object} layout - 布局对象
   * @param {Function} checkTemplateUpdate - 检查更新函数
   * @param {Function} syncTemplateUpdate - 同步更新函数
   * @param {Function} showConfirm - 确认对话框函数
   */
  const syncTemplate = async (layout, checkTemplateUpdate, syncTemplateUpdate, showConfirm) => {
    try {
      // 如果用户已修改，先显示警告
      if (layout.isModified) {
        const confirmOverride = await showConfirm(
          `⚠️ 警告：你已经修改过此布局！\n\n` +
          `同步更新将会覆盖你的所有改动，包括：\n` +
          `• 添加或删除的网站\n` +
          `• 修改的网站信息\n` +
          `• 调整的布局位置\n\n` +
          `确定要继续同步吗？此操作无法撤销。`
        )
        
        if (!confirmOverride) {
          return
        }
      }

      const updateInfo = await checkTemplateUpdate(layout.id)

      if (!updateInfo.hasUpdate) {
        alert('已是最新版本！')
        return
      }

      const confirmMessage = layout.isModified
        ? `发现新版本 v${updateInfo.latestVersion}，同步后将覆盖你的改动。\n\n确定要立即同步更新吗？`
        : `发现新版本 v${updateInfo.latestVersion}，是否立即同步更新？`

      if (await showConfirm(confirmMessage)) {
        const success = await syncTemplateUpdate(layout.id)
        if (success) {
          alert(`已成功更新到 v${updateInfo.latestVersion}`)
        } else {
          alert('更新失败，请稍后重试')
        }
      }
    } catch (error) {
      console.error('检查更新失败:', error)
      alert('检查更新失败')
    }
  }

  return {
    // 状态
    editingLayoutId,
    editingLayoutName,
    // 方法
    startRename,
    confirmRename,
    cancelRename,
    shareLayout,
    syncTemplate
  }
}

