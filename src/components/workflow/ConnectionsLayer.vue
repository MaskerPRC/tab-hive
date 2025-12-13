<template>
  <svg class="connections-layer" :style="{ width: '100%', height: '100%' }">
    <!-- 绘制连接线 -->
    <g v-for="conn in connections" :key="conn.id">
      <line
        :x1="getConnectionStart(conn).x"
        :y1="getConnectionStart(conn).y"
        :x2="getConnectionEnd(conn).x"
        :y2="getConnectionEnd(conn).y"
        :class="getConnectionClass(conn)"
        :stroke-dasharray="conn.type === 'data-mapping' ? '5,5' : '0'"
        stroke-width="2"
      />
    </g>

    <!-- 正在绘制的临时连接线 -->
    <line
      v-if="draggingConnection"
      :x1="draggingConnection.startX"
      :y1="draggingConnection.startY"
      :x2="draggingConnection.endX"
      :y2="draggingConnection.endY"
      class="connection-temp"
      stroke-dasharray="5,5"
      stroke-width="2"
    />
  </svg>
</template>

<script>
export default {
  name: 'ConnectionsLayer',
  props: {
    connections: {
      type: Array,
      required: true,
      default: () => []
    },
    draggingConnection: {
      type: Object,
      default: null
    }
  },
  setup() {
    // TODO: 计算实际端口位置（简化版）
    const getConnectionStart = (conn) => {
      return { x: 100, y: 100 }
    }

    const getConnectionEnd = (conn) => {
      return { x: 300, y: 200 }
    }

    const getConnectionClass = (conn) => {
      return {
        'connection-line': true,
        'connection-data': conn.type === 'data-mapping',
        'connection-flow': conn.type === 'execution-flow'
      }
    }

    return {
      getConnectionStart,
      getConnectionEnd,
      getConnectionClass
    }
  }
}
</script>

<style scoped>
.connections-layer {
  position: absolute;
  top: 0;
  left: 0;
  pointer-events: none;
  z-index: 1;
}

.connection-line {
  stroke: #666;
  transition: stroke 0.2s;
}

.connection-data {
  stroke: #2196F3;
}

.connection-flow {
  stroke: #4CAF50;
}

.connection-temp {
  stroke: #999;
  opacity: 0.6;
}
</style>

