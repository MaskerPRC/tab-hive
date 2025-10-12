# 🐝 Tab Hive

一个纯前端的网页工具，支持在同一个页面中集成并查看多个网站。像蜂巢一样组织你的网页！

## 功能特性

- 🎯 支持添加和管理多个网站
- 📐 Grid 布局展示，可配置行列数
- 🔍 单击任意网页进行全屏查看
- ↩️ 全屏模式下可缩放回 Grid 状态
- 🎨 现代化 UI 设计，主题色 #FF5C00

## 技术栈

- Vue 3
- Vite
- JavaScript

## 安装与运行

### Web 版本

#### 安装依赖

```bash
npm install
```

#### 开发模式

```bash
npm run dev
```

#### 构建生产版本

```bash
npm run build
```

#### 预览生产版本

```bash
npm run preview
```

### 桌面客户端

#### 下载安装包

前往 [Releases](https://github.com/MaskerPRC/tab-hive/releases) 页面下载最新版本：
- Windows: `Tab Hive Setup.exe`
- macOS: `Tab Hive.dmg`
- Linux: `Tab Hive.AppImage`

#### 从源码构建

```bash
# 安装依赖
npm install

# 开发模式（同时运行 Web 和 Electron）
npm run electron:dev

# 构建桌面应用
npm run electron:build
```

详细说明请查看 [ELECTRON.md](./ELECTRON.md)

### 为什么要使用桌面客户端？

✅ **完全无 CORS 限制** - 可以加载任何网站，包括银行、社交媒体等  
✅ **更好的性能** - 原生桌面应用体验  
✅ **离线可用** - 无需浏览器  
✅ **独立窗口** - 不占用浏览器标签页

## 使用说明

1. **配置网站**：在顶部配置面板中添加你想要集成的网站网址
2. **调整布局**：通过横向和竖向数量配置来调整 Grid 布局
3. **全屏查看**：点击任意网页右上角的全屏按钮查看完整内容
4. **返回网格**：全屏模式下点击退出全屏按钮返回 Grid 视图

## 注意事项

- 某些网站可能因为 CORS 策略或 X-Frame-Options 而无法在 iframe 中显示
- 建议使用支持现代 Web 标准的浏览器

## License

MIT

