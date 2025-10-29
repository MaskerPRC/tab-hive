# 更新通知行为规则

## 概述

本文档详细说明了 Tab Hive 的更新通知弹窗和左侧栏更新按钮的显示逻辑。

## 核心原则

1. **左侧栏按钮**: 只要有新版本，就**始终显示**
2. **弹窗通知**: 根据用户操作决定是否显示

## 详细规则

### 1. 左侧栏更新按钮

#### 显示条件
- ✅ 检测到有新版本
- ✅ 无论用户做了什么操作，按钮都会显示

#### 隐藏条件
- ❌ 没有新版本（当前版本已是最新）

#### 示例
```
当前版本: 0.0.1
最新版本: 0.5.2
→ 左侧栏显示"发现新版本"按钮（橙色渐变）
```

### 2. 更新通知弹窗

#### 显示时机

**首次检测到新版本**
- ✅ 显示弹窗
- ✅ 同时显示左侧栏按钮

**后续检测（取决于用户上次操作）**

| 用户操作 | 下次检测时弹窗 | 下次检测时左侧栏按钮 |
|---------|--------------|------------------|
| 点击 "稍后提醒" | ❌ 不弹窗 | ✅ 显示 |
| 点击 "关闭"（X按钮） | ✅ 弹窗 | ✅ 显示 |
| 点击 "立即更新" | ✅ 弹窗 | ✅ 显示 |
| 下载中 | ✅ 弹窗 | ✅ 显示 |
| 下载完成但未安装 | ✅ 弹窗 | ✅ 显示 |
| 下载失败 | ✅ 弹窗 | ✅ 显示 |

## 用户场景

### 场景1: 用户想稍后更新

```
1. 检测到新版本 → 弹窗 + 左侧栏按钮
2. 用户点击"稍后提醒" → 弹窗关闭，左侧栏按钮保留
3. 下次检测（24小时后）→ 不弹窗，左侧栏按钮继续显示
4. 用户想更新时，点击左侧栏按钮 → 弹窗打开
```

### 场景2: 用户临时关闭弹窗

```
1. 检测到新版本 → 弹窗 + 左侧栏按钮
2. 用户点击"关闭"（X按钮）→ 弹窗关闭，左侧栏按钮保留
3. 下次检测（24小时后）→ 弹窗再次出现 + 左侧栏按钮
4. 用户可以选择：立即更新 / 稍后提醒 / 再次关闭
```

### 场景3: 用户开始下载但未完成

```
1. 检测到新版本 → 弹窗 + 左侧栏按钮
2. 用户点击"立即更新" → 开始下载
3. 用户关闭弹窗或下载失败
4. 下次检测（24小时后）→ 弹窗再次出现 + 左侧栏按钮
5. 用户可以重新下载
```

### 场景4: 用户从左侧栏打开更新

```
1. 用户之前点击了"稍后提醒"
2. 左侧栏显示更新按钮
3. 用户点击左侧栏的更新按钮 → 弹窗打开
4. 弹窗关闭后，左侧栏按钮继续显示
5. 用户随时可以再次点击左侧栏按钮查看更新
```

## 状态管理

### localStorage 存储

```javascript
// 键名
const IGNORED_VERSION_KEY = 'tab-hive-ignored-update-version'

// 存储值
// 只有用户点击"稍后提醒"时才会设置
localStorage.setItem(IGNORED_VERSION_KEY, 'v0.5.2')

// 清除
// 用户手动从左侧栏打开时不会清除（因为按钮始终显示）
```

### 状态变量

```javascript
// 是否有新版本可用
updateAvailable: boolean

// 是否显示弹窗通知
showUpdateNotification: boolean
// true: 显示弹窗
// false: 隐藏弹窗

// 是否显示左侧栏按钮
showUpdateButton: boolean
// true: 显示按钮（只要有新版本就为 true）
// false: 隐藏按钮（没有新版本）
```

## 代码逻辑

### 检测到新版本时

```javascript
if (hasNewVersion) {
  updateAvailable.value = true
  
  // 关键：左侧栏按钮始终显示
  showUpdateButton.value = true
  
  // 检查是否应该显示弹窗
  if (shouldShowNotification(latestVersion)) {
    // 没有"稍后提醒"记录 → 显示弹窗
    showUpdateNotification.value = true
  } else {
    // 有"稍后提醒"记录 → 不显示弹窗
    showUpdateNotification.value = false
  }
}
```

