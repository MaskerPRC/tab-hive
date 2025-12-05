<template>
  <div class="content-script-panel" v-if="visible">
    <div class="panel-header">
      <h3>🎯 内容脚本执行器</h3>
      <button @click="$emit('close')" class="close-btn">✕</button>
    </div>

    <div class="panel-tabs">
      <button 
        v-for="tab in tabs" 
        :key="tab.id"
        :class="['tab-btn', { active: activeTab === tab.id }]"
        @click="activeTab = tab.id"
      >
        {{ tab.icon }} {{ tab.name }}
      </button>
    </div>

    <div class="panel-content">
      <!-- 高亮标签 -->
      <div v-if="activeTab === 'highlight'" class="tab-content">
        <h4>✨ 元素高亮</h4>
        <div class="form-group">
          <label>选择器（每行一个）:</label>
          <textarea 
            v-model="highlightSelectors" 
            placeholder="例如:&#10;.video-player&#10;#main-content&#10;.item"
            rows="4"
          ></textarea>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label>颜色:</label>
            <input type="color" v-model="highlightColor" />
          </div>
          <div class="form-group">
            <label>持续时间(ms):</label>
            <input type="number" v-model.number="highlightDuration" min="0" step="1000" />
            <small>0 = 永久</small>
          </div>
        </div>

        <div class="form-row">
          <label>
            <input type="checkbox" v-model="highlightPulse" />
            脉冲动画
          </label>
        </div>

        <div class="btn-group">
          <button @click="applyHighlight" :disabled="!highlightSelectors.trim() || executing">
            {{ executing ? '执行中...' : '应用高亮' }}
          </button>
          <button @click="clearAllHighlights" :disabled="executing">
            清除高亮
          </button>
        </div>
      </div>

      <!-- 数据提取标签 -->
      <div v-if="activeTab === 'extract'" class="tab-content">
        <h4>📊 数据提取</h4>
        <div class="form-group">
          <label>选择器（每行一个）:</label>
          <textarea 
            v-model="extractSelectors" 
            placeholder="例如:&#10;.product-title&#10;.price&#10;.rating"
            rows="4"
          ></textarea>
        </div>

        <div class="form-row">
          <label><input type="checkbox" v-model="extractText" /> 提取文本</label>
          <label><input type="checkbox" v-model="extractHtml" /> 提取HTML</label>
        </div>

        <div class="form-group">
          <label>属性（逗号分隔）:</label>
          <input 
            v-model="extractAttributes" 
            placeholder="例如: href, src, data-id"
          />
        </div>

        <div class="form-group">
          <label>样式（逗号分隔）:</label>
          <input 
            v-model="extractStyles" 
            placeholder="例如: color, fontSize, display"
          />
        </div>

        <div class="btn-group">
          <button @click="extractData" :disabled="!extractSelectors.trim() || executing">
            {{ executing ? '提取中...' : '提取数据' }}
          </button>
          <button @click="exportData" :disabled="!extractedData.length">
            导出 JSON
          </button>
        </div>

        <div v-if="extractedData.length" class="results">
          <h5>提取结果 ({{ extractedData.length }} 项):</h5>
          <pre>{{ JSON.stringify(extractedData, null, 2) }}</pre>
        </div>
      </div>

      <!-- 批量操作标签 -->
      <div v-if="activeTab === 'actions'" class="tab-content">
        <h4>⚡ 批量操作</h4>
        <div class="form-group">
          <label>选择器（每行一个）:</label>
          <textarea 
            v-model="actionSelectors" 
            placeholder="例如:&#10;button.submit&#10;.ad-banner&#10;.popup"
            rows="4"
          ></textarea>
        </div>

        <div class="form-group">
          <label>操作类型:</label>
          <select v-model="actionType">
            <option value="click">点击</option>
            <option value="focus">聚焦</option>
            <option value="scrollIntoView">滚动到视图</option>
            <option value="hide">隐藏</option>
            <option value="show">显示</option>
            <option value="remove">移除</option>
          </select>
        </div>

        <button @click="performAction" :disabled="!actionSelectors.trim() || executing">
          {{ executing ? '执行中...' : '执行操作' }}
        </button>

        <div v-if="actionResult" class="results">
          <h5>操作结果:</h5>
          <p>✅ 成功: {{ actionResult.success?.length || 0 }}</p>
          <p>❌ 失败: {{ actionResult.failed?.length || 0 }}</p>
          <details v-if="actionResult.failed?.length">
            <summary>查看失败详情</summary>
            <pre>{{ JSON.stringify(actionResult.failed, null, 2) }}</pre>
          </details>
        </div>
      </div>

      <!-- 自定义脚本标签 -->
      <div v-if="activeTab === 'custom'" class="tab-content">
        <h4>💻 自定义脚本</h4>
        <div class="form-group">
          <label>JavaScript 代码:</label>
          <textarea 
            v-model="customScript" 
            placeholder="例如:&#10;document.querySelectorAll('.item').forEach(el => {&#10;  console.log(el.textContent);&#10;});"
            rows="10"
            class="code-editor"
          ></textarea>
        </div>

        <button @click="executeCustomScript" :disabled="!customScript.trim() || executing">
          {{ executing ? '执行中...' : '执行脚本' }}
        </button>

        <div v-if="customResult !== null" class="results">
          <h5>执行结果:</h5>
          <pre>{{ JSON.stringify(customResult, null, 2) }}</pre>
        </div>
      </div>
    </div>

    <!-- 执行历史 -->
    <div class="execution-history" v-if="executionResults.length">
      <h4>📝 执行历史 ({{ executionResults.length }})</h4>
      <div class="history-list">
        <div v-for="(result, index) in executionResults.slice(-5).reverse()" 
             :key="index" 
             class="history-item">
          <span class="timestamp">{{ formatTime(result.timestamp) }}</span>
          <span :class="['status', result.success ? 'success' : 'error']">
            {{ result.success ? '✅' : '❌' }}
          </span>
          <small class="result-preview">{{ formatResult(result) }}</small>
        </div>
      </div>
      <button @click="clearHistory" class="clear-btn">清除历史</button>
    </div>
  </div>
