import { ref, watch, onBeforeUnmount } from 'vue'

/**
 * 自动刷新 Composable
 * 提供iframe定时刷新功能
 * 
 * @param {Object} params - 参数对象
 * @param {Ref} params.item - 网站数据（包含autoRefreshInterval字段）
 * @param {Function} params.onRefresh - 刷新回调函数
 * @returns {Object} 返回控制方法
 */
export function useAutoRefresh({ item, onRefresh }) {
  // 定时器ID
  const timerId = ref(null)
  // 剩余时间（秒）
  const remainingTime = ref(0)

  /**
   * 清除定时器
   */
  const clearTimer = () => {
    if (timerId.value) {
      clearInterval(timerId.value)
      timerId.value = null
    }
    remainingTime.value = 0
  }

  /**
   * 启动定时器
   * @param {number} interval - 刷新间隔（秒）
   */
  const startTimer = (interval) => {
    clearTimer()
    
    if (!interval || interval <= 0) {
      return
    }

    // 设置初始剩余时间
    remainingTime.value = interval

    // 每秒更新一次剩余时间
    timerId.value = setInterval(() => {
      remainingTime.value--
      
      if (remainingTime.value <= 0) {
        // 时间到，执行刷新
        if (onRefresh && typeof onRefresh === 'function') {
          onRefresh()
        }
        // 重置剩余时间
        remainingTime.value = interval
      }
    }, 1000)
  }

  /**
   * 重置定时器（从头开始计时）
   */
  const resetTimer = () => {
    const interval = item.value?.autoRefreshInterval
    if (interval && interval > 0) {
      startTimer(interval)
    }
  }

  /**
   * 暂停定时器
   */
  const pauseTimer = () => {
    clearTimer()
  }

  // 监听刷新间隔变化，自动启动或停止定时器
  watch(
    () => item.value?.autoRefreshInterval,
    (newInterval) => {
      if (newInterval && newInterval > 0) {
        startTimer(newInterval)
      } else {
        clearTimer()
      }
    },
    { immediate: true }
  )

  // 组件卸载时清除定时器
  onBeforeUnmount(() => {
    clearTimer()
  })

  return {
    // 状态
    remainingTime,
    timerId,
    // 方法
    startTimer,
    resetTimer,
    pauseTimer,
    clearTimer
  }
}

