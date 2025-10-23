# Cookie 同步功能说明

## 功能概述

为 Electron 版本添加了 Cookie 同步功能，解决了"在主窗口登录后，iframe 中无法保持登录状态"的问题。

## 实现原理

### 问题背景

在 Electron 应用中，当你：
1. 在主窗口（非 iframe）访问某个网站并登录
2. 然后在 iframe 中加载同一个网站

**预期：** iframe 中应该保持登录状态（因为 cookie 已经存储）
**实际：** iframe 中显示未登录状态

**原因：**
- `SameSite` cookie 策略：默认 `SameSite=Lax`，在 iframe 跨站场景下不发送 cookie
- 第三方 cookie 限制：浏览器默认阻止第三方 cookie
- 请求头丢失：某些情况下 iframe 的请求不会自动带上 cookie

### 解决方案

#### 1. 禁用限制性 Cookie 策略（命令行参数）

```javascript
// electron/main.js 第 9 行
app.commandLine.appendSwitch('disable-features', 
  'OutOfBlinkCors,SameSiteByDefaultCookies,CookiesWithoutSameSiteMustBeSecure,BlockThirdPartyCookies')
```

**作用：**
- 禁用默认的 `SameSite=Lax` 行为
- 允许没有 `Secure` 属性的 cookie
- 允许第三方 cookie

#### 2. 请求时自动注入 Cookie（请求拦截）

```javascript
// electron/main.js 第 239-270 行
mainWindow.webContents.session.webRequest.onBeforeSendHeaders(
  { urls: ['*://*/*'] },
  (details, callback) => {
    // 获取目标域名的所有 cookies
    // 添加到 Cookie 请求头
  }
)
```

**工作流程：**
```
1. 拦截所有 HTTP 请求（主窗口和 iframe）
2. 解析请求的目标域名（如 example.com）
3. 从 session 中查找该域名的所有 cookies
4. 构建 Cookie 字符串：user_id=123; session_token=abc
5. 添加到请求头：Cookie: user_id=123; session_token=abc
```

**关键：域名隔离**
- 只注入**匹配域名**的 cookies
- `example.com` 的请求 → 只带 `example.com` 的 cookies
- `google.com` 的请求 → 只带 `google.com` 的 cookies
- 不会跨域泄露 cookie ✅

#### 3. 响应时修改 Set-Cookie（响应拦截）

```javascript
// electron/main.js 第 283-322 行
mainWindow.webContents.session.webRequest.onHeadersReceived(
  { urls: ['*://*/*'] },
  (details, callback) => {
    // 修改 Set-Cookie 响应头
    // 将 SameSite=Strict/Lax 改为 SameSite=None; Secure
  }
)
```

**工作流程：**
```
服务器原始响应：
Set-Cookie: session=abc; SameSite=Strict

被修改为：
Set-Cookie: session=abc; SameSite=None; Secure
```

**效果：** 允许 cookie 在 iframe 跨站场景下设置和使用

#### 4. Cookie 缓存机制

由于 `webRequest` 回调函数必须同步返回，使用缓存避免异步操作：

```javascript
// electron/main.js 第 219-236 行
const cookieCache = new Map()

// 缓存结构
{
  'example.com': {
    cookies: [{ name: 'user_id', value: '123' }, ...],
    timestamp: 1234567890
  }
}
```

**更新策略：**
- 首次请求时异步获取并缓存
- 缓存 5 秒后过期，自动更新
- 监听 cookie 变化事件，实时更新缓存

## 使用场景

### 场景 1：多个相同网站的 iframe

```
你的应用布局：
┌─────────────────────────────────┐
│ file:///app/index.html          │
├───────────────┬─────────────────┤
│ iframe A:     │ iframe B:       │
│ taobao.com/   │ taobao.com/cart │
│ (首页)        │ (购物车)        │
└───────────────┴─────────────────┘
```

**效果：**
1. 在 iframe A 中登录淘宝
2. iframe B 自动保持登录状态 ✅
3. Cookie 共享机制：两个 iframe 访问同一域名，共享 cookies

### 场景 2：主窗口登录，iframe 同步

```
步骤：
1. 在主窗口打开 github.com 并登录
2. 在 iframe 中打开 github.com/notifications
3. iframe 中自动保持登录状态 ✅
```

**原理：**
- 主窗口登录时，cookies 存储在 session 中
- iframe 请求时，自动注入这些 cookies
- 服务器验证 cookie，返回已登录的内容

## 安全说明

### ✅ 安全特性

1. **域名隔离：** 只注入匹配域名的 cookies，不会跨域泄露
2. **本地应用：** 仅在 Electron 应用内部工作，不影响系统浏览器
3. **用户控制：** 用户自己决定访问哪些网站

