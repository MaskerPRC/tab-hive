# Tab Hive Chrome Extension 安装指南

这是 Tab Hive 的 Chrome 扩展，用于在网页版中实现选择器全屏功能。

## 功能说明

此扩展允许你在Tab Hive网页版中使用"目标选择器"功能，实现只全屏显示iframe中指定CSS选择器的元素。

### 典型应用场景

1. **视频网站**：只显示视频播放器，隐藏其他页面元素
2. **文章阅读**：只显示文章内容区域，屏蔽广告和侧边栏
3. **直播平台**：聚焦直播画面，隐藏弹幕和评论区
4. **演示工具**：展示特定UI组件，隐藏开发工具和其他内容

## 安装方法

### 方法1：开发者模式安装（推荐）

1. **打开扩展管理页面**
   - 在Chrome浏览器中访问 `chrome://extensions/`
   - 或点击菜单 → 更多工具 → 扩展程序

2. **启用开发者模式**
   - 找到页面右上角的"开发者模式"开关
   - 点击开关，启用开发者模式

3. **加载扩展**
   - 点击左上角的"加载已解压的扩展程序"按钮
   - 选择 `chrome-extension` 文件夹
   - 点击"选择文件夹"

4. **确认安装**
   - 扩展卡片会出现在扩展列表中
   - 确保扩展已启用（开关为蓝色）

### 方法2：打包安装

1. **打包扩展**
   - 在 `chrome://extensions/` 页面
   - 点击"打包扩展程序"按钮
   - 扩展根目录：选择 `chrome-extension` 文件夹
   - 私有密钥文件：留空（首次打包）
   - 点击"打包扩展程序"

2. **安装CRX文件**
   - 找到生成的 `.crx` 文件
   - 将文件拖拽到 `chrome://extensions/` 页面
   - 点击"添加扩展程序"确认安装

## 使用方法

### 1. 配置网站选择器

在Tab Hive中添加或编辑网站时：

```
网站名称：YouTube
网站地址：https://youtube.com
目标选择器：#movie_player
```

常用选择器示例：

| 网站 | 选择器 | 说明 |
|------|--------|------|
| YouTube | `#movie_player` | 视频播放器 |
| Bilibili | `.bilibili-player` | B站播放器 |
| 知乎 | `.Post-Main` | 文章主体 |
| CSDN | `#article_content` | 文章内容 |
| 通用视频 | `video` | 任何video标签 |

### 2. 测试选择器

在配置选择器之前，建议先测试：

1. 在目标网站按F12打开开发者工具
2. 在控制台输入：
   ```javascript
   document.querySelector('你的选择器')
   ```
3. 如果返回元素对象，说明选择器有效

### 3. 使用全屏功能

1. 在Tab Hive中点击网站的全屏按钮
2. 如果配置了选择器，只会显示该元素
3. 页面其他内容会被自动隐藏
4. 退出全屏时自动恢复原始样式

## 故障排除

### 扩展未生效

**检查清单：**
- ✅ 扩展是否已启用？
- ✅ 是否在Tab Hive网页版中使用？（Electron版不需要扩展）
- ✅ 选择器是否正确？
- ✅ 浏览器控制台是否有错误？

### 选择器找不到元素

**可能原因：**
1. 选择器拼写错误
2. 元素在iframe中动态加载，需要等待
3. 网站结构发生变化

**解决方法：**
```javascript
// 在开发者工具中测试
document.querySelector('你的选择器')

// 如果返回null，尝试：
// 1. 检查元素是否在iframe中
// 2. 等待页面完全加载
// 3. 使用更通用的选择器
```

### 样式恢复异常

如果退出全屏后样式没有恢复：

1. 刷新页面
2. 检查是否有JavaScript错误
3. 尝试更新扩展

## 高级用法

### 复杂选择器

支持标准CSS选择器语法：

```css
/* 多级选择 */
div.container > section.content

/* 属性选择 */
[data-role="player"]

/* 组合选择 */
.video-player, .player-container

/* 伪类选择 */
div:first-child

/* ID + 类名 */
#main .content-area
```

### 动态内容

对于单页应用(SPA)，元素可能动态加载：

```javascript
// 扩展会自动重试查找元素
// 建议等待500ms后再应用选择器
```

### 调试模式

在浏览器控制台查看调试信息：

```javascript
// Tab Hive的消息
[Tab Hive] 选择器全屏已应用: #player

// 扩展的消息  
[Tab Hive Extension] 收到来自Tab Hive的消息
```

## 权限说明

此扩展需要以下权限：

- **activeTab**: 访问当前活动标签页（应用选择器）
- **scripting**: 在页面中执行脚本（修改DOM）
- **storage**: 存储配置（保存设置）
- **<all_urls>**: 支持任意网站的iframe

所有权限仅用于实现选择器全屏功能，不会收集任何用户数据。

## 兼容性

- ✅ Chrome 88+
- ✅ Microsoft Edge 88+
- ✅ Brave Browser
- ✅ 其他基于Chromium的浏览器

**注意：** Firefox需要使用WebExtensions版本（暂未提供）

## 更新扩展

当扩展代码更新后：

1. 在 `chrome://extensions/` 页面
2. 找到Tab Hive扩展卡片
3. 点击刷新图标 ↻
4. 重新加载Tab Hive页面

## 卸载扩展

如果不再需要扩展：

1. 在 `chrome://extensions/` 页面
2. 找到Tab Hive扩展
3. 点击"移除"按钮
4. 确认卸载

**注意：** Electron版本不需要此扩展，选择器功能是内置的。

## 反馈与支持

如果遇到问题或有建议：

1. 查看浏览器控制台的错误信息
2. 提供详细的复现步骤
3. 附上选择器和目标网站URL
4. 在GitHub提交Issue

## 开源协议

MIT License © MaskerPRC

