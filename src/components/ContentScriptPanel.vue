<template>
  <Transition name="panel-fade">
    <div v-if="visible" class="content-script-overlay" @mousedown="handleOverlayMouseDown" @click="handleOverlayClick">
      <div class="content-script-panel" @click.stop @mousedown.stop>
        <!-- 头部 -->
        <div class="panel-header">
          <div class="header-title">
            <span class="header-icon">🎯</span>
            <h3>{{ $t('contentScript.title') }}</h3>
          </div>
          <button @click="$emit('close')" class="close-btn" :title="$t('common.close')">✕</button>
        </div>

        <!-- 标签页导航 -->
        <div class="panel-tabs">
          <button 
            v-for="tab in tabs" 
            :key="tab.id"
            :class="['tab-btn', { active: activeTab === tab.id }]"
            @click="activeTab = tab.id"
          >
            <span class="tab-icon">{{ tab.icon }}</span>
            <span class="tab-name">{{ tab.name }}</span>
          </button>
        </div>

        <!-- 内容区域 -->
        <div class="panel-content">
          <!-- 高亮标签 -->
          <div v-if="activeTab === 'highlight'" class="tab-content">
            <div class="section-header">
              <span class="section-icon">✨</span>
              <h4>{{ $t('contentScript.highlight.title') }}</h4>
            </div>
            <div class="form-group">
              <label>{{ $t('contentScript.highlight.selectors') }}</label>
              <textarea 
                v-model="highlightSelectors" 
                placeholder="例如:&#10;.video-player&#10;#main-content&#10;.item"
                rows="4"
              ></textarea>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label>{{ $t('contentScript.highlight.color') }}</label>
                <div class="color-picker-wrapper">
                  <input type="color" v-model="highlightColor" />
                  <span class="color-value">{{ highlightColor }}</span>
                </div>
              </div>
              <div class="form-group">
                <label>{{ $t('contentScript.highlight.duration') }}</label>
                <input type="number" v-model.number="highlightDuration" min="0" step="1000" />
                <small>{{ $t('contentScript.highlight.permanentHint') }}</small>
              </div>
            </div>

            <div class="form-row checkbox-row">
              <label class="checkbox-label">
                <input type="checkbox" v-model="highlightPulse" />
                <span class="checkbox-custom"></span>
                <span>{{ $t('contentScript.highlight.enablePulse') }}</span>
              </label>
            </div>

            <div class="btn-group">
              <button @click="applyHighlight" :disabled="!highlightSelectors.trim() || executing" class="btn-primary">
                <span v-if="executing" class="btn-loading"></span>
                {{ executing ? $t('contentScript.highlight.executing') : $t('contentScript.highlight.apply') }}
              </button>
              <button @click="clearAllHighlights" :disabled="executing" class="btn-secondary">
                {{ $t('contentScript.highlight.clear') }}
              </button>
            </div>
          </div>

          <!-- 数据提取标签 -->
          <div v-if="activeTab === 'extract'" class="tab-content">
            <div class="section-header">
              <span class="section-icon">📊</span>
              <h4>{{ $t('contentScript.extract.title') }}</h4>
            </div>
            <div class="form-group">
              <label>{{ $t('contentScript.extract.selectors') }}</label>
              <textarea 
                v-model="extractSelectors" 
                placeholder="例如:&#10;.product-title&#10;.price&#10;.rating"
                rows="4"
              ></textarea>
            </div>

            <div class="form-row checkbox-row">
              <label class="checkbox-label">
                <input type="checkbox" v-model="extractText" />
                <span class="checkbox-custom"></span>
                <span>{{ $t('contentScript.extract.extractText') }}</span>
              </label>
              <label class="checkbox-label">
                <input type="checkbox" v-model="extractHtml" />
                <span class="checkbox-custom"></span>
                <span>{{ $t('contentScript.extract.extractHtml') }}</span>
              </label>
            </div>

            <div class="form-group">
              <label>{{ $t('contentScript.extract.attributes') }}</label>
              <input 
                v-model="extractAttributes" 
                placeholder="例如: href, src, data-id"
              />
            </div>

            <div class="form-group">
              <label>{{ $t('contentScript.extract.styles') }}</label>
              <input 
                v-model="extractStyles" 
                placeholder="例如: color, fontSize, display"
              />
            </div>

            <div class="btn-group">
              <button @click="extractData" :disabled="!extractSelectors.trim() || executing" class="btn-primary">
                <span v-if="executing" class="btn-loading"></span>
                {{ executing ? $t('contentScript.extract.executing') : $t('contentScript.extract.extractBtn') }}
              </button>
              <button @click="exportData" :disabled="!extractedData.length" class="btn-secondary">
                {{ $t('contentScript.extract.exportJson') }}
              </button>
            </div>

            <div v-if="extractedData.length" class="results">
              <div class="results-header">
                <h5>{{ $t('contentScript.extract.results') }}</h5>
                <span class="results-count">{{ $t('contentScript.extract.items', { count: extractedData.length }) }}</span>
              </div>
              <pre>{{ JSON.stringify(extractedData, null, 2) }}</pre>
            </div>
          </div>

          <!-- 批量操作标签 -->
          <div v-if="activeTab === 'actions'" class="tab-content">
            <div class="section-header">
              <span class="section-icon">⚡</span>
              <h4>{{ $t('contentScript.actions.title') }}</h4>
            </div>
            <div class="form-group">
              <label>{{ $t('contentScript.actions.selectors') }}</label>
              <textarea 
                v-model="actionSelectors" 
                placeholder="例如:&#10;button.submit&#10;.ad-banner&#10;.popup"
                rows="4"
              ></textarea>
            </div>

            <div class="form-group">
              <label>{{ $t('contentScript.actions.actionType') }}</label>
              <select v-model="actionType">
                <option value="click">👆 {{ $t('contentScript.actions.click') }}</option>
                <option value="focus">🔍 {{ $t('contentScript.actions.focus') }}</option>
                <option value="scrollIntoView">📜 {{ $t('contentScript.actions.scrollIntoView') }}</option>
                <option value="hide">🙈 {{ $t('contentScript.actions.hide') }}</option>
                <option value="show">👀 {{ $t('contentScript.actions.show') }}</option>
                <option value="remove">🗑️ {{ $t('contentScript.actions.remove') }}</option>
              </select>
            </div>

            <button @click="performAction" :disabled="!actionSelectors.trim() || executing" class="btn-primary btn-full">
              <span v-if="executing" class="btn-loading"></span>
              {{ executing ? $t('contentScript.actions.executing') : $t('contentScript.actions.execute') }}
            </button>

            <div v-if="actionResult" class="results">
              <div class="results-header">
                <h5>{{ $t('contentScript.actions.results') }}</h5>
              </div>
              <div class="result-stats">
                <div class="stat-item success">
                  <span class="stat-icon">✅</span>
                  <span>{{ $t('contentScript.actions.success', { count: actionResult.success?.length || 0 }) }}</span>
                </div>
                <div class="stat-item error">
                  <span class="stat-icon">❌</span>
                  <span>{{ $t('contentScript.actions.failed', { count: actionResult.failed?.length || 0 }) }}</span>
                </div>
              </div>
              <details v-if="actionResult.failed?.length" class="details-collapse">
                <summary>{{ $t('contentScript.actions.viewFailedDetails') }}</summary>
                <pre>{{ JSON.stringify(actionResult.failed, null, 2) }}</pre>
              </details>
            </div>
          </div>

          <!-- 自定义脚本标签 -->
          <div v-if="activeTab === 'custom'" class="tab-content">
            <div class="section-header">
              <span class="section-icon">💻</span>
              <h4>{{ $t('contentScript.custom.title') }}</h4>
            </div>
            <div class="form-group">
              <label>{{ $t('contentScript.custom.codeLabel') }}</label>
              <textarea 
                v-model="customScript" 
                placeholder="例如:&#10;document.querySelectorAll('.item').forEach(el => {&#10;  console.log(el.textContent);&#10;});"
                rows="10"
                class="code-editor"
              ></textarea>
            </div>

            <button @click="executeCustomScript" :disabled="!customScript.trim() || executing" class="btn-primary btn-full">
              <span v-if="executing" class="btn-loading"></span>
              {{ executing ? $t('contentScript.custom.executing') : $t('contentScript.custom.execute') }}
            </button>

            <div v-if="customResult !== null" class="results">
              <div class="results-header">
                <h5>{{ $t('contentScript.custom.results') }}</h5>
              </div>
              <pre>{{ JSON.stringify(customResult, null, 2) }}</pre>
            </div>
          </div>
        </div>

        <!-- 执行历史 -->
        <div class="execution-history" v-if="executionResults.length">
          <div class="history-header">
            <h4>📝 {{ $t('contentScript.history.title') }}</h4>
            <span class="history-count">{{ executionResults.length }}</span>
          </div>
          <div class="history-list">
            <div v-for="(result, index) in executionResults.slice(-5).reverse()" 
                 :key="index" 
                 :class="['history-item', result.success ? 'success' : 'error']">
              <span class="history-status">{{ result.success ? '✅' : '❌' }}</span>
              <span class="history-time">{{ formatTime(result.timestamp) }}</span>
              <span class="history-preview">{{ formatResult(result) }}</span>
            </div>
          </div>
          <button @click="clearHistory" class="btn-clear">{{ $t('contentScript.history.clear') }}</button>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script>
