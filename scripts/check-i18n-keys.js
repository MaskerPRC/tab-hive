#!/usr/bin/env node

/**
 * 检查 Vue 文件中未在中文语言文件中配置的 i18n key
 * 
 * 使用方法：
 * node scripts/check-i18n-keys.js [文件路径]
 * 
 * 如果不提供文件路径，检查所有 src 目录下的 Vue 文件
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const zhLocaleFile = 'src/i18n/locales/zh.js'

// 读取文件内容
function readFile(filePath) {
  try {
    return fs.readFileSync(filePath, 'utf-8')
  } catch (error) {
    console.error(`❌ 无法读取文件: ${filePath}`)
    console.error(error.message)
    return null
  }
}

// 从 Vue 文件中提取所有 i18n key
function extractI18nKeys(content) {
  const keys = new Set()
  
  // 匹配 $t('key') 或 $t("key")
  const dollarTRegex = /\$t\(['"]([^'"]+)['"]\)/g
  let match
  while ((match = dollarTRegex.exec(content)) !== null) {
    keys.add(match[1])
  }
  
  // 匹配 t('key') 或 t("key")
  const tRegex = /\bt\(['"]([^'"]+)['"]\)/g
  while ((match = tRegex.exec(content)) !== null) {
    keys.add(match[1])
  }
  
  return Array.from(keys).sort()
}

// 解析语言文件（通过动态 import 加载）
async function parseLocaleFile(filePath) {
  try {
    // 读取文件内容
    const content = fs.readFileSync(filePath, 'utf-8')
    
    // 创建一个临时文件来 import（因为原文件使用 export default）
    const tempFile = path.join(__dirname, '../temp-zh-locale.js')
    
    // 将 export default 转换为 export
    const modifiedContent = content.replace(/export\s+default\s+/, 'export default ')
    
    // 写入临时文件
    fs.writeFileSync(tempFile, modifiedContent, 'utf-8')
    
    // 动态 import 临时文件
    const localeModule = await import(`file://${tempFile.replace(/\\/g, '/')}`)
    const locale = localeModule.default
    
    // 删除临时文件
    try {
      fs.unlinkSync(tempFile)
    } catch (e) {
      // 忽略删除错误
    }
    
    return locale
  } catch (error) {
    console.error('❌ 无法解析语言文件:', error.message)
    return null
  }
}

// 检查 key 是否存在于语言对象中
function checkKeyExists(obj, key) {
  const parts = key.split('.')
  let current = obj
  
  for (const part of parts) {
    if (current && typeof current === 'object' && part in current) {
      current = current[part]
    } else {
      return false
    }
  }
  
  // 确保最终值不是对象（即是一个实际的翻译值）
  return current !== undefined && current !== null && typeof current !== 'object'
}

// 递归查找所有 Vue 文件
function findVueFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir)
  
  files.forEach(file => {
    const filePath = path.join(dir, file)
    const stat = fs.statSync(filePath)
    
    if (stat.isDirectory()) {
      findVueFiles(filePath, fileList)
    } else if (file.endsWith('.vue')) {
      fileList.push(filePath)
    }
  })
  
  return fileList
}

// 检查单个文件
function checkFile(filePath, zhLocale) {
  const content = readFile(filePath)
  if (!content) return { keys: [], missing: [] }
  
  const i18nKeys = extractI18nKeys(content)
  const missingKeys = i18nKeys.filter(key => !checkKeyExists(zhLocale, key))
  
  return { keys: i18nKeys, missing: missingKeys }
}

// 主函数
async function main() {
  const targetFile = process.argv[2]
  
  // 读取并解析中文语言文件
  const zhLocale = await parseLocaleFile(zhLocaleFile)
  if (!zhLocale) {
    console.error('\n❌ 无法解析中文语言文件')
    process.exit(1)
  }
  
  let filesToCheck = []
  
  if (targetFile) {
    // 检查指定文件
    filesToCheck = [targetFile]
    console.log(`\n🔍 检查文件: ${targetFile}`)
  } else {
    // 检查所有 Vue 文件
    const srcDir = path.join(__dirname, '..', 'src')
    const vueFiles = findVueFiles(srcDir)
    filesToCheck = vueFiles.map(f => path.relative(path.join(__dirname, '..'), f))
    console.log(`\n🔍 检查所有 Vue 文件 (共 ${vueFiles.length} 个)`)
  }
  
  console.log(`📝 语言文件: ${zhLocaleFile}\n`)
  
  const allMissingKeys = new Set()
  const fileResults = []
  
  // 检查每个文件
  for (const file of filesToCheck) {
    const result = checkFile(file, zhLocale)
    if (result.missing.length > 0) {
      fileResults.push({ file, missing: result.missing })
      result.missing.forEach(key => allMissingKeys.add(key))
    }
  }
  
  // 输出结果
  if (allMissingKeys.size === 0) {
    console.log(`✅ 所有 i18n key 都已配置！\n`)
    process.exit(0)
  }
  
  console.log(`\n📊 检查结果:`)
  console.log(`   ❌ 发现 ${allMissingKeys.size} 个未配置的 key\n`)
  
  // 按文件分组显示
  fileResults.forEach(({ file, missing }) => {
    console.log(`\n📄 ${file}:`)
    missing.forEach(key => {
      console.log(`   - ${key}`)
    })
  })
  
  // 汇总所有缺失的 key
  console.log(`\n\n📋 所有缺失的 key (共 ${allMissingKeys.size} 个):`)
  Array.from(allMissingKeys).sort().forEach(key => {
    console.log(`   - ${key}`)
  })
  
  process.exit(1)
}

// 运行主函数
main().catch(error => {
  console.error('❌ 发生错误:', error)
  process.exit(1)
})
