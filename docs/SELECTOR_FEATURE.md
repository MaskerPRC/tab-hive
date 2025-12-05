# CSS选择器全屏功能

全视界现在支持在全屏时只显示iframe中指定CSS选择器的元素！

## 功能概述

在配置网站时，可以指定一个CSS选择器。在**Grid视图（非全屏）模式**下，只有匹配该选择器的元素会被显示，页面其他内容会被隐藏。点击全屏后，会显示完整的网页。

### 应用场景

1. **视频播放器预览** - Grid中只显示播放器，全屏查看完整控制界面
2. **图表卡片** - Grid中只显示图表，全屏查看完整仪表板
3. **图标/Logo展示** - Grid中只显示图标，全屏查看完整网站
4. **内容摘要** - Grid中只显示关键内容，全屏浏览完整页面

### 工作原理

- **Grid模式（多窗口）**：应用选择器 → 只显示指定元素 → 节省空间，聚焦内容
- **全屏模式**：移除选择器 → 显示完整网页 → 完整交互体验

## 两种实现方式

### 1. Electron版本（内置支持）

Electron版本通过IPC通信直接操作iframe内容，**无需安装任何扩展**。

**使用步骤：**
1. 打开全视界 Electron应用
2. 添加/编辑网站时，填写"目标选择器"
3. 全屏即可看到效果

### 2. 网页版本（需要Chrome扩展）

网页版由于浏览器安全限制，需要安装Chrome扩展来实现此功能。

**使用步骤：**
1. 安装全视界 Chrome扩展（见下方）
2. 在全视界网页版中配置选择器
3. 全屏时扩展会自动应用选择器

## Chrome扩展安装

### 开发者模式安装

```bash
1. 打开 chrome://extensions/
2. 启用"开发者模式"
3. 点击"加载已解压的扩展程序"
4. 选择项目中的 chrome-extension 文件夹
```

详细说明请查看：[chrome-extension/INSTALL.md](../chrome-extension/INSTALL.md)

## 使用示例

### 示例1：YouTube视频播放器

```
网站名称：YouTube
网站地址：https://www.youtube.com/watch?v=xxxxx
目标选择器：#movie_player
```

全屏时只显示视频播放器，隐藏标题、评论、推荐视频等。

### 示例2：Bilibili视频

```
网站名称：Bilibili
网站地址：https://www.bilibili.com/video/BVxxxxxxx
目标选择器：.bilibili-player
```

### 示例3：知乎文章

```
网站名称：知乎文章
网站地址：https://zhuanlan.zhihu.com/p/xxxxx
目标选择器：.Post-Main
```

只显示文章正文，隐藏侧边栏、推荐内容等。

### 示例4：通用视频元素

```
网站名称：任意视频网站
网站地址：https://example.com
目标选择器：video
```

直接选择页面中的video标签。

## 常用选择器参考

| 网站 | 选择器 | 说明 |
|------|--------|------|
| YouTube | `#movie_player` | 完整播放器 |
| YouTube | `video.html5-main-video` | 纯视频元素 |
| Bilibili | `.bilibili-player` | 播放器容器 |
| Bilibili | `.bilibili-player-video-wrap` | 视频包装器 |
| 抖音网页版 | `#player` | 视频播放器 |
| 腾讯视频 | `.txp_video` | 视频容器 |
| 爱奇艺 | `.iqp-player` | 播放器 |
| 知乎 | `.Post-Main` | 文章主体 |
| 掘金 | `.article-content` | 文章内容 |
| CSDN | `#article_content` | 文章内容 |
| GitHub | `.markdown-body` | Markdown内容 |
| 通用视频 | `video` | 任何video标签 |
| 通用播放器 | `[class*="player"]` | 包含player的类名 |

## CSS选择器语法

支持标准CSS选择器：

```css
/* ID选择器 */
#element-id

/* 类选择器 */
.class-name

/* 标签选择器 */
div

/* 属性选择器 */
[data-role="player"]

/* 多级选择器 */
div.container > section.content

/* 组合选择器 */
.video-player, .player-container

/* 伪类选择器 */
div:first-child

/* 复杂选择器 */
#main .content-area article:first-of-type
```

## 如何找到正确的选择器

### 方法1：使用浏览器开发者工具

