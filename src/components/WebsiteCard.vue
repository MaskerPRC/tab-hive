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
      'modifier-pressed': requireModifierForActions && isModifierPressed
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
          allowpopups
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
          allowpopups
          webpreferences="allowRunningInsecureContent"
        ></webview>

        <!-- 非 Electron 环境使用 iframe -->
        <iframe
          v-if="!isElectron"
          :ref="setIframeRef"
          :src="websiteUrl"
          frameborder="0"
          sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-popups-to-escape-sandbox allow-downloads allow-modals"
          class="website-iframe"
          :class="{ 'mobile-view': item.deviceType === 'mobile' }"
          :title="item.title"
          :allow="'autoplay; fullscreen; picture-in-picture'"
        ></iframe>
      </template>
      
      <!-- 拖动手柄和标题区域 -->
      <div class="drag-title-container">
        <DragHandle
          @mousedown="$emit('drag-start', $event, index)"
          @touchstart="$emit('drag-start', $event, index)"
        />
        <div v-if="showTitle" class="website-title">
          {{ item.title }}
        </div>
      </div>
      
      <!-- 拖放区域和提示 -->
      <DropZone
        :is-drag-over="isDragOver"
        :is-external-dragging="isExternalDragging"
        @drag-over="$emit('drag-over', index)"
        @drag-leave="$emit('drag-leave')"
        @drop="$emit('drop', $event, index)"
      />
      
      <!-- 非全屏模式下的浮动按钮（桌面捕获类型也显示，但不支持某些操作） -->
      <FloatingActions
        v-if="!isFullscreen"
        :muted="item.muted || false"
        :require-modifier="requireModifierForActions"
        :is-modifier-pressed="isModifierPressed"
        :custom-code-enabled="customCodeEnabled"
        :can-go-back="canGoBack"
        :can-go-forward="canGoForward"
        @refresh="handleManualRefresh"
        @toggle-mute="handleToggleMute"
        @copy="$emit('copy', index)"
        @open-script-panel="handleOpenScriptPanel"
        @edit="$emit('edit', index)"
        @fullscreen="$emit('fullscreen', index)"
        @remove="$emit('remove', index)"
        @go-back="handleGoBack"
        @go-forward="handleGoForward"
      />
      <!-- 桌面捕获类型禁用刷新（因为不支持） -->

      <!-- 调整大小手柄（全屏状态下隐藏，因为拖动整个软件边框就可以调整大小） -->
      <ResizeHandles
        v-if="!isFullscreen"
        @resize-start="(event, direction) => $emit('resize-start', event, index, direction)"
      />
      
      <!-- 自动刷新倒计时显示（桌面捕获类型不支持） -->
      <RefreshTimer
        v-if="item.type !== 'desktop-capture' && item.autoRefreshInterval > 0"
        :remaining-time="remainingTime"
      />
      
      <!-- URL变化提示按钮（桌面捕获类型不支持） -->
      <UrlChangeHint
        v-if="item.type !== 'desktop-capture' && !isFullscreen"
        :show="showUrlChangeHint"
        @use-current-url="handleUseCurrentUrl"
      />
    </template>
  </div>
</template>

<script>
import { computed, toRef, watch } from 'vue'
import FloatingActions from './FloatingActions.vue'
import DragHandle from './DragHandle.vue'
import ResizeHandles from './ResizeHandles.vue'
import DropZone from './DropZone.vue'
import RefreshTimer from './RefreshTimer.vue'
import UrlChangeHint from './UrlChangeHint.vue'
import DesktopCaptureView from './DesktopCaptureView.vue'
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

