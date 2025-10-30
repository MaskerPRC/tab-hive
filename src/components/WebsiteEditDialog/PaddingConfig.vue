<template>
  <div class="form-group">
    <label>{{ $t('padding.title') }}</label>
    <input
      :value="modelValue"
      @input="$emit('update:modelValue', Number($event.target.value))"
      type="number"
      min="0"
      max="50"
      step="1"
      placeholder="0"
      class="form-input"
      @keyup.enter="$emit('enter')"
    />
    <div class="padding-hint">
      {{ $t('padding.hint') }}
    </div>
  </div>
</template>

<script>
import { useI18n } from 'vue-i18n'

export default {
  name: 'PaddingConfig',
  props: {
    modelValue: {
      type: Number,
      default: 0
    }
  },
  emits: ['update:modelValue', 'enter']
}
</script>

<style scoped>
.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  color: #333;
  font-weight: 500;
  font-size: 14px;
}

.form-input {
  width: 100%;
  max-width: 150px;
  padding: 12px 15px;
  border: 2px solid #e0e0e0;
  border-radius: 6px;
  font-size: 14px;
  transition: border-color 0.3s;
}

.form-input:focus {
  outline: none;
  border-color: var(--primary-color);
}

.padding-hint {
  margin-top: 8px;
  padding: 10px;
  background: #ede9fe;
  border-left: 3px solid #8b5cf6;
  border-radius: 4px;
  font-size: 12px;
  line-height: 1.6;
  color: #5b21b6;
}
</style>

