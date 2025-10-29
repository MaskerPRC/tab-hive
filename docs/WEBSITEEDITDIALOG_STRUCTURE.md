# WebsiteEditDialog 组件结构

## 📁 文件组织结构

```
src/
├── components/
│   ├── WebsiteEditDialog.vue (主组件 - 295行) ⭐
│   │
│   └── WebsiteEditDialog/
│       ├── WebsiteBasicInfo.vue         (114行) 🔤 网站名称和地址
│       ├── DeviceTypeSelector.vue       (108行) 📱 设备类型选择
│       ├── TargetSelectorList.vue       (182行) 🎯 CSS选择器管理
│       ├── AudioVisualSettings.vue      (153行) 🔊 音频和视觉设置
│       ├── SessionInstanceSelector.vue  (150行) 🍪 Cookie共享实例
│       ├── PaddingConfig.vue            (74行)  📏 内边距配置
│       └── AutoRefreshConfig.vue        (220行) 🔄 自动刷新间隔
│
└── composables/
    ├── useRefreshInterval.js  (81行)  ⏱️  时间单位转换逻辑
    ├── useOverlayClick.js     (38行)  🖱️  弹窗遮罩点击处理
    └── useWebsiteForm.js      (109行) 📝 表单数据管理和验证
```

## 🔄 数据流转关系

```
┌─────────────────────────────────────────────────────────────┐
│                  WebsiteEditDialog.vue                      │
│                     (主容器组件)                             │
│                                                              │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  Composables                                        │   │
│  │  ├── useWebsiteForm (表单数据)                      │   │
│  │  ├── useSessionManager (Session管理)                │   │
│  │  └── useOverlayClick (弹窗交互)                     │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                              │
│  ┌────────────────┐  ┌────────────────┐                    │
│  │ WebsiteBasic   │  │ DeviceType     │  ← 第一行          │
│  │ Info           │  │ Selector       │                     │
│  └────────────────┘  └────────────────┘                    │
│                                                              │
│  ┌────────────────┐  ┌────────────────┐  ┌─────────────┐  │
│  │ DeviceType     │  │ TargetSelector │  │ AudioVisual │  │
│  │ Selector       │  │ List           │  │ Settings    │  │← 第二行
│  └────────────────┘  └────────────────┘  └─────────────┘  │
│                                                              │
│  ┌────────────────┐  ┌────────────────┐                    │
│  │ SessionInstance│  │ PaddingConfig  │  ← 第三行          │
│  │ Selector       │  │                │                     │
│  └────────────────┘  └────────────────┘                    │
│                                                              │
│  ┌──────────────────────────────────────┐                  │
│  │  AutoRefreshConfig                   │  ← 第四行        │
│  └──────────────────────────────────────┘                  │
│                                                              │
│  [确定] [取消]                                              │
└─────────────────────────────────────────────────────────────┘
```

## 📊 组件职责分配

### 主组件 (WebsiteEditDialog.vue)
- ✅ 整合所有子组件
- ✅ 管理弹窗显示状态
- ✅ 协调数据流转
- ✅ 处理表单提交
- ✅ 管理Session实例创建

### 子组件

| 组件 | 职责 | Props | Events |
|------|------|-------|--------|
| **WebsiteBasicInfo** | 网站基本信息输入 | `title`, `url`, `autoFocus` | `update:title`, `update:url`, `enter` |
| **DeviceTypeSelector** | 设备类型选择 | `modelValue` | `update:modelValue` |
| **TargetSelectorList** | CSS选择器列表管理 | `modelValue` (Array) | `update:modelValue`, `enter` |
| **AudioVisualSettings** | 音频和视觉设置 | `muted`, `darkMode` | `update:muted`, `update:darkMode` |
| **SessionInstanceSelector** | Session实例选择 | `modelValue`, `sessionInstances` | `update:modelValue`, `create-instance`, `manage-instances` |
| **PaddingConfig** | 内边距配置 | `modelValue` (Number) | `update:modelValue`, `enter` |
| **AutoRefreshConfig** | 自动刷新配置 | `modelValue` (Number) | `update:modelValue`, `enter` |

### Composables

| Composable | 职责 | 返回值 |
|------------|------|--------|
| **useRefreshInterval** | 时间单位转换 | `presets`, `customValue`, `timeUnit`, `convertSecondsToUnit`, `convertToSeconds`, `isPresetActive` |
| **useOverlayClick** | 弹窗遮罩点击处理 | `handleOverlayMouseDown`, `handleOverlayClick` |
| **useWebsiteForm** | 表单数据管理和验证 | `localWebsite`, `handleConfirm` |

## 🎨 样式设计原则

1. **独立性**: 每个子组件有自己的scoped样式
2. **一致性**: 共享相同的CSS变量 (`--primary-color`, `--primary-hover`)
3. **响应式**: 支持移动端布局 (@media queries)
4. **动画**: 统一的过渡效果和hover状态

## 🔗 组件通信模式

### 1. v-model 双向绑定
```vue
<DeviceTypeSelector v-model="localWebsite.deviceType" />
```

### 2. 多个 v-model
```vue
<WebsiteBasicInfo
  v-model:title="localWebsite.title"
  v-model:url="localWebsite.url"
/>
```

### 3. 自定义事件
```vue
<SessionInstanceSelector
  @create-instance="handleCreateNewInstance"
  @manage-instances="handleOpenSessionManager"
/>
```

## ✨ 设计亮点

### 1. 组件化粒度恰当
- 每个子组件代表一个独立的配置区域
- 子组件大小适中 (74-220行)
- 易于理解和维护

### 2. 逻辑复用最大化
- 时间转换逻辑提取到 composable
- 弹窗交互逻辑可在其他弹窗复用
- 表单验证逻辑集中管理

### 3. 向后兼容
- 支持旧的 `targetSelector` 字段
- 自动转换为新的 `targetSelectors` 数组
- 确保平滑升级

### 4. 用户体验优化
- 自动聚焦第一个输入框
- 支持 Enter 键提交
- 预设快捷选择
- 实时输入验证

## 📈 性能优化

1. **按需导入**: 每个子组件独立导入
2. **Scoped样式**: 避免样式污染
3. **计算属性**: 减少不必要的计算
4. **事件处理优化**: 防抖和节流

## 🧪 测试建议

### 单元测试
```javascript
// WebsiteBasicInfo.vue
- 测试 v-model 绑定
- 测试自动聚焦
- 测试 Enter 键事件

// useRefreshInterval.js
- 测试秒转换为合适的单位
- 测试单位转换为秒
- 测试预设值判断
```

### 集成测试
```javascript
// WebsiteEditDialog.vue
- 测试表单提交流程
- 测试数据验证
- 测试弹窗交互
- 测试Session实例创建
```

---

**创建日期**: 2025-10-29  
**版本**: 0.5.5

