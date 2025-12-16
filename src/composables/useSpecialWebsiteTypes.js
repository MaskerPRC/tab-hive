/**
 * 特殊网站类型处理
 * 处理桌面捕获和自定义HTML等特殊类型的网站
 */
import { ref, nextTick } from 'vue'

export function useSpecialWebsiteTypes(emit) {
  // 桌面捕获选择器显示状态
  const showDesktopCaptureSelector = ref(false)
  
  // 自定义 HTML 对话框显示状态
  const showCustomHtmlDialog = ref(false)

  /**
   * 处理桌面捕获源选择
   * @param {Object} params - 包含 source 和 options
   */
  const handleDesktopCaptureSelect = ({ source, options }) => {
    console.log('[useSpecialWebsiteTypes] 选择桌面捕获源:', source, options)
    
    // 关闭选择器
    showDesktopCaptureSelector.value = false
    
    // 关闭当前对话框
    emit('cancel')
    
    // 延迟提交数据，让父组件有时间切换对话框类型
    nextTick(() => {
      const desktopCaptureData = {
        type: 'desktop-capture',
        title: source.name || '桌面捕获',
        url: '', // 桌面捕获不需要URL
        desktopCaptureSourceId: source.id,
        desktopCaptureOptions: {
          autoRefresh: false, // 已移除自动刷新功能
          fitScreen: options.fitScreen || false // 默认false
        },
        padding: 0,
        muted: false,
        targetSelectors: [],
        targetSelector: ''
      }
      
      // 提交数据，父组件会识别类型并切换到桌面捕获对话框
      emit('confirm', desktopCaptureData)
    })
  }

  /**
   * 处理自定义 HTML 确认
   * @param {Object} data - 自定义HTML数据
   */
  const handleCustomHtmlConfirm = (data) => {
    console.log('[useSpecialWebsiteTypes] 自定义 HTML 数据:', data)
    
    // 关闭对话框
    showCustomHtmlDialog.value = false
    
    // 关闭当前对话框
    emit('cancel')
    
    // 延迟提交数据
    nextTick(() => {
      const customHtmlData = {
        type: 'custom-html',
        title: data.title || '自定义网页',
        url: '', // 自定义 HTML 不需要 URL
        html: data.html || '',
        deviceType: 'desktop',
        padding: 0, // 自定义 HTML 默认不需要内边距
        muted: false,
        darkMode: false,
        requireModifierForActions: false,
        targetSelectors: [],
        targetSelector: '',
        autoRefreshInterval: 0,
        sessionInstance: 'default'
      }
      
      // 提交数据
      emit('confirm', customHtmlData)
    })
  }

  return {
    showDesktopCaptureSelector,
    showCustomHtmlDialog,
    handleDesktopCaptureSelect,
    handleCustomHtmlConfirm
  }
}

