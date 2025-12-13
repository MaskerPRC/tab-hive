const { BrowserWindow, Notification } = require('electron')
const { query, get, run } = require('../database')

/**
 * 监听规则管理器
 * 负责管理页面监听规则的增删改查和定时检查
 */
class MonitoringManager {
  constructor() {
    // 存储定时器
    this.timers = new Map()
    // LLM API 配置
    this.llmConfig = null
    console.log('[MonitoringManager] 监听规则管理器已初始化')
  }

  /**
   * 初始化监听管理器
   * 启动所有已启用的监听规则
   */
  async initialize() {
    try {
      console.log('[MonitoringManager] 开始初始化监听规则...')
      const rules = await query('SELECT * FROM monitoring_rules WHERE enabled = 1')
      
      for (const rule of rules) {
        this.startMonitoring(rule)
      }
      
      console.log(`[MonitoringManager] 已启动 ${rules.length} 个监听规则`)
    } catch (error) {
      console.error('[MonitoringManager] 初始化失败:', error)
    }
  }

  /**
   * 配置 LLM API
   * @param {Object} config - API 配置
   * @param {string} config.provider - 提供商 (openai, anthropic, etc.)
   * @param {string} config.apiKey - API 密钥
   * @param {string} config.apiUrl - API 地址
   * @param {string} config.model - 模型名称
   */
  configureLLM(config) {
    this.llmConfig = config
    console.log('[MonitoringManager] LLM API 配置已更新:', {
      provider: config.provider,
      model: config.model,
      apiUrl: config.apiUrl
    })
  }

  /**
   * 获取所有监听规则（按网站ID过滤）
   * @param {string} websiteId - 网站ID
   * @returns {Promise<Array>} 监听规则列表
   */
  async getRules(websiteId) {
    try {
      const rules = await query(
        'SELECT * FROM monitoring_rules WHERE website_id = ? ORDER BY created_at DESC',
        [websiteId]
      )
      return rules
    } catch (error) {
      console.error('[MonitoringManager] 获取监听规则失败:', error)
      throw error
    }
  }

