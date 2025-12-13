<template>
  <div
    class="workflow-node webpage-node"
    :style="nodeStyle"
    @mousedown="$emit('start-drag', $event)"
  >
    <div class="node-header">
      <span class="node-icon">🌐</span>
      <span class="node-title">{{ node.name }}</span>
      <button @click="$emit('delete')" class="node-delete">×</button>
    </div>

    <div class="node-body">
      <!-- 选择器列表 -->
      <div
        v-for="selector in node.selectorConfigs"
        :key="selector.id"
        class="selector-group"
      >
        <div class="selector-header">
          <span class="selector-name">{{ selector.elementName }}</span>
          <button
            @click="$emit('edit-selector', selector)"
            class="selector-edit"
          >
            ⚙️
          </button>
        </div>

        <!-- 数据端口 -->
        <div
          v-for="dataMapping in selector.dataMappings"
          :key="dataMapping.id"
          class="port-item data-port"
        >
          <div
            class="port-dot data"
            :data-node-id="node.id"
            :data-port-id="dataMapping.portId"
            :data-port-type="'data'"
            @mousedown="handlePortMouseDown($event, dataMapping.portId, 'data')"
          >
            ○
          </div>
          <span class="port-label">{{ dataMapping.name }}</span>
        </div>

        <!-- 交互端口 -->
        <div
          v-for="actionMapping in selector.actionMappings"
          :key="actionMapping.id"
          class="port-item action-port"
        >
          <span class="port-label">{{ actionMapping.name }}</span>
          <div
            class="port-dot action"
            :data-node-id="node.id"
            :data-port-id="actionMapping.portId"
            :data-port-type="'action'"
            @mousedown="handlePortMouseDown($event, actionMapping.portId, 'action')"
          >
            ●
          </div>
        </div>
      </div>

      <button
        @click="$emit('add-selector')"
        class="add-selector-btn"
      >
        + 添加选择器
      </button>
    </div>
  </div>
</template>

<script>
import { computed } from 'vue'

export default {
  name: 'WebpageNode',
  props: {
    node: {
      type: Object,
      required: true
    }
  },
  emits: ['start-drag', 'delete', 'edit-selector', 'add-selector', 'port-mousedown'],
  setup(props, { emit }) {
    const nodeStyle = computed(() => ({
      left: `${props.node.position.x}px`,
      top: `${props.node.position.y}px`
    }))

    const handlePortMouseDown = (event, portId, portType) => {
      emit('port-mousedown', event, props.node.id, portId, portType)
    }

    return {
      nodeStyle,
      handlePortMouseDown
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

.webpage-node {
  border-color: #2196F3;
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

.node-title {
  flex: 1;
  font-weight: 600;
  font-size: 14px;
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

.selector-group {
  margin-bottom: 12px;
  padding: 8px;
  background: rgba(0, 0, 0, 0.02);
  border-radius: 4px;
}

.dark-mode .selector-group {
  background: rgba(255, 255, 255, 0.02);
}

.selector-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.selector-name {
  font-weight: 500;
  font-size: 13px;
}

.selector-edit {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 14px;
  padding: 4px;
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

.port-dot.data {
  color: #2196F3;
}

.port-dot.action {
  color: #ff9800;
}

.port-label {
  flex: 1;
}

.add-selector-btn {
  width: 100%;
  padding: 8px;
  background: transparent;
  border: 2px dashed #ddd;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
  color: #666;
  margin-top: 8px;
}

.add-selector-btn:hover {
  border-color: #4CAF50;
  color: #4CAF50;
}
</style>

