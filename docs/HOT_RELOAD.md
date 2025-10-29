# Electron 热更新配置说明

## 概述

本项目已集成 Electron 热更新功能，开发时修改代码可以自动重新加载，无需手动重启应用。

## 技术方案

采用双重热更新策略：

1. **electron-reloader**: 监控 electron 主进程和 preload 脚本的变化，自动重新加载
2. **nodemon**: 监控 electron 目录文件变化，必要时重启整个 Electron 应用
3. **Vite HMR**: 自动处理 Vue 前端代码的热更新

## 已安装的依赖

```json
{
  "devDependencies": {
    "nodemon": "^3.x.x",
    "electron-reloader": "^1.x.x"
  }
}
```

## 配置文件

### nodemon.json

监控 `electron/` 目录下的 `.js` 和 `.json` 文件变化：

```json
{
  "verbose": true,
  "watch": ["electron/**/*.js", "electron/**/*.json"],
  "ignore": ["node_modules/**", "dist/**", "release/**", "src/**"],
  "exec": "electron .",
  "env": {
    "NODE_ENV": "development"
  }
}
```

### electron/main.js

在主进程中集成 electron-reloader：

```javascript
// 开发环境热更新支持
try {
  if (process.env.NODE_ENV === 'development') {
    require('electron-reloader')(module, {
      debug: true,
      watchRenderer: true,
      ignore: ['node_modules/**', 'dist/**', 'release/**', 'src/**']
    })
    console.log('[Electron Main] 热更新已启用')
  }
} catch (err) {
  console.log('[Electron Main] 热更新加载失败（可能在生产环境）:', err.message)
}
```

## 使用方法

### 启动开发模式（完整版 - 包含后端服务器）

```bash
npm run electron:dev
```

这个命令会同时启动：
- Vite 开发服务器（前端热更新）
- Express 后端服务器
- Electron 应用（通过 nodemon 监控）

### 启动开发模式（简化版 - 不含后端服务器）

```bash
npm run electron:dev-simple
```

这个命令会同时启动：
- Vite 开发服务器（前端热更新）
- Electron 应用（通过 nodemon 监控）

### 直接启动 Electron（不使用热更新）

```bash
npm run electron:start
```

## 热更新范围

| 文件类型 | 热更新方式 | 是否重启应用 |
|---------|-----------|------------|
| `src/**/*.vue` | Vite HMR | ❌ 否 |
| `src/**/*.js` | Vite HMR | ❌ 否 |
| `src/**/*.css` | Vite HMR | ❌ 否 |
| `electron/main.js` | electron-reloader + nodemon | ✅ 是 |
| `electron/preload.js` | electron-reloader + nodemon | ✅ 是 |
| `electron/scripts/*.js` | electron-reloader + nodemon | ✅ 是 |

## 热更新行为

### 1. 修改前端代码（src/）
- **行为**: Vite HMR 即时更新
- **速度**: 极快（毫秒级）
- **窗口状态**: 保持打开
- **开发工具**: 保持打开

### 2. 修改主进程代码（electron/main.js）
- **行为**: nodemon 检测到变化 → 关闭应用 → 重启应用
- **速度**: 较快（1-3秒）
- **窗口状态**: 重新创建
- **开发工具**: 需要重新打开

### 3. 修改预加载脚本（electron/preload.js）
- **行为**: electron-reloader 重新加载 → nodemon 重启应用
- **速度**: 较快（1-3秒）
- **窗口状态**: 重新创建
- **开发工具**: 需要重新打开

## 注意事项

1. **首次启动**: 首次运行 `electron:dev` 时，需要等待 Vite 开发服务器启动完成（出现 "Local: http://localhost:3000"）

2. **端口占用**: 如果 3000 端口被占用，请修改 `vite.config.js` 中的端口配置

3. **保存触发**: 热更新需要保存文件才能触发，自动保存功能需要在编辑器中开启

4. **开发工具**: 主进程代码修改会导致应用重启，开发者工具会关闭，需要重新打开

5. **生产环境**: electron-reloader 仅在 `NODE_ENV=development` 时启用，不会影响生产构建

## 调试技巧

### 查看热更新日志

启动应用后，控制台会显示：

```
[Electron Main] ========== 启动应用 ==========
[Electron Main] 热更新已启用
```

### 禁用热更新

如果需要临时禁用热更新进行调试：

```bash
# 方法1：不设置 NODE_ENV
electron .

# 方法2：设置为生产环境
cross-env NODE_ENV=production electron .
```

### nodemon 详细日志

nodemon.json 中已配置 `"verbose": true`，会显示详细的文件监控信息。

## 常见问题

### Q: 修改代码后应用没有重启？
**A**: 检查以下几点：
1. 确认文件已保存
2. 确认文件在 `electron/` 目录下
3. 查看终端是否有 nodemon 的监控日志
4. 确认 `NODE_ENV=development` 已设置

### Q: 应用启动太慢？
**A**: 
- 首次启动需要等待 Vite 构建，这是正常的
- 后续热更新会快很多
- 可以使用 `electron:start` 跳过 nodemon 监控

### Q: 热更新时状态丢失？
**A**: 
- 前端状态：Vite HMR 会尽量保持状态
- Electron 状态：主进程重启会丢失状态，这是预期行为
- 建议：使用持久化存储（localStorage、文件等）保存重要状态

## 扩展配置

### 监控额外的文件类型

编辑 `nodemon.json`：

```json
{
  "ext": "js,json,ts",  // 添加 ts
  "watch": [
    "electron/**/*.js",
    "electron/**/*.ts"   // 添加 TypeScript 支持
  ]
}
```

### 调整 electron-reloader 配置

编辑 `electron/main.js`：

```javascript
require('electron-reloader')(module, {
  debug: true,
  watchRenderer: true,
  ignore: ['node_modules/**', 'dist/**'],
  // 添加自定义配置
  beforeReload: () => {
    console.log('准备重新加载...')
  }
})
```

## 相关资源

- [nodemon 文档](https://nodemon.io/)
- [electron-reloader GitHub](https://github.com/sindresorhus/electron-reloader)
- [Vite HMR API](https://vitejs.dev/guide/api-hmr.html)

