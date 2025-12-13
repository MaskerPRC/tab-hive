# 画布控制功能更新

## 更新日期
2025-12-13

## 更新内容

### 1. 适应屏幕功能调整

**原有逻辑：**
- 点击"适应屏幕"按钮会重新排列所有窗口
- 将窗口按网格方式整齐排列，重置位置和大小

**新逻辑：**
- 点击"适应屏幕"按钮现在会调整画板的缩放比例
- 计算所有窗口的边界框
- 自动计算合适的缩放比例，使所有内容适应屏幕
- 居中显示所有内容
- 不会改变窗口的实际位置和大小

**实现位置：**
- `src/components/GridView.vue` - `handleAutoArrange()` 方法

**实现细节：**
```javascript
// 计算所有网站的边界框
let minX = Infinity, minY = Infinity
let maxX = -Infinity, maxY = -Infinity

// 遍历所有窗口找到边界
allWebsites.value.forEach((site, index) => {
  const pos = itemPositions.value[index]
  const size = itemSizes.value[index]
  
  if (pos && size) {
    minX = Math.min(minX, pos.x)
    minY = Math.min(minY, pos.y)
    maxX = Math.max(maxX, pos.x + size.width)
    maxY = Math.max(maxY, pos.y + size.height)
  }
})

// 计算缩放比例
const scaleX = containerWidth / contentWidth
const scaleY = containerHeight / contentHeight
const newZoom = Math.min(scaleX, scaleY, 1) // 不放大，只缩小

// 应用缩放和居中偏移
canvasTransform.value = {
  x: offsetX,
  y: offsetY,
  zoom: newZoom
}
```

### 2. 新增重新排列功能

**功能描述：**
- 添加了新的"重新排列"按钮
- 点击后弹出配置对话框
- 可以配置：
  - 列数（默认3列）
  - 窗口宽度（默认400px）
  - 窗口高度（默认300px）
  - 窗口放大倍数（默认2.0，即放大一倍）

**新增文件：**
- `src/components/RearrangeDialog.vue` - 重排配置对话框组件

**对话框功能：**
1. **列数设置**：控制每行显示多少个窗口
2. **窗口尺寸**：设置基础的窗口宽度和高度
3. **放大倍数**：在基础尺寸上再放大的倍数
4. **实时预览**：显示最终窗口大小和布局信息
5. **恢复默认**：一键恢复到默认配置

**实现位置：**
- `src/components/GridView.vue` - `handleRearrangeConfirm()` 方法
- `src/components/CanvasControls.vue` - 添加重排按钮

**实现细节：**
```javascript
const handleRearrangeConfirm = (config) => {
  const { cols, width, height, scale } = config
  const spacing = 20
  
  // 计算所有网站的新位置和大小
  allWebsites.value.forEach((item, index) => {
    const row = Math.floor(index / cols)
    const col = index % cols
    
    const x = snapToGrid(col * (width + spacing) + spacing)
    const y = snapToGrid(row * (height + spacing) + spacing)
    
    updates[index] = {
      position: { x, y },
      size: { 
        width: Math.round(width * scale), 
        height: Math.round(height * scale) 
      }
    }
  })
  
  // 应用更新...
}
```

### 3. 用户界面更新

**按钮布局（从上到下）：**
1. 添加窗口（主按钮，蓝色）
2. 适应屏幕（调整画板缩放）
3. **重新排列（新增，按网格重排）**
4. 放大
5. 缩小
6. 绘制模式
7. ...其他按钮

**图标设计：**
- 适应屏幕：四角框架图标
- 重新排列：2x2网格图标

### 4. 国际化文本

**新增翻译键：**
```javascript
canvasControls: {
  fitToScreen: '适应屏幕',
  rearrange: '重新排列',
  // ...
},

rearrangeDialog: {
  title: '重新排列窗口',
  columns: '列数',
  itemWidth: '窗口宽度 (px)',
  itemHeight: '窗口高度 (px)',
  scale: '窗口放大倍数',
  scaleHint: '1.0 为原始大小，2.0 为放大一倍',
  preview: '预览',
  finalSize: '最终窗口大小',
  layout: '布局',
  reset: '恢复默认'
}
```

## 使用场景

### 适应屏幕
- 当窗口分散在画布各处，需要快速查看全局时
- 当画布缩放比例不合适，需要自动调整时
- 不想改变窗口布局，只想调整视图时

### 重新排列
- 当窗口布局混乱，需要重新整理时
- 需要统一调整所有窗口大小时
- 需要按特定列数重新排列时
- 需要放大所有窗口以便查看更多内容时

## 技术要点

1. **画布变换**：使用 CSS transform 实现缩放和平移
2. **边界计算**：遍历所有窗口计算整体边界框
3. **响应式布局**：根据容器大小自动计算最佳缩放比例
4. **网格吸附**：重排时自动吸附到20px网格
5. **索引映射**：处理过滤后的索引与原始索引的映射关系

## 测试建议

1. **适应屏幕测试**：
   - 添加多个窗口并随意拖动到不同位置
   - 点击"适应屏幕"按钮
   - 验证所有窗口是否都可见且居中显示
   - 验证窗口位置和大小没有改变

2. **重新排列测试**：
   - 点击"重新排列"按钮
   - 尝试不同的列数（1-10）
   - 尝试不同的窗口尺寸
   - 尝试不同的放大倍数（0.5-3.0）
   - 验证窗口是否按配置重新排列
   - 验证窗口大小是否正确（width * scale）

3. **边界情况测试**：
   - 只有一个窗口时
   - 窗口数量很多时（10+）
   - 窗口大小差异很大时
   - 画布已经缩放时再使用这些功能

## 文件修改清单

### 新增文件
- `src/components/RearrangeDialog.vue` - 重排配置对话框

### 修改文件
- `src/components/GridView.vue` - 主要逻辑实现
- `src/components/CanvasControls.vue` - 添加重排按钮
- `src/i18n/locales/zh.js` - 国际化文本

## 后续优化建议

1. **保存配置**：将重排配置保存到 localStorage
2. **预设方案**：提供几种预设的排列方案（如：2列、3列、4列）
3. **动画效果**：添加平滑的过渡动画
4. **撤销功能**：支持撤销重排操作
5. **智能排列**：根据窗口内容类型自动选择合适的大小

