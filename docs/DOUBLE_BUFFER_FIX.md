# 双缓冲刷新选择器等待机制修复

## 问题描述

在之前的实现中，双缓冲刷新虽然会调用`applySelector`来应用选择器，但对于跨域iframe，选择器应用是通过Chrome扩展异步执行的，代码没有真正等待选择器应用完成，导致：

1. 缓冲iframe显示时，选择器可能还没有完全应用
2. 用户能看到选择器应用前的完整页面闪现
3. "元素隐藏"的过程会被用户看到

## 根本原因

### 之前的流程（有问题）

```javascript
// 应用选择器（但不等待完成）
await applySelector(bufferIframeRef.value, props.item)

// 立即继续（选择器可能还在应用中）
isBufferReady.value = true
```

对于跨域iframe，`applySelector`内部调用了`applySelectorViaExtension`，但该方法是发送消息后立即返回，没有等待扩展的回调。

## 解决方案

### 1. 修改Chrome扩展（content.js）

让选择器应用函数返回结果，并在完成后通过`postMessage`发送回调：

```javascript
function applyQuanShiJieSelectorInIframe(selector) {
  // ... 应用选择器逻辑 ...
  
  console.log('[全视界 iframe] 选择器已应用，隐藏了', hiddenCount, '个元素');
  return { success: true, hiddenCount: hiddenCount };
}

// 在消息处理中发送回调
if (message.action === 'executeScriptInIframe') {
  const result = applyQuanShiJieSelectorInIframe(message.selector)
  
  // 发送完成回调到父页面
  window.parent.postMessage({
    source: 'quanshijie-extension',
    action: 'selectorApplied',
    requestId: message.requestId,
    success: result.success,
    hiddenCount: result.hiddenCount
  }, '*')
}
```

### 2. 重写applySelectorViaExtension（useIframeSelector.js）

让它返回Promise并等待扩展的回调：

```javascript
const applySelectorViaExtension = (targetIframe, selector) => {
  return new Promise((resolve, reject) => {
    // 生成唯一的请求ID
    const requestId = `selector-${Date.now()}-${Math.random()}`
    
    // 监听扩展的回调
    const handleMessage = (event) => {
      if (event.data && 
          event.data.source === 'quanshijie-extension' && 
          event.data.action === 'selectorApplied' &&
          event.data.requestId === requestId) {
        
        window.removeEventListener('message', handleMessage)
        
        if (event.data.success) {
          console.log('[全视界] 选择器应用成功，隐藏了', event.data.hiddenCount, '个元素')
          resolve({ success: true, hiddenCount: event.data.hiddenCount })
        } else {
          reject(new Error(event.data.error || '选择器应用失败'))
        }
      }
    }
    
    window.addEventListener('message', handleMessage)
    
    // 设置5秒超时
    setTimeout(() => {
      window.removeEventListener('message', handleMessage)
      reject(new Error('等待扩展回调超时'))
    }, 5000)
    
    // 发送消息到iframe
    targetIframe.contentWindow.postMessage({
      source: 'quanshijie',
      action: 'executeScriptInIframe',
      selector: selector,
      requestId: requestId
    }, '*')
  })
}
```

### 3. 更新applySelector方法

让它返回布尔值表示是否成功，并在跨域情况下等待扩展完成：

```javascript
const applySelector = async (targetIframe, item) => {
  // ...
  
  if (!targetIframe.contentDocument) {
    // 跨域iframe，使用Chrome扩展
    console.info('[全视界] 尝试使用Chrome扩展并等待完成...')
    
    try {
      await applySelectorViaExtension(targetIframe, item.targetSelector)
      console.log('[全视界] Chrome扩展应用选择器成功')
      return true  // 返回成功状态
    } catch (error) {
      console.error('[全视界] Chrome扩展应用选择器失败:', error.message)
      return false  // 返回失败状态
    }
  }
  
  // ...
}
```

### 4. 优化双缓冲刷新逻辑（WebsiteCard.vue）

等待选择器真正应用完成后再显示缓冲iframe：

