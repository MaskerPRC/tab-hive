import { ref } from 'vue'

/**
 * 对话框管理 Composable
 * 提供统一的对话框管理功能（prompt 和 confirm）
 */
export function useDialog() {
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
   * @param {string|Object} messageOrOptions - 提示消息字符串或选项对象
   * @param {string} defaultValue - 默认值（当第一个参数是字符串时使用）
   * @returns {Promise<string|null>} 用户输入的值或 null
   */
  const showPrompt = (messageOrOptions, defaultValue = '') => {
    // 支持对象参数和字符串参数两种方式
    let title, message, placeholder, defaultVal
    
    if (typeof messageOrOptions === 'object') {
      // 对象参数方式
      title = messageOrOptions.title || '输入'
      message = messageOrOptions.message || ''
      placeholder = messageOrOptions.placeholder || ''
      defaultVal = messageOrOptions.defaultValue || placeholder
    } else {
      // 字符串参数方式（向后兼容）
      title = '输入'
      message = messageOrOptions
      placeholder = defaultValue
      defaultVal = defaultValue
    }

    // 使用自定义对话框（无论是否在 Electron 环境）
    return new Promise((resolve) => {
      dialogType.value = 'prompt'
      dialogTitle.value = title
      dialogMessage.value = message
      dialogPlaceholder.value = placeholder
      dialogDefaultValue.value = defaultVal
      dialogVisible.value = true
      dialogResolve = resolve
    })
  }

  /**
   * 显示 confirm 对话框
   * @param {string|Object} messageOrOptions - 提示消息字符串或选项对象
   * @returns {Promise<boolean>} 用户确认结果
   */
  const showConfirm = (messageOrOptions) => {
    // 支持对象参数和字符串参数两种方式
    let title, message
    
    if (typeof messageOrOptions === 'object') {
      // 对象参数方式
      title = messageOrOptions.title || '确认'
      message = messageOrOptions.message || ''
    } else {
      // 字符串参数方式（向后兼容）
      title = '确认'
      message = messageOrOptions
    }

    // 使用自定义对话框（无论是否在 Electron 环境）
    return new Promise((resolve) => {
      dialogType.value = 'confirm'
      dialogTitle.value = title
      dialogMessage.value = message
      dialogVisible.value = true
      dialogResolve = resolve
    })
  }

  /**
   * 显示 alert 对话框（只有确定按钮）
   * @param {string|Object} messageOrOptions - 提示消息字符串或选项对象
   * @returns {Promise<void>} 用户点击确定后 resolve
   */
  const showAlert = (messageOrOptions) => {
    // 支持对象参数和字符串参数两种方式
    let title, message
    
    if (typeof messageOrOptions === 'object') {
      // 对象参数方式
      title = messageOrOptions.title || '提示'
      message = messageOrOptions.message || ''
    } else {
      // 字符串参数方式（向后兼容）
      title = '提示'
      message = messageOrOptions
    }

    // 使用自定义对话框
    return new Promise((resolve) => {
      dialogType.value = 'alert'
      dialogTitle.value = title
      dialogMessage.value = message
      dialogVisible.value = true
      dialogResolve = resolve
    })
  }

  /**
   * 处理对话框确认
   * @param {*} value - 确认的值（prompt 返回字符串，confirm 返回 true，alert 返回 undefined）
   */
  const handleDialogConfirm = (value) => {
    if (dialogResolve) {
      if (dialogType.value === 'alert') {
        dialogResolve()
      } else {
        dialogResolve(value)
      }
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
    dialogVisible,
    dialogType,
    dialogTitle,
    dialogMessage,
    dialogPlaceholder,
    dialogDefaultValue,
    // 方法
    showPrompt,
    showConfirm,
    showAlert,
    handleDialogConfirm,
    handleDialogCancel
  }
}

