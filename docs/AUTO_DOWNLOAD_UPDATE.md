# 自动下载更新功能

## 概述

Tab Hive 现已实现完整的自动更新下载功能，无需跳转到浏览器，直接在应用内下载并安装更新包。

## 功能特点

### 1. 智能平台识别
- 自动识别操作系统（Windows/macOS/Linux）
- 自动选择对应平台的安装包
  - **Windows**: `.exe` 文件
  - **macOS**: `.dmg` 文件
  - **Linux**: `.AppImage` 文件

### 2. 后台下载
- 在主进程中使用 Electron 的 `net` 模块进行下载
- 不阻塞 UI，用户可以继续使用应用
- 实时显示下载进度

### 3. 进度显示
- 实时更新下载进度条
- 显示已下载/总大小
- 显示百分比进度
- 流畅的动画效果

### 4. 下载管理
- **取消下载**: 随时可以取消正在进行的下载
- **重试下载**: 下载失败后可以重试
- **安装提示**: 下载完成后一键安装并重启

### 5. 用户体验
- 优雅的 UI 设计
- 清晰的状态提示
- 动画和视觉反馈
- 错误处理和提示

## 使用流程

### 场景1：正常下载安装
1. 应用启动时自动检测更新
2. 发现新版本，显示更新通知弹窗
3. 用户点击"立即下载更新"
4. 弹窗切换到下载进度界面
   - 显示进度条（带动画效果）
   - 显示已下载大小和总大小
   - 显示下载百分比
5. 下载完成后显示成功界面
   - 绿色的勾选图标
   - "下载完成！"提示
6. 用户点击"安装并重启"
7. 打开安装程序，应用自动退出
8. 用户安装新版本

### 场景2：取消下载
1. 下载过程中，用户点击"取消下载"
2. 停止下载，删除未完成的文件
3. 按钮恢复到"立即下载更新"

### 场景3：下载失败
1. 网络中断或其他原因导致下载失败
2. 显示红色的错误界面
   - 红色的 X 图标
   - "下载失败"提示
   - 显示错误信息
3. 用户可以点击"重试下载"
4. 或者点击"关闭"稍后再试

### 场景4：后台下载（未来支持）
1. 用户点击"稍后提醒"
2. 下载在后台继续进行
3. 左侧栏显示下载按钮（带进度）
4. 点击按钮可以打开下载进度窗口
5. 下载完成后按钮显示"安装更新"

## 技术实现

### 架构

```
┌─────────────────────────────────────────────────┐
│            渲染进程 (Renderer Process)              │
│                                                 │
│  ┌──────────────────────────────────────────┐  │
│  │  App.vue                                  │  │
│  │  - 更新检测初始化                           │  │
│  │  - 事件处理                                │  │
│  └──────────────────────────────────────────┘  │
│                     │                           │
│  ┌──────────────────────────────────────────┐  │
│  │  useUpdateChecker.js (Composable)        │  │
│  │  - 版本检测                                │  │
│  │  - 下载管理                                │  │
│  │  - 状态管理                                │  │
│  └──────────────────────────────────────────┘  │
│                     │                           │
│  ┌──────────────────────────────────────────┐  │
│  │  UpdateNotification.vue (Component)      │  │
│  │  - UI 显示                                 │  │
│  │  - 进度条                                  │  │
│  │  - 用户交互                                │  │
│  └──────────────────────────────────────────┘  │
└─────────────────────────────────────────────────┘
                      │ IPC
                      │
┌─────────────────────────────────────────────────┐
│            主进程 (Main Process)                  │
│                                                 │
│  ┌──────────────────────────────────────────┐  │
│  │  electron/main.js                         │  │
│  │  - IPC 处理器                              │  │
│  │  - 文件下载                                │  │
│  │  - 进度通知                                │  │
│  └──────────────────────────────────────────┘  │
│                     │                           │
│  ┌──────────────────────────────────────────┐  │
│  │  electron/preload.js                      │  │
│  │  - API 暴露                                │  │
│  │  - 安全桥接                                │  │
│  └──────────────────────────────────────────┘  │
└─────────────────────────────────────────────────┘
                      │
                      │ HTTP
                      ▼
            GitHub Releases API
```

### 核心代码

#### 1. 主进程下载逻辑 (electron/main.js)

