# 改进的元素选择器功能

## 概述

参考 Automa 项目的优秀实现，我们对 全视界 的元素选择器进行了全面升级，提供了更加直观和强大的可视化选择体验。

## 🎨 主要改进

### 1. SVG 高亮显示 (`ElementHighlighter.vue`)

**特性:**
- 使用 SVG overlay 实时高亮悬停和选中的元素
- 悬停元素显示黄色高亮 (rgba(251, 191, 36))
- 选中元素显示蓝色高亮 (rgba(37, 99, 235))
- 活动元素显示红色高亮 (rgba(248, 113, 113))
- 平滑的过渡动画效果

**实现细节:**
```vue
<svg class="element-highlighter">
  <!-- 悬停元素 -->
  <rect fill="rgba(251, 191, 36, 0.15)" stroke="#fbbf24" />
  
  <!-- 选中元素 -->
  <rect fill="rgba(37, 99, 235, 0.15)" stroke="#2563EB" />
</svg>
```

### 2. 可拖动工具栏 (`SelectorToolbar.vue`)

**特性:**
- 浮动面板设计，不遮挡页面内容
- 可自由拖动到屏幕任意位置
- 实时显示当前选择器
- 支持手动编辑选择器
- 集成父子元素导航
- 选择器生成规则配置
- 显示元素详细信息

**交互方式:**
- 悬停在工具栏上显示拖动手柄
- 点击拖动手柄移动面板
- 面板自动限制在视口范围内

### 3. 父子元素导航

**功能:**
- **父元素按钮**: 选择当前元素的父元素
- **子元素按钮**: 选择当前元素的第一个子元素
- **用途**: 快速调整选择器的精确度

**使用场景:**
```html
<!-- 当前选中 -->
<div class="container">
  <div class="content">
    <button class="btn">Click</button> ← 选中这里
  </div>
</div>

<!-- 点击"父元素" → 选中 .content -->
<!-- 再点击"父元素" → 选中 .container -->
```

### 4. 选择器配置选项

**可配置项:**
- ✓ 包含元素 ID
- ✓ 包含 Class 名称
- ✓ 包含标签名
- ✓ 包含属性

**生成规则优先级:**
1. ID (`#element-id`)
2. Class (`element.class-name`)
3. 标签 + nth-child (`div > span:nth-child(3)`)
4. 标签名 (`div`)

### 5. 元素详细信息显示

**显示内容:**
- 标签名 (tagName)
- ID
- Class 名称
- 元素尺寸 (width × height)
- CSS 属性 (display, position, z-index)
- 文本内容 (限制 100 字符)
- 常用属性 (href, src, alt, title, type, value)

**示例:**
```javascript
{
  tagName: 'button',
  id: 'submit-btn',
  className: 'btn btn-primary',
  width: 120,
  height: 40,
  display: 'inline-block',
  position: 'relative',
  zIndex: '1',
  textContent: '提交',
  attributes: {
    type: 'submit',
    value: 'submit'
  }
}
```

### 6. 空格键选择

**特性:**
- 除了点击，还支持按空格键选择元素
- 更符合键盘操作习惯
- 在编辑选择器时自动暂停交互

**使用方式:**
1. 移动鼠标到目标元素上
2. 按下空格键选择
3. 或直接点击选择

### 7. 增强的高亮动画

**Chrome 扩展高亮样式:**
```css
.quanshijie-element-highlight {
  border: 2px solid #ff5c00;
  background: rgba(255, 92, 0, 0.1);
  box-shadow: 0 0 0 2px rgba(255, 92, 0, 0.3);
  transition: all 0.1s ease-out;
}

/* 虚线边框动画 */
.quanshijie-element-highlight::before {
  border: 2px dashed rgba(255, 92, 0, 0.5);
  animation: quanshijie-dash 0.5s linear infinite;
}
```

## 🔧 技术实现

### 组件架构

```
ElementSelector.vue (主组件)
  ├── SelectorToolbar.vue (工具栏UI)
  └── ElementHighlighter.vue (SVG高亮层)
```

### 消息通信

**Chrome 扩展:**
```javascript
// 发送悬停消息
window.parent.postMessage({
  source: 'quanshijie-extension',
  action: 'elementHovered',
  selector: '#element-id',
  rect: { x: 100, y: 200, width: 300, height: 150 },
  elementInfo: { tagName: 'div', ... }
}, '*')
```

**Electron (Webview):**
```javascript
// 发送选中消息
ipcRenderer.sendToHost('element-selector-select', {
  selector: '.btn.primary',
  rect: { x: 100, y: 200, width: 120, height: 40 },
  elementInfo: { tagName: 'button', ... }
})
```

### 数据流

```
用户交互
  ↓
iframe/webview 内脚本
  ↓
postMessage / IPC
  ↓
ElementSelector.vue
  ↓
更新高亮 (ElementHighlighter)
  ↓
更新工具栏 (SelectorToolbar)
```

## 🎯 使用指南