import { ref, computed } from 'vue'
import { useI18n } from 'vue-i18n'
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
  setup(props, { emit }) {
    const { t } = useI18n()
    const executor = useContentScriptExecutor()
    const mouseDownOnOverlay = ref(false)

    // 处理遮罩层点击
    const handleOverlayMouseDown = (event) => {
      if (event.target === event.currentTarget) {
        mouseDownOnOverlay.value = true
      } else {
        mouseDownOnOverlay.value = false
      }
    }

    const handleOverlayClick = (event) => {
      if (event.target === event.currentTarget && mouseDownOnOverlay.value) {
        emit('close')
      }
      mouseDownOnOverlay.value = false
    }
    
    // 标签页
    const tabs = computed(() => [
      { id: 'highlight', name: t('contentScript.tabs.highlight'), icon: '✨' },
      { id: 'extract', name: t('contentScript.tabs.extract'), icon: '📊' },
      { id: 'actions', name: t('contentScript.tabs.actions'), icon: '⚡' },
      { id: 'custom', name: t('contentScript.tabs.custom'), icon: '💻' }
    ])
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
        alert(`✅ ${t('contentScript.highlight.success', { count: result.result?.highlighted?.length || 0 })}`)
      } catch (error) {
        console.error('高亮失败:', error)
        alert(`❌ ${t('contentScript.highlight.failed', { error: error.message })}`)
      }
    }

    // 清除高亮
    const clearAllHighlights = async () => {
      try {
        await executor.clearHighlights(props.targetIframe)
        alert(`✅ ${t('contentScript.highlight.cleared')}`)
      } catch (error) {
        console.error('清除失败:', error)
        alert(`❌ ${t('contentScript.highlight.clearFailed', { error: error.message })}`)
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
        alert(`✅ ${t('contentScript.extract.success', { count: extractedData.value.length })}`)
      } catch (error) {
        console.error('提取失败:', error)
        alert(`❌ ${t('contentScript.extract.failed', { error: error.message })}`)
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
        alert(`✅ ${t('contentScript.actions.completeSuccess', { success: result.result?.success?.length || 0, failed: result.result?.failed?.length || 0 })}`)
      } catch (error) {
        console.error('操作失败:', error)
        alert(`❌ ${t('contentScript.actions.completeFailed', { error: error.message })}`)
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
      if (!result) return t('contentScript.history.noResult')
      if (!result.success) return result.error || t('contentScript.history.executionFailed')

      // 处理 result.result 可能为 undefined、null 或其他类型的情况
      if (result.result === undefined || result.result === null) {
        return t('contentScript.history.noReturnValue')
      }
      
      if (typeof result.result === 'string') {
        return result.result.substring(0, 50) + (result.result.length > 50 ? '...' : '')
      }
      
      try {
        const jsonStr = JSON.stringify(result.result)
        if (!jsonStr) return t('contentScript.history.emptyResult')
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
      formatResult,

      // 遮罩层点击
      handleOverlayMouseDown,
      handleOverlayClick
    }
  }
}
</script>