```javascript
if (needSelector) {
  console.log('[全视界] 选择器类型页面，等待应用选择器到缓冲iframe')
  
  // 等待页面DOM准备好
  await new Promise(resolve => setTimeout(resolve, 1000))
  
  try {
    // 应用选择器到缓冲iframe，等待真正完成
    const success = await applySelector(bufferIframeRef.value, props.item)
    
    if (success) {
      console.log('[全视界] 选择器应用成功，等待DOM更新')
      await new Promise(resolve => setTimeout(resolve, 100))
      console.log('[全视界] 选择器应用完成，缓冲准备就绪')
    } else {
      console.warn('[全视界] 选择器应用失败，仍然显示缓冲iframe')
    }
  } catch (error) {
    console.error('[全视界] 选择器应用出错:', error)
  }
}

// 确保选择器已完全应用后才显示
isBufferReady.value = true
```

## 新的完整流程

### 选择器类型页面刷新流程

1. **创建缓冲iframe** - 开始加载新页面
2. **等待加载完成** - iframe触发load事件
3. **等待DOM准备** - 等待1000ms让页面DOM准备好
4. **发送选择器请求** - 向iframe发送消息，包含唯一requestId
5. **扩展应用选择器** - Chrome扩展在iframe中隐藏元素
6. **等待扩展回调** - 等待扩展发送完成消息（最多5秒）
7. **确认选择器完成** - 收到success回调
8. **等待DOM更新** - 等待100ms让DOM完全更新
9. **显示缓冲iframe** - 此时选择器已完全应用
10. **刷新主iframe** - 在后台刷新
11. **移除缓冲iframe** - 500ms后清理

### 控制台日志输出（正常流程）

```
[全视界] 使用双缓冲刷新: 百度
[全视界] 缓冲iframe加载完成
[全视界] 选择器类型页面，等待应用选择器到缓冲iframe
[全视界] 开始应用选择器到指定iframe
[全视界] iframe.contentDocument不可用（跨域iframe）
[全视界] 尝试使用Chrome扩展并等待完成...
[全视界] 向iframe发送消息，请求应用选择器
[全视界 Extension] 收到来自全视界的消息
[全视界 Extension] 应用选择器: div#s-hotsearch-wrapper
[全视界 iframe] 应用选择器: div#s-hotsearch-wrapper
[全视界 iframe] 找到目标元素，开始处理
[全视界 iframe] 选择器已应用，隐藏了 19 个元素
[全视界] 收到扩展回调: {success: true, hiddenCount: 19}
[全视界] 选择器应用成功，隐藏了 19 个元素
[全视界] Chrome扩展应用选择器成功
[全视界] 选择器应用成功，等待DOM更新
[全视界] 选择器应用完成，缓冲准备就绪
[全视界] 刷新主iframe
[全视界] 双缓冲刷新完成
```

## 关键改进

1. ✅ **异步等待机制** - 使用Promise等待扩展回调
2. ✅ **唯一请求ID** - 确保回调对应正确的请求
3. ✅ **超时保护** - 5秒超时避免永久等待
4. ✅ **状态返回** - applySelector返回成功/失败状态
5. ✅ **错误处理** - 完善的try-catch和错误日志

## 测试验证

### 测试步骤

1. 打开浏览器开发者工具（F12）
2. 添加一个跨域网站（如百度）
3. 配置选择器（如：`div#s-hotsearch-wrapper`）
4. 设置自动刷新30秒
5. 观察控制台日志和页面表现

### 预期结果

- ✅ 控制台显示完整的等待流程日志
- ✅ 缓冲iframe显示时已经应用了选择器
- ✅ 用户看不到完整页面闪现
- ✅ 元素隐藏过程对用户不可见
- ✅ 平滑切换，无闪烁

## 时间参数

- **DOM准备等待**: 1000ms - 等待页面DOM加载完成
- **扩展回调超时**: 5000ms - 最多等待5秒
- **DOM更新等待**: 100ms - 选择器应用后等待DOM更新
- **缓冲显示时间**: 50ms - 显示缓冲后的短暂等待
- **缓冲移除时间**: 500ms - 主iframe刷新后的清理时间

## 兼容性

- ✅ **Chrome扩展环境** - 完美支持，真正等待完成
- ✅ **同域iframe** - 直接操作DOM，立即返回
- ✅ **Electron环境** - 通过IPC注入，等待结果
- ⚠️ **无扩展跨域** - 无法应用选择器，但不会阻塞流程

## 注意事项

1. 需要安装全视界 Chrome扩展才能在跨域iframe中应用选择器
2. 超时时间设置为5秒，如果网页加载很慢可能需要调整
3. requestId必须唯一，避免多个请求的回调混淆
4. 监听器必须及时清理，避免内存泄漏

