<template>
  <div class="form-group">
    <label>{{ $t('sessionInstance.title') }}</label>
    <div class="session-selector">
      <select
        :value="modelValue"
        @change="$emit('update:modelValue', $event.target.value)"
        class="form-input session-select"
        :disabled="isHiddenInstance"
      >
        <option 
          v-for="instance in displayInstances" 
          :key="instance.id" 
          :value="instance.id"
        >
          {{ instance.name }}{{ instance.hidden ? ' (代理专用)' : '' }}
        </option>
      </select>
      <button
        type="button"
        class="btn-new-instance"
        @click="$emit('create-instance')"
        :title="$t('sessionInstance.createHint')"
        :disabled="isHiddenInstance"
      >
        {{ $t('sessionInstance.create') }}
      </button>
      <button
        type="button"
        class="btn-manage-instance"
        @click="$emit('manage-instances')"
        :title="$t('sessionInstance.manageHint')"
        :disabled="isHiddenInstance"
      >
        {{ $t('sessionInstance.manage') }}
      </button>
    </div>
    <div v-if="isHiddenInstance" class="session-hint disabled-hint">
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="12" cy="12" r="10"/>
        <path d="M15 9l-6 6m0-6l6 6"/>
      </svg>
      正在使用代理专用会话，如需更改请先取消代理设置
    </div>
    <div v-else class="session-hint">
      {{ $t('sessionInstance.hint') }}
    </div>
  </div>
</template>

<script>
import { computed } from 'vue'
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
  emits: ['update:modelValue', 'create-instance', 'manage-instances'],
  setup(props) {
    // 过滤出可见的 session 实例
    const visibleInstances = computed(() => {
      return props.sessionInstances.filter(inst => !inst.hidden)
    })
    
    // 检查当前值是否是隐藏实例
    const isHiddenInstance = computed(() => {
      const currentInstance = props.sessionInstances.find(inst => inst.id === props.modelValue)
      return currentInstance && currentInstance.hidden
    })
    
    // 如果当前选中的是隐藏实例，也要显示它
    const displayInstances = computed(() => {
      if (isHiddenInstance.value) {
        const currentInstance = props.sessionInstances.find(inst => inst.id === props.modelValue)
        return [currentInstance, ...visibleInstances.value]
      }
      return visibleInstances.value
    })
    
    return {
      displayInstances,
      isHiddenInstance
    }
  }
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

.btn-new-instance:hover:not(:disabled) {
  background: var(--primary-hover);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(255, 92, 0, 0.3);
}

.btn-new-instance:disabled {
  opacity: 0.5;
  cursor: not-allowed;
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

.btn-manage-instance:hover:not(:disabled) {
  background: #4f46e5;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3);
}

.btn-manage-instance:disabled {
  opacity: 0.5;
  cursor: not-allowed;
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

.session-hint.disabled-hint {
  background: #fee;
  border-left-color: #ef4444;
  color: #991b1b;
  display: flex;
  align-items: center;
  gap: 8px;
}

.session-hint.disabled-hint svg {
  flex-shrink: 0;
  stroke: #ef4444;
}

.form-input:disabled {
  background: #f5f5f5;
  cursor: not-allowed;
  opacity: 0.7;
}
</style>

