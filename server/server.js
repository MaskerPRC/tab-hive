import express from 'express';
import cors from 'cors';
import sqlite3 from 'sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { existsSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

// 中间件
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// 静态文件服务 - 提供前端构建文件
const distPath = join(__dirname, '../dist');
if (existsSync(distPath)) {
  console.log('✓ 找到前端构建文件，启用静态文件服务');
  app.use(express.static(distPath));
} else {
  console.log('⚠ 未找到前端构建文件 (dist目录)');
  console.log('  请先运行: npm run build');
}

// 获取客户端真实IP
const getClientIP = (req) => {
  return req.headers['x-forwarded-for']?.split(',')[0] ||
         req.headers['x-real-ip'] ||
         req.connection.remoteAddress ||
         req.socket.remoteAddress ||
         '';
};

// 初始化数据库
const db = new sqlite3.Database(join(__dirname, 'layouts.db'), (err) => {
  if (err) {
    console.error('数据库连接失败:', err);
  } else {
    console.log('数据库连接成功');
    initDatabase();
  }
});

// 创建数据库表
function initDatabase() {
  db.serialize(() => {
    // 共享布局表
    db.run(`
      CREATE TABLE IF NOT EXISTS shared_layouts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        layout_data TEXT NOT NULL,
        layout_name TEXT NOT NULL,
        rows INTEGER NOT NULL,
        cols INTEGER NOT NULL,
        website_count INTEGER NOT NULL,
        ip_address TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        views INTEGER DEFAULT 0
      )
    `);

    // IP上传记录表
    db.run(`
      CREATE TABLE IF NOT EXISTS upload_records (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        ip_address TEXT NOT NULL,
        upload_date TEXT NOT NULL,
        upload_count INTEGER DEFAULT 1
      )
    `);

    // 创建索引
    db.run('CREATE INDEX IF NOT EXISTS idx_ip_date ON upload_records(ip_address, upload_date)');
    db.run('CREATE INDEX IF NOT EXISTS idx_created_at ON shared_layouts(created_at DESC)');
  });
}

// 检查IP今日上传次数
function checkIPLimit(ip, callback) {
  const today = new Date().toISOString().split('T')[0];
  
  db.get(
    'SELECT upload_count FROM upload_records WHERE ip_address = ? AND upload_date = ?',
    [ip, today],
    (err, row) => {
      if (err) {
        callback(err, null);
      } else {
        callback(null, row ? row.upload_count : 0);
      }
    }
  );
}

// 更新IP上传记录
function updateUploadRecord(ip, callback) {
  const today = new Date().toISOString().split('T')[0];
  
  db.get(
    'SELECT id, upload_count FROM upload_records WHERE ip_address = ? AND upload_date = ?',
    [ip, today],
    (err, row) => {
      if (err) {
        callback(err);
        return;
      }
      
      if (row) {
        // 更新记录
        db.run(
          'UPDATE upload_records SET upload_count = upload_count + 1 WHERE id = ?',
          [row.id],
          callback
        );
      } else {
        // 创建新记录
        db.run(
          'INSERT INTO upload_records (ip_address, upload_date, upload_count) VALUES (?, ?, 1)',
          [ip, today],
          callback
        );
      }
    }
  );
}

