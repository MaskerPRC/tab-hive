# 元素选择器工作流程

## 改进后的交互流程

参考 Automa 的设计，我们实现了"选择 → 调整 → 确认"的三步工作流程。

### 1️⃣ 选择元素

**操作方式：**
- 🖱️ 移动鼠标悬停在元素上
- 🖱️ 点击鼠标选择元素
- ⌨️ 或按空格键选择

**视觉反馈：**
- 悬停元素：黄色高亮 `rgba(251, 191, 36, 0.15)`
- 选中元素：蓝色高亮 `rgba(37, 99, 235, 0.15)`

**状态变化：**
```javascript
// 点击选择后
stopInteractiveSelection()  // 停止iframe内的鼠标交互
// 保持工具栏显示
// 显示确认按钮
// 提示文字变为"可继续调整选择"
```

### 2️⃣ 调整选择（可选）

选择元素后，工具栏**保持显示**，用户可以：

#### a) 父子元素导航
```
当前选择: <button class="btn">Click</button>

点击 ⬆️ 父元素 → 选择 <div class="content">
点击 ⬆️ 父元素 → 选择 <div class="container">
点击 ⬇️ 子元素 → 选择第一个子元素
```

#### b) 手动编辑选择器
```javascript
// 在输入框中直接编辑
#element-id → .custom-selector
button.btn → button[data-action="submit"]
```

#### c) 配置选择器规则
- ✓ 包含元素 ID
- ✓ 包含 Class
- ✓ 包含标签名
- ✓ 包含属性

#### d) 查看元素详细信息
```javascript
{
  tagName: 'button',
  id: 'submit-btn',
  className: 'btn btn-primary',
  width: 120,
  height: 40,
  textContent: '提交'
}
```

### 3️⃣ 确认或取消

#### 确认选择
点击 **"✓ 确认选择"** 按钮（绿色渐变）：
```javascript
confirmSelection() {
  // 1. 发送选择结果给父组件
  emit('select', { selector, elementInfo })
  
  // 2. 清理iframe内的选择器
  cleanup()
  
  // 3. 关闭工具栏
  emit('cancel')
}
```

#### 取消选择
点击 **"✕ 取消"** 按钮或按 `ESC` 键：
```javascript
cancel() {
  // 1. 清理iframe内的选择器
  cleanup()
  
  // 2. 关闭工具栏
  emit('cancel')
  
  // 3. 不保存任何选择
}
```

## 完整流程图

```
用户启动选择器
    ↓
[显示工具栏 + 高亮覆盖层]
    ↓
移动鼠标 → 黄色高亮悬停元素
    ↓
点击/空格 → 蓝色高亮选中元素
    ↓
[停止iframe交互 + 保持工具栏]
    ↓
    ├─→ 使用父子导航调整
    ├─→ 手动编辑选择器
    ├─→ 配置选择器规则
    └─→ 查看元素信息
    ↓
点击"确认选择"
    ↓
[保存结果 + 关闭工具栏]
```

## UI 状态说明

### 未选择状态
```vue
<div class="toolbar-hint">
  点击元素选择 | 按 <kbd>空格</kbd> 选择 | 按 <kbd>ESC</kbd> 取消
</div>
```

### 已选择状态
```vue
<!-- 显示确认按钮 -->
<button class="btn-confirm" @click="confirmSelection">
  ✓ 确认选择
</button>

<div class="toolbar-hint">
  可继续调整选择 | 点击 <strong>确认选择</strong> 保存 | 按 <kbd>ESC</kbd> 取消
</div>
```

## 关键函数

### `stopInteractiveSelection()`
停止iframe内的交互式选择，但保持工具栏显示：

```javascript
const stopInteractiveSelection = () => {
  if (isElectron.value) {
    // Electron: 发送IPC消息
    props.targetIframe.send('stop-element-selector', {})
  } else {
    // Browser: 发送postMessage
    props.targetIframe.contentWindow.postMessage({
      source: 'quanshijie',
      action: 'stopElementSelector'
    }, '*')
  }
}
```

### `confirmSelection()`
确认选择并保存结果：

```javascript
const confirmSelection = () => {
  if (!hoveredSelector.value) {
    console.warn('没有选择器可确认')
    return
  }
  
  // 发送结果
  emit('select', { 
    selector: hoveredSelector.value,
    elementInfo: currentElementInfo.value 
  })
  
  // 清理并关闭
  cleanup()
  emit('cancel')
}
```

### `cancel()`
取消选择，不保存任何内容：

```javascript
const cancel = () => {
  cleanup()  // 清理iframe内的选择器
  emit('cancel')  // 通知父组件关闭
}
```

## 样式设计

### 确认按钮
```css
.btn-confirm {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  color: white;
  box-shadow: 0 2px 8px rgba(16, 185, 129, 0.2);
}

.btn-confirm:hover {
  background: linear-gradient(135deg, #059669 0%, #047857 100%);
  box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
  transform: translateY(-1px);
}
```

### 工具栏按钮状态
```css
/* 绿色确认按钮（在头部） */
.toolbar-btn-confirm {
  background: #10b981;
  color: white;
}

/* 普通按钮 */
.toolbar-btn {
  background: transparent;
  color: #6b7280;
}

.toolbar-btn:hover {
  background: #f3f4f6;
  color: #111827;
}
```

## 用户体验改进

### ✅ 改进点

1. **不会意外关闭** - 选择元素后工具栏保持显示
2. **可以调整** - 通过父子导航精确定位元素
3. **可以查看** - 实时显示元素的详细信息
4. **可以编辑** - 手动修改生成的选择器
5. **明确的操作** - "确认选择"按钮清晰表达意图
6. **视觉反馈** - 不同颜色区分悬停和选中状态

### 🎯 与 Automa 对齐

| 特性 | Automa | 全视界 | 状态 |
|-----|--------|----------|------|
| 选择后不关闭 | ✓ | ✓ | ✅ |
| 父子导航 | ✓ | ✓ | ✅ |
| 手动编辑 | ✓ | ✓ | ✅ |
| 确认按钮 | ✓ | ✓ | ✅ |
| 元素信息 | ✓ | ✓ | ✅ |
| 选择器配置 | ✓ | ✓ | ✅ |

## 实际使用示例

### 场景：选择登录按钮

```
1. 用户点击"选择元素"
   → 工具栏出现，提示"点击元素选择"

2. 移动鼠标到登录按钮上
   → 按钮显示黄色高亮
   → 工具栏显示: button.login-btn

3. 点击按钮
   → 按钮变为蓝色高亮
   → 停止交互（不再跟随鼠标）
   → 显示"确认选择"按钮
   → 显示元素信息：width: 120, height: 40

4. 用户发现选择器太具体，点击"父元素"
   → 选择器变为: div.login-form > button
   → 高亮框移到新元素上

5. 用户满意，点击"确认选择"
   → 保存选择器: div.login-form > button
   → 工具栏关闭
   → 完成！
```

## 注意事项

1. **空格键** - 只在未暂停状态下生效
2. **ESC键** - 在任何状态下都会取消选择
3. **确认按钮** - 只在有选择器时显示
4. **父子导航** - 只在选择元素后可用
5. **手动编辑** - 输入时会暂停选择器交互

---

**更新日期**: 2024-10-29  
**版本**: 2.0.0

