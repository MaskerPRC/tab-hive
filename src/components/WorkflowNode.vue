<template>
  <div
    class="workflow-node"
    :class="[`node-${node.type}`, { 'node-selected': isSelected }]"
    :style="nodeStyle"
    :data-node-id="node.id"
    @mousedown.stop="handleMouseDown"
    @click.stop="handleClick"
  >
    <!-- 节点头部 -->
    <div class="node-header">
      <div class="node-icon">{{ nodeIcon }}</div>
      <div class="node-title">{{ node.name }}</div>
      <button
        v-if="node.type === 'trigger' && node.canExecute"
        class="node-execute-btn"
        @click.stop="handleExecute"
        title="执行"
      >
        ▶️
      </button>
    </div>
    
    <!-- 输入端点 -->
    <div class="node-inputs">
      <div
        v-for="port in node.inputPorts || []"
        :key="port.id"
        class="node-port node-port-input"
        :class="{ 'port-action': port.portType === 'action', 'port-execution': port.portType === 'execution' }"
        :data-port-id="port.id"
        :data-port-type="port.portType || 'execution'"
        :title="port.name"
        @mousedown.stop="handlePortMouseDown($event, port, 'input')"
      >
        <div class="port-dot"></div>
        <span class="port-label">{{ port.name }}</span>
      </div>
    </div>
    
    <!-- 节点内容（根据类型显示不同内容） -->
    <div class="node-content">
      <div v-if="node.type === 'http'" class="node-config">
        <div class="config-item">
          <label>方法:</label>
          <span>{{ node.config?.method || 'GET' }}</span>
        </div>
        <div class="config-item">
          <label>URL:</label>
          <span class="config-value">{{ node.config?.url || '未设置' }}</span>
        </div>
      </div>
      <div v-else-if="node.type === 'set'" class="node-config">
        <div class="config-item">
          <span>数据设置节点</span>
        </div>
      </div>
      <div v-else-if="node.type === 'web-action'" class="node-config">
        <div class="config-item">
          <span>网页操作节点</span>
        </div>
      </div>
    </div>
    
    <!-- 输出端点 -->
    <div class="node-outputs">
      <div
        v-for="port in node.outputPorts || []"
        :key="port.id"
        class="node-port node-port-output"
        :class="{ 'port-action': port.portType === 'action', 'port-execution': port.portType === 'execution', 'port-data': port.portType === 'data' }"
        :data-port-id="port.id"
        :data-port-type="port.portType || 'execution'"
        :title="port.name"
        @mousedown.stop="handlePortMouseDown($event, port, 'output')"
      >
        <span class="port-label">{{ port.name }}</span>
        <div class="port-dot"></div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'WorkflowNode',
  props: {
    node: {
      type: Object,
      required: true
    },
    isSelected: {
      type: Boolean,
      default: false
    },
    canvasTransform: {
      type: Object,
      default: () => ({ x: 0, y: 0, zoom: 1 })
    }
  },
  emits: ['node-mousedown', 'node-click', 'port-mousedown', 'execute'],
  computed: {
    nodeStyle() {
      return {
        left: `${this.node.position.x}px`,
        top: `${this.node.position.y}px`,
        transform: `scale(${this.canvasTransform.zoom || 1})`,
        transformOrigin: 'top left'
      }
    },
    nodeIcon() {
      const icons = {
        'trigger': '⚡',
        'http': '🌐',
        'set': '📝',
        'web-action': '🖱️'
      }
      return icons[this.node.type] || '📦'
    }
  },
  methods: {
    handleMouseDown(event) {
      this.$emit('node-mousedown', event, this.node)
    },
    handleClick(event) {
      this.$emit('node-click', event, this.node)
    },
    handlePortMouseDown(event, port, direction) {
      event.preventDefault()
      event.stopPropagation()
      // 禁用文字选择
      document.body.style.userSelect = 'none'
      const handleMouseUp = () => {
        document.body.style.userSelect = ''
        document.removeEventListener('mouseup', handleMouseUp)
      }
      document.addEventListener('mouseup', handleMouseUp)
      
      this.$emit('port-mousedown', event, this.node, port, direction)
    },
    handleExecute(event) {
      event.stopPropagation()
      this.$emit('execute', this.node)
    }
  }
}
</script>

<style scoped>
.workflow-node {
  position: absolute;
  min-width: 180px;
  background: white;
  border: 2px solid #e5e7eb;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  cursor: move;
  user-select: none;
  transition: box-shadow 0.2s;
}

.workflow-node:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.workflow-node.node-selected {
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.node-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 12px;
  background: #f9fafb;
  border-bottom: 1px solid #e5e7eb;
  border-radius: 6px 6px 0 0;
}

.node-icon {
  font-size: 18px;
  flex-shrink: 0;
}

.node-title {
  flex: 1;
  font-weight: 600;
  font-size: 14px;
  color: #111827;
}

.node-execute-btn {
  padding: 4px 8px;
  background: #10b981;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
  transition: background 0.2s;
}

.node-execute-btn:hover {
  background: #059669;
}

.node-inputs,
.node-outputs {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 8px;
}

.node-port {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 4px 8px;
  border-radius: 4px;
  cursor: crosshair;
  transition: background 0.2s;
  position: relative;
}

.node-port-input {
  justify-content: flex-start;
}

.node-port-output {
  justify-content: flex-end;
}

.node-port:hover {
  background: #f3f4f6;
}

.port-dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  border: 2px solid white;
  flex-shrink: 0;
  transition: transform 0.2s;
}

.node-port-input .port-dot {
  background: #3b82f6;
  margin-left: -6px;
}

.node-port-output .port-dot {
  background: #10b981;
  margin-right: -6px;
}

.port-action .port-dot {
  background: #f59e0b;
}

.port-data .port-dot {
  background: #8b5cf6;
}

.node-port:hover .port-dot {
  transform: scale(1.3);
}

.port-label {
  font-size: 12px;
  color: #6b7280;
}

.node-content {
  padding: 8px 12px;
  min-height: 40px;
}

.node-config {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.config-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  color: #6b7280;
}

.config-item label {
  font-weight: 500;
  color: #374151;
}

.config-value {
  color: #6b7280;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 120px;
}

/* 节点类型特定样式 */
.node-trigger {
  border-left: 4px solid #f59e0b;
}

.node-http {
  border-left: 4px solid #3b82f6;
}

.node-set {
  border-left: 4px solid #8b5cf6;
}

.node-web-action {
  border-left: 4px solid #10b981;
}
</style>

