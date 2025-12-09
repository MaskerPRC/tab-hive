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
        :custom-code-enabled="customCodeEnabled"
        @go-back="handleGoBack"
        @go-forward="handleGoForward"
        @refresh="handleManualRefresh"
        @toggle-mute="handleToggleMute"
        @copy="$emit('copy', index)"
        @open-script-panel="handleOpenScriptPanel"
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
      
      <!-- 证书错误提示（桌面捕获类型不支持，且证书未信任时才显示） -->
      <div
        v-if="item.type !== 'desktop-capture' && loadError && loadError.type === 'certificate' && !isCertificateTrusted"
        class="certificate-error-overlay"
        :class="{ 'with-shadow': showCertificateErrorShadow }"
      >
        <div class="certificate-error-content">
          <div class="certificate-error-icon">🔒</div>
          <h3 class="certificate-error-title">{{ $t('other.certificateError') }}</h3>
          <p class="certificate-error-description">{{ $t('other.certificateErrorDescription') }}</p>
          <p class="certificate-error-hint">{{ $t('other.certificateErrorHint') }}</p>
          <div class="certificate-error-actions">
            <button class="btn-ignore" @click="handleIgnoreCertificateError">
              {{ $t('other.ignoreCertificateError') }}
            </button>
            <button class="btn-reload" @click="handleReload">
              {{ $t('other.reload') }}
            </button>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<script>
import { computed, toRef, watch, ref, onMounted, onBeforeUnmount } from 'vue'
import DragHandle from './DragHandle.vue'
import ResizeHandles from './ResizeHandles.vue'
import DropZone from './DropZone.vue'
import RefreshTimer from './RefreshTimer.vue'
import UrlChangeHint from './UrlChangeHint.vue'
import DesktopCaptureView from './DesktopCaptureView.vue'
import WebsiteCardTitleBar from './WebsiteCardTitleBar.vue'
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
import { useCertificateStorage } from '../composables/useCertificateStorage.js'

