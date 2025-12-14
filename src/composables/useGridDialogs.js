/**
 * useGridDialogs - 对话框状态管理 composable
 * 统一管理 GridView 中的所有对话框状态
 */
import { ref } from 'vue'

export function useGridDialogs() {
  // ========== 对话框状态 ==========
  
  // 网站编辑对话框
  const editingSlot = ref(null)
  const editingDialogType = ref(null)
  const newWebsite = ref({})
  
  // 自定义 HTML 对话框
  const showCustomHtmlDialog = ref(false)
  
  // 重排配置对话框
  const showRearrangeDialog = ref(false)
  
  // 右键菜单
  const contextMenuVisible = ref(false)
  const contextMenuX = ref(0)
  const contextMenuY = ref(0)

  // ========== 对话框控制方法 ==========
  
  /**
   * 打开网站编辑对话框
   */
  const openWebsiteEditDialog = (index, website) => {
    editingSlot.value = index
    editingDialogType.value = 'website'
    if (index === -1) {
      // 新建网站
      newWebsite.value = {
        url: '',
        title: '',
        deviceType: 'desktop',
        padding: 0, // 默认不启用内边距，除非配置了选择器
        muted: false,
        darkMode: false,
        requireModifierForActions: false,
        targetSelectors: [],
        targetSelector: '',
        autoRefreshInterval: 0,
        sessionInstance: 'default'
      }
    }
  }
  
  /**
   * 打开桌面捕获编辑对话框
   */
  const openDesktopCaptureDialog = (index) => {
    editingSlot.value = index
    editingDialogType.value = 'desktop-capture'
  }
  
  /**
   * 关闭编辑对话框
   */
  const closeEditDialog = () => {
    editingSlot.value = null
    editingDialogType.value = null
    newWebsite.value = {}
  }
  
  /**
   * 打开自定义 HTML 对话框
   */
  const openCustomHtmlDialog = () => {
    showCustomHtmlDialog.value = true
  }
  
  /**
   * 关闭自定义 HTML 对话框
   */
  const closeCustomHtmlDialog = () => {
    showCustomHtmlDialog.value = false
  }
  
  /**
   * 打开重排对话框
   */
  const openRearrangeDialog = () => {
    showRearrangeDialog.value = true
  }
  
  /**
   * 关闭重排对话框
   */
  const closeRearrangeDialog = () => {
    showRearrangeDialog.value = false
  }
  
  /**
   * 打开右键菜单
   */
  const openContextMenu = (x, y) => {
    contextMenuX.value = x
    contextMenuY.value = y
    contextMenuVisible.value = true
  }
  
  /**
   * 关闭右键菜单
   */
  const closeContextMenu = () => {
    contextMenuVisible.value = false
  }

  return {
    // 状态
    editingSlot,
    editingDialogType,
    newWebsite,
    showCustomHtmlDialog,
    showRearrangeDialog,
    contextMenuVisible,
    contextMenuX,
    contextMenuY,
    
    // 方法
    openWebsiteEditDialog,
    openDesktopCaptureDialog,
    closeEditDialog,
    openCustomHtmlDialog,
    closeCustomHtmlDialog,
    openRearrangeDialog,
    closeRearrangeDialog,
    openContextMenu,
    closeContextMenu
  }
}

