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
  // 暂停时保存的剩余时间
  const pausedRemainingTime = ref(0)
  // 是否已暂停
  const isPaused = ref(false)

  /**
   * 清除定时器
   */
  const clearTimer = () => {
    if (timerId.value) {
      clearInterval(timerId.value)
      timerId.value = null
    }
    remainingTime.value = 0
    pausedRemainingTime.value = 0
    isPaused.value = false
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
   * 暂停定时器（保存剩余时间）
   */
  const pauseTimer = () => {
    if (timerId.value && remainingTime.value > 0) {
      // 保存当前剩余时间
      pausedRemainingTime.value = remainingTime.value
      isPaused.value = true
      
      // 清除定时器但不重置剩余时间
      clearInterval(timerId.value)
      timerId.value = null
      
      console.log('[Auto Refresh] 定时器已暂停，剩余时间:', pausedRemainingTime.value)
    }
  }

  /**
   * 恢复定时器（从暂停的时间继续）
   */
  const resumeTimer = () => {
    if (isPaused.value && pausedRemainingTime.value > 0) {
      console.log('[Auto Refresh] 恢复定时器，从剩余时间继续:', pausedRemainingTime.value)
      
      // 恢复剩余时间
      remainingTime.value = pausedRemainingTime.value
      isPaused.value = false
      
      // 重新启动定时器
      timerId.value = setInterval(() => {
        remainingTime.value--
        
        if (remainingTime.value <= 0) {
          // 时间到，执行刷新
          if (onRefresh && typeof onRefresh === 'function') {
            onRefresh()
          }
          // 重置剩余时间
          const interval = item.value?.autoRefreshInterval
          remainingTime.value = interval || 0
        }
      }, 1000)
    }
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
    isPaused,
    // 方法
    startTimer,
    resetTimer,
    pauseTimer,
    resumeTimer,
    clearTimer
  }
}

