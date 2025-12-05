# iframe 反检测功能说明

## 📋 问题背景

某些网站会检测到它们在 iframe 中运行，然后采取以下措施：
- 🚫 完全阻止显示（显示空白或错误页面）
- 🔄 切换到简化的显示模式
- ⚠️ 显示警告信息
- 🔀 强制跳转到其他页面

这会导致 全视界 无法正常展示这些网站的内容。

## 🔍 检测原理

网站通常通过以下方式检测 iframe：

### 1. JavaScript 检测
```javascript
// 检测是否在 iframe 中
if (window.top !== window.self) {
  // 这是在 iframe 中！
}

if (window.parent !== window.self) {
  // 这是在 iframe 中！
}

if (window.frameElement) {
  // 这是在 iframe 中！
}
```

### 2. HTTP 响应头
```
X-Frame-Options: DENY
X-Frame-Options: SAMEORIGIN
Content-Security-Policy: frame-ancestors 'none'
```

### 3. Cookie 策略
```
Set-Cookie: session=xxx; SameSite=Strict
```

## ✅ 解决方案

全视界 提供了两种反检测方案：

### 方案1: Chrome 扩展版本 🔌

#### 特性
- ✅ 拦截并移除 `X-Frame-Options` 响应头
- ✅ 移除 `Content-Security-Policy` 响应头
- ✅ 注入 JavaScript 覆盖检测代码
- ⚠️ 需要手动安装扩展
- ⚠️ 某些强安全策略网站可能仍然无法访问

#### 安装方法
1. 打开 Chrome 浏览器
2. 访问 `chrome://extensions/`
3. 启用右上角的"开发者模式"
4. 点击"加载已解压的扩展程序"
5. 选择项目中的 `chrome-extension` 文件夹
6. 刷新 全视界 页面即可生效

#### 技术实现

**响应头拦截**（background.js）：
```javascript
chrome.declarativeNetRequest.updateDynamicRules({
  addRules: [{
    action: {
      type: 'modifyHeaders',
      responseHeaders: [
        { header: 'X-Frame-Options', operation: 'remove' },
        { header: 'Content-Security-Policy', operation: 'remove' }
      ]
    }
  }]
});
```

**JavaScript 覆盖**（content.js）：
```javascript
// 覆盖 window.top，使其指向 window.self
Object.defineProperty(window, 'top', {
  get: function() {
    return window.self;
  }
});

// 覆盖 window.parent
Object.defineProperty(window, 'parent', {
  get: function() {
    return window.self;
  }
});

// 覆盖 window.frameElement
Object.defineProperty(window, 'frameElement', {
  get: function() {
    return null;
  }
});
```

### 方案2: Electron 桌面客户端 💻（推荐）

#### 特性
- ✅ 完全禁用 Web 安全策略
- ✅ 自动拦截所有响应头
- ✅ 自动注入反检测代码到所有 iframe
- ✅ 处理 Cookie SameSite 策略
- ✅ 无需额外配置
- ✅ 兼容性最佳

#### 使用方法
1. 下载并安装 全视界 桌面客户端
2. 直接使用，无需任何额外配置
3. 所有反检测功能自动启用

#### 技术实现

**禁用安全策略**（main.js）：
```javascript
// 完全禁用 CORS 和安全策略
app.commandLine.appendSwitch('disable-web-security')
app.commandLine.appendSwitch('disable-features', 'OutOfBlinkCors')

// 窗口配置
webPreferences: {
  webSecurity: false,
  sandbox: false
}
```

**响应头拦截**：
```javascript
session.webRequest.onHeadersReceived((details, callback) => {
  const responseHeaders = { ...details.responseHeaders }
  
  // 移除阻止 iframe 的响应头
  delete responseHeaders['x-frame-options']
  delete responseHeaders['X-Frame-Options']
  delete responseHeaders['content-security-policy']
  delete responseHeaders['Content-Security-Policy']
  
  // 添加 CORS 头
  responseHeaders['Access-Control-Allow-Origin'] = ['*']
  
  callback({ responseHeaders })
})
```