### ⚠️ 潜在风险

1. **CSRF 防护减弱**
   - 原本 `SameSite=Strict` 可以防止跨站请求伪造
   - 改成 `SameSite=None` 后，恶意网站可能利用

   **建议：** 只访问可信网站

2. **第三方 Cookie 允许**
   - 允许第三方 cookie 可能增加追踪风险
   - 广告商可以跨网站追踪用户行为

   **影响：** 仅在应用内部，不影响系统浏览器

3. **安全策略降低**
   - 禁用了多项浏览器安全特性
   - 适合内部工具，不适合公开发布的应用

## 测试步骤

### 测试 1：主窗口 → iframe 登录同步

1. 启动 Electron 应用
2. 在主窗口（不是 iframe）打开 `https://github.com`
3. 登录你的 GitHub 账号
4. 添加一个新的 iframe
5. 在 iframe 中打开 `https://github.com/notifications`
6. **预期：** iframe 中显示已登录状态，可以看到通知 ✅

### 测试 2：iframe 之间登录同步

1. 创建两个 iframe
2. iframe A 打开 `https://example.com`
3. 在 iframe A 中登录
4. iframe B 打开 `https://example.com/dashboard`
5. **预期：** iframe B 自动保持登录状态 ✅

### 测试 3：Cookie 日志查看

1. 打开 DevTools (F12)
2. 在 Console 中查看日志
3. 应该看到类似：
   ```
   [Cookie] 为 github.com 注入 Cookie (3 个)
   [Cookie] Cookie 变化，更新缓存: github.com
   ```

## 对比：Chrome 扩展版

由于 Chrome 扩展的限制，**暂未实现** cookie 同步功能：

| 功能 | Electron 版 | Chrome 扩展版 |
|------|------------|--------------|
| Cookie 自动注入 | ✅ 支持 | ❌ 不支持 |
| SameSite 修改 | ✅ 支持 | ❌ 不支持 |
| 登录状态同步 | ✅ 自动 | ❌ 需手动 |

**Chrome 扩展限制：**
- Manifest V3 限制了 `webRequest` API
- 无法同步修改请求/响应头
- 需要使用 `declarativeNetRequest`，但功能有限

## 技术细节

### 为什么不能在回调中使用 async？

```javascript
// ❌ 错误写法
onBeforeSendHeaders(async (details, callback) => {
  const cookies = await getCookies()  // 异步操作
  callback({ requestHeaders })        // callback 会在 await 之前就被调用
})

// ✅ 正确写法
onBeforeSendHeaders((details, callback) => {
  const cached = cookieCache.get(hostname)  // 同步读取缓存
  callback({ requestHeaders })              // 立即返回
})
```

**原因：**
- `onBeforeSendHeaders` 需要同步返回结果
- async 函数会立即返回 Promise，导致 callback 时机错误
- 使用缓存 + 异步更新的策略解决

### Cookie 缓存的生命周期

```
┌─────────────────────────────────────────┐
│ 1. 首次请求 example.com                  │
│    → 缓存不存在                           │
│    → 触发异步更新（不阻塞）                │
│    → 本次请求不带 cookie                  │
└─────────────────────────────────────────┘
                ↓
┌─────────────────────────────────────────┐
│ 2. 异步更新完成（50ms 后）                │
│    → 缓存已建立                           │
│    → 包含 example.com 的所有 cookies      │
└─────────────────────────────────────────┘
                ↓
┌─────────────────────────────────────────┐
│ 3. 后续请求 example.com                  │
│    → 使用缓存                             │
│    → 带上所有 cookies ✅                  │
└─────────────────────────────────────────┘
                ↓
┌─────────────────────────────────────────┐
│ 4. 5秒后再次请求                         │
│    → 缓存过期                             │
│    → 触发异步更新                         │
│    → 使用旧缓存（保证不中断）              │
└─────────────────────────────────────────┘
```

## 故障排查

### 问题：iframe 中仍然显示未登录

**可能原因：**
1. Cookie 缓存未建立（首次请求）
2. 网站使用了其他认证方式（OAuth、JWT 等）
3. Cookie 的 Domain 属性不匹配

**解决方法：**
```javascript
// 在 Console 中检查
console.log(cookieCache)  // 查看缓存内容
```

### 问题：选择器功能不工作

**错误信息：**
```
Failed to read a named property 'eval' from 'Window': 
Blocked a frame with origin "file://" from accessing a cross-origin frame.
```

**原因：** 使用 async 回调导致请求处理流程被破坏

**已修复：** 使用同步回调 + cookie 缓存机制

## 版本历史

- **v1.0** (2025-01-23): 初始实现，修复 async 回调问题

