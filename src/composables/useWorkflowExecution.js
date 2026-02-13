/**
 * 工作流执行引擎 Composable
 * 管理工作流节点的执行、HTTP请求、数据设置和网页操作
 */
import { ref } from 'vue'

/**
 * @param {Object} options
 * @param {Ref<Array>} options.workflowNodes - 工作流节点列表
 * @param {Ref<Array>} options.connections - 连接线列表
 * @param {Object} options.automationData - useAutomationData() 返回的实例
 * @param {Ref<Array>} options.allWebsites - 所有网站列表
 */
export function useWorkflowExecution({ workflowNodes, connections, automationData, allWebsites }) {
  const executingNodeId = ref(null)
  const executionContext = ref({}) // 执行上下文，存储数据

  // 获取数据映射的值
  const getDataMappingValue = async (websiteId, portId) => {
    try {
      const websiteAutomationData = automationData.getAutomationData(websiteId)
      const mapping = [...(websiteAutomationData.dataMappings || []), ...(websiteAutomationData.actionMappings || [])]
        .find(m => m.portId === portId)

      if (!mapping || !mapping.selector) {
        console.warn('[执行引擎] 未找到映射或选择器:', { websiteId, portId })
        return ''
      }

      // 查找对应的网站
      const website = allWebsites.value.find(w => String(w.id) === String(websiteId))
      if (!website) {
        console.warn('[执行引擎] 未找到网站:', websiteId)
        return ''
      }

      // 在 Electron 环境下，需要通过 webview 执行脚本
      const isElectron = window.electron?.isElectron
      if (isElectron) {
        const webviewId = website.type === 'custom-html'
          ? `webview-custom-${website.id}`
          : `webview-${website.id}`
        const webview = document.querySelector(`#${webviewId}`)

        if (webview && webview.executeJavaScript) {
          const script = `
            (function() {
              try {
                const element = document.querySelector('${mapping.selector.replace(/'/g, "\\'")}');
                if (!element) return '';
                return element.textContent?.trim() || '';
              } catch(e) {
                return '';
              }
            })()
          `
          const result = await webview.executeJavaScript(script)
          return result || ''
        }
      } else {
        // 浏览器环境，通过 iframe
        const iframe = document.querySelector(`iframe[data-website-id="${website.id}"]`)
        if (iframe && iframe.contentWindow) {
          try {
            const element = iframe.contentDocument?.querySelector(mapping.selector)
            return element?.textContent?.trim() || ''
          } catch (e) {
            console.error('[执行引擎] 无法访问 iframe 内容:', e)
            return ''
          }
        }
      }

      return ''
    } catch (error) {
      console.error('[执行引擎] 获取数据映射值失败:', error)
      return ''
    }
  }

  // 执行节点
  const executeNode = async (node) => {
    if (executingNodeId.value) {
      console.warn('[执行引擎] 已有节点正在执行')
      return
    }

    executingNodeId.value = node.id
    console.log('[执行引擎] 开始执行节点:', node.type, node.id)

    try {
      if (node.type === 'trigger') {
        // 触发器节点：找到连接的输出节点并执行
        const outputPort = node.outputPorts?.[0]
        if (outputPort) {
          const nextConnections = connections.value.filter(c =>
            c.from.nodeId === node.id && c.from.portId === outputPort.id
          )

          for (const connection of nextConnections) {
            const nextNode = workflowNodes.value.find(n => n.id === connection.to.nodeId)
            if (nextNode) {
              await executeNode(nextNode)
            }
          }
        }
      } else if (node.type === 'http') {
        // HTTP 节点：执行 HTTP 请求
        await executeHttpNode(node)
      } else if (node.type === 'set') {
        // Set 节点：设置数据
        await executeSetNode(node)
      } else if (node.type === 'web-action') {
        // 网页操作节点：执行网页操作
        await executeWebActionNode(node)
      }

      // 继续执行连接的节点
      const outputPorts = node.outputPorts || []
      for (const outputPort of outputPorts) {
        const nextConnections = connections.value.filter(c =>
          c.from.nodeId === node.id && c.from.portId === outputPort.id
        )

        for (const connection of nextConnections) {
          const nextNode = workflowNodes.value.find(n => n.id === connection.to.nodeId)
          if (nextNode) {
            await executeNode(nextNode)
          }
        }
      }
    } catch (error) {
      console.error('[执行引擎] 执行节点失败:', error)
    } finally {
      executingNodeId.value = null
    }
  }

  // 执行 HTTP 节点
  const executeHttpNode = async (node) => {
    console.log('[执行引擎] 执行 HTTP 节点')
    const config = node.config || {}

    // 处理数据引用
    let url = config.url || ''
    let body = config.body || ''

    if (config.dataReferences) {
      for (const [key, ref] of Object.entries(config.dataReferences)) {
        const value = await getDataMappingValue(ref.websiteId, ref.portId)
        // 替换 URL 和 body 中的占位符
        url = url.replace(`{{${key}}}`, value)
        body = body.replace(`{{${key}}}`, value)
      }
    }

    try {
      const response = await fetch(url, {
        method: config.method || 'GET',
        headers: config.headers || {},
        body: config.method !== 'GET' ? body : undefined
      })

      const result = await response.text()
      console.log('[执行引擎] HTTP 请求完成:', result)
      executionContext.value[`http_${node.id}`] = result
    } catch (error) {
      console.error('[执行引擎] HTTP 请求失败:', error)
    }
  }

  // 执行 Set 节点
  const executeSetNode = async (node) => {
    console.log('[执行引擎] 执行 Set 节点')
    const config = node.config || {}

    if (config.dataReferences) {
      for (const [key, ref] of Object.entries(config.dataReferences)) {
        const value = await getDataMappingValue(ref.websiteId, ref.portId)
        executionContext.value[key] = value
        console.log('[执行引擎] 设置变量:', key, '=', value)
      }
    }
  }

  // 执行网页操作节点
  const executeWebActionNode = async (node) => {
    console.log('[执行引擎] 执行网页操作节点')
    const config = node.config || {}

    if (!config.actionPort) {
      console.warn('[执行引擎] 网页操作节点未配置交互映射')
      return
    }

    const { websiteId, portId } = config.actionPort

    // 查找对应的映射
    const websiteAutomationData = automationData.getAutomationData(websiteId)
    const actionMapping = (websiteAutomationData.actionMappings || []).find(m => m.portId === portId)

    if (!actionMapping || !actionMapping.selector) {
      console.warn('[执行引擎] 未找到交互映射')
      return
    }

    // 查找对应的网站
    const website = allWebsites.value.find(w => String(w.id) === String(websiteId))
    if (!website) {
      console.warn('[执行引擎] 未找到网站')
      return
    }

    // 执行操作
    const isElectron = window.electron?.isElectron
    if (isElectron) {
      const webviewId = website.type === 'custom-html'
        ? `webview-custom-${website.id}`
        : `webview-${website.id}`
      const webview = document.querySelector(`#${webviewId}`)

      if (webview && webview.executeJavaScript) {
        const script = `
          (function() {
            try {
              const element = document.querySelector('${actionMapping.selector.replace(/'/g, "\\'")}');
              if (!element) return { success: false, error: '元素未找到' };
              element.click();
              return { success: true };
            } catch(e) {
              return { success: false, error: e.message };
            }
          })()
        `
        const result = await webview.executeJavaScript(script)
        console.log('[执行引擎] 网页操作完成:', result)
      }
    } else {
      // 浏览器环境
      const iframe = document.querySelector(`iframe[data-website-id="${website.id}"]`)
      if (iframe && iframe.contentWindow) {
        try {
          const element = iframe.contentDocument?.querySelector(actionMapping.selector)
          if (element) {
            element.click()
            console.log('[执行引擎] 网页操作完成')
          }
        } catch (e) {
          console.error('[执行引擎] 无法执行网页操作:', e)
        }
      }
    }
  }

  // 处理节点执行
  const handleNodeExecute = (node) => {
    if (node.type === 'trigger') {
      executeNode(node)
    }
  }

  return {
    executingNodeId,
    executionContext,
    handleNodeExecute
  }
}
