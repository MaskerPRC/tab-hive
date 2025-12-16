import { ref, watch } from 'vue'

const STORAGE_KEY = 'llm-api-config'

// 默认配置
const defaultConfig = {
  apiUrl: 'https://openrouter.ai/api/v1/chat/completions',
  apiKey: '',
  model: 'google/gemini-3-pro-preview',
  temperature: 0.7,
  maxTokens: 0
}

// 从 localStorage 加载配置
const loadConfig = () => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      const parsed = JSON.parse(saved)
      return { ...defaultConfig, ...parsed }
    }
  } catch (e) {
    console.error('[useLlmConfig] 加载配置失败:', e)
  }
  return { ...defaultConfig }
}

// 保存配置到 localStorage
const saveConfig = (config) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config))
    return true
  } catch (e) {
    console.error('[useLlmConfig] 保存配置失败:', e)
    return false
  }
}

// 单例模式：全局共享的配置实例
const config = ref(loadConfig())

// 监听配置变化并自动保存
watch(config, (newConfig) => {
  console.log('[useLlmConfig] 配置变化，自动保存:', newConfig)
  saveConfig(newConfig)
}, { deep: true })

/**
 * LLM API 配置管理（单例模式）
 */
export function useLlmConfig() {
  // 检查配置是否有效
  const isValid = () => {
    const valid = !!(config.value.apiUrl && config.value.apiKey)
    console.log('[useLlmConfig] 验证配置:', {
      apiUrl: config.value.apiUrl ? '已设置' : '未设置',
      apiKey: config.value.apiKey ? '已设置' : '未设置',
      valid
    })
    return valid
  }

  return {
    config,
    saveConfig,
    loadConfig,
    isValid
  }
}

