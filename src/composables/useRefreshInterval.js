import { ref } from 'vue'

/**
 * 自动刷新间隔时间管理
 * 提供时间单位转换、预设值等功能
 */
export function useRefreshInterval(initialSeconds = 0) {
  // 自定义时间值和单位
  const customValue = ref(0)
  const timeUnit = ref('seconds')

  // 常用预设（单位：秒）
  const presets = [
    { label: '不刷新', value: 0 },
    { label: '30秒', value: 30 },
    { label: '1分钟', value: 60 },
    { label: '5分钟', value: 300 },
    { label: '30分钟', value: 1800 },
    { label: '1小时', value: 3600 },
    { label: '1天', value: 86400 }
  ]

  // 时间单位转换为秒的系数
  const unitToSeconds = {
    seconds: 1,
    minutes: 60,
    hours: 3600,
    days: 86400
  }

  /**
   * 将秒转换为最合适的单位和值
   */
  const convertSecondsToUnit = (seconds) => {
    if (seconds === 0) {
      return { value: 0, unit: 'seconds' }
    }
    
    // 尝试从大到小的单位
    if (seconds >= 86400 && seconds % 86400 === 0) {
      return { value: seconds / 86400, unit: 'days' }
    }
    if (seconds >= 3600 && seconds % 3600 === 0) {
      return { value: seconds / 3600, unit: 'hours' }
    }
    if (seconds >= 60 && seconds % 60 === 0) {
      return { value: seconds / 60, unit: 'minutes' }
    }
    return { value: seconds, unit: 'seconds' }
  }

  /**
   * 将自定义值和单位转换为秒
   */
  const convertToSeconds = (value, unit) => {
    return (value || 0) * unitToSeconds[unit]
  }

  /**
   * 判断预设是否被激活
   */
  const isPresetActive = (presetValue, currentValue) => {
    return currentValue === presetValue
  }

  // 初始化
  const converted = convertSecondsToUnit(initialSeconds)
  customValue.value = converted.value
  timeUnit.value = converted.unit

  return {
    presets,
    customValue,
    timeUnit,
    unitToSeconds,
    convertSecondsToUnit,
    convertToSeconds,
    isPresetActive
  }
}