  /**
   * 创建监听规则
   * @param {Object} ruleData - 规则数据
   * @returns {Promise<Object>} 创建的规则
   */
  async createRule(ruleData) {
    try {
      const result = await run(
        `INSERT INTO monitoring_rules 
        (website_id, name, enabled, condition_type, condition_config, action_type, action_config, check_interval)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          ruleData.website_id,
          ruleData.name,
          ruleData.enabled !== undefined ? ruleData.enabled : 1,
          ruleData.condition_type,
          ruleData.condition_config,
          ruleData.action_type,
          ruleData.action_config,
          ruleData.check_interval
        ]
      )

      const rule = await get('SELECT * FROM monitoring_rules WHERE id = ?', [result.id])
      
      // 如果规则已启用，立即开始监听
      if (rule.enabled) {
        this.startMonitoring(rule)
      }

      console.log('[MonitoringManager] 规则创建成功:', rule.name)
      return rule
    } catch (error) {
      console.error('[MonitoringManager] 创建规则失败:', error)
      throw error
    }
  }

  /**
   * 更新监听规则
   * @param {number} ruleId - 规则ID
   * @param {Object} ruleData - 规则数据
   * @returns {Promise<Object>} 更新后的规则
   */
  async updateRule(ruleId, ruleData) {
    try {
      await run(
        `UPDATE monitoring_rules 
        SET name = ?, condition_type = ?, condition_config = ?, 
            action_type = ?, action_config = ?, check_interval = ?,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ?`,
        [
          ruleData.name,
          ruleData.condition_type,
          ruleData.condition_config,
          ruleData.action_type,
          ruleData.action_config,
          ruleData.check_interval,
          ruleId
        ]
      )

      const rule = await get('SELECT * FROM monitoring_rules WHERE id = ?', [ruleId])
      
      // 重启监听
      this.stopMonitoring(ruleId)
      if (rule.enabled) {
        this.startMonitoring(rule)
      }

      console.log('[MonitoringManager] 规则更新成功:', rule.name)
      return rule
    } catch (error) {
      console.error('[MonitoringManager] 更新规则失败:', error)
      throw error
    }
  }

  /**
   * 删除监听规则
   * @param {number} ruleId - 规则ID
   */
  async deleteRule(ruleId) {
    try {
      // 停止监听
      this.stopMonitoring(ruleId)
      
      await run('DELETE FROM monitoring_rules WHERE id = ?', [ruleId])
      
      console.log('[MonitoringManager] 规则删除成功:', ruleId)
    } catch (error) {
      console.error('[MonitoringManager] 删除规则失败:', error)
      throw error
    }
  }

  /**
   * 切换规则启用状态
   * @param {number} ruleId - 规则ID
   * @param {boolean} enabled - 启用状态
   */
  async toggleRule(ruleId, enabled) {
    try {
      await run(
        'UPDATE monitoring_rules SET enabled = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [enabled ? 1 : 0, ruleId]
      )

      const rule = await get('SELECT * FROM monitoring_rules WHERE id = ?', [ruleId])

      if (enabled) {
        this.startMonitoring(rule)
      } else {
        this.stopMonitoring(ruleId)
      }

      console.log('[MonitoringManager] 规则状态切换:', rule.name, enabled ? '启用' : '禁用')
    } catch (error) {
      console.error('[MonitoringManager] 切换规则状态失败:', error)
      throw error
    }
  }

  /**
   * 开始监听
   * @param {Object} rule - 规则对象
   */
  startMonitoring(rule) {
    if (!rule || !rule.enabled) return

    // 如果已存在定时器，先清除
    this.stopMonitoring(rule.id)

    console.log(`[MonitoringManager] 启动监听: ${rule.name}, 间隔: ${rule.check_interval}秒`)

    // 创建定时器
    const timer = setInterval(async () => {
      try {
        await this.checkRule(rule)
      } catch (error) {
        console.error(`[MonitoringManager] 检查规则失败 [${rule.name}]:`, error)
      }
    }, rule.check_interval * 1000)

    this.timers.set(rule.id, timer)

    // 立即执行一次检查（可选）
    // this.checkRule(rule).catch(error => {
    //   console.error(`[MonitoringManager] 首次检查规则失败 [${rule.name}]:`, error)
    // })
  }

  /**
   * 停止监听
   * @param {number} ruleId - 规则ID
   */
  stopMonitoring(ruleId) {
    const timer = this.timers.get(ruleId)
    if (timer) {
      clearInterval(timer)
      this.timers.delete(ruleId)
      console.log(`[MonitoringManager] 停止监听: 规则ID ${ruleId}`)
    }
  }

  /**
   * 检查规则
   * @param {Object} rule - 规则对象
   */
  async checkRule(rule) {
    console.log(`[MonitoringManager] 检查规则: ${rule.name}`)

    try {
      // 更新最后检查时间
      await run(
        'UPDATE monitoring_rules SET last_check_time = CURRENT_TIMESTAMP WHERE id = ?',
        [rule.id]
      )

      // 根据条件类型执行不同的检查
      let conditionMet = false

      if (rule.condition_type === 'llm_screenshot') {
        conditionMet = await this.checkLLMScreenshot(rule)
      }
      // 未来可以添加其他条件类型
      // else if (rule.condition_type === 'text_content') {
      //   conditionMet = await this.checkTextContent(rule)
      // }

      // 如果条件满足，执行动作
      if (conditionMet) {
        console.log(`[MonitoringManager] 规则触发: ${rule.name}`)
        await this.executeActions(rule)
        
        // 更新触发时间和次数
        await run(
          `UPDATE monitoring_rules 
          SET last_trigger_time = CURRENT_TIMESTAMP, 
              trigger_count = trigger_count + 1 
          WHERE id = ?`,
          [rule.id]
        )
      }
    } catch (error) {
      console.error(`[MonitoringManager] 检查规则出错 [${rule.name}]:`, error)
      throw error
    }
  }

  /**
   * 使用 LLM 分析截图检查条件
   * @param {Object} rule - 规则对象
   * @returns {Promise<boolean>} 是否满足条件
   */
  async checkLLMScreenshot(rule) {
    try {
      const conditionConfig = JSON.parse(rule.condition_config || '{}')
      const description = conditionConfig.description

      if (!description) {
        console.warn('[MonitoringManager] 规则缺少条件描述:', rule.name)
        return false
      }

      console.log('[MonitoringManager] 开始检查规则:', rule.name)
      console.log('[MonitoringManager] 条件描述:', description)
      console.log('[MonitoringManager] 目标网站ID:', rule.website_id)

      // 查找对应的 webview
      const webview = await this.findWebview(rule.website_id)
      if (!webview) {
        console.warn('[MonitoringManager] 未找到对应的 webview:', rule.website_id)
        return false
      }
      
      console.log('[MonitoringManager] 找到 webview, WebContentsId:', webview.webContentsId)

      // 截图
      const screenshot = await this.captureWebview(webview)
      if (!screenshot) {
        console.warn('[MonitoringManager] 截图失败:', rule.website_id)
        return false
      }
      
      console.log('[MonitoringManager] 截图完成，准备发送给 LLM 分析')

      // 调用 LLM 分析
      const result = await this.analyzewithLLM(screenshot, description)
      
      console.log('[MonitoringManager] LLM 分析完成，结果:', result ? '条件满足' : '条件不满足')
      
      return result
    } catch (error) {
      console.error('[MonitoringManager] LLM 截图检查失败:', error)
      return false
    }
  }

  /**
   * 查找网站对应的 webview
   * @param {string} websiteId - 网站ID
   * @returns {Promise<Object|null>} webview 对象
   */
  async findWebview(websiteId) {
    // 获取所有窗口
    const windows = BrowserWindow.getAllWindows()
    
    for (const window of windows) {
      if (window.isDestroyed()) continue
      
      try {
        // 向渲染进程查询 webview
        const webviewInfo = await window.webContents.executeJavaScript(`
          (function() {
            const webview = document.querySelector('[data-webview-id="${websiteId}"]');
            if (webview && webview.getWebContentsId) {
              return {
                found: true,
                webContentsId: webview.getWebContentsId()
              };
            }
            return { found: false };
          })()
        `)
        
        if (webviewInfo && webviewInfo.found) {
          return {
            window: window,
            webContentsId: webviewInfo.webContentsId
          }
        }
      } catch (error) {
        console.error('[MonitoringManager] 查询 webview 失败:', error)
      }
    }
    
    return null
  }

  /**
   * 截取 webview 页面
   * @param {Object} webviewInfo - webview 信息
   * @returns {Promise<string>} Base64 编码的截图
   */
  async captureWebview(webviewInfo) {
    try {
      const { webContents, app } = require('electron')
      const fs = require('fs')
      const path = require('path')
      
      const wc = webContents.fromId(webviewInfo.webContentsId)
      
      if (!wc) {
        console.warn('[MonitoringManager] WebContents 不存在, ID:', webviewInfo.webContentsId)
        return null
      }

      console.log('[MonitoringManager] 开始截图, WebContentsId:', webviewInfo.webContentsId)
      const image = await wc.capturePage()
      const size = image.getSize()
      console.log('[MonitoringManager] 截图成功, 尺寸:', `${size.width}x${size.height}`)
      
      const pngBuffer = image.toPNG()
      const base64 = pngBuffer.toString('base64')
      
      console.log('[MonitoringManager] Base64 长度:', base64.length, '字节:', pngBuffer.length)
      
      // 可选：保存截图到临时目录用于调试
      if (process.env.DEBUG_SCREENSHOTS) {
        const tempDir = app.getPath('temp')
        const screenshotPath = path.join(tempDir, `monitoring-screenshot-${Date.now()}.png`)
        fs.writeFileSync(screenshotPath, pngBuffer)
        console.log('[MonitoringManager] 调试截图已保存:', screenshotPath)
      }
      
      return base64
    } catch (error) {
      console.error('[MonitoringManager] 截图失败:', error)
      return null
    }
  }

  /**
   * 使用 LLM 分析截图
   * @param {string} screenshotBase64 - Base64 编码的截图
   * @param {string} description - 条件描述
   * @param {boolean} isTest - 是否为测试模式
   * @returns {Promise<boolean|string>} 是否满足条件或完整回答
   */
  async analyzewithLLM(screenshotBase64, description, isTest = false) {
    if (!this.llmConfig || !this.llmConfig.apiKey) {
      console.error('[MonitoringManager] LLM API 未配置')
      throw new Error('LLM API 未配置，请在设置中配置 API 密钥')
    }

    try {
      // 默认使用 OpenAI 兼容的 API（大多数服务都兼容）
      // 支持 OpenAI, OpenRouter, 以及其他兼容 OpenAI API 格式的服务
      const provider = this.llmConfig.provider || 'openai'
      
      if (provider === 'openai' || !this.llmConfig.provider) {
        // OpenAI 或兼容 OpenAI API 的服务（如 OpenRouter）
        return await this.analyzeWithOpenAI(screenshotBase64, description, isTest)
      }
      // 可以扩展支持其他提供商
      // else if (provider === 'anthropic') {
      //   return await this.analyzeWithAnthropic(screenshotBase64, description, isTest)
      // }
      
      throw new Error('不支持的 LLM 提供商: ' + provider)
    } catch (error) {
      console.error('[MonitoringManager] LLM 分析失败:', error)
      throw error
    }
  }

  /**
   * 使用 OpenAI API 分析截图
   * @param {string} screenshotBase64 - Base64 编码的截图
   * @param {string} description - 条件描述
   * @param {boolean} isTest - 是否为测试模式（测试模式下返回完整回答，否则只判断YES/NO）
   * @returns {Promise<boolean|string>} 是否满足条件或完整回答
   */
  async analyzeWithOpenAI(screenshotBase64, description, isTest = false) {
    const { net } = require('electron')
    
    const apiUrl = this.llmConfig.apiUrl || 'https://api.openai.com/v1/chat/completions'
    const model = this.llmConfig.model || 'gpt-4-vision-preview'

    console.log('[MonitoringManager] 调用 LLM API:', {
      url: apiUrl,
      model: model,
      isTest: isTest
    })

    const payload = isTest ? {
      // 测试模式：直接回答问题
      model: model,
      messages: [
        {
          role: 'system',
          content: '你是一个页面分析助手。我会给你一张网页截图和一个问题。请根据截图内容详细回答问题。'
        },
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: description
            },
            {
              type: 'image_url',
              image_url: {
                url: `data:image/png;base64,${screenshotBase64}`
              }
            }
          ]
        }
      ],
      max_tokens: 500,
      temperature: 0.3
    } : {
      // 正常模式：YES/NO 判断
      model: model,
      messages: [
        {
          role: 'system',
          content: '你是一个页面监听助手。我会给你一张网页截图和一个条件描述。请分析截图内容，判断是否满足条件。只回答 YES 或 NO。'
        },
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: `请判断以下条件是否满足：${description}\n\n只需回答 YES 或 NO。`
            },
            {
              type: 'image_url',
              image_url: {
                url: `data:image/png;base64,${screenshotBase64}`
              }
            }
          ]
        }
      ],
      max_tokens: 50,
      temperature: 0
    }

    return new Promise((resolve, reject) => {
      const request = net.request({
        method: 'POST',
        url: apiUrl,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.llmConfig.apiKey}`
        }
      })

