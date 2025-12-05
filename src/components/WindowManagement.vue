<template>
  <div class="window-management">
    <div class="window-management-header">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="window-management-icon">
        <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
      </svg>
      <span class="window-management-title">{{ $t('configPanel.windowManagement') }}</span>
    </div>

    <button
      @click="handleCreateNewWindow"
      class="btn-create-window"
      :title="$t('configPanel.createNewWindowHint')"
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <line x1="12" y1="5" x2="12" y2="19"/>
        <line x1="5" y1="12" x2="19" y2="12"/>
      </svg>
      <span>{{ $t('configPanel.createNewWindow') }}</span>
    </button>

    <div v-if="windowManager.windows.value.length > 1" class="window-list">
      <div class="window-list-title">{{ $t('configPanel.allWindows') }} ({{ windowManager.windows.value.length }})</div>
      <div class="window-list-items">
        <button
          v-for="win in windowManager.windows.value"
          :key="win.id"
          @click="handleSwitchWindow(win.id)"
          class="window-item"
          :class="{ 'active': win.id === windowManager.currentWindowId.value }"
          :title="`${$t('configPanel.switchToWindow')} ${win.id}`"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
          </svg>
          <span class="window-item-text">{{ $t('configPanel.window') }} {{ win.id }}</span>
          <span v-if="win.id === windowManager.currentWindowId.value" class="current-badge">{{ $t('configPanel.current') }}</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script>
import { useWindowManager } from '../composables/useWindowManager'

export default {
  name: 'WindowManagement',
  setup() {
    const windowManager = useWindowManager()

    const handleCreateNewWindow = async () => {
      const result = await windowManager.createNewWindow()
      if (result.success) {
        console.log('[WindowManagement] ✓ 新窗口已创建')
      }
    }

    const handleSwitchWindow = async (windowId) => {
      await windowManager.switchToWindow(windowId)
    }

    return {
      windowManager,
      handleCreateNewWindow,
      handleSwitchWindow
    }
  }
}
</script>

<style scoped>
.window-management {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  padding: 0 0.5rem;
  margin-top: 0.5rem;
  flex-shrink: 0;
}

.window-management-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.25rem;
}

.window-management-icon {
  color: #94a3b8;
  flex-shrink: 0;
}

.window-management-title {
  font-size: 0.75rem;
  font-weight: 600;
  color: #94a3b8;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.btn-create-window {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.625rem 0.75rem;
  background: #fff7ed;
  border: 1px solid #fed7aa;
  border-radius: 0.5rem;
  color: #ea580c;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  font-family: inherit;
}

.btn-create-window:hover {
  background: #ffedd5;
  border-color: #f97316;
  color: #c2410c;
  transform: translateY(-1px);
  box-shadow: 0 2px 4px rgba(249, 115, 22, 0.2);
}

.btn-create-window svg {
  stroke: currentColor;
  flex-shrink: 0;
}

.window-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-top: 0.5rem;
}

.window-list-title {
  font-size: 0.75rem;
  color: #94a3b8;
  font-weight: 500;
  padding: 0.25rem 0.5rem;
}

.window-list-items {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.window-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.625rem 0.75rem;
  border-radius: 0.5rem;
  cursor: pointer;
  font-size: 0.875rem;
  font-weight: 500;
  font-family: inherit;
  transition: all 0.2s;
  border: 1px solid transparent;
  background: transparent;
  color: #475569;
}

.window-item:hover {
  background: #f1f5f9;
  color: #f97316;
}

.window-item.active {
  background: #fff7ed;
  border-color: #fed7aa;
  color: #ea580c;
  box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
}

.window-item svg {
  stroke: currentColor;
  flex-shrink: 0;
}

.window-item-text {
  flex: 1;
}

.current-badge {
  font-size: 0.625rem;
  padding: 0.125rem 0.375rem;
  background: #f97316;
  color: white;
  border-radius: 0.25rem;
  font-weight: 600;
  flex-shrink: 0;
}
</style>

