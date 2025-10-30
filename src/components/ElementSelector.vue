<template>
  <!-- 工具栏组件 -->
  <SelectorToolbar
    :is-active="isActive"
    :selector="hoveredSelector"
    :selectors="selectedSelectors"
    :element-info="currentElementInfo"
    :multi-select-mode="multiSelectMode"
    @cancel="cancel"
    @confirm="confirmSelection"
    @update:selector="updateSelectorManually"
    @update:selectors="updateSelectorsManually"
    @navigate="navigateElement"
    @pause="handlePause"
    @reselect="restartSelection"
    @toggle-multi-select="toggleMultiSelectMode"
  />

  <!-- 高亮显示组件 - 暂时禁用，使用 iframe 内的高亮 -->
  <!-- <ElementHighlighter
    :disabled="!isActive || isPaused"
    :hovered-elements="hoveredRects"
    :selected-elements="selectedRects"
  /> -->
</template>

<script>
import { ref, watch, computed, onMounted, onUnmounted, reactive } from 'vue'
import SelectorToolbar from './SelectorToolbar.vue'
import ElementHighlighter from './ElementHighlighter.vue'

export default {
  name: 'ElementSelector',
  components: {
    SelectorToolbar,
    ElementHighlighter
  },
  props: {
    isActive: {
      type: Boolean,
      default: false
    },
    targetIframe: {
      type: Object,
      default: null
    }
  },
  emits: ['select', 'cancel'],
  setup(props, { emit }) {
    const hoveredSelector = ref('')
    const selectedSelectors = ref([]) // 多选模式：存储多个选择器
    const multiSelectMode = ref(false) // 是否启用多选模式
    const isPaused = ref(false)
    const isElectron = computed(() => window.electron?.isElectron || false)
    const hasExtension = ref(false)
    let messageListener = null
    let keydownListener = null
    let spaceKeyListener = null
    let requestId = 0

    // 当前悬停和选中的元素信息
    const hoveredRects = ref([])
    const selectedRects = ref([])
    const currentElementInfo = ref(null)

    // 元素路径导航
    const elementPath = ref([])
    const pathIndex = ref(0)

    // 鼠标位置记录
    const mousePosition = reactive({ x: 0, y: 0 })

    /**
     * 检测Chrome扩展是否已加载
     */
    const detectExtension = () => {
      return new Promise((resolve) => {
        if (window.__tabHiveExtensionDetected) {
          console.log('[Tab Hive] 扩展已检测到（从缓存）')
          resolve(true)
          return
        }

        const timeout = setTimeout(() => {
          console.log('[Tab Hive] 扩展检测超时')
          resolve(false)
        }, 2000)

        const handler = (event) => {
          if (event.data && event.data.source === 'tab-hive-extension') {
            console.log('[Tab Hive] 收到扩展消息:', event.data.action)
            if (event.data.action === 'extensionLoaded' || event.data.action === 'pong') {
              clearTimeout(timeout)
              window.removeEventListener('message', handler)
              window.__tabHiveExtensionDetected = true
              resolve(true)
            }
          }
        }

        window.addEventListener('message', handler)

        console.log('[Tab Hive] 发送ping消息检测扩展')
        window.postMessage({
          source: 'tab-hive',
          action: 'ping'
        }, '*')
      })
    }

    /**
     * 启动元素选择器（支持 webview 和 iframe）
     */
    const startSelector = () => {
      if (!props.targetIframe) {
        console.error('[Tab Hive] target 不可用')
        emit('cancel')
        return
      }

      const reqId = ++requestId

      if (isElectron.value) {
        // Electron 环境：使用 webview API
        console.log('[Tab Hive] Electron 环境 - 使用 webview.send 启动元素选择器')

        // Webview 使用 send 方法发送消息
        if (typeof props.targetIframe.send === 'function') {
          props.targetIframe.send('start-element-selector', {
            requestId: reqId
          })
          console.log('[Tab Hive] 已通过 webview.send 发送启动消息')
        } else {
          console.error('[Tab Hive] webview.send 方法不可用')
          emit('cancel')
        }
      } else {
        // 浏览器环境：使用 postMessage
        if (!props.targetIframe.contentWindow) {
          console.error('[Tab Hive] iframe.contentWindow 不可用')
          emit('cancel')
          return
        }

        console.log('[Tab Hive] 浏览器环境 - 通过 postMessage 启动元素选择器')
        props.targetIframe.contentWindow.postMessage({
          source: 'tab-hive',
          action: 'startElementSelector',
          requestId: reqId
        }, '*')
        console.log('[Tab Hive] 已发送启动元素选择器消息')
      }
    }

    /**
     * 处理来自 webview 的 IPC 消息
     */
    const handleWebviewMessage = (event) => {
      const channel = event.channel
      const data = event.args && event.args[0]

      if (!data) return

      if (channel === 'element-selector-hover') {
        hoveredSelector.value = data.selector || ''

        // 更新高亮矩形
        if (data.rect) {
          hoveredRects.value = [{
            x: data.rect.x || 0,
            y: data.rect.y || 0,
            width: data.rect.width || 0,
            height: data.rect.height || 0
          }]
        }

        // 更新元素信息
        if (data.elementInfo) {
          currentElementInfo.value = data.elementInfo
        }

        console.log('[Tab Hive] Webview - 更新悬停选择器:', data.selector)
      } else if (channel === 'element-selector-select') {
        console.log('[Tab Hive] ✅ Webview - 接收到选中的元素:', data.selector)

        // 更新选中的元素高亮（不立即发送select事件）
        if (data.rect) {
          selectedRects.value = [{
            x: data.rect.x || 0,
            y: data.rect.y || 0,
            width: data.rect.width || 0,
            height: data.rect.height || 0,
            isActive: true
          }]
        }

        // 保存选择器和元素信息，等待用户确认
        hoveredSelector.value = data.selector
        currentElementInfo.value = data.elementInfo

        // 停止webview内的交互式选择，但保持工具栏显示
        stopInteractiveSelection()
      } else if (channel === 'element-selector-cancel') {
        console.log('[Tab Hive] Webview - 用户取消了元素选择')
        cancel()
      }
    }

    /**
     * 处理来自 iframe 的 postMessage 消息
     */
    const handleMessage = (event) => {
      console.log('[Tab Hive] 🔔 message事件触发, source:', event.data?.source, 'data:', event.data)

      if (!event.data) return

      // 调试：记录所有消息
      if (event.data.source === 'tab-hive-extension' || event.data.source === 'tab-hive-electron') {
        console.log('[Tab Hive] 📨 收到消息:', event.data)
      }

      // Chrome扩展消息
      if (event.data.source === 'tab-hive-extension') {
        const { action, selector, rect, elementInfo } = event.data
        console.log('[Tab Hive] 收到Chrome扩展消息:', action, selector)

        if (action === 'elementHovered') {
          hoveredSelector.value = selector || ''

          // 更新高亮矩形
          if (rect) {
            hoveredRects.value = [{
              x: rect.x || 0,
              y: rect.y || 0,
              width: rect.width || 0,
              height: rect.height || 0
            }]
          }

          // 更新元素信息
          if (elementInfo) {
            currentElementInfo.value = elementInfo
          }
        } else if (action === 'elementSelected') {
          console.log('[Tab Hive] 接收到选中的元素:', selector)

          // 更新选中的元素高亮（不立即发送select事件）
          if (rect) {
            selectedRects.value = [{
              x: rect.x || 0,
              y: rect.y || 0,
              width: rect.width || 0,
              height: rect.height || 0,
              isActive: true
            }]
          }

          // 保存选择器和元素信息，等待用户确认
          hoveredSelector.value = selector
          currentElementInfo.value = elementInfo

          // 停止iframe内的交互式选择，但保持工具栏显示
          stopInteractiveSelection()
        } else if (action === 'elementSelectorCancelled') {
          console.log('[Tab Hive] 用户在iframe中取消了元素选择')
          cancel()
        }
      }

      // Electron消息
      if (event.data.source === 'tab-hive-electron') {
        const { action, selector, rect, elementInfo } = event.data
        console.log('[Tab Hive] 收到Electron消息:', action, '选择器:', selector)

        if (action === 'elementHovered') {
          hoveredSelector.value = selector || ''

          // 更新高亮矩形
          if (rect) {
            hoveredRects.value = [{
              x: rect.x || 0,
              y: rect.y || 0,
              width: rect.width || 0,
              height: rect.height || 0
            }]
          }

          // 更新元素信息
          if (elementInfo) {
            currentElementInfo.value = elementInfo
          }

          console.log('[Tab Hive] 更新悬停选择器:', selector)
        } else if (action === 'elementSelected') {
          console.log('[Tab Hive] ✅ 接收到选中的元素:', selector)

          // 更新选中的元素高亮（不立即发送select事件）
          if (rect) {
            selectedRects.value = [{
              x: rect.x || 0,
              y: rect.y || 0,
              width: rect.width || 0,
              height: rect.height || 0,
              isActive: true
            }]
          }

          // 保存选择器和元素信息，等待用户确认
          hoveredSelector.value = selector
          currentElementInfo.value = elementInfo

          // 停止iframe内的交互式选择，但保持工具栏显示
          stopInteractiveSelection()
        } else if (action === 'elementSelectorCancelled') {
          console.log('[Tab Hive] 用户在iframe中按ESC取消了元素选择')
          cancel()
        } else if (action === 'elementSelectorStarted') {
          console.log('[Tab Hive] Electron元素选择器已在iframe中启动')
        }
      }
    }

    /**
     * 处理ESC键
     */
    const handleKeyDown = (event) => {
      if (event.key === 'Escape' && props.isActive) {
        cancel()
      }
    }

    /**
     * 处理空格键选择
     */
    const handleSpaceKey = (event) => {
      if (event.code === 'Space' && props.isActive && !isPaused.value && !event.repeat) {
        event.preventDefault()
        event.stopPropagation()

        // 触发在当前鼠标位置选择元素
        console.log('[Tab Hive] 空格键触发选择')
        // TODO: 实现空格键选择逻辑
      }
    }

    /**
     * 停止iframe内的交互式选择（但保持工具栏显示）
     */
    const stopInteractiveSelection = () => {
      console.log('[Tab Hive] 停止iframe内的交互式选择')

      if (isElectron.value) {
        if (props.targetIframe && typeof props.targetIframe.send === 'function') {
          props.targetIframe.send('stop-element-selector', {})
        }
      } else {
        if (props.targetIframe && props.targetIframe.contentWindow) {
          props.targetIframe.contentWindow.postMessage({
            source: 'tab-hive',
            action: 'stopElementSelector',
            requestId: ++requestId
          }, '*')
        }
      }
    }

    /**
     * 确认选择（用户点击确认按钮）
     */
    const confirmSelection = () => {
      console.log('[Tab Hive] 用户确认选择')

      // 多选模式：返回选择器数组
      if (multiSelectMode.value) {
        if (selectedSelectors.value.length === 0) {
          console.warn('[Tab Hive] 多选模式：没有选择器可确认')
          return
        }

        console.log('[Tab Hive] 多选模式：确认', selectedSelectors.value.length, '个选择器')

        // 发送多个选择器
        emit('select', {
          selectors: selectedSelectors.value,
          multiSelect: true
        })
      } else {
        // 单选模式：返回单个选择器
        if (!hoveredSelector.value) {
          console.warn('[Tab Hive] 单选模式：没有选择器可确认')
          return
        }

        console.log('[Tab Hive] 单选模式：确认选择器', hoveredSelector.value)

        // 发送单个选择器（保持向后兼容）
        emit('select', {
          selector: hoveredSelector.value,
          selectors: [hoveredSelector.value],
          elementInfo: currentElementInfo.value,
          multiSelect: false
        })
      }

      // 完全清理 iframe 内的选择器（包括高亮框）
      completeCleanup()

      // 触发关闭
      emit('cancel')
    }

    /**
     * 取消选择（用户主动取消，如按ESC键或点击取消按钮）
     */
    const cancel = () => {
      console.log('[Tab Hive] 用户取消元素选择器')

      // 完全清理 iframe 内的选择器（包括高亮框）
      completeCleanup()

      // 然后触发取消事件
      emit('cancel')
    }

    /**
     * 手动更新选择器
     */
    const updateSelectorManually = (selector) => {
      hoveredSelector.value = selector
      // TODO: 验证选择器并更新高亮
    }

    /**
     * 手动更新选择器列表（多选模式）
     */
    const updateSelectorsManually = (selectors) => {
      selectedSelectors.value = selectors
    }

    /**
     * 切换多选模式
     */
    const toggleMultiSelectMode = (enabled) => {
      multiSelectMode.value = enabled
      if (enabled) {
        // 进入多选模式，清空当前选择器
        selectedSelectors.value = []
        hoveredSelector.value = ''
      } else {
        // 退出多选模式，也清空
        selectedSelectors.value = []
        hoveredSelector.value = ''
      }
    }

    /**
     * 导航到父/子元素
     */
    const navigateElement = (direction) => {
      console.log('[Tab Hive] 导航元素:', direction)

      if (isElectron.value) {
        if (props.targetIframe && typeof props.targetIframe.send === 'function') {
          props.targetIframe.send('navigate-element', { direction })
        }
      } else {
        if (props.targetIframe && props.targetIframe.contentWindow) {
          props.targetIframe.contentWindow.postMessage({
            source: 'tab-hive',
            action: 'navigateElement',
            direction
          }, '*')
        }
      }
    }

    /**
     * 暂停/恢复选择器交互
     */
    const handlePause = (paused) => {
      isPaused.value = paused
    }

    /**
     * 重新开始选择（清空当前选择并重新启动交互）
     */
    const restartSelection = () => {
      console.log('[Tab Hive] 重新开始元素选择')

      // 立即清空前端状态和高亮显示
      hoveredSelector.value = ''
      hoveredRects.value = []
      selectedRects.value = []
      currentElementInfo.value = null

      console.log('[Tab Hive] 前端状态已清空')

      // 向 iframe/webview 发送清空并重新启动的消息
      if (isElectron.value) {
        if (props.targetIframe && typeof props.targetIframe.send === 'function') {
          // 发送重新启动消息
          props.targetIframe.send('restart-element-selector', {})
          console.log('[Tab Hive] 已向 webview 发送重新启动消息')
        }
      } else {
        if (props.targetIframe && props.targetIframe.contentWindow) {
          // 发送重新启动消息
          props.targetIframe.contentWindow.postMessage({
            source: 'tab-hive',
            action: 'restartElementSelector',
            requestId: ++requestId
          }, '*')
          console.log('[Tab Hive] 已向 iframe 发送重新启动消息')
        }
      }
    }

    /**
     * 初始化
     */
    const initialize = async () => {
      if (isElectron.value) {
        // Electron 环境：添加 webview IPC 消息监听
        if (props.targetIframe && typeof props.targetIframe.addEventListener === 'function') {
          props.targetIframe.addEventListener('ipc-message', handleWebviewMessage)
          console.log('[Tab Hive] 已添加 webview IPC 消息监听器')
        }
        startSelector()
      } else {
        // 浏览器环境先检测扩展
        hasExtension.value = await detectExtension()

        if (!hasExtension.value) {
          alert('未检测到Tab Hive Chrome扩展。\n\n请安装Chrome扩展以使用元素选择器功能。\n\n扩展位置: chrome-extension文件夹')
          emit('cancel')
          return
        }

        startSelector()
      }
    }

    /**
     * 清理（保留高亮，用于停止交互但保持显示）
     */
    const cleanup = () => {
      console.log('[Tab Hive] 开始清理选择器状态和监听器（保留高亮）')

      // 清理前端状态
      hoveredSelector.value = ''
      hoveredRects.value = []
      selectedRects.value = []
      currentElementInfo.value = null

      if (isElectron.value) {
        // Electron 环境：移除 webview 监听器并发送停止消息
        if (props.targetIframe) {
          if (typeof props.targetIframe.removeEventListener === 'function') {
            props.targetIframe.removeEventListener('ipc-message', handleWebviewMessage)
            console.log('[Tab Hive] 已移除 webview IPC 消息监听器')
          }

          if (typeof props.targetIframe.send === 'function') {
            props.targetIframe.send('stop-element-selector', {})
            console.log('[Tab Hive] 已发送停止选择器消息到 webview')
          }
        }
      } else {
        // 浏览器环境：发送停止消息到 iframe
        if (props.targetIframe && props.targetIframe.contentWindow) {
          console.log('[Tab Hive] 发送停止选择器消息到 iframe')
          props.targetIframe.contentWindow.postMessage({
            source: 'tab-hive',
            action: 'stopElementSelector',
            requestId: ++requestId
          }, '*')
        }
      }

      console.log('[Tab Hive] 选择器清理完成')
    }

    /**
     * 完全清理（移除所有高亮和状态）
     */
    const completeCleanup = () => {
      console.log('[Tab Hive] 开始完全清理选择器（包括高亮框）')

      // 清理前端状态
      hoveredSelector.value = ''
      hoveredRects.value = []
      selectedRects.value = []
      currentElementInfo.value = null

      if (isElectron.value) {
        // Electron 环境：发送完全清理消息
        if (props.targetIframe) {
          if (typeof props.targetIframe.removeEventListener === 'function') {
            props.targetIframe.removeEventListener('ipc-message', handleWebviewMessage)
          }

          if (typeof props.targetIframe.send === 'function') {
            props.targetIframe.send('cleanup-element-selector', {})
            console.log('[Tab Hive] 已发送完全清理消息到 webview')
          }
        }
      } else {
        // 浏览器环境：发送完全清理消息
        if (props.targetIframe && props.targetIframe.contentWindow) {
          props.targetIframe.contentWindow.postMessage({
            source: 'tab-hive',
            action: 'cleanupElementSelector',
            requestId: ++requestId
          }, '*')
          console.log('[Tab Hive] 已发送完全清理消息到 iframe')
        }
      }

      console.log('[Tab Hive] 完全清理完成')
    }

    // 监听isActive变化
    watch(() => props.isActive, (newVal, oldVal) => {
      console.log('[Tab Hive] isActive变化:', oldVal, '->', newVal)
      if (newVal && !oldVal) {
        // 从false变为true，初始化
        initialize()
      } else if (!newVal && oldVal) {
        // 从true变为false，清理
        cleanup()
      }
    })

    // 生命周期
    onMounted(() => {
      console.log('[Tab Hive] ElementSelector组件已挂载，添加事件监听器')
      messageListener = handleMessage
      keydownListener = handleKeyDown
      spaceKeyListener = handleSpaceKey

      window.addEventListener('message', messageListener)
      document.addEventListener('keydown', keydownListener)
      document.addEventListener('keydown', spaceKeyListener)

      console.log('[Tab Hive] 消息监听器已添加到window')
    })

    onUnmounted(() => {
      if (messageListener) {
        window.removeEventListener('message', messageListener)
      }
      if (keydownListener) {
        document.removeEventListener('keydown', keydownListener)
      }
      if (spaceKeyListener) {
        document.removeEventListener('keydown', spaceKeyListener)
      }
    })

    return {
      hoveredSelector,
      selectedSelectors,
      multiSelectMode,
      hoveredRects,
      selectedRects,
      currentElementInfo,
      isPaused,
      cancel,
      confirmSelection,
      updateSelectorManually,
      updateSelectorsManually,
      toggleMultiSelectMode,
      navigateElement,
      handlePause,
      restartSelection
    }
  }
}
</script>

<style scoped>
/* 所有样式已移至子组件 */
</style>
