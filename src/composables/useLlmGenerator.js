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
      const prompt = `请根据以下需求生成一个完整的 HTML 网页代码。要求：
1. 生成完整的 HTML 文档，包括 <!DOCTYPE html>、<html>、<head> 和 <body> 标签
2. 在 <head> 中包含必要的 <meta> 标签和 <title>
3. 使用内联 CSS 样式，确保样式完整
4. 代码应该可以直接在浏览器中运行
5. 如果需求涉及交互功能，使用原生 JavaScript 实现
6. 确保代码美观、现代、响应式

需求：${requirement}

请只返回 HTML 代码，不要包含任何解释或 markdown 代码块标记。`

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
              content: '你是一个专业的 HTML 网页开发专家，擅长根据需求生成完整、美观、功能完善的 HTML 网页代码。'
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

