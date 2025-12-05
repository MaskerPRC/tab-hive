# 全视界 下载落地页

这是一个独立的 Vue 落地页，用于展示 全视界 应用并提供下载功能。

## 功能特性

- 🎨 现代化的 UI 设计
- 📱 响应式布局，支持移动端
- 🚀 自动获取最新版本下载链接
- 💻 支持 Windows 和 macOS 下载
- ⚡ 基于 Vite 构建，快速开发

## 开发

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev
```

开发服务器将在 `http://localhost:3001` 启动。

## 构建

```bash
# 构建生产版本
npm run build
```

构建产物将输出到 `dist` 目录。

## 预览

```bash
# 预览构建后的版本
npm run preview
```

## 技术栈

- Vue 3
- Vite
- GitHub Releases API

## 下载链接

落地页会自动从 GitHub Releases API 获取最新的发布版本和下载链接：
- Windows: `.exe` 安装包
- macOS: `.dmg` 安装包

GitHub 仓库: [MaskerPRC/tab-hive](https://github.com/MaskerPRC/tab-hive)

