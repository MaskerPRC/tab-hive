# WebContentsView 架构快速启动指南

## 🚀 快速开始

### 1. 安装依赖

首先确保安装了正确的 Electron 版本（需要 v30+ 支持 WebContentsView）：

```bash
npm install
npm install electron@alpha
```

### 2. 启动开发环境

#### 方式一：自动启动（推荐）

```bash
npm run electron:dev
```

这个命令会：
1. 启动 Vite 开发服务器（端口 3000）
2. 等待服务器就绪
3. 自动启动 Electron 应用

#### 方式二：手动启动

终端 1 - 启动开发服务器：
```bash
npm run dev
```

终端 2 - 启动 Electron：
```bash
electron .
```

### 3. 验证新架构

打开应用后，查看控制台日志，应该看到类似输出：

```
[Electron Main] ========== 启动应用 ==========
[Electron Main] ========== 应用已就绪 ==========
[Electron Main] ========== 创建主窗口 ==========
[Electron Main] BaseWindow 创建完成
[Electron Main] 主窗口创建流程完成
```

## 🔍 功能测试

### 测试 1：添加网站

1. 点击右下角的 ➕ 浮动按钮
2. 输入网站信息：
   - 标题：Google
   - URL：https://www.google.com
3. 点击确认

**预期结果：**
- 控制台输出：`[IPC] 创建/更新网站视图`
- 控制台输出：`[ViewManager] 创建视图: website-xxx`
- Google 网站正常显示

### 测试 2：拖拽布局

1. 将鼠标移到网站卡片顶部的拖拽手柄（⋮⋮）
2. 按住鼠标拖拽到新位置
3. 释放鼠标

**预期结果：**
- 网站卡片移动到新位置
- WebContentsView 同步更新位置
- 控制台输出：`[WebContentsView] 更新视图布局`

### 测试 3：调整大小

1. 将鼠标移到网站卡片的右下角
2. 看到调整大小游标后，拖拽调整大小
3. 释放鼠标

**预期结果：**
- 网站卡片大小改变
- WebContentsView 同步调整大小
- 内容自适应新尺寸

### 测试 4：全屏模式

1. 点击网站卡片上的全屏按钮（⛶）
2. 观察全屏效果

**预期结果：**
- 网站占满整个窗口
- 其他网站卡片隐藏
- 顶部显示退出全屏的工具栏
- 控制台输出：`[IPC] 隐藏除 website-xxx 外的所有视图`

### 测试 5：刷新网站

1. 点击网站卡片上的刷新按钮（↻）
2. 观察刷新效果

**预期结果：**
- 网站重新加载
- 控制台输出：`[IPC] 刷新网站视图: website-xxx`

### 测试 6：测试困难网站

尝试添加这些在 iframe 中无法正常工作的网站：

- Twitter/X: https://twitter.com
- Facebook: https://facebook.com
- Instagram: https://instagram.com

**预期结果：**
- 所有网站都能正常加载和显示
- 不会被 X-Frame-Options 阻止

## 🐛 常见问题

### 问题 1：应用启动后看不到任何内容

**检查：**
1. 确保 Vite 开发服务器正在运行（端口 3000）
2. 查看控制台是否有错误信息
3. 尝试刷新应用窗口（Ctrl+R 或 Cmd+R）

**解决：**
```bash
# 停止所有进程，重新启动
npm run electron:dev
```

### 问题 2：网站位置不正确

**检查：**
1. 打开控制台，查看是否有布局计算错误
2. 检查 `[WebContentsView]` 相关日志

**解决：**
- 拖拽或调整大小后，布局应该自动修正
- 如果仍有问题，刷新应用窗口

### 问题 3：视图不显示

**检查：**
1. 查看控制台是否有 `[ViewManager]` 错误
2. 确认 URL 是否有效
3. 检查网络连接

**解决：**
```bash
# 查看详细日志
# 在 electron/main.js 中所有日志都已启用
```

### 问题 4：Electron 版本问题

如果看到错误：`WebContentsView is not a constructor`

**原因：** Electron 版本过低

**解决：**
```bash
npm install electron@alpha
# 或指定版本
npm install electron@30.0.0-alpha.4
```

## 📊 性能监控

### 查看内存使用

在控制台输入：
```javascript
process.memoryUsage()
```

### 查看进程信息

在控制台输入：
```javascript
window.electron.version
```

## 🔧 开发技巧

### 1. 打开 DevTools

应用启动后会自动打开 DevTools（开发模式）。

### 2. 查看 WebContentsView 数量

在控制台输入：
```javascript
// 这需要在主进程中查看
// 当前没有暴露给渲染进程的 API
```

### 3. 重新加载应用

- Windows/Linux: `Ctrl + R`
- macOS: `Cmd + R`

### 4. 强制刷新

- Windows/Linux: `Ctrl + Shift + R`
- macOS: `Cmd + Shift + R`

## 📝 对比测试（iframe vs WebContentsView）

### 在浏览器中测试（iframe 架构）

1. 运行：
```bash
npm run dev
```

2. 在浏览器中打开：http://localhost:3000

3. 尝试添加 Twitter 或 Facebook

**预期结果：** 这些网站无法在 iframe 中加载（被 X-Frame-Options 阻止）

### 在 Electron 中测试（WebContentsView 架构）

1. 运行：
```bash
npm run electron:dev
```

2. 尝试添加相同的网站

**预期结果：** 所有网站都能正常加载

## 🎯 下一步

1. **测试更多网站**
   - 视频网站（YouTube, Bilibili）
   - 地图服务（Google Maps, 百度地图）
   - 在线工具（Figma, Miro）

2. **测试复杂操作**
   - 同时添加 6-8 个网站
   - 快速切换全屏模式
   - 调整窗口大小

3. **性能测试**
   - 长时间运行（30分钟+）
   - 监控内存和 CPU 使用

4. **准备生产构建**
   ```bash
   npm run electron:build:win
   ```

## 📚 更多信息

- 完整文档：参见 `WEBCONTENTSVIEW_MIGRATION.md`
- 技术细节：参见代码注释
- 问题反馈：提交 GitHub Issue

---

祝测试顺利！🎉

