import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

// 获取当前文件的目录
const __dirname = path.dirname(fileURLToPath(import.meta.url))

// 读取 package.json 获取版本号
const packageJson = JSON.parse(
  fs.readFileSync(path.resolve(__dirname, 'package.json'), 'utf-8')
)

export default defineConfig({
  plugins: [
    vue({
      template: {
        compilerOptions: {
          // 将 webview 标签识别为自定义元素，避免Vue警告
          isCustomElement: (tag) => tag === 'webview'
        }
      }
    })
  ],
  base: './', // 使用相对路径，适配Electron
  server: {
    port: 3000,
    open: false
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true
  },
  define: {
    // 注入版本号到代码中
    '__APP_VERSION__': JSON.stringify("v" + packageJson.version)
  }
})