export default {
  name: 'WebsiteCard',
  components: {
    DragHandle,
    ResizeHandles,
    DropZone,
    RefreshTimer,
    UrlChangeHint,
    DesktopCaptureView,
    WebsiteCardTitleBar
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

    // 监听去广告配置变化，重新应用到已加载的 webview
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

    // ==================== 错误状态管理 ====================
    const loadError = ref(null)
    const hasCertificateError = ref(false)
    const certificateHash = ref(null)
    const isCertificateTrusted = ref(false)

    // 证书存储管理
    const { 
      isCertificateTrusted: checkCertificateTrusted, 
      trustCertificate,
      getCertificateHashByUrl,
      saveUrlCertificateMapping
    } = useCertificateStorage()

    // 处理加载失败
    const handleLoadFail = (error) => {
      console.log('[WebsiteCard] 加载失败:', error)
      if (error.type === 'certificate') {
        // 保存证书哈希
        if (error.certificateHash) {
          certificateHash.value = error.certificateHash
          // 检查证书是否已信任
          isCertificateTrusted.value = checkCertificateTrusted(error.certificateHash)
          console.log('[WebsiteCard] 证书哈希:', error.certificateHash.substring(0, 16) + '...', '已信任:', isCertificateTrusted.value)
          
          // 如果已信任，只显示红色阴影，不显示提示框
          if (isCertificateTrusted.value) {
            hasCertificateError.value = true
            loadError.value = null // 不显示提示框
          } else {
            // 未信任，显示提示框
            hasCertificateError.value = true
            loadError.value = error
          }
        } else {
          // 没有证书哈希，显示提示框
          hasCertificateError.value = true
          loadError.value = error
        }
      } else {
        loadError.value = error
      }
    }

    // 检查证书错误（在页面加载完成后）
    const checkCertificateError = async () => {
      if (!isElectron.value || !webviewRef.value) {
        return
      }

      try {
        // 检查 webview 的 URL 是否是错误页面
        const currentUrl = getCurrentUrl()
        if (currentUrl && currentUrl.startsWith('chrome-error://')) {
          console.log('[WebsiteCard] 检测到 chrome-error 页面，可能是证书错误')
          hasCertificateError.value = true
          if (!loadError.value) {
            loadError.value = {
              type: 'certificate',
              errorCode: -202,
              errorDescription: 'ERR_CERT_AUTHORITY_INVALID',
              url: currentUrl
            }
          }
          return
        }

        // 检查当前 URL 是否有已保存的证书哈希
        if (currentUrl && (currentUrl.startsWith('http://') || currentUrl.startsWith('https://'))) {
          const savedHash = getCertificateHashByUrl(currentUrl)
          if (savedHash) {
            console.log('[WebsiteCard] 从映射中找到证书哈希:', savedHash.substring(0, 16) + '...')
            certificateHash.value = savedHash
            isCertificateTrusted.value = checkCertificateTrusted(savedHash)
            
            if (isCertificateTrusted.value) {
              // 证书已信任，只显示红色阴影
              hasCertificateError.value = true
              loadError.value = null
              console.log('[WebsiteCard] 证书已信任，只显示红色阴影（从映射检查）')
              return // 不需要继续检查页面内容
            }
          }
        }

        // 尝试执行 JavaScript 检查页面是否有证书警告
        try {
          const result = await executeJavaScript(`
            (function() {
              // 检查页面标题或内容是否包含证书错误信息
              const title = document.title || '';
              const bodyText = document.body ? document.body.innerText || '' : '';
              const hasCertError = title.includes('证书') || 
                                   title.includes('Certificate') ||
                                   title.includes('安全') ||
                                   title.includes('Security') ||
                                   bodyText.includes('证书') ||
                                   bodyText.includes('Certificate') ||
                                   bodyText.includes('NET::ERR_CERT') ||
                                   window.location.href.startsWith('chrome-error://');
              return { hasCertError, url: window.location.href, title };
            })();
          `)
          
          if (result && result.hasCertError) {
            console.log('[WebsiteCard] 检测到证书错误:', result)
            hasCertificateError.value = true
            if (!loadError.value) {
              loadError.value = {
                type: 'certificate',
                errorCode: -202,
                errorDescription: 'ERR_CERT_AUTHORITY_INVALID',
                url: result.url
              }
            }
          } else {
            // 如果之前有证书错误但现在没有了，清除状态
            if (hasCertificateError.value && currentUrl && !currentUrl.startsWith('chrome-error://')) {
              hasCertificateError.value = false
            }
          }
        } catch (jsError) {
          // JavaScript 执行失败，可能是页面还没加载完成或跨域问题
          console.log('[WebsiteCard] 检查证书错误时执行 JavaScript 失败（可能是正常的）:', jsError.message)
        }
      } catch (error) {
        console.error('[WebsiteCard] 检查证书错误失败:', error)
      }
    }

    // 忽略证书错误并继续加载（保存证书哈希到信任列表）
    const handleIgnoreCertificateError = async () => {
      console.log('[WebsiteCard] 忽略证书错误并继续加载')
      
      // 如果存在证书哈希，保存到信任列表
      if (certificateHash.value) {
        trustCertificate(certificateHash.value)
        isCertificateTrusted.value = true
        console.log('[WebsiteCard] 已保存证书哈希到信任列表:', certificateHash.value.substring(0, 16) + '...')
      }
      
      // 隐藏提示框，但保留红色阴影
      loadError.value = null
      hasCertificateError.value = true
      
      if (isElectron.value && webviewRef.value) {
        // 主进程已经设置了自动接受证书错误的处理
        // 这里只需要重新加载页面即可
        try {
          const url = websiteUrl.value
          console.log('[WebsiteCard] 重新加载 URL:', url)
          
          // 先清空，然后重新设置 URL，确保触发新的加载
          webviewRef.value.src = 'about:blank'
          
          // 等待一小段时间确保清空完成
          await new Promise(resolve => setTimeout(resolve, 100))
          
          // 重新设置 URL，此时主进程的证书错误处理会自动接受证书
          webviewRef.value.src = url
        } catch (error) {
          console.error('[WebsiteCard] 重新加载失败:', error)
          // 如果失败，尝试使用 reload
          try {
            webviewRef.value.reload()
          } catch (reloadError) {
            console.error('[WebsiteCard] reload 也失败:', reloadError)
          }
        }
      }
    }

    // 重新加载
    const handleReload = () => {
      console.log('[WebsiteCard] 重新加载')
      loadError.value = null
      handleManualRefresh()
    }

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

    // ==================== 监听器 ====================
    watch(() => props.item.url, (newUrl, oldUrl) => {
      if (newUrl && newUrl !== oldUrl && oldUrl !== undefined) {
        console.log('[WebsiteCard] URL 已更新，刷新 webview:', { oldUrl, newUrl })
        // 清除之前的错误状态（但保留证书哈希，因为可能是同一个证书）
        loadError.value = null
        hasCertificateError.value = false
        certificateHash.value = null
        isCertificateTrusted.value = false
        
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

    // 监听 webview 加载完成，检查证书错误
    watch(() => mainWebviewReady.value, (ready) => {
      if (ready && isElectron.value) {
        // 延迟检查，确保页面完全加载
        setTimeout(() => {
          checkCertificateError()
        }, 1000)
      }
    })

    // 监听主进程的证书错误通知
    onMounted(() => {
      if (isElectron.value && window.electron) {
        const certificateErrorHandler = (data) => {
          console.log('[WebsiteCard] 收到证书错误通知（原始数据）:', data)
          const partition = partitionName.value
          const currentUrl = props.item.url || ''
          
          // 处理 partition 匹配（默认 session 的 partition 可能是 'default' 或 'persist:default'）
          let partitionMatch = false
          if (data.partition === undefined || data.partition === 'default') {
            // 默认 session，partition 可能是 'persist:default' 或 'default'
            partitionMatch = partition === 'persist:default' || partition === 'default'
          } else {
            partitionMatch = data.partition === partition
          }
          
          // 检查 URL 或 hostname 是否匹配（只匹配 hostname，不匹配 port）
          let urlMatch = false
          if (data.hostname) {
            try {
              const currentUrlObj = new URL(currentUrl)
              urlMatch = currentUrlObj.hostname === data.hostname
            } catch (e) {
              // URL 解析失败，尝试简单的字符串匹配
              urlMatch = currentUrl.includes(data.hostname)
            }
          } else if (data.url) {
            try {
              const dataUrlObj = new URL(data.url)
              const currentUrlObj = new URL(currentUrl)
              urlMatch = dataUrlObj.hostname === currentUrlObj.hostname
            } catch (e) {
              urlMatch = currentUrl.includes(data.url)
            }
          }
          
          console.log('[WebsiteCard] 证书错误匹配检查:', {
            dataPartition: data.partition,
            currentPartition: partition,
            dataUrl: data.url,
            dataHostname: data.hostname,
            currentUrl: currentUrl,
            partitionMatch,
            urlMatch
          })
          
          // 检查是否是当前 webview 的证书错误
          if (partitionMatch && urlMatch) {
            console.log('[WebsiteCard] ✓ 匹配成功，设置证书错误状态')
            
            // 保存证书哈希
            if (data.certificateHash) {
              certificateHash.value = data.certificateHash
              // 保存 URL 和证书哈希的映射
              const urlToSave = data.url || currentUrl
              if (urlToSave) {
                saveUrlCertificateMapping(urlToSave, data.certificateHash)
              }
              // 立即检查证书是否已信任
              isCertificateTrusted.value = checkCertificateTrusted(data.certificateHash)
              console.log('[WebsiteCard] 证书哈希:', data.certificateHash.substring(0, 16) + '...', '已信任:', isCertificateTrusted.value)
              
              // 如果已信任，只显示红色阴影，不显示提示框
              if (isCertificateTrusted.value) {
                hasCertificateError.value = true
                loadError.value = null // 不显示提示框
                console.log('[WebsiteCard] 证书已信任，只显示红色阴影')
              } else {
                // 未信任，显示提示框
                handleLoadFail({
                  type: 'certificate',
                  errorCode: -202,
                  errorDescription: data.error || 'ERR_CERT_AUTHORITY_INVALID',
                  url: data.url || currentUrl,
                  certificateHash: data.certificateHash
                })
              }
            } else {
              // 没有证书哈希，显示提示框
              handleLoadFail({
                type: 'certificate',
                errorCode: -202,
                errorDescription: data.error || 'ERR_CERT_AUTHORITY_INVALID',
                url: data.url || currentUrl
              })
            }
          } else {
            console.log('[WebsiteCard] ✗ 不匹配，忽略此证书错误通知', {
              partitionMatch,
              urlMatch
            })
          }
        }
        
        window.electron.on('certificate-error-detected', certificateErrorHandler)
        console.log('[WebsiteCard] ✓ 已注册证书错误监听器')
        
        // 保存处理器以便卸载时清理
        onBeforeUnmount(() => {
          if (window.electron && window.electron.off) {
            window.electron.off('certificate-error-detected', certificateErrorHandler)
            console.log('[WebsiteCard] ✓ 已移除证书错误监听器')
          }
        })
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
      setWebviewRef,
      setBufferWebviewRef,
      setIframeRef,
      handleManualRefresh,
      handleToggleMute,
      handleOpenScriptPanel,
      handleUseCurrentUrl,
      handleIgnoreCertificateError,
      handleReload,
      canGoBack,
      canGoForward,
      handleGoBack,
      handleGoForward,
      isModifierPressed,
      requireModifierForActions,
      showCertificateErrorShadow: props.showCertificateErrorShadow,
      hasCertificateError,
      isCertificateTrusted
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

.certificate-error-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(255, 255, 255, 0.85);
  backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 200;
  padding: 2rem;
  transition: all 0.3s ease;
}

.certificate-error-overlay.with-shadow {
  /* 移除 overlay 上的阴影，只保留 grid-item 上的阴影 */
  box-shadow: none;
}

.grid-item.certificate-error {
  /* 更轻柔、更有质感的红色光晕 */
  box-shadow: inset 0 0 0 1px rgba(239, 68, 68, 0.4),
              0 0 0 2px rgba(239, 68, 68, 0.1),
              0 8px 24px rgba(239, 68, 68, 0.15) !important;
  transition: box-shadow 0.3s ease;
}

.grid-item.dark-mode .certificate-error-overlay {
  background: rgba(26, 26, 26, 0.85);
}

.certificate-error-content {
  max-width: 440px;
  text-align: center;
  padding: 2.5rem 2rem;
  background: white;
  border-radius: 16px;
  /* 更现代的卡片阴影 */
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 
              0 2px 4px -1px rgba(0, 0, 0, 0.06),
              0 20px 25px -5px rgba(0, 0, 0, 0.1), 
              0 10px 10px -5px rgba(0, 0, 0, 0.04);
  border: 1px solid rgba(0,0,0,0.05);
}

.grid-item.dark-mode .certificate-error-content {
  background: #232323;
  color: #e2e8f0;
  border: 1px solid rgba(255,255,255,0.08);
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.3), 
              0 4px 6px -2px rgba(0, 0, 0, 0.2);
}

.certificate-error-icon {
  font-size: 3.5rem;
  margin-bottom: 1.5rem;
  line-height: 1;
  filter: drop-shadow(0 4px 6px rgba(0,0,0,0.1));
}

.certificate-error-title {
  font-size: 1.25rem;
  font-weight: 600;
  margin: 0 0 0.75rem 0;
  color: #1a202c;
  letter-spacing: -0.025em;
}

.grid-item.dark-mode .certificate-error-title {
  color: #f7fafc;
}

.certificate-error-description {
  font-size: 0.95rem;
  margin: 0 0 0.5rem 0;
  color: #4a5568;
  line-height: 1.6;
}

.grid-item.dark-mode .certificate-error-description {
  color: #a0aec0;
}

.certificate-error-hint {
  font-size: 0.85rem;
  margin: 0 0 2rem 0;
  color: #718096;
}

.grid-item.dark-mode .certificate-error-hint {
  color: #718096;
}

.certificate-error-actions {
  display: flex;
  gap: 1rem;
  justify-content: center;
}

.certificate-error-actions button {
  padding: 0.625rem 1.25rem;
  border: none;
  border-radius: 8px;
  font-size: 0.9rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  display: flex;
  align-items: center;
  justify-content: center;
}

.certificate-error-actions button:active {
  transform: translateY(0);
}

.btn-ignore {
  background: #fff5f5;
  color: #c53030;
  border: 1px solid #fed7d7;
}

.btn-ignore:hover {
  background: #feb2b2;
  color: #9b2c2c;
  border-color: #feb2b2;
  transform: translateY(-1px);
  box-shadow: 0 4px 6px rgba(245, 101, 101, 0.2);
}

.grid-item.dark-mode .btn-ignore {
  background: rgba(197, 48, 48, 0.15);
  color: #fc8181;
  border: 1px solid rgba(197, 48, 48, 0.3);
}

.grid-item.dark-mode .btn-ignore:hover {
  background: rgba(197, 48, 48, 0.25);
  border-color: rgba(197, 48, 48, 0.4);
}

.btn-reload {
  background: #ebf8ff;
  color: #3182ce;
  border: 1px solid #bee3f8;
}

.btn-reload:hover {
  background: #90cdf4;
  color: #2c5282;
  border-color: #90cdf4;
  transform: translateY(-1px);
  box-shadow: 0 4px 6px rgba(66, 153, 225, 0.2);
}

.grid-item.dark-mode .btn-reload {
  background: rgba(66, 153, 225, 0.15);
  color: #63b3ed;
  border: 1px solid rgba(66, 153, 225, 0.3);
}

.grid-item.dark-mode .btn-reload:hover {
  background: rgba(66, 153, 225, 0.25);
  border-color: rgba(66, 153, 225, 0.4);
}

.btn-ignore:active,
.btn-reload:active {
  transform: translateY(0);
}
</style>
