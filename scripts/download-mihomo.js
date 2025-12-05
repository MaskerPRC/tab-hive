#!/usr/bin/env node

/**
 * 自动下载 mihomo 最新版本的脚本
 * 从 GitHub Releases 下载对应平台的可执行文件
 */

import https from 'https'
import http from 'http'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { dirname } from 'path'
import { pipeline } from 'stream/promises'
import zlib from 'zlib'
import AdmZip from 'adm-zip'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const MIHOMO_REPO = 'MetaCubeX/mihomo'
const RESOURCES_DIR = path.join(__dirname, '../resources')

// 支持的平台配置
const PLATFORM_CONFIG = {
  win32: {
    arch: ['amd64'],
    filePattern: /^mihomo-windows-amd64-v\d+\.\d+\.\d+\.zip$/, // 优先选择无 go 版本的
    extract: 'zip',
    outputNames: {
      'amd64': 'clash-windows-amd64.exe'
    }
  },
  darwin: {
    arch: ['amd64', 'arm64'],
    filePattern: /^mihomo-darwin-(amd64|arm64)-v\d+\.\d+\.\d+\.gz$/, // 优先选择无 go 版本的
    extract: 'gz',
    outputNames: {
      'amd64': 'clash-darwin-amd64',
      'arm64': 'clash-darwin-arm64'
    }
  },
  linux: {
    arch: ['amd64', 'arm64'],
    filePattern: /^mihomo-linux-(amd64|arm64)-v\d+\.\d+\.\d+\.gz$/, // 优先选择无 go 版本的
    extract: 'gz',
    outputNames: {
      'amd64': 'clash-linux-amd64',
      'arm64': 'clash-linux-arm64'
    }
  }
}

/**
 * 获取最新的 release 信息（带重试）
 */
async function getLatestRelease(retries = 3, delay = 5000) {
  const url = `https://api.github.com/repos/${MIHOMO_REPO}/releases/latest`
  
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const release = await new Promise((resolve, reject) => {
        const options = {
          headers: {
            'User-Agent': 'QuanShiJie-Build-Script',
            'Accept': 'application/vnd.github.v3+json'
          }
        }

        https.get(url, options, (res) => {
          let data = ''

          res.on('data', (chunk) => {
            data += chunk
          })

          res.on('end', () => {
            if (res.statusCode === 200) {
              try {
                const release = JSON.parse(data)
                resolve(release)
              } catch (error) {
                reject(new Error(`解析响应失败: ${error.message}`))
              }
            } else if (res.statusCode === 403) {
              const retryAfter = res.headers['retry-after'] || delay / 1000
              reject(new Error(`GitHub API 速率限制 (剩余 ${retries - attempt} 次重试, ${retryAfter}秒后重试)`))
            } else if (res.statusCode === 429) {
              const retryAfter = res.headers['retry-after'] || delay / 1000
              reject(new Error(`GitHub API 速率限制 (剩余 ${retries - attempt} 次重试, ${retryAfter}秒后重试)`))
            } else {
              reject(new Error(`获取 release 失败: HTTP ${res.statusCode}`))
            }
          })
        }).on('error', (error) => {
          reject(new Error(`请求失败: ${error.message}`))
        })
      })
      
      return release
    } catch (error) {
      if (attempt < retries && (error.message.includes('速率限制') || error.message.includes('429'))) {
        const waitTime = delay * attempt
        console.log(`⏳ ${error.message}`)
        console.log(`等待 ${waitTime / 1000} 秒后重试... (尝试 ${attempt + 1}/${retries})\n`)
        await new Promise(resolve => setTimeout(resolve, waitTime))
      } else {
        throw error
      }
    }
  }
}

/**
 * 下载文件
 */
async function downloadFile(url, outputPath) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(outputPath)
    const protocol = url.startsWith('https') ? https : http

    console.log(`📥 下载中: ${url}`)

    protocol.get(url, (response) => {
      if (response.statusCode === 302 || response.statusCode === 301) {
        // 处理重定向
        file.close()
        fs.unlinkSync(outputPath)
        return downloadFile(response.headers.location, outputPath)
          .then(resolve)
          .catch(reject)
      }

      if (response.statusCode !== 200) {
        file.close()
        fs.unlinkSync(outputPath)
        reject(new Error(`下载失败: HTTP ${response.statusCode}`))
        return
      }

      const totalSize = parseInt(response.headers['content-length'] || '0', 10)
      let downloadedSize = 0

      response.on('data', (chunk) => {
        downloadedSize += chunk.length
        if (totalSize > 0) {
          const percent = ((downloadedSize / totalSize) * 100).toFixed(1)
          process.stdout.write(`\r📥 下载进度: ${percent}% (${(downloadedSize / 1024 / 1024).toFixed(2)}MB / ${(totalSize / 1024 / 1024).toFixed(2)}MB)`)
        }
      })

      response.pipe(file)

      file.on('finish', () => {
        file.close()
        console.log('\n✅ 下载完成')
        resolve()
      })

      file.on('error', (err) => {
        file.close()
        fs.unlinkSync(outputPath)
        reject(err)
      })
    }).on('error', (err) => {
      file.close()
      if (fs.existsSync(outputPath)) {
        fs.unlinkSync(outputPath)
      }
      reject(err)
    })
  })
}