// API: 分享布局
app.post('/api/layouts/share', (req, res) => {
  const ip = getClientIP(req);
  const { layout } = req.body;
  
  if (!layout || !layout.name || !layout.websites) {
    return res.status(400).json({ error: '无效的布局数据' });
  }
  
  // 检查IP限制
  checkIPLimit(ip, (err, count) => {
    if (err) {
      return res.status(500).json({ error: '服务器错误' });
    }
    
    if (count >= 10) {
      return res.status(429).json({ 
        error: '今日分享次数已达上限（10次/天）',
        remaining: 0
      });
    }
    
    // 保存布局
    const layoutData = JSON.stringify(layout);
    db.run(
      `INSERT INTO shared_layouts (layout_data, layout_name, rows, cols, website_count, ip_address)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [layoutData, layout.name, layout.rows, layout.cols, layout.websites.length, ip],
      function(err) {
        if (err) {
          console.error('保存布局失败:', err);
          return res.status(500).json({ error: '保存失败' });
        }
        
        // 更新上传记录
        updateUploadRecord(ip, (err) => {
          if (err) {
            console.error('更新上传记录失败:', err);
          }
          
          res.json({
            message: '分享成功',
            id: this.lastID,
            remaining: 9 - count
          });
        });
      }
    );
  });
});

// API: 获取共享布局列表（支持搜索）
app.get('/api/layouts/shared', (req, res) => {
  const { search, limit = 50, offset = 0 } = req.query;
  
  let sql = `
    SELECT id, layout_name, rows, cols, website_count, created_at, views
    FROM shared_layouts
  `;
  let params = [];
  
  if (search) {
    sql += ' WHERE layout_name LIKE ?';
    params.push(`%${search}%`);
  }
  
  sql += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
  params.push(parseInt(limit), parseInt(offset));
  
  db.all(sql, params, (err, rows) => {
    if (err) {
      console.error('查询失败:', err);
      return res.status(500).json({ error: '查询失败' });
    }
    
    res.json({ layouts: rows });
  });
});

// API: 获取布局详情
app.get('/api/layouts/:id', (req, res) => {
  const { id } = req.params;
  
  db.get(
    'SELECT * FROM shared_layouts WHERE id = ?',
    [id],
    (err, row) => {
      if (err) {
        return res.status(500).json({ error: '查询失败' });
      }
      
      if (!row) {
        return res.status(404).json({ error: '布局不存在' });
      }
      
      // 增加浏览次数
      db.run('UPDATE shared_layouts SET views = views + 1 WHERE id = ?', [id]);
      
      // 解析布局数据
      try {
        const layout = JSON.parse(row.layout_data);
        res.json({
          ...layout,
          id: row.id,
          views: row.views,
          created_at: row.created_at
        });
      } catch (e) {
        res.status(500).json({ error: '数据解析失败' });
      }
    }
  );
});

// API: 检查IP今日剩余次数
app.get('/api/limits/check', (req, res) => {
  const ip = getClientIP(req);
  
  checkIPLimit(ip, (err, count) => {
    if (err) {
      return res.status(500).json({ error: '查询失败' });
    }
    
    res.json({
      used: count,
      remaining: Math.max(0, 10 - count),
      limit: 10
    });
  });
});

// API: 获取统计信息
app.get('/api/stats', (req, res) => {
  db.get('SELECT COUNT(*) as total FROM shared_layouts', (err, row) => {
    if (err) {
      return res.status(500).json({ error: '查询失败' });
    }
    
    res.json({
      totalLayouts: row.total
    });
  });
});

// 健康检查接口
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'Tab Hive API is running',
    version: '1.0.0'
  });
});

// SPA 路由处理 - 所有非API路由都返回 index.html
app.get('*', (req, res) => {
  const indexPath = join(distPath, 'index.html');
  if (existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.status(404).json({ 
      error: '前端文件未找到',
      message: '请先运行 npm run build 构建前端应用'
    });
  }
});

// 启动服务器
app.listen(PORT, () => {
  console.log('');
  console.log('='.repeat(50));
  console.log('🐝 Tab Hive 服务器已启动');
  console.log('='.repeat(50));
  console.log(`📡 服务地址: http://localhost:${PORT}`);
  console.log(`🔧 API 地址: http://localhost:${PORT}/api`);
  console.log(`💾 数据库: ${join(__dirname, 'layouts.db')}`);
  console.log('='.repeat(50));
  console.log('');
});

// 优雅关闭
process.on('SIGINT', () => {
  db.close((err) => {
    if (err) {
      console.error('关闭数据库失败:', err);
    } else {
      console.log('数据库已关闭');
    }
    process.exit(0);
  });
});

