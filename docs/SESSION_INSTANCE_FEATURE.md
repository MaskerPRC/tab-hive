# Cookie共享实例功能说明

## 功能概述

Cookie共享实例功能允许每个视界（网站卡片）选择不同的session实例，实现Cookie和存储的隔离。同一实例的视界会共享Cookie、LocalStorage等存储，不同实例之间完全隔离。

## 主要用途

1. **多账号登录**：为同一网站创建多个视界，每个使用不同的session实例，可以同时登录不同账号
2. **测试环境隔离**：将生产环境和测试环境的网站放在不同的实例中，避免Cookie污染
3. **隐私保护**：将不同类型的网站放在不同的实例中，防止跨站跟踪

## 使用方法

### 1. 创建新的Session实例

有两种方式创建新的session实例：

#### 方式一：通过实例管理界面
1. 点击左侧配置面板中的"实例管理"按钮
2. 在打开的对话框中点击"新建实例"
3. 输入实例名称（例如："账号2"、"测试环境"等）
4. 点击确定

#### 方式二：在编辑网站时创建
1. 添加或编辑网站时，在"Cookie共享实例"下拉框旁边点击"➕ 新建"按钮
2. 输入实例名称
3. 新创建的实例会自动被选中

### 2. 为视界选择Session实例

1. 添加或编辑网站
2. 在"Cookie共享实例"下拉框中选择要使用的实例
3. 点击确定保存

### 3. 管理Session实例

在"实例管理"对话框中可以：
- 查看所有实例及其使用情况
- 重命名实例（不能重命名默认实例）
- 删除实例（只能删除没有被使用的实例）

## 技术实现

### 数据模型

每个网站对象新增了 `sessionInstance` 字段：

```javascript
{
  id: 123456789,
  title: '网站标题',
  url: 'https://example.com',
  deviceType: 'desktop',
  targetSelector: '',
  autoRefreshInterval: 0,
  sessionInstance: 'default', // 新增字段
  position: { x: 20, y: 20 },
  size: { width: 400, height: 300 }
}
```

### Electron实现

在Electron环境中，通过webview的`partition`属性实现session隔离：

```html
<webview
  :partition="partitionName"
  ...
></webview>
```

不同的`sessionInstance`会映射到不同的`partition`：
- `default` → `persist:default`
- `instance-123456789` → `persist:instance-123456789`

### 数据持久化

Session实例列表存储在localStorage中：

```javascript
localStorage.setItem('quanshijie-session-instances', JSON.stringify([
  {
    id: 'default',
    name: '默认共享实例',
    description: '所有网站共享cookie和存储'
  },
  {
    id: 'instance-123456789',
    name: '账号2',
    description: '',
    createdAt: '2025-10-29T...'
  }
]))
```

## 文件修改清单

### 新增文件
1. `src/composables/useSessionManager.js` - Session实例管理逻辑
2. `src/components/SessionInstanceManager.vue` - Session实例管理界面
3. `docs/SESSION_INSTANCE_FEATURE.md` - 功能说明文档

### 修改文件
1. `src/composables/useWebsiteManager.js` - 添加sessionInstance字段支持
2. `src/components/WebsiteCard.vue` - 添加partition属性
3. `src/components/WebsiteEditDialog.vue` - 添加session实例选择器
4. `src/components/ConfigPanel.vue` - 添加实例管理按钮
5. `src/components/GridView.vue` - 更新默认值
6. `src/App.vue` - 集成SessionInstanceManager组件

## 注意事项

1. **默认实例不可删除**：系统保留一个"默认共享实例"，无法删除和重命名
2. **实例删除限制**：只有没有被任何视界使用的实例才能被删除
3. **非Electron环境**：在浏览器环境中，由于iframe的限制，session隔离功能可能不完全生效
4. **数据迁移**：旧版本的网站数据会自动使用默认实例

## 示例场景

### 场景1：多账号同时登录

假设你需要同时登录3个GitHub账号：

1. 创建3个session实例：
   - 默认共享实例（已存在）
   - GitHub账号2
   - GitHub账号3

2. 创建3个GitHub视界：
   - 视界1：使用"默认共享实例"
   - 视界2：使用"GitHub账号2"
   - 视界3：使用"GitHub账号3"

3. 分别在3个视界中登录不同账号，互不影响

### 场景2：环境隔离

将生产环境和测试环境的网站分开：

1. 创建"测试环境"实例
2. 将所有测试网站的session实例设置为"测试环境"
3. 生产网站使用默认实例
4. 两个环境的Cookie和存储完全隔离

## 后续优化建议

1. 添加实例描述/备注功能
2. 支持实例颜色标记
3. 批量修改多个视界的实例
4. 实例导入/导出功能
5. 实例使用统计和分析

