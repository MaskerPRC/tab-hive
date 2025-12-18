<template>
  <div
    class="grid-item"
    :class="{
      'fullscreen': isFullscreen,
      'hidden': isHidden,
      'empty-slot': !item.url && item.type !== 'desktop-capture' && item.type !== 'custom-html',
      'drag-over': isDragOver && isExternalDragging,
      'draggable': true,
      'dragging': isDragging && isCurrentDrag,
      'resizing': isResizing && isCurrentResize,
      'colliding': isColliding && (isCurrentDrag || isCurrentResize),
      'dark-mode': item.darkMode,
      'require-modifier': requireModifierForActions,
      'modifier-pressed': requireModifierForActions && isModifierPressed,
      'certificate-error': hasCertificateError && showCertificateErrorShadow,
      'custom-html': item.type === 'custom-html'
    }"
    :style="computedItemStyle"
  >
    <!-- 已有网站显示 -->
    <template v-if="item.url || item.type === 'desktop-capture' || item.type === 'custom-html'">
      <!-- 网页内容（始终渲染） -->
      <!-- 桌面捕获类型 -->
      <DesktopCaptureView
        v-if="item.type === 'desktop-capture'"
        :source-id="item.desktopCaptureSourceId"
        :options="item.desktopCaptureOptions || { fitScreen: false }"
        class="desktop-capture-view"
      />
      
      <!-- 自定义 HTML 类型 -->
      <WebsiteCardContentCustomHtml
        v-else-if="item.type === 'custom-html'"
        :item="item"
        :webview-preload-path="webviewPreloadPath"
        :custom-html-data-url="customHtmlDataUrl"
        :set-custom-html-webview-ref="setCustomHtmlWebviewRef"
      />
      
      <!-- 普通网站类型 -->
      <WebsiteCardContentNormal
        v-else
        :item="item"
        :is-electron="isElectron"
        :webview-preload-path="webviewPreloadPath"
        :partition-name="partitionName"
        :website-url="websiteUrl"
        :is-buffer-loading="isBufferLoading"
        :is-buffer-ready="isBufferReady"
        :buffer-url="bufferUrl"
        :set-webview-ref="setWebviewRef"
        :set-buffer-webview-ref="setBufferWebviewRef"
        :set-iframe-ref="setIframeRef"
      />
      
      <!-- 自动化配置覆盖层（在自动化视图中显示） -->
      <WebsiteAutomationPanel
        v-if="isAutomationMode"
        :website-id="item.id"
        :website-name="item.title || item.url"
        :data-mappings="automationData?.dataMappings || []"
        :action-mappings="automationData?.actionMappings || []"
        :dark-mode="item.darkMode"
        :is-selecting-element="isSelectingElement"
        @add-data-mapping="handleAddDataMapping"
        @edit-data-mapping="handleEditDataMapping"
        @delete-data-mapping="handleDeleteDataMapping"
        @add-action-mapping="handleAddActionMapping"
        @edit-action-mapping="handleEditActionMapping"
        @delete-action-mapping="handleDeleteActionMapping"
        @port-mousedown="handlePortMouseDown"
        @start-select-element="handleStartSelectElement"
      />
      
      <!-- 调试信息（开发时可见） -->
      <div v-if="isAutomationMode && false" style="position: absolute; top: 10px; right: 10px; background: red; color: white; padding: 5px; z-index: 1000; font-size: 12px;">
        自动化模式: {{ isAutomationMode }}<br>
        数据映射: {{ automationData?.dataMappings?.length || 0 }}<br>
        交互映射: {{ automationData?.actionMappings?.length || 0 }}
      </div>
      
      
      <!-- 窗口标题栏 -->
      <WebsiteCardTitleBar
        v-if="showTitle"
        :title="item.title"
        :url="item.url"
        :favicon="item.favicon"
        :muted="item.muted || false"
        :can-go-back="canGoBack"
        :can-go-forward="canGoForward"
        :is-desktop-capture="item.type === 'desktop-capture'"
        :is-custom-html="item.type === 'custom-html'"
        :is-electron="isElectron"
        :custom-code-enabled="customCodeEnabled"
        :active-rules-count="activeRulesCount"
        @go-back="handleGoBack"
        @go-forward="handleGoForward"
        @refresh="handleManualRefresh"
        @toggle-mute="handleToggleMute"
        @copy="$emit('copy', index)"
        @open-script-panel="handleOpenScriptPanel"
        @open-devtools="handleOpenDevTools"
        @edit="$emit('edit', index)"
        @fullscreen="$emit('fullscreen', index)"
        @remove="$emit('remove', index)"
        @monitoring="handleMonitoringClick"
      />
      
      <!-- 拖动手柄 -->
      <div class="drag-handle-container">
        <DragHandle
          @mousedown="$emit('drag-start', $event, index)"
          @touchstart="$emit('drag-start', $event, index)"
        />
      </div>
      
      <!-- 拖放区域和提示 -->
      <DropZone
        :is-drag-over="isDragOver"
        :is-external-dragging="isExternalDragging"
        @drag-over="$emit('drag-over', index)"
        @drag-leave="$emit('drag-leave')"
        @drop="$emit('drop', $event, index)"
      />
      
      <!-- 调整大小手柄 -->
      <ResizeHandles
        v-if="!isFullscreen"
        @resize-start="(event, direction) => $emit('resize-start', event, index, direction)"
      />
      
      <!-- 自动刷新倒计时显示 -->
      <RefreshTimer
        v-if="item.type !== 'desktop-capture' && item.autoRefreshInterval > 0"
        :remaining-time="remainingTime"
      />
      
      <!-- URL变化提示按钮 -->
      <UrlChangeHint
        v-if="item.type !== 'desktop-capture' && !isFullscreen"
        :show="showUrlChangeHint"
        @use-current-url="handleUseCurrentUrl"
      />
      
      <!-- 证书错误提示 -->
      <CertificateErrorOverlay
        v-if="item.type !== 'desktop-capture'"
        :show="loadError && loadError.type === 'certificate' && !isCertificateTrusted"
        :show-shadow="showCertificateErrorShadow"
        :dark-mode="item.darkMode"
        @ignore="handleIgnoreCertificateError"
        @reload="handleReload"
      />
      
    </template>
  </div>