**iframe 代码注入**：
```javascript
mainWindow.webContents.on('did-frame-navigate', (event, url, ..., isMainFrame) => {
  if (!isMainFrame) {
    // 在 iframe 中注入反检测代码
    frame.executeJavaScript(`
      // 覆盖 window.top
      Object.defineProperty(window, 'top', {
        get: function() { return window.self; }
      });
      
      // 覆盖 window.parent
      Object.defineProperty(window, 'parent', {
        get: function() { return window.self; }
      });
      
      // 覆盖 window.frameElement
      Object.defineProperty(window, 'frameElement', {
        get: function() { return null; }
      });
      
      // 伪造 ancestorOrigins
      Object.defineProperty(window.location, 'ancestorOrigins', {
        get: function() {
          return { length: 0 };
        }
      });
    `);
  }
})
```

## 🎯 效果对比

| 网站类型 | 无反检测 | Chrome扩展 | Electron |
|---------|---------|------------|----------|
| 普通网站 | ✅ | ✅ | ✅ |
| 带X-Frame-Options | ❌ | ✅ | ✅ |
| 带CSP策略 | ❌ | ⚠️ | ✅ |
| JS检测 | ❌ | ✅ | ✅ |
| 强安全策略 | ❌ | ⚠️ | ✅ |
| 银行网站 | ❌ | ⚠️ | ✅ |

## 🔧 调试方法

### Chrome 扩展调试
1. 打开浏览器控制台（F12）
2. 查找以下日志：
   - `[全视界 Extension]` - 扩展主要日志
   - `[全视界 Anti-Detection]` - 反检测措施日志
3. 检查网络面板，确认响应头已被移除

### Electron 客户端调试
1. Electron 会自动打开开发者工具（开发模式）
2. 查找以下日志：
   - `[Electron Main]` - 主进程日志
   - `[全视界 iframe]` - iframe 注入日志
   - `[全视界 Anti-Detection]` - 反检测日志
3. 检查每个反检测措施的状态（✓ 或 ✗）

## ⚠️ 局限性

### 仍然无法访问的情况
1. **强制HTTPS且有证书锁定的网站**
   - 某些银行和金融网站
   - 解决方案：使用官方客户端或浏览器访问

2. **使用高级检测技术的网站**
   - 检测浏览器指纹
   - 检测渲染环境
   - 解决方案：通常 Electron 版本可以解决

3. **需要特殊插件的网站**
   - Flash、Silverlight等
   - 解决方案：使用支持这些插件的浏览器

### 安全提示
- 反检测功能会降低浏览器的安全性
- 建议只在 全视界 中使用
- 不要在 iframe 中访问敏感信息网站
- Electron 版本的安全性相对更高（隔离环境）

## 📊 常见问题

### Q: 为什么有些网站还是显示空白？
A: 可能是以下原因：
1. 网站使用了更高级的检测技术
2. Chrome 扩展未正确安装或启用
3. 网站本身的加载问题
4. 建议尝试使用 Electron 桌面客户端

### Q: 扩展会影响其他网站吗？
A: 不会。扩展只在包含 全视界 的页面中生效，通过检测特定的消息来识别。

### Q: Electron 版本为什么更强大？
A: 因为 Electron 拥有：
- 完整的 Node.js 权限
- 可以完全禁用 Web 安全策略
- 可以拦截所有网络请求
- 可以注入代码到所有 frame

### Q: 反检测是否合法？
A: 在个人使用范围内是合法的。但请：
- 遵守网站的服务条款
- 不要用于商业爬虫
- 不要绕过付费内容限制
- 尊重网站的隐私政策

## 🚀 最佳实践

1. **优先使用 Electron 桌面客户端**
   - 功能最完整
   - 兼容性最好
   - 无需额外配置

2. **Chrome 扩展作为备选**
   - 适合无法安装桌面程序的场景
   - 浏览器环境更熟悉

3. **遇到问题时**
   - 查看控制台日志
   - 确认反检测措施是否成功应用
   - 尝试刷新页面
   - 考虑切换到 Electron 版本

## 📚 相关文档

- [Chrome 扩展安装指南](../chrome-extension/INSTALL.md)
- [Electron 桌面客户端说明](ELECTRON.md)
- [CSS 选择器全屏功能](SELECTOR_FEATURE.md)
- [项目主 README](README.md)

## 🤝 贡献

如果你发现某个网站仍然无法正常显示，欢迎：
1. 提交 Issue 报告问题
2. 提供网站 URL 和问题描述
3. 附上控制台日志截图

我们会持续改进反检测功能！

