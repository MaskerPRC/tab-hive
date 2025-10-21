# Tab Hive - Chrome Extension

这是 Tab Hive 的 Chrome 扩展，用于在网页版本中提供选择器全屏功能。

## 功能

- 支持在iframe中通过CSS选择器定位元素
- 全屏时只显示指定选择器的元素
- 自动隐藏页面其他内容
- 退出全屏时自动恢复原始样式

## 安装方法

### 开发者模式安装

1. 打开 Chrome 浏览器
2. 访问 `chrome://extensions/`
3. 开启右上角的"开发者模式"
4. 点击"加载已解压的扩展程序"
5. 选择 `chrome-extension` 文件夹

### 打包安装

1. 在 `chrome://extensions/` 页面
2. 点击"打包扩展程序"
3. 选择 `chrome-extension` 文件夹
4. 生成 `.crx` 文件
5. 拖拽 `.crx` 文件到扩展页面安装

## 使用方法

### 在 Tab Hive 中配置

1. 添加或编辑网站时，填写"目标选择器"字段
2. 输入CSS选择器，例如：
   - `#player` - 选择id为player的元素
   - `.video-player` - 选择class为video-player的元素
   - `div.content > video` - 更复杂的选择器

3. 点击全屏按钮时，将只显示该选择器对应的元素

### 常见选择器示例

- YouTube视频播放器: `#movie_player`
- Bilibili视频播放器: `.bilibili-player-video-wrap`
- 通用视频标签: `video`
- 文章内容区域: `article`, `.post-content`, `#main-content`

## 技术说明

### 工作原理

1. Content Script 在每个页面中运行
2. 监听来自 Tab Hive 应用的消息
3. 通过 Background Script 在iframe中执行脚本
4. 使用CSS选择器定位目标元素
5. 隐藏其他元素并将目标元素全屏化

### 文件结构

```
chrome-extension/
├── manifest.json       # 扩展配置文件
├── background.js       # 后台脚本
├── content.js          # 内容脚本
├── popup.html          # 弹出页面
├── icon16.png          # 16x16图标
├── icon48.png          # 48x48图标
├── icon128.png         # 128x128图标
└── README.md           # 说明文档
```

## 权限说明

- `activeTab`: 访问当前活动标签页
- `scripting`: 在页面中执行脚本
- `storage`: 存储配置信息
- `<all_urls>`: 在所有网站上运行（用于支持任意网站的iframe）

## 兼容性

- Chrome 88+
- Edge 88+
- 其他基于Chromium的浏览器

## 注意事项

1. 某些网站可能有严格的CSP策略，可能无法应用选择器
2. 跨域iframe可能受到同源策略限制
3. 建议先在开发者工具中测试选择器是否有效

## 开发

### 调试

1. 在 `chrome://extensions/` 中启用开发者模式
2. 点击扩展卡片的"背景页"查看后台日志
3. 在网页中按F12打开开发者工具查看content script日志

### 更新

修改代码后，在扩展页面点击刷新图标即可重新加载扩展。

## License

MIT © MaskerPRC

