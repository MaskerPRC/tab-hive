# Tab Hive 后端服务

这是 Tab Hive 的布局分享后端服务，基于 Express + SQLite。

## 功能特性

- ✅ 布局分享：用户可以分享自己的布局配置
- ✅ IP限制：每个IP每天最多分享10个布局
- ✅ 布局搜索：支持按名称搜索共享布局
- ✅ 浏览统计：记录每个布局的浏览次数

## 安装依赖

```bash
npm install
```

## 启动服务

```bash
npm run server
```

服务将运行在 `http://localhost:3101`

## API 接口

### 1. 分享布局
```
POST /api/layouts/share
Content-Type: application/json

{
  "layout": {
    "name": "布局名称",
    "rows": 2,
    "cols": 2,
    "websites": [...]
  }
}
```

### 2. 获取共享布局列表
```
GET /api/layouts/shared?search=关键词&limit=50&offset=0
```

### 3. 获取布局详情
```
GET /api/layouts/:id
```

### 4. 检查IP限制
```
GET /api/limits/check
```

### 5. 获取统计信息
```
GET /api/stats
```

## 数据库

使用 SQLite 数据库，文件保存在 `server/layouts.db`

### 数据表结构

**shared_layouts** - 共享布局表
- id: 布局ID（自增）
- layout_data: 布局数据（JSON）
- layout_name: 布局名称
- rows: 行数
- cols: 列数
- website_count: 网站数量
- ip_address: 分享者IP
- created_at: 创建时间
- views: 浏览次数

**upload_records** - IP上传记录表
- id: 记录ID（自增）
- ip_address: IP地址
- upload_date: 上传日期
- upload_count: 当日上传次数

## 注意事项

1. 首次运行时会自动创建数据库和表结构
2. 数据库文件位于 `server/layouts.db`
3. IP地址从请求头中获取，支持代理场景
4. 每天的上传限制在午夜0点自动重置

## 开发计划

- [ ] 添加用户认证系统
- [ ] 布局点赞和评论功能
- [ ] 热门布局排行榜
- [ ] 布局分类和标签
- [ ] 管理员审核机制