export default {
  name: 'WebsiteCard',
  components: {
    FloatingActions,
    DragHandle,
    ResizeHandles,
    DropZone,
    RefreshTimer,
    UrlChangeHint,
    DesktopCaptureView
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
    }
  },
  emits: ['drag-start', 'drag-over', 'drag-leave', 'drop', 'refresh', 'copy', 'edit', 'fullscreen', 'remove', 'resize-start', 'toggle-mute', 'update-url', 'open-script-panel', 'go-back', 'go-forward'],
  setup(props, { emit }) {
    console.log('[WebsiteCard] ========== 组件初始化 ==========')
    console.log('[WebsiteCard] 网站标题:', props.item.title)
    console.log('[WebsiteCard] 网站URL:', props.item.url)
    console.log('[WebsiteCard] 网站ID:', props.item.id)
    console.log('[WebsiteCard] 索引:', props.index)
    console.log('[WebsiteCard] 完整item:', props.item)
    
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
      applySelector: applyIframeSelector,
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
      restoreOriginalStyles,
      watchFullscreenToggle,
      applyAdBlock,
      applyPadding
    } = useWebviewSelector(props, { isElectron, webviewRef, executeJavaScript, adBlockEnabled: computed(() => props.adBlockEnabled) })

    // 监听去广告配置变化，重新应用到已加载的 webview
    watch(() => props.adBlockEnabled, async (newVal) => {
      console.log('[WebsiteCard] 去广告配置变化:', newVal)
      if (isElectron.value && webviewRef.value) {
        if (newVal) {
          // 启用去广告
          await applyAdBlock(webviewRef.value)
        } else {
          // 关闭去广告 - 移除样式和标记
          try {
            const removeCode = `(function() {
              const style = document.getElementById('tabhive-adblock-style');
              if (style) style.remove();
              window.__tabHiveAdBlockInjected = false;
              console.log('[Tab Hive AdBlock] 去广告已关闭');
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
      // 桌面捕获类型不需要URL
      if (props.item.type === 'desktop-capture') {
        return ''
      }
      
      if (!props.item.url) return ''
      
      let url = props.item.url
      
      // Electron 环境下，为 webview 添加 ID 参数
      if (isElectron.value) {
        const separator = url.includes('?') ? '&' : '?'
        url = `${url}${separator}__webview_id__=${props.item.id}`
      } else {
        // 非 Electron 环境，使用 iframe URL 处理
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
          // 直接设置 webview 的 src 来刷新，避免调用 reload() 导致重新初始化
          if (webviewRef.value) {
            webviewRef.value.src = websiteUrl.value
          }
        }
      )
      
      // 设置缓冲 webview 加载完成回调
      const needSelector = !props.isFullscreen && (
        (props.item.targetSelectors && props.item.targetSelectors.length > 0) ||
        (props.item.targetSelector && props.item.targetSelector.trim())
      )
      setupBufferWebview(() => {
        // 直接设置 webview 的 src 来刷新，避免调用 reload() 导致重新初始化
        if (webviewRef.value) {
          webviewRef.value.src = websiteUrl.value
        }
      }, needSelector)
    }

    const { remainingTime, resetTimer, pauseTimer, resumeTimer } = useAutoRefresh({
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

    // 初始化 iframe 加载监听
    watchIframeLoad()

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
      checkUrlChange
    })

    // ==================== 计算属性 ====================

    // 计算样式（内边距现在在网页内部应用）
    const computedItemStyle = computed(() => {
      return { ...props.itemStyle }
    })

    // ==================== 事件处理 ====================

    // 手动刷新
    const handleManualRefresh = () => {
      // 桌面捕获类型不支持刷新
      if (props.item.type === 'desktop-capture') {
        return
      }
      
      console.log('[WebsiteCard] 手动刷新')
      
      if (isElectron.value && webviewRef.value) {
        // 使用双缓冲刷新
        handleDoubleBufferRefresh()
      } else if (iframeRef.value) {
        // iframe 刷新 - 直接重新加载 iframe
        const currentSrc = iframeRef.value.src
        iframeRef.value.src = 'about:blank'
        setTimeout(() => {
          iframeRef.value.src = currentSrc
        }, 10)
      }
    }
    
    // 切换静音
    const handleToggleMute = () => {
      handleToggleMuteBase(emit, props.index)
    }

    // 打开脚本面板
    const handleOpenScriptPanel = () => {
      // 获取目标 iframe/webview
      const targetIframe = isElectron.value ? webviewRef.value : iframeRef.value
      emit('open-script-panel', targetIframe)
    }

    // 使用当前 URL
    const handleUseCurrentUrl = () => {
      handleUseCurrentUrlBase(emit, props.index)
    }

    // ==================== 监听器 ====================

    // 监听 URL 变化，更新 webview
    watch(() => props.item.url, (newUrl, oldUrl) => {
      // 只在 URL 真正变化时更新（不是初始化时）
      if (newUrl && newUrl !== oldUrl && oldUrl !== undefined) {
        console.log('[WebsiteCard] URL 已更新，刷新 webview:', { oldUrl, newUrl })
        
        if (isElectron.value && webviewRef.value) {
          // 更新 webview 的 src
          const newWebsiteUrl = websiteUrl.value
          console.log('[WebsiteCard] 设置新的 webview src:', newWebsiteUrl)
          // 直接设置新的 URL
          webviewRef.value.src = newWebsiteUrl
        } else if (!isElectron.value && iframeRef.value) {
          // 更新 iframe 的 src
          const newWebsiteUrl = websiteUrl.value
          console.log('[WebsiteCard] 设置新的 iframe src:', newWebsiteUrl)
          iframeRef.value.src = newWebsiteUrl
        }
      }
    })
    
    // 监听静音状态变化
    watchMuteState()

    // 监听全屏状态变化
    watchFullscreenToggle(isFullscreenRef, props.refreshOnFullscreenToggle, pauseTimer, resumeTimer)

    return {
      // 计算属性
      isElectron,
      webviewPreloadPath,
      websiteUrl,
      partitionName,
      computedItemStyle,
      
      // 双缓冲状态
      isBufferLoading,
      isBufferReady,
      bufferUrl,
      
      // 自动刷新
      remainingTime,
      
      // URL 变化提示
      showUrlChangeHint,
      
      // Ref 设置方法
      setWebviewRef,
      setBufferWebviewRef,
      setIframeRef,
      
      // 事件处理方法
      handleManualRefresh,
      handleToggleMute,
      handleOpenScriptPanel,
      handleUseCurrentUrl,
      
      // 前进后退
      canGoBack,
      canGoForward,
      handleGoBack,
      handleGoForward,
      
      // 修饰键状态
      isModifierPressed,
      requireModifierForActions
    }
  }
}
</script>

<style scoped>
.grid-item {
  background: white;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  position: relative;
  cursor: move;
  border: solid 1px #FF5C00;
}

/* 暗色模式下的背景 */
.grid-item.dark-mode {
  background: #1a1a1a;
}

.grid-item.draggable:hover {
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
}

/* 拖动和调整大小时禁用所有动画 */
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

/* 碰撞时的视觉反馈 */
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

/* Webview 样式 */
.website-webview {
  width: 100%;
  height: 100%;
  border: none;
  /* 确保 webview 总是能接收所有鼠标事件（右键菜单、前进后退等） */
  pointer-events: auto !important;
}

/* Iframe 样式(非 Electron 环境) */
.website-iframe {
  width: 100%;
  height: 100%;
  border: none;
  /* 确保 iframe 总是能接收所有鼠标事件 */
  pointer-events: auto !important;
}

/* 内边距现在在网页内部应用，不再需要外侧样式 */

/* 拖动或调整大小时,禁用 webview/iframe 的鼠标事件 */
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

/* 拖动手柄和标题容器 */
.drag-title-container {
  position: absolute;
  top: 8px;
  left: 8px;
  display: flex;
  align-items: center;
  gap: 8px;
  z-index: 150;
  pointer-events: none;
}

.drag-title-container :deep(.drag-handle) {
  pointer-events: all;
}

/* 网站标题样式 */
.website-title {
  background: rgba(255, 92, 0, 0.9);
  color: white;
  padding: 6px 12px;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 500;
  white-space: nowrap;
  max-width: 200px;
  overflow: hidden;
  text-overflow: ellipsis;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
  opacity: 0;
  transition: opacity 0.2s;
  pointer-events: none;
  backdrop-filter: blur(4px);
}

/* 悬停时显示拖动手柄和标题 */
.grid-item:hover :deep(.drag-handle) {
  opacity: 1;
}

.grid-item:hover .website-title {
  opacity: 1;
}

/* 如果需要修饰键但未按下，即使在悬停时也不显示拖动手柄和标题 */
.grid-item.require-modifier:not(.modifier-pressed):hover :deep(.drag-handle),
.grid-item.require-modifier:not(.modifier-pressed):hover .website-title {
  opacity: 0 !important;
  pointer-events: none !important;
}

/* 拖动时保持手柄和标题可见（不受修饰键影响） */
.grid-item.dragging :deep(.drag-handle),
.grid-item.resizing :deep(.resize-handle) {
  opacity: 1 !important;
  pointer-events: all !important;
}

.grid-item.dragging .website-title {
  opacity: 1;
}

/* 全屏模式下隐藏拖动手柄和标题 */
.grid-item.fullscreen :deep(.drag-handle),
.grid-item.fullscreen .website-title {
  display: none;
}

/* 悬停时显示浮动操作按钮 */
.grid-item:hover :deep(.floating-actions) {
  opacity: 1;
  pointer-events: all;
}

/* 如果需要修饰键但未按下，即使在悬停时也不显示 */
.grid-item:hover :deep(.floating-actions.require-modifier:not(.modifier-pressed)) {
  opacity: 0 !important;
  pointer-events: none !important;
}

/* 悬停时显示调整大小手柄 */
.grid-item:hover :deep(.resize-handle) {
  opacity: 0.8;
}

/* 如果需要修饰键但未按下，即使在悬停时也不显示调整大小手柄 */
.grid-item.require-modifier:not(.modifier-pressed):hover :deep(.resize-handle) {
  opacity: 0 !important;
  pointer-events: none !important;
}

/* 悬停时显示倒计时和URL提示 */
.grid-item:hover :deep(.refresh-timer),
.grid-item:hover :deep(.url-change-hint) {
  opacity: 1;
}

/* 如果需要修饰键但未按下，即使在悬停时也不显示倒计时和URL提示 */
.grid-item.require-modifier:not(.modifier-pressed):hover :deep(.refresh-timer),
.grid-item.require-modifier:not(.modifier-pressed):hover :deep(.url-change-hint) {
  opacity: 0 !important;
  pointer-events: none !important;
}

/* 全屏模式下隐藏倒计时和URL提示 */
.grid-item.fullscreen :deep(.refresh-timer),
.grid-item.fullscreen :deep(.url-change-hint) {
  display: none;
}

/* 拖动或调整大小时降低倒计时透明度 */
.grid-item.dragging :deep(.refresh-timer),
.grid-item.resizing :deep(.refresh-timer) {
  opacity: 0.3;
}

/* 双缓冲 webview 样式 */
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
</style>