      let responseData = ''

      request.on('response', (response) => {
        response.on('data', (chunk) => {
          responseData += chunk.toString()
        })

        response.on('end', () => {
          try {
            if (response.statusCode !== 200) {
              console.error('[MonitoringManager] API 响应错误:', response.statusCode, responseData)
              reject(new Error(`API 错误 ${response.statusCode}: ${responseData}`))
              return
            }

            const data = JSON.parse(responseData)
            
            if (!data.choices || !data.choices[0] || !data.choices[0].message) {
              console.error('[MonitoringManager] API 响应格式错误:', data)
              reject(new Error('API 响应格式不正确'))
              return
            }

            const content = data.choices[0].message.content.trim()
            
            console.log('[MonitoringManager] LLM 原始响应:', content)
            
            // 如果是测试模式，直接返回完整内容
            if (isTest) {
              resolve(content)
            } else {
              // 正常模式，判断 YES/NO
              const answer = content.toUpperCase()
              console.log('[MonitoringManager] LLM 判断结果:', answer.includes('YES') ? 'YES' : 'NO')
              resolve(answer.includes('YES'))
            }
          } catch (error) {
            console.error('[MonitoringManager] 解析响应失败:', error)
            reject(error)
          }
        })
      })

      request.on('error', (error) => {
        reject(error)
      })

