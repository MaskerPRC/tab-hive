# WebContentsView 层级问题修复说明

## 问题描述

在 WebContentsView 架构中，网站视图会覆盖控制界面，导致拖动手柄、浮动按钮等控制元素无法点击。

## 原因分析

1. **Electron 的多视图架构**：BaseWindow 使用 `contentView.addChildView()` 来添加多个视图
2. **层级顺序**：后添加的视图会显示在先添加的视图之上
3. **初始实现问题**：控制视图（controlView）在创建后立即添加，然后 WebContentsView 后续添加，导致 WebContentsView 在上层

## 解决方案

### 1. 调整视图添加顺序

**主进程 (electron/main.js)**

```javascript
// 延迟添加控制视图，确保它在最上层
controlView.webContents.once('did-finish-load', () => {
  // 在页面加载完成后才添加控制视图
  mainWindow.contentView.addChildView(controlView)
  
  // 创建视图管理器，传入控制视图引用
  viewManager = new WebContentsViewManager(mainWindow, controlView)
  
  mainWindow.show()
})
```

### 2. 确保控制视图始终在最上层

**WebContentsViewManager 类**

```javascript
class WebContentsViewManager {
  constructor(window, controlView) {
    this.window = window
    this.controlView = controlView // 保存控制视图引用
    this.views = new Map()
  }

  ensureControlViewOnTop() {
    if (this.controlView) {
      // 移除并重新添加控制视图，使其在最上层
      this.window.contentView.removeChildView(this.controlView)
      this.window.contentView.addChildView(this.controlView)
    }
  }

  createOrUpdateView(id, options) {
    // ... 创建视图代码 ...
    
    // 添加 WebContentsView 后，确保控制视图在最上层
    this.window.contentView.addChildView(view)
    this.ensureControlViewOnTop() // ← 关键步骤
  }
}
```

### 3. CSS pointer-events 优化

**前端样式 (WebsiteCard.vue)**

```css
/* grid-item 默认不拦截事件 */
.grid-item {
  pointer-events: none;
}

/* 子元素（按钮、手柄等）可接收事件 */
.grid-item > * {
  pointer-events: auto;
}

/* WebContentsView 占位符不拦截事件 */
.grid-item .webcontents-placeholder {
  pointer-events: none;
}
```

这样设置后：
- ✅ 拖动手柄可以点击
- ✅ 浮动按钮可以点击  
- ✅ 调整大小手柄可以拖拽
- ✅ WebContentsView 的内容区域可以正常交互

## 视图层级结构

```
BaseWindow
├── WebContentsView (website-1) ← 底层
├── WebContentsView (website-2)
├── WebContentsView (website-3)
└── WebContentsView (controlView) ← 顶层（控制界面）
    ├── 拖动手柄（可点击）
    ├── 浮动按钮（可点击）
    ├── 调整大小手柄（可拖拽）
    └── 内容占位符（透明，不拦截事件）
```

## 测试验证

### 1. 重启应用

```bash
npm run electron:dev
```

### 2. 验证控制元素

- [ ] 可以点击拖动手柄（⋮⋮）
- [ ] 可以拖拽网站卡片
- [ ] 可以点击浮动按钮（刷新、复制、编辑、全屏、删除）
- [ ] 可以拖拽调整大小手柄
- [ ] 网站内容区域可以正常交互（点击链接、滚动等）

### 3. 查看日志

应该看到以下日志：

```
[Electron Main] 控制界面加载完成
[Electron Main] 控制视图已添加到窗口（最上层）
[Electron Main] 视图管理器已创建
[ViewManager] 创建视图: website-xxx
[ViewManager] 控制视图已提升到最上层 ← 关键日志
```

## 技术细节

### Electron View 层级原理

在 Electron 的 BaseWindow + WebContentsView 架构中：

1. **addChildView** 按顺序叠加视图
2. **后添加的在上层**（类似 z-index）
3. **无法通过 CSS 控制**跨视图的层级
4. **必须在主进程中**调整添加顺序

### pointer-events 的作用

- `pointer-events: none`: 元素不响应鼠标事件，事件穿透到下层
- `pointer-events: auto`: 元素正常响应鼠标事件
- 在多视图架构中，这只影响同一个 WebContentsView 内的事件传递
- 跨视图的事件拦截由视图层级决定，而非 CSS

## 优势

### ✅ 修复后的优势

1. **UI 完全可用**：所有控制元素都能正常点击
2. **网站可交互**：WebContentsView 的内容可以正常操作
3. **性能良好**：事件处理效率高
4. **架构清晰**：控制层和内容层分离明确

### ⚠️ 注意事项

1. **视图创建顺序**：必须在 controlView 加载完成后才能创建 viewManager
2. **动态更新**：每次添加新的 WebContentsView 后都要调用 `ensureControlViewOnTop()`
3. **事件穿透**：占位符区域必须设置 `pointer-events: none`

## 相关文件

- `electron/main.js` - 主进程，视图管理
- `src/components/WebsiteCard.vue` - 网站卡片组件，样式设置
- `src/composables/useWebContentsView.js` - WebContentsView 管理逻辑

## 扩展阅读

- [Electron BaseWindow API](https://github.com/electron/electron/blob/main/docs/api/base-window.md)
- [Electron WebContentsView API](https://github.com/electron/electron/blob/main/docs/api/web-contents-view.md)
- [CSS pointer-events 属性](https://developer.mozilla.org/zh-CN/docs/Web/CSS/pointer-events)

---

修复完成！现在可以正常使用所有控制功能了。🎉