/**
 * 解压 zip 文件
 */
async function extractZip(zipPath, outputDir, binaryName) {
  try {
    const zip = new AdmZip(zipPath)
    const entries = zip.getEntries()

    // 查找可执行文件（通常是 mihomo 或 clash）
    let binaryEntry = entries.find(entry => {
      const name = entry.entryName.toLowerCase()
      return (name === 'mihomo' || name === 'mihomo.exe' || name === 'clash' || name === 'clash.exe') && !entry.isDirectory
    })

    if (!binaryEntry) {
      // 如果没有找到，查找任何非目录的文件
      binaryEntry = entries.find(entry => !entry.isDirectory && !entry.entryName.includes('/'))
    }

    if (!binaryEntry) {
      throw new Error('在 zip 文件中未找到可执行文件')
    }

    const outputPath = path.join(outputDir, binaryName)
    
    // 提取文件
    zip.extractEntryTo(binaryEntry, outputDir, false, true)
    
    // 重命名文件
    const extractedPath = path.join(outputDir, binaryEntry.entryName)
    if (extractedPath !== outputPath) {
      fs.renameSync(extractedPath, outputPath)
    }

    // 添加执行权限（在非 Windows 系统上）
    if (process.platform !== 'win32') {
      fs.chmodSync(outputPath, 0o755)
    }

    console.log(`✅ 解压完成: ${outputPath}`)
    return outputPath
  } catch (error) {
    throw new Error(`解压 zip 失败: ${error.message}`)
  }
}

/**
 * 解压 gz 文件
 */
async function extractGz(gzPath, outputDir, binaryName) {
  try {
    const outputPath = path.join(outputDir, binaryName)
    const input = fs.createReadStream(gzPath)
    const gunzip = zlib.createGunzip()
    const output = fs.createWriteStream(outputPath)

    await pipeline(input, gunzip, output)

    // 添加执行权限（在非 Windows 系统上）
    if (process.platform !== 'win32') {
      fs.chmodSync(outputPath, 0o755)
    }

    console.log(`✅ 解压完成: ${outputPath}`)
    return outputPath
  } catch (error) {
    throw new Error(`解压 gz 失败: ${error.message}`)
  }
}

/**
 * 为当前平台下载 mihomo（使用已有的 release 数据）
 */
async function downloadForPlatformWithRelease(platform, arch, release) {
  const config = PLATFORM_CONFIG[platform]
  
  if (!config) {
    console.warn(`⚠️  不支持的平台: ${platform}`)
    return
  }

  // 将 Node.js arch 转换为 mihomo arch
  const archMap = {
    'x64': 'amd64',
    'amd64': 'amd64',
    'arm64': 'arm64'
  }
  
  const mihomoArch = archMap[arch] || 'amd64'
  
  // 如果配置中没有这个架构，跳过
  if (!config.arch.includes(mihomoArch)) {
    console.warn(`⚠️  架构 ${arch} (${mihomoArch}) 在此平台上不支持`)
    return
  }

  console.log(`\n🔍 查找平台: ${platform}, 架构: ${arch} (${mihomoArch})\n`)

  try {
    // 查找匹配的 asset
    const asset = release.assets.find(asset => {
      const fileName = asset.name
      const match = fileName.match(config.filePattern)
      
      if (!match) return false
      
      // 检查架构是否匹配
      if (platform === 'darwin' || platform === 'linux') {
        return fileName.includes(mihomoArch)
      } else if (platform === 'win32') {
        return fileName.includes('amd64') // Windows 只有 amd64
      }
      
      return false
    })

    if (!asset) {
      console.warn(`⚠️  未找到匹配的文件，尝试查找替代版本...`)
      
      // 尝试查找包含 go 版本的
      const fallbackPattern = new RegExp(`^mihomo-${platform === 'win32' ? 'windows' : platform === 'darwin' ? 'darwin' : 'linux'}-${mihomoArch}.*-v\\d+\\.\\d+\\.\\d+\\.(zip|gz)$`)
      const fallbackAsset = release.assets.find(a => fallbackPattern.test(a.name))
      
      if (fallbackAsset) {
        console.log(`✅ 找到替代版本: ${fallbackAsset.name}`)
        const finalAsset = fallbackAsset
        
        // 下载文件
        const tempPath = path.join(__dirname, '../temp', finalAsset.name)
        fs.mkdirSync(path.dirname(tempPath), { recursive: true })
        
        await downloadFile(finalAsset.browser_download_url, tempPath)
        
        // 解压文件
        const outputName = config.outputNames[mihomoArch]
        fs.mkdirSync(RESOURCES_DIR, { recursive: true })
        
        if (finalAsset.name.endsWith('.zip')) {
          await extractZip(tempPath, RESOURCES_DIR, outputName)
        } else if (finalAsset.name.endsWith('.gz')) {
          await extractGz(tempPath, RESOURCES_DIR, outputName)
        }
        
        // 清理临时文件
        fs.unlinkSync(tempPath)
        
        console.log(`\n✅ 完成! 文件已保存到: ${path.join(RESOURCES_DIR, outputName)}\n`)
      } else {
        throw new Error(`未找到 ${platform}/${mihomoArch} 的文件`)
      }
    } else {
      console.log(`✅ 找到文件: ${asset.name} (${(asset.size / 1024 / 1024).toFixed(2)}MB)\n`)
      
      // 下载文件
      const tempPath = path.join(__dirname, '../temp', asset.name)
      fs.mkdirSync(path.dirname(tempPath), { recursive: true })
      
      await downloadFile(asset.browser_download_url, tempPath)
      
      // 解压文件
      const outputName = config.outputNames[mihomoArch]
      fs.mkdirSync(RESOURCES_DIR, { recursive: true })
      
      if (asset.name.endsWith('.zip')) {
        await extractZip(tempPath, RESOURCES_DIR, outputName)
      } else if (asset.name.endsWith('.gz')) {
        await extractGz(tempPath, RESOURCES_DIR, outputName)
      }
      
      // 清理临时文件
      fs.unlinkSync(tempPath)
      
      console.log(`\n✅ 完成! 文件已保存到: ${path.join(RESOURCES_DIR, outputName)}\n`)
    }
  } catch (error) {
    console.error(`\n❌ 错误: ${error.message}\n`)
    throw error
  }
}