```javascript
ipcMain.handle('download-update', async (event, downloadUrl, fileName) => {
  // 使用 Electron 的 net 模块下载
  const request = net.request(downloadUrl)
  const fileStream = fs.createWriteStream(savePath)

  request.on('response', (response) => {
    response.on('data', (chunk) => {
      currentDownload.downloadedBytes += chunk.length
      fileStream.write(chunk)

      // 实时发送进度到渲染进程
      mainWindow.webContents.send('update-download-progress', {
        downloaded: currentDownload.downloadedBytes,
        total: currentDownload.totalBytes,
        progress: progress
      })
    })

    response.on('end', () => {
      fileStream.end()
      // 通知下载完成
      mainWindow.webContents.send('update-download-complete', {
        savePath: savePath
      })
    })
  })
})
```

#### 2. 渲染进程下载管理 (useUpdateChecker.js)

```javascript
const startDownload = async () => {
  // 获取适合当前平台的资源
  const asset = getPlatformAsset()
  
  // 开始下载
  const result = await window.electron.update.download(
    asset.browser_download_url,
    asset.name
  )
  
  // 监听进度事件
  window.electron.on('update-download-progress', (data) => {
    downloadStatus.value.progress = data.progress
  })
}
```

#### 3. UI 组件 (UpdateNotification.vue)

```vue
<!-- 下载进度 -->
<div v-if="isDownloading" class="download-progress">
  <h4>正在下载更新...</h4>
  <div class="progress-bar-container">
    <div class="progress-bar" :style="{ width: downloadProgress + '%' }"></div>
  </div>
  <div class="progress-text">
    {{ formatBytes(downloadedBytes) }} / {{ formatBytes(totalBytes) }}
    ({{ downloadProgress.toFixed(1) }}%)
  </div>
</div>
```

### IPC 通信

#### 渲染进程 → 主进程

| 方法 | 参数 | 描述 |
|------|------|------|
| `download-update` | `(downloadUrl, fileName)` | 开始下载更新 |
| `get-download-status` | - | 获取当前下载状态 |
| `open-installer` | `(filePath)` | 打开安装文件 |
| `cancel-download` | - | 取消下载 |

#### 主进程 → 渲染进程

| 事件 | 数据 | 描述 |
|------|------|------|
| `update-download-progress` | `{ downloaded, total, progress }` | 下载进度更新 |
| `update-download-complete` | `{ savePath }` | 下载完成 |
| `update-download-error` | `{ error }` | 下载失败 |

### 文件存储

下载的文件保存在系统临时目录：

