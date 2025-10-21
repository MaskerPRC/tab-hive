<template>
  <div class="title-bar" v-if="isElectron">
    <div class="title-bar-drag-region">
      <div class="title-bar-title">
        <svg class="app-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 2L2 7L12 12L22 7L12 2Z" fill="#FFB300"/>
          <path d="M2 17L12 22L22 17V7L12 12L2 7V17Z" fill="#FFA000"/>
        </svg>
        <span>Tab Hive</span>
      </div>
    </div>
    
    <div class="title-bar-controls">
      <button 
        class="title-bar-button minimize" 
        @click="minimize"
        title="最小化"
      >
        <svg width="12" height="12" viewBox="0 0 12 12">
          <rect x="0" y="5" width="12" height="1" fill="currentColor"/>
        </svg>
      </button>
      
      <button 
        class="title-bar-button maximize" 
        @click="toggleMaximize"
        :title="isMaximized ? '还原' : '最大化'"
      >
        <svg v-if="!isMaximized" width="12" height="12" viewBox="0 0 12 12">
          <rect x="1" y="1" width="10" height="10" fill="none" stroke="currentColor" stroke-width="1"/>
        </svg>
        <svg v-else width="12" height="12" viewBox="0 0 12 12">
          <rect x="2" y="0" width="10" height="10" fill="none" stroke="currentColor" stroke-width="1"/>
          <rect x="0" y="2" width="10" height="10" fill="none" stroke="currentColor" stroke-width="1"/>
        </svg>
      </button>
      
      <button 
        class="title-bar-button fullscreen" 
        @click="toggleFullscreen"
        :title="isFullscreen ? '退出全屏' : '全屏'"
      >
        <svg v-if="!isFullscreen" width="12" height="12" viewBox="0 0 12 12">
          <path d="M1 1V4M1 1H4M1 1L4 4" stroke="currentColor" stroke-width="1" fill="none"/>
          <path d="M11 1V4M11 1H8M11 1L8 4" stroke="currentColor" stroke-width="1" fill="none"/>
          <path d="M1 11V8M1 11H4M1 11L4 8" stroke="currentColor" stroke-width="1" fill="none"/>
          <path d="M11 11V8M11 11H8M11 11L8 8" stroke="currentColor" stroke-width="1" fill="none"/>
        </svg>
        <svg v-else width="12" height="12" viewBox="0 0 12 12">
          <path d="M4 4V1M4 4H1M4 4L1 1" stroke="currentColor" stroke-width="1" fill="none"/>
          <path d="M8 4V1M8 4H11M8 4L11 1" stroke="currentColor" stroke-width="1" fill="none"/>
          <path d="M4 8V11M4 8H1M4 8L1 11" stroke="currentColor" stroke-width="1" fill="none"/>
          <path d="M8 8V11M8 8H11M8 8L11 11" stroke="currentColor" stroke-width="1" fill="none"/>
        </svg>
      </button>
      
      <button 
        class="title-bar-button close" 
        @click="close"
        title="关闭"
      >
        <svg width="12" height="12" viewBox="0 0 12 12">
          <line x1="1" y1="1" x2="11" y2="11" stroke="currentColor" stroke-width="1"/>
          <line x1="11" y1="1" x2="1" y2="11" stroke="currentColor" stroke-width="1"/>
        </svg>
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'

const isElectron = ref(false)
const isMaximized = ref(false)
const isFullscreen = ref(false)

onMounted(async () => {
  // 检查是否在 Electron 环境中
  if (window.electron?.isElectron) {
    isElectron.value = true
    
    // 获取初始窗口状态
    if (window.electron.windowControls) {
      isMaximized.value = await window.electron.windowControls.isMaximized()
      isFullscreen.value = await window.electron.windowControls.isFullscreen()
    }
  }
})

const minimize = () => {
  if (window.electron?.windowControls) {
    window.electron.windowControls.minimize()
  }
}

const toggleMaximize = async () => {
  if (window.electron?.windowControls) {
    window.electron.windowControls.maximize()
    // 等待一小段时间后更新状态
    setTimeout(async () => {
      isMaximized.value = await window.electron.windowControls.isMaximized()
    }, 100)
  }
}

const toggleFullscreen = async () => {
  if (window.electron?.windowControls) {
    window.electron.windowControls.fullscreen()
    // 等待一小段时间后更新状态
    setTimeout(async () => {
      isFullscreen.value = await window.electron.windowControls.isFullscreen()
    }, 100)
  }
}

const close = () => {
  if (window.electron?.windowControls) {
    window.electron.windowControls.close()
  }
}
</script>

<style scoped>
.title-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 32px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  user-select: none;
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 10000;
}

.title-bar-drag-region {
  flex: 1;
  display: flex;
  align-items: center;
  height: 100%;
  -webkit-app-region: drag;
  padding-left: 12px;
}

.title-bar-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  font-weight: 500;
}

.app-icon {
  width: 18px;
  height: 18px;
  flex-shrink: 0;
}

.title-bar-controls {
  display: flex;
  height: 100%;
  -webkit-app-region: no-drag;
}

.title-bar-button {
  width: 46px;
  height: 100%;
  border: none;
  background: transparent;
  color: white;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background-color 0.15s ease;
  padding: 0;
}

.title-bar-button:hover {
  background: rgba(255, 255, 255, 0.1);
}

.title-bar-button.close:hover {
  background: #e81123;
}

.title-bar-button:active {
  background: rgba(255, 255, 255, 0.2);
}

.title-bar-button.close:active {
  background: #c70011;
}

.title-bar-button svg {
  pointer-events: none;
}
</style>