</template>

<script>
import { computed, toRef, watch, ref } from 'vue'
import DragHandle from './DragHandle.vue'
import ResizeHandles from './ResizeHandles.vue'
import DropZone from './DropZone.vue'
import RefreshTimer from './RefreshTimer.vue'
import UrlChangeHint from './UrlChangeHint.vue'
import DesktopCaptureView from './DesktopCaptureView.vue'
import WebsiteCardTitleBar from './WebsiteCardTitleBar.vue'
import CertificateErrorOverlay from './CertificateErrorOverlay.vue'
import WebsiteCardContentNormal from './WebsiteCardContentNormal.vue'
import WebsiteCardContentCustomHtml from './WebsiteCardContentCustomHtml.vue'
import WebsiteAutomationPanel from './WebsiteAutomationPanel.vue'
import { useAutoRefresh } from '../composables/useAutoRefresh.js'
import { useIframeSelector } from '../composables/useIframeSelector.js'
import { useWebview } from '../composables/useWebview.js'
import { useDoubleBuffer } from '../composables/useDoubleBuffer.js'
import { useWebviewSelector } from '../composables/useWebviewSelector.js'
import { useUrlChangeDetector } from '../composables/useUrlChangeDetector.js'
import { useWebviewAudio } from '../composables/useWebviewAudio.js'
import { useModifierKey } from '../composables/useModifierKey.js'
import { useNavigation } from '../composables/useNavigation.js'
import { useWebviewSetup } from '../composables/useWebviewSetup.js'
import { useCertificateError } from '../composables/useCertificateError.js'
import { useCustomHtmlWebview } from '../composables/useCustomHtmlWebview.js'
import { useWebviewDevTools } from '../composables/useWebviewDevTools.js'
import { useMonitoringRules } from '../composables/useMonitoringRules.js'

