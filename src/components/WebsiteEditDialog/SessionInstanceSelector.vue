<template>
  <div class="form-group">
    <label>{{ $t('sessionInstance.title') }}</label>
    <div class="session-selector">
      <select
        :value="modelValue"
        @change="$emit('update:modelValue', $event.target.value)"
        class="form-input session-select"
      >
        <option 
          v-for="instance in sessionInstances" 
          :key="instance.id" 
          :value="instance.id"
        >
          {{ instance.name }}
        </option>
      </select>
      <button
        type="button"
        class="btn-new-instance"
        @click="$emit('create-instance')"
        :title="$t('sessionInstance.createHint')"
      >
        {{ $t('sessionInstance.create') }}
      </button>
      <button
        type="button"
        class="btn-manage-instance"
        @click="$emit('manage-instances')"
        :title="$t('sessionInstance.manageHint')"
      >
        {{ $t('sessionInstance.manage') }}
      </button>
    </div>
    <div class="session-hint">
      {{ $t('sessionInstance.hint') }}
    </div>
  </div>
</template>

<script>
import { useI18n } from 'vue-i18n'

export default {
  name: 'SessionInstanceSelector',
  props: {
    modelValue: {
      type: String,
      default: 'default'
    },
    sessionInstances: {
      type: Array,
      required: true
    }
  },
  emits: ['update:modelValue', 'create-instance', 'manage-instances']
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

.session-selector {
  display: flex;
  gap: 10px;
  align-items: stretch;
}

.form-input {
  width: 100%;
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

.session-select {
  flex: 1;
  min-width: 0;
  cursor: pointer;
}

.btn-new-instance {
  flex: 0 0 auto;
  padding: 12px 20px;
  background: var(--primary-color);
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.3s;
  white-space: nowrap;
}

.btn-new-instance:hover {
  background: var(--primary-hover);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(255, 92, 0, 0.3);
}

.btn-manage-instance {
  flex: 0 0 auto;
  padding: 12px 20px;
  background: #6366f1;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.3s;
  white-space: nowrap;
}

.btn-manage-instance:hover {
  background: #4f46e5;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3);
}

.session-hint {
  margin-top: 8px;
  padding: 10px;
  background: #fef3c7;
  border-left: 3px solid #f59e0b;
  border-radius: 4px;
  font-size: 12px;
  line-height: 1.6;
  color: #92400e;
}
</style>