/**
 * 为所有支持的平台下载（仅下载必要的平台）
 */
async function downloadAllPlatforms() {
  console.log('🚀 开始下载 mihomo 最新版本（Windows, macOS, Linux）\n')
  
  // 先获取一次 release 信息（避免多次调用 API）
  console.log('📡 获取最新 release 信息...')
  let release
  try {
    release = await getLatestRelease()
    console.log(`✅ 最新版本: ${release.tag_name}\n`)
  } catch (error) {
    console.error(`❌ 获取 release 失败: ${error.message}\n`)
    throw error
  }
  
  // 只下载这几个必要的平台版本
  const platforms = [
    { platform: 'win32', arch: 'x64' },           // Windows amd64
    { platform: 'darwin', arch: 'x64' },          // macOS amd64
    { platform: 'darwin', arch: 'arm64' },       // macOS arm64
    { platform: 'linux', arch: 'x64' },           // Linux amd64
    { platform: 'linux', arch: 'arm64' }         // Linux arm64
  ]

  for (const { platform, arch } of platforms) {
    try {
      await downloadForPlatformWithRelease(platform, arch, release)
    } catch (error) {
      console.error(`下载 ${platform}/${arch} 失败:`, error.message)
    }
  }
  
  console.log('\n✨ 所有平台下载完成!')
}

// 主函数
async function main() {
  const args = process.argv.slice(2)
  
  if (args.includes('--all')) {
    await downloadAllPlatforms()
  } else if (args.includes('--platform')) {
    // 支持通过参数指定平台
    const platformIndex = args.indexOf('--platform')
    const platform = args[platformIndex + 1]
    
    if (!platform || !['win32', 'darwin', 'linux'].includes(platform)) {
      console.error('❌ 无效的平台，支持: win32, darwin, linux')
      process.exit(1)
    }
    
    // 根据平台下载对应架构
    console.log('📡 获取最新 release 信息...')
    const release = await getLatestRelease()
    console.log(`✅ 最新版本: ${release.tag_name}\n`)
    
    if (platform === 'darwin') {
      // macOS 需要下载 x64 和 arm64
      await downloadForPlatformWithRelease('darwin', 'x64', release)
      await downloadForPlatformWithRelease('darwin', 'arm64', release)
    } else if (platform === 'linux') {
      // Linux 需要下载 x64 和 arm64
      await downloadForPlatformWithRelease('linux', 'x64', release)
      await downloadForPlatformWithRelease('linux', 'arm64', release)
    } else if (platform === 'win32') {
      // Windows 只需要 x64
      await downloadForPlatformWithRelease('win32', 'x64', release)
    }
  } else {
    await downloadForPlatform()
  }
}

// 运行（ES 模块方式）
const isMainModule = import.meta.url === `file://${process.argv[1]}`.replace(/\\/g, '/') || import.meta.url.endsWith(process.argv[1].replace(/\\/g, '/'))
if (isMainModule || process.argv[1]?.endsWith('download-mihomo.js')) {
  main()
    .then(() => {
      process.exit(0)
    })
    .catch((error) => {
      console.error('\n❌ 下载失败:', error)
      process.exit(1)
    })
}

/**
 * 为当前平台下载 mihomo（会获取 release 数据）
 */
async function downloadForPlatform(platform = process.platform, arch = process.arch) {
  console.log('📡 获取最新 release 信息...')
  const release = await getLatestRelease()
  console.log(`✅ 最新版本: ${release.tag_name}\n`)
  return downloadForPlatformWithRelease(platform, arch, release)
}

export { downloadForPlatform, downloadAllPlatforms }

