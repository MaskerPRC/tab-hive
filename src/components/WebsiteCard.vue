<template>
    <div
    class="grid-item"
    :class="{
      'fullscreen': isFullscreen,
      'hidden': isHidden,
      'empty-slot': !item.url && item.type !== 'desktop-capture',
      'drag-over': isDragOver && isExternalDragging,
      'draggable': true,
      'dragging': isDragging && isCurrentDrag,
      'resizing': isResizing && isCurrentResize,
      'colliding': isColliding && (isCurrentDrag || isCurrentResize),
      'dark-mode': item.darkMode,
      'require-modifier': requireModifierForActions,
      'modifier-pressed': requireModifierForActions && isModifierPressed,
      'certificate-error': hasCertificateError && showCertificateErrorShadow
    }"
    :style="computedItemStyle"
  >
    <!-- 已有网站显示 -->
    <template v-if="item.url || item.type === 'desktop-capture'">
      <!-- 桌面捕获类型 -->
      <DesktopCaptureView
        v-if="item.type === 'desktop-capture'"
        :source-id="item.desktopCaptureSourceId"
        :options="item.desktopCaptureOptions || { fitScreen: false }"
        class="desktop-capture-view"
      />
      
      <!-- 普通网站类型 -->
      <template v-else>
        <!-- 主 webview -->
        <webview
          v-if="isElectron"
          :key="`webview-${item.id}-${item.sessionInstance || 'default'}`"
          :ref="setWebviewRef"
          :id="`webview-${item.id}`"
          :data-webview-id="item.id"
          :partition="partitionName"
          class="website-webview"
          :class="{ 'mobile-view': item.deviceType === 'mobile' }"
          :preload="webviewPreloadPath"
          webpreferences="allowRunningInsecureContent"
        ></webview>

        <!-- 后台缓冲 webview(双缓冲机制) -->
        <webview
          v-if="isElectron && isBufferLoading"
          :key="`webview-buffer-${item.id}-${item.sessionInstance || 'default'}`"
          :ref="setBufferWebviewRef"
          :id="`webview-buffer-${item.id}`"
          :data-webview-id="`buffer-${item.id}`"
          :src="bufferUrl"
          :partition="partitionName"
          class="website-webview buffer-webview"
          :class="{ 'mobile-view': item.deviceType === 'mobile', 'buffer-ready': isBufferReady }"
          :preload="webviewPreloadPath"
          webpreferences="allowRunningInsecureContent"
        ></webview>

        <!-- 非 Electron 环境使用 iframe -->
        <iframe
          v-if="!isElectron"
          :ref="setIframeRef"
          :id="`iframe-${item.id}`"
          :data-website-id="item.id"
          :src="websiteUrl"
          frameborder="0"
          sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-popups-to-escape-sandbox allow-downloads allow-modals"
          class="website-iframe"
          :class="{ 'mobile-view': item.deviceType === 'mobile' }"
          :title="item.title"
          :allow="'autoplay; fullscreen; picture-in-picture'"
        ></iframe>
      </template>
      
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
        :is-electron="isElectron"
        :custom-code-enabled="customCodeEnabled"
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
    CertificateErrorOverlay
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
    }
  },
  emits: ['drag-start', 'drag-over', 'drag-leave', 'drop', 'refresh', 'copy', 'edit', 'fullscreen', 'remove', 'resize-start', 'toggle-mute', 'update-url', 'open-script-panel', 'go-back', 'go-forward', 'certificate-error'],
  setup(props, { emit }) {
    console.log('[WebsiteCard] ========== 组件初始化 ==========')
    console.log('[WebsiteCard] 网站标题:', props.item.title)
    console.log('[WebsiteCard] 网站URL:', props.item.url)
    console.log('[WebsiteCard] 网站ID:', props.item.id)
    
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
      applyAdBlock,
      applyPadding
    } = useWebviewSelector(props, { isElectron, webviewRef, executeJavaScript, adBlockEnabled: computed(() => props.adBlockEnabled) })

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
    } = useUrlChangeDetector(props, { isElectron, getCurrentUrl })

    // ==================== 音频控制 ====================
    const {
      handleToggleMute: handleToggleMuteBase,
      applyMuteState,
      watchMuteState
    } = useWebviewAudio(props, { isElectron, webviewRef })

    // ==================== 自动刷新 ====================
    const itemRef = toRef(props, 'item')
    const isFullscreenRef = toRef(props, 'isFullscreen')

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
    
    // 双缓冲刷新回调
    const handleDoubleBufferRefresh = () => {
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

    const { remainingTime, pauseTimer, resumeTimer } = useAutoRefresh({
      item: itemRef,
      onRefresh: handleDoubleBufferRefresh
    })

    // ==================== 修饰键状态管理 ====================
    const {
      isModifierPressed,
      requireModifierForActions
    } = useModifierKey(props)

    // ==================== 前进后退功能 ====================
    const {
      canGoBack,
      canGoForward,
      checkNavigationState,
      handleGoBack,
      handleGoForward,
      watchIframeLoad
    } = useNavigation(props, { isElectron, webviewRef, iframeRef })

    watchIframeLoad()

    // ==================== 证书错误处理 ====================
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
      
      if (isElectron.value && webviewRef.value) {
        handleDoubleBufferRefresh()
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

    const handleOpenDevTools = () => {
      if (isElectron.value && webviewRef.value) {
        console.log('[WebsiteCard] 打开 DevTools')
        try {
          webviewRef.value.openDevTools()
        } catch (error) {
          console.error('[WebsiteCard] 打开 DevTools 失败:', error)
        }
      }
    }

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
      requireModifierForActions
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

.website-webview {
  width: 100%;
  flex: 1;
  border: none;
  pointer-events: auto !important;
  min-height: 0;
}

.website-iframe {
  width: 100%;
  flex: 1;
  border: none;
  pointer-events: auto !important;
  min-height: 0;
}

.grid-item.dragging .website-webview,
.grid-item.resizing .website-webview,
.grid-item.dragging .website-iframe,
.grid-item.resizing .website-iframe {
  pointer-events: none !important;
}

.website-webview.mobile-view,
.website-iframe.mobile-view {
  max-width: 375px;
  margin: 0 auto;
  border: 2px solid #ddd;
  border-radius: 20px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
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

.buffer-webview {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  visibility: hidden;
  z-index: -1;
  opacity: 0;
}

.buffer-webview.buffer-ready {
  visibility: visible;
  z-index: 10;
  opacity: 1;
}

.grid-item.certificate-error {
  /* 更轻柔、更有质感的红色光晕 */
  box-shadow: inset 0 0 0 1px rgba(239, 68, 68, 0.4),
              0 0 0 2px rgba(239, 68, 68, 0.1),
              0 8px 24px rgba(239, 68, 68, 0.15) !important;
  transition: box-shadow 0.3s ease;
}
</style>