      request.write(JSON.stringify(payload))
      request.end()
    })
  }

  /**
   * 执行动作
   * @param {Object} rule - 规则对象
   */
  async executeActions(rule) {
    try {
      const actionConfig = JSON.parse(rule.action_config || '{}')

      // 根据动作类型执行不同的动作
      if (rule.action_type === 'desktop_notification') {
        await this.sendDesktopNotification(rule, actionConfig)
      }
      // 未来可以添加其他动作类型
      // else if (rule.action_type === 'email') {
      //   await this.sendEmail(rule, actionConfig)
      // }
      // else if (rule.action_type === 'webhook') {
      //   await this.callWebhook(rule, actionConfig)
      // }
    } catch (error) {
      console.error('[MonitoringManager] 执行动作失败:', error)
    }
  }

  /**
   * 发送桌面通知
   * @param {Object} rule - 规则对象
   * @param {Object} config - 动作配置
   */
  async sendDesktopNotification(rule, config) {
    try {
      const notification = new Notification({
        title: rule.name || '页面监听提醒',
        body: config.message || '检测到页面变化',
        icon: null, // 可以添加图标
        silent: false,
        urgency: 'normal'
      })

      notification.show()

      notification.on('click', () => {
        // 点击通知时，聚焦到对应的窗口
        const windows = BrowserWindow.getAllWindows()
        if (windows.length > 0) {
          const window = windows[0]
          if (window.isMinimized()) {
            window.restore()
          }
          window.focus()
        }
      })

      console.log('[MonitoringManager] 桌面通知已发送:', rule.name)
    } catch (error) {
      console.error('[MonitoringManager] 发送桌面通知失败:', error)
    }
  }

  /**
   * 清理所有定时器
   */
  cleanup() {
    console.log('[MonitoringManager] 清理所有监听定时器...')
    for (const [ruleId, timer] of this.timers.entries()) {
      clearInterval(timer)
      console.log(`[MonitoringManager] 已清除定时器: 规则ID ${ruleId}`)
    }
    this.timers.clear()
  }
}

// 导出单例
let monitoringManagerInstance = null

function getMonitoringManager() {
  if (!monitoringManagerInstance) {
    monitoringManagerInstance = new MonitoringManager()
  }
  return monitoringManagerInstance
}

module.exports = {
  getMonitoringManager
}

