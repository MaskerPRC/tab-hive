<template>
  <div class="tab-content">
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
</template>

<script>
import { ref, computed, inject } from 'vue'
import { useI18n } from 'vue-i18n'

export default {
  name: 'ExtractTab',
  props: {
    targetIframe: {
      type: Object,
      default: null
    }
  },
  setup(props) {
    const { t } = useI18n()
    const executor = inject('contentScriptExecutor')

    const extractSelectors = ref('')
    const extractText = ref(true)
    const extractHtml = ref(false)
    const extractAttributes = ref('')
    const extractStyles = ref('')
    const extractedData = ref([])

    const executing = computed(() => executor.isExecuting.value)

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

    return {
      extractSelectors,
      extractText,
      extractHtml,
      extractAttributes,
      extractStyles,
      extractedData,
      executing,
      extractData,
      exportData
    }
  }
}
</script>

<style>
@import './content-script-shared.css';
</style>
