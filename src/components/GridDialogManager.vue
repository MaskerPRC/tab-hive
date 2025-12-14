<template>
  <div class="grid-dialog-manager">
    <!-- 普通网站编辑对话框 -->
    <WebsiteEditDialog
      :show="editingSlot !== null && editingDialogType === 'website'"
      :editing-index="editingSlot"
      :website="editingSlot !== null && editingSlot !== -1 ? websites[editingSlot] : newWebsite"
      :websites="websites"
      @confirm="handleConfirm"
      @cancel="handleCancel"
    />
    
    <!-- 桌面捕获编辑对话框 -->
    <DesktopCaptureEditDialog
      :show="editingSlot !== null && editingDialogType === 'desktop-capture'"
      :editing-index="editingSlot"
      :desktop-capture="editingSlot !== null && editingSlot !== -1 ? websites[editingSlot] : {}"
      @confirm="handleConfirm"
      @cancel="handleCancel"
    />

    <!-- 自定义 HTML 对话框 -->
    <CustomHtmlDialog
      :show="showCustomHtmlDialog"
      @confirm="handleCustomHtmlConfirm"
      @cancel="handleCustomHtmlCancel"
    />

    <!-- 重排配置对话框 -->
    <RearrangeDialog
      :show="showRearrangeDialog"
      @confirm="handleRearrangeConfirm"
      @cancel="handleRearrangeCancel"
    />

    <!-- 右键菜单 -->
    <CanvasContextMenu
      :visible="contextMenuVisible"
      :x="contextMenuX"
      :y="contextMenuY"
      @add-website="handleContextMenuAddWebsite"
      @add-custom-html="handleContextMenuAddCustomHtml"
      @close="handleContextMenuClose"
    />
  </div>
</template>

<script>
import WebsiteEditDialog from './WebsiteEditDialog.vue'
import DesktopCaptureEditDialog from './DesktopCaptureEditDialog.vue'
import CustomHtmlDialog from './CustomHtmlDialog.vue'
import RearrangeDialog from './RearrangeDialog.vue'
import CanvasContextMenu from './CanvasContextMenu.vue'

/**
 * GridDialogManager - 对话框管理组件
 * 统一管理 GridView 中的所有对话框和右键菜单
 */
export default {
  name: 'GridDialogManager',
  components: {
    WebsiteEditDialog,
    DesktopCaptureEditDialog,
    CustomHtmlDialog,
    RearrangeDialog,
    CanvasContextMenu
  },
  props: {
    // 对话框状态
    editingSlot: {
      type: Number,
      default: null
    },
    editingDialogType: {
      type: String,
      default: null
    },
    newWebsite: {
      type: Object,
      default: () => ({})
    },
    showCustomHtmlDialog: {
      type: Boolean,
      default: false
    },
    showRearrangeDialog: {
      type: Boolean,
      default: false
    },
    contextMenuVisible: {
      type: Boolean,
      default: false
    },
    contextMenuX: {
      type: Number,
      default: 0
    },
    contextMenuY: {
      type: Number,
      default: 0
    },
    
    // 数据
    websites: {
      type: Array,
      required: true
    }
  },
  emits: [
    'confirm-website',
    'cancel-edit',
    'confirm-custom-html',
    'cancel-custom-html',
    'confirm-rearrange',
    'cancel-rearrange',
    'context-add-website',
    'context-add-custom-html',
    'close-context-menu'
  ],
  setup(props, { emit }) {
    // ========== 事件处理 ==========
    
    const handleConfirm = (websiteData) => {
      emit('confirm-website', websiteData)
    }
    
    const handleCancel = () => {
      emit('cancel-edit')
    }
    
    const handleCustomHtmlConfirm = (data) => {
      emit('confirm-custom-html', data)
    }
    
    const handleCustomHtmlCancel = () => {
      emit('cancel-custom-html')
    }
    
    const handleRearrangeConfirm = (config) => {
      emit('confirm-rearrange', config)
    }
    
    const handleRearrangeCancel = () => {
      emit('cancel-rearrange')
    }
    
    const handleContextMenuAddWebsite = () => {
      emit('context-add-website')
    }
    
    const handleContextMenuAddCustomHtml = () => {
      emit('context-add-custom-html')
    }
    
    const handleContextMenuClose = () => {
      emit('close-context-menu')
    }

    return {
      handleConfirm,
      handleCancel,
      handleCustomHtmlConfirm,
      handleCustomHtmlCancel,
      handleRearrangeConfirm,
      handleRearrangeCancel,
      handleContextMenuAddWebsite,
      handleContextMenuAddCustomHtml,
      handleContextMenuClose
    }
  }
}
</script>

<style scoped>
.grid-dialog-manager {
  /* 该组件不需要样式，只是作为对话框容器 */
}
</style>




