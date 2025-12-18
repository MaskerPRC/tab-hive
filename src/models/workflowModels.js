/**
 * 工作流节点数据模型
 * MVP版本：支持基本的网页数据映射和交互控制
 */

/**
 * 数据映射类型（MVP版本）
 */
export const DATA_MAPPING_TYPES = {
  TEXT: {
    type: 'text',
    name: '文本内容',
    description: '提取元素的文本内容',
    icon: '📝',
    extract: (element) => {
      if (!element) return ''
      return element.textContent?.trim() || ''
    }
  }
}

/**
 * 交互映射类型（MVP版本）
 */
export const ACTION_MAPPING_TYPES = {
  CLICK: {
    type: 'click',
    name: '点击',
    description: '点击元素',
    icon: '👆',
    needsParam: false,
    execute: (element) => {
      if (!element) throw new Error('元素不存在')
      element.click()
      return { success: true, action: 'click' }
    }
  },
  
  INPUT: {
    type: 'input',
    name: '输入文本',
    description: '在输入框中输入文本',
    icon: '⌨️',
    needsParam: true,
    paramType: 'text',
    paramLabel: '输入内容',
    execute: (element, text) => {
      if (!element) throw new Error('元素不存在')
      if (element.tagName !== 'INPUT' && element.tagName !== 'TEXTAREA') {
        throw new Error('只能在input或textarea元素上执行输入操作')
      }
      element.value = text
      element.dispatchEvent(new Event('input', { bubbles: true }))
      element.dispatchEvent(new Event('change', { bubbles: true }))
      return { success: true, action: 'input', value: text }
    }
  }
}

/**
 * 节点类型
 */
export const NODE_TYPES = {
  WEBPAGE: 'webpage',
  FLOW: 'flow',
  WEB_CONTROL: 'web-control',
  TRIGGER: 'trigger',           // 执行触发器（手动触发器）
  HTTP: 'http',                 // HTTP 节点
  SET: 'set',                   // Set 数据节点
  WEB_ACTION: 'web-action'       // 网页操作节点
}

/**
 * 连接类型
 */
export const CONNECTION_TYPES = {
  DATA_MAPPING: 'data-mapping',     // 数据映射（虚线）
  EXECUTION_FLOW: 'execution-flow', // 执行流（实线）
  ACTION_CONTROL: 'action-control'  // 交互控制（实线，特殊颜色）
}

/**
 * 创建网页节点
 */
export function createWebPageNode(websiteId, websiteName) {
  return {
    id: `webpage-${Date.now()}`,
    type: NODE_TYPES.WEBPAGE,
    websiteId,
    name: websiteName || '网页节点',
    position: { x: 100, y: 100 },
    selectorConfigs: [] // 选择器配置列表
  }
}

/**
 * 创建选择器配置
 */
export function createSelectorConfig(selector, elementName) {
  return {
    id: `selector-${Date.now()}`,
    selector,
    elementName: elementName || '元素',
    dataMappings: [],
    actionMappings: []
  }
}

/**
 * 创建数据映射
 */
export function createDataMapping(type = 'text', name = '文本数据') {
  return {
    id: `data-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    type,
    name,
    portId: `data-port-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }
}

/**
 * 创建交互映射
 */
export function createActionMapping(type = 'click', name = '点击') {
  return {
    id: `action-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    type,
    name,
    portId: `action-port-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }
}

/**
 * 创建Flow节点
 */
export function createFlowNode(name = '处理节点') {
  return {
    id: `flow-${Date.now()}`,
    type: NODE_TYPES.FLOW,
    name,
    position: { x: 400, y: 100 },
    inputPorts: [
      { id: `in-1-${Date.now()}`, name: '输入1' }
    ],
    outputPorts: [
      { id: `out-1-${Date.now()}`, name: '输出1' }
    ],
    logic: {
      type: 'passthrough', // MVP: 简单传递数据
      transform: null
    }
  }
}

/**
 * 创建网页控制节点
 */
