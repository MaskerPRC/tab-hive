<template>
  <div class="window-title-bar">
    <div class="title-bar-left">
      <img 
        v-if="faviconUrl" 
        :src="faviconUrl" 
        class="title-bar-icon" 
        alt="icon"
        @error="handleFaviconError"
      />
      <div v-else class="title-bar-icon-fallback">
        <span class="icon-fallback-text">{{ initialLetter }}</span>
      </div>
      <div class="title-bar-info">
        <span class="title-bar-text">{{ title || '未命名' }}</span>
        <span v-if="displayUrl" class="title-bar-url">{{ displayUrl }}</span>
      </div>
    </div>
    <div class="title-bar-actions">
      <!-- 导航按钮 -->
      <button
        v-if="!isDesktopCapture && !isCustomHtml"
        class="title-bar-btn"
        :class="{ 'disabled': !canGoBack }"
        @click="$emit('go-back')"
        :disabled="!canGoBack"
        :title="$t('floatingActions.goBack') || '后退'"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="15 18 9 12 15 6"/>
        </svg>
      </button>
      <button
        v-if="!isDesktopCapture && !isCustomHtml"
        class="title-bar-btn"
        :class="{ 'disabled': !canGoForward }"
        @click="$emit('go-forward')"
        :disabled="!canGoForward"
        :title="$t('floatingActions.goForward') || '前进'"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="9 18 15 12 9 6"/>
        </svg>
      </button>
      <!-- 刷新按钮 -->
      <button
        v-if="!isDesktopCapture && !isCustomHtml"
        class="title-bar-btn"
        @click="$emit('refresh')"
        :title="$t('floatingActions.refresh') || '刷新'"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="23 4 23 10 17 10"/>
          <polyline points="1 20 1 14 7 14"/>
          <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
        </svg>
      </button>
      <!-- 静音按钮 -->
      <button
        class="title-bar-btn"
        :class="{ 'active': muted }"
        @click="$emit('toggle-mute')"
        :title="muted ? ($t('floatingActions.unmute') || '取消静音') : ($t('floatingActions.mute') || '静音')"
      >
        <svg v-if="muted" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
          <line x1="23" y1="9" x2="17" y2="15"/>
          <line x1="17" y1="9" x2="23" y2="15"/>
        </svg>
        <svg v-else width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
          <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"/>
        </svg>
      </button>
      <!-- 全屏按钮 -->
      <button
        class="title-bar-btn"
        @click="$emit('fullscreen')"
        :title="$t('floatingActions.fullscreen') || '全屏查看'"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"/>
        </svg>
      </button>
      <!-- 更多操作菜单 -->
      <div class="title-bar-more">
        <button
          class="title-bar-btn"
          @click.stop.prevent="toggleMoreMenu"
          title="更多操作"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="1"/>
            <circle cx="19" cy="12" r="1"/>
            <circle cx="5" cy="12" r="1"/>
          </svg>
        </button>
        <WebsiteCardMoreMenu
          :show="showMoreMenu"
          :menu-style="moreMenuStyle"
          :custom-code-enabled="customCodeEnabled"
          :is-electron="isElectron"
          :is-desktop-capture="isDesktopCapture"
          :is-custom-html="isCustomHtml"
          :active-rules-count="activeRulesCount"
          @close="showMoreMenu = false"
          @copy="$emit('copy')"
          @workflow="() => { console.log('[TitleBar] 接收到 workflow 事件，向上传递'); $emit('workflow') }"
          @script="$emit('open-script-panel')"
          @devtools="$emit('open-devtools')"
          @edit="$emit('edit')"
          @remove="$emit('remove')"
          @monitoring="$emit('monitoring')"
        />
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, watch, onUnmounted, nextTick } from 'vue'
import WebsiteCardMoreMenu from './WebsiteCardMoreMenu.vue'

