# Webview 架构重写文档

## 概述

项目已从 iframe 架构重写为基于 Electron `<webview>` 标签的架构。这次重构带来了以下优势:

### 架构优势

1. **独立的 WebContents**: 每个 webview 拥有独立的渲染进程,更好的隔离性和稳定性
2. **嵌入文档流**: 与 iframe 一样可以嵌入宿主页面的文档流
3. **私有 Preload 脚本**: 每个 webview 支持独立的 preload 脚本,便于通信和功能扩展
4. **更优雅的通信机制**: 支持 webview ↔ 宿主页面、webview ↔ 主进程的直接通信
5. **进程解耦**: webview 的注册和通信不依赖具体窗口,更易于维护

## 架构图

```
┌─────────────────────────────────────────────────────┐
│                   主进程 (Main Process)                │
│                  electron/main.js                     │
│                                                       │
│  - 管理已注册的 webview (registeredWebviews Map)      │
│  - 处理 webview 注册/注销                             │
│  - 处理 webview 通信                                  │
│  - CORS/Cookie 处理                                   │
└─────────────────┬───────────────────────────────────┘
                  │
                  │ IPC 通信
                  │
┌─────────────────┴───────────────────────────────────┐
│              渲染进程 (Renderer Process)               │
│                                                       │
│  ┌─────────────────────────────────────────────┐   │
│  │         宿主页面 (App.vue)                    │   │
│  │       electron/preload.js                    │   │
│  │                                               │   │
│  │  - 暴露 webview API 到渲染上下文               │   │
│  │  - 监听主进程事件                             │   │
│  └─────────────────────────────────────────────┘   │
│                                                       │
│  ┌──────────────────────────────────────────────┐  │
│  │      WebsiteCard.vue                          │  │
│  │                                               │  │
│  │   ┌────────────────────────────────────┐    │  │
│  │   │  <webview>                          │    │  │
│  │   │  - 独立 WebContents                 │    │  │
│  │   │  - 私有 preload 脚本                │    │  │
│  │   │  - 事件监听                         │    │  │
│  │   │    * did-finish-load               │    │  │
│  │   │    * ipc-message                   │    │  │
│  │   │    * did-fail-load                 │    │  │
│  │   └────────────────────────────────────┘    │  │
│  └──────────────────────────────────────────────┘  │
└───────────────────────────────────────────────────┘
                  │
                  │ Preload 注入
                  │
┌─────────────────┴───────────────────────────────────┐
│        Webview 进程 (Webview Process)                 │
│     electron/webview-preload.js                      │
│                                                       │
│  - 向主进程注册                                        │
│  - 监听主进程消息 (main-to-webview)                    │
│  - 发送消息到宿主 (sendToHost)                        │
│  - 拦截 window.open                                   │
│  - 暴露受限 API (__webviewAPI__)                      │
└───────────────────────────────────────────────────────┘
```

## 通信机制

### 1. Webview → 主进程

```javascript
// 在 webview-preload.js 中
ipcRenderer.invoke('webview-register', webviewId)

// 主进程处理
ipcMain.handle('webview-register', (event, webviewId) => {
  // 保存 webview 信息
  registeredWebviews.set(webviewId, {
    processId: event.processId,
    frameId: event.frameId,
    webContents: event.sender
  })
})
```

### 2. 主进程 → Webview

```javascript
// 主进程发送消息
event.sender.sendToFrame(
  [processId, frameId],
  'main-to-webview',
  'command',
  data
)

// Webview preload 接收
ipcRenderer.on('main-to-webview', (event, command, data) => {
  // 处理命令
})
```

### 3. Webview → 宿主页面

```javascript
// Webview preload 发送
ipcRenderer.sendToHost('channel-name', data)

// 宿主页面接收
webview.addEventListener('ipc-message', (event) => {
  if (event.channel === 'channel-name') {
    // 处理消息
  }
})
```

### 4. 宿主页面 → Webview

```javascript
// 宿主页面发送 (通过 webview 的 send 方法)
webview.send('channel-name', data)

// Webview preload 接收
ipcRenderer.on('channel-name', (event, data) => {
  // 处理消息
})
```

## 文件结构

### 新增文件

1. **electron/webview-preload.js**
   - Webview 专用的 preload 脚本
   - 负责 webview 注册和通信
   - 拦截 window.open 防止打开新窗口
   - 暴露受限 API 到 webview 渲染上下文

2. **src/composables/useWebviewSelector.js**
   - 管理 webview 选择器功能
   - 处理元素选择和样式应用
   - 支持全屏模式切换

### 修改文件

1. **electron/main.js**
   - 移除所有 iframe 相关代码
   - 添加 webview 注册管理
   - 添加 webview 相关的 IPC 处理器
   - 启用 `webviewTag: true`

2. **electron/preload.js**
   - 移除 iframe 相关 API
   - 添加 webview 管理 API
   - 简化通信接口

3. **src/components/WebsiteCard.vue**
   - 将 `<iframe>` 替换为 `<webview>`
   - 使用 webview 事件监听
   - 支持双缓冲刷新机制
   - 保留非 Electron 环境的 iframe 降级支持

### 删除文件

- electron/scripts/check-iframe-id.js
- electron/scripts/execute-in-iframe.js
- electron/scripts/iframe-inject.js
- electron/scripts/window-open-handler.js

## 主要特性

### 1. Webview 注册机制

每个 webview 在加载时自动向主进程注册:

```javascript
// webview URL 包含 ID 参数
const url = `${originalUrl}?__webview_id__=${item.id}`

// Preload 脚本从 URL 获取 ID 并注册
const urlParams = new URLSearchParams(window.location.search)
const webviewId = urlParams.get('__webview_id__')
ipcRenderer.invoke('webview-register', webviewId)
```

