import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import archiver from 'archiver'
import fs from 'fs'
import path from 'path'

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
  plugins: [vue(), zipChromeExtension()],
  base: './', // 使用相对路径，适配Electron
  server: {
    port: 3000,
    open: true
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true
  }
})

