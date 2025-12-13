<template>
  <div v-if="visible" class="test-dialog-overlay" @click.self="handleClose">
    <div class="test-dialog" :class="{ 'dark-mode': darkMode }">
      <div class="test-dialog-header">
        <h3>🤖 测试视觉分析</h3>
        <button class="close-btn" @click="handleClose">×</button>
      </div>
      <div class="test-dialog-body">
        <p class="test-dialog-desc">输入一个简单的问题来测试 LLM 是否能正确分析当前页面：</p>
        <textarea
          v-model="localPrompt"
          placeholder="例如：页面上有输入框吗？&#10;页面显示的是登录页面吗？&#10;页面中有购买按钮吗？"
          class="test-prompt-input"
          rows="4"
        ></textarea>
        <div class="test-examples">
          <div class="examples-title">示例问题：</div>
          <button 
            v-for="example in examplePrompts" 
            :key="example"
            class="example-btn"
            @click="localPrompt = example"
          >
            {{ example }}
          </button>
        </div>
      </div>
      <div class="test-dialog-footer">
        <button class="btn btn-cancel" @click="handleClose">取消</button>
        <button 
          class="btn btn-primary" 
          @click="handleTest" 
          :disabled="!localPrompt.trim() || loading"
        >
          <span v-if="loading">分析中...</span>
          <span v-else>开始测试</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, watch } from 'vue'

export default {
  name: 'TestLLMDialog',
  props: {
    visible: {
      type: Boolean,
      default: false
    },
    websiteId: {
      type: String,
      required: true
    },
    darkMode: {
      type: Boolean,
      default: false
    }
  },
  emits: ['close', 'test'],
  setup(props, { emit }) {
    const localPrompt = ref('')
    const loading = ref(false)

    const examplePrompts = [
      '你看到了什么？请描述页面的主要内容。',
      '页面上有哪些按钮？',
      '页面中是否有输入框？如果有，请描述它们的用途。',
      '页面显示了什么文字内容？',
      '页面的整体布局是什么样的？'
    ]

    // 重置表单当对话框关闭时
    watch(() => props.visible, (newVal) => {
      if (!newVal) {
        localPrompt.value = ''
        loading.value = false
      }
    })

    const handleClose = () => {
      emit('close')
    }

    const handleTest = async () => {
      if (!localPrompt.value.trim() || loading.value) {
        return
      }

      if (!window.electron || !window.electron.monitoring) {
        alert('此功能仅在 Electron 环境中可用')
        return
      }

      loading.value = true
      try {
        const result = await window.electron.monitoring.testLLMVision(
          props.websiteId, 
          localPrompt.value.trim()
        )
        
        loading.value = false
        
        if (result.success) {
          alert(`🤖 LLM 回答：\n\n${result.answer}\n\n───────────────\n\n你的问题：${localPrompt.value}\n\n请检查这个回答是否合理。\n\n如果回答不准确，可能需要：\n1. 调整问题的描述方式（更明确、更具体）\n2. 检查截图是否正确（点击"测试截图"按钮）\n3. 尝试更换不同的 LLM 模型\n4. 检查 LLM API 配置`)
          handleClose()
        } else {
          alert(`测试失败：${result.error}`)
        }
      } catch (error) {
        loading.value = false
        console.error('测试 LLM 视觉分析失败:', error)
        alert('测试失败: ' + error.message)
      }
    }

    return {
      localPrompt,
      loading,
      examplePrompts,
      handleClose,
      handleTest
    }
  }
}
</script>

<style scoped>
.test-dialog-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10001;
  backdrop-filter: blur(4px);
}

.test-dialog {
  background: #fff;
  border-radius: 12px;
  width: 90%;
  max-width: 500px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
}

.test-dialog.dark-mode {
  background: #2d2d2d;
  color: #e0e0e0;
}

.test-dialog-header {
  padding: 20px 24px;
  border-bottom: 1px solid #e0e0e0;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.dark-mode .test-dialog-header {
  border-bottom-color: #444;
}

.test-dialog-header h3 {
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

.test-dialog-body {
  padding: 24px;
}

.test-dialog-desc {
  margin: 0 0 16px 0;
  font-size: 14px;
  color: #666;
}

.dark-mode .test-dialog-desc {
  color: #aaa;
}

.test-prompt-input {
  width: 100%;
  padding: 12px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 14px;
  font-family: inherit;
  resize: vertical;
  box-sizing: border-box;
}

.test-prompt-input:focus {
  outline: none;
  border-color: #4CAF50;
  box-shadow: 0 0 0 3px rgba(76, 175, 80, 0.1);
}

.dark-mode .test-prompt-input {
  background: #3a3a3a;
  border-color: #555;
  color: #e0e0e0;
}

.test-examples {
  margin-top: 16px;
}

.examples-title {
  font-size: 13px;
  font-weight: 500;
  margin-bottom: 8px;
  color: #666;
}

.dark-mode .examples-title {
  color: #aaa;
}

.example-btn {
  display: block;
  width: 100%;
  padding: 8px 12px;
  margin-bottom: 6px;
  background: #f5f5f5;
  border: 1px solid #e0e0e0;
  border-radius: 6px;
  text-align: left;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s;
}

.example-btn:hover {
  background: #e8f5e9;
  border-color: #4CAF50;
}

.dark-mode .example-btn {
  background: #3a3a3a;
  border-color: #555;
  color: #e0e0e0;
}

.dark-mode .example-btn:hover {
  background: #2a4a2a;
  border-color: #66BB6A;
}

.test-dialog-footer {
  padding: 16px 24px;
  border-top: 1px solid #e0e0e0;
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

.dark-mode .test-dialog-footer {
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

.btn-primary:disabled {
  background: #ccc;
  cursor: not-allowed;
}

.dark-mode .btn-primary:disabled {
  background: #555;
}
</style>

