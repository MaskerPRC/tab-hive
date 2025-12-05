/**
 * 选择器验证和优化工具
 * 用于检测和过滤包含乱码或无效字符的选择器
 */

/**
 * 检测字符串是否包含乱码字符
 * @param {string} str - 要检测的字符串
 * @returns {boolean} - 是否包含乱码
 */
export function hasGarbledCharacters(str) {
  if (!str || typeof str !== 'string') return false
  
  // 检测乱码模式
  const garbledPatterns = [
    // 包含大量连续的符号或特殊字符
    /[^\w\s-]{5,}/,
    // 包含不可见的控制字符
    // eslint-disable-next-line no-control-regex
    /[\x00-\x1F\x7F-\x9F]/,
    // 包含大量连续的Unicode私有区域字符
    /[\uE000-\uF8FF]{3,}/,
    // 包含大量连续的替代字符
    /[\uFFFD]{2,}/,
    // 包含过多的数字和符号混合（可能是哈希值）
    /[a-z0-9]{32,}/i,
    // 包含base64风格的长字符串
    /[A-Za-z0-9+/]{20,}={0,2}/,
    // 包含过多的下划线或连字符
    /[_-]{5,}/,
    // 包含emoji等特殊Unicode字符（可选，根据需要）
    // /[\u{1F300}-\u{1F9FF}]/u
  ]
  
  return garbledPatterns.some(pattern => pattern.test(str))
}

/**
 * 检测CSS选择器是否有效且不包含乱码
 * @param {string} selector - CSS选择器
 * @returns {object} - 验证结果 {valid: boolean, reason: string}
 */
