<template>
  <div v-if="show" class="selector-mapping-overlay" @click.self="handleClose">
    <div class="selector-mapping-config" :class="{ 'dark-mode': darkMode }">
      <div class="config-header">
        <h3>配置元素映射</h3>
        <button class="close-btn" @click="handleClose">×</button>
      </div>

      <div class="config-body">
        <!-- 选择器信息 -->
        <div class="selector-info-section">
          <label>选择器</label>
          <div class="selector-display">
            <code>{{ selectorConfig.selector }}</code>
            <button @click="$emit('reselect')" class="reselect-btn">
              重新选择
            </button>
          </div>
          <input
            v-model="selectorConfig.elementName"
            placeholder="元素名称（如：输入框、按钮等）"
            class="element-name-input"
          />
        </div>

        <!-- 数据映射配置 -->
        <div class="mapping-section">
          <h4>
            <span class="section-icon">📊</span>
            数据映射
          </h4>
          <p class="section-desc">
            配置从此元素提取的数据，每个映射将创建一个数据端口（○）
          </p>

          <div class="mapping-list">
            <div
              v-for="(mapping, index) in selectorConfig.dataMappings"
              :key="mapping.id"
              class="mapping-item"
            >
              <div class="mapping-icon data">○</div>
              <div class="mapping-details">
                <input
                  v-model="mapping.name"
                  placeholder="端口名称"
                  class="mapping-name"
                />
                <select v-model="mapping.type" class="mapping-type">
                  <option value="text">📝 文本内容</option>
                </select>
              </div>
              <button
                @click="removeDataMapping(index)"
                class="remove-btn"
                title="删除"
              >
                ×
              </button>
            </div>

            <div v-if="selectorConfig.dataMappings.length === 0" class="empty-hint">
              暂无数据映射，点击下方按钮添加
            </div>
          </div>

          <button @click="addDataMapping" class="add-mapping-btn">
            + 添加数据映射
          </button>
        </div>

        <!-- 交互映射配置 -->
        <div class="mapping-section">
          <h4>
            <span class="section-icon">⚡</span>
            交互映射
          </h4>
          <p class="section-desc">
            配置可在此元素上执行的操作，每个映射将创建一个交互端口（●）
          </p>

          <div class="mapping-list">
            <div
              v-for="(mapping, index) in selectorConfig.actionMappings"
              :key="mapping.id"
              class="mapping-item"
            >
              <div class="mapping-icon action">●</div>
              <div class="mapping-details">
                <input
                  v-model="mapping.name"
                  placeholder="端口名称"
                  class="mapping-name"
                />
                <select v-model="mapping.type" class="mapping-type">
                  <option value="click">👆 点击</option>
                  <option value="input">⌨️ 输入文本</option>
                </select>
              </div>
              <button
                @click="removeActionMapping(index)"
                class="remove-btn"
                title="删除"
              >
                ×
              </button>
            </div>

            <div v-if="selectorConfig.actionMappings.length === 0" class="empty-hint">
              暂无交互映射，点击下方按钮添加
            </div>
          </div>

          <button @click="addActionMapping" class="add-mapping-btn">
            + 添加交互映射
          </button>
        </div>

        <!-- 预览区域 -->
        <div class="preview-section">
          <h4>🔍 实时预览</h4>
          <div class="preview-hint">
            保存后，在工作流画布中可以看到所有端口
          </div>
          <div class="preview-summary">
            <div class="summary-item">
              <span class="summary-label">数据端口：</span>
              <span class="summary-value">{{ selectorConfig.dataMappings.length }}</span>
            </div>
            <div class="summary-item">
              <span class="summary-label">交互端口：</span>
              <span class="summary-value">{{ selectorConfig.actionMappings.length }}</span>
            </div>
          </div>
        </div>
      </div>

      <div class="config-footer">
        <button @click="handleClose" class="btn btn-cancel">取消</button>
        <button @click="handleSave" class="btn btn-primary">保存配置</button>
      </div>
    </div>
  </div>
</template>

