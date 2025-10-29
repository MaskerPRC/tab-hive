# Chrome 扩展支持功能

## 功能说明

Tab Hive 的 Electron 桌面版现已支持加载 Chrome 扩展，可以在所有 webview 中使用扩展功能，如广告拦截、脚本注入等。

## 如何使用

### 方法一：自动加载（推荐）

1. 在项目根目录创建 `extensions` 文件夹
2. 将解压后的 Chrome 扩展文件夹放入 `extensions` 目录
3. 启动或重启 Tab Hive
4. 扩展将自动加载

**目录结构示例：**
```
iframe-all/
├── extensions/
│   ├── adblock/        # 广告拦截扩展
│   │   ├── manifest.json
│   │   ├── icon.png
│   │   └── ...
│   └── tampermonkey/   # 油猴脚本管理器
│       ├── manifest.json
│       └── ...
├── electron/
├── src/
└── ...
```

### 方法二：通过 API 手动加载

可以在代码中使用 Electron API 手动加载扩展：

```javascript
// 加载扩展
const result = await window.electron.extensions.load('/path/to/extension')
if (result.success) {
  console.log('扩展加载成功:', result.extension.name)
}

// 获取已加载的扩展列表
const extensions = await window.electron.extensions.getLoaded()

// 卸载扩展
await window.electron.extensions.unload(extensionId)

// 选择扩展目录（打开文件选择器）
const result = await window.electron.extensions.selectDirectory()
if (result.success) {
  await window.electron.extensions.load(result.path)
}
```

## 获取 Chrome 扩展

### 1. 从 Chrome 网上应用店下载

使用扩展下载工具（如 [CRX Extractor](https://crxextractor.com/)）下载 `.crx` 文件，然后解压。

### 2. 解压 CRX 文件

**Windows:**
1. 将 `.crx` 文件重命名为 `.zip`
2. 使用解压工具解压

**Linux/Mac:**
```bash
unzip extension.crx -d extension_folder/
```

### 3. 开发者模式扩展

如果你有扩展的源代码，可以直接使用。

## 推荐扩展

### uBlock Origin（广告拦截）
- 轻量级广告拦截器
- 下载地址：https://github.com/gorhill/uBlock

### Tampermonkey（用户脚本管理器）
- 支持运行自定义 JavaScript 脚本
- 下载地址：https://www.tampermonkey.net/

### Dark Reader（暗色主题）
- 为所有网站应用暗色主题
- 下载地址：https://darkreader.org/

### Stylus（用户样式管理器）
- 自定义网站 CSS 样式
- 下载地址：https://github.com/openstyles/stylus

## 注意事项

1. **扩展兼容性**：大部分 Chrome 扩展可以正常工作，但某些依赖特定 Chrome API 的扩展可能无法使用
2. **扩展权限**：扩展会在所有 webview 中生效，请确保扩展来源可信
3. **性能影响**：加载过多扩展可能影响性能，建议只加载必需的扩展
4. **扩展更新**：需要手动下载新版本并替换文件夹
5. **扩展配置**：扩展的配置会保存在 Electron 的用户数据目录中

## 故障排除

### 扩展无法加载

1. 检查扩展文件夹中是否有 `manifest.json` 文件
2. 查看控制台是否有错误信息
3. 确认扩展支持 Manifest V2 或 V3
4. 尝试从官方来源重新下载扩展

### 扩展功能异常

1. 检查扩展在普通 Chrome 浏览器中是否正常工作
2. 查看 DevTools 控制台的错误信息
3. 某些扩展可能需要特定的权限配置

## 技术实现

Tab Hive 使用 Electron 的 `session.loadExtension()` API 加载扩展，支持：
- Manifest V2 和 V3 扩展
- 内容脚本（Content Scripts）
- 后台脚本（Background Scripts）
- 扩展页面（Extension Pages）
- 大部分 Chrome Extension APIs

## 示例：创建简单的自定义扩展

创建一个简单的扩展来隐藏所有广告：

**extensions/simple-adblock/manifest.json:**
```json
{
  "manifest_version": 2,
  "name": "Simple AdBlock",
  "version": "1.0.0",
  "description": "简单的广告拦截器",
  "content_scripts": [
    {
      "matches": ["<all_urls>"],
      "js": ["content.js"],
      "run_at": "document_end"
    }
  ]
}
```

**extensions/simple-adblock/content.js:**
```javascript
// 隐藏常见的广告选择器
const adSelectors = [
  '[class*="ad"]',
  '[id*="ad"]',
  '[class*="banner"]',
  'iframe[src*="doubleclick"]'
];

adSelectors.forEach(selector => {
  document.querySelectorAll(selector).forEach(el => {
    el.style.display = 'none';
  });
});

console.log('[Simple AdBlock] 广告已拦截');
```

## 更多信息

- [Chrome Extension 开发文档](https://developer.chrome.com/docs/extensions/)
- [Electron Extensions 文档](https://www.electronjs.org/docs/latest/api/extensions)
- [Tab Hive 项目主页](https://github.com/your-repo/tab-hive)

