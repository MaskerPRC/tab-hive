import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

// 需要替换的映射关系（按优先级排序，先匹配长的）
const replacements = [
  // 特殊替换（长的先匹配）
  { from: /Tab Hive Chrome Extension/g, to: '全视界 Chrome Extension' },
  { from: /Tab Hive Selector Extension/g, to: '全视界 Selector Extension' },
  { from: /Tab Hive AdBlock/g, to: '全视界 AdBlock' },
  { from: /Tab Hive Logo/g, to: '全视界 Logo' },
  { from: /Tab Hive Extension/g, to: '全视界 Extension' },
  { from: /Tab Hive Setup/g, to: '全视界 Setup' },
  { from: /Tab-Hive-Selector-Extension/g, to: 'QuanShiJie-Selector-Extension' },
  { from: /Tab-Hive-Build-Script/g, to: 'QuanShiJie-Build-Script' },
  
  // 显示文本替换（中文）
  { from: /Tab Hive/g, to: '全视界' },
  { from: /网页蜂巢/g, to: '全视界' },
  { from: /像蜂巢一样/g, to: '像视界一样' },
  { from: /蜂巢/g, to: '视界' },
  
  // 技术标识符替换（保持小写）
  { from: /tab-hive/g, to: 'quanshijie' },
  { from: /tabhive/g, to: 'quanshijie' },
  
  // 驼峰命名替换
  { from: /TabHive/g, to: 'QuanShiJie' },
];

// 需要排除的目录和文件
const excludeDirs = ['node_modules', 'dist', 'release', '.git', 'temp'];
const excludeFiles = ['package-lock.json', 'rename-project.js'];

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
    for (const { from, to } of replacements) {
      if (from.test(newContent)) {
        newContent = newContent.replace(from, to);
        hasChanges = true;
      }
    }

    // 如果有更改，写回文件
    if (hasChanges) {
      fs.writeFileSync(filePath, newContent, 'utf8');
      console.log(`✓ 已更新: ${path.relative(projectRoot, filePath)}`);
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
  console.log('开始批量替换项目名称...\n');
  console.log('替换规则:');
  replacements.forEach(({ from, to }) => {
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