<script>
import { createDataMapping, createActionMapping } from '../../models/workflowModels'

export default {
  name: 'SelectorMappingConfig',
  props: {
    show: {
      type: Boolean,
      default: false
    },
    selectorConfig: {
      type: Object,
      required: true
    },
    darkMode: {
      type: Boolean,
      default: false
    }
  },
  emits: ['close', 'save', 'reselect'],
  setup(props, { emit }) {
    const addDataMapping = () => {
      props.selectorConfig.dataMappings.push(
        createDataMapping('text', '文本数据')
      )
    }

    const addActionMapping = () => {
      props.selectorConfig.actionMappings.push(
        createActionMapping('click', '点击')
      )
    }

    const removeDataMapping = (index) => {
      props.selectorConfig.dataMappings.splice(index, 1)
    }

    const removeActionMapping = (index) => {
      props.selectorConfig.actionMappings.splice(index, 1)
    }

    const handleSave = () => {
      // 验证
      if (!props.selectorConfig.elementName) {
        alert('请输入元素名称')
        return
      }
      
      if (props.selectorConfig.dataMappings.length === 0 && 
          props.selectorConfig.actionMappings.length === 0) {
        alert('请至少添加一个数据映射或交互映射')
        return
      }

      emit('save', props.selectorConfig)
    }

    const handleClose = () => {
      emit('close')
    }

    return {
      addDataMapping,
      addActionMapping,
      removeDataMapping,
      removeActionMapping,
      handleSave,
      handleClose
    }
  }
}
</script>

<style scoped>
.selector-mapping-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10000;
  backdrop-filter: blur(4px);
}

.selector-mapping-config {
  background: #fff;
  border-radius: 12px;
  width: 90%;
  max-width: 700px;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
}

.selector-mapping-config.dark-mode {
  background: #2d2d2d;
  color: #e0e0e0;
}

.config-header {
  padding: 20px 24px;
  border-bottom: 1px solid #e0e0e0;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.dark-mode .config-header {
  border-bottom-color: #444;
}

.config-header h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
}

.close-btn {
  background: none;
  border: none;
  font-size: 28px;
  cursor: pointer;
  color: #666;
  padding: 0;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
  transition: all 0.2s;
}

.close-btn:hover {
  background: #f0f0f0;
  color: #333;
}

.dark-mode .close-btn {
  color: #aaa;
}

.dark-mode .close-btn:hover {
  background: #444;
  color: #fff;
}

.config-body {
  padding: 24px;
  overflow-y: auto;
  flex: 1;
}

.selector-info-section {
  margin-bottom: 24px;
}

.selector-info-section label {
  display: block;
  margin-bottom: 8px;
  font-weight: 500;
  font-size: 14px;
}

.selector-display {
  display: flex;
  gap: 8px;
  align-items: center;
  margin-bottom: 12px;
}

.selector-display code {
  flex: 1;
  background: #f5f5f5;
  padding: 8px 12px;
  border-radius: 6px;
  font-family: 'Courier New', monospace;
  font-size: 13px;
}

.dark-mode .selector-display code {
  background: #3a3a3a;
  color: #e0e0e0;
}

.reselect-btn {
  padding: 6px 12px;
  background: #e0e0e0;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 13px;
  transition: all 0.2s;
}

.reselect-btn:hover {
  background: #d0d0d0;
}

.dark-mode .reselect-btn {
  background: #444;
  color: #e0e0e0;
}

.dark-mode .reselect-btn:hover {
  background: #555;
}

.element-name-input {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 14px;
  font-family: inherit;
  transition: all 0.2s;
  box-sizing: border-box;
}

.element-name-input:focus {
  outline: none;
  border-color: #4CAF50;
  box-shadow: 0 0 0 3px rgba(76, 175, 80, 0.1);
}

.dark-mode .element-name-input {
  background: #3a3a3a;
  border-color: #555;
  color: #e0e0e0;
}

.mapping-section {
  margin-bottom: 24px;
  padding: 16px;
  background: #f9f9f9;
  border-radius: 8px;
}

