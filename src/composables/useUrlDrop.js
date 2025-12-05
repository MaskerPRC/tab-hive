/**
 * URL拖放相关的可组合函数
 * 处理从外部拖入URL到网站卡片的逻辑
 */
import { ref } from 'vue'

export function useUrlDrop() {
  const dragOverIndex = ref(null)
  const isDragging = ref(false)

  /**
   * 处理拖入事件
   */
  const handleDragEnter = (event) => {
    // 检查是否是从外部拖入链接
    const types = event.dataTransfer.types
    if (types.includes('text/uri-list') || types.includes('text/plain') || types.includes('text/x-moz-url')) {
      isDragging.value = true
    }
  }

  /**
   * 处理离开视图
   */
  const handleViewDragLeave = (event) => {
    // 检查是否真的离开了grid-view
    if (!event.currentTarget.contains(event.relatedTarget)) {
      isDragging.value = false
      dragOverIndex.value = null
    }
  }

  /**
   * 处理拖过某个元素
   */
  const handleDragOver = (index) => {
    if (isDragging.value) {
      dragOverIndex.value = index
    }
  }

  /**
   * 处理离开某个元素
   */
  const handleDragLeave = (event) => {
    // 检查是否真的离开了当前元素
    // 如果 relatedTarget 是 null 或者不在当前元素内，清除拖放指示
    if (!event.relatedTarget || !event.currentTarget.contains(event.relatedTarget)) {
      dragOverIndex.value = null
    }
  }

  /**
   * 从拖放事件中提取 URL 和标题
   */
  const extractUrlFromDropEvent = (event) => {
    let url = ''
    let title = ''

    // 尝试从不同的数据格式中获取URL
    if (event.dataTransfer.getData('text/uri-list')) {
      url = event.dataTransfer.getData('text/uri-list')
    } else if (event.dataTransfer.getData('text/plain')) {
      url = event.dataTransfer.getData('text/plain')
    } else if (event.dataTransfer.getData('URL')) {
      url = event.dataTransfer.getData('URL')
    }

    // 尝试获取标题
    if (event.dataTransfer.getData('text/x-moz-url')) {
      const mozUrl = event.dataTransfer.getData('text/x-moz-url').split('\n')
      url = mozUrl[0]
      title = mozUrl[1] || ''
    }

    // 清理URL（移除可能的换行符）
    url = url.trim().split('\n')[0]

    // 验证并规范化 URL
    if (url && !url.startsWith('http://') && !url.startsWith('https://')) {
      url = 'https://' + url
    }

    // 如果没有标题，尝试从URL提取
    if (!title && url) {
      try {
        const urlObj = new URL(url)
        title = urlObj.hostname.replace('www.', '')
      } catch (e) {
        title = '新网站'
      }
    }

    return { url, title }
  }

  /**
   * 从文本中提取 URL
   */
  const extractUrlFromText = (text) => {
    if (!text) return null

    // 清理文本
    text = text.trim()

    // 检查是否是 URL
    let url = text
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      // 尝试添加 https://
      url = 'https://' + url
    }

    // 验证 URL 格式
    try {
      new URL(url)
      // 提取标题
      let title = ''
      try {
        const urlObj = new URL(url)
        title = urlObj.hostname.replace('www.', '')
      } catch (e) {
        title = '新网站'
      }
      return { url, title }
    } catch (e) {
      // 不是有效的 URL
      return null
    }
  }

  /**
   * 处理放置事件（在网站卡片上）
   */
  const handleDrop = (event, index, websites, emit) => {
    isDragging.value = false
    dragOverIndex.value = null

    const { url, title } = extractUrlFromDropEvent(event)

    if (!url || !url.startsWith('http')) {
      alert('请拖入有效的网址')
      return
    }

    // 如果已有网站，提示用户
    const currentWebsite = websites[index]
    if (currentWebsite && currentWebsite.url) {
      if (confirm(`是否将 "${currentWebsite.title}" 替换为 "${title}"？`)) {
        emit('update-website', { index, title, url })
      }
    } else {
      // 直接添加新网站
      emit('add-website', { title, url })
    }
  }

  /**
   * 处理空白区域的放置事件（创建新网站）
   */
  const handleDropOnEmpty = (event, emit) => {
    isDragging.value = false
    dragOverIndex.value = null

    const { url, title } = extractUrlFromDropEvent(event)

    if (!url || !url.startsWith('http')) {
      return // 静默失败，不显示错误
    }

    // 直接添加新网站
    emit('add-website', { title, url })
  }

  return {
    dragOverIndex,
    isDragging,
    handleDragEnter,
    handleViewDragLeave,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    handleDropOnEmpty,
    extractUrlFromText
  }
}