export default {
  name: 'WebsiteCard',
  components: {
    DragHandle,
    ResizeHandles,
    DropZone,
    RefreshTimer,
    UrlChangeHint,
    DesktopCaptureView,
    WebsiteCardTitleBar,
    CertificateErrorOverlay,
    WebsiteCardContentNormal,
    WebsiteCardContentCustomHtml,
    WebsiteAutomationPanel
  },
  props: {
    item: {
      type: Object,
      required: true
    },
    index: {
      type: Number,
      required: true
    },
    itemStyle: {
      type: Object,
      default: () => ({})
    },
    isFullscreen: {
      type: Boolean,
      default: false
    },
    isHidden: {
      type: Boolean,
      default: false
    },
    isDragOver: {
      type: Boolean,
      default: false
    },
    isExternalDragging: {
      type: Boolean,
      default: false
    },
    isDragging: {
      type: Boolean,
      default: false
    },
    isCurrentDrag: {
      type: Boolean,
      default: false
    },
    isResizing: {
      type: Boolean,
      default: false
    },
    isCurrentResize: {
      type: Boolean,
      default: false
    },
    isColliding: {
      type: Boolean,
      default: false
    },
    showTitle: {
      type: Boolean,
      default: false
    },
    refreshOnFullscreenToggle: {
      type: Boolean,
      default: true
    },
    globalMuted: {
      type: Boolean,
      default: false
    },
    adBlockEnabled: {
      type: Boolean,
      default: false
    },
    customCodeEnabled: {
      type: Boolean,
      default: true
    },
    showCertificateErrorShadow: {
      type: Boolean,
      default: true
    },
    // 自动化视图相关
    isAutomationMode: {
      type: Boolean,
      default: false
    },
    automationData: {
      type: Object,
      default: () => ({
        dataMappings: [],
        actionMappings: []
      })
    },
    isSelectingElement: {
      type: Boolean,
      default: false
    }
  },
  emits: ['drag-start', 'drag-over', 'drag-leave', 'drop', 'refresh', 'copy', 'edit', 'fullscreen', 'remove', 'resize-start', 'toggle-mute', 'update-url', 'open-script-panel', 'go-back', 'go-forward', 'certificate-error', 'open-monitoring', 'add-data-mapping', 'edit-data-mapping', 'delete-data-mapping', 'add-action-mapping', 'edit-action-mapping', 'delete-action-mapping', 'port-mousedown', 'start-select-element', 'element-selected'],
  setup(props, { emit }) {
    // ==================== Webview/Iframe 管理 ====================
    const {
      isElectron,
      webviewPreloadPath,
      webviewRef,
      iframeRef,
      mainWebviewReady,
      partitionName,
      setWebviewRef: setWebviewRefBase,
      setIframeRef: setIframeRefBase,
      setupWebviewEvents,
      executeJavaScript,
      getCurrentUrl
    } = useWebview(props, emit)

    // ==================== Iframe 选择器 (非 Electron) ====================
    const {
      setIframeRef: setIframeRefFromComposable,
      getWebsiteUrl: getIframeWebsiteUrl
    } = useIframeSelector(props)

    // 组合 iframe ref 设置
    const setIframeRef = (el) => {
      setIframeRefBase(el)
      setIframeRefFromComposable(el)
    }

    // ==================== 选择器功能 ====================
    const {
      applyDarkMode,
      applySelector,
      watchFullscreenToggle,
      restoreOriginalStyles,
      applyAdBlock,
      applyPadding
    } = useWebviewSelector(props, { isElectron, webviewRef, executeJavaScript, adBlockEnabled: computed(() => props.adBlockEnabled) })

    // ==================== 自定义HTML页面选择器功能 ====================
    // 为自定义HTML页面创建单独的选择器处理逻辑
    const {
      applySelector: applySelectorForCustomHtml,
      restoreOriginalStyles: restoreOriginalStylesForCustomHtml
    } = useWebviewSelector(props, { 
      isElectron, 
      webviewRef: computed(() => customHtmlWebviewRef.value), 
      executeJavaScript: async (code) => {
        if (isElectron.value && customHtmlWebviewRef.value) {
          return await customHtmlWebviewRef.value.executeJavaScript(code)
        }
        return null
      }, 
      adBlockEnabled: computed(() => props.adBlockEnabled) 
    })

    // ==================== 自定义HTML Webview ====================
    const {
      customHtmlWebviewRef,
      canGoBackCustomHtml,
      canGoForwardCustomHtml,
      getCustomHtmlDataUrl,
      setCustomHtmlWebviewRef,
      handleGoBackCustomHtml,
      handleGoForwardCustomHtml,
      handleRefreshCustomHtml,
      handleFullscreenToggle: handleCustomHtmlFullscreenToggle
    } = useCustomHtmlWebview(props, { 
      isElectron, 
      applySelector: applySelectorForCustomHtml, 
      restoreOriginalStyles: restoreOriginalStylesForCustomHtml 
    })

    // 计算自定义HTML的data URL
    const customHtmlDataUrl = computed(() => getCustomHtmlDataUrl(props.item.html))

    // 监听去广告配置变化
    watch(() => props.adBlockEnabled, async (newVal) => {
      console.log('[WebsiteCard] 去广告配置变化:', newVal)
      if (isElectron.value && webviewRef.value) {
        if (newVal) {
          await applyAdBlock(webviewRef.value)
        } else {
          try {
            const removeCode = `(function() {
              const style = document.getElementById('quanshijie-adblock-style');
              if (style) style.remove();
              window.__tabHiveAdBlockInjected = false;
              console.log('[全视界 AdBlock] 去广告已关闭');
            })();`
            await webviewRef.value.executeJavaScript(removeCode)
          } catch (error) {
            console.error('[WebsiteCard] 移除去广告失败:', error)
          }
        }
      }
    })

    // ==================== 双缓冲刷新 ====================
    const {
      isBufferLoading,
      isBufferReady,
      bufferUrl,
      setBufferWebviewRef: setBufferWebviewRefBase,
      refreshWithDoubleBuffer,
      setupBufferWebview
    } = useDoubleBuffer(props, { isElectron, mainWebviewReady })

    // ==================== URL 变化检测 ====================
    const {
      showUrlChangeHint,
      checkUrlChange,
      handleUseCurrentUrl: handleUseCurrentUrlBase
    } = useUrlChangeDetector(props, { isElectron, getCurrentUrl, webviewRef, executeJavaScript })

    // ==================== 音频控制 ====================
    const {
      handleToggleMute: handleToggleMuteBase,
      applyMuteState,
      watchMuteState
    } = useWebviewAudio(props, { isElectron, webviewRef })

    // ==================== 前进后退功能 ====================
    const {
      canGoBack: canGoBackBase,
      canGoForward: canGoForwardBase,
      checkNavigationState: checkNavigationStateBase,
      handleGoBack: handleGoBackBase,
      handleGoForward: handleGoForwardBase,
      watchIframeLoad
    } = useNavigation(props, { isElectron, webviewRef, iframeRef })

    watchIframeLoad()

    // 合并导航状态
    const canGoBack = computed(() => {
      if (props.item.type === 'custom-html') {
        return canGoBackCustomHtml.value
      }
      return canGoBackBase.value
    })

    const canGoForward = computed(() => {
      if (props.item.type === 'custom-html') {
        return canGoForwardCustomHtml.value
      }
      return canGoForwardBase.value
    })

    // 合并导航处理函数
    const handleGoBack = () => {
      if (props.item.type === 'custom-html') {
        handleGoBackCustomHtml()
      } else {
        handleGoBackBase()
      }
    }

    const handleGoForward = () => {
      if (props.item.type === 'custom-html') {
        handleGoForwardCustomHtml()
      } else {
        handleGoForwardBase()
      }
    }

    // 合并的导航状态检查函数（供 useWebviewSetup 使用）
    const checkNavigationState = () => {
      if (props.item.type === 'custom-html') {
        // 自定义HTML的导航状态检查已在useCustomHtmlWebview中处理
      } else {
        checkNavigationStateBase()
      }
    }

    // ==================== 证书错误处理 ====================
    // 计算网站 URL
    const websiteUrl = computed(() => {
      if (props.item.type === 'desktop-capture') {
        return ''
      }
      
      if (!props.item.url) return ''
      
      let url = props.item.url
      
      if (isElectron.value) {
        const separator = url.includes('?') ? '&' : '?'
        url = `${url}${separator}__webview_id__=${props.item.id}`
      } else {
        url = getIframeWebsiteUrl()
      }
      
      return url
    })

    const {
      loadError,
      hasCertificateError,
      isCertificateTrusted,
      handleLoadFail,
      handleIgnoreCertificateError
    } = useCertificateError(props, {
      isElectron,
      websiteUrl,
      webviewRef,
      partitionName,
      getCurrentUrl,
      executeJavaScript,
      mainWebviewReady
    })

    // ==================== Webview 设置 ====================
    const {
      setWebviewRef,
      setBufferWebviewRef
    } = useWebviewSetup(props, {
      isElectron,
      websiteUrl,
      webviewRef,
      setWebviewRefBase,
      setBufferWebviewRefBase,
      setupWebviewEvents,
      applyMuteState,
      applyAdBlock,
      applyDarkMode,
      applySelector,
      applyPadding,
      checkNavigationState,
      checkUrlChange,
      onLoadFail: handleLoadFail
    })

    // ==================== 自动刷新 ====================
    const itemRef = toRef(props, 'item')
    const isFullscreenRef = toRef(props, 'isFullscreen')
    
    // 普通刷新回调（不使用双缓冲）
    const handleSimpleRefresh = () => {
      console.log('[WebsiteCard] 普通刷新（不使用双缓冲）')
      if (webviewRef.value) {
        webviewRef.value.src = websiteUrl.value
      }
    }

    // 双缓冲刷新回调（仅用于配置了自动刷新的页面）
    const handleDoubleBufferRefresh = () => {
      console.log('[WebsiteCard] 双缓冲刷新（配置了自动刷新）')
      refreshWithDoubleBuffer(
        websiteUrl.value,
        partitionName.value,
        () => {
          if (webviewRef.value) {
            webviewRef.value.src = websiteUrl.value
          }
        }
      )
      
      const needSelector = !props.isFullscreen && (
        (props.item.targetSelectors && props.item.targetSelectors.length > 0) ||
        (props.item.targetSelector && props.item.targetSelector.trim())
      )
      setupBufferWebview(() => {
        if (webviewRef.value) {
          webviewRef.value.src = websiteUrl.value
        }
      }, needSelector)
    }

    // 根据是否配置了自动刷新来决定使用哪种刷新方式
    const handleAutoRefreshCallback = () => {
      // 只有配置了自动刷新时才使用双缓冲刷新
      if (props.item.autoRefreshInterval > 0) {
        handleDoubleBufferRefresh()
      } else {
        handleSimpleRefresh()
      }
    }

    const { remainingTime, pauseTimer, resumeTimer } = useAutoRefresh({
      item: itemRef,
      onRefresh: handleAutoRefreshCallback
    })

    // ==================== 修饰键状态管理 ====================
    const {
      isModifierPressed,
      requireModifierForActions
    } = useModifierKey(props)

    // ==================== DevTools ====================
    const { handleOpenDevTools } = useWebviewDevTools(props, { 
      isElectron, 
      webviewRef, 
      customHtmlWebviewRef 
    })

    // ==================== 监听规则管理 ====================
    const {
      activeRulesCount,
      handleMonitoringClick,
      refreshRulesCount
    } = useMonitoringRules(props, emit)

    // ==================== 计算属性 ====================
    const computedItemStyle = computed(() => {
      return { ...props.itemStyle }
    })

    // ==================== 事件处理 ====================
    const handleManualRefresh = () => {
      if (props.item.type === 'desktop-capture') {
        return
      }
      
      console.log('[WebsiteCard] 手动刷新')
      
      // 自定义HTML类型 - 刷新时重新加载原始HTML内容
      if (props.item.type === 'custom-html') {
        handleRefreshCustomHtml(getCustomHtmlDataUrl)
        return
      }
      
      // 普通网站类型
      if (isElectron.value && webviewRef.value) {
        // 只有配置了自动刷新时才使用双缓冲刷新
        if (props.item.autoRefreshInterval > 0) {
          console.log('[WebsiteCard] 使用双缓冲刷新（已配置自动刷新）')
          handleDoubleBufferRefresh()
        } else {
          console.log('[WebsiteCard] 使用普通刷新（未配置自动刷新）')
          handleSimpleRefresh()
        }
      } else if (iframeRef.value) {
        const currentSrc = iframeRef.value.src
        iframeRef.value.src = 'about:blank'
        setTimeout(() => {
          iframeRef.value.src = currentSrc
        }, 10)
      }
    }
    
    const handleToggleMute = () => {
      handleToggleMuteBase(emit, props.index)
    }

    const handleOpenScriptPanel = () => {
      const targetIframe = isElectron.value ? webviewRef.value : iframeRef.value
      emit('open-script-panel', targetIframe)
    }

    const handleUseCurrentUrl = () => {
      handleUseCurrentUrlBase(emit, props.index)
    }

    const handleReload = () => {
      console.log('[WebsiteCard] 重新加载')
      loadError.value = null
      handleManualRefresh()
    }

    // ==================== 自动化面板事件处理 ====================
    const isSelectingElement = ref(false)

    const handleAddDataMapping = (websiteId) => {
      emit('add-data-mapping', websiteId)
    }

    const handleEditDataMapping = (websiteId, mapping) => {
      emit('edit-data-mapping', websiteId, mapping)
    }

    const handleDeleteDataMapping = (websiteId, mappingId) => {
      emit('delete-data-mapping', websiteId, mappingId)
    }

    const handleAddActionMapping = (websiteId) => {
      emit('add-action-mapping', websiteId)
    }

    const handleEditActionMapping = (websiteId, mapping) => {
      emit('edit-action-mapping', websiteId, mapping)
    }

    const handleDeleteActionMapping = (websiteId, mappingId) => {
      emit('delete-action-mapping', websiteId, mappingId)
    }

    const handlePortMouseDown = (event, websiteId, portId, portType) => {
      emit('port-mousedown', event, websiteId, portId, portType)
    }

    const handleStartSelectElement = () => {
      console.log('[WebsiteCard] 开始选择元素，向上传递到 GridView')
      isSelectingElement.value = true
      emit('start-select-element', props.item.id)
    }

    // 监听来自 GridView 的元素选择状态更新
    watch(() => props.isAutomationMode, (newVal) => {
      if (!newVal) {
        // 退出自动化视图时，重置选择状态
        isSelectingElement.value = false
      }
    })

    // 监听元素选择状态（从 GridView 传递下来）
    watch(() => props.isSelectingElement, (newVal) => {
      isSelectingElement.value = newVal
    })

    // 监听 automationData 变化，确保响应式更新
    watch(() => props.automationData, (newData) => {
      console.log('[WebsiteCard] automationData 已更新:', newData)
      console.log('[WebsiteCard] 数据映射数量:', newData?.dataMappings?.length || 0)
      console.log('[WebsiteCard] 交互映射数量:', newData?.actionMappings?.length || 0)
    }, { deep: true, immediate: true })

    // 监听 isAutomationMode 变化
    watch(() => props.isAutomationMode, (newVal) => {
      console.log('[WebsiteCard] isAutomationMode 变化:', newVal, '网站:', props.item.id)
      console.log('[WebsiteCard] 当前 automationData:', props.automationData)
    }, { immediate: true })

    // ==================== 监听器 ====================
    watch(() => props.item.url, (newUrl, oldUrl) => {
      if (newUrl && newUrl !== oldUrl && oldUrl !== undefined) {
        console.log('[WebsiteCard] URL 已更新，刷新 webview:', { oldUrl, newUrl })
        
        if (isElectron.value && webviewRef.value) {
          const newWebsiteUrl = websiteUrl.value
          console.log('[WebsiteCard] 设置新的 webview src:', newWebsiteUrl)
          webviewRef.value.src = newWebsiteUrl
        } else if (!isElectron.value && iframeRef.value) {
          const newWebsiteUrl = websiteUrl.value
          console.log('[WebsiteCard] 设置新的 iframe src:', newWebsiteUrl)
          iframeRef.value.src = newWebsiteUrl
        }
      }
    })
    
    watchMuteState()
    watchFullscreenToggle(isFullscreenRef, props.refreshOnFullscreenToggle, pauseTimer, resumeTimer)

    // 自定义HTML页面全屏切换选择器处理
    watch(isFullscreenRef, async (newVal, oldVal) => {
      await handleCustomHtmlFullscreenToggle(newVal, oldVal, props.refreshOnFullscreenToggle)
    })

    return {
      isElectron,
      webviewPreloadPath,
      websiteUrl,
      partitionName,
      computedItemStyle,
      isBufferLoading,
      isBufferReady,
      bufferUrl,
      remainingTime,
      showUrlChangeHint,
      loadError,
      hasCertificateError,
      isCertificateTrusted,
      customHtmlDataUrl,
      setCustomHtmlWebviewRef,
      setWebviewRef,
      setBufferWebviewRef,
      setIframeRef,
      handleManualRefresh,
      handleToggleMute,
      handleOpenScriptPanel,
      handleOpenDevTools,
      handleUseCurrentUrl,
      handleIgnoreCertificateError,
      handleReload,
      canGoBack,
      canGoForward,
      handleGoBack,
      handleGoForward,
      isModifierPressed,
      requireModifierForActions,
      // 监听规则相关
      activeRulesCount,
      handleMonitoringClick,
      refreshRulesCount,
      // 自动化面板相关
      isSelectingElement,
      handleAddDataMapping,
      handleEditDataMapping,
      handleDeleteDataMapping,
      handleAddActionMapping,
      handleEditActionMapping,
      handleDeleteActionMapping,
      handlePortMouseDown,
      handleStartSelectElement
    }
  }
}
</script>

