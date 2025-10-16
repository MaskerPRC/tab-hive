import { ref } from 'vue'

/**
 * 对话框管理 Composable
 * 提供统一的对话框管理功能（prompt 和 confirm）
 */
export function useDialog() {
  // 检测是否在 Electron 环境中
  const isElectron = ref(
    typeof window !== 'undefined' &&
    (window.electron !== undefined ||
     (navigator.userAgent && navigator.userAgent.toLowerCase().includes('electron')))
  )

  // 对话框状态
  const dialogVisible = ref(false)
  const dialogType = ref('confirm')
  const dialogTitle = ref('提示')
  const dialogMessage = ref('')
  const dialogPlaceholder = ref('')
  const dialogDefaultValue = ref('')
  let dialogResolve = null

  /**
   * 显示 prompt 对话框
   * @param {string} message - 提示消息
   * @param {string} defaultValue - 默认值
   * @returns {Promise<string|null>} 用户输入的值或 null
   */
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

  /**
   * 显示 confirm 对话框
   * @param {string} message - 提示消息
   * @returns {Promise<boolean>} 用户确认结果
   */
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

  /**
   * 处理对话框确认
   * @param {*} value - 确认的值（prompt 返回字符串，confirm 返回 true）
   */
  const handleDialogConfirm = (value) => {
    if (dialogResolve) {
      dialogResolve(value)
      dialogResolve = null
    }
  }

  /**
   * 处理对话框取消
   */
  const handleDialogCancel = () => {
    if (dialogResolve) {
      dialogResolve(dialogType.value === 'prompt' ? null : false)
      dialogResolve = null
    }
  }

  return {
    // 状态
    isElectron,
    dialogVisible,
    dialogType,
    dialogTitle,
    dialogMessage,
    dialogPlaceholder,
    dialogDefaultValue,
    // 方法
    showPrompt,
    showConfirm,
    handleDialogConfirm,
    handleDialogCancel
  }
}

