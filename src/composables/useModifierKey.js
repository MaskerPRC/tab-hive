import { ref, computed, watch, onMounted, onUnmounted } from 'vue'

/**
 * 修饰键状态管理 composable
 * 用于检测用户是否按下了修饰键（Ctrl/Alt），以控制浮动按钮等UI元素的显示
 * 
 * @param {Object} props - 组件 props，需要包含 item 属性
 * @returns {Object} 修饰键状态和相关方法
 */
export function useModifierKey(props) {
  // 修饰键是否被按下
  const isModifierPressed = ref(false)

  // 从网站配置中读取是否需要修饰键
  const requireModifierForActions = computed(() => {
    return props.item?.requireModifierForActions || false
  })

  // 监听键盘事件以跟踪修饰键状态
  const handleKeyDown = (event) => {
    if (requireModifierForActions.value) {
      // 检查是否按下了 Ctrl 或 Alt 键
      if (event.ctrlKey || event.altKey) {
        isModifierPressed.value = true
      }
    }
  }

  const handleKeyUp = (event) => {
    if (requireModifierForActions.value) {
      // 当 Ctrl 或 Alt 键释放时，检查是否还有其他修饰键被按下
      if (!event.ctrlKey && !event.altKey) {
        isModifierPressed.value = false
      } else if (event.ctrlKey || event.altKey) {
        // 如果还有其他修饰键被按下，保持状态
        isModifierPressed.value = true
      }
    }
  }

  // 添加事件监听器
  const addEventListeners = () => {
    document.addEventListener('keydown', handleKeyDown)
    document.addEventListener('keyup', handleKeyUp)
  }

  // 移除事件监听器
  const removeEventListeners = () => {
    document.removeEventListener('keydown', handleKeyDown)
    document.removeEventListener('keyup', handleKeyUp)
  }

  // 监听需要修饰键配置的变化，动态添加/移除监听器
  watch(requireModifierForActions, (newVal) => {
    if (newVal) {
      // 配置开启：添加监听器
      addEventListeners()
    } else {
      // 配置关闭：移除监听器并重置状态
      removeEventListeners()
      isModifierPressed.value = false
    }
  })

  // 生命周期：根据初始配置添加键盘事件监听
  onMounted(() => {
    if (requireModifierForActions.value) {
      addEventListeners()
    }
  })

  onUnmounted(() => {
    removeEventListeners()
  })

  return {
    isModifierPressed,
    requireModifierForActions
  }
}