### 用户点击"稍后提醒"

```javascript
function ignoreUpdate() {
  // 记录忽略状态
  localStorage.setItem(IGNORED_VERSION_KEY, latestVersion)
  
  // 关闭弹窗
  showUpdateNotification.value = false
  
  // 左侧栏按钮继续显示（不修改 showUpdateButton）
}
```

### 用户点击"关闭"

```javascript
function closeNotification() {
  // 仅关闭弹窗，不记录忽略状态
  showUpdateNotification.value = false
  
  // 左侧栏按钮继续显示（不修改 showUpdateButton）
  
  // 下次检测时，因为没有忽略记录，会再次弹窗
}
```

### 用户点击左侧栏按钮

```javascript
function showNotificationFromButton() {
  // 打开弹窗
  showUpdateNotification.value = true
  
  // 左侧栏按钮继续显示（不修改 showUpdateButton）
}
```

## 流程图

```
启动应用
   ↓
检测更新
   ↓
有新版本？ 
   ↓ 是
设置 showUpdateButton = true （左侧栏按钮）
   ↓
检查 localStorage 中是否有忽略记录
   ↓
有忽略记录？
   ├─ 否 → showUpdateNotification = true （显示弹窗）
   └─ 是 → showUpdateNotification = false （不显示弹窗）
   
用户操作：
   ├─ 点击"稍后提醒" → 
   │     localStorage.setItem(IGNORED)
   │     showUpdateNotification = false
   │     showUpdateButton = true（保持）
   │
   ├─ 点击"关闭" → 
   │     showUpdateNotification = false
   │     showUpdateButton = true（保持）
   │     不记录到 localStorage
   │
   ├─ 点击"立即更新" → 
   │     开始下载
   │     showUpdateButton = true（保持）
   │     不记录到 localStorage
   │
   └─ 点击左侧栏按钮 → 
         showUpdateNotification = true
         showUpdateButton = true（保持）
```

## UI 状态组合

| updateAvailable | showUpdateButton | showUpdateNotification | 说明 |
|----------------|------------------|----------------------|------|
| false | false | false | 没有新版本 |
| true | true | true | 有新版本，显示弹窗和按钮 |
| true | true | false | 有新版本，只显示按钮（用户选择了稍后提醒） |

**注意**: 不存在 `updateAvailable=true` 但 `showUpdateButton=false` 的情况，因为只要有新版本，按钮就会显示。

## 最佳实践

### 用户视角

- 如果现在不想更新，点击 **"稍后提醒"**，弹窗不会再出现，但左侧栏有按钮可以随时打开
- 如果只是临时不想看到弹窗，点击 **"关闭"**，24小时后会再次提醒
- 左侧栏的更新按钮会一直提醒你有新版本，直到你安装更新

### 开发者视角

- `ignoreUpdate()` 是唯一会记录忽略状态的操作
- 左侧栏按钮是"永久提示"，确保用户不会错过更新
- 弹窗是"主动提示"，但可以通过"稍后提醒"关闭

## 测试检查清单

- [ ] 首次检测到新版本时，弹窗和左侧栏按钮都显示
- [ ] 点击"稍后提醒"后，弹窗关闭，左侧栏按钮保留
- [ ] 点击"稍后提醒"后，下次检测不弹窗，但左侧栏按钮仍在
- [ ] 点击"关闭"后，弹窗关闭，左侧栏按钮保留
- [ ] 点击"关闭"后，下次检测会再次弹窗，左侧栏按钮仍在
- [ ] 点击"立即更新"开始下载，左侧栏按钮保留
- [ ] 下载失败后，下次检测会弹窗，左侧栏按钮仍在
- [ ] 点击左侧栏按钮可以打开弹窗
- [ ] 从左侧栏打开弹窗后关闭，按钮仍然显示
- [ ] 没有新版本时，左侧栏按钮不显示

## 总结

这个设计平衡了用户体验和提醒效果：

✅ **左侧栏按钮作为持久提醒**，确保用户知道有新版本
✅ **弹窗作为主动提醒**，但可以通过"稍后提醒"关闭
✅ **用户有完全的控制权**，可以选择何时查看更新信息
✅ **不会打扰用户**，点击"稍后提醒"后不会再弹窗
✅ **不会错过更新**，左侧栏按钮始终提示有新版本

