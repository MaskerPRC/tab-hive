import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import archiver from 'archiver'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

// 获取当前文件的目录
const __dirname = path.dirname(fileURLToPath(import.meta.url))

// 读取 package.json 获取版本号
const packageJson = JSON.parse(
  fs.readFileSync(path.resolve(__dirname, 'package.json'), 'utf-8')
)

// 打包chrome-extension目录为zip的插件
function zipChromeExtension() {
  return {
    name: 'zip-chrome-extension',
    closeBundle: async () => {
      const sourceDir = path.resolve('chrome-extension')
      const outputFile = path.resolve('dist/tab-hive-selector-extension.zip')

      console.log('📦 正在打包选择器插件...')

      // 创建输出流
      const output = fs.createWriteStream(outputFile)
      const archive = archiver('zip', {
        zlib: { level: 9 } // 最大压缩
      })

      return new Promise((resolve, reject) => {
        output.on('close', () => {
          console.log(`✅ 选择器插件打包完成: ${archive.pointer()} bytes`)
          resolve()
        })

        archive.on('error', (err) => {
          console.error('❌ 打包失败:', err)
          reject(err)
        })

        archive.pipe(output)

        // 添加chrome-extension目录下的所有文件，但排除README.md和.gitignore
        archive.glob('**/*', {
          cwd: sourceDir,
          ignore: ['README.md', '.gitignore', 'INSTALL.md']
        })

        archive.finalize()
      })
    }
  }
}

export default defineConfig({
  plugins: [
    vue({
      template: {
        compilerOptions: {
          // 将 webview 标签识别为自定义元素，避免Vue警告
          isCustomElement: (tag) => tag === 'webview'
        }
      }
    }),
    zipChromeExtension()
  ],
  base: './', // 使用相对路径，适配Electron
  server: {
    port: 3000,
    open: true
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