.dark-mode .mapping-section {
  background: #333;
}

.mapping-section h4 {
  margin: 0 0 8px 0;
  font-size: 16px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.section-icon {
  font-size: 20px;
}

.section-desc {
  margin: 0 0 16px 0;
  font-size: 13px;
  color: #666;
}

.dark-mode .section-desc {
  color: #aaa;
}

.mapping-list {
  margin-bottom: 12px;
}

.mapping-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: #fff;
  border: 1px solid #e0e0e0;
  border-radius: 6px;
  margin-bottom: 8px;
}

.dark-mode .mapping-item {
  background: #2d2d2d;
  border-color: #444;
}

.mapping-icon {
  font-size: 20px;
  width: 24px;
  text-align: center;
  flex-shrink: 0;
}

.mapping-icon.data {
  color: #2563EB;
}

.mapping-icon.action {
  color: #f59e0b;
}

.mapping-details {
  flex: 1;
  display: flex;
  gap: 8px;
  align-items: center;
}

.mapping-name {
  flex: 1;
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 13px;
}

.mapping-name:focus {
  outline: none;
  border-color: #4CAF50;
}

.dark-mode .mapping-name {
  background: #3a3a3a;
  border-color: #555;
  color: #e0e0e0;
}

.mapping-type {
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 13px;
  background: #fff;
  cursor: pointer;
}

.mapping-type:focus {
  outline: none;
  border-color: #4CAF50;
}

.dark-mode .mapping-type {
  background: #3a3a3a;
  border-color: #555;
  color: #e0e0e0;
}

.remove-btn {
  background: none;
  border: none;
  font-size: 24px;
  color: #999;
  cursor: pointer;
  padding: 4px;
  line-height: 1;
  transition: all 0.2s;
  flex-shrink: 0;
}

.remove-btn:hover {
  color: #f44336;
}

.empty-hint {
  padding: 16px;
  text-align: center;
  color: #999;
  font-size: 13px;
  font-style: italic;
}

.add-mapping-btn {
  width: 100%;
  padding: 10px;
  background: #fff;
  border: 2px dashed #ddd;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  color: #666;
  transition: all 0.2s;
}

.add-mapping-btn:hover {
  border-color: #4CAF50;
  color: #4CAF50;
  background: #f9fff9;
}

.dark-mode .add-mapping-btn {
  background: #2d2d2d;
  border-color: #555;
  color: #aaa;
}

.dark-mode .add-mapping-btn:hover {
  border-color: #66BB6A;
  color: #66BB6A;
  background: #2a4a2a;
}

.preview-section {
  padding: 16px;
  background: #f0f7ff;
  border: 1px solid #b3d9ff;
  border-radius: 8px;
}

.dark-mode .preview-section {
  background: #1a2a3a;
  border-color: #2a4a5a;
}

.preview-section h4 {
  margin: 0 0 8px 0;
  font-size: 14px;
}

.preview-hint {
  font-size: 13px;
  color: #666;
  margin-bottom: 12px;
}

.dark-mode .preview-hint {
  color: #aaa;
}

.preview-summary {
  display: flex;
  gap: 24px;
}

.summary-item {
  font-size: 14px;
}

.summary-label {
  color: #666;
}

.dark-mode .summary-label {
  color: #aaa;
}

.summary-value {
  font-weight: 600;
  color: #4CAF50;
  font-size: 16px;
}

.config-footer {
  padding: 16px 24px;
  border-top: 1px solid #e0e0e0;
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

.dark-mode .config-footer {
  border-top-color: #444;
}

.btn {
  padding: 10px 20px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.2s;
}

.btn-cancel {
  background: #f0f0f0;
  color: #333;
}

.btn-cancel:hover {
  background: #e0e0e0;
}

.dark-mode .btn-cancel {
  background: #3a3a3a;
  color: #e0e0e0;
}

.dark-mode .btn-cancel:hover {
  background: #444;
}

.btn-primary {
  background: #4CAF50;
  color: #fff;
}

.btn-primary:hover {
  background: #45a049;
}
</style>