1. 在目标网站按 `F12` 打开开发者工具
2. 点击元素选择工具（左上角箭头图标）
3. 点击要全屏的区域
4. 在Elements面板中查看元素的id或class
5. 在Console中测试：`document.querySelector('你的选择器')`

### 方法2：查看元素属性

右键点击要全屏的区域 → 检查元素 → 查看：
- `id` 属性：使用 `#id名称`
- `class` 属性：使用 `.class名称`
- `data-*` 属性：使用 `[data-name="value"]`

### 方法3：使用Chrome DevTools的Copy Selector功能

1. 在Elements面板中找到目标元素
2. 右键点击元素
3. 选择 Copy → Copy selector
4. 粘贴到全视界的选择器输入框

## 工作原理

### Electron版本

```javascript
// 1. 用户点击全屏
fullscreen()

// 2. 检测到选择器配置
if (targetSelector) {
  // 3. 通过IPC发送命令到主进程
  electron.executeInIframe(iframeId, code)
  
  // 4. 在iframe中执行JavaScript
  // - 找到目标元素
  // - 隐藏其他元素
  // - 将目标元素全屏化
}
```

### Chrome扩展版本

```javascript
// 1. 全视界发送postMessage
window.postMessage({
  source: 'quanshijie',
  action: 'applySelectorFullscreen',
  selector: '#player'
})

// 2. Content Script接收消息
chrome.runtime.sendMessage({...})

// 3. Background Script在iframe中执行脚本
chrome.scripting.executeScript({...})

// 4. 返回结果给全视界
window.postMessage({
  source: 'quanshijie-extension',
  action: 'response'
})
```

## 故障排除

### 选择器不生效

**检查：**
1. 选择器是否正确？在控制台测试：`document.querySelector('选择器')`
2. 元素是否存在？可能需要等待页面加载
3. Electron版本无需扩展，网页版需要安装Chrome扩展
4. 查看控制台是否有错误信息

### 元素没有完全全屏

某些网站的CSS可能有特殊样式，尝试：
1. 使用更上层的容器选择器
2. 等待页面完全加载后再全屏
3. 检查是否有fixed定位的其他元素

### 退出全屏后样式异常

1. 刷新页面可以恢复
2. 检查浏览器控制台是否有JavaScript错误
3. 尝试使用更精确的选择器

## 技术限制

1. **跨域限制**：某些网站设置了严格的CSP，可能无法操作
2. **动态内容**：SPA应用的动态加载元素可能需要延迟
3. **Shadow DOM**：Web Components内部的元素可能无法直接选择
4. **iframe嵌套**：只支持一层iframe，不支持嵌套iframe

## 高级用法

### 等待元素加载

对于动态加载的元素，扩展会自动延迟500ms再应用选择器：

```javascript
// WebsiteCard.vue 中的实现
setTimeout(async () => {
  await applySelectorFullscreen()
}, 500)
```

### 组合多个元素

如果需要显示多个元素：

```css
/* 使用逗号分隔 */
.video-player, .video-controls

/* 或使用父容器 */
.player-wrapper
```

### 调试模式

查看详细日志：

```javascript
// 浏览器控制台
[全视界] 选择器全屏已应用: #player
[全视界 Extension] 收到来自全视界的消息
```

## 开发文档

### 添加选择器支持到其他功能

如果你想在自己的项目中使用这个功能：

```javascript
// 1. 在iframe中注入脚本
const code = `
  const element = document.querySelector('${selector}');
  if (element) {
    // 操作元素
  }
`;

// 2. Electron环境
window.electron.executeInIframe(iframeId, code);

// 3. Chrome扩展环境
window.postMessage({
  source: 'quanshijie',
  action: 'applySelectorFullscreen',
  selector: selector
}, '*');
```

### API参考

**Electron API:**
```javascript
window.electron.executeInIframe(iframeId, code)
// 返回 Promise<{success: boolean, result: any}>
```

**Chrome扩展消息格式:**
```javascript
// 请求
{
  source: 'quanshijie',
  action: 'applySelectorFullscreen',
  selector: string,
  requestId: string
}

// 响应
{
  source: 'quanshijie-extension',
  action: 'applySelectorFullscreenResponse',
  requestId: string,
  response: {success: boolean, error?: string}
}
```

## 贡献

欢迎提交：
- 常用网站的选择器配置
- 功能改进建议
- Bug报告
- Chrome扩展的功能增强

## 许可证

MIT License © MaskerPRC