### 1. 启动选择器

```javascript
// 在 WebsiteCard 中
const startSelector = () => {
  // 设置选择器激活状态
  isSelectingElement.value = true
}
```

### 2. 处理选择结果

```javascript
const handleElementSelected = (result) => {
  const { selector, elementInfo } = result
  
  // 保存选择器
  website.targetSelector = selector
  
  // 可选：使用元素信息
  console.log(`选中元素: ${elementInfo.tagName}`)
  console.log(`尺寸: ${elementInfo.width}x${elementInfo.height}`)
}
```

### 3. 配置选择器规则

在 `SelectorToolbar.vue` 中:
```javascript
const settings = reactive({
  includeId: true,        // 优先使用 ID
  includeClass: true,     // 使用 Class
  includeTag: true,       // 使用标签名
  includeAttributes: false // 使用属性选择器
})
```

## 📋 与 Automa 的对比

| 特性 | Automa | 全视界 (改进后) |
|-----|--------|------------------|
| SVG 高亮 | ✓ | ✓ |
| 可拖动面板 | ✓ | ✓ |
| 父子导航 | ✓ | ✓ |
| 选择器配置 | ✓ | ✓ |
| 空格键选择 | ✓ | ✓ |
| 元素详情 | ✓ | ✓ |
| 列表选择 | ✓ | ⏳ (待实现) |
| iframe 支持 | ✓ | ✓ |
| Electron 支持 | ✗ | ✓ (独有) |

## 🚀 未来改进方向

### 列表选择模式
- 支持选择多个相似元素
- 智能识别列表项模式
- 批量操作支持

### XPath 支持
- 增加 XPath 选择器生成
- CSS 和 XPath 切换
- 更强大的元素定位

### 选择器验证
- 实时验证选择器有效性
- 显示匹配元素数量
- 提供优化建议

### 选择器历史
- 记录最近使用的选择器
- 快速复用选择器
- 选择器收藏功能

## 📝 代码示例

### 完整的选择器使用流程

```vue
<template>
  <ElementSelector
    :is-active="isSelectingElement"
    :target-iframe="iframeRef"
    @select="handleElementSelected"
    @cancel="handleCancel"
  />
</template>

<script setup>
import { ref } from 'vue'
import ElementSelector from './ElementSelector.vue'

const isSelectingElement = ref(false)
const iframeRef = ref(null)

const startSelection = () => {
  isSelectingElement.value = true
}

const handleElementSelected = ({ selector, elementInfo }) => {
  console.log('选中的选择器:', selector)
  console.log('元素信息:', elementInfo)
  
  // 保存选择器
  currentWebsite.value.targetSelector = selector
  
  // 关闭选择器
  isSelectingElement.value = false
}

const handleCancel = () => {
  console.log('用户取消选择')
  isSelectingElement.value = false
}
</script>
```

## 🎨 样式定制

### 修改高亮颜色

```css
/* 悬停颜色 - 黄色 */
:root {
  --hover-color: rgba(251, 191, 36, 0.15);
  --hover-border: #fbbf24;
}

/* 选中颜色 - 蓝色 */
:root {
  --selected-color: rgba(37, 99, 235, 0.15);
  --selected-border: #2563EB;
}

/* 活动颜色 - 红色 */
:root {
  --active-color: rgba(248, 113, 113, 0.15);
  --active-border: #f87171;
}
```

### 修改工具栏样式

```css
.selector-toolbar {
  background: white;
  border-radius: 12px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
  /* 自定义样式 */
}
```

## ⚡ 性能优化

1. **防抖处理**: 鼠标移动事件使用防抖，减少重绘
2. **事件代理**: 使用捕获阶段监听，提高效率
3. **条件渲染**: 仅在激活时渲染高亮层
4. **内存管理**: 组件卸载时清理所有监听器

## 🐛 常见问题

### Q: 选择器在跨域 iframe 中不工作？
A: 需要安装 Chrome 扩展才能支持跨域 iframe。

### Q: 高亮位置偏移？
A: 检查页面是否有滚动，确保计算 scrollX/scrollY。

### Q: 元素选择后页面卡顿？
A: 检查是否正确清理了事件监听器。

## 📚 参考资源

- [Automa 项目](https://github.com/AutomaApp/automa)
- [CSS Selectors MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_Selectors)
- [Element.getBoundingClientRect()](https://developer.mozilla.org/en-US/docs/Web/API/Element/getBoundingClientRect)

## 📄 更新日志

### v2.0.0 (2024-10-29)
- ✨ 新增 SVG 高亮显示组件
- ✨ 新增可拖动工具栏
- ✨ 支持父子元素导航
- ✨ 添加选择器配置选项
- ✨ 显示元素详细信息
- ✨ 支持空格键选择
- 🔧 改进 Chrome 扩展通信
- 🔧 增强 Electron webview 支持
- 📝 完善文档和示例

---

**作者**: 全视界 Team  
**日期**: 2024-10-29  
**版本**: 2.0.0