<style scoped>
.grid-item {
  background: white;
  border-radius: 0.75rem;
  overflow: hidden;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
  position: relative;
  cursor: move;
  border: 1px solid #e2e8f0;
  display: flex;
  flex-direction: column;
}

.grid-item.dark-mode {
  background: #1a1a1a;
}

.grid-item.draggable:hover {
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
}

.grid-item.dragging,
.grid-item.resizing {
  transition: none !important;
}

.grid-item.dragging {
  z-index: 9999 !important;
}

.grid-item.resizing {
  z-index: 9999 !important;
}

.grid-item.colliding {
  box-shadow: 0 0 0 3px rgba(255, 0, 0, 0.5) !important;
  animation: shake 0.3s ease-in-out;
}

@keyframes shake {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-2px); }
  75% { transform: translateX(2px); }
}

.grid-item.hidden {
  display: none;
}

.grid-item.fullscreen {
  position: fixed !important;
  top: 0 !important;
  left: 0 !important;
  width: 100vw !important;
  height: 100vh !important;
  z-index: 9999 !important;
  border-radius: 0;
  box-shadow: none;
  margin: 0;
  padding: 0;
}

.grid-item.drag-over {
  border: 3px dashed var(--primary-color);
  background: var(--primary-light);
  box-shadow: 0 4px 12px rgba(255, 92, 0, 0.3);
}

