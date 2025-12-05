# 通过 URL 参数导入布局功能

全视界 现在支持通过 URL 查询参数直接导入一个 URLs 数组来创建新布局。

## 功能说明

当你在 URL 中添加 `urls` 参数时，应用会自动：
1. 解析 URLs 参数
2. 创建一个新的布局
3. 自动添加所有网站到布局中
4. 智能计算合适的行列数（或使用指定的行列数）

## 使用方法

### 格式 1：逗号分隔的 URLs（最简单）

```
http://localhost:3000/?urls=https://google.com,https://bing.com,https://github.com
```

### 格式 2：JSON 字符串数组

```
http://localhost:3000/?urls=["https://google.com","https://bing.com","https://github.com"]
```

### 格式 3：带标题的 JSON 对象数组（推荐）

```
http://localhost:3000/?urls=[{"url":"https://google.com","title":"谷歌"},{"url":"https://bing.com","title":"必应"},{"url":"https://github.com","title":"GitHub"}]
```

### 格式 4：带设备类型的完整配置

```
http://localhost:3000/?urls=[{"url":"https://google.com","title":"谷歌","deviceType":"desktop"},{"url":"https://m.twitter.com","title":"推特","deviceType":"mobile"}]
```

## 可选参数

### `layoutName` 或 `name` - 指定布局名称

```
?urls=...&layoutName=我的工作空间
```

### `rows` - 指定行数

```
?urls=...&rows=3
```

### `cols` - 指定列数

```
?urls=...&cols=4
```

### `clearParams` - 是否清除 URL 参数（默认为 true）

```
?urls=...&clearParams=false
```

如果设置为 `false`，导入后 URL 参数会保留在地址栏中。

## 完整示例

### 示例 1：创建一个简单的社交媒体布局

```
http://localhost:3000/?urls=https://twitter.com,https://facebook.com,https://instagram.com,https://linkedin.com&layoutName=社交媒体&rows=2&cols=2
```

### 示例 2：创建一个开发工具布局

```
http://localhost:3000/?urls=[{"url":"https://github.com","title":"GitHub"},{"url":"https://stackoverflow.com","title":"Stack Overflow"},{"url":"https://developer.mozilla.org","title":"MDN"},{"url":"https://www.npmjs.com","title":"NPM"}]&layoutName=开发工具
```

### 示例 3：创建一个新闻网站布局

```
http://localhost:3000/?urls=["https://www.bbc.com","https://www.cnn.com","https://www.nytimes.com","https://news.google.com"]&layoutName=新闻聚合&rows=2&cols=2
```

## 自动行列计算规则

如果不指定 `rows` 和 `cols` 参数，系统会根据网站数量自动计算：

- 1-4 个网站：2×2 布局
- 5-6 个网站：2×3 布局
- 7-9 个网站：3×3 布局
- 10-12 个网站：3×4 布局
- 更多网站：自动计算最接近正方形的布局

## URL 编码

如果你的 URL 中包含特殊字符，请使用 URL 编码：

```javascript
// JavaScript 中编码示例
const urls = [
  { url: "https://google.com", title: "谷歌" },
  { url: "https://bing.com", title: "必应" }
];
const encodedUrls = encodeURIComponent(JSON.stringify(urls));
const finalUrl = `http://localhost:3000/?urls=${encodedUrls}&layoutName=搜索引擎`;
```

## 注意事项

1. **URL 必须是有效的格式**：如果 URL 不包含 `http://` 或 `https://`，系统会自动添加 `https://`
2. **设备类型**：可选值为 `desktop`（默认）或 `mobile`
3. **参数持久化**：默认情况下，导入成功后会清除 URL 参数。如需保留，设置 `clearParams=false`
4. **浏览器限制**：URL 长度有限制（通常约 2000 字符），如果需要导入大量网站，建议使用其他方式

## 编程方式使用

### 在 JavaScript 中生成导入链接

```javascript
function generateImportUrl(websites, options = {}) {
  const baseUrl = 'http://localhost:3000/'; // 或你的实际域名
  const params = new URLSearchParams();
  
  // 添加 URLs
  params.append('urls', JSON.stringify(websites));
  
  // 添加可选参数
  if (options.layoutName) {
    params.append('layoutName', options.layoutName);
  }
  if (options.rows) {
    params.append('rows', options.rows);
  }
  if (options.cols) {
    params.append('cols', options.cols);
  }
  if (options.clearParams !== undefined) {
    params.append('clearParams', options.clearParams);
  }
  
  return `${baseUrl}?${params.toString()}`;
}

// 使用示例
const importUrl = generateImportUrl(
  [
    { url: 'https://google.com', title: '谷歌' },
    { url: 'https://bing.com', title: '必应' }
  ],
  {
    layoutName: '搜索引擎',
    rows: 2,
    cols: 2
  }
);

console.log(importUrl);
// 然后可以通过 window.location.href = importUrl 跳转
```

### 在其他页面创建"在 全视界 中打开"按钮

```html
<button onclick="openInQuanShiJie()">在 全视界 中打开这些网站</button>

<script>
function openInQuanShiJie() {
  const websites = [
    { url: 'https://example1.com', title: '网站1' },
    { url: 'https://example2.com', title: '网站2' },
    { url: 'https://example3.com', title: '网站3' }
  ];
  
  const params = new URLSearchParams({
    urls: JSON.stringify(websites),
    layoutName: '我的网站集合'
  });
  
  const url = `http://localhost:3000/?${params.toString()}`;
  window.open(url, '_blank');
}
</script>
```

## 与现有布局的关系

- 导入的布局会作为**新布局**添加到你的布局列表中
- 不会影响现有的布局
- 导入后会自动切换到新创建的布局

## 错误处理

如果 URL 参数格式错误，系统会：
1. 在控制台输出错误信息
2. 不创建新布局
3. 继续正常加载应用

## 实际应用场景

1. **分享工作空间**：创建一个包含你常用网站的链接，分享给同事
2. **快速设置**：为不同项目准备不同的网站集合，通过链接快速切换
3. **教学演示**：准备教学或演示用的网站集合
4. **书签集成**：将网站集合保存为书签，一键打开所有相关网站

