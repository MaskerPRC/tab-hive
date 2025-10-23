# Gridstack.js 集成方案

## 为什么选择 Gridstack.js

Gridstack.js 是一个成熟的网格布局库，原生支持：

1. **自动碰撞推开** - 调整元素大小时自动推开其他元素
2. **网格对齐** - 所有元素自动对齐到网格点
3. **拖拽和调整大小** - 原生支持，无需自己实现
4. **响应式布局** - 自动适应容器大小
5. **Vue 3 支持** - 官方支持 Vue 集成

## 关键特性

### 1. 碰撞处理模式
- `float: false` - 元素会自动推开，保持紧凑布局（我们需要的）
- `float: true` - 元素可以自由浮动

### 2. 网格对齐
- 所有元素自动吸附到网格点
- 可配置网格大小和边距

### 3. 动态调整
- 调整大小时自动推开其他元素
- 支持最小/最大尺寸限制

## 安装

```bash
npm install gridstack
```

## 基本集成示例

```vue
<template>
  <div class="grid-stack">
    <div v-for="item in websites" 
         :key="item.id"
         class="grid-stack-item"
         :gs-id="item.id"
         :gs-x="item.x"
         :gs-y="item.y"
         :gs-w="item.width"
         :gs-h="item.height">
      <div class="grid-stack-item-content">
        <iframe :src="item.url"></iframe>
      </div>
    </div>
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import { GridStack } from 'gridstack'
import 'gridstack/dist/gridstack.min.css'

const grid = ref(null)

onMounted(() => {
  grid.value = GridStack.init({
    float: false,          // 关键：自动推开碰撞的元素
    cellHeight: 100,       // 单元格高度
    margin: 20,            // 元素间距
    minRow: 1,             // 最小行数
    column: 12,            // 列数
    animate: true,         // 动画效果
    disableOneColumnMode: true,
    resizable: {
      handles: 'e, se, s'  // 可调整大小的方向
    }
  })

  // 监听变化事件
  grid.value.on('change', (event, items) => {
    console.log('布局改变', items)
    // 保存新的位置和大小
  })
})
</script>
```

## 优势对比

### 自定义算法 vs Gridstack.js

| 特性 | 自定义算法 | Gridstack.js |
|------|-----------|--------------|
| 碰撞检测 | 需要自己实现 | ✅ 原生支持 |
| 推开算法 | 复杂，易出bug | ✅ 成熟稳定 |
| 网格对齐 | 需要手动处理 | ✅ 自动处理 |
| 动画效果 | 需要自己写 | ✅ 内置动画 |
| 边界情况 | 容易遗漏 | ✅ 全面考虑 |
| 性能优化 | 需要优化 | ✅ 已优化 |
| 维护成本 | 高 | 低 |

## 集成步骤

### 1. 安装依赖
```bash
npm install gridstack
```

### 2. 替换现有的网格布局逻辑
- 移除自定义的碰撞检测算法
- 使用 Gridstack 的 API

### 3. 适配现有数据结构
- 将现有的位置和大小数据转换为 Gridstack 格式
- Gridstack 使用网格单位（0-12列），需要转换像素值

### 4. 保持现有功能
- iframe 嵌入
- 全屏模式
- 编辑和删除
- 选择器功能

## 是否继续集成？

如果您同意，我可以：
1. 安装 Gridstack.js
2. 重构 GridView.vue 组件
3. 保留所有现有功能
4. 实现完美的碰撞推开效果

这样可以避免自己实现复杂的推开算法，使用业界成熟的解决方案。

