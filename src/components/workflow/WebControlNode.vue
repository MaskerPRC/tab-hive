<template>
  <div
    class="workflow-node control-node"
    :style="nodeStyle"
    @mousedown="$emit('start-drag', $event)"
  >
    <div class="node-header">
      <span class="node-icon">⚡</span>
      <input
        v-model="localName"
        class="node-title-input"
        @click.stop
        @change="$emit('update:name', localName)"
      />
      <button @click="$emit('delete')" class="node-delete">×</button>
    </div>

    <div class="node-body">
      <!-- 输入端口 -->
      <div class="ports-section">
        <div
          v-for="port in node.inputPorts"
          :key="port.id"
          class="port-item input-port"
        >
          <div
            class="port-dot input"
            :data-node-id="node.id"
            :data-port-id="port.id"
            :data-port-type="'input'"
            @mousedown="handlePortMouseDown($event, port.id, 'input')"
          >
            ◀
          </div>
          <span class="port-label">{{ port.name }}</span>
        </div>
      </div>

      <!-- 交互控制（显示已配置的） -->
      <div class="action-controls-section">
        <div
          v-for="ctrl in configuredControls"
          :key="ctrl.id"
          class="action-control-item"
        >
          <span class="control-label">{{ ctrl.name }}</span>
          <span class="control-target">
            → {{ getActionTargetName(ctrl) }}
          </span>
        </div>
      </div>

      <!-- 输出端口 -->
      <div class="ports-section">
        <div
          v-for="port in node.outputPorts"
          :key="port.id"
          class="port-item output-port"
          :class="{ 'result-port': port.isFixed }"
        >
          <span class="port-label">
            {{ port.isFixed ? '📊 ' : '' }}{{ port.name }}
          </span>
          <div
            class="port-dot output"
            :data-node-id="node.id"
            :data-port-id="port.id"
            :data-port-type="'output'"
            @mousedown="handlePortMouseDown($event, port.id, 'output')"
          >
            ▶
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, watch } from 'vue'

export default {
  name: 'WebControlNode',
  props: {
    node: {
      type: Object,
      required: true
    }
  },
  emits: ['start-drag', 'delete', 'update:name', 'port-mousedown'],
  setup(props, { emit }) {
    const localName = ref(props.node.name)

    watch(() => props.node.name, (newVal) => {
      localName.value = newVal
    })

    const nodeStyle = computed(() => ({
      left: `${props.node.position.x}px`,
      top: `${props.node.position.y}px`
    }))

    const configuredControls = computed(() => {
      return props.node.actionControls.filter(c => c.targetNodeId)
    })

    const handlePortMouseDown = (event, portId, portType) => {
      emit('port-mousedown', event, props.node.id, portId, portType)
    }

    const getActionTargetName = (ctrl) => {
      // TODO: 获取目标动作名称
      return '交互操作'
    }

    return {
      localName,
      nodeStyle,
      configuredControls,
      handlePortMouseDown,
      getActionTargetName
    }
  }
}
</script>

<style scoped>
.workflow-node {
  position: absolute;
  background: rgba(255, 255, 255, 0.98);
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  min-width: 220px;
  cursor: move;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  backdrop-filter: blur(10px);
}

.dark-mode .workflow-node {
  background: rgba(45, 45, 45, 0.98);
  border-color: #444;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
}

.control-node {
  border-color: #ff9800;
}

.node-header {
  padding: 12px;
  border-bottom: 1px solid #e0e0e0;
  display: flex;
  align-items: center;
  gap: 8px;
  background: rgba(0, 0, 0, 0.02);
}

.dark-mode .node-header {
  border-bottom-color: #444;
  background: rgba(255, 255, 255, 0.02);
}

.node-icon {
  font-size: 18px;
}

.node-title-input {
  flex: 1;
  border: none;
  background: transparent;
  font-weight: 600;
  font-size: 14px;
  color: inherit;
  padding: 4px;
  cursor: text;
}

.node-title-input:focus {
  outline: 1px solid #4CAF50;
  border-radius: 4px;
}

.node-delete {
  background: none;
  border: none;
  font-size: 20px;
  color: #999;
  cursor: pointer;
  padding: 0;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
}

.node-delete:hover {
  background: rgba(244, 67, 54, 0.1);
  color: #f44336;
}

.node-body {
  padding: 12px;
}

.ports-section {
  margin-bottom: 8px;
}

.port-item {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 4px 0;
  font-size: 12px;
}

.port-dot {
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  font-size: 14px;
  user-select: none;
}

.port-dot.input,
.port-dot.output {
  color: #4CAF50;
}

.port-label {
  flex: 1;
}

.action-controls-section {
  margin: 8px 0;
  padding: 8px;
  background: rgba(255, 152, 0, 0.05);
  border-radius: 4px;
  font-size: 12px;
}

.action-control-item {
  display: flex;
  justify-content: space-between;
  padding: 4px 0;
}

.control-label {
  font-weight: 500;
}

.control-target {
  color: #666;
  font-size: 11px;
}

.dark-mode .control-target {
  color: #aaa;
}

.result-port {
  background: rgba(33, 150, 243, 0.05);
  padding: 6px;
  border-radius: 4px;
}
</style>

