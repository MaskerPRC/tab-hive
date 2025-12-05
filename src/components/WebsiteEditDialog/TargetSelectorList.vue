<template>
  <div class="selector-config">
    <div class="config-header">
      <label class="config-label">{{ $t('targetSelector.title') }}</label>
      <span class="config-badge">CSS Selectors</span>
    </div>
    <div class="selector-list">
      <div 
        v-for="(selector, index) in modelValue"
        :key="index"
        class="selector-item"
      >
        <div class="input-wrapper">
          <div class="input-icon">
            <i class="fa-solid fa-crosshairs"></i>
          </div>
          <input
            :value="selector"
            @input="updateSelector(index, $event.target.value)"
            type="text"
            :placeholder="$t('targetSelector.placeholder')"
            class="form-input selector-item-input"
            @keyup.enter="$emit('enter')"
          />
        </div>
        <button
          type="button"
          class="btn-remove-selector"
          @click="removeSelector(index)"
          :title="$t('targetSelector.removeSelector')"
        >
          <i class="fa-solid fa-times"></i>
        </button>
      </div>
      <button
        type="button"
        class="btn-add-selector"
        @click="addSelector"
        :title="$t('targetSelector.addSelector')"
      >
        <i class="fa-solid fa-plus"></i>
        {{ $t('targetSelector.addSelector') }}
      </button>
    </div>
    <div class="selector-hint">
      <i class="fa-regular fa-lightbulb"></i>
      <div class="hint-content">
        <p class="hint-title">功能说明：</p>
        <ul class="hint-list">
          <li>可以添加多个 CSS 选择器，Grid 模式下只显示匹配的元素，隐藏其他内容。</li>
          <li>多个选择器会同时保留所有匹配的元素。</li>
          <li><span class="highlight">全屏时显示完整页面</span>，留空则始终显示整个页面。</li>
        </ul>
      </div>
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
.selector-config {
  margin-bottom: 0;
}

.config-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0.75rem;
}

.config-label {
  display: block;
  color: #374151;
  font-weight: 500;
  font-size: 0.875rem;
  margin: 0;
}

.config-badge {
  font-size: 0.75rem;
  background: #f3f4f6;
  color: #6b7280;
  padding: 0.125rem 0.5rem;
  border-radius: 0.25rem;
}

.selector-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.selector-item {
  display: flex;
  gap: 0.5rem;
  align-items: center;
}

.input-wrapper {
  position: relative;
  flex: 1;
}

.input-icon {
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  display: flex;
  align-items: center;
  padding-left: 0.75rem;
  pointer-events: none;
  color: #9ca3af;
}

.input-icon i {
  font-size: 0.875rem;
}

.selector-item-input {
  width: 100%;
  padding: 0.625rem 1rem 0.625rem 2.25rem;
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 0.5rem;
  font-size: 0.875rem;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
  transition: all 0.2s;
}

.selector-item-input:focus {
  outline: none;
  border-color: #f97316;
  box-shadow: 0 0 0 2px rgba(249, 115, 22, 0.1);
  background: white;
}

.btn-remove-selector {
  width: 2.5rem;
  height: 2.5rem;
  background: white;
  color: #9ca3af;
  border: 1px solid transparent;
  border-radius: 0.5rem;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
}

.btn-remove-selector:hover {
  color: #ef4444;
  background: #fef2f2;
  border-color: #fecaca;
}

.btn-remove-selector i {
  font-size: 0.875rem;
}

.btn-add-selector {
  width: 100%;
  padding: 0.625rem 1rem;
  background: transparent;
  color: #f97316;
  border: 2px dashed #fed7aa;
  border-radius: 0.5rem;
  cursor: pointer;
  font-size: 0.875rem;
  font-weight: 500;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
}

.btn-add-selector:hover {
  background: #fff7ed;
  border-color: #f97316;
  border-style: solid;
}

.btn-add-selector i {
  font-size: 0.75rem;
}

.selector-hint {
  margin-top: 1rem;
  background: #fff7ed;
  border-left: 4px solid #f97316;
  padding: 1rem;
  border-radius: 0 0.5rem 0.5rem 0;
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
}

.selector-hint i {
  color: #f97316;
  margin-top: 0.125rem;
  font-size: 0.875rem;
  flex-shrink: 0;
}

.hint-content {
  font-size: 0.875rem;
  color: #374151;
  line-height: 1.5;
}

.hint-title {
  font-weight: 500;
  color: #1f2937;
  margin-bottom: 0.25rem;
  display: block;
}

.hint-list {
  margin: 0.5rem 0 0 0;
  padding-left: 1rem;
  font-size: 0.75rem;
  color: #4b5563;
}

.hint-list li {
  margin: 0.25rem 0;
}

.highlight {
  color: #c2410c;
  font-weight: 500;
}
</style>

