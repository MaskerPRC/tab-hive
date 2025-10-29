import { createApp } from 'vue'
import './style.css'
import App from './App.vue'

// 在 Electron 环境中标记 HTML 元素
if (window.electron?.isElectron) {
  document.documentElement.classList.add('electron-env')
  document.body.classList.add('electron-env')
  console.log('[Main] Electron 环境检测完成，背景已设置为透明')
} else {
  console.log('[Main] 浏览器环境检测完成，使用默认背景')
}

createApp(App).mount('#app')

