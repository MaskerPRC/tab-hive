<template>
  <Teleport to="body">
    <div v-if="show" class="more-menu" :style="menuStyle" @click.stop>
      <button class="more-menu-item" @click.stop="handleCopy">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
        </svg>
        <span>{{ $t('floatingActions.copy') || '复制' }}</span>
      </button>
      <button 
        v-if="!isDesktopCapture && !isCustomHtml" 
        class="more-menu-item" 
        :class="{ 'has-active-rules': hasActiveRules }"
        @click.stop="handleMonitoring"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
          <circle cx="12" cy="12" r="3"/>
        </svg>
        <span>监听规则</span>
        <span v-if="activeRulesCount > 0" class="rules-badge">{{ activeRulesCount }}</span>
      </button>
      <button v-if="customCodeEnabled" class="more-menu-item" @click.stop="handleScript">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="16 18 22 12 16 6"/>
          <polyline points="8 6 2 12 8 18"/>
        </svg>
        <span>{{ $t('floatingActions.script') || '脚本' }}</span>
      </button>
      <button v-if="isElectron && !isDesktopCapture" class="more-menu-item" @click.stop="handleDevTools">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="4 17 10 11 4 5"></polyline>
          <line x1="12" y1="19" x2="20" y2="19"></line>
        </svg>
        <span>{{ $t('floatingActions.devtools') || '开发者工具' }}</span>
      </button>
      <button class="more-menu-item" @click.stop="handleEdit">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
        </svg>
        <span>{{ $t('floatingActions.edit') || '编辑' }}</span>
      </button>
      <div class="more-menu-divider"></div>
      <button class="more-menu-item danger" @click.stop="handleRemove">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="3 6 5 6 21 6"/>
          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
        </svg>
        <span>{{ $t('floatingActions.remove') || '删除' }}</span>
      </button>
    </div>
  </Teleport>
</template>

<script>
import { computed } from 'vue'

export default {
  name: 'WebsiteCardMoreMenu',
  props: {
    show: {
      type: Boolean,
      default: false
    },
    menuStyle: {
      type: Object,
      default: () => ({})
    },
    customCodeEnabled: {
      type: Boolean,
      default: true
    },
    isElectron: {
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
    activeRulesCount: {
      type: Number,
      default: 0
    }
  },
  emits: ['copy', 'script', 'devtools', 'edit', 'remove', 'close', 'monitoring'],
  setup(props, { emit }) {
    const hasActiveRules = computed(() => props.activeRulesCount > 0)
    
    const handleCopy = () => {
      emit('close')
      emit('copy')
    }

    const handleScript = () => {
      emit('close')
      emit('script')
    }

    const handleDevTools = () => {
      emit('close')
      emit('devtools')
    }

    const handleEdit = () => {
      emit('close')
      emit('edit')
    }

    const handleRemove = () => {
      emit('close')
      emit('remove')
    }

    const handleMonitoring = () => {
      emit('close')
      emit('monitoring')
    }

    return {
      hasActiveRules,
      handleCopy,
      handleScript,
      handleDevTools,
      handleEdit,
      handleRemove,
      handleMonitoring
    }
  }
}
</script>

<style scoped>
.more-menu {
  position: fixed;
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 0.5rem;
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
  min-width: 10rem;
  z-index: 10000;
  padding: 0.25rem;
  pointer-events: auto;
}

.more-menu-item {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0.75rem;
  background: transparent;
  border: none;
  border-radius: 0.375rem;
  color: #475569;
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.2s;
  text-align: left;
}

.more-menu-item:hover {
  background: #f1f5f9;
  color: #1e293b;
}

.more-menu-item.danger {
  color: #dc2626;
}

.more-menu-item.danger:hover {
  background: #fef2f2;
  color: #b91c1c;
}

.more-menu-item svg {
  flex-shrink: 0;
}

.more-menu-divider {
  height: 1px;
  background: #e2e8f0;
  margin: 0.25rem 0;
}

.more-menu-item.has-active-rules {
  color: #16a34a;
  font-weight: 500;
}

.more-menu-item.has-active-rules:hover {
  background: #f0fdf4;
  color: #15803d;
}

.rules-badge {
  margin-left: auto;
  background: #16a34a;
  color: white;
  font-size: 0.75rem;
  font-weight: 600;
  min-width: 1.25rem;
  height: 1.25rem;
  border-radius: 0.625rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0 0.375rem;
}
</style>

