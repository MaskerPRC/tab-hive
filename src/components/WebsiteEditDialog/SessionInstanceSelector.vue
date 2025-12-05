<template>
  <div class="session-config">
    <label class="config-label">{{ $t('sessionInstance.title') }}</label>
    
    <!-- 警告信息 -->
    <div v-if="isHiddenInstance" class="warning-box">
      <i class="fa-solid fa-circle-exclamation"></i>
      <span>当前正在使用代理专用会话，如需更改共享实例，请先取消下方的代理设置。</span>
    </div>

    <div class="session-selector">
      <div class="select-wrapper">
        <select
          :value="modelValue"
          @change="$emit('update:modelValue', $event.target.value)"
          class="form-select"
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
        <div class="select-arrow">
          <i class="fa-solid fa-chevron-down"></i>
        </div>
      </div>
      <button
        type="button"
        class="btn-new-instance"
        @click="$emit('create-instance')"
        :title="$t('sessionInstance.createHint')"
        :disabled="isHiddenInstance"
      >
        <i class="fa-solid fa-plus"></i> {{ $t('sessionInstance.create') }}
      </button>
      <button
        type="button"
        class="btn-manage-instance"
        @click="$emit('manage-instances')"
        :title="$t('sessionInstance.manageHint')"
        :disabled="isHiddenInstance"
      >
        <i class="fa-solid fa-gear"></i> {{ $t('sessionInstance.manage') }}
      </button>
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
.session-config {
  background: #f9fafb;
  border-radius: 0.75rem;
  padding: 1.25rem;
  border: 1px dashed #d1d5db;
}

.config-label {
  display: block;
  margin-bottom: 1rem;
  color: #374151;
  font-weight: 500;
  font-size: 0.875rem;
}

.warning-box {
  display: flex;
  align-items: flex-start;
  gap: 0.5rem;
  background: #fef2f2;
  color: #dc2626;
  padding: 0.75rem;
  border-radius: 0.5rem;
  border: 1px solid #fecaca;
  margin-bottom: 1rem;
  font-size: 0.75rem;
  line-height: 1.4;
}

.warning-box i {
  margin-top: 0.125rem;
  font-size: 0.75rem;
  flex-shrink: 0;
}

.session-selector {
  display: flex;
  gap: 0.75rem;
  align-items: stretch;
}

.select-wrapper {
  position: relative;
  flex: 1;
}

.form-select {
  width: 100%;
  appearance: none;
  background: white;
  border: 1px solid #e5e7eb;
  color: #1f2937;
  padding: 0.625rem 1rem 0.625rem 1rem;
  padding-right: 2rem;
  border-radius: 0.5rem;
  font-size: 0.875rem;
  transition: all 0.2s;
  cursor: pointer;
}

.form-select:focus {
  outline: none;
  border-color: #f97316;
  box-shadow: 0 0 0 2px rgba(249, 115, 22, 0.1);
}

.form-select:disabled {
  opacity: 0.6;
  background: #f3f4f6;
  cursor: not-allowed;
}

.select-arrow {
  position: absolute;
  right: 0;
  top: 0;
  bottom: 0;
  display: flex;
  align-items: center;
  padding-right: 0.5rem;
  pointer-events: none;
  color: #6b7280;
}

.select-arrow i {
  font-size: 0.75rem;
}

.btn-new-instance {
  flex: 0 0 auto;
  padding: 0.625rem 1rem;
  background: #fff7ed;
  color: #f97316;
  border: none;
  border-radius: 0.5rem;
  cursor: pointer;
  font-size: 0.875rem;
  font-weight: 500;
  transition: all 0.2s;
  white-space: nowrap;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.btn-new-instance:hover:not(:disabled) {
  background: #fed7aa;
}

.btn-new-instance:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-new-instance i {
  font-size: 0.75rem;
}

.btn-manage-instance {
  flex: 0 0 auto;
  padding: 0.625rem 1rem;
  background: #eef2ff;
  color: #6366f1;
  border: none;
  border-radius: 0.5rem;
  cursor: pointer;
  font-size: 0.875rem;
  font-weight: 500;
  transition: all 0.2s;
  white-space: nowrap;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.btn-manage-instance:hover:not(:disabled) {
  background: #e0e7ff;
}

.btn-manage-instance:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-manage-instance i {
  font-size: 0.75rem;
}
</style>