</template>

<script>
import { ref, computed } from 'vue'
import { useContentScriptExecutor } from '../composables/useContentScriptExecutor'

export default {
  name: 'ContentScriptPanel',
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
  setup(props) {
    const executor = useContentScriptExecutor()
    
    // 标签页
    const tabs = [
      { id: 'highlight', name: '高亮', icon: '✨' },
      { id: 'extract', name: '提取', icon: '📊' },
      { id: 'actions', name: '操作', icon: '⚡' },
      { id: 'custom', name: '自定义', icon: '💻' }
    ]
    const activeTab = ref('highlight')

    // 高亮相关
    const highlightSelectors = ref('')
    const highlightColor = ref('#ff5c00')
    const highlightDuration = ref(3000)
    const highlightPulse = ref(true)

    // 数据提取相关
    const extractSelectors = ref('')
    const extractText = ref(true)
    const extractHtml = ref(false)
    const extractAttributes = ref('')
    const extractStyles = ref('')
    const extractedData = ref([])

    // 批量操作相关
    const actionSelectors = ref('')
    const actionType = ref('click')
    const actionResult = ref(null)

    // 自定义脚本
    const customScript = ref('')
    const customResult = ref(null)

    const executing = computed(() => executor.isExecuting.value)
    const executionResults = computed(() => executor.executionResults.value)

    // 应用高亮
    const applyHighlight = async () => {
      try {
        const selectors = highlightSelectors.value.split('\n').filter(s => s.trim())
        const result = await executor.highlightElements(props.targetIframe, selectors, {
          color: highlightColor.value,
          backgroundColor: hexToRgba(highlightColor.value, 0.2),
          duration: highlightDuration.value,
          pulse: highlightPulse.value
        })
        console.log('高亮结果:', result)
        alert(`✅ 已高亮 ${result.result?.highlighted?.length || 0} 个元素`)
      } catch (error) {
        console.error('高亮失败:', error)
        alert('❌ 高亮失败: ' + error.message)
      }
    }

    // 清除高亮
    const clearAllHighlights = async () => {
      try {
        await executor.clearHighlights(props.targetIframe)
        alert('✅ 已清除所有高亮')
      } catch (error) {
        console.error('清除失败:', error)
        alert('❌ 清除失败: ' + error.message)
      }
    }

    // 提取数据
    const extractData = async () => {
      try {
        const selectors = extractSelectors.value.split('\n').filter(s => s.trim())
        const attrs = extractAttributes.value.split(',').map(s => s.trim()).filter(Boolean)
        const styles = extractStyles.value.split(',').map(s => s.trim()).filter(Boolean)
        
        const result = await executor.extractElementsData(props.targetIframe, selectors, {
          text: extractText.value,
          html: extractHtml.value,
          attributes: attrs,
          styles: styles
        })
        
        extractedData.value = result.result || []
        alert(`✅ 已提取 ${extractedData.value.length} 项数据`)
      } catch (error) {
        console.error('提取失败:', error)
        alert('❌ 提取失败: ' + error.message)
      }
    }

    // 导出数据
    const exportData = () => {
      const dataStr = JSON.stringify(extractedData.value, null, 2)
      const blob = new Blob([dataStr], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `quanshijie-extract-${Date.now()}.json`
      a.click()
      URL.revokeObjectURL(url)
    }

    // 执行操作
    const performAction = async () => {
      try {
        const selectors = actionSelectors.value.split('\n').filter(s => s.trim())
        const result = await executor.performElementsAction(
          props.targetIframe, 
          selectors, 
          actionType.value
        )
        actionResult.value = result.result
        alert(`✅ 操作完成\n成功: ${result.result?.success?.length || 0}\n失败: ${result.result?.failed?.length || 0}`)
      } catch (error) {
        console.error('操作失败:', error)
        alert('❌ 操作失败: ' + error.message)
      }
    }

    // 执行自定义脚本
    const executeCustomScript = async () => {
      try {
        const result = await executor.executeScript(props.targetIframe, customScript.value)
        customResult.value = result.result
      } catch (error) {
        console.error('执行失败:', error)
        customResult.value = { error: error.message }
      }
    }

    // 清除历史
    const clearHistory = () => {
      executor.clearResults()
    }

    // 工具函数
    const hexToRgba = (hex, alpha) => {
      const r = parseInt(hex.slice(1, 3), 16)
      const g = parseInt(hex.slice(3, 5), 16)
      const b = parseInt(hex.slice(5, 7), 16)
      return `rgba(${r}, ${g}, ${b}, ${alpha})`
    }

    const formatTime = (timestamp) => {
      const date = new Date(timestamp)
      return date.toLocaleTimeString()
    }

    const formatResult = (result) => {
      if (!result) return '无结果'
      if (!result.success) return result.error || '执行失败'
      
      // 处理 result.result 可能为 undefined、null 或其他类型的情况
      if (result.result === undefined || result.result === null) {
        return '无返回值'
      }
      
      if (typeof result.result === 'string') {
        return result.result.substring(0, 50) + (result.result.length > 50 ? '...' : '')
      }
      
      try {
        const jsonStr = JSON.stringify(result.result)
        if (!jsonStr) return '空结果'
        return jsonStr.substring(0, 50) + (jsonStr.length > 50 ? '...' : '')
      } catch (error) {
        return String(result.result).substring(0, 50) + '...'
      }
    }

    return {
      tabs,
      activeTab,
      executing,
      executionResults,
      
      // 高亮
      highlightSelectors,
      highlightColor,
      highlightDuration,
      highlightPulse,
      applyHighlight,
      clearAllHighlights,
      
      // 提取
      extractSelectors,
      extractText,
      extractHtml,
      extractAttributes,
      extractStyles,
      extractedData,
      extractData,
      exportData,
      
      // 操作
      actionSelectors,
      actionType,
      actionResult,
      performAction,
      
      // 自定义
      customScript,
      customResult,
      executeCustomScript,
      
      // 历史
      clearHistory,
      formatTime,
      formatResult
    }
  }
}
</script>

<style scoped>
.content-script-panel {
  position: fixed;
  right: 20px;
  top: 80px;
  bottom: 20px;
  width: 450px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15);
  display: flex;
  flex-direction: column;
  z-index: 1000;
  overflow: hidden;
}

