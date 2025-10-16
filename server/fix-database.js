import sqlite3 from 'sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const db = new sqlite3.Database(join(__dirname, 'layouts.db'), (err) => {
  if (err) {
    console.error('数据库连接失败:', err);
    process.exit(1);
  }
  console.log('✓ 数据库连接成功');
});

// 修复数据库
async function fixDatabase() {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      // 1. 检查表结构
      console.log('\n1. 检查表结构...');
      db.all("PRAGMA table_info(shared_layouts)", (err, columns) => {
        if (err) {
          console.error('获取表结构失败:', err);
          reject(err);
          return;
        }
        
        console.log('当前列:', columns.map(c => c.name).join(', '));
        
        // 2. 更新 NULL 的 original_id
        console.log('\n2. 修复 original_id 列...');
        db.run(
          'UPDATE shared_layouts SET original_id = id WHERE original_id IS NULL',
          function(err) {
            if (err) {
              console.error('更新失败:', err);
              reject(err);
              return;
            }
            console.log(`✓ 已更新 ${this.changes} 条记录的 original_id`);
            
            // 3. 更新 NULL 的 version
            console.log('\n3. 修复 version 列...');
            db.run(
              'UPDATE shared_layouts SET version = 1 WHERE version IS NULL',
              function(err) {
                if (err) {
                  console.error('更新失败:', err);
                  reject(err);
                  return;
                }
                console.log(`✓ 已更新 ${this.changes} 条记录的 version`);
                
                // 4. 更新 NULL 的 last_updated
                console.log('\n4. 修复 last_updated 列...');
                db.run(
                  'UPDATE shared_layouts SET last_updated = created_at WHERE last_updated IS NULL',
                  function(err) {
                    if (err) {
                      console.error('更新失败:', err);
                      reject(err);
                      return;
                    }
                    console.log(`✓ 已更新 ${this.changes} 条记录的 last_updated`);
                    
                    // 5. 验证修复结果
                    console.log('\n5. 验证修复结果...');
                    db.all(
                      'SELECT id, layout_name, version, original_id FROM shared_layouts ORDER BY id',
                      (err, rows) => {
                        if (err) {
                          console.error('查询失败:', err);
                          reject(err);
                          return;
                        }
                        
                        console.log('\n修复后的数据:');
                        console.table(rows);
                        
                        // 6. 测试查询
                        console.log('\n6. 测试列表查询...');
                        const testSQL = `
                          SELECT s.id, s.layout_name, s.rows, s.cols, s.website_count, s.created_at, s.views, s.version, s.original_id
                          FROM shared_layouts s
                          INNER JOIN (
                            SELECT original_id, MAX(version) as max_version
                            FROM shared_layouts
                            GROUP BY original_id
                          ) latest ON s.original_id = latest.original_id AND s.version = latest.max_version
                          ORDER BY s.created_at DESC
                          LIMIT 10
                        `;
                        
                        db.all(testSQL, (err, rows) => {
                          if (err) {
                            console.error('测试查询失败:', err);
                            reject(err);
                            return;
                          }
                          
                          console.log(`✓ 查询成功，返回 ${rows.length} 条记录`);
                          if (rows.length > 0) {
                            console.log('\n前3条记录:');
                            console.table(rows.slice(0, 3).map(r => ({
                              id: r.id,
                              name: r.layout_name,
                              version: r.version,
                              original_id: r.original_id
                            })));
                          }
                          
                          resolve();
                        });
                      }
                    );
                  }
                );
              }
            );
          }
        );
      });
    });
  });
}

// 运行修复
console.log('==================================================');
console.log('🔧 开始修复数据库');
console.log('==================================================');

fixDatabase()
  .then(() => {
    console.log('\n==================================================');
    console.log('✓ 数据库修复完成！');
    console.log('==================================================\n');
    db.close();
    process.exit(0);
  })
  .catch((err) => {
    console.error('\n❌ 修复失败:', err);
    db.close();
    process.exit(1);
  });

