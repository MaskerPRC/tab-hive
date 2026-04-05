<template>
  <Transition name="panel-fade">
    <div v-if="visible" class="content-script-overlay" @mousedown="handleOverlayMouseDown" @click="handleOverlayClick">
      <div class="content-script-panel" @click.stop @mousedown.stop>
        <!-- 头部 -->
        <div class="panel-header">
          <div class="header-title">
            <span class="header-icon">🎯</span>
            <h3>{{ $t('contentScript.title') }}</h3>
          </div>
          <button @click="$emit('close')" class="close-btn" :title="$t('common.close')">✕</button>
        </div>

        <!-- 标签页导航 -->
        <div class="panel-tabs">
          <button
            v-for="tab in tabs"
            :key="tab.id"
            :class="['tab-btn', { active: activeTab === tab.id }]"
            @click="activeTab = tab.id"
          >
            <span class="tab-icon">{{ tab.icon }}</span>
            <span class="tab-name">{{ tab.name }}</span>
          </button>
        </div>

        <!-- 内容区域 -->
        <div class="panel-content">
          <HighlightTab v-if="activeTab === 'highlight'" :target-iframe="targetIframe" />
          <ExtractTab v-if="activeTab === 'extract'" :target-iframe="targetIframe" />
          <ActionsTab v-if="activeTab === 'actions'" :target-iframe="targetIframe" />
          <CustomScriptTab v-if="activeTab === 'custom'" :target-iframe="targetIframe" />
        </div>

        <!-- 执行历史 -->
        <ExecutionHistory :results="executionResults" @clear="clearHistory" />
      </div>
    </div>
  </Transition>
</template>

<script>
import { ref, computed, provide } from 'vue'
import { useI18n } from 'vue-i18n'
import { useContentScriptExecutor } from '../composables/useContentScriptExecutor'
import HighlightTab from './ContentScriptPanel/HighlightTab.vue'
import ExtractTab from './ContentScriptPanel/ExtractTab.vue'
import ActionsTab from './ContentScriptPanel/ActionsTab.vue'
import CustomScriptTab from './ContentScriptPanel/CustomScriptTab.vue'
import ExecutionHistory from './ContentScriptPanel/ExecutionHistory.vue'

export default {
  name: 'ContentScriptPanel',
  components: {
    HighlightTab,
    ExtractTab,
    ActionsTab,
    CustomScriptTab,
    ExecutionHistory
  },
  props: {
    visible: {
      type: Boolean,
      default: false
    },
    targetIframe: {
      type: Object,
      default: null
    }
  },
  emits: ['close'],
  setup(props, { emit }) {
    const { t } = useI18n()
    const executor = useContentScriptExecutor()
    const mouseDownOnOverlay = ref(false)

    // 共享 executor 给子组件
    provide('contentScriptExecutor', executor)

    // 处理遮罩层点击
    const handleOverlayMouseDown = (event) => {
      if (event.target === event.currentTarget) {
        mouseDownOnOverlay.value = true
      } else {
        mouseDownOnOverlay.value = false
      }
    }

    const handleOverlayClick = (event) => {
      if (event.target === event.currentTarget && mouseDownOnOverlay.value) {
        emit('close')
      }
      mouseDownOnOverlay.value = false
    }

    // 标签页
    const tabs = computed(() => [
      { id: 'highlight', name: t('contentScript.tabs.highlight'), icon: '✨' },
      { id: 'extract', name: t('contentScript.tabs.extract'), icon: '📊' },
      { id: 'actions', name: t('contentScript.tabs.actions'), icon: '⚡' },
      { id: 'custom', name: t('contentScript.tabs.custom'), icon: '💻' }
    ])
    const activeTab = ref('highlight')

    const executionResults = computed(() => executor.executionResults.value)

    const clearHistory = () => {
      executor.clearResults()
    }

    return {
      tabs,
      activeTab,
      executionResults,
      clearHistory,
      handleOverlayMouseDown,
      handleOverlayClick
    }
  }
}
</script>

<style scoped>
/* 遮罩层 */
.content-script-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10100;
  animation: fadeIn 0.2s ease-out;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

/* 主面板 */
.content-script-panel {
  background: white;
  border-radius: 16px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(0, 0, 0, 0.05);
  width: 520px;
  max-width: 95vw;
  max-height: 85vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  animation: slideIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
  transform-origin: center;
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: scale(0.9) translateY(-20px);
  }
  to {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}

/* 头部 */
.panel-header {
  padding: 20px 24px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
  background: linear-gradient(135deg, var(--primary-light, #fff5f0) 0%, #ffffff 100%);
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-shrink: 0;
}

.header-title {
  display: flex;
  align-items: center;
  gap: 10px;
}

.header-icon {
  font-size: 22px;
}

.panel-header h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: var(--primary-color, #ff5c00);
  letter-spacing: -0.01em;
}

.close-btn {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  border: none;
  background: rgba(0, 0, 0, 0.05);
  color: #64748b;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
  flex-shrink: 0;
}

.close-btn:hover {
  background: rgba(255, 92, 0, 0.1);
  color: var(--primary-color, #ff5c00);
}

.close-btn:active {
  transform: scale(0.95);
}

/* 标签页 */
.panel-tabs {
  display: flex;
  background: #fafafa;
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
  padding: 0;
  flex-shrink: 0;
}

.tab-btn {
  flex: 1;
  padding: 14px 16px;
  border: none;
  background: transparent;
  cursor: pointer;
  font-size: 13px;
  font-weight: 500;
  color: #666;
  transition: all 0.2s;
  border-bottom: 3px solid transparent;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
}

.tab-icon {
  font-size: 14px;
}

.tab-btn:hover {
  background: var(--primary-light, #fff5f0);
  color: var(--primary-color, #ff5c00);
}

.tab-btn.active {
  background: white;
  color: var(--primary-color, #ff5c00);
  border-bottom-color: var(--primary-color, #ff5c00);
  font-weight: 600;
}

/* 内容区域 */
.panel-content {
  flex: 1;
  overflow-y: auto;
  padding: 24px;
  scrollbar-width: thin;
  scrollbar-color: var(--primary-color, #FF5C00) transparent;
}

.panel-content::-webkit-scrollbar {
  width: 6px;
}

.panel-content::-webkit-scrollbar-track {
  background: transparent;
}

.panel-content::-webkit-scrollbar-thumb {
  background: var(--primary-color, #FF5C00);
  border-radius: 3px;
}

.panel-content::-webkit-scrollbar-thumb:hover {
  background: var(--primary-hover, #e64e00);
}

/* 过渡动画 */
.panel-fade-enter-active,
.panel-fade-leave-active {
  transition: opacity 0.2s ease;
}

.panel-fade-enter-from,
.panel-fade-leave-to {
  opacity: 0;
}

.panel-fade-enter-active .content-script-panel {
  animation: slideIn 0.25s ease-out;
}

.panel-fade-leave-active .content-script-panel {
  animation: slideOut 0.2s ease-in;
}

@keyframes slideOut {
  from {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
  to {
    opacity: 0;
    transform: scale(0.95) translateY(-10px);
  }
}

/* 响应式 */
@media (max-width: 600px) {
  .content-script-panel {
    width: 100%;
    max-width: 100%;
    max-height: 100vh;
    border-radius: 0;
  }

  .panel-header,
  .panel-content {
    padding-left: 16px;
    padding-right: 16px;
  }

  .tab-btn {
    padding: 12px 8px;
    font-size: 12px;
  }

  .tab-name {
    display: none;
  }

  .tab-icon {
    font-size: 16px;
  }
}
</style>
