# CSS选择器功能 - 快速开始

## 功能说明

配置CSS选择器后：
- **Grid模式（多窗口）**：只显示选择器指定的元素（如播放器、图表等）
- **全屏模式**：显示完整网页

这样可以在Grid视图中节省空间，聚焦关键内容，全屏时获得完整体验。

## 5分钟快速上手

### 方式1：Electron版本（推荐，无需额外配置）

#### 1. 启动应用
```bash
npm run electron:dev
```

#### 2. 添加网站
- 点击右下角的 ➕ 按钮
- 填写信息：
  ```
  网站名称：YouTube
  网站地址：https://www.youtube.com
  目标选择器：#movie_player
  ```
- 点击确定

#### 3. 体验全屏
- 点击网站卡片上的全屏按钮 ⛶
- 观察：只有视频播放器全屏显示，其他内容隐藏
- 按ESC或点击顶部退出按钮返回

### 方式2：Chrome扩展 + 网页版

#### 1. 安装Chrome扩展
```bash
# 在浏览器中访问
chrome://extensions/

# 启用"开发者模式"（右上角开关）
# 点击"加载已解压的扩展程序"
# 选择：chrome-extension 文件夹
```

#### 2. 启动网页版
```bash
npm run dev
```

#### 3. 配置并使用
- 在浏览器中访问 http://localhost:3000
- 添加网站时填写目标选择器
- 全屏时扩展会自动应用选择器

## 常用配置示例

### YouTube视频全屏
```
网站名称：YouTube
网站地址：https://www.youtube.com/watch?v=dQw4w9WgXcQ
目标选择器：#movie_player
```

### Bilibili视频全屏
```
网站名称：Bilibili
网站地址：https://www.bilibili.com/video/BV1xx411c7XZ
目标选择器：.bilibili-player
```

### 知乎文章阅读
```
网站名称：知乎文章
网站地址：https://zhuanlan.zhihu.com/p/123456789
目标选择器：.Post-Main
```

### 通用视频元素
```
网站名称：任意视频网站
网站地址：https://example.com/video
目标选择器：video
```

## 如何找到正确的选择器

### 方法1：Chrome DevTools（最简单）

1. 在目标网站上按 `F12` 打开开发者工具
2. 点击左上角的元素选择工具（箭头图标）
3. 点击你想要全屏的区域（如视频播放器）
4. 在Elements面板中右键点击高亮的元素
5. 选择 Copy → Copy selector
6. 粘贴到全视界的"目标选择器"输入框

### 方法2：手动查找

1. 按 `F12` 打开开发者工具
2. 点击元素选择工具，点击目标区域
3. 在Elements面板中查看元素的：
   - `id` 属性 → 使用 `#id名称`
   - `class` 属性 → 使用 `.class名称`
4. 在Console中测试：
   ```javascript
   document.querySelector('你的选择器')
   ```
5. 如果返回元素对象（不是null），说明选择器正确

### 方法3：常见模式

大多数视频网站的播放器选择器模式：
```css
/* ID模式 */
#player, #video-player, #movie_player

/* Class模式 */
.player, .video-player, .player-container

/* 属性模式 */
[class*="player"]

/* 标签模式 */
video
```

## 验证配置是否生效

### 检查清单

**Electron版本：**
- ✅ 启动了Electron应用
- ✅ 配置了目标选择器
- ✅ 点击全屏按钮
- ✅ 只显示选中的元素

**网页版本：**
- ✅ 安装了Chrome扩展
- ✅ 扩展已启用
- ✅ 在网页版中配置选择器
- ✅ 浏览器控制台没有错误

### 查看日志

打开浏览器控制台（F12）查看：

```javascript
// 成功的日志
[全视界] 选择器全屏已应用: #player

// Electron环境
window.electron?.isElectron  // 应该返回 true

// Chrome扩展环境
// 应该看到扩展的消息
[全视界 Extension] Content script loaded
```

## 常见问题

### Q: 全屏后什么都不显示？
**A:** 
1. 检查选择器是否正确
2. 在控制台测试：`document.querySelector('你的选择器')`
3. 确认元素已经加载（可能需要等待几秒）

### Q: Electron版本不需要扩展吗？
**A:** 是的！Electron版本内置了选择器功能，无需任何扩展。

### Q: 网页版没反应？
**A:** 
1. 确认Chrome扩展已安装并启用
2. 刷新页面重试
3. 查看控制台是否有错误信息

### Q: 退出全屏后样式乱了？
**A:** 刷新页面即可恢复。这是极少数情况下的已知问题。

### Q: 可以选择多个元素吗？
**A:** 可以使用逗号分隔：`.video-player, .video-controls`

## 高级技巧

### 1. 等待动态加载的元素

某些网站的播放器是动态加载的，选择器可能需要更具体：

```css
/* 使用更深层的选择器 */
div.container > div.player-wrapper > #player

/* 使用属性选择器 */
[data-role="player"]
```

### 2. 选择iframe内的元素

如果目标元素本身在一个iframe中，尝试选择该iframe的父容器：

```css
/* 选择包含iframe的容器 */
.iframe-container
```

### 3. 调试模式

在控制台手动测试选择器效果：

```javascript
// 1. 找到元素
const el = document.querySelector('#player');

// 2. 手动全屏化
el.style.position = 'fixed';
el.style.top = '0';
el.style.left = '0';
el.style.width = '100vw';
el.style.height = '100vh';
el.style.zIndex = '9999';

// 3. 隐藏其他元素
document.querySelectorAll('body > *').forEach(e => {
  if (e !== el && !e.contains(el)) {
    e.style.display = 'none';
  }
});
```

## 下一步

- 📖 阅读完整文档：[SELECTOR_FEATURE.md](SELECTOR_FEATURE.md)
- 🔧 Chrome扩展详细安装：[chrome-extension/INSTALL.md](../chrome-extension/INSTALL.md)
- 🐝 探索更多全视界功能：[README.md](README.md)

## 反馈

遇到问题？
1. 检查浏览器控制台的错误信息
2. 尝试其他选择器
3. 在GitHub提交Issue，附上：
   - 目标网站URL
   - 使用的选择器
   - 错误截图或日志

享受你的全屏体验！🎉