.drag-handle-container {
  position: absolute;
  top: 0.5rem;
  left: 0.5rem;
  z-index: 150;
  pointer-events: none;
}

.drag-handle-container :deep(.drag-handle) {
  pointer-events: all;
}

.grid-item:hover :deep(.drag-handle) {
  opacity: 1;
}

.grid-item.require-modifier:not(.modifier-pressed):hover :deep(.drag-handle),
.grid-item.require-modifier:not(.modifier-pressed):hover .website-title {
  opacity: 0 !important;
  pointer-events: none !important;
}

.grid-item.dragging :deep(.drag-handle),
.grid-item.resizing :deep(.resize-handle) {
  opacity: 1 !important;
  pointer-events: all !important;
}

.grid-item.dragging .website-title {
  opacity: 1;
}

.grid-item.fullscreen :deep(.drag-handle),
.grid-item.fullscreen .window-title-bar {
  display: none;
}

.grid-item:hover :deep(.resize-handle) {
  opacity: 0.8;
}

.grid-item.require-modifier:not(.modifier-pressed):hover :deep(.resize-handle) {
  opacity: 0 !important;
  pointer-events: none !important;
}

.grid-item:hover :deep(.refresh-timer),
.grid-item:hover :deep(.url-change-hint) {
  opacity: 1;
}