.panel-header {
  padding: 16px 20px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.panel-header h3 {
  margin: 0;
  font-size: 18px;
}

.close-btn {
  background: rgba(255, 255, 255, 0.2);
  border: none;
  color: white;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  cursor: pointer;
  font-size: 18px;
  transition: all 0.3s;
}

.close-btn:hover {
  background: rgba(255, 255, 255, 0.3);
  transform: rotate(90deg);
}

.panel-tabs {
  display: flex;
  background: #f5f5f5;
  border-bottom: 1px solid #e0e0e0;
  padding: 0;
}

.tab-btn {
  flex: 1;
  padding: 12px;
  border: none;
  background: transparent;
  cursor: pointer;
  font-size: 13px;
  transition: all 0.3s;
  border-bottom: 3px solid transparent;
}

.tab-btn:hover {
  background: rgba(102, 126, 234, 0.1);
}

.tab-btn.active {
  background: white;
  border-bottom-color: #667eea;
  font-weight: 600;
}

.panel-content {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
}

.tab-content h4 {
  margin: 0 0 16px 0;
  font-size: 16px;
  color: #333;
}

.form-group {
  margin-bottom: 16px;
}

.form-group label {
  display: block;
  margin-bottom: 6px;
  font-size: 13px;
  font-weight: 500;
  color: #555;
}

.form-group input[type="text"],
.form-group input[type="number"],
.form-group select,
.form-group textarea {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 13px;
  font-family: inherit;
  transition: border-color 0.3s;
}

.form-group input:focus,
.form-group select:focus,
.form-group textarea:focus {
  outline: none;
  border-color: #667eea;
}

.form-group input[type="color"] {
  width: 60px;
  height: 38px;
  border: 1px solid #ddd;
  border-radius: 6px;
  cursor: pointer;
}

.form-group small {
  display: block;
  margin-top: 4px;
  font-size: 11px;
  color: #999;
}

.form-row {
  display: flex;
  gap: 12px;
  margin-bottom: 16px;
}

.form-row .form-group {
  flex: 1;
  margin-bottom: 0;
}

.form-row label {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
}

.btn-group {
  display: flex;
  gap: 8px;
  margin-top: 16px;
}

button {
  padding: 10px 20px;
  border: none;
  border-radius: 6px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s;
}

button:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}

