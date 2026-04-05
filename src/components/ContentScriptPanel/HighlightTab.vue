<template>
  <div class="tab-content">
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
</template>

<script>
import { ref, computed, inject } from 'vue'
import { useI18n } from 'vue-i18n'

export default {
  name: 'HighlightTab',
  props: {
    targetIframe: {
      type: Object,
      default: null
    }
  },
  setup(props) {
    const { t } = useI18n()
    const executor = inject('contentScriptExecutor')

    const highlightSelectors = ref('')
    const highlightColor = ref('#ff5c00')
    const highlightDuration = ref(3000)
    const highlightPulse = ref(true)

    const executing = computed(() => executor.isExecuting.value)

    const hexToRgba = (hex, alpha) => {
      const r = parseInt(hex.slice(1, 3), 16)
      const g = parseInt(hex.slice(3, 5), 16)
      const b = parseInt(hex.slice(5, 7), 16)
      return `rgba(${r}, ${g}, ${b}, ${alpha})`
    }

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

    const clearAllHighlights = async () => {
      try {
        await executor.clearHighlights(props.targetIframe)
        alert(`✅ ${t('contentScript.highlight.cleared')}`)
      } catch (error) {
        console.error('清除失败:', error)
        alert(`❌ ${t('contentScript.highlight.clearFailed', { error: error.message })}`)
      }
    }

    return {
      highlightSelectors,
      highlightColor,
      highlightDuration,
      highlightPulse,
      executing,
      applyHighlight,
      clearAllHighlights
    }
  }
}
</script>

<style>
@import './content-script-shared.css';
</style>
