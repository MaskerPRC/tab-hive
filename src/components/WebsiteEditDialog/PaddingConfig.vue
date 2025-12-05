<template>
  <div class="padding-config">
    <label class="config-label">{{ $t('padding.title') }}</label>
    <div class="padding-control">
      <button
        type="button"
        class="control-btn"
        @click="decrease"
        :disabled="modelValue <= 0"
      >
        <i class="fa-solid fa-minus"></i>
      </button>
      <input
        :value="modelValue"
        @input="handleInput($event.target.value)"
        type="number"
        min="0"
        max="50"
        step="1"
        class="padding-input"
        @keyup.enter="$emit('enter')"
      />
      <button
        type="button"
        class="control-btn"
        @click="increase"
        :disabled="modelValue >= 50"
      >
        <i class="fa-solid fa-plus"></i>
      </button>
    </div>
    <div class="padding-hint">
      <i class="fa-regular fa-lightbulb"></i>
      <div class="hint-content">
        <span class="hint-title">提示：</span>
        {{ $t('padding.hint') }}
        <ul class="hint-list">
          <li>默认为 0 (无内边距)</li>
          <li>建议范围: 0-50px</li>
        </ul>
      </div>
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
  emits: ['update:modelValue', 'enter'],
  setup(props, { emit }) {
    const handleInput = (value) => {
      const num = Number(value) || 0
      const clamped = Math.max(0, Math.min(50, num))
      emit('update:modelValue', clamped)
    }

    const decrease = () => {
      if (props.modelValue > 0) {
        emit('update:modelValue', props.modelValue - 1)
      }
    }

    const increase = () => {
      if (props.modelValue < 50) {
        emit('update:modelValue', props.modelValue + 1)
      }
    }

    return {
      handleInput,
      decrease,
      increase
    }
  }
}
</script>

<style scoped>
.padding-config {
  background: #eef2ff;
  border-radius: 0.75rem;
  padding: 1.25rem;
  border: 1px solid #c7d2fe;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.config-label {
  display: block;
  margin-bottom: 0.75rem;
  color: #312e81;
  font-weight: 700;
  font-size: 0.875rem;
}

.padding-control {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 1rem;
}

.control-btn {
  width: 2rem;
  height: 2rem;
  border-radius: 0.25rem;
  background: white;
  color: #6366f1;
  border: 1px solid #c7d2fe;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.control-btn:hover:not(:disabled) {
  background: #eef2ff;
}

.control-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.control-btn i {
  font-size: 0.75rem;
}

.padding-input {
  flex: 1;
  text-align: center;
  padding: 0.375rem 0.5rem;
  border: 1px solid #c7d2fe;
  border-radius: 0.25rem;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
  font-size: 0.875rem;
  font-weight: 700;
  color: #312e81;
  transition: all 0.2s;
}

.padding-input:focus {
  outline: none;
  border-color: #818cf8;
  box-shadow: 0 0 0 2px rgba(99, 102, 241, 0.1);
}

.padding-hint {
  background: rgba(255, 255, 255, 0.6);
  border-radius: 0.5rem;
  padding: 0.75rem;
  display: flex;
  align-items: flex-start;
  gap: 0.5rem;
}

.padding-hint i {
  color: #fbbf24;
  margin-top: 0.125rem;
  font-size: 0.875rem;
  flex-shrink: 0;
}

.hint-content {
  font-size: 0.75rem;
  color: #312e81;
  line-height: 1.5;
}

.hint-title {
  font-weight: 600;
  display: block;
  margin-bottom: 0.25rem;
}

.hint-list {
  margin: 0.25rem 0 0 0;
  padding-left: 1rem;
  color: #4c1d95;
  font-size: 0.75rem;
}

.hint-list li {
  margin: 0.125rem 0;
}
</style>

