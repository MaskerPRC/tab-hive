<template>
  <div class="language-selector-item">
    <div class="language-selector-left">
      <span class="language-icon">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="10"/>
          <line x1="2" y1="12" x2="22" y2="12"/>
          <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
        </svg>
      </span>
      <span class="language-label">{{ $t('configPanel.language') }}</span>
    </div>
    <select
      :value="currentLocale"
      @change="handleLanguageChange($event.target.value)"
      class="language-select"
      :title="$t('configPanel.languageHint')"
    >
      <option value="zh">🇨🇳 中文</option>
      <option value="en">🇺🇸 English</option>
      <option value="es">🇪🇸 Español</option>
      <option value="bn">🇧🇩 বাংলা</option>
      <option value="hi">🇮🇳 हिन्दी</option>
      <option value="ar">🇸🇦 العربية</option>
      <option value="pt">🇧🇷 Português</option>
      <option value="ru">🇷🇺 Русский</option>
      <option value="ja">🇯🇵 日本語</option>
      <option value="de">🇩🇪 Deutsch</option>
    </select>
  </div>
</template>

<script>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { setLocale } from '../i18n/index.js'

export default {
  name: 'LanguageSelector',
  setup() {
    const { locale } = useI18n()
    const currentLocale = computed(() => locale.value)

    const handleLanguageChange = (newLocale) => {
      setLocale(newLocale)
    }

    return {
      currentLocale,
      handleLanguageChange
    }
  }
}
</script>

<style scoped>
.language-selector-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.5rem 0;
}

.language-selector-left {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #475569;
}

.language-icon {
  color: #94a3b8;
  display: flex;
  align-items: center;
}

.language-label {
  font-size: 0.875rem;
  font-weight: 500;
}

.language-select {
  flex-shrink: 0;
  padding: 0.25rem 0.5rem;
  border: 1px solid #cbd5e1;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  font-weight: 500;
  color: #475569;
  background: white;
  cursor: pointer;
  transition: all 0.2s;
  outline: none;
  font-family: inherit;
  min-width: 100px;
}

.language-select:hover {
  border-color: #f97316;
  background: #fff7ed;
}

.language-select:focus {
  border-color: #f97316;
  box-shadow: 0 0 0 3px rgba(249, 115, 22, 0.1);
}
</style>

