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
    @reselect="(skipInit) => restartSelection(skipInit)"
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
    },
    currentWebsite: {
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
          console.log('[全视界] 扩展已检测到（从缓存）')
          resolve(true)
          return
        }

        const timeout = setTimeout(() => {
          console.log('[全视界] 扩展检测超时')
          resolve(false)
        }, 2000)

        const handler = (event) => {
          if (event.data && event.data.source === 'quanshijie-extension') {
            console.log('[全视界] 收到扩展消息:', event.data.action)
            if (event.data.action === 'extensionLoaded' || event.data.action === 'pong') {
              clearTimeout(timeout)
              window.removeEventListener('message', handler)
              window.__tabHiveExtensionDetected = true
              resolve(true)
            }
          }
        }

        window.addEventListener('message', handler)

        console.log('[全视界] 发送ping消息检测扩展')
        window.postMessage({
          source: 'quanshijie',
          action: 'ping'
        }, '*')
      })
    }

    /**
     * 启动元素选择器（支持 webview 和 iframe）
     */
    const startSelector = async () => {
      console.log('[ElementSelector] startSelector 被调用')
      console.log('[ElementSelector] props.targetIframe:', props.targetIframe)
      console.log('[ElementSelector] props.targetIframe.id:', props.targetIframe?.id)
      console.log('[ElementSelector] props.targetIframe.send 存在:', typeof props.targetIframe?.send)
      
      if (!props.targetIframe) {
        console.error('[全视界] target 不可用')
        emit('cancel')
        return
      }

      const reqId = ++requestId
      console.log('[ElementSelector] 请求ID:', reqId)

      if (isElectron.value) {
        // Electron 环境：使用 webview API
        console.log('[全视界] Electron 环境 - 使用 webview.send 启动元素选择器')

        // Webview 使用 send 方法发送消息
        if (typeof props.targetIframe.send === 'function') {
          // 等待webview加载完成，确保preload脚本已经初始化
          const waitForWebviewReady = () => {
            return new Promise((resolve) => {
              // 检查webview是否已经加载完成（通过检查URL）
              const currentUrl = props.targetIframe.getURL()
              const isDataUrl = currentUrl.startsWith('data:')
              
              // 如果webview已经加载（有URL），等待一小段时间确保preload脚本初始化
              if (currentUrl && currentUrl !== 'about:blank') {
                console.log('[ElementSelector] Webview已加载，URL:', currentUrl.substring(0, 50))
                // 对于data URL，preload脚本初始化可能更快，但仍需要一点时间
                setTimeout(resolve, isDataUrl ? 300 : 500)
                return
              }
              
              // 如果还在加载，等待加载完成事件
              const onLoadFinish = () => {
                props.targetIframe.removeEventListener('did-finish-load', onLoadFinish)
                // 额外等待确保preload脚本初始化
                console.log('[ElementSelector] Webview加载完成，等待preload脚本初始化')
                setTimeout(resolve, 300)
              }
              
              const onDomReady = () => {
                props.targetIframe.removeEventListener('dom-ready', onDomReady)
                console.log('[ElementSelector] Webview DOM就绪，等待preload脚本初始化')
                setTimeout(resolve, 200)
              }
              
              // 同时监听两个事件，哪个先触发就用哪个
              props.targetIframe.addEventListener('did-finish-load', onLoadFinish)
              props.targetIframe.addEventListener('dom-ready', onDomReady)
              
              // 超时保护：最多等待2秒
              setTimeout(() => {
                props.targetIframe.removeEventListener('did-finish-load', onLoadFinish)
                props.targetIframe.removeEventListener('dom-ready', onDomReady)
                console.warn('[ElementSelector] 等待webview加载超时，直接发送消息')
                resolve()
              }, 2000)
            })
          }
          
          // 等待webview准备好
          await waitForWebviewReady()
          
          console.log('[ElementSelector] 调用 webview.send("start-element-selector")')
          props.targetIframe.send('start-element-selector', {
            requestId: reqId
          })
          console.log('[全视界] 已通过 webview.send 发送启动消息')
        } else {
          console.error('[全视界] webview.send 方法不可用')
          console.error('[ElementSelector] targetIframe的方法:', Object.keys(props.targetIframe))
          emit('cancel')
        }
      } else {
        // 浏览器环境：使用 postMessage
        if (!props.targetIframe.contentWindow) {
          console.error('[全视界] iframe.contentWindow 不可用')
          emit('cancel')
          return
        }

        console.log('[全视界] 浏览器环境 - 通过 postMessage 启动元素选择器')
        props.targetIframe.contentWindow.postMessage({
          source: 'quanshijie',
          action: 'startElementSelector',
          requestId: reqId
        }, '*')
        console.log('[全视界] 已发送启动元素选择器消息')
      }
    }

    /**
     * 处理来自 webview 的 IPC 消息
     */
    const handleWebviewMessage = (event) => {
      console.log('[ElementSelector] handleWebviewMessage 被调用')
      console.log('[ElementSelector] event.channel:', event.channel)
      console.log('[ElementSelector] event.args:', event.args)
      
      const channel = event.channel
      const data = event.args && event.args[0]

      if (!data) {
        console.log('[ElementSelector] 没有数据，返回')
        return
      }

      console.log('[ElementSelector] channel:', channel, 'data:', data)

      if (channel === 'element-selector-hover') {
        console.log('[ElementSelector] 处理 hover 消息:', data.selector)
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

        console.log('[全视界] Webview - 更新悬停选择器:', data.selector)
      } else if (channel === 'element-selector-select') {
        console.log('[全视界] ✅ Webview - 接收到选中的元素:', data.selector)

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
        console.log('[全视界] Webview - 用户取消了元素选择')
        cancel()
      }
    }

    /**
     * 处理来自 iframe 的 postMessage 消息
     */
    const handleMessage = (event) => {
      console.log('[全视界] 🔔 message事件触发, source:', event.data?.source, 'data:', event.data)

      if (!event.data) return

      // 调试：记录所有消息
      if (event.data.source === 'quanshijie-extension' || event.data.source === 'quanshijie-electron') {
        console.log('[全视界] 📨 收到消息:', event.data)
      }

      // Chrome扩展消息
      if (event.data.source === 'quanshijie-extension') {
        const { action, selector, rect, elementInfo } = event.data
        console.log('[全视界] 收到Chrome扩展消息:', action, selector)

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
          console.log('[全视界] 接收到选中的元素:', selector)

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
          console.log('[全视界] 用户在iframe中取消了元素选择')
          cancel()
        }
      }

      // Electron消息
      if (event.data.source === 'quanshijie-electron') {
        const { action, selector, rect, elementInfo } = event.data
        console.log('[全视界] 收到Electron消息:', action, '选择器:', selector)

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

          console.log('[全视界] 更新悬停选择器:', selector)
        } else if (action === 'elementSelected') {
          console.log('[全视界] ✅ 接收到选中的元素:', selector)

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
          console.log('[全视界] 用户在iframe中按ESC取消了元素选择')
          cancel()
        } else if (action === 'elementSelectorStarted') {
          console.log('[全视界] Electron元素选择器已在iframe中启动')
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
        console.log('[全视界] 空格键触发选择')
        // TODO: 实现空格键选择逻辑
      }
    }

    /**
     * 停止iframe内的交互式选择（但保持工具栏显示）
     */
    const stopInteractiveSelection = () => {
      console.log('[全视界] 停止iframe内的交互式选择')

      if (isElectron.value) {
        if (props.targetIframe && typeof props.targetIframe.send === 'function') {
          props.targetIframe.send('stop-element-selector', {})
        }
      } else {
        if (props.targetIframe && props.targetIframe.contentWindow) {
          props.targetIframe.contentWindow.postMessage({
            source: 'quanshijie',
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
      console.log('[全视界] 用户确认选择')

      // 多选模式：返回选择器数组
      if (multiSelectMode.value) {
        if (selectedSelectors.value.length === 0) {
          console.warn('[全视界] 多选模式：没有选择器可确认')
          return
        }

        console.log('[全视界] 多选模式：确认', selectedSelectors.value.length, '个选择器')

        // 发送多个选择器
        emit('select', {
          selectors: selectedSelectors.value,
          multiSelect: true
        })
      } else {
        // 单选模式：返回单个选择器
        if (!hoveredSelector.value) {
          console.warn('[全视界] 单选模式：没有选择器可确认')
          return
        }

        console.log('[全视界] 单选模式：确认选择器', hoveredSelector.value)

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
      console.log('[全视界] 用户取消元素选择器')

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
      console.log('[全视界] 切换多选模式:', enabled, '当前hoveredSelector:', hoveredSelector.value)
      
      multiSelectMode.value = enabled
      if (enabled) {
        // 进入多选模式，保留当前已选择的选择器
        if (hoveredSelector.value && hoveredSelector.value.trim()) {
          // 如果当前有选中的选择器，添加到列表中
          selectedSelectors.value = [hoveredSelector.value]
          console.log('[全视界] 切换到多选模式，保留当前选择器:', hoveredSelector.value)
        } else {
          selectedSelectors.value = []
        }
        // 清空当前hover选择器，准备选择下一个
        hoveredSelector.value = ''
        
        // 重新启动交互式选择，进入hover状态（跳过初始化以保留当前状态）
        restartSelection(true)
      } else {
        // 退出多选模式，切换到单选
        if (selectedSelectors.value.length > 0) {
          // 保留第一个选择器
          hoveredSelector.value = selectedSelectors.value[0]
          console.log('[全视界] 切换到单选模式，保留第一个选择器:', hoveredSelector.value)
        }
        selectedSelectors.value = []
        
        // 重新启动交互式选择（跳过初始化以保留当前状态）
        restartSelection(true)
      }
    }

    /**
     * 导航到父/子元素
     */
    const navigateElement = (direction) => {
      console.log('[全视界] 导航元素:', direction)

      if (isElectron.value) {
        if (props.targetIframe && typeof props.targetIframe.send === 'function') {
          props.targetIframe.send('navigate-element', { direction })
        }
      } else {
        if (props.targetIframe && props.targetIframe.contentWindow) {
          props.targetIframe.contentWindow.postMessage({
            source: 'quanshijie',
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
     * @param {boolean} skipInitialize - 是否跳过初始化状态（用于切换多选模式或添加到列表时）
     */
    const restartSelection = (skipInitialize = false) => {
      console.log('[全视界] 重新开始元素选择, skipInitialize:', skipInitialize)

      // 重新初始化选择器状态（基于当前视界配置）
      if (!skipInitialize) {
        initializeSelectorState()
      }

      // 立即清空前端高亮显示（但保留选择器状态）
      hoveredRects.value = []
      selectedRects.value = []
      currentElementInfo.value = null
      
      // 只在非跳过初始化时清空hoveredSelector
      if (!skipInitialize) {
        hoveredSelector.value = ''
      }

      console.log('[全视界] 前端状态已清空', skipInitialize ? '(保留选择器)' : '(完全重置)')

      // 向 iframe/webview 发送清空并重新启动的消息
      if (isElectron.value) {
        if (props.targetIframe && typeof props.targetIframe.send === 'function') {
          // 发送重新启动消息
          props.targetIframe.send('restart-element-selector', {})
          console.log('[全视界] 已向 webview 发送重新启动消息')
        }
      } else {
        if (props.targetIframe && props.targetIframe.contentWindow) {
          // 发送重新启动消息
          props.targetIframe.contentWindow.postMessage({
            source: 'quanshijie',
            action: 'restartElementSelector',
            requestId: ++requestId
          }, '*')
          console.log('[全视界] 已向 iframe 发送重新启动消息')
        }
      }
    }

    /**
     * 初始化
     */
    const initialize = async () => {
      console.log('[ElementSelector] initialize 被调用')
      console.log('[ElementSelector] isElectron:', isElectron.value)
      console.log('[ElementSelector] props.targetIframe:', props.targetIframe)
      
      if (isElectron.value) {
        // Electron 环境：添加 webview IPC 消息监听
        console.log('[ElementSelector] Electron模式初始化')
        if (props.targetIframe && typeof props.targetIframe.addEventListener === 'function') {
          props.targetIframe.addEventListener('ipc-message', handleWebviewMessage)
          console.log('[全视界] 已添加 webview IPC 消息监听器')
        } else {
          console.error('[ElementSelector] webview.addEventListener 不可用')
        }
        console.log('[ElementSelector] 调用 startSelector()')
        startSelector()
      } else {
        // 浏览器环境先检测扩展
        hasExtension.value = await detectExtension()

        if (!hasExtension.value) {
          alert('未检测到全视界 Chrome扩展。\n\n请安装Chrome扩展以使用元素选择器功能。\n\n扩展位置: chrome-extension文件夹')
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
      console.log('[全视界] 开始清理选择器状态和监听器（保留高亮）')

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
            console.log('[全视界] 已移除 webview IPC 消息监听器')
          }

          if (typeof props.targetIframe.send === 'function') {
            props.targetIframe.send('stop-element-selector', {})
            console.log('[全视界] 已发送停止选择器消息到 webview')
          }
        }
      } else {
        // 浏览器环境：发送停止消息到 iframe
        if (props.targetIframe && props.targetIframe.contentWindow) {
          console.log('[全视界] 发送停止选择器消息到 iframe')
          props.targetIframe.contentWindow.postMessage({
            source: 'quanshijie',
            action: 'stopElementSelector',
            requestId: ++requestId
          }, '*')
        }
      }

      console.log('[全视界] 选择器清理完成')
    }

    /**
     * 完全清理（移除所有高亮和状态）
     */
    const completeCleanup = () => {
      console.log('[全视界] 开始完全清理选择器（包括高亮框）')

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
            console.log('[全视界] 已发送完全清理消息到 webview')
          }
        }
      } else {
        // 浏览器环境：发送完全清理消息
        if (props.targetIframe && props.targetIframe.contentWindow) {
          props.targetIframe.contentWindow.postMessage({
            source: 'quanshijie',
            action: 'cleanupElementSelector',
            requestId: ++requestId
          }, '*')
          console.log('[全视界] 已发送完全清理消息到 iframe')
        }
      }

      console.log('[全视界] 完全清理完成')
    }

    // 初始化选择器状态（根据当前视界配置）
    const initializeSelectorState = () => {
      console.log('[全视界] initializeSelectorState 被调用')
      console.log('[全视界] props.currentWebsite:', props.currentWebsite)
      console.log('[全视界] props.isActive:', props.isActive)
      
      if (!props.currentWebsite) {
        console.log('[全视界] 没有当前视界配置，使用默认状态')
        return
      }

      console.log('[全视界] 初始化选择器状态，当前视界配置:', props.currentWebsite)

      // 获取当前视界的选择器配置
      const targetSelectors = props.currentWebsite.targetSelectors && Array.isArray(props.currentWebsite.targetSelectors) && props.currentWebsite.targetSelectors.length > 0
        ? props.currentWebsite.targetSelectors.filter(s => s && s.trim())
        : (props.currentWebsite.targetSelector && props.currentWebsite.targetSelector.trim() ? [props.currentWebsite.targetSelector.trim()] : [])

      console.log('[全视界] 解析的选择器配置:', targetSelectors)

      if (targetSelectors.length > 0) {
        // 预填充选择器
        selectedSelectors.value = [...targetSelectors]
        
        if (targetSelectors.length === 1) {
          // 只有一个选择器，使用单选模式
          multiSelectMode.value = false
          hoveredSelector.value = targetSelectors[0]
          console.log('[全视界] 单选模式，预填充选择器:', targetSelectors[0])
        } else {
          // 多个选择器，使用多选模式
          multiSelectMode.value = true
          console.log('[全视界] 多选模式，预填充选择器:', selectedSelectors.value)
        }
      } else {
        // 没有配置，使用默认状态
        selectedSelectors.value = []
        multiSelectMode.value = false
        hoveredSelector.value = ''
        console.log('[全视界] 使用默认状态（无预配置选择器）')
      }
    }

    // 监听isActive变化
    watch(() => props.isActive, (newVal, oldVal) => {
      console.log('[ElementSelector] ========== isActive 变化 ==========')
      console.log('[ElementSelector] 从', oldVal, '变为', newVal)
      console.log('[ElementSelector] props.targetIframe:', props.targetIframe)
      console.log('[ElementSelector] props.currentWebsite:', props.currentWebsite)
      
      if (newVal && !oldVal) {
        // 从false变为true，先初始化选择器状态，再初始化
        console.log('[ElementSelector] 激活选择器，开始初始化')
        initializeSelectorState()
        initialize()
      } else if (!newVal && oldVal) {
        // 从true变为false，清理
        console.log('[ElementSelector] 取消选择器，开始清理')
        cleanup()
      }
    }, { immediate: true })

    // 监听当前视界配置变化
    watch(() => props.currentWebsite, (newVal, oldVal) => {
      console.log('[全视界] currentWebsite变化:', oldVal, '->', newVal)
      if (props.isActive && newVal) {
        // 如果选择器处于活跃状态且视界配置发生变化，重新初始化状态
        initializeSelectorState()
      }
    }, { deep: true })

    // 生命周期
    onMounted(() => {
      console.log('[ElementSelector] ========== 组件已挂载 ==========')
      console.log('[ElementSelector] 初始 props.isActive:', props.isActive)
      console.log('[ElementSelector] 初始 props.targetIframe:', props.targetIframe)
      console.log('[ElementSelector] 初始 props.currentWebsite:', props.currentWebsite)
      
      messageListener = handleMessage
      keydownListener = handleKeyDown
      spaceKeyListener = handleSpaceKey

      window.addEventListener('message', messageListener)
      document.addEventListener('keydown', keydownListener)
      document.addEventListener('keydown', spaceKeyListener)

      console.log('[全视界] 消息监听器已添加到window')
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
