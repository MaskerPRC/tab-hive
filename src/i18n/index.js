import { createI18n } from 'vue-i18n'
import zh from './locales/zh.js'
import en from './locales/en.js'

const messages = {
  zh,
  en
}

// 获取默认语言（优先从 localStorage，其次从浏览器语言）
const getDefaultLocale = () => {
  try {
    const saved = localStorage.getItem('tab-hive-locale')
    if (saved && messages[saved]) {
      return saved
    }
  } catch (e) {
    // localStorage 不可用，忽略
  }
  
  // 从浏览器语言检测
  const browserLang = navigator.language || navigator.userLanguage || 'en'
  const langCode = browserLang.split('-')[0]
  
  // 如果浏览器语言是中文，返回 zh，否则返回 en
  if (langCode === 'zh') {
    return 'zh'
  }
  
  // 默认返回英文
  return 'en'
}

const i18n = createI18n({
  locale: getDefaultLocale(),
  fallbackLocale: 'en',
  messages,
  legacy: false, // 使用 Composition API 模式
  globalInjection: true // 全局注入 $t 方法
})

// 导出切换语言的方法
export const setLocale = (locale) => {
  if (messages[locale]) {
    i18n.global.locale.value = locale
    try {
      localStorage.setItem('tab-hive-locale', locale)
    } catch (e) {
      // localStorage 不可用，忽略
    }
  }
}

export default i18n

