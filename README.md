# 🐝 Tab Hive

一个纯前端的网页工具，支持在同一个页面中集成并查看多个网站。像蜂巢一样组织你的网页！

## 📺 演示视频

[![Tab Hive 演示视频](https://img.youtube.com/vi/z_rfNVBBLWo/maxresdefault.jpg)](https://youtu.be/z_rfNVBBLWo)

点击观看完整演示：[https://youtu.be/z_rfNVBBLWo](https://youtu.be/z_rfNVBBLWo)

## 功能特性

- 🎯 支持添加和管理多个网站
- 📐 Grid 布局展示，可配置行列数
- 🔄 **多布局配置** - 创建多个布局场景，快速切换（如工作、学习、娱乐等）
- 🔍 单击任意网页进行全屏查看
- ↩️ 全屏模式下可缩放回 Grid 状态
- 💾 自动保存配置，下次打开自动恢复
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

### 基本操作

1. **添加网站**：点击空白格子，输入网站名称和网址（支持直接输入域名，如 `google.com`）
2. **删除网站**：鼠标悬停到网站上，点击右上角的删除按钮
3. **调整布局**：通过横向和竖向数量配置来调整 Grid 布局
4. **全屏查看**：点击右上角的全屏按钮查看完整内容
5. **返回网格**：全屏模式下点击退出全屏按钮返回 Grid 视图
6. **拖放添加**：直接从浏览器书签栏或地址栏拖放网址到格子中

### 多布局管理

1. **切换布局**：点击顶部的布局下拉菜单，选择不同的布局场景
2. **新建布局**：点击下拉菜单中的 ➕ 按钮，创建新的布局（如"工作"、"学习"、"娱乐"）
3. **重命名布局**：点击布局列表中的编辑按钮，修改布局名称
4. **删除布局**：点击布局列表中的删除按钮（至少保留一个布局）
5. **自动保存**：所有更改会自动保存，无需手动操作

### 高级功能

- **顶栏自动隐藏**：鼠标移到页面顶部边缘可显示配置面板
- **清除所有配置**：点击顶部的"清除配置"按钮，重置所有布局和设置

## 注意事项

- 某些网站可能因为 CORS 策略或 X-Frame-Options 而无法在 iframe 中显示
- 建议使用支持现代 Web 标准的浏览器

## License

MIT

