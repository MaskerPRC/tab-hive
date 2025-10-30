<template>
  <div class="form-group">
    <label>{{ $t('targetSelector.title') }}</label>
    <div class="selector-list">
      <div 
        v-for="(selector, index) in modelValue"
        :key="index"
        class="selector-item"
      >
        <input
          :value="selector"
          @input="updateSelector(index, $event.target.value)"
          type="text"
          :placeholder="$t('targetSelector.placeholder')"
          class="form-input selector-item-input"
          @keyup.enter="$emit('enter')"
        />
        <button
          type="button"
          class="btn-remove-selector"
          @click="removeSelector(index)"
          :title="$t('targetSelector.removeSelector')"
        >
          ✕
        </button>
      </div>
      <button
        type="button"
        class="btn-add-selector"
        @click="addSelector"
        :title="$t('targetSelector.addSelector')"
      >
        {{ $t('targetSelector.addSelector') }}
      </button>
    </div>
    <div class="selector-hint">
      {{ $t('targetSelector.hint') }}
    </div>
  </div>
</template>

<script>
import { useI18n } from 'vue-i18n'

export default {
  name: 'TargetSelectorList',
  props: {
    modelValue: {
      type: Array,
      default: () => ['']
    }
  },
  emits: ['update:modelValue', 'enter'],
  setup(props, { emit }) {
    const { t } = useI18n()
    const updateSelector = (index, value) => {
      const newSelectors = [...props.modelValue]
      newSelectors[index] = value
      emit('update:modelValue', newSelectors)
    }

    const addSelector = () => {
      emit('update:modelValue', [...props.modelValue, ''])
    }

    const removeSelector = (index) => {
      if (props.modelValue.length > 1) {
        const newSelectors = props.modelValue.filter((_, i) => i !== index)
        emit('update:modelValue', newSelectors)
      } else {
        // 至少保留一个空输入框
        emit('update:modelValue', [''])
      }
    }

    return {
      updateSelector,
      addSelector,
      removeSelector
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

.selector-hint {
  margin-top: 8px;
  padding: 10px;
  background: #fff4e6;
  border-left: 3px solid #ff9800;
  border-radius: 4px;
  font-size: 12px;
  line-height: 1.6;
  color: #e65100;
}

.selector-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-height: 200px;
  overflow-y: auto;
  padding-right: 4px;
}

/* 自定义滚动条样式 */
.selector-list::-webkit-scrollbar {
  width: 6px;
}

.selector-list::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 3px;
}

.selector-list::-webkit-scrollbar-thumb {
  background: #FF5C00;
  border-radius: 3px;
  transition: background 0.3s ease;
}

.selector-list::-webkit-scrollbar-thumb:hover {
  background: #e64e00;
}

.selector-item {
  display: flex;
  gap: 8px;
  align-items: center;
}

.selector-item-input {
  flex: 1;
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

.btn-remove-selector {
  flex: 0 0 auto;
  width: 36px;
  height: 42px;
  background: #ef4444;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 18px;
  font-weight: bold;
  transition: all 0.3s;
  display: flex;
  align-items: center;
  justify-content: center;
}

.btn-remove-selector:hover {
  background: #dc2626;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(239, 68, 68, 0.3);
}

.btn-add-selector {
  width: 100%;
  padding: 10px 16px;
  background: transparent;
  color: var(--primary-color);
  border: 2px dashed var(--primary-color);
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.3s;
  margin-top: 4px;
}

.btn-add-selector:hover {
  background: var(--primary-light);
  border-style: solid;
  transform: translateY(-1px);
}
</style>

