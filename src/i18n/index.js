import { createI18n } from 'vue-i18n'
import zh from './locales/zh.js'
import en from './locales/en.js'
import es from './locales/es.js'
import pt from './locales/pt.js'
import ru from './locales/ru.js'
import ja from './locales/ja.js'
import de from './locales/de.js'
import bn from './locales/bn.js'
import hi from './locales/hi.js'
import ar from './locales/ar.js'

const messages = {
  zh,
  en,
  es,
  pt,
  ru,
  ja,
  de,
  bn,
  hi,
  ar
}

// 获取默认语言（优先从 localStorage，其次从浏览器语言）
const getDefaultLocale = () => {
  try {
    const saved = localStorage.getItem('quanshijie-locale')
    if (saved && messages[saved]) {
      return saved
    }
  } catch (e) {
    // localStorage 不可用，忽略
  }
  
  // 从浏览器语言检测
  const browserLang = navigator.language || navigator.userLanguage || 'en'
  const langCode = browserLang.split('-')[0]
  
  // 语言映射表
  const languageMap = {
    'zh': 'zh',
    'en': 'en',
    'es': 'es',
    'pt': 'pt',
    'ru': 'ru',
    'ja': 'ja',
    'de': 'de',
    'bn': 'bn',
    'hi': 'hi',
    'ar': 'ar'
  }
  
  // 如果浏览器语言在支持列表中，返回对应语言代码
  if (languageMap[langCode] && messages[languageMap[langCode]]) {
    return languageMap[langCode]
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
      localStorage.setItem('quanshijie-locale', locale)
    } catch (e) {
      // localStorage 不可用，忽略
    }
  }
}

export default i18n

