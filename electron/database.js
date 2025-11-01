const sqlite3 = require('sqlite3')
const path = require('path')
const fs = require('fs')
const { app } = require('electron')
const { promisify } = require('util')

let db = null

function getDatabasePath() {
  const userDataPath = app.getPath('userData')
  return path.join(userDataPath, 'tab-hive.db')
}

// 创建数据库表
function createTables(callback) {
  db.serialize(() => {
    // 代理配置表
    db.run(`CREATE TABLE IF NOT EXISTS proxies (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      type TEXT NOT NULL,
      host TEXT NOT NULL,
      port INTEGER NOT NULL,
      username TEXT,
      password TEXT,
      cipher TEXT,
      uuid TEXT,
      alterId INTEGER,
      network TEXT,
      plugin TEXT,
      plugin_opts TEXT,
      udp BOOLEAN,
      tfo BOOLEAN,
      is_enabled BOOLEAN DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`, (err) => {
      if (err) {
        console.error('创建表失败:', err)
        if (callback) callback(err)
      } else {
        console.log('数据库表创建成功')

        // 检查并添加缺失的列
        db.all('PRAGMA table_info(proxies)', (err, columns) => {
          if (err) {
            console.error('检查表结构失败:', err)
            if (callback) callback(err)
            return
          }

          const existingColumns = columns.map(col => col.name)
          const columnsToAdd = []

          if (!existingColumns.includes('plugin')) {
            columnsToAdd.push('ALTER TABLE proxies ADD COLUMN plugin TEXT')
          }
          if (!existingColumns.includes('plugin_opts')) {
            columnsToAdd.push('ALTER TABLE proxies ADD COLUMN plugin_opts TEXT')
          }
          if (!existingColumns.includes('udp')) {
            columnsToAdd.push('ALTER TABLE proxies ADD COLUMN udp BOOLEAN')
          }
          if (!existingColumns.includes('tfo')) {
            columnsToAdd.push('ALTER TABLE proxies ADD COLUMN tfo BOOLEAN')
          }

          // 执行 ALTER TABLE
          let completed = 0
          if (columnsToAdd.length === 0) {
            console.log('数据库表结构已是最新')
            if (callback) callback(null)
            return
          }

          columnsToAdd.forEach(sql => {
            db.run(sql, (err) => {
              if (err) {
                console.error('添加列失败:', sql, err)
              } else {
                console.log('成功添加列:', sql)
              }
              completed++
              if (completed === columnsToAdd.length) {
                console.log('数据库表结构更新完成')
                if (callback) callback(null)
              }
            })
          })
        })
      }
    })
  })
}

// 设置数据库
function setupDatabase(callback) {
  const dbPath = getDatabasePath()

  // 确保数据库目录存在
  const dbDir = path.dirname(dbPath)
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true })
  }

  // 连接数据库
  db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
      console.error('数据库连接失败:', err)
      if (callback) callback(err)
      return
    }

    console.log('数据库连接成功:', dbPath)

    // 启用外键约束
    db.run('PRAGMA foreign_keys = ON', (err) => {
      if (err) {
        console.error('启用外键约束失败:', err)
      }
    })

    // 创建表
    createTables((err) => {
      if (err) {
        if (callback) callback(err)
        return
      }
      console.log('数据库初始化完成')
      if (callback) callback(null)
    })
  })

  // 添加错误处理
  db.on('error', (err) => {
    console.error('数据库错误:', err)
  })
}

// 获取数据库实例
function getDatabase() {
  if (!db) {
    throw new Error('数据库未初始化，请先调用 setupDatabase')
  }
  return db
}

// Promise 包装的数据库操作
const query = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    if (!db) {
      reject(new Error('数据库未初始化'))
      return
    }
    db.all(sql, params, (err, rows) => {
      if (err) {
        console.error('查询失败:', err)
        reject(err)
      } else {
        resolve(rows || [])
      }
    })
  })
}

const get = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    if (!db) {
      reject(new Error('数据库未初始化'))
      return
    }
    db.get(sql, params, (err, row) => {
      if (err) {
        console.error('获取失败:', err)
        reject(err)
      } else {
        resolve(row || null)
      }
    })
  })
}

const run = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    if (!db) {
      reject(new Error('数据库未初始化'))
      return
    }
    db.run(sql, params, function(err) {
      if (err) {
        console.error('执行失败:', err)
        reject(err)
      } else {
        resolve({
          id: this.lastID,
          changes: this.changes
        })
      }
    })
  })
}

// Promise 版本的 setupDatabase
function setupDatabaseAsync() {
  return new Promise((resolve, reject) => {
    setupDatabase((err) => {
      if (err) {
        reject(err)
      } else {
        resolve(db)
      }
    })
  })
}

module.exports = {
  setupDatabase: setupDatabaseAsync,
  getDatabase,
  query,
  get,
  run,
  getDatabasePath
}