export function createWebControlNode(name = '网页控制') {
  return {
    id: `control-${Date.now()}`,
    type: NODE_TYPES.WEB_CONTROL,
    name,
    position: { x: 700, y: 100 },
    inputPorts: [
      { id: `in-1-${Date.now()}`, name: '输入1' }
    ],
    actionControls: [
      { 
        id: `ctrl-1-${Date.now()}`, 
        name: '交互1',
        targetNodeId: null,
        targetActionId: null,
        params: {}
      }
    ],
    outputPorts: [
      { 
        id: `out-1-${Date.now()}`, 
        name: '交互结果',
        isFixed: true
      },
      { 
        id: `out-2-${Date.now()}`, 
        name: '输出1'
      }
    ]
  }
}

/**
 * 创建执行触发器节点（手动触发器）
 */
export function createTriggerNode(position = { x: 100, y: 100 }) {
  return {
    id: `trigger-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    type: NODE_TYPES.TRIGGER,
    name: '执行触发器',
    position,
    outputPorts: [
      { 
        id: `trigger-out-${Date.now()}`, 
        name: '触发',
        portType: 'execution'
      }
    ],
    canExecute: true // 可以点击执行
  }
}

/**
 * 创建 HTTP 节点
 */
export function createHttpNode(position = { x: 300, y: 100 }) {
  return {
    id: `http-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    type: NODE_TYPES.HTTP,
    name: 'HTTP 请求',
    position,
    inputPorts: [
      { 
        id: `http-in-${Date.now()}`, 
        name: '输入',
        portType: 'execution'
      }
    ],
    outputPorts: [
      { 
        id: `http-out-${Date.now()}`, 
        name: '输出',
        portType: 'execution'
      }
    ],
    config: {
      method: 'GET',
      url: '',
      headers: {},
      body: '',
      // 数据引用：可以引用数据映射端点的数据
      dataReferences: {} // { field: { websiteId, portId } }
    }
  }
}

/**
 * 创建 Set 数据节点
 */
export function createSetNode(position = { x: 300, y: 200 }) {
  return {
    id: `set-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    type: NODE_TYPES.SET,
    name: 'Set 数据',
    position,
    inputPorts: [
      { 
        id: `set-in-${Date.now()}`, 
        name: '输入',
        portType: 'execution'
      }
    ],
    outputPorts: [
      { 
        id: `set-out-${Date.now()}`, 
        name: '输出',
        portType: 'execution'
      }
    ],
    config: {
      // 数据引用：可以引用数据映射端点的数据
      dataReferences: {} // { variableName: { websiteId, portId } }
    }
  }
}

/**
 * 创建网页操作节点
 */
export function createWebActionNode(position = { x: 300, y: 300 }) {
  return {
    id: `web-action-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    type: NODE_TYPES.WEB_ACTION,
    name: '网页操作',
    position,
    inputPorts: [
      { 
        id: `web-action-in-${Date.now()}`, 
        name: '输入',
        portType: 'execution'
      },
      // 可以连接交互映射端点
      { 
        id: `web-action-action-in-${Date.now()}`, 
        name: '交互输入',
        portType: 'action',
        canConnectFromActionPort: true // 标记可以连接交互映射端点
      }
    ],
    outputPorts: [
      { 
        id: `web-action-out-${Date.now()}`, 
        name: '输出',
        portType: 'execution'
      }
    ],
    config: {
      // 连接的交互映射端点
      actionPort: null, // { websiteId, portId }
      // 数据引用：可以引用数据映射端点的数据
      dataReferences: {} // { field: { websiteId, portId } }
    }
  }
}

/**
 * 创建连接
 */
export function createConnection(type, from, to) {
  return {
    id: `conn-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    type,
    from, // { nodeId, portId }
    to    // { nodeId, portId }
  }
}

/**
 * 创建工作流
 */
export function createWorkflow(name = '新工作流', layoutId = null) {
  return {
    id: `workflow-${Date.now()}`,
    name,
    description: '',
    layoutId,  // 关联的布局ID
    nodes: [],
    connections: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
}

