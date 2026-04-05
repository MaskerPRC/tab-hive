<template>
  <div class="tab-content">
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
</template>

<script>
import { ref, computed, inject } from 'vue'
import { useI18n } from 'vue-i18n'

export default {
  name: 'CustomScriptTab',
  props: {
    targetIframe: {
      type: Object,
      default: null
    }
  },
  setup(props) {
    const { t } = useI18n()
    const executor = inject('contentScriptExecutor')

    const customScript = ref('')
    const customResult = ref(null)

    const executing = computed(() => executor.isExecuting.value)

    const executeCustomScript = async () => {
      try {
        const result = await executor.executeScript(props.targetIframe, customScript.value)
        customResult.value = result.result
      } catch (error) {
        console.error('执行失败:', error)
        customResult.value = { error: error.message }
      }
    }

    return {
      customScript,
      customResult,
      executing,
      executeCustomScript
    }
  }
}
</script>

<style>
@import './content-script-shared.css';
</style>
