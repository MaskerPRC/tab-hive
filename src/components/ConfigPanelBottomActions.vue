<template>
  <div class="bottom-actions">
    <button
      @click="$emit('show-shared-modal')"
      class="btn-explore"
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="12" cy="12" r="10"/>
        <path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
      </svg>
      探索网友布局
    </button>
    
    <div class="action-buttons">
      <IconButton
        icon="settings"
        :label="$t('configPanel.settings') || '设置'"
        @click="$emit('open-settings')"
      />
      <IconButton
        icon="monitor"
        :label="$t('configPanel.proxy') || '代理'"
        @click="$emit('manage-proxy')"
      />
      <IconButton
        icon="help-circle"
        :label="$t('configPanel.help')"
        @click="openHelp"
      />
      <IconButton
        icon="trash-2"
        :label="$t('configPanel.clearConfig')"
        danger
        @click="$emit('clear-config')"
      />
    </div>
  </div>
</template>

<script>
import IconButton from './IconButton.vue'

export default {
  name: 'ConfigPanelBottomActions',
  components: {
    IconButton
  },
  props: {},
  emits: ['show-shared-modal', 'manage-proxy', 'clear-config', 'open-settings'],
  setup() {
    const openHelp = () => {
      if (window.top) {
        window.top.open('./help.html', '_blank', 'noopener,noreferrer')
      } else {
        window.open('./help.html', '_blank', 'noopener,noreferrer')
      }
    }

    return {
      openHelp
    }
  }
}
</script>

<style scoped>
.bottom-actions {
  padding: 1rem;
  border-top: 1px solid #f1f5f9;
  background: white;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  flex-shrink: 0;
  z-index: 10;
}

.btn-explore {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  background: #1e293b;
  color: white;
  padding: 0.625rem;
  border-radius: 0.5rem;
  font-size: 0.875rem;
  font-weight: 500;
  border: none;
  cursor: pointer;
  transition: all 0.2s;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
}

.btn-explore:hover {
  background: #0f172a;
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
}

.btn-explore svg {
  width: 1rem;
  height: 1rem;
}

.action-buttons {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 0.5rem;
}
</style>


