# 部署指南

本文档介绍如何部署 Tab Hive 应用（包含布局分享功能）。

## 快速开始

### 方式一：一键启动（推荐）

#### Windows
```bash
cd server
start.bat
```

#### Linux/macOS
```bash
cd server
chmod +x start.sh
./start.sh
```

### 方式二：手动启动

```bash
# 1. 构建前端
npm run build

# 2. 启动服务器
npm run server
```

### 方式三：生产环境一键启动

```bash
npm start
```

这个命令会自动构建前端并启动服务器。

## 开发模式

如果你想同时开发前端和后端：

```bash
# 启动前端开发服务器 (Vite) 和后端服务器
npm run dev:all
```

这会同时运行：
- 前端开发服务器：http://localhost:5173
- 后端 API 服务器：http://localhost:3001

## 架构说明

### 生产模式
```
浏览器 → http://localhost:3001
         ├─ /api/*  → 后端 API 接口
         └─ /*      → 前端静态文件 (dist/)
```

### 开发模式
```
浏览器 → http://localhost:5173  (Vite 开发服务器)
         └─ /api/* → http://localhost:3001 (后端 API)
```

## 端口配置

默认端口：`3001`

修改端口：
```bash
# Windows
set PORT=8080 && npm run server

# Linux/macOS
PORT=8080 npm run server
```

## 环境变量

- `PORT`: 服务器端口（默认：3001）
- `NODE_ENV`: 环境模式（development/production）

## 服务器部署

### 1. 准备工作

```bash
# 克隆项目
git clone <your-repo-url>
cd tab-hive

# 安装依赖
npm install

# 构建前端
npm run build
```

### 2. 使用 PM2 部署（推荐）

```bash
# 安装 PM2
npm install -g pm2

# 启动应用
pm2 start server/server.js --name tab-hive

# 查看状态
pm2 status

# 查看日志
pm2 logs tab-hive

# 重启应用
pm2 restart tab-hive

# 停止应用
pm2 stop tab-hive

# 设置开机自启
pm2 startup
pm2 save
```

### 3. 使用 Docker 部署

创建 `Dockerfile`:

```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

EXPOSE 3001

CMD ["node", "server/server.js"]
```

构建和运行：

```bash
# 构建镜像
docker build -t tab-hive .

# 运行容器
docker run -d -p 3001:3001 --name tab-hive tab-hive

# 使用数据卷持久化数据库
docker run -d -p 3001:3001 \
  -v $(pwd)/data:/app/server \
  --name tab-hive tab-hive
```

### 4. 使用 Nginx 反向代理

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## 云平台部署

### Vercel

1. Fork 项目到 GitHub
2. 在 Vercel 导入项目
3. 配置构建命令：`npm run build`
4. 配置输出目录：`dist`
5. 注意：Vercel 不支持 SQLite，需要改用其他数据库

### Railway

1. 连接 GitHub 仓库
2. 自动检测并部署
3. 支持 SQLite 数据持久化

### Heroku

```bash
# 安装 Heroku CLI
heroku login

# 创建应用
heroku create your-app-name

# 部署
git push heroku main

# 查看日志
heroku logs --tail
```

## 数据备份

### 备份数据库

```bash
# 复制数据库文件
cp server/layouts.db server/layouts.db.backup

# 或使用日期命名
cp server/layouts.db server/layouts_$(date +%Y%m%d).db
```

### 恢复数据库

```bash
cp server/layouts.db.backup server/layouts.db
```

### 自动备份脚本

创建 `backup.sh`:

```bash
#!/bin/bash
BACKUP_DIR="./backups"
mkdir -p $BACKUP_DIR
cp server/layouts.db "$BACKUP_DIR/layouts_$(date +%Y%m%d_%H%M%S).db"
echo "数据库已备份"
```

使用 crontab 设置每日自动备份：

```bash
# 编辑 crontab
crontab -e

# 添加每天凌晨2点备份
0 2 * * * /path/to/backup.sh
```

## 性能优化

### 1. 启用 Gzip 压缩

在 `server/server.js` 中添加：

```javascript
import compression from 'compression';
app.use(compression());
```

### 2. 设置缓存

```javascript
app.use(express.static(distPath, {
  maxAge: '1d',
  etag: true
}));
```

### 3. 数据库优化

```sql
-- 定期清理旧数据
DELETE FROM upload_records WHERE upload_date < date('now', '-30 days');

-- 优化数据库
VACUUM;
```

## 监控和日志

### 使用 Winston 记录日志

```bash
npm install winston
```

### 健康检查

访问 `/api/health` 检查服务状态：

```bash
curl http://localhost:3001/api/health
```

## 故障排查

### 问题：前端文件未找到

**解决方案：**
```bash
npm run build
```

### 问题：端口被占用

**解决方案：**
```bash
# 查找占用端口的进程
# Windows
netstat -ano | findstr :3001

# Linux/macOS
lsof -i :3001

# 杀死进程或更换端口
PORT=8080 npm run server
```

### 问题：数据库锁定

**解决方案：**
```bash
# 关闭所有连接
pm2 stop tab-hive

# 删除锁文件
rm server/layouts.db-journal

# 重启
pm2 start tab-hive
```

## 安全建议

1. **使用 HTTPS**：生产环境必须使用 HTTPS
2. **限流保护**：使用 express-rate-limit
3. **输入验证**：验证所有用户输入
4. **定期备份**：设置自动备份任务
5. **更新依赖**：定期更新 npm 包

## 更多信息

- [布局分享功能说明](./SHARE_FEATURE.md)
- [后端 API 文档](./server/README.md)
- [Electron 桌面应用](./ELECTRON.md)