export function validateSelector(selector) {
  if (!selector || typeof selector !== 'string') {
    return { valid: false, reason: '选择器为空或类型错误' }
  }
  
  // 检查选择器本身是否包含乱码
  if (hasGarbledCharacters(selector)) {
    return { valid: false, reason: '选择器包含乱码字符' }
  }
  
  // 检查选择器各部分
  const parts = selector.split(/[\s>+~,]/).filter(Boolean)
  for (const part of parts) {
    // 提取ID
    const idMatch = part.match(/#([^.[\]:]+)/)
    if (idMatch && hasGarbledCharacters(idMatch[1])) {
      return { valid: false, reason: 'ID包含乱码字符' }
    }
    
    // 提取类名
    const classMatches = part.match(/\.([^.#[\]:]+)/g)
    if (classMatches) {
      for (const classMatch of classMatches) {
        const className = classMatch.substring(1)
        if (hasGarbledCharacters(className)) {
          return { valid: false, reason: '类名包含乱码字符' }
        }
      }
    }
    
    // 提取属性
    const attrMatches = part.match(/\[([^\]]+)\]/g)
    if (attrMatches) {
      for (const attrMatch of attrMatches) {
        const attrContent = attrMatch.slice(1, -1)
        if (hasGarbledCharacters(attrContent)) {
          return { valid: false, reason: '属性包含乱码字符' }
        }
      }
    }
  }
  
  // 尝试验证选择器语法（可选）
  try {
    // 在虚拟环境中测试选择器是否有效
    document.createElement('div').querySelector(selector)
  } catch (e) {
    return { valid: false, reason: '选择器语法无效: ' + e.message }
  }
  
  return { valid: true, reason: '' }
}

/**
 * 清理选择器中的乱码部分
 * @param {string} selector - 原始选择器
 * @returns {string} - 清理后的选择器
 */
export function cleanSelector(selector) {
  if (!selector) return ''
  
  // 移除包含乱码的类名
  let cleaned = selector.replace(/\.([^.#\s>+~[\]:]+)/g, (match, className) => {
    return hasGarbledCharacters(className) ? '' : match
  })
  
  // 移除包含乱码的ID
  cleaned = cleaned.replace(/#([^.#\s>+~[\]:]+)/g, (match, idName) => {
    return hasGarbledCharacters(idName) ? '' : match
  })
  
  // 移除包含乱码的属性
  cleaned = cleaned.replace(/\[([^\]]+)\]/g, (match, attr) => {
    return hasGarbledCharacters(attr) ? '' : match
  })
  
  // 清理多余的空格和符号
  cleaned = cleaned.replace(/\s+/g, ' ').trim()
  cleaned = cleaned.replace(/\s*>\s*/g, ' > ')
  cleaned = cleaned.replace(/\s*\+\s*/g, ' + ')
  cleaned = cleaned.replace(/\s*~\s*/g, ' ~ ')
  
  return cleaned
}

/**
 * 计算选择器质量分数
 * @param {string} selector - CSS选择器
 * @returns {number} - 质量分数 (0-100)
 */
export function calculateSelectorQuality(selector) {
  if (!selector) return 0
  
  let score = 50 // 基础分
  
  // ID选择器加分
  if (selector.includes('#')) {
    score += 30
  }
  
  // 简短的类名加分
  const classes = selector.match(/\.([a-zA-Z][a-zA-Z0-9-]*)/g)
  if (classes && classes.length > 0) {
    score += 20
    // 类名越短越好
    const avgLength = classes.reduce((sum, c) => sum + c.length, 0) / classes.length
    if (avgLength < 15) score += 10
  }
  
  // 语义化的类名/ID加分
  const semanticKeywords = ['header', 'footer', 'nav', 'main', 'content', 'container', 'wrapper', 'section', 'article']
  const lowerSelector = selector.toLowerCase()
  if (semanticKeywords.some(keyword => lowerSelector.includes(keyword))) {
    score += 10
  }
  
  // 过于复杂的选择器减分
  const complexity = (selector.match(/[>+~\s]/g) || []).length
  if (complexity > 5) {
    score -= complexity * 2
  }
  
  // 包含数字减分（可能是动态生成的）
  if (/\d{3,}/.test(selector)) {
    score -= 15
  }
  
  return Math.max(0, Math.min(100, score))
}

/**
 * 从元素路径中选择最佳选择器
 * @param {Array} selectorCandidates - 候选选择器数组
 * @returns {string} - 最佳选择器
 */
export function selectBestSelector(selectorCandidates) {
  if (!selectorCandidates || selectorCandidates.length === 0) return ''
  
  // 过滤掉无效的选择器
  const validSelectors = selectorCandidates.filter(s => {
    const validation = validateSelector(s)
    return validation.valid
  })
  
  if (validSelectors.length === 0) return selectorCandidates[0] // 降级处理
  
  // 根据质量分数排序
  const scored = validSelectors.map(selector => ({
    selector,
    score: calculateSelectorQuality(selector)
  }))
  
  scored.sort((a, b) => b.score - a.score)
  
  return scored[0].selector
}

/**
 * 生成元素的多个候选选择器
 * @param {Element} element - DOM元素
 * @returns {Array<string>} - 候选选择器数组
 */
export function generateSelectorCandidates(element) {
  if (!element) return []
  
  const candidates = []
  
  try {
    // 候选1: ID选择器
    if (element.id && !hasGarbledCharacters(element.id)) {
      candidates.push(`#${element.id}`)
    }
    
    // 候选2: 标签 + 第一个有效类名
    if (element.className && typeof element.className === 'string') {
      const classes = element.className.trim().split(/\s+/)
        .filter(c => c && !c.startsWith('quanshijie-') && !hasGarbledCharacters(c))
      
      if (classes.length > 0) {
        candidates.push(`${element.tagName.toLowerCase()}.${classes[0]}`)
      }
      
      // 候选3: 标签 + 多个类名
      if (classes.length > 1) {
        candidates.push(`${element.tagName.toLowerCase()}.${classes.slice(0, 2).join('.')}`)
      }
    }
    
    // 候选4: 标签 + 有效属性
    const validAttrs = ['data-testid', 'data-id', 'role', 'name', 'type']
    for (const attr of validAttrs) {
      const value = element.getAttribute(attr)
      if (value && !hasGarbledCharacters(value)) {
        candidates.push(`${element.tagName.toLowerCase()}[${attr}="${value}"]`)
      }
    }
    
    // 候选5: 父元素 + nth-child
    const parent = element.parentElement
    if (parent && parent.tagName !== 'BODY') {
      const siblings = Array.from(parent.children)
      const index = siblings.indexOf(element) + 1
      const parentTag = parent.tagName.toLowerCase()
      candidates.push(`${parentTag} > ${element.tagName.toLowerCase()}:nth-child(${index})`)
      
      // 如果父元素有有效的ID或类名
      if (parent.id && !hasGarbledCharacters(parent.id)) {
        candidates.push(`#${parent.id} > ${element.tagName.toLowerCase()}:nth-child(${index})`)
      } else if (parent.className && typeof parent.className === 'string') {
        const parentClasses = parent.className.trim().split(/\s+/)
          .filter(c => c && !hasGarbledCharacters(c))
        if (parentClasses.length > 0) {
          candidates.push(`.${parentClasses[0]} > ${element.tagName.toLowerCase()}:nth-child(${index})`)
        }
      }
    }
    
    // 候选6: 简单标签名（作为最后的选择）
    candidates.push(element.tagName.toLowerCase())
    
  } catch (error) {
    console.error('[Selector Validator] 生成候选选择器失败:', error)
  }
  
  return candidates
}

/**
 * 使用composable模式导出
 */
export function useSelectorValidator() {
  return {
    hasGarbledCharacters,
    validateSelector,
    cleanSelector,
    calculateSelectorQuality,
    selectBestSelector,
    generateSelectorCandidates
  }
}

