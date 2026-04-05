<template>
  <div class="tab-content">
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
</template>

<script>
import { ref, computed, inject } from 'vue'
import { useI18n } from 'vue-i18n'

export default {
  name: 'ActionsTab',
  props: {
    targetIframe: {
      type: Object,
      default: null
    }
  },
  setup(props) {
    const { t } = useI18n()
    const executor = inject('contentScriptExecutor')

    const actionSelectors = ref('')
    const actionType = ref('click')
    const actionResult = ref(null)

    const executing = computed(() => executor.isExecuting.value)

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

    return {
      actionSelectors,
      actionType,
      actionResult,
      executing,
      performAction
    }
  }
}
</script>

<style>
@import './content-script-shared.css';
</style>
