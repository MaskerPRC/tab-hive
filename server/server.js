import express from 'express';
import cors from 'cors';
import sqlite3 from 'sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { existsSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3101;

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

// 添加错误处理
db.on('error', (err) => {
  console.error('数据库错误:', err);
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
        views INTEGER DEFAULT 0,
        version INTEGER DEFAULT 1,
        original_id INTEGER,
        last_updated DATETIME DEFAULT CURRENT_TIMESTAMP
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

    // 检查并添加缺失的列
    db.all("PRAGMA table_info(shared_layouts)", (err, columns) => {
      if (err) {
        console.error('获取表结构失败:', err);
        return;
      }
      
      const hasOriginalId = columns.some(col => col.name === 'original_id');
      const hasVersion = columns.some(col => col.name === 'version');
      const hasLastUpdated = columns.some(col => col.name === 'last_updated');
      
      // 使用一个数组来跟踪需要添加的列
      const alterOps = [];
      
      if (!hasOriginalId) {
        console.log('添加 original_id 列...');
        alterOps.push(new Promise((resolve, reject) => {
          db.run('ALTER TABLE shared_layouts ADD COLUMN original_id INTEGER', (err) => {
            if (err) reject(err);
            else resolve();
          });
        }));
      }
      
      if (!hasVersion) {
        console.log('添加 version 列...');
        alterOps.push(new Promise((resolve, reject) => {
          db.run('ALTER TABLE shared_layouts ADD COLUMN version INTEGER DEFAULT 1', (err) => {
            if (err) reject(err);
            else resolve();
          });
        }));
      }
      
      if (!hasLastUpdated) {
        console.log('添加 last_updated 列...');
        alterOps.push(new Promise((resolve, reject) => {
          db.run('ALTER TABLE shared_layouts ADD COLUMN last_updated DATETIME', (err) => {
            if (err) reject(err);
            else resolve();
          });
        }));
      }
      
      // 等待所有 ALTER TABLE 操作完成后再执行后续操作
      Promise.all(alterOps)
        .then(() => {
          // 为现有记录设置 original_id 和 version
          if (!hasOriginalId || !hasVersion) {
            db.run('UPDATE shared_layouts SET original_id = id, version = 1 WHERE original_id IS NULL', (err) => {
              if (err) {
                console.error('更新 original_id 和 version 失败:', err);
              }
            });
          }
          
          // 为现有记录设置默认值
          if (!hasLastUpdated) {
            db.run('UPDATE shared_layouts SET last_updated = created_at WHERE last_updated IS NULL', (err) => {
              if (err) {
                console.error('更新 last_updated 失败:', err);
              }
            });
          }
          
          // 创建索引（在列添加之后）
          db.run('CREATE INDEX IF NOT EXISTS idx_ip_date ON upload_records(ip_address, upload_date)');
          db.run('CREATE INDEX IF NOT EXISTS idx_created_at ON shared_layouts(created_at DESC)');
          db.run('CREATE INDEX IF NOT EXISTS idx_original_id ON shared_layouts(original_id)', (err) => {
            if (err) {
              console.error('创建索引失败:', err);
            } else {
              console.log('✓ 数据库初始化完成');
            }
          });
        })
        .catch((err) => {
          console.error('添加列失败:', err);
        });
    });
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
  const { layout, isUpdate, originalId } = req.body;

  console.log('收到分享请求:', { 
    layoutName: layout?.name, 
    isUpdate, 
    originalId, 
    ip: ip.substring(0, 10) + '...' // 只显示部分IP
  });

  if (!layout || !layout.name || !layout.websites) {
    return res.status(400).json({ error: '无效的布局数据' });
  }

  // 如果是更新操作，检查是否是原作者
  if (isUpdate && originalId) {
    console.log('执行更新操作，originalId:', originalId);
    
    // 查找具有相同 original_id 的最新版本
    db.get(
      'SELECT ip_address, version FROM shared_layouts WHERE original_id = ? ORDER BY version DESC LIMIT 1',
      [originalId],
      (err, row) => {
        if (err) {
          console.error('查询失败:', err);
          return res.status(500).json({ error: '查询失败' });
        }
        
        if (!row) {
          console.error('未找到原始布局，originalId:', originalId);
          return res.status(404).json({ error: '原始布局不存在' });
        }
        
        console.log('找到原始布局:', { ip_address: row.ip_address.substring(0, 10) + '...', version: row.version });
        
        if (row.ip_address !== ip) {
          console.error('IP不匹配，拒绝更新');
          return res.status(403).json({ error: '只有原作者可以更新模板' });
        }

        // 更新版本
        const layoutData = JSON.stringify(layout);
        const newVersion = row.version + 1;
        
        console.log('插入新版本:', newVersion);
        
        db.run(
          `INSERT INTO shared_layouts (layout_data, layout_name, rows, cols, website_count, ip_address, version, original_id, last_updated)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
          [layoutData, layout.name, layout.rows, layout.cols, layout.websites.length, ip, newVersion, originalId],
          function(err) {
            if (err) {
              console.error('更新版本失败:', err);
              return res.status(500).json({ error: '更新失败' });
            }

            console.log('版本更新成功! 新ID:', this.lastID, '新版本:', newVersion);
            
            res.json({
              message: '版本更新成功',
              id: this.lastID,
              version: newVersion
            });
          }
        );
      }
    );
    return;
  }

  // 新建分享，检查IP限制
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
      `INSERT INTO shared_layouts (layout_data, layout_name, rows, cols, website_count, ip_address, version, original_id)
       VALUES (?, ?, ?, ?, ?, ?, 1, NULL)`,
      [layoutData, layout.name, layout.rows, layout.cols, layout.websites.length, ip],
      function(err) {
        if (err) {
          console.error('保存布局失败:', err);
          return res.status(500).json({ error: '保存失败' });
        }

        const layoutId = this.lastID;
        
        // 设置 original_id 为自己的 id（标识这是原始版本）
        db.run('UPDATE shared_layouts SET original_id = ? WHERE id = ?', [layoutId, layoutId]);

        // 更新上传记录
        updateUploadRecord(ip, (err) => {
          if (err) {
            console.error('更新上传记录失败:', err);
          }

          res.json({
            message: '分享成功',
            id: layoutId,
            remaining: 9 - count
          });
        });
      }
    );
  });
});

// API: 获取共享布局列表（支持搜索，只显示最新版本）
app.get('/api/layouts/shared', (req, res) => {
  const { search, limit = 50, offset = 0 } = req.query;

  // 使用子查询获取每个模板的最新版本
  let sql = `
    SELECT s.id, s.layout_name, s.rows, s.cols, s.website_count, s.created_at, s.views, s.version, s.original_id
    FROM shared_layouts s
    INNER JOIN (
      SELECT original_id, MAX(version) as max_version
      FROM shared_layouts
      GROUP BY original_id
    ) latest ON s.original_id = latest.original_id AND s.version = latest.max_version
  `;
  let params = [];

  if (search) {
    sql += ' WHERE s.layout_name LIKE ?';
    params.push(`%${search}%`);
  }

  sql += ' ORDER BY s.created_at DESC LIMIT ? OFFSET ?';
  params.push(parseInt(limit), parseInt(offset));

  db.all(sql, params, (err, rows) => {
    if (err) {
      console.error('查询失败:', err);
      return res.status(500).json({ error: '查询失败' });
    }

    res.json({ layouts: rows });
  });
});

// API: 检查当前IP是否已分享过同名布局
app.get('/api/layouts/check-own', (req, res) => {
  const ip = getClientIP(req);
  const { layoutName } = req.query;

  console.log('检查同名布局请求:', { layoutName, ip: ip.substring(0, 10) + '...' });

  if (!layoutName) {
    return res.status(400).json({ error: '缺少布局名称' });
  }

  // 查找当前IP分享的同名布局的最新版本
  db.get(
    `SELECT s.id, s.version, s.original_id, s.layout_name
     FROM shared_layouts s
     INNER JOIN (
       SELECT original_id, MAX(version) as max_version
       FROM shared_layouts
       WHERE ip_address = ?
       GROUP BY original_id
     ) latest ON s.original_id = latest.original_id AND s.version = latest.max_version
     WHERE s.ip_address = ? AND s.layout_name = ?
     LIMIT 1`,
    [ip, ip, layoutName],
    (err, row) => {
      if (err) {
        console.error('查询失败:', err);
        return res.status(500).json({ error: '查询失败' });
      }

      if (row) {
        console.log('找到同名布局:', { 
          id: row.id, 
          originalId: row.original_id, 
          version: row.version 
        });
        res.json({
          exists: true,
          layoutId: row.id,
          originalId: row.original_id,
          currentVersion: row.version,
          layoutName: row.layout_name
        });
      } else {
        console.log('未找到同名布局');
        res.json({
          exists: false
        });
      }
    }
  );
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
          created_at: row.created_at,
          version: row.version,
          original_id: row.original_id,
          last_updated: row.last_updated
        });
      } catch (e) {
        res.status(500).json({ error: '数据解析失败' });
      }
    }
  );
});

// API: 检查模板更新
app.get('/api/layouts/:originalId/check-update', (req, res) => {
  const { originalId } = req.params;
  const { currentVersion } = req.query;

  // 获取最新版本
  db.get(
    'SELECT id, version, last_updated FROM shared_layouts WHERE original_id = ? ORDER BY version DESC LIMIT 1',
    [originalId],
    (err, row) => {
      if (err) {
        return res.status(500).json({ error: '查询失败' });
      }

      if (!row) {
        return res.status(404).json({ error: '模板不存在' });
      }

      const hasUpdate = row.version > parseInt(currentVersion || 0);
      res.json({
        hasUpdate,
        latestVersion: row.version,
        currentVersion: parseInt(currentVersion || 0),
        latestId: row.id,
        lastUpdated: row.last_updated
      });
    }
  );
});

// API: 获取模板的最新版本数据
app.get('/api/layouts/:originalId/latest', (req, res) => {
  const { originalId } = req.params;

  // 获取最新版本的完整数据
  db.get(
    'SELECT * FROM shared_layouts WHERE original_id = ? ORDER BY version DESC LIMIT 1',
    [originalId],
    (err, row) => {
      if (err) {
        return res.status(500).json({ error: '查询失败' });
      }

      if (!row) {
        return res.status(404).json({ error: '模板不存在' });
      }

      // 增加浏览次数
      db.run('UPDATE shared_layouts SET views = views + 1 WHERE id = ?', [row.id]);

      // 解析布局数据
      try {
        const layout = JSON.parse(row.layout_data);
        res.json({
          ...layout,
          id: row.id,
          views: row.views,
          created_at: row.created_at,
          version: row.version,
          original_id: row.original_id,
          last_updated: row.last_updated
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
    message: '全视界 API is running',
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
  console.log('🐝 全视界 服务器已启动');
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

