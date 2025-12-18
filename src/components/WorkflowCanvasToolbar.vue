<template>
  <div class="workflow-toolbar" :class="{ 'automation-mode': isAutomationMode }">
    <div class="toolbar-section">
      <h3 class="toolbar-title">
        {{ isAutomationMode ? '🔧 自动化视图' : '🌐 布局视图' }}
      </h3>
    </div>

    <div class="toolbar-section">
      <button
        @click="$emit('toggle-mode')"
        class="btn-mode-toggle"
        :title="isAutomationMode ? '切换到布局视图' : '切换到自动化视图'"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M3 3h7v7H3zM14 3h7v7h-7zM14 14h7v7h-7zM3 14h7v7H3z" />
        </svg>
        <span>{{ isAutomationMode ? '查看网页' : '配置工作流' }}</span>
      </button>
    </div>

    <div v-if="isAutomationMode" class="toolbar-section">
      <div class="info-hint">
        💡 提示：在自动化视图中，可以为每个网页配置数据映射和交互映射
      </div>
    </div>

    <div v-if="isAutomationMode" class="toolbar-section">
      <button
        @click="$emit('execute-workflow')"
        class="btn-execute"
        :disabled="!canExecute"
        title="执行工作流"
      >
        ▶️ 运行工作流
      </button>
    </div>

    <div class="toolbar-section">
      <button
        @click="$emit('close')"
        class="btn-close"
        title="关闭"
      >
        ✕
      </button>
    </div>
  </div>
</template>

<script>
export default {
  name: 'WorkflowCanvasToolbar',
  props: {
    isAutomationMode: {
      type: Boolean,
      default: false
    },
    canExecute: {
      type: Boolean,
      default: false
    }
  },
  emits: ['toggle-mode', 'execute-workflow', 'close']
}
</script>

<style scoped>
.workflow-toolbar {
  position: fixed;
  top: 20px;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border: 2px solid #e0e0e0;
  border-radius: 12px;
  padding: 12px 20px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  z-index: 1000;
  display: flex;
  align-items: center;
  gap: 16px;
  transition: all 0.3s;
}

.workflow-toolbar.automation-mode {
  background: rgba(76, 175, 80, 0.95);
  border-color: #4CAF50;
}

.toolbar-section {
  display: flex;
  align-items: center;
  gap: 8px;
}

.toolbar-title {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #333;
}

.automation-mode .toolbar-title {
  color: #fff;
}

.btn-mode-toggle {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  background: #4CAF50;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.2s;
}

.btn-mode-toggle:hover {
  background: #45a049;
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(76, 175, 80, 0.3);
}

.automation-mode .btn-mode-toggle {
  background: #fff;
  color: #4CAF50;
}

.automation-mode .btn-mode-toggle:hover {
  background: #f0f0f0;
}

.info-hint {
  font-size: 13px;
  color: #fff;
  background: rgba(255, 255, 255, 0.2);
  padding: 6px 12px;
  border-radius: 6px;
}

.btn-execute {
  padding: 8px 16px;
  background: #2196F3;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.2s;
}

.btn-execute:hover:not(:disabled) {
  background: #1976D2;
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(33, 150, 243, 0.3);
}

.btn-execute:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-close {
  padding: 6px 10px;
  background: #f44336;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 16px;
  transition: all 0.2s;
}

.btn-close:hover {
  background: #d32f2f;
  transform: scale(1.1);
}
</style>