.grid-item.require-modifier:not(.modifier-pressed):hover :deep(.refresh-timer),
.grid-item.require-modifier:not(.modifier-pressed):hover :deep(.url-change-hint) {
  opacity: 0 !important;
  pointer-events: none !important;
}

.grid-item.fullscreen :deep(.refresh-timer),
.grid-item.fullscreen :deep(.url-change-hint) {
  display: none;
}

.grid-item.dragging :deep(.refresh-timer),
.grid-item.resizing :deep(.refresh-timer) {
  opacity: 0.3;
}

.grid-item.certificate-error {
  /* 更轻柔、更有质感的红色光晕 */
  box-shadow: inset 0 0 0 1px rgba(239, 68, 68, 0.4),
              0 0 0 2px rgba(239, 68, 68, 0.1),
              0 8px 24px rgba(239, 68, 68, 0.15) !important;
  transition: box-shadow 0.3s ease;
}

.grid-item.dragging :deep(.website-webview),
.grid-item.resizing :deep(.website-webview),
.grid-item.dragging :deep(.website-iframe),
.grid-item.resizing :deep(.website-iframe),
.grid-item.dragging :deep(.custom-html-webview),
.grid-item.resizing :deep(.custom-html-webview) {
  pointer-events: none !important;
}
</style>
