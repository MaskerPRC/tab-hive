<template>
  <div class="form-group">
    <label>目标选择器（可选）：</label>
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
          placeholder="例如：#main-content 或 .video-player"
          class="form-input selector-item-input"
          @keyup.enter="$emit('enter')"
        />
        <button
          type="button"
          class="btn-remove-selector"
          @click="removeSelector(index)"
          title="移除此选择器"
        >
          ✕
        </button>
      </div>
      <button
        type="button"
        class="btn-add-selector"
        @click="addSelector"
        title="添加新选择器"
      >
        ➕ 添加选择器
      </button>
    </div>
    <div class="selector-hint">
      💡 可以添加多个CSS选择器，Grid模式下只显示匹配的元素，隐藏其他内容<br>
      • 多个选择器会同时保留所有匹配的元素<br>
      • 全屏时显示完整页面<br>
      • 留空则始终显示整个页面
    </div>
  </div>
</template>

<script>
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

