# Webview 架构迁移检查清单

## 迁移前准备 ✓

- [x] 备份当前数据库文件 `server/layouts.db`
- [x] 记录当前应用配置
- [x] 确认 Electron 版本支持 webview
- [x] 阅读 WEBVIEW_ARCHITECTURE.md 文档

## 代码迁移 ✓

### 主进程 (Electron Main)

- [x] 启用 `webviewTag: true` 配置
- [x] 移除 iframe 注入脚本加载代码
- [x] 移除 `did-frame-navigate` 事件监听
- [x] 移除 `setWindowOpenHandler` 代码
- [x] 添加 webview 注册管理 (registeredWebviews Map)
- [x] 添加 IPC 处理器:
  - [x] webview-register
  - [x] execute-in-webview
  - [x] refresh-webview
  - [x] get-registered-webviews
  - [x] webview-unregister
- [x] 保留 CORS 和 Cookie 处理逻辑

### Preload 脚本

- [x] 创建 electron/webview-preload.js
- [x] 实现 webview 注册逻辑
- [x] 实现主进程消息监听
- [x] 实现 sendToHost 通信
- [x] 拦截 window.open
- [x] 暴露 __webviewAPI__
- [x] 更新 electron/preload.js
- [x] 移除 iframe 相关 API
- [x] 添加 webview 管理 API

### 组件层

- [x] 更新 WebsiteCard.vue
  - [x] 将 `<iframe>` 替换为 `<webview>`
  - [x] 添加 webview 事件监听
  - [x] 实现双缓冲刷新
  - [x] 保留 iframe 降级支持
- [x] 创建 useWebviewSelector.js
  - [x] 迁移选择器功能
  - [x] 使用 webview.executeJavaScript
  - [x] 实现全屏切换逻辑

### 清理工作

- [x] 删除 electron/scripts/check-iframe-id.js
- [x] 删除 electron/scripts/execute-in-iframe.js
- [x] 删除 electron/scripts/iframe-inject.js
- [x] 删除 electron/scripts/window-open-handler.js
- [x] (可选) 保留 useIframeSelector.js 用于浏览器降级

## 功能测试 ⏳

### 基础功能

- [ ] 应用正常启动
- [ ] 主窗口正确显示
- [ ] DevTools 可以打开
- [ ] 没有致命错误

### Webview 加载

- [ ] 添加新网站
- [ ] Webview 正确创建
- [ ] 页面内容正常显示
- [ ] 控制台显示注册成功日志
- [ ] 多个 webview 可以同时显示

### 选择器功能

- [ ] 设置网站选择器
- [ ] Grid 模式只显示选中元素
- [ ] 元素正确居中和缩放
- [ ] 其他元素被隐藏
- [ ] 进入全屏显示完整页面
- [ ] 退出全屏恢复选择器
- [ ] 全屏切换平滑无闪烁

### 刷新功能

- [ ] 手动刷新按钮工作
- [ ] 双缓冲刷新无闪烁
- [ ] 刷新后选择器重新应用
- [ ] 配置自动刷新间隔
- [ ] 自动刷新定时触发
- [ ] 倒计时显示正确
- [ ] 全屏时自动刷新暂停
- [ ] 退出全屏自动刷新恢复

### 布局管理

- [ ] 创建新布局
- [ ] 切换布局
- [ ] 删除布局
- [ ] 重命名布局
- [ ] 布局数据正确保存
- [ ] 应用重启后布局恢复

### 拖放功能

- [ ] 拖动网站卡片
- [ ] 调整卡片大小
- [ ] 拖放 URL 添加网站
- [ ] 碰撞检测工作
- [ ] 拖动时 webview 不响应鼠标

### 网站操作

- [ ] 复制网站
- [ ] 删除网站
- [ ] 编辑网站信息
- [ ] 全屏切换
- [ ] 设备类型切换 (PC/Mobile)

### 跨域和安全

- [ ] 加载 HTTPS 网站
- [ ] 加载 HTTP 网站 (混合内容)
- [ ] 加载跨域网站
- [ ] Cookie 正确传递
- [ ] 登录状态保持
- [ ] POST 表单提交
- [ ] 文件下载

### 通信机制

- [ ] Webview 成功注册
- [ ] 主进程可以向 webview 发送消息
- [ ] Webview 可以向宿主发送消息
- [ ] 通信日志清晰完整
- [ ] 错误处理正确

### 性能测试

- [ ] 同时加载 4 个 webview
- [ ] 内存使用合理 (< 500MB)
- [ ] CPU 使用正常
- [ ] 页面滚动流畅
- [ ] 切换布局响应快速
- [ ] 长时间运行稳定

## 边界情况测试

- [ ] 无效 URL 处理
- [ ] 网络断开情况
- [ ] 页面加载失败
- [ ] 超大页面加载
- [ ] 特殊字符 URL
- [ ] 重定向页面
- [ ] 弹窗页面
- [ ] 视频/音频内容
- [ ] Canvas/WebGL 内容
- [ ] WebSocket 连接

## 兼容性测试

### Electron 环境

- [ ] Windows 10/11
- [ ] macOS (Intel)
- [ ] macOS (Apple Silicon)
- [ ] Linux (Ubuntu/Debian)

### 浏览器降级 (非 Electron)

- [ ] Chrome 浏览器
- [ ] Edge 浏览器
- [ ] Firefox 浏览器
- [ ] Safari 浏览器

## 文档更新

- [x] 创建 WEBVIEW_ARCHITECTURE.md
- [x] 创建 WEBVIEW_MIGRATION_CHECKLIST.md
- [ ] 更新 README.md
- [ ] 更新 DEPLOYMENT.md
- [ ] 添加迁移说明
- [ ] 更新 CHANGELOG

## 发布准备

- [ ] 版本号更新
- [ ] 构建测试
- [ ] 打包测试
- [ ] 安装包测试
- [ ] 更新日志编写
- [ ] 发布说明准备

## 回滚准备

如果迁移出现严重问题,准备回滚:

- [ ] 保留旧版本代码分支
- [ ] 备份数据库
- [ ] 记录回滚步骤
- [ ] 准备降级脚本

## 已知问题

记录测试中发现的问题:

1. 

## 问题修复记录

记录修复的问题:

1. 

## 最终确认

- [ ] 所有核心功能正常
- [ ] 没有严重性能问题
- [ ] 文档完整准确
- [ ] 测试覆盖充分
- [ ] 准备好发布

---

## 注意事项

1. **不要跳过测试步骤**: 每个测试都很重要
2. **记录问题**: 发现问题立即记录,不要遗漏
3. **性能监控**: 特别关注内存和 CPU 使用
4. **用户体验**: 确保迁移后体验不下降
5. **备份数据**: 始终保留数据备份

## 需要帮助?

如果遇到问题:

1. 查看 WEBVIEW_ARCHITECTURE.md 文档
2. 检查控制台日志
3. 查看已知问题列表
4. 提交 Issue 寻求帮助

