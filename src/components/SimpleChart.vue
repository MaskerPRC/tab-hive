<template>
  <div class="simple-chart">
    <div class="chart-header">
      <h3>{{ config.title }}</h3>
      <div class="chart-actions">
        <button @click="$emit('export')" class="btn-action" title="导出配置">
          📤
        </button>
        <button @click="$emit('close')" class="btn-action" title="关闭">
          ✕
        </button>
      </div>
    </div>

    <div class="chart-content">
      <!-- 柱状图 -->
      <div v-if="config.type === 'bar'" class="bar-chart">
        <div class="chart-canvas">
          <div v-for="(value, index) in config.series[0].data" 
               :key="index" 
               class="bar-item">
            <div class="bar" :style="{ height: getBarHeight(value) + '%' }">
              <span class="bar-value">{{ value }}</span>
            </div>
            <div class="bar-label">{{ config.xAxis.data[index] }}</div>
          </div>
        </div>
      </div>

      <!-- 折线图 -->
      <div v-if="config.type === 'line'" class="line-chart">
        <svg class="line-svg" viewBox="0 0 800 400">
          <g v-for="(series, sIndex) in config.series" :key="sIndex">
            <polyline
              :points="getLinePoints(series.data)"
              :stroke="getSeriesColor(sIndex)"
              stroke-width="2"
              fill="none"
            />
            <circle
              v-for="(value, index) in series.data"
              :key="index"
              :cx="getXPosition(index, series.data.length)"
              :cy="getYPosition(value)"
              r="4"
              :fill="getSeriesColor(sIndex)"
            />
          </g>
          <!-- X轴标签 -->
          <text
            v-for="(label, index) in config.xAxis.data"
            :key="index"
            :x="getXPosition(index, config.xAxis.data.length)"
            y="390"
            text-anchor="middle"
            font-size="12"
          >
            {{ label }}
          </text>
        </svg>
        <div class="chart-legend">
          <div v-for="(series, index) in config.series" :key="index" class="legend-item">
            <span class="legend-color" :style="{ background: getSeriesColor(index) }"></span>
            <span class="legend-label">{{ series.name }}</span>
          </div>
        </div>
      </div>

      <!-- 饼图 -->
      <div v-if="config.type === 'pie'" class="pie-chart">
        <svg class="pie-svg" viewBox="0 0 400 400">
          <g transform="translate(200, 200)">
            <path
              v-for="(segment, index) in pieSegments"
              :key="index"
              :d="segment.path"
              :fill="getSeriesColor(index)"
              :stroke="'white'"
              stroke-width="2"
            />
          </g>
        </svg>
        <div class="chart-legend">
          <div v-for="(item, index) in config.series[0].data" :key="index" class="legend-item">
            <span class="legend-color" :style="{ background: getSeriesColor(index) }"></span>
            <span class="legend-label">{{ item.name }}: {{ item.value }}</span>
          </div>
        </div>
      </div>

      <!-- 表格 -->
      <div v-if="config.type === 'table'" class="table-chart">
        <table>
          <thead>
            <tr>
              <th v-for="col in config.columns" :key="col.key">{{ col.label }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(row, index) in config.data" :key="index">
              <td v-for="col in config.columns" :key="col.key">
                {{ row[col.key] }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script>
import { computed } from 'vue'

export default {
  name: 'SimpleChart',
  props: {
    config: {
      type: Object,
      required: true
    }
  },
  emits: ['export', 'close'],
  setup(props) {
    const colors = ['#667eea', '#764ba2', '#f093fb', '#4facfe', '#43e97b', '#fa709a']

    const getSeriesColor = (index) => {
      return colors[index % colors.length]
    }

    // 柱状图相关
    const getBarHeight = (value) => {
      const max = Math.max(...props.config.series[0].data)
      return (value / max) * 80
    }

    // 折线图相关
    const getXPosition = (index, total) => {
      return 50 + (index / (total - 1)) * 700
    }

    const getYPosition = (value) => {
      const allValues = props.config.series.flatMap(s => s.data)
      const max = Math.max(...allValues)
      const min = Math.min(...allValues)
      const range = max - min || 1
      return 350 - ((value - min) / range) * 300
    }

    const getLinePoints = (data) => {
      return data.map((value, index) => {
        const x = getXPosition(index, data.length)
        const y = getYPosition(value)
        return `${x},${y}`
      }).join(' ')
    }

    // 饼图相关
    const pieSegments = computed(() => {
      if (props.config.type !== 'pie') return []
      
      const data = props.config.series[0].data
      const total = data.reduce((sum, item) => sum + item.value, 0)
      let currentAngle = 0
      
      return data.map(item => {
        const percentage = item.value / total
        const angle = percentage * 360
        const endAngle = currentAngle + angle
        
        const startRad = (currentAngle - 90) * Math.PI / 180
        const endRad = (endAngle - 90) * Math.PI / 180
        const radius = 150
        
        const x1 = radius * Math.cos(startRad)
        const y1 = radius * Math.sin(startRad)
        const x2 = radius * Math.cos(endRad)
        const y2 = radius * Math.sin(endRad)
        
        const largeArc = angle > 180 ? 1 : 0
        
        const path = `M 0 0 L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2} Z`
        
        currentAngle = endAngle
        
        return { path, ...item }
      })
    })

    return {
      getSeriesColor,
      getBarHeight,
      getXPosition,
      getYPosition,
      getLinePoints,
      pieSegments
    }
  }
}
</script>

<style scoped>
.simple-chart {
  background: white;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.chart-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  padding-bottom: 16px;
  border-bottom: 2px solid #f0f0f0;
}

.chart-header h3 {
  margin: 0;
  font-size: 20px;
  color: #333;
}

.chart-actions {
  display: flex;
  gap: 8px;
}

.btn-action {
  background: #f3f4f6;
  border: none;
  padding: 8px 12px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 16px;
  transition: all 0.3s;
}

.btn-action:hover {
  background: #e5e7eb;
}

.chart-content {
  min-height: 300px;
}

/* 柱状图样式 */
.bar-chart {
  height: 400px;
  display: flex;
  align-items: flex-end;
  padding: 20px 0;
}

.chart-canvas {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: flex-end;
  justify-content: space-around;
  gap: 12px;
}

.bar-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  height: 100%;
}

.bar {
  width: 100%;
  max-width: 80px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 8px 8px 0 0;
  position: relative;
  transition: all 0.3s;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding-top: 8px;
}

.bar:hover {
  opacity: 0.8;
  transform: translateY(-4px);
}

.bar-value {
  color: white;
  font-weight: 600;
  font-size: 14px;
}

.bar-label {
  margin-top: 8px;
  font-size: 12px;
  color: #666;
  text-align: center;
  word-wrap: break-word;
  max-width: 80px;
}

/* 折线图样式 */
.line-chart {
  padding: 20px 0;
}

.line-svg {
  width: 100%;
  height: 400px;
}

.chart-legend {
  display: flex;
  justify-content: center;
  gap: 24px;
  margin-top: 16px;
  flex-wrap: wrap;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
}

.legend-color {
  width: 16px;
  height: 16px;
  border-radius: 50%;
}

.legend-label {
  color: #666;
}

/* 饼图样式 */
.pie-chart {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20px 0;
}

.pie-svg {
  width: 400px;
  height: 400px;
}

.pie-svg path {
  transition: all 0.3s;
  cursor: pointer;
}

.pie-svg path:hover {
  opacity: 0.8;
  transform: scale(1.05);
}

/* 表格样式 */
.table-chart {
  overflow-x: auto;
}

table {
  width: 100%;
  border-collapse: collapse;
  font-size: 14px;
}

thead {
  background: #f9fafb;
}

th {
  padding: 12px;
  text-align: left;
  font-weight: 600;
  color: #374151;
  border-bottom: 2px solid #e5e7eb;
}

td {
  padding: 12px;
  border-bottom: 1px solid #e5e7eb;
  color: #6b7280;
}

tr:hover {
  background: #f9fafb;
}

tr:last-child td {
  border-bottom: none;
}
</style>

