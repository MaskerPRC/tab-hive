import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

// 需要恢复的映射关系（保持兼容性）
const restoreReplacements = [
  // GitHub 仓库链接
  { from: /MaskerPRC\/quanshijie/g, to: 'MaskerPRC/tab-hive' },
  
  // 安装目录相关（appId）
  { from: /com\.maskerprc\.quanshijie/g, to: 'com.maskerprc.tabhive' },
  
  // 数据库文件名（数据兼容）
  { from: /quanshijie\.db/g, to: 'tab-hive.db' },
  
  // 临时更新目录（保持兼容）
  { from: /quanshijie-updates/g, to: 'tab-hive-updates' },
];

// 需要排除的目录和文件
const excludeDirs = ['node_modules', 'dist', 'release', '.git', 'temp'];
const excludeFiles = ['restore-compatibility.js', 'rename-project.js'];

// 需要处理的文件扩展名
const fileExtensions = ['.js', '.vue', '.json', '.md', '.html', '.css', '.yml', '.yaml', '.txt'];

function shouldProcessFile(filePath) {
  const relativePath = path.relative(projectRoot, filePath);
  const parts = relativePath.split(path.sep);
  
  // 检查是否在排除的目录中
  for (const part of parts) {
    if (excludeDirs.includes(part)) {
      return false;
    }
  }
  
  // 检查文件名
  const fileName = path.basename(filePath);
  if (excludeFiles.includes(fileName)) {
    return false;
  }
  
  // 检查文件扩展名
  const ext = path.extname(filePath);
  return fileExtensions.includes(ext);
}

function processFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    let newContent = content;
    let hasChanges = false;

    // 应用所有替换规则
    for (const { from, to } of restoreReplacements) {
      if (from.test(newContent)) {
        newContent = newContent.replace(from, to);
        hasChanges = true;
      }
    }

    // 如果有更改，写回文件
    if (hasChanges) {
      fs.writeFileSync(filePath, newContent, 'utf8');
      console.log(`✓ 已恢复: ${path.relative(projectRoot, filePath)}`);
      return true;
    }
    return false;
  } catch (error) {
    console.error(`✗ 处理文件失败 ${filePath}:`, error.message);
    return false;
  }
}

function walkDir(dir, callback) {
  const files = fs.readdirSync(dir);
  
  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      // 检查是否应该排除此目录
      if (!excludeDirs.includes(file)) {
        walkDir(filePath, callback);
      }
    } else if (stat.isFile()) {
      if (shouldProcessFile(filePath)) {
        callback(filePath);
      }
    }
  }
}

function main() {
  console.log('开始恢复兼容性设置...\n');
  console.log('恢复规则:');
  restoreReplacements.forEach(({ from, to }) => {
    console.log(`  ${from} -> ${to}`);
  });
  console.log('\n');

  let totalFiles = 0;
  let updatedFiles = 0;

  // 遍历所有需要处理的文件
  walkDir(projectRoot, (filePath) => {
    totalFiles++;
    const updated = processFile(filePath);
    if (updated) {
      updatedFiles++;
    }
  });

  console.log(`\n完成！共处理 ${totalFiles} 个文件，更新了 ${updatedFiles} 个文件。`);
}

main();