button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-group button {
  flex: 1;
}

.code-editor {
  font-family: 'Courier New', monospace;
  font-size: 12px;
  line-height: 1.5;
}

.results {
  margin-top: 20px;
  padding: 16px;
  background: #f9f9f9;
  border-radius: 8px;
  border: 1px solid #e0e0e0;
}

.results h5 {
  margin: 0 0 12px 0;
  font-size: 14px;
  color: #333;
}

.results pre {
  max-height: 200px;
  overflow: auto;
  background: white;
  padding: 12px;
  border-radius: 6px;
  font-size: 11px;
  line-height: 1.4;
  margin: 0;
}

.results p {
  margin: 6px 0;
  font-size: 13px;
}

details {
  margin-top: 12px;
}

details summary {
  cursor: pointer;
  font-size: 12px;
  color: #667eea;
  margin-bottom: 8px;
}

.execution-history {
  border-top: 1px solid #e0e0e0;
  padding: 12px 20px;
  background: #fafafa;
}

.execution-history h4 {
  margin: 0 0 12px 0;
  font-size: 13px;
  color: #666;
}

.history-list {
  max-height: 150px;
  overflow-y: auto;
}

.history-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 8px;
  background: white;
  border-radius: 4px;
  margin-bottom: 4px;
  font-size: 11px;
}

.timestamp {
  color: #999;
  font-size: 10px;
}

.status.success {
  color: #10b981;
}

.status.error {
  color: #ef4444;
}

.result-preview {
  flex: 1;
  color: #666;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.clear-btn {
  width: 100%;
  margin-top: 8px;
  background: #ef4444;
  font-size: 11px;
  padding: 6px;
}
</style>

