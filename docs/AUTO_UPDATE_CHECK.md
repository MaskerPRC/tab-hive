# 自动更新检测功能

## 功能概述

Tab Hive 现已支持自动更新检测功能，可以帮助用户及时了解新版本的发布并进行升级。

## 主要特性

### 1. 自动检测时机
- **启动时检测**：应用启动时自动检查是否有新版本
- **定时检测**：每24小时自动检测一次新版本
- **智能间隔**：根据上次检测时间智能决定是否需要立即检测

### 2. 版本信息来源
- 通过 GitHub API 获取最新的 release 信息
- 检测地址：`https://api.github.com/repos/MaskerPRC/tab-hive/releases/latest`
- 支持显示版本号、发布说明、发布时间等详细信息

### 3. 用户交互

#### 更新通知弹窗
当检测到新版本时，会显示一个优雅的更新通知弹窗，包含：
- 当前版本和最新版本的对比
- 更新内容摘要（Release Notes）
- 三个操作选项：
  - **立即更新**：跳转到 GitHub Release 页面下载
  - **稍后提醒**：暂时忽略此版本，在左侧栏显示更新按钮
  - **关闭**：关闭通知（下次检测仍会提示）

#### 更新按钮
如果用户选择"稍后提醒"，会在左侧配置面板底部显示一个醒目的更新按钮：
- 渐变色背景，易于识别
- 带有动画效果的图标
- 带有跳动的绿色小圆点提示
- 点击可重新显示更新通知

## 技术实现

### 核心文件

1. **`src/composables/useUpdateChecker.js`**
   - 更新检测的核心逻辑
   - 版本比较算法
   - GitHub API 调用
   - 本地存储管理

2. **`src/components/UpdateNotification.vue`**
   - 更新通知弹窗组件
   - 优雅的 UI 设计
   - Markdown 格式的 Release Notes 显示

3. **`src/components/UpdateButton.vue`**
   - 左侧栏更新按钮组件
   - 动画效果和视觉提示

### 版本比较算法

```javascript
// 比较版本号（例如：0.5.2 vs 0.0.1）
const compareVersions = (v1, v2) => {
  const parts1 = v1.replace(/^v/, '').split('.').map(Number)
  const parts2 = v2.replace(/^v/, '').split('.').map(Number)
  
  for (let i = 0; i < Math.max(parts1.length, parts2.length); i++) {
    const part1 = parts1[i] || 0
    const part2 = parts2[i] || 0
    
    if (part1 > part2) return 1
    if (part1 < part2) return -1
  }
  
  return 0
}
```

### 本地存储

使用 `localStorage` 存储以下信息：
- `tab-hive-ignored-update-version`：用户忽略的版本号
- `tab-hive-last-update-check`：上次检测的时间戳

### 状态管理

更新检测器维护以下状态：
- `currentVersion`：当前应用版本
- `latestVersion`：最新可用版本
- `updateAvailable`：是否有新版本可用
- `updateInfo`：最新版本的详细信息
- `showUpdateNotification`：是否显示更新通知弹窗
- `showUpdateButton`：是否在左侧栏显示更新按钮
- `isChecking`：是否正在检测中
- `lastCheckTime`：上次检测时间

## 用户流程

### 场景1：首次启动检测到更新
1. 用户启动应用
2. 系统自动检测更新
3. 发现新版本 v0.5.2
4. 显示更新通知弹窗
5. 用户选择"立即更新"
6. 跳转到 GitHub Release 页面

### 场景2：用户选择稍后更新
1. 用户启动应用
2. 系统自动检测更新
3. 发现新版本 v0.5.2
4. 显示更新通知弹窗
5. 用户选择"稍后提醒"
6. 弹窗关闭，左侧栏显示更新按钮
7. 该版本被标记为已忽略（本次启动不再弹窗）
8. 用户可以随时点击左侧栏的更新按钮查看更新信息

### 场景3：定时检测
1. 应用已运行超过24小时
2. 系统自动检测更新
3. 如果有新版本，显示更新通知
4. 用户按需处理

## 配置和自定义

### 修改检测间隔

在 `useUpdateChecker.js` 中修改：

```javascript
const CHECK_INTERVAL = 24 * 60 * 60 * 1000 // 24小时（毫秒）
```

### 修改当前版本号

当前版本号硬编码在 `useUpdateChecker.js` 中，应与 `package.json` 保持一致：

```javascript
const currentVersion = ref('0.0.1')
```

**注意**：未来可以改进为自动从 `package.json` 读取版本号。

### 修改 GitHub 仓库

如果需要更改检测的仓库：

```javascript
const GITHUB_REPO = 'MaskerPRC/tab-hive'
```

## UI 设计

### 更新通知弹窗
- 居中显示，带有半透明黑色背景遮罩
- 白色卡片，圆角边框，优雅的阴影效果
- 表情符号 🎉 作为图标
- 版本号对比清晰明了
- Release Notes 带有滚动条，最多显示500字符
- 两个按钮：主操作（橙色）和次要操作（灰色）
- 平滑的进入/退出动画

### 更新按钮
- 橙色渐变背景
- 下载图标 + "发现新版本" 文字
- 绿色小圆点作为提示
- 悬停时有放大效果和阴影
- 光泽扫过动画

## 错误处理

- 网络请求失败时静默处理，不影响应用正常使用
- API 限流时自动跳过本次检测
- 版本比较异常时默认不提示更新

## 隐私和性能

- 仅在必要时发起网络请求
- 使用 GitHub 公开 API，无需认证
- 不收集任何用户数据
- 本地存储仅用于改善用户体验

## 未来改进

1. **自动更新**：集成 Electron 的自动更新功能（electron-updater）
2. **版本号自动读取**：从 package.json 自动读取当前版本
3. **更新日志增强**：更好的 Markdown 渲染
4. **增量更新**：支持增量更新包下载
5. **更新进度**：显示下载进度条
6. **静默更新**：后台自动下载，重启时安装

## 测试建议

### 手动测试

1. **测试启动检测**：
   - 清除 localStorage
   - 重启应用
   - 观察是否弹出更新通知

2. **测试版本比较**：
   - 修改 `currentVersion` 为更低版本（如 `0.0.1`）
   - 重启应用
   - 应该检测到有更新

3. **测试忽略功能**：
   - 点击"稍后提醒"
   - 观察左侧栏是否显示更新按钮
   - 点击更新按钮，应重新显示通知

4. **测试定时检测**：
   - 修改 `CHECK_INTERVAL` 为较短时间（如 30 秒）
   - 等待30秒
   - 观察是否触发检测

### 自动化测试

可以编写单元测试覆盖：
- 版本比较函数
- localStorage 读写
- GitHub API 响应解析

## 常见问题

### Q: 如何禁用自动更新检测？
A: 目前需要在代码中注释掉 `useUpdateChecker()` 的调用。未来可以添加设置选项。

### Q: 更新检测失败会影响应用使用吗？
A: 不会。所有网络错误都会被捕获并静默处理，不影响应用正常功能。

### Q: 可以检测 Beta 版本吗？
A: 目前只检测最新的稳定版 release。如需检测 pre-release，需要修改 API 调用参数。

### Q: 为什么不使用 electron-updater？
A: 当前实现更轻量，适合快速集成。electron-updater 是更完善的解决方案，可以作为未来改进方向。

## 相关资源

- [GitHub Releases API 文档](https://docs.github.com/en/rest/releases/releases)
- [Electron 自动更新文档](https://www.electronjs.org/docs/latest/api/auto-updater)
- [Semantic Versioning 规范](https://semver.org/)