export default {
  name: 'WebsiteCardTitleBar',
  components: {
    WebsiteCardMoreMenu
  },
  props: {
    title: {
      type: String,
      default: ''
    },
    url: {
      type: String,
      default: ''
    },
    favicon: {
      type: String,
      default: ''
    },
    muted: {
      type: Boolean,
      default: false
    },
    canGoBack: {
      type: Boolean,
      default: false
    },
    canGoForward: {
      type: Boolean,
      default: false
    },
    isDesktopCapture: {
      type: Boolean,
      default: false
    },
    isCustomHtml: {
      type: Boolean,
      default: false
    },
    customCodeEnabled: {
      type: Boolean,
      default: true
    },
    isElectron: {
      type: Boolean,
      default: false
    },
    activeRulesCount: {
      type: Number,
      default: 0
    }
  },
  emits: ['go-back', 'go-forward', 'refresh', 'toggle-mute', 'copy', 'workflow', 'open-script-panel', 'edit', 'fullscreen', 'remove', 'open-devtools', 'monitoring'],
  setup(props) {
    const showMoreMenu = ref(false)
    const moreMenuStyle = ref({})
    const faviconError = ref(false)

    // 获取favicon URL
    const faviconUrl = computed(() => {
      if (faviconError.value) return null
      if (props.favicon) {
        return props.favicon
      }
      if (props.url) {
        try {
          const url = new URL(props.url)
          return `${url.protocol}//${url.host}/favicon.ico`
        } catch (e) {
          return null
        }
      }
      return null
    })

    // 获取首字母作为图标
    const initialLetter = computed(() => {
      const text = props.title || props.url || '?'
      return text.charAt(0).toUpperCase()
    })

    // 显示URL（简化显示）
    const displayUrl = computed(() => {
      if (!props.url || props.isDesktopCapture || props.isCustomHtml) return ''
      try {
        const url = new URL(props.url)
        return url.hostname + (url.pathname !== '/' ? url.pathname : '')
      } catch (e) {
        return props.url
      }
    })

    // 处理favicon加载错误
    const handleFaviconError = () => {
      faviconError.value = true
    }

    // 切换更多菜单
    const toggleMoreMenu = (event) => {
      if (event) {
        event.stopPropagation()
        event.preventDefault()
      }
      const newValue = !showMoreMenu.value
      showMoreMenu.value = newValue
      
      // 如果打开菜单，计算菜单位置
      if (newValue && event) {
        nextTick(() => {
          const moreBtn = event.target.closest('.title-bar-more')?.querySelector('.title-bar-btn')
          if (moreBtn) {
            const rect = moreBtn.getBoundingClientRect()
            
            // 估算菜单高度（根据菜单项数量）
            // 每个菜单项约 36px，加上 padding 8px
            const estimatedMenuHeight = 250 // 保守估计最大高度
            
            // 计算可用空间
            const spaceBelow = window.innerHeight - rect.bottom
            const spaceAbove = rect.top
            
            // 决定菜单显示在按钮上方还是下方
            let top
            if (spaceBelow >= estimatedMenuHeight || spaceBelow >= spaceAbove) {
              // 空间足够或下方空间更大，显示在下方
              top = `${rect.bottom + 4}px`
            } else {
              // 下方空间不足，显示在上方
              // 菜单会向上展开，bottom 设置为窗口高度减去按钮顶部位置
              top = 'auto'
              moreMenuStyle.value = {
                bottom: `${window.innerHeight - rect.top + 4}px`,
                right: `${window.innerWidth - rect.right}px`
              }
              return
            }
            
            moreMenuStyle.value = {
              top,
              right: `${window.innerWidth - rect.right}px`
            }
          }
        })
      } else {
        moreMenuStyle.value = {}
      }
    }

    // 点击外部关闭菜单
    const handleClickOutside = (event) => {
      if (!event.target.closest('.title-bar-more')) {
        showMoreMenu.value = false
      }
    }

    // 监听点击事件
    watch(showMoreMenu, (isOpen) => {
      if (isOpen) {
        document.addEventListener('click', handleClickOutside)
      } else {
        document.removeEventListener('click', handleClickOutside)
      }
    })

    // 组件卸载时清理
    onUnmounted(() => {
      document.removeEventListener('click', handleClickOutside)
    })

    return {
      showMoreMenu,
      moreMenuStyle,
      faviconUrl,
      initialLetter,
      displayUrl,
      handleFaviconError,
      toggleMoreMenu
    }
  }
}
</script>

<style scoped>
.window-title-bar {
  height: 2.5rem;
  background: #f8fafc;
  border-bottom: 1px solid #e2e8f0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 0.75rem;
  flex-shrink: 0;
  gap: 0.75rem;
  position: relative;
  z-index: 100;
}

.title-bar-left {
  cursor: move;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex: 1;
  min-width: 0;
}

.title-bar-icon {
  width: 1rem;
  height: 1rem;
  flex-shrink: 0;
  border-radius: 0.125rem;
}

.title-bar-icon-fallback {
  width: 1rem;
  height: 1rem;
  border-radius: 0.125rem;
  background: #3b82f6;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 0.625rem;
  font-weight: 600;
  flex-shrink: 0;
}

.icon-fallback-text {
  line-height: 1;
  font-size: 0.625rem;
}

.title-bar-info {
  display: flex;
  flex-direction: column;
  gap: 0.125rem;
  flex: 1;
  min-width: 0;
}

.title-bar-text {
  font-size: 0.75rem;
  font-weight: 500;
  color: #1e293b;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  line-height: 1.2;
}

.title-bar-url {
  font-size: 0.625rem;
  color: #64748b;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  line-height: 1.2;
}

.title-bar-actions {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  flex-shrink: 0;
  cursor: default;
}

.title-bar-btn {
  width: 1.75rem;
  height: 1.75rem;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: none;
  border-radius: 0.25rem;
  color: #64748b;
  cursor: pointer;
  transition: all 0.2s;
  padding: 0;
  position: relative;
  z-index: 101;
  pointer-events: auto;
}

.title-bar-btn:hover:not(:disabled) {
  background: #e2e8f0;
  color: #475569;
}

.title-bar-btn:disabled,
.title-bar-btn.disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.title-bar-btn.active {
  color: #f97316;
  background: #fff7ed;
}

.title-bar-btn svg {
  width: 14px;
  height: 14px;
}

.title-bar-more {
  position: relative;
  z-index: 102;
}
</style>