### 2. 选择器功能

支持在 Grid 模式下只显示页面中的指定元素:

```javascript
// 应用选择器
await applySelector(webview, item)

// 恢复完整页面
await restoreOriginalStyles()
```

### 3. 双缓冲刷新

使用两个 webview 实现无缝刷新:

1. 后台加载新的 webview (buffer)
2. 等待 buffer 完全加载并应用选择器
3. 显示 buffer webview
4. 后台刷新主 webview
5. 主 webview 准备完成后,移除 buffer

### 4. 自动刷新

支持按间隔自动刷新 webview:

- 全屏时自动暂停
- 退出全屏时恢复
- 显示倒计时提示

### 5. Window.open 拦截

在 webview preload 中拦截 window.open,防止打开新窗口:

```javascript
window.open = function(url, target, features) {
  // 通知宿主页面
  ipcRenderer.sendToHost('webview-open-url', { url })
  return null
}
```

## 配置要求

### Electron BrowserWindow 配置

```javascript
webPreferences: {
  nodeIntegration: false,
  contextIsolation: true,
  sandbox: false,
  webSecurity: false,
  allowRunningInsecureContent: true,
  webviewTag: true,  // 必须启用
  preload: path.join(__dirname, 'preload.js')
}
```

### Webview 标签配置

```html
<webview
  :id="`webview-${item.id}`"
  :src="websiteUrl"
  :preload="webviewPreloadPath"
  allowpopups
  webpreferences="allowRunningInsecureContent"
></webview>
```

## 测试指南

### 1. 基本功能测试

- [ ] 启动应用,检查 webview 是否正常加载
- [ ] 检查控制台是否有 webview 注册成功的日志
- [ ] 添加新网站,验证 webview 创建和加载
- [ ] 删除网站,验证 webview 正确销毁

### 2. 选择器功能测试

- [ ] 配置一个网站的选择器
- [ ] 验证 Grid 模式下只显示选中元素
- [ ] 切换到全屏,验证显示完整页面
- [ ] 退出全屏,验证重新应用选择器

### 3. 刷新功能测试

- [ ] 手动刷新 webview
- [ ] 验证双缓冲刷新无闪烁
- [ ] 配置自动刷新,验证定时刷新
- [ ] 全屏时验证自动刷新暂停

### 4. 通信测试

- [ ] 打开 DevTools,检查通信日志
- [ ] 验证 webview 注册成功
- [ ] 验证主进程可以向 webview 发送消息
- [ ] 验证 webview 可以向宿主发送消息

### 5. 跨域和 Cookie 测试

- [ ] 加载跨域网站
- [ ] 验证 CORS 策略正确处理
- [ ] 测试需要登录的网站
- [ ] 验证 Cookie 正确传递

## 已知限制

### 1. Chrome 废弃计划

Electron 的 `<webview>` 基于 Chrome App 标准开发,Chrome 已宣布废弃该标准。但由于 Electron 项目的特殊性,目前仍然可用。如果未来版本废弃,可以降级回 iframe 实现。

### 2. 性能考虑

每个 webview 都有独立的渲染进程,内存占用相对较高。建议:

- 限制同时显示的 webview 数量
- 及时销毁不使用的 webview
- 监控内存使用情况

### 3. 浏览器环境降级

非 Electron 环境(浏览器)会自动降级为 iframe 实现,部分功能可能受限。

## 迁移注意事项

从旧版本迁移时:

1. **备份数据**: 迁移前备份布局数据库
2. **清理缓存**: 清除旧的应用缓存
3. **重新配置**: 某些配置可能需要重新设置
4. **测试验证**: 全面测试所有功能

## 调试技巧

### 1. 启用详细日志

所有关键操作都有详细的控制台日志:

- `[Electron Main]`: 主进程日志
- `[IPC]`: IPC 通信日志
- `[Webview Preload]`: Webview preload 日志
- `[Webview Selector]`: 选择器功能日志
- `[WebsiteCard]`: 组件日志

### 2. DevTools

- **主窗口 DevTools**: 调试宿主页面
- **Webview DevTools**: 右键 webview → 检查元素

### 3. 常见问题

**Q: Webview 显示空白?**
- 检查 URL 是否正确
- 检查是否有 CORS 错误
- 检查 webview preload 路径是否正确

**Q: 选择器不生效?**
- 检查选择器语法是否正确
- 查看控制台是否有错误日志
- 确认目标元素是否存在

**Q: 通信不工作?**
- 检查 webview 是否成功注册
- 查看 IPC 日志
- 确认 channel 名称匹配

## 性能优化建议

1. **懒加载**: 只在需要时创建 webview
2. **资源回收**: 及时销毁不用的 webview
3. **限流**: 限制同时创建 webview 的数量
4. **缓存**: 合理使用双缓冲机制避免频繁重载

## 未来改进方向

1. **连接池**: 实现 webview 连接池复用机制
2. **进程管理**: 更精细的进程生命周期管理
3. **性能监控**: 添加性能指标收集和监控
4. **错误恢复**: 实现 webview 崩溃自动恢复
5. **安全增强**: 加强 webview 沙箱和权限控制

## 参考资源

- [Electron Webview 文档](https://www.electronjs.org/docs/latest/api/webview-tag)
- [Chrome App Webview](https://developer.chrome.com/docs/extensions/reference/webviewTag/)
- [Electron IPC 通信](https://www.electronjs.org/docs/latest/tutorial/ipc)

