# 双缓冲刷新功能

## 功能概述

为了改善定时刷新时的用户体验，特别是在选择器类型的蜂巢中，实现了双缓冲刷新机制。该机制避免了用户看到页面加载过程和选择器应用过程中的"一卡一卡"的现象。

## 问题描述

在之前的实现中，定时刷新时会直接刷新iframe，导致：
1. 用户能看到页面加载的过程
2. 对于使用选择器的网站，用户能看到选择器应用前的完整页面
3. 清理选择器兄弟元素的过程会显示出来
4. 整体体验"一卡一卡的"，不够流畅

## 解决方案

采用双缓冲技术：
1. 在后台创建一个隐藏的缓冲iframe
2. 等待缓冲iframe完全加载
3. 如果有选择器，等待选择器应用完成
4. 将缓冲iframe显示在前面，同时在后台刷新主iframe
5. 短暂延迟后移除缓冲iframe

## 技术实现

### 1. WebsiteCard组件修改

#### 添加缓冲iframe
```vue
<!-- 主iframe -->
<iframe
  :ref="setIframeRef"
  :data-iframe-id="`iframe-${item.id}`"
  :src="websiteUrl"
  ...
></iframe>

<!-- 后台缓冲iframe（双缓冲机制） -->
<iframe
  v-if="isBufferLoading"
  :ref="setBufferIframeRef"
  :data-iframe-id="`iframe-buffer-${item.id}`"
  :src="bufferUrl"
  class="website-iframe buffer-iframe"
  :class="{ 'buffer-ready': isBufferReady }"
  ...
></iframe>
```

#### 双缓冲状态管理
```javascript
const isBufferLoading = ref(false)  // 缓冲iframe是否正在加载
const isBufferReady = ref(false)    // 缓冲iframe是否准备完成
const bufferUrl = ref('')           // 缓冲iframe的URL
const bufferIframeRef = ref(null)   // 缓冲iframe的引用
```

#### 双缓冲刷新方法
```javascript
const refreshWithDoubleBuffer = () => {
  // 1. 创建缓冲iframe并加载
  bufferUrl.value = websiteUrl.value + '?_t=' + Date.now()
  isBufferLoading.value = true
  
  // 2. 监听加载完成
  bufferIframeRef.value.addEventListener('load', async () => {
    // 3. 应用选择器（如果有）
    if (!isFullscreen && item.targetSelector) {
      await new Promise(resolve => setTimeout(resolve, 1000))
      await applySelector(bufferIframeRef.value, item)
      await new Promise(resolve => setTimeout(resolve, 200))
    }
    
    // 4. 显示缓冲iframe
    isBufferReady.value = true
    
    // 5. 刷新主iframe（在后台）
    emit('refresh', index)
    
    // 6. 移除缓冲iframe
    setTimeout(() => {
      isBufferLoading.value = false
      isBufferReady.value = false
    }, 500)
  })
}
```

#### CSS样式控制
```css
/* 缓冲iframe默认隐藏 */
.buffer-iframe {
  position: absolute;
  visibility: hidden;
  z-index: -1;
  opacity: 0;
  transition: opacity 0.2s ease-in-out;
}

/* 准备完成后显示在前面 */
.buffer-iframe.buffer-ready {
  visibility: visible;
  z-index: 10;
  opacity: 1;
}
```

### 2. useIframeSelector修改

添加通用选择器应用方法，可以应用到任何iframe：

```javascript
const applySelector = async (targetIframe, item) => {
  // 支持Electron和浏览器环境
  // 隐藏兄弟元素，注入样式
  // ...
}
```

### 3. GridView修改

更新刷新逻辑，添加时间戳参数避免缓存：

```javascript
const handleRefreshWebsite = (index) => {
  const iframe = document.querySelector(`.grid-item:nth-child(${index + 1}) iframe:not(.buffer-iframe)`)
  if (iframe) {
    const currentSrc = iframe.src
    const separator = currentSrc.includes('?') ? '&' : '?'
    const urlWithoutTimestamp = currentSrc.replace(/[?&]_t=\d+/, '')
    iframe.src = urlWithoutTimestamp + separator + '_t=' + Date.now()
  }
}
```

## 刷新流程

### 自动刷新流程
1. `useAutoRefresh` 定时器触发
2. 调用 `refreshWithDoubleBuffer()`
3. 创建缓冲iframe并加载
4. 等待加载完成
5. 应用选择器（如果需要）
6. 显示缓冲iframe
7. 刷新主iframe
8. 移除缓冲iframe

### 手动刷新流程
1. 用户点击刷新按钮
2. `FloatingActions` emit('refresh')
3. `WebsiteCard` 调用 `handleManualRefresh()`
4. 执行与自动刷新相同的双缓冲流程

## 时间控制

- **等待页面加载**: 选择器应用前等待1000ms
- **等待选择器应用**: 选择器应用后等待200ms确保完全生效
- **缓冲显示时间**: 缓冲iframe显示50ms后开始刷新主iframe
- **缓冲移除时间**: 主iframe刷新后500ms移除缓冲iframe

这些时间参数可以根据实际使用情况进行调整。

## 优势

1. **平滑的用户体验**: 用户看到的是从一个完整页面到另一个完整页面的切换
2. **隐藏加载过程**: 所有的加载和选择器应用都在后台完成
3. **支持选择器**: 特别适合选择器类型的蜂巢，避免了选择器应用过程的闪烁
4. **兼容性好**: 支持Electron和浏览器环境
5. **自动和手动刷新统一**: 两种刷新方式都使用相同的双缓冲机制

## 注意事项

1. 双缓冲会暂时增加内存占用（两个iframe）
2. 需要等待缓冲iframe完全加载，可能略微延长刷新时间
3. 对于快速连续刷新的情况，需要确保前一个缓冲流程完成

## 未来改进方向

1. 添加刷新进度指示器
2. 支持配置时间参数
3. 优化内存使用
4. 支持预加载下一次刷新

