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
- 🎯 **CSS选择器全屏** - 配置CSS选择器，全屏时只显示指定元素（如视频播放器、文章正文等）
- 💾 自动保存配置，下次打开自动恢复
- 🎨 现代化 UI 设计，主题色 #FF5C00
- 🌐 **布局分享** - 分享你的布局给其他用户，或浏览使用他人分享的布局
- 🔍 **智能搜索** - 快速搜索和发现共享布局
- 🔗 **URL 参数导入** - 通过 URL 参数直接导入网站集合，支持多种格式
- 🔄 **实时同步** - 支持布局的实时同步和模板更新
- 🔌 **插件支持** - 提供 Chrome 插件和桌面客户端两种使用方式

## 👀欢迎加入微信交流群
我正在进行1年100个AI产品挑战
https://100.agitao.net/

![100个AI产品交流群](https://proxy.agitao.me/img)


## 技术栈

### 前端
- Vue 3
- Vite
- JavaScript

### 后端（可选，用于布局分享功能）
- Express.js
- SQLite
- CORS

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

### 插件 vs 桌面客户端

| 特性 | Chrome 插件 | 桌面客户端 |
|------|-------------|------------|
| 安装难度 | 简单 | 中等 |
| 性能 | 好 | 更好 |
| CORS 限制 | 有 | 无 |
| 离线使用 | 否 | 是 |
| 系统资源 | 低 | 中等 |
| 更新方式 | 自动 | 手动 |

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
- **URL 参数导入**：通过 URL 参数直接导入网站集合，支持多种格式
- **实时同步**：支持布局的实时同步和模板更新
- **插件支持**：提供 Chrome 插件和桌面客户端两种使用方式

### 布局分享功能 🆕

Tab Hive 现在支持布局分享！

#### 启动分享服务

```bash
# 安装依赖
npm install

# 启动后端服务
npm run server

# 在另一个终端启动前端
npm run dev
```

#### 使用说明

1. **分享布局**：
   - 打开布局下拉菜单，在"我的布局"标签页
   - 点击布局旁边的分享按钮（绿色图标）
   - 每个IP每天最多可分享10个布局

2. **浏览共享布局**：
   - 切换到"共享布局"标签页
   - 使用搜索框查找感兴趣的布局
   - 点击布局即可导入到你的布局列表

3. **功能特性**：
   - ✅ IP限制保护（每天10个）
   - ✅ 实时搜索
   - ✅ 浏览次数统计
   - ✅ 自动保存到本地

详细说明请查看 [SHARE_FEATURE.md](./SHARE_FEATURE.md)

### URL 参数导入功能 🆕

Tab Hive 现在支持通过 URL 参数直接导入网站集合！

#### 使用方法

1. **简单格式**：`?urls=https://google.com,https://bing.com`
2. **JSON 格式**：`?urls=["https://google.com","https://bing.com"]`
3. **完整配置**：`?urls=[{"url":"https://google.com","title":"谷歌"}]`

#### 可选参数

- `layoutName` - 指定布局名称
- `rows` / `cols` - 指定行列数
- `clearParams` - 是否清除 URL 参数

#### 完整示例

```
http://localhost:3000/?urls=https://twitter.com,https://facebook.com,https://instagram.com&layoutName=社交媒体&rows=2&cols=2
```

详细说明请查看 [URL_IMPORT.md](./URL_IMPORT.md)

### CSS选择器全屏功能 🆕

Tab Hive 现在支持在全屏时只显示iframe中指定CSS选择器的元素！

#### 应用场景

- 🎬 **视频网站** - 只显示视频播放器，隐藏评论和推荐
- 📖 **文章阅读** - 只显示文章正文，屏蔽广告和侧边栏
- 📺 **直播平台** - 聚焦直播画面，隐藏弹幕控制
- 📊 **数据看板** - 展示特定图表或数据面板

#### 使用方法

1. **Electron版本**（内置支持，无需扩展）
   - 添加/编辑网站时填写"目标选择器"
   - 例如：`#movie_player`（YouTube播放器）
   - 全屏时只显示该元素

2. **网页版本**（需要Chrome扩展）
   - 安装Chrome扩展（见下方）
   - 在Tab Hive中配置选择器
   - 全屏时扩展会自动应用

#### 常用选择器示例

```
YouTube:      #movie_player
Bilibili:     .bilibili-player
知乎文章:      .Post-Main
通用视频:      video
```

#### Chrome扩展安装

```bash
1. 打开 chrome://extensions/
2. 启用"开发者模式"
3. 点击"加载已解压的扩展程序"
4. 选择项目中的 chrome-extension 文件夹
```

详细说明请查看：
- [SELECTOR_FEATURE.md](./SELECTOR_FEATURE.md) - 功能详细说明
- [chrome-extension/INSTALL.md](./chrome-extension/INSTALL.md) - Chrome扩展安装指南

## 注意事项

- 某些网站可能因为 CORS 策略或 X-Frame-Options 而无法在 iframe 中显示
- 建议使用支持现代 Web 标准的浏览器
- 首次使用时会提示安装插件或下载桌面客户端

## License

MIT