- **Windows**: `C:\Users\<用户>\AppData\Local\Temp\tab-hive-updates\`
- **macOS**: `/var/folders/.../tab-hive-updates/`
- **Linux**: `/tmp/tab-hive-updates/`

文件名格式：`Tab-Hive-Setup-0.5.2.exe`

## UI 设计

### 状态界面

#### 1. 初始状态
- 显示版本对比
- 显示更新内容摘要
- 橙色的"立即下载更新"按钮
- 灰色的"稍后提醒"按钮

#### 2. 下载中状态
- 隐藏更新内容
- 显示"正在下载更新..."标题
- 显示进度条（橙色渐变，带动画）
- 显示文件大小和百分比
- 灰色的"取消下载"按钮

#### 3. 下载完成状态
- 显示绿色勾选图标（带缩放动画）
- 显示"下载完成！"标题
- 显示"更新包已准备就绪，点击下方按钮安装"提示
- 绿色的"安装并重启"按钮（带脉冲动画）
- 灰色的"关闭"按钮

#### 4. 下载失败状态
- 显示红色 X 图标（带抖动动画）
- 显示"下载失败"标题
- 显示错误信息
- 橙色的"重试下载"按钮
- 灰色的"关闭"按钮

### 动画效果

1. **进度条动画**
   - 宽度平滑过渡
   - 光泽扫过效果（shimmer）

2. **完成图标动画**
   - 从小到大弹出（scale-in）
   - 略微超过目标大小后回弹

3. **失败图标动画**
   - 左右抖动（shake）

4. **安装按钮动画**
   - 绿色脉冲效果（pulse）
   - 阴影扩散动画

## 错误处理

### 可能的错误

1. **网络错误**
   - 无法连接到服务器
   - 连接超时
   - 下载中断

2. **文件系统错误**
   - 磁盘空间不足
   - 权限不足
   - 文件系统错误

3. **平台不匹配**
   - 未找到适合的安装包
   - 不支持的平台

### 错误处理策略

```javascript
try {
  const result = await window.electron.update.download(url, fileName)
  if (!result.success) {
    // 显示错误信息
    downloadStatus.value.error = result.error
  }
} catch (error) {
  // 捕获异常
  console.error('[更新检测] 下载失败:', error)
  downloadStatus.value.error = error.message
}
```

所有错误都会：
1. 在控制台输出详细日志
2. 在 UI 上显示用户友好的错误消息
3. 提供重试选项
4. 不影响应用的正常使用

## 性能优化

### 1. 下载优化
- 使用流式写入，避免内存占用过大
- 增量更新进度，避免过于频繁的 IPC 通信

### 2. UI 优化
- 使用 CSS transition 而非 JavaScript 动画
- 节流进度更新频率

### 3. 内存优化
- 及时清理已完成的下载文件
- 使用文件流而非一次性读取全部内容

## 安全考虑

### 1. 下载安全
- 仅从 GitHub Releases 官方 API 下载
- 验证下载地址的合法性
- 使用 HTTPS 加密传输

### 2. 文件安全
- 下载到系统临时目录
- 用户明确点击后才打开安装文件
- 使用系统默认方式打开（shell.openPath）

### 3. 进程隔离
- 下载在主进程进行，与渲染进程隔离
- 使用 IPC 安全通信
- preload 脚本白名单验证

## 测试建议

### 手动测试

1. **正常流程测试**
   ```
   1. 修改 currentVersion 为 '0.0.1'
   2. 重启应用
   3. 点击"立即下载更新"
   4. 观察下载进度
   5. 下载完成后点击"安装并重启"
   6. 验证安装程序打开
   ```

2. **取消下载测试**
   ```
   1. 开始下载
   2. 立即点击"取消下载"
   3. 验证下载停止
   4. 验证临时文件被删除
   ```

3. **网络错误测试**
   ```
   1. 断开网络
   2. 点击"立即下载更新"
   3. 验证显示错误信息
   4. 恢复网络
   5. 点击"重试下载"
   6. 验证下载成功
   ```

4. **多平台测试**
   ```
   - 在 Windows 上测试 .exe 下载
   - 在 macOS 上测试 .dmg 下载
   - 在 Linux 上测试 .AppImage 下载
   ```

### 自动化测试

可以编写单元测试覆盖：
- 版本比较逻辑
- 平台资源选择
- 错误处理
- 状态管理

## 未来改进

1. **增量更新**
   - 只下载变更的部分
   - 减少下载时间和流量

2. **断点续传**
   - 支持下载中断后继续
   - 避免重复下载

3. **后台下载**
   - 关闭通知后继续下载
   - 左侧栏显示下载进度

4. **静默更新**
   - 后台自动下载
   - 重启时自动安装

5. **更新回滚**
   - 备份旧版本
   - 出问题时一键回滚

6. **差分更新**
   - 使用 electron-updater
   - 更小的更新包
   - 更快的更新速度

## 相关文件

### 主要文件

- `electron/main.js` - 主进程，下载逻辑
- `electron/preload.js` - 预加载脚本，API 暴露
- `src/composables/useUpdateChecker.js` - 更新检测和下载管理
- `src/components/UpdateNotification.vue` - 更新通知 UI
- `src/App.vue` - 应用主组件，集成更新功能

### 文档

- `docs/AUTO_UPDATE_CHECK.md` - 更新检测功能文档
- `docs/AUTO_DOWNLOAD_UPDATE.md` - 本文档

## 常见问题

### Q: 下载速度慢怎么办？
A: 下载速度取决于网络连接和 GitHub 服务器速度。可以尝试：
- 切换网络环境
- 稍后再试
- 或者手动打开 GitHub Release 页面下载

### Q: 下载失败怎么办？
A: 首先检查网络连接，然后点击"重试下载"。如果仍然失败，可以：
- 检查磁盘空间
- 检查防火墙设置
- 或者手动下载安装

### Q: 支持哪些平台？
A: 支持 Windows (`.exe`)、macOS (`.dmg`) 和 Linux (`.AppImage`)。

### Q: 下载的文件保存在哪里？
A: 保存在系统临时目录中，安装后会被自动清理。

### Q: 可以取消下载吗？
A: 可以，下载过程中点击"取消下载"按钮即可。

### Q: 安装会自动进行吗？
A: 不会。下载完成后需要用户手动点击"安装并重启"按钮。

## 总结

自动下载更新功能为 Tab Hive 提供了完整的应用内更新体验，无需用户跳转到浏览器下载，大大提升了用户体验。通过优雅的 UI 设计、实时的进度反馈、完善的错误处理，为用户提供了流畅可靠的更新流程。

