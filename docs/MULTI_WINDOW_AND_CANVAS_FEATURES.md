# 多开功能和画布视图实现总结

## 概述

本文档记录了 全视界 的两个新功能的实现：
1. **多开功能 (#44)** - 支持同时运行多个 全视界 实例
2. **VueFlow 无边际底板+手写绘制 (#35)** - 使用 VueFlow 实现无边界画布，支持手写绘制

## 需求1：多开功能 (#44)

### 功能描述

支持同时运行多个 全视界 实例，每个实例独立运行互不干扰。在左栏添加新建窗口功能，同时支持切换到另一个窗口。所有数据完全隔离，每个窗口有单独的完整全套数据。

### 实现细节

#### 1. Electron 主进程多窗口支持

**文件**: `electron/main.js`

**主要改动**:
- 添加了窗口管理变量：
  ```javascript
  const windows = new Map() // key: windowId, value: BrowserWindow
  let windowIdCounter = 1
  ```

- 修改了 `createWindow()` 函数以支持创建多个窗口：
  - 每个窗口都有唯一的窗口 ID
  - 每个窗口使用独立的 session partition: `persist:window-${wid}`
  - 窗口标题包含窗口 ID: `全视界 - 窗口 ${wid}`
  - 新窗口会相对于当前窗口偏移显示

- 添加了 IPC 处理器：
  - `create-new-window`: 创建新窗口
  - `get-all-windows`: 获取所有窗口列表
  - `focus-window`: 聚焦到指定窗口
  - `get-window-id`: 获取当前窗口 ID

#### 2. Preload 脚本 API

**文件**: `electron/preload.js`

**主要改动**:
- 添加了窗口管理 API：
  ```javascript
  window: {
    createNew: () => ipcRenderer.invoke('create-new-window'),
    getAll: () => ipcRenderer.invoke('get-all-windows'),
    focus: (windowId) => ipcRenderer.invoke('focus-window', windowId),
    getId: () => ipcRenderer.invoke('get-window-id')
  }
  ```

#### 3. 窗口管理 Composable

**文件**: `src/composables/useWindowManager.js`

**功能**:
- 获取当前窗口 ID
- 提供窗口独立的 localStorage 操作（使用窗口前缀）
- 创建新窗口
- 刷新窗口列表
- 切换到指定窗口

**数据隔离实现**:
```javascript
const getWindowStorageKey = (key) => {
  const wid = currentWindowId.value || 1
  return `window-${wid}-${key}`
}
```

每个窗口的数据都会加上 `window-{windowId}-` 前缀，确保完全隔离。

#### 4. 布局管理器更新

**文件**: `src/composables/useLayoutManager.js`

**主要改动**:
- 集成了 `useWindowManager`
- 修改了 `loadFromStorage()` 和 `saveToStorage()` 使用窗口独立的存储

#### 5. UI 界面更新

**文件**: `src/components/ConfigPanel.vue`

**主要改动**:
- 添加了"窗口管理"区域（仅在 Electron 环境显示）
- "新建窗口"按钮
- 窗口列表（显示所有窗口，可点击切换）
- 当前窗口有特殊标记

**UI 特性**:
- 窗口列表仅在有多个窗口时显示
- 当前活动窗口会高亮显示并标记"当前"
- 点击窗口项可快速切换到对应窗口

### 使用方法

1. **创建新窗口**：
   - 在左侧面板的"窗口管理"区域点击"新建窗口"按钮
   - 新窗口会在当前窗口位置偏移 30px 显示

2. **切换窗口**：
   - 在窗口列表中点击要切换的窗口
   - 对应窗口会被激活并置于最前

3. **数据隔离**：
   - 每个窗口的所有数据（布局、网站配置等）完全独立
   - 关闭窗口不会影响其他窗口的数据

## 需求2：VueFlow 无边际底板+手写绘制 (#35)

### 功能描述

使用 VueFlow 实现无边界画布功能，支持手写绘制功能。用户可以在画布上自由布局网站节点，并进行手写绘制。

### 技术栈

- **@vue-flow/core**: VueFlow 核心库
- **@vue-flow/background**: 背景网格组件
- **@vue-flow/controls**: 控制面板组件
- **@vue-flow/minimap**: 小地图组件
- **perfect-freehand**: 手写绘制路径生成库

### 实现细节

#### 1. CanvasView 组件

**文件**: `src/components/CanvasView.vue`

**主要功能**:

1. **无边界画布**：
   - 使用 VueFlow 实现可拖拽、缩放的无边界画布
   - 支持鼠标滚轮缩放（0.2x - 4x）
   - 支持鼠标拖拽移动视图
   - 背景网格增强视觉效果

2. **网站节点**：
   - 将网站转换为画布节点
   - 节点显示网站标题、URL 和图标
   - 支持拖拽移动节点
   - 自定义节点样式

3. **手写绘制**：
   - 点击"手写绘制"按钮进入绘制模式
   - 使用 perfect-freehand 生成平滑的手写路径
   - 支持自定义颜色和粗细
   - 绘制内容可保存为画布节点
   - 支持清除绘制

4. **工具栏**：
   - 添加网站节点
   - 切换手写绘制模式
   - 颜色选择器
   - 粗细滑块
   - 清除绘制
   - 适应视图

**关键代码**:

```javascript
// 手写绘制使用 perfect-freehand 生成平滑路径
const stroke = getStroke(currentPath.value, {
  size: parseInt(drawingWidth.value),
  thinning: 0.5,
  smoothing: 0.5,
  streamline: 0.5
})

const pathData = getSvgPathFromStroke(stroke)
```

#### 2. 视图切换功能

**文件**: `src/App.vue`

**主要改动**:

1. **添加视图状态**：
   ```javascript
   const currentView = ref('grid') // 'grid' 或 'canvas'
   ```

2. **视图切换按钮**：
   - 位于右上角
   - 两个按钮：网格视图和画布视图
   - 当前视图会高亮显示

3. **条件渲染**：
   ```vue
   <!-- 网格视图 -->
   <GridView v-if="currentView === 'grid'" ... />
   
   <!-- 画布视图 -->
   <CanvasView v-if="currentView === 'canvas'" ... />
   ```

### 使用方法

1. **切换到画布视图**：
   - 点击右上角的画布视图按钮（画笔图标）

2. **添加网站节点**：
   - 点击工具栏的"添加网站"按钮
   - 拖拽节点到合适位置

3. **手写绘制**：
   - 点击"手写绘制"按钮进入绘制模式
   - 选择颜色和粗细
   - 在画布上拖拽鼠标进行绘制
   - 点击"清除绘制"可清除当前绘制内容
   - 退出绘制模式时，绘制内容会保存为节点

4. **画布操作**：
   - 鼠标滚轮缩放画布
   - 按住鼠标中键/右键拖拽移动视图
   - 点击"适应视图"自动调整视图以显示所有节点

5. **切换回网格视图**：
   - 点击右上角的网格视图按钮（网格图标）

## 文件结构

### 新增文件

```
src/
├── components/
│   └── CanvasView.vue           # 画布视图组件
└── composables/
    └── useWindowManager.js      # 窗口管理 composable
```

### 修改文件

```
electron/
├── main.js                      # 添加多窗口支持
└── preload.js                   # 添加窗口管理 API

src/
├── App.vue                      # 添加视图切换
├── components/
│   └── ConfigPanel.vue          # 添加窗口管理 UI
└── composables/
    └── useLayoutManager.js      # 集成窗口数据隔离
```

## 依赖包

### 新增依赖

```json
{
  "@vue-flow/core": "^1.x",
  "@vue-flow/background": "^1.x",
  "@vue-flow/controls": "^1.x",
  "@vue-flow/minimap": "^1.x",
  "perfect-freehand": "^1.x"
}
```

## 测试建议

### 多开功能测试

1. **基本功能**：
   - [ ] 创建多个窗口
   - [ ] 在不同窗口之间切换
   - [ ] 每个窗口独立显示数据

2. **数据隔离**：
   - [ ] 在窗口1创建布局，检查窗口2是否受影响
   - [ ] 在窗口1添加网站，检查窗口2是否受影响
   - [ ] 关闭窗口1，重新打开，检查数据是否保留

3. **边界情况**：
   - [ ] 创建大量窗口（10+）
   - [ ] 快速切换窗口
   - [ ] 关闭主窗口，检查其他窗口是否正常

### 画布视图测试

1. **基本功能**：
   - [ ] 切换到画布视图
   - [ ] 添加网站节点
   - [ ] 拖拽移动节点
   - [ ] 缩放画布

2. **手写绘制**：
   - [ ] 进入绘制模式
   - [ ] 绘制路径
   - [ ] 更改颜色和粗细
   - [ ] 清除绘制
   - [ ] 保存绘制为节点

3. **视图切换**：
   - [ ] 在网格视图和画布视图之间切换
   - [ ] 检查数据是否保留

## 已知限制

1. **多开功能**：
   - 窗口数据隔离基于 localStorage，不支持跨设备同步
   - 窗口标题暂时只显示窗口 ID，可以考虑支持自定义名称

2. **画布视图**：
   - 画布节点和网格视图网站暂时独立管理
   - 手写绘制的内容保存为静态节点，不支持后续编辑
   - 绘制模式下无法操作其他节点

## 未来改进方向

1. **多开功能**：
   - 支持窗口重命名
   - 支持窗口间数据共享/复制
   - 支持保存窗口布局位置

2. **画布视图**：
   - 支持更多节点类型（图片、文本等）
   - 支持节点连线
   - 支持绘制内容编辑
   - 支持撤销/重做功能
   - 集成更强大的绘图工具（如 Excalidraw）

## 结语

这两个功能的实现为 全视界 带来了更强大的多实例管理能力和更灵活的视觉化布局方式。多开功能让用户可以同时管理多个完全独立的工作空间，而画布视图则提供了更自由的布局方式和手写绘制能力，满足了不同用户的使用需求。