<style scoped>
/* 遮罩层 */
.content-script-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10100;
  animation: fadeIn 0.2s ease-out;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

/* 主面板 */
.content-script-panel {
  background: white;
  border-radius: 16px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(0, 0, 0, 0.05);
  width: 520px;
  max-width: 95vw;
  max-height: 85vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  animation: slideIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
  transform-origin: center;
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: scale(0.9) translateY(-20px);
  }
  to {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}

/* 头部 */
.panel-header {
  padding: 20px 24px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
  background: linear-gradient(135deg, var(--primary-light, #fff5f0) 0%, #ffffff 100%);
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-shrink: 0;
}

.header-title {
  display: flex;
  align-items: center;
  gap: 10px;
}

.header-icon {
  font-size: 22px;
}

.panel-header h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: var(--primary-color, #ff5c00);
  letter-spacing: -0.01em;
}

.close-btn {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  border: none;
  background: rgba(0, 0, 0, 0.05);
  color: #64748b;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
  flex-shrink: 0;
}

.close-btn:hover {
  background: rgba(255, 92, 0, 0.1);
  color: var(--primary-color, #ff5c00);
}

.close-btn:active {
  transform: scale(0.95);
}

/* 标签页 */
.panel-tabs {
  display: flex;
  background: #fafafa;
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
  padding: 0;
  flex-shrink: 0;
}

.tab-btn {
  flex: 1;
  padding: 14px 16px;
  border: none;
  background: transparent;
  cursor: pointer;
  font-size: 13px;
  font-weight: 500;
  color: #666;
  transition: all 0.2s;
  border-bottom: 3px solid transparent;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
}

.tab-icon {
  font-size: 14px;
}

.tab-btn:hover {
  background: var(--primary-light, #fff5f0);
  color: var(--primary-color, #ff5c00);
}

.tab-btn.active {
  background: white;
  color: var(--primary-color, #ff5c00);
  border-bottom-color: var(--primary-color, #ff5c00);
  font-weight: 600;
}

/* 内容区域 */
.panel-content {
  flex: 1;
  overflow-y: auto;
  padding: 24px;
  scrollbar-width: thin;
  scrollbar-color: var(--primary-color, #FF5C00) transparent;
}

.panel-content::-webkit-scrollbar {
  width: 6px;
}

.panel-content::-webkit-scrollbar-track {
  background: transparent;
}

.panel-content::-webkit-scrollbar-thumb {
  background: var(--primary-color, #FF5C00);
  border-radius: 3px;
}

.panel-content::-webkit-scrollbar-thumb:hover {
  background: var(--primary-hover, #e64e00);
}

/* 标签内容 */
.tab-content {
  animation: tabFadeIn 0.2s ease-out;
}

@keyframes tabFadeIn {
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
}

.section-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 20px;
  padding-bottom: 12px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
}

.section-icon {
  font-size: 18px;
}

.section-header h4 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #1e293b;
}

/* 表单元素 */
.form-group {
  margin-bottom: 16px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  font-size: 13px;
  font-weight: 500;
  color: #475569;
}

.form-group input[type="text"],
.form-group input[type="number"],
.form-group select,
.form-group textarea {
  width: 100%;
  padding: 10px 14px;
  border: 2px solid #e2e8f0;
  border-radius: 8px;
  font-size: 14px;
  font-family: inherit;
  transition: all 0.2s;
  background: #ffffff;
  color: #1e293b;
  box-sizing: border-box;
}

.form-group input:focus,
.form-group select:focus,
.form-group textarea:focus {
  outline: none;
  border-color: var(--primary-color, #ff5c00);
  box-shadow: 0 0 0 3px rgba(255, 92, 0, 0.1);
}

.form-group input::placeholder,
.form-group textarea::placeholder {
  color: #94a3b8;
}

.form-group small {
  display: block;
  margin-top: 6px;
  font-size: 12px;
  color: #94a3b8;
}

/* 颜色选择器 */
.color-picker-wrapper {
  display: flex;
  align-items: center;
  gap: 10px;
}

.form-group input[type="color"] {
  width: 48px;
  height: 40px;
  border: 2px solid #e2e8f0;
  border-radius: 8px;
  cursor: pointer;
  padding: 4px;
  background: white;
}

.form-group input[type="color"]::-webkit-color-swatch-wrapper {
  padding: 0;
}

.form-group input[type="color"]::-webkit-color-swatch {
  border-radius: 4px;
  border: none;
}

.color-value {
  font-size: 13px;
  font-family: 'Courier New', monospace;
  color: #64748b;
  background: #f1f5f9;
  padding: 4px 8px;
  border-radius: 4px;
}

/* 表单行 */
.form-row {
  display: flex;
  gap: 16px;
  margin-bottom: 16px;
}

.form-row .form-group {
  flex: 1;
  margin-bottom: 0;
}

/* 复选框样式 */
.checkbox-row {
  align-items: center;
  padding: 8px 0;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
  font-size: 14px;
  color: #475569;
  user-select: none;
}

.checkbox-label input[type="checkbox"] {
  display: none;
}

.checkbox-custom {
  width: 20px;
  height: 20px;
  border: 2px solid #cbd5e1;
  border-radius: 4px;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.checkbox-label input[type="checkbox"]:checked + .checkbox-custom {
  background: var(--primary-color, #ff5c00);
  border-color: var(--primary-color, #ff5c00);
}

.checkbox-label input[type="checkbox"]:checked + .checkbox-custom::after {
  content: '';
  width: 6px;
  height: 10px;
  border: solid white;
  border-width: 0 2px 2px 0;
  transform: rotate(45deg);
  margin-bottom: 2px;
}

/* 按钮样式 */
.btn-group {
  display: flex;
  gap: 12px;
  margin-top: 20px;
}

button {
  padding: 12px 20px;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.btn-primary {
  flex: 1;
  background: var(--primary-color, #ff5c00);
  color: white;
  box-shadow: 0 2px 8px rgba(255, 92, 0, 0.2);
}

.btn-primary:hover:not(:disabled) {
  background: var(--primary-hover, #e64e00);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(255, 92, 0, 0.35);
}

.btn-primary:active:not(:disabled) {
  transform: translateY(0);
}

.btn-secondary {
  flex: 1;
  background: #f1f5f9;
  color: #64748b;
}

.btn-secondary:hover:not(:disabled) {
  background: #e2e8f0;
  color: #475569;
  transform: translateY(-1px);
}

.btn-full {
  width: 100%;
}

button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none !important;
}

/* 加载动画 */
.btn-loading {
  width: 14px;
  height: 14px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* 代码编辑器 */
.code-editor {
  font-family: 'SF Mono', 'Fira Code', 'Courier New', monospace;
  font-size: 13px;
  line-height: 1.6;
  background: #1e293b;
  color: #e2e8f0;
  border-color: #334155;
}

.code-editor:focus {
  border-color: var(--primary-color, #ff5c00);
  box-shadow: 0 0 0 3px rgba(255, 92, 0, 0.2);
}

.code-editor::placeholder {
  color: #64748b;
}

/* 结果展示 */
.results {
  margin-top: 20px;
  padding: 16px;
  background: #f8fafc;
  border-radius: 10px;
  border: 1px solid #e2e8f0;
}

.results-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

.results-header h5 {
  margin: 0;
  font-size: 14px;
  font-weight: 600;
  color: #1e293b;
}

.results-count {
  font-size: 12px;
  color: white;
  background: var(--primary-color, #ff5c00);
  padding: 2px 8px;
  border-radius: 10px;
}

.results pre {
  max-height: 200px;
  overflow: auto;
  background: white;
  padding: 12px;
  border-radius: 6px;
  font-size: 12px;
  font-family: 'SF Mono', 'Fira Code', monospace;
  line-height: 1.5;
  margin: 0;
  border: 1px solid #e2e8f0;
  scrollbar-width: thin;
  scrollbar-color: var(--primary-color, #FF5C00) transparent;
}

.results pre::-webkit-scrollbar {
  width: 5px;
  height: 5px;
}

.results pre::-webkit-scrollbar-thumb {
  background: var(--primary-color, #FF5C00);
  border-radius: 3px;
}

/* 结果统计 */
.result-stats {
  display: flex;
  gap: 16px;
  margin-bottom: 12px;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
  font-weight: 500;
}

.stat-item.success {
  color: #10b981;
}

.stat-item.error {
  color: #ef4444;
}

/* 折叠详情 */
.details-collapse {
  margin-top: 12px;
}

.details-collapse summary {
  cursor: pointer;
  font-size: 13px;
  color: var(--primary-color, #ff5c00);
  font-weight: 500;
  padding: 4px 0;
  transition: color 0.2s;
}

.details-collapse summary:hover {
  color: var(--primary-hover, #e64e00);
}

.details-collapse pre {
  margin-top: 12px;
  max-height: 150px;
  overflow: auto;
  background: white;
  padding: 12px;
  border-radius: 6px;
  font-size: 11px;
}

/* 执行历史 */
.execution-history {
  border-top: 1px solid rgba(0, 0, 0, 0.06);
  padding: 16px 24px;
  background: #fafafa;
  flex-shrink: 0;
}

.history-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

.history-header h4 {
  margin: 0;
  font-size: 14px;
  font-weight: 600;
  color: #475569;
}

.history-count {
  font-size: 11px;
  color: white;
  background: #94a3b8;
  padding: 2px 8px;
  border-radius: 10px;
}

.history-list {
  max-height: 140px;
  overflow-y: auto;
  scrollbar-width: thin;
}

.history-list::-webkit-scrollbar {
  width: 4px;
}

.history-list::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 2px;
}

.history-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 12px;
  background: white;
  border-radius: 6px;
  margin-bottom: 6px;
  font-size: 12px;
  border-left: 3px solid transparent;
  transition: all 0.2s;
}

.history-item.success {
  border-left-color: #10b981;
}

.history-item.error {
  border-left-color: #ef4444;
}

.history-item:hover {
  background: #f8fafc;
}

.history-status {
  flex-shrink: 0;
}

.history-time {
  color: #94a3b8;
  font-size: 11px;
  font-family: 'SF Mono', monospace;
  flex-shrink: 0;
}

.history-preview {
  flex: 1;
  color: #64748b;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.btn-clear {
  width: 100%;
  margin-top: 10px;
  padding: 8px;
  background: transparent;
  color: #94a3b8;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  font-size: 12px;
}

.btn-clear:hover {
  background: #fef2f2;
  color: #ef4444;
  border-color: #fecaca;
}

/* 过渡动画 */
.panel-fade-enter-active,
.panel-fade-leave-active {
  transition: opacity 0.2s ease;
}

.panel-fade-enter-from,
.panel-fade-leave-to {
  opacity: 0;
}

.panel-fade-enter-active .content-script-panel {
  animation: slideIn 0.25s ease-out;
}

.panel-fade-leave-active .content-script-panel {
  animation: slideOut 0.2s ease-in;
}

@keyframes slideOut {
  from {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
  to {
    opacity: 0;
    transform: scale(0.95) translateY(-10px);
  }
}

/* 响应式 */
@media (max-width: 600px) {
  .content-script-panel {
    width: 100%;
    max-width: 100%;
    max-height: 100vh;
    border-radius: 0;
  }

  .panel-header,
  .panel-content,
  .execution-history {
    padding-left: 16px;
    padding-right: 16px;
  }

  .form-row {
    flex-direction: column;
    gap: 12px;
  }

  .tab-btn {
    padding: 12px 8px;
    font-size: 12px;
  }

  .tab-name {
    display: none;
  }

  .tab-icon {
    font-size: 16px;
  }
}
</style>
