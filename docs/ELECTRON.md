# 🐝 全视界 - Electron 桌面应用

## 功能特性

- ✅ 完全关闭 CORS 限制
- ✅ 无任何网页加载限制
- ✅ 支持所有网站在 iframe 中加载
- ✅ 原生桌面应用体验
- ✅ 跨平台支持 (Windows, macOS, Linux)

## 开发

### 安装依赖

```bash
npm install
```

### 开发模式（同时运行 Web 和 Electron）

```bash
npm run electron:dev
```

这将启动：
1. Vite 开发服务器 (http://localhost:3000)
2. Electron 窗口（加载开发服务器）
3. 开启开发者工具

## 构建

### 构建所有平台

```bash
npm run electron:build
```

### 构建特定平台

```bash
# Windows
npm run electron:build:win

# macOS
npm run electron:build:mac

# Linux
npm run electron:build:linux
```

构建产物将输出到 `release/` 目录。

## 打包格式

- **Windows**: `.exe` 安装程序 (NSIS)
- **macOS**: `.dmg` 磁盘镜像
- **Linux**: `.AppImage` 可执行文件

## 架构支持

- x64 (Intel/AMD 64位)
- arm64 (Apple Silicon / ARM 64位)

## 发布到 GitHub Releases

1. 构建应用：
```bash
npm run electron:build
```

2. 在 GitHub 仓库创建新的 Release

3. 上传 `release/` 目录下的安装包：
   - `全视界 Setup x.x.x.exe` (Windows)
   - `全视界-x.x.x.dmg` (macOS)
   - `全视界-x.x.x.AppImage` (Linux)

## CORS 限制说明

桌面客户端已完全禁用：
- ✅ Web Security
- ✅ CORS 策略
- ✅ X-Frame-Options
- ✅ Content-Security-Policy
- ✅ Site Isolation

这意味着你可以在 iframe 中加载任何网站，包括：
- 银行网站
- 社交媒体
- Google 服务
- 任何设置了 X-Frame-Options 的网站

⚠️ 注意：网页版受浏览器安全策略限制，无法突破 CORS。请使用桌面客户端获得完整功能。

## 图标

应用需要以下图标文件（可选）：
- `public/icon.png` - 通用图标 (512x512)
- `public/icon.ico` - Windows 图标
- `public/icon.icns` - macOS 图标

如果没有这些文件，electron-builder 会使用默认图标。

## 技术栈

- **Electron**: 桌面应用框架
- **Vue 3**: 前端框架
- **Vite**: 构建工具
- **electron-builder**: 打包工具

