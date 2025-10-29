# WebContentsView 架构迁移说明

## 概述

本项目已从基于 iframe 的架构迁移到使用 Electron 的 WebContentsView API。这一变更解决了 iframe 架构的诸多问题，提供了更好的性能和兼容性。

## 主要变更

### 1. 主进程 (electron/main.js)

**之前:** 使用 BrowserWindow + iframe
- 所有网站内容在渲染进程的 iframe 中加载
- 需要复杂的脚本注入来处理 iframe 交互
- 受到 iframe 跨域和安全策略限制

**现在:** 使用 BaseWindow + WebContentsView
- 每个网站有独立的 WebContentsView
- 原生支持多视图布局
- 更好的性能和资源隔离
- 避免了 iframe 的诸多限制

#### 主要功能：

1. **WebContentsViewManager 类**
   - 管理所有网站视图的创建、更新、删除
   - 处理视图的位置和大小
   - 自动配置 CORS 和 Cookie 处理

2. **IPC 处理**
   - `create-website-view`: 创建或更新网站视图
   - `update-website-view`: 更新视图属性
   - `remove-website-view`: 删除视图
   - `refresh-website-view`: 刷新视图内容
   - `execute-in-view`: 在视图中执行 JavaScript
   - `hide-all-views-except`: 全屏模式支持
   - `show-all-views`: 退出全屏
   - `get-window-bounds`: 获取窗口尺寸

### 2. Preload 脚本 (electron/preload.js)

提供了完整的 WebContentsView 管理 API：

```javascript
window.electron.views.createOrUpdate(id, url, bounds, visible)
window.electron.views.update(id, options)
window.electron.views.remove(id)
window.electron.views.refresh(id)
window.electron.views.executeJS(id, code)
window.electron.views.hideAllExcept(id)
window.electron.views.showAll()
window.electron.views.getWindowBounds()
```

### 3. 前端组件

#### src/composables/useWebContentsView.js (新增)

负责协调前端和 WebContentsView 的通信：

- **视图创建和管理**: 自动创建、更新、删除视图
- **布局同步**: 将前端布局信息同步到 WebContentsView
- **全屏支持**: 处理全屏模式的视图切换
- **窗口大小监听**: 响应窗口大小变化

#### src/components/GridView.vue (更新)

集成了 WebContentsView 管理：

- 在 Electron 环境中使用 WebContentsView
- 在浏览器环境中保持 iframe 方式
- 监听布局变化并同步到视图
- 拖拽和调整大小后自动更新视图

#### src/components/WebsiteCard.vue (更新)

- 在 Electron 中渲染占位符，由 WebContentsView 覆盖显示
- 在浏览器中继续使用 iframe
- 保留所有 UI 控件（拖拽、调整大小、浮动按钮等）

## 架构优势

### 1. 解决的问题

- ✅ 消除 iframe 跨域限制
- ✅ 避免 X-Frame-Options 阻止
- ✅ 更好的 Cookie 和会话管理
- ✅ 原生窗口打开拦截
- ✅ 更好的性能和资源管理
- ✅ 进程隔离提高稳定性

### 2. 性能提升

- 每个网站在独立的渲染进程中运行
- 更好的内存管理
- 原生支持硬件加速
- 避免 iframe 层级导致的性能损失

### 3. 兼容性

- 支持更多网站（不受 iframe 限制）
- 更好的现代 Web 技术支持
- 完整的浏览器功能（不受沙箱限制）

## 测试指南

### 准备工作

1. 确保安装了 Electron v30.0.0-alpha.4 或更高版本：

```bash
npm install electron@alpha
```

2. 安装依赖：

```bash
npm install
```

### 开发环境测试

1. 启动开发服务器：

```bash
npm run dev
```

2. 在另一个终端启动 Electron：

```bash
npm run electron:dev
```

### 测试项目

#### 基本功能测试

1. **视图创建**
   - [ ] 添加新网站，检查是否正确显示
   - [ ] 添加多个网站，检查布局是否正确
   - [ ] 检查控制台是否有视图创建日志

2. **布局管理**
   - [ ] 拖拽网站卡片，检查位置是否实时更新
   - [ ] 调整网站卡片大小，检查是否正确调整
   - [ ] 窗口大小变化时，检查布局是否自适应

