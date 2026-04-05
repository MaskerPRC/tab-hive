/**
 * 有效代码行数统计脚本
 * 统计项目中的有效代码量（排除空行、注释行）
 *
 * 用法: node scripts/count-lines.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');

// 要扫描的源码目录
const SCAN_DIRS = ['src', 'server', 'electron', 'scripts', 'frontend', 'public'];

// 排除的目录
const EXCLUDE_DIRS = new Set([
  'node_modules', 'dist', 'release', '.git', 'dev-user-data',
  'temp', 'reference_net_vpn', '.claude'
]);

// 支持的文件扩展名
const EXT_MAP = {
  '.js': 'JavaScript',
  '.mjs': 'JavaScript',
  '.cjs': 'JavaScript',
  '.vue': 'Vue',
  '.ts': 'TypeScript',
  '.tsx': 'TypeScript',
  '.jsx': 'JSX',
  '.css': 'CSS',
  '.scss': 'SCSS',
  '.less': 'Less',
  '.html': 'HTML',
  '.json': 'JSON',
  '.yaml': 'YAML',
  '.yml': 'YAML',
  '.md': 'Markdown',
  '.sh': 'Shell',
};

// 统计结果
const stats = {};

function isExcluded(dirName) {
  return EXCLUDE_DIRS.has(dirName);
}

/**
 * 计算有效代码行数（排除空行和注释行）
 */
function countEffectiveLines(content, ext) {
  const lines = content.split('\n');
  let total = lines.length;
  let blank = 0;
  let comment = 0;
  let inBlockComment = false;

  for (const line of lines) {
    const trimmed = line.trim();

    // 空行
    if (trimmed === '') {
      blank++;
      continue;
    }

    // JSON / HTML / YAML / Markdown 不做注释统计
    if (['.json', '.html', '.yaml', '.yml', '.md'].includes(ext)) {
      continue;
    }

    // 块注释处理
    if (inBlockComment) {
      comment++;
      if (trimmed.includes('*/')) {
        inBlockComment = false;
      }
      continue;
    }

    // 块注释开始
    if (trimmed.startsWith('/*')) {
      comment++;
      if (!trimmed.includes('*/')) {
        inBlockComment = true;
      }
      continue;
    }

    // 单行注释
    if (trimmed.startsWith('//') || trimmed.startsWith('#') && ['.sh', '.yaml', '.yml'].includes(ext)) {
      comment++;
      continue;
    }

    // HTML 注释 (简单处理)
    if (trimmed.startsWith('<!--') && trimmed.endsWith('-->')) {
      comment++;
      continue;
    }
  }

  const effective = total - blank - comment;
  return { total, blank, comment, effective };
}

/**
 * 递归扫描目录
 */
function scanDir(dir) {
  if (!fs.existsSync(dir)) return;

  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      if (!isExcluded(entry.name)) {
        scanDir(fullPath);
      }
    } else if (entry.isFile()) {
      const ext = path.extname(entry.name).toLowerCase();
      const lang = EXT_MAP[ext];
      if (!lang) continue;

      const content = fs.readFileSync(fullPath, 'utf-8');
      const result = countEffectiveLines(content, ext);

      if (!stats[lang]) {
        stats[lang] = { files: 0, total: 0, blank: 0, comment: 0, effective: 0 };
      }
      stats[lang].files++;
      stats[lang].total += result.total;
      stats[lang].blank += result.blank;
      stats[lang].comment += result.comment;
      stats[lang].effective += result.effective;
    }
  }
}

// 扫描根目录下的配置文件
function scanRootFiles() {
  const entries = fs.readdirSync(ROOT, { withFileTypes: true });
  for (const entry of entries) {
    if (!entry.isFile()) continue;
    const ext = path.extname(entry.name).toLowerCase();
    const lang = EXT_MAP[ext];
    if (!lang) continue;

    const content = fs.readFileSync(path.join(ROOT, entry.name), 'utf-8');
    const result = countEffectiveLines(content, ext);

    if (!stats[lang]) {
      stats[lang] = { files: 0, total: 0, blank: 0, comment: 0, effective: 0 };
    }
    stats[lang].files++;
    stats[lang].total += result.total;
    stats[lang].blank += result.blank;
    stats[lang].comment += result.comment;
    stats[lang].effective += result.effective;
  }
}

// === 执行统计 ===
console.log('='.repeat(70));
console.log('  项目有效代码量统计');
console.log('  扫描目录:', SCAN_DIRS.join(', '), '+ 根目录配置文件');
console.log('='.repeat(70));
console.log();

for (const dir of SCAN_DIRS) {
  scanDir(path.join(ROOT, dir));
}
scanRootFiles();

// 按有效代码行数排序
const sorted = Object.entries(stats).sort((a, b) => b[1].effective - a[1].effective);

// 输出表格
const header = `${'语言'.padEnd(14)} ${'文件数'.padStart(6)} ${'总行数'.padStart(8)} ${'空行'.padStart(8)} ${'注释行'.padStart(8)} ${'有效代码'.padStart(8)}`;
console.log(header);
console.log('-'.repeat(70));

let grandTotal = { files: 0, total: 0, blank: 0, comment: 0, effective: 0 };

for (const [lang, s] of sorted) {
  console.log(
    `${lang.padEnd(14)} ${String(s.files).padStart(6)} ${String(s.total).padStart(8)} ${String(s.blank).padStart(8)} ${String(s.comment).padStart(8)} ${String(s.effective).padStart(8)}`
  );
  grandTotal.files += s.files;
  grandTotal.total += s.total;
  grandTotal.blank += s.blank;
  grandTotal.comment += s.comment;
  grandTotal.effective += s.effective;
}

console.log('-'.repeat(70));
console.log(
  `${'合计'.padEnd(14)} ${String(grandTotal.files).padStart(6)} ${String(grandTotal.total).padStart(8)} ${String(grandTotal.blank).padStart(8)} ${String(grandTotal.comment).padStart(8)} ${String(grandTotal.effective).padStart(8)}`
);
console.log();
console.log(`有效代码占比: ${(grandTotal.effective / grandTotal.total * 100).toFixed(1)}%`);
console.log();
