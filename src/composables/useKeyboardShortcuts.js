import { onMounted, onUnmounted } from 'vue'

/**
 * 键盘快捷键 composable
 * 处理画布的键盘快捷键
 */
export function useKeyboardShortcuts(options) {
  const {
    fullscreenIndex,
    zoomIn,
    zoomOut,
    resetTransform,
    extractUrlFromText,
    emit
  } = options

  /**
   * 键盘快捷键处理函数
   */
  const handleKeyDown = async (event) => {
    // 如果全屏模式，禁用画布缩放快捷键
    if (fullscreenIndex.value !== null) {
      return
    }

    // Ctrl + Plus 放大
    if (event.ctrlKey && (event.key === '+' || event.key === '=')) {
      event.preventDefault()
      zoomIn()
    }
    // Ctrl + Minus 缩小
    if (event.ctrlKey && event.key === '-') {
      event.preventDefault()
      zoomOut()
    }
    // Ctrl + 0 重置
    if (event.ctrlKey && event.key === '0') {
      event.preventDefault()
      resetTransform()
    }

    // Ctrl+V 或 Cmd+V 粘贴链接
    if ((event.ctrlKey || event.metaKey) && event.key === 'v') {
      // 检查是否在输入框中（不应该触发粘贴创建网站）
      const activeElement = document.activeElement
      if (activeElement && (
        activeElement.tagName === 'INPUT' ||
        activeElement.tagName === 'TEXTAREA' ||
        activeElement.isContentEditable
      )) {
        return // 在输入框中，不处理
      }

      // 延迟一下，等待浏览器完成默认粘贴操作
      setTimeout(async () => {
        try {
          // 从剪贴板读取文本
          const text = await navigator.clipboard.readText()
          if (text) {
            // 尝试提取 URL
            const urlData = extractUrlFromText(text)
            if (urlData) {
              console.log('[GridView] 从剪贴板检测到 URL:', urlData)
              // 创建新网站
              emit('add-website', { title: urlData.title, url: urlData.url })
            }
          }
        } catch (error) {
          // 如果无法读取剪贴板（可能是权限问题），静默失败
          console.warn('[GridView] 无法读取剪贴板，可能需要用户授权:', error)
        }
      }, 50)
    }
  }

  /**
   * 设置键盘快捷键监听
   */
  const setupKeyboardListeners = () => {
    window.addEventListener('keydown', handleKeyDown)
  }

  /**
   * 清理键盘快捷键监听
   */
  const cleanupKeyboardListeners = () => {
    window.removeEventListener('keydown', handleKeyDown)
  }

  // 自动设置和清理
  onMounted(() => {
    setupKeyboardListeners()
  })

  onUnmounted(() => {
    cleanupKeyboardListeners()
  })

  return {
    handleKeyDown,
    setupKeyboardListeners,
    cleanupKeyboardListeners
  }
}