3. **全屏模式**
   - [ ] 点击全屏按钮，检查是否正确全屏
   - [ ] 全屏时其他视图是否隐藏
   - [ ] 退出全屏，检查所有视图是否恢复

4. **刷新功能**
   - [ ] 手动刷新，检查网站是否重新加载
   - [ ] 自动刷新，检查倒计时和自动刷新是否工作

5. **视图删除**
   - [ ] 删除网站，检查视图是否正确清理
   - [ ] 删除后添加新网站，检查是否正常

#### 兼容性测试

测试以下类型的网站：

1. **常规网站**
   - [ ] Google (https://www.google.com)
   - [ ] GitHub (https://github.com)
   - [ ] 百度 (https://www.baidu.com)

2. **带 X-Frame-Options 的网站**
   - [ ] Twitter/X (https://twitter.com)
   - [ ] Facebook (https://facebook.com)
   - [ ] 测试是否能正常加载（在 iframe 架构中会被阻止）

3. **需要 Cookie 的网站**
   - [ ] 登录网站后，检查会话是否保持
   - [ ] 跨视图访问同一网站，检查 Cookie 共享

4. **复杂交互网站**
   - [ ] YouTube (视频播放)
   - [ ] Google Maps (地图交互)
   - [ ] 在线文档编辑器

#### 性能测试

1. **多视图性能**
   - [ ] 同时打开 4-6 个网站
   - [ ] 检查 CPU 和内存使用
   - [ ] 检查操作响应速度

2. **视图切换**
   - [ ] 快速切换全屏模式
   - [ ] 快速拖拽和调整大小
   - [ ] 检查是否有延迟或卡顿

3. **长时间运行**
   - [ ] 应用运行 30 分钟以上
   - [ ] 检查内存是否泄漏
   - [ ] 检查所有功能是否正常

## 调试技巧

### 1. 查看日志

所有关键操作都有详细的控制台日志：

- `[Electron Main]`: 主进程日志
- `[ViewManager]`: 视图管理器日志
- `[IPC]`: IPC 通信日志
- `[WebContentsView]`: 前端 WebContentsView 日志

### 2. 开发者工具

- 主窗口 DevTools: 控制界面的调试
- 每个 WebContentsView 都可以单独打开 DevTools（需要手动添加）

### 3. 常见问题

**问题：视图位置不正确**
- 检查布局计算是否正确
- 查看 `getItemStyle` 返回的样式
- 检查窗口尺寸是否正确获取

**问题：视图不显示**
- 检查 URL 是否有效
- 查看控制台是否有错误
- 确认视图是否被创建（查看日志）

**问题：拖拽/调整大小后位置错误**
- 检查是否触发了布局更新
- 查看 `updateAllViewsLayout` 是否被调用
- 确认 `setTimeout` 延迟是否合适

## 生产构建

构建 Windows 应用：

```bash
npm run electron:build:win
```

构建 macOS 应用：

```bash
npm run electron:build:mac
```

构建 Linux 应用：

```bash
npm run electron:build:linux
```

## 后续优化建议

1. **视图缓存**: 实现视图的缓存机制，避免频繁创建销毁
2. **懒加载**: 只在需要时加载视图，减少初始资源消耗
3. **性能监控**: 添加性能监控，追踪视图创建和更新的耗时
4. **错误处理**: 增强错误处理，添加重试机制
5. **DevTools 集成**: 为每个 WebContentsView 添加独立的 DevTools 入口

## 兼容性说明

- **Electron 版本**: 需要 v29.0.0 或更高（建议 v30.0.0-alpha.4+）
- **浏览器环境**: 继续使用 iframe，保持向后兼容
- **操作系统**: Windows, macOS, Linux 全平台支持

## 参考资料

- [Electron WebContentsView 文档](https://github.com/electron/electron/blob/main/docs/api/web-contents-view.md)
- [Electron BaseWindow 文档](https://github.com/electron/electron/blob/main/docs/api/base-window.md)
- [从 BrowserView 迁移到 WebContentsView](https://github.com/electron/electron/pull/40759)

---

## 总结

WebContentsView 架构提供了更现代、更强大的多视图管理方案。虽然代码结构变化较大，但带来了显著的性能和兼容性提升，为项目的长期发展打下了坚实基础。

