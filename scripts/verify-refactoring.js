/**
 * App.vue 重构验证脚本
 * 验证所有新增的 composables 文件是否存在且格式正确
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 颜色输出
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

// 需要验证的文件列表
const filesToCheck = [
  'src/App.vue',
  'src/composables/useLayoutHandlers.js',
  'src/composables/useWebsiteHandlers.js',
  'src/composables/useUpdateHandlers.js',
  'src/composables/useLayoutShareExport.js',
  'src/composables/useMonitoringHandlers.js',
  'src/composables/useAppInitialization.js',
  'src/composables/useSharedLayoutHandlers.js',
  'src/composables/useDownloadModalHandlers.js'
];

// 验证文件是否存在
function checkFileExists(filePath) {
  const fullPath = path.join(__dirname, '..', filePath);
  return fs.existsSync(fullPath);
}

// 获取文件行数
function getFileLines(filePath) {
  const fullPath = path.join(__dirname, '..', filePath);
  const content = fs.readFileSync(fullPath, 'utf-8');
  return content.split('\n').length;
}

// 检查文件是否包含导出
function checkExports(filePath) {
  const fullPath = path.join(__dirname, '..', filePath);
  const content = fs.readFileSync(fullPath, 'utf-8');
  return content.includes('export');
}

// 主验证函数
function verifyRefactoring() {
  log('\n=================================================', 'cyan');
  log('  App.vue 重构验证', 'cyan');
  log('=================================================\n', 'cyan');

  let allPassed = true;
  let totalLines = 0;

  // 检查每个文件
  filesToCheck.forEach((file, index) => {
    const exists = checkFileExists(file);
    const lines = exists ? getFileLines(file) : 0;
    const hasExports = exists ? checkExports(file) : false;

    totalLines += lines;

    log(`${index + 1}. ${file}`, 'blue');
    
    if (!exists) {
      log('   ✗ 文件不存在', 'red');
      allPassed = false;
    } else {
      log(`   ✓ 文件存在 (${lines} 行)`, 'green');
      
      if (file.endsWith('.js')) {
        if (hasExports) {
          log('   ✓ 包含导出', 'green');
        } else {
          log('   ✗ 缺少导出', 'red');
          allPassed = false;
        }
      }
    }
    console.log();
  });

  // 统计信息
  log('=================================================', 'cyan');
  log('  统计信息', 'cyan');
  log('=================================================\n', 'cyan');
  
  const appVueLines = getFileLines('src/App.vue');
  const composablesLines = totalLines - appVueLines;
  
  log(`App.vue 行数: ${appVueLines}`, 'blue');
  log(`新增 Composables 总行数: ${composablesLines}`, 'blue');
  log(`总代码行数: ${totalLines}`, 'blue');
  
  const reduction = ((1020 - appVueLines) / 1020 * 100).toFixed(1);
  log(`\nApp.vue 代码减少: ${reduction}% (从 1020 行减少到 ${appVueLines} 行)`, 'yellow');

  // 最终结果
  log('\n=================================================', 'cyan');
  if (allPassed) {
    log('  ✓ 所有验证通过！重构成功！', 'green');
  } else {
    log('  ✗ 验证失败，请检查上述错误', 'red');
  }
  log('=================================================\n', 'cyan');

  return allPassed ? 0 : 1;
}

// 运行验证
const exitCode = verifyRefactoring();
process.exit(exitCode);

