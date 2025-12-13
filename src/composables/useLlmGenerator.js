import { ref } from 'vue'
import { useLlmConfig } from './useLlmConfig.js'

/**
 * LLM HTML 生成器
 */
export function useLlmGenerator() {
  const { config } = useLlmConfig()
  const isGenerating = ref(false)
  const error = ref(null)

  /**
   * 生成 HTML 代码
   * @param {string} requirement - 用户需求描述
   * @returns {Promise<string>} - 生成的 HTML 代码
   */
  const generateHtml = async (requirement) => {
    if (!config.value.apiUrl || !config.value.apiKey) {
      throw new Error('请先配置 LLM API')
    }

    isGenerating.value = true
    error.value = null

    try {
      const prompt = `请根据以下需求生成一个完整的 HTML 网页代码。

【第一步：分析与思考】
请先思考以下问题（这部分内容不要输出，只是你的思考过程）：
- 这个需求属于什么类型的页面？（工具类/展示类/应用类/游戏类等）
- 什么设计风格最合适？（现代简约/毛玻璃/渐变色/深色模式/扁平化/极简主义/卡片式等）
- 主色调应该是什么？用户体验的重点在哪里？
- 需要哪些交互动效让页面更生动？

【第二步：代码开发要求】
1. 生成完整的 HTML 文档，包括 <!DOCTYPE html>、<html>、<head> 和 <body> 标签
2. 在 <head> 中包含必要的 <meta> 标签和 <title>
3. 使用内联 CSS 样式，展现你的设计功底：精美的配色、合适的间距、优雅的动效
4. 代码必须可以直接在浏览器中运行，一次性成功，没有任何报错
5. 如果需求涉及交互功能，使用原生 JavaScript 实现
6. 确保代码美观、现代、响应式，注重细节打磨
7. 【重要】这是一个纯前端页面，如果需要数据存储功能，必须使用浏览器本地存储（localStorage、sessionStorage 或 IndexedDB），不要使用后端数据库或服务器存储
8. 充分发挥你的设计师思维，让页面不仅功能完善，更要赏心悦目

【第三步：代码质量与可靠性要求（必须严格遵守）】
9. 【零错误原则】代码必须没有任何语法错误、拼写错误、逻辑错误，确保一次性可用
10. 【完整性检查】所有标签必须正确闭合，所有引用必须存在，所有变量必须先声明后使用
11. 【健壮性】添加必要的错误处理（try-catch）、输入验证、边界条件检查
12. 【兼容性】确保代码在主流浏览器（Chrome、Firefox、Safari、Edge）中都能正常运行
13. 【性能优化】避免内存泄漏，合理使用事件监听器，必要时添加防抖节流
14. 【数据持久化】如使用 localStorage，必须处理好数据序列化/反序列化，防止解析错误
15. 【用户体验】添加适当的加载状态、成功/失败提示、空状态展示
16. 【测试思维】在提交代码前，在脑海中模拟运行一遍，检查所有可能的执行路径

用户需求：${requirement}

请只返回 HTML 代码，不要包含思考过程、解释或 markdown 代码块标记。`

      const response = await fetch(config.value.apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${config.value.apiKey}`
        },
        body: JSON.stringify({
          model: config.value.model,
          messages: [
            {
              role: 'system',
              content: '你是一位从设计师转型为程序员的全栈开发者，兼具出色的审美能力和扎实的编码功底。你擅长根据需求分析页面类型和设计风格，然后生成完整、美观、功能完善的纯前端 HTML 网页代码。你生成的页面只能使用浏览器本地存储（localStorage、sessionStorage、IndexedDB）来保存数据，不能依赖后端服务器或数据库。在开发前，你会先思考用户需求适合什么样的设计风格（如现代简约、扁平化、毛玻璃、极简主义等）和页面类型（工具类、内容展示类、交互应用类等），然后据此生成最合适的页面。你的代码必须是生产级别的质量，一次性可用，没有任何语法错误、逻辑错误或运行时错误。'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: config.value.temperature,
          max_tokens: config.value.maxTokens
        })
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error?.message || `API 请求失败: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()
      
      // 提取生成的 HTML 内容
      let html = ''
      if (data.choices && data.choices.length > 0) {
        html = data.choices[0].message?.content || ''
        
        // 移除可能的 markdown 代码块标记
        html = html.replace(/^```html\s*/i, '').replace(/^```\s*/i, '').replace(/\s*```$/i, '')
        html = html.trim()
      }

      if (!html) {
        throw new Error('未获取到生成的 HTML 代码')
      }

      return html
    } catch (err) {
      error.value = err.message
      throw err
    } finally {
      isGenerating.value = false
    }
  }

  return {
    generateHtml,
    isGenerating,
    error
  }
}

