<template>
  <div v-if="show" class="url-change-hint">
    <button class="btn-use-current-url" @click="handleClick"       :title="$t('urlChangeHint.useCurrentUrl')">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
        <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
      </svg>
      <span>{{ $t('urlChangeHint.useThisPage') }}</span>
    </button>
  </div>
</template>

<script>
import { useI18n } from 'vue-i18n'

export default {
  name: 'UrlChangeHint',
  props: {
    show: {
      type: Boolean,
      default: false
    }
  },
  emits: ['use-current-url'],
  setup(props, { emit }) {
    const { t } = useI18n()
    
    const handleClick = () => {
      emit('use-current-url')
    }

    return {
      handleClick
    }
  }
}
</script>

<style scoped>
.url-change-hint {
  position: absolute;
  bottom: 8px;
  left: 8px;
  z-index: 100;
  opacity: 0;
  transition: opacity 0.3s ease;
}

.btn-use-current-url {
  display: flex;
  align-items: center;
  gap: 6px;
  background: rgba(59, 130, 246, 0.9);
  color: white;
  padding: 8px 12px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 600;
  box-shadow: 0 2px 8px rgba(59, 130, 246, 0.3);
  backdrop-filter: blur(4px);
  transition: all 0.3s ease;
  border: none;
  cursor: pointer;
}

.btn-use-current-url:hover {
  background: rgba(37, 99, 235, 0.95);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4);
}

.btn-use-current-url svg {
  width: 16px;
  height: 16px;
}

.btn-use-current-url span {
  line-height: 1;
}
</style>

