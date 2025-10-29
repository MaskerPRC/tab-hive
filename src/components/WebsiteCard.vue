<template>
  <div
    class="grid-item"
    :class="{
      'fullscreen': isFullscreen,
      'hidden': isHidden,
      'empty-slot': !item.url,
      'drag-over': isDragOver && isExternalDragging,
      'draggable': true,
      'dragging': isDragging && isCurrentDrag,
      'resizing': isResizing && isCurrentResize,
      'colliding': isColliding && (isCurrentDrag || isCurrentResize)
    }"
    :style="computedItemStyle"
    :data-padding="item.padding || null"
  >
    <!-- 已有网站显示 -->
    <template v-if="item.url">
      <!-- 主 webview -->
      <webview
        v-if="isElectron"
        :key="`webview-${item.id}-${item.sessionInstance || 'default'}`"
        :ref="setWebviewRef"
        :id="`webview-${item.id}`"
        :data-webview-id="item.id"
        :src="websiteUrl"
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
      
      <!-- 非全屏模式下的浮动按钮 -->
      <FloatingActions
        v-if="!isFullscreen"
        :muted="item.muted || false"
        @refresh="handleManualRefresh"
        @toggle-mute="handleToggleMute"
        @copy="$emit('copy', index)"
        @edit="$emit('edit', index)"
        @fullscreen="$emit('fullscreen', index)"
        @remove="$emit('remove', index)"
      />

      <!-- 调整大小手柄 -->
      <ResizeHandles
        @resize-start="(event, direction) => $emit('resize-start', event, index, direction)"
      />
      
      <!-- 自动刷新倒计时显示 -->
      <div v-if="item.autoRefreshInterval > 0 && remainingTime > 0" class="refresh-timer">
        <svg class="timer-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 6V12L16 14" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
          <circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="2"/>
        </svg>
        <span class="timer-text">{{ formatTime(remainingTime) }}</span>
      </div>
      
      <!-- URL变化提示按钮 -->
      <div v-if="showUrlChangeHint && !isFullscreen" class="url-change-hint">
        <button class="btn-use-current-url" @click="handleUseCurrentUrl" title="使用当前显示的网页地址">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
            <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
          </svg>
          <span>使用此网页</span>
        </button>
      </div>
    </template>
  </div>
</template>

<script>
import { computed, toRef, ref, nextTick, watch, onMounted, onBeforeUnmount } from 'vue'
import FloatingActions from './FloatingActions.vue'
import DragHandle from './DragHandle.vue'
import ResizeHandles from './ResizeHandles.vue'
import DropZone from './DropZone.vue'
import { useAutoRefresh } from '../composables/useAutoRefresh.js'
import { useIframeSelector } from '../composables/useIframeSelector.js'
import { useSessionManager } from '../composables/useSessionManager.js'

export default {
  name: 'WebsiteCard',
  components: {
    FloatingActions,
    DragHandle,
    ResizeHandles,
    DropZone
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
    }
  },
  emits: ['drag-start', 'drag-over', 'drag-leave', 'drop', 'refresh', 'copy', 'edit', 'fullscreen', 'remove', 'resize-start', 'toggle-mute', 'update-url'],
  setup(props, { emit }) {
    // 检测是否在 Electron 环境
    const isElectron = computed(() => {
      return window.electron && window.electron.isElectron
    })

    // Webview preload 脚本路径
    const webviewPreloadPath = computed(() => {
      // 从 electron API 获取预先计算好的路径
      return window.electron?.webviewPreloadPath || ''
    })

    // 双缓冲相关状态
    const isBufferLoading = ref(false)
    const isBufferReady = ref(false)
    const bufferUrl = ref('')
    const bufferWebviewRef = ref(null)
    const webviewRef = ref(null)
    const iframeRef = ref(null)
    const currentUrl = ref('')
    const showUrlChangeHint = ref(false)
    
    // 设置 webview 引用
    const setWebviewRef = (el) => {
      webviewRef.value = el
      if (el) {
        setupWebviewEvents(el, false)
        // 在 webview 准备好后应用静音状态
        el.addEventListener('dom-ready', () => {
          applyMuteState(el)
        }, { once: true })
      }
    }
    
    // 设置缓冲 webview 引用
    const setBufferWebviewRef = (el) => {
      bufferWebviewRef.value = el
      if (el) {
        setupWebviewEvents(el, true)
      }
    }

    // 使用 iframe 选择器 composable (用于非 Electron 环境)
    const {
      setIframeRef,
      applySelector: applyIframeSelector,
      getWebsiteUrl: getIframWebsiteUrl
    } = useIframeSelector(props)
    
    // Session管理
    const { getPartitionName } = useSessionManager()
    
    // 计算partition名称
    const partitionName = computed(() => {
      const instanceId = props.item.sessionInstance || 'default'
      return getPartitionName(instanceId)
    })
    
    // 主 webview 加载完成标志
    const mainWebviewReady = ref(false)

    // 计算网站 URL
    const websiteUrl = computed(() => {
      if (!props.item.url) return ''
      
      let url = props.item.url
      
      // Electron 环境下,为 webview 添加 ID 参数
      if (isElectron.value) {
        const separator = url.includes('?') ? '&' : '?'
        url = `${url}${separator}__webview_id__=${props.item.id}`
      } else {
        // 非 Electron 环境,使用 iframe URL 处理
        url = getIframWebsiteUrl()
      }
      
      return url
    })

    // 设置 webview 事件监听
    const setupWebviewEvents = (webview, isBuffer) => {
      console.log('[WebsiteCard] 设置 webview 事件监听:', isBuffer ? 'buffer' : 'main')

      // 监听加载完成
      webview.addEventListener('did-finish-load', async () => {
        console.log('[WebsiteCard] Webview 加载完成:', isBuffer ? 'buffer' : 'main')
        
        if (!isBuffer) {
          mainWebviewReady.value = true
        }

        // 应用暗色主题(如果需要)
        if (props.item.darkMode) {
          await applyDarkMode(webview)
        }

        // 应用选择器(如果需要)
        if (!props.isFullscreen && props.item.targetSelector) {
          await applySelector(webview, isBuffer)
        }
      })

      // 监听导航变化
      webview.addEventListener('did-navigate', (event) => {
        if (!isBuffer) {
          checkUrlChange(event.url)
        }
      })

      webview.addEventListener('did-navigate-in-page', (event) => {
        if (!isBuffer) {
          checkUrlChange(event.url)
        }
      })

      // 监听新窗口打开
      webview.addEventListener('ipc-message', (event) => {
        if (event.channel === 'webview-open-url') {
          console.log('[WebsiteCard] Webview 尝试打开新窗口:', event.args[0])
          // 在当前 webview 中导航
          const { url } = event.args[0]
          if (url) {
            webview.src = url
          }
        } else if (event.channel === 'webview-ready') {
          console.log('[WebsiteCard] Webview 已准备就绪:', event.args[0])
        }
      })

      // 监听加载失败
      webview.addEventListener('did-fail-load', (event) => {
        console.error('[WebsiteCard] Webview 加载失败:', {
          errorCode: event.errorCode,
          errorDescription: event.errorDescription,
          validatedURL: event.validatedURL,
          isMainFrame: event.isMainFrame,
          isBuffer: isBuffer,
          partition: webview.partition,
          sessionInstance: props.item.sessionInstance
        })
      })
    }

    // 应用暗色主题
    const applyDarkMode = async (webview) => {
      if (!props.item.darkMode) return

      console.log('[WebsiteCard] 应用暗色主题')

      try {
        // 等待一段时间确保页面完全加载
        await new Promise(resolve => setTimeout(resolve, 500))

        const darkModeStyleId = `tabhive-darkmode-style-${props.item.id}`

        const darkModeCode = `
          (function() {
            try {
              console.log('[Webview DarkMode] 应用暗色主题');
              
              // 移除旧样式
              const oldStyle = document.getElementById('${darkModeStyleId}');
              if (oldStyle) {
                oldStyle.remove();
              }
              
              // 添加暗色主题样式
              const style = document.createElement('style');
              style.id = '${darkModeStyleId}';
              style.textContent = \`
                html {
                  filter: invert(0.9) hue-rotate(180deg) !important;
                  background-color: #1a1a1a !important;
                }
                
                img, video, iframe, [style*="background-image"] {
                  filter: invert(1) hue-rotate(180deg) !important;
                }
                
                * {
                  scrollbar-color: #555 #222 !important;
                }
                
                *::-webkit-scrollbar {
                  background-color: #222 !important;
                }
                
                *::-webkit-scrollbar-thumb {
                  background-color: #555 !important;
                }
              \`;
              
              document.head.appendChild(style);
              console.log('[Webview DarkMode] 暗色主题已应用');
              return { success: true };
            } catch (e) {
              console.error('[Webview DarkMode] 错误:', e);
              return { success: false, error: e.message };
            }
          })();
        `

        await webview.executeJavaScript(darkModeCode)
        console.log('[WebsiteCard] ✓ 暗色主题应用成功')
      } catch (error) {
        console.error('[WebsiteCard] 应用暗色主题失败:', error)
      }
    }

    // 应用选择器到 webview
    const applySelector = async (webview, isBuffer) => {
      if (!props.item.targetSelector) return

      console.log('[WebsiteCard] 应用选择器:', props.item.targetSelector)

      try {
        // 等待一段时间确保页面完全加载
        await new Promise(resolve => setTimeout(resolve, 1000))

        const styleId = `tabhive-selector-style-${props.item.id}`
        const selector = props.item.targetSelector

        // 构造完整的选择器代码（包括样式注入）
        const selectorCode = `
          (function() {
            try {
              const selector = '${selector.replace(/'/g, "\\'")}';
              console.log('[Webview Selector] 应用选择器:', selector);
              
              // 移除旧样式
              const oldStyle = document.getElementById('${styleId}');
              if (oldStyle) {
                oldStyle.remove();
              }
              
              // 查找目标元素
              const targetElement = document.querySelector(selector);
              if (!targetElement) {
                console.warn('[Webview Selector] 未找到选择器对应的元素:', selector);
                return { success: false, error: '未找到元素' };
              }
              
              // 隐藏兄弟元素
              let current = targetElement;
              let hiddenCount = 0;
              
              while (current && current !== document.body) {
                const parent = current.parentElement;
                if (parent) {
                  Array.from(parent.children).forEach(sibling => {
                    if (sibling !== current && 
                        !['SCRIPT', 'STYLE', 'LINK', 'META', 'TITLE'].includes(sibling.tagName)) {
                      sibling.style.display = 'none';
                      sibling.setAttribute('data-tabhive-hidden', 'true');
                      hiddenCount++;
                    }
                  });
                }
                current = parent;
              }
              
              console.log('[Webview Selector] 已隐藏', hiddenCount, '个兄弟元素');
              
              // 添加样式
              const style = document.createElement('style');
              style.id = '${styleId}';
              style.textContent = \`
                html, body {
                  margin: 0 !important;
                  padding: 0 !important;
                  overflow: hidden !important;
                  width: 100% !important;
                  height: 100% !important;
                }
                
                \${selector} {
                  display: block !important;
                  visibility: visible !important;
                  position: fixed !important;
                  top: 0 !important;
                  left: 0 !important;
                  width: 100vw !important;
                  height: 100vh !important;
                  margin: 0 !important;
                  padding: 0 !important;
                  z-index: 999999 !important;
                  object-fit: contain !important;
                }
                
                \${selector} * {
                  visibility: visible !important;
                }
              \`;
              
              document.head.appendChild(style);
              console.log('[Webview Selector] 选择器已应用,隐藏了', hiddenCount, '个元素');
              return { success: true, hiddenCount: hiddenCount };
            } catch (e) {
              console.error('[Webview Selector] 错误:', e);
              return { success: false, error: e.message };
            }
          })();
        `

        // 执行选择器代码
        const result = await webview.executeJavaScript(selectorCode)

        if (isBuffer) {
          console.log('[WebsiteCard] 缓冲 webview 选择器应用完成')
        }
        
        if (result && result.success) {
          console.log('[WebsiteCard] ✓ 选择器应用成功')
        }
      } catch (error) {
        console.error('[WebsiteCard] 应用选择器失败:', error)
      }
    }
    
    // 恢复原始样式（全屏模式）
    const restoreOriginalStyles = async () => {
      if (!props.item.targetSelector) return
      
      console.log('[WebsiteCard] 恢复原始样式')
      
      if (isElectron.value && webviewRef.value) {
        try {
          const styleId = `tabhive-selector-style-${props.item.id}`
          
          const code = `
            (function() {
              try {
                const style = document.getElementById('${styleId}');
                if (style) {
                  style.remove();
                }
                
                const hiddenElements = document.querySelectorAll('[data-tabhive-hidden]');
                let restoredCount = 0;
                hiddenElements.forEach(el => {
                  el.style.display = '';
                  el.removeAttribute('data-tabhive-hidden');
                  restoredCount++;
                });
                console.log('[Webview Selector] 已恢复', restoredCount, '个元素');
                return { success: true };
              } catch (e) {
                console.error('[Webview Selector] 恢复失败:', e);
                return { success: false, error: e.message };
              }
            })();
          `
          
          await webviewRef.value.executeJavaScript(code)
        } catch (error) {
          console.error('[WebsiteCard] 恢复样式失败:', error)
        }
      }
    }
    
    // 双缓冲刷新方法
    const refreshWithDoubleBuffer = () => {
      console.log('[WebsiteCard] 使用双缓冲刷新:', props.item.title, {
        sessionInstance: props.item.sessionInstance,
        partition: partitionName.value,
        url: websiteUrl.value
      })
      
      if (!isElectron.value) {
        // 非 Electron 环境,简单刷新
        emit('refresh', props.index)
        return
      }

      // 重置状态
      isBufferReady.value = false
      
      // 设置缓冲 URL 并显示缓冲 webview
      bufferUrl.value = websiteUrl.value
      isBufferLoading.value = true
      
      console.log('[WebsiteCard] 缓冲webview配置:', {
        bufferUrl: bufferUrl.value,
        partition: partitionName.value
      })
      
      // 监听缓冲 webview 加载完成
      nextTick(() => {
        if (bufferWebviewRef.value) {
          const handleBufferLoad = async () => {
            console.log('[WebsiteCard] 缓冲 webview 加载完成')
            
            // 判断是否需要应用选择器
            const needSelector = !props.isFullscreen && props.item.targetSelector
            
            if (needSelector) {
              console.log('[WebsiteCard] 选择器类型页面,等待应用选择器')
              await new Promise(resolve => setTimeout(resolve, 1500))
            }
            
            // 缓冲 webview 准备完成,显示在前面
            console.log('[WebsiteCard] 显示缓冲 webview')
            isBufferReady.value = true
            
            // 立即刷新主 webview(在后台进行)
            console.log('[WebsiteCard] 刷新主 webview')
            mainWebviewReady.value = false
            emit('refresh', props.index)
            
            // 等待主 webview 加载完成
            if (webviewRef.value) {
              const waitForMainWebview = () => {
                return new Promise((resolve) => {
                  const checkReady = () => {
                    if (mainWebviewReady.value) {
                      console.log('[WebsiteCard] 主 webview 已准备就绪,移除缓冲 webview')
                      resolve()
                    } else {
                      setTimeout(checkReady, 100)
                    }
                  }
                  
                  checkReady()
                  
                  // 最多等待 5 秒
                  setTimeout(() => {
                    console.log('[WebsiteCard] 等待主 webview 超时,移除缓冲 webview')
                    resolve()
                  }, 5000)
                })
              }
              
              await waitForMainWebview()
            } else {
              await new Promise(resolve => setTimeout(resolve, 2000))
            }
            
            // 移除缓冲 webview
            isBufferLoading.value = false
            isBufferReady.value = false
            bufferUrl.value = ''
            console.log('[WebsiteCard] 双缓冲刷新完成')
          }
          
          bufferWebviewRef.value.addEventListener('did-finish-load', handleBufferLoad, { once: true })
        }
      })
    }

    // 手动刷新处理
    const handleManualRefresh = () => {
      console.log('[WebsiteCard] 手动刷新')
      
      if (isElectron.value && webviewRef.value) {
        // 使用双缓冲刷新
        refreshWithDoubleBuffer()
      } else if (iframeRef.value) {
        // iframe 刷新
        emit('refresh', props.index)
      }
    }
    
    // 切换静音状态
    const handleToggleMute = () => {
      console.log('[WebsiteCard] 切换静音状态')
      emit('toggle-mute', props.index)
    }
    
    // 监听静音状态变化，应用到 webview
    watch(() => props.item.muted, (newMuted) => {
      if (isElectron.value && webviewRef.value) {
        try {
          webviewRef.value.setAudioMuted(newMuted || false)
          console.log('[WebsiteCard] 设置静音状态:', newMuted)
        } catch (error) {
          console.error('[WebsiteCard] 设置静音失败:', error)
        }
      }
    }, { immediate: true })
    
    // webview 加载完成后也应用静音状态
    const applyMuteState = (webview) => {
      if (!webview) return
      try {
        const muted = props.item.muted || false
        webview.setAudioMuted(muted)
        console.log('[WebsiteCard] 应用静音状态:', muted)
      } catch (error) {
        console.error('[WebsiteCard] 应用静音状态失败:', error)
      }
    }

    // 检查URL是否变化
    const checkUrlChange = (url) => {
      if (!url) return
      
      // 移除 __webview_id__ 参数
      const cleanUrl = url.split('?')[0] + (url.includes('?') && !url.includes('__webview_id__') ? '?' + url.split('?')[1] : '')
      const configUrl = props.item.url.split('?')[0]
      
      currentUrl.value = cleanUrl
      
      // 检查域名是否相同
      try {
        const current = new URL(cleanUrl)
        const config = new URL(props.item.url)
        
        // 如果主域名不同，或路径不同，显示提示
        if (current.hostname !== config.hostname || current.pathname !== config.pathname) {
          showUrlChangeHint.value = true
          console.log('[WebsiteCard] URL 已变化:', {
            current: cleanUrl,
            config: props.item.url
          })
        } else {
          showUrlChangeHint.value = false
        }
      } catch (error) {
        console.error('[WebsiteCard] URL 解析失败:', error)
      }
    }

    // 使用当前URL
    const handleUseCurrentUrl = () => {
      if (currentUrl.value && isElectron.value && webviewRef.value) {
        try {
          const url = webviewRef.value.getURL()
          // 移除 __webview_id__ 参数
          const cleanUrl = url.replace(/[?&]__webview_id__=[^&]+/, '').replace(/\?$/, '')
          
          console.log('[WebsiteCard] 使用当前 URL:', cleanUrl)
          emit('update-url', props.index, cleanUrl)
          showUrlChangeHint.value = false
        } catch (error) {
          console.error('[WebsiteCard] 获取 URL 失败:', error)
        }
      }
    }
    
    // 使用自动刷新功能
    const itemRef = toRef(props, 'item')
    const { remainingTime, resetTimer, pauseTimer, resumeTimer } = useAutoRefresh({
      item: itemRef,
      onRefresh: refreshWithDoubleBuffer
    })

    // 监听sessionInstance变化，需要刷新webview以应用新的partition
    watch(() => props.item.sessionInstance, (newVal, oldVal) => {
      if (oldVal !== undefined && newVal !== oldVal && isElectron.value) {
        console.log('[WebsiteCard] SessionInstance变化,需要重新创建webview:', {
          old: oldVal,
          new: newVal,
          oldPartition: oldVal ? `persist:${oldVal}` : 'persist:default',
          newPartition: newVal ? `persist:${newVal}` : 'persist:default'
        })
        // webview的partition属性不能动态修改
        // 通过key属性变化强制Vue重新创建webview元素
        // key已经包含了sessionInstance，所以会自动触发重新创建
      }
    })

    // 监听全屏状态变化,控制自动刷新暂停/恢复和选择器切换
    watch(() => props.isFullscreen, async (newVal, oldVal) => {
      if (newVal) {
        console.log('[WebsiteCard] 进入全屏,暂停自动刷新')
        pauseTimer()
        
        // 如果有选择器且不刷新,恢复完整页面
        if (props.item.targetSelector && !props.refreshOnFullscreenToggle && oldVal !== undefined) {
          await restoreOriginalStyles()
        }
      } else {
        console.log('[WebsiteCard] 退出全屏,恢复自动刷新')
        resumeTimer()
        
        // 如果有选择器且不刷新,重新应用选择器
        if (props.item.targetSelector && !props.refreshOnFullscreenToggle && oldVal !== undefined) {
          await new Promise(resolve => setTimeout(resolve, 100))
          if (isElectron.value && webviewRef.value) {
            await applySelector(webviewRef.value, false)
          }
        }
      }
      
      // 如果配置了刷新,则刷新 webview
      if (props.item.targetSelector && props.refreshOnFullscreenToggle && oldVal !== undefined) {
        if (isElectron.value && webviewRef.value) {
          console.log('[WebsiteCard] 全屏切换,刷新 webview')
          const currentSrc = webviewRef.value.src
          webviewRef.value.src = ''
          setTimeout(() => {
            webviewRef.value.src = currentSrc
          }, 10)
        }
      }
    })

    // 计算包含内边距的样式
    const computedItemStyle = computed(() => {
      const style = { ...props.itemStyle }
      if (props.item.padding && props.item.padding > 0) {
        style['--item-padding'] = `${props.item.padding}px`
      }
      return style
    })

    // 格式化倒计时显示
    const formatTime = (seconds) => {
      if (!seconds || seconds <= 0) return ''
      
      const days = Math.floor(seconds / 86400)
      const hours = Math.floor((seconds % 86400) / 3600)
      const mins = Math.floor((seconds % 3600) / 60)
      const secs = seconds % 60
      
      if (days > 0) {
        if (hours > 0) {
          return `${days}天${hours}时`
        }
        return `${days}天`
      }
      
      if (hours > 0) {
        if (mins > 0) {
          return `${hours}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
        }
        return `${hours}时`
      }
      
      if (mins > 0) {
        return `${mins}:${secs.toString().padStart(2, '0')}`
      }
      
      return `${secs}s`
    }

    // 组件挂载时设置事件监听
    onMounted(() => {
      // 如果是 Electron 环境,监听主进程的刷新事件
      if (isElectron.value && window.electron) {
        window.electron.on('refresh-webview-from-main', (webviewId) => {
          if (webviewId === props.item.id) {
            console.log('[WebsiteCard] 收到主进程刷新命令')
            handleManualRefresh()
          }
        })
      }
    })

    // 组件卸载时清理
    onBeforeUnmount(() => {
      // 取消注册 webview
      if (isElectron.value && window.electron && props.item.id) {
        window.electron.webview.unregister(props.item.id).catch(err => {
          console.error('[WebsiteCard] 取消注册失败:', err)
        })
      }
    })

    return {
      isElectron,
      webviewPreloadPath,
      websiteUrl,
      partitionName,
      setWebviewRef,
      setBufferWebviewRef,
      setIframeRef,
      remainingTime,
      formatTime,
      resetTimer,
      isBufferLoading,
      isBufferReady,
      bufferUrl,
      refreshWithDoubleBuffer,
      handleManualRefresh,
      handleToggleMute,
      computedItemStyle,
      showUrlChangeHint,
      handleUseCurrentUrl
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
}

/* Iframe 样式(非 Electron 环境) */
.website-iframe {
  width: 100%;
  height: 100%;
  border: none;
}

/* 内边距支持 */
.grid-item[data-padding] .website-webview,
.grid-item[data-padding] .website-iframe {
  width: calc(100% - var(--item-padding) * 2);
  height: calc(100% - var(--item-padding) * 2);
  margin: var(--item-padding);
}

/* 拖动或调整大小时,禁用 webview/iframe 的鼠标事件 */
.grid-item.dragging .website-webview,
.grid-item.resizing .website-webview,
.grid-item.dragging .website-iframe,
.grid-item.resizing .website-iframe {
  pointer-events: none;
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

/* 拖动时保持手柄和标题可见 */
.grid-item.dragging :deep(.drag-handle) {
  opacity: 1;
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

/* 悬停时显示调整大小手柄 */
.grid-item:hover :deep(.resize-handle) {
  opacity: 0.8;
}

/* 悬停时显示倒计时 */
.grid-item:hover .refresh-timer {
  opacity: 1;
}

/* 自动刷新倒计时显示 */
.refresh-timer {
  position: absolute;
  bottom: 8px;
  right: 8px;
  display: flex;
  align-items: center;
  gap: 4px;
  background: rgba(16, 185, 129, 0.9);
  color: white;
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 11px;
  font-weight: 600;
  box-shadow: 0 2px 8px rgba(16, 185, 129, 0.3);
  z-index: 100;
  pointer-events: none;
  backdrop-filter: blur(4px);
  transition: all 0.3s ease;
  opacity: 0;
}

.timer-icon {
  width: 12px;
  height: 12px;
  animation: pulse 2s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.6;
  }
}

.timer-text {
  line-height: 1;
  min-width: 24px;
  text-align: center;
}

/* 全屏模式下隐藏倒计时 */
.grid-item.fullscreen .refresh-timer {
  display: none;
}

/* 拖动或调整大小时降低倒计时透明度 */
.grid-item.dragging .refresh-timer,
.grid-item.resizing .refresh-timer {
  opacity: 0.3;
}

/* URL 变化提示按钮 */
.url-change-hint {
  position: absolute;
  bottom: 8px;
  left: 8px;
  z-index: 100;
  opacity: 0;
  transition: opacity 0.3s ease;
}

.grid-item:hover .url-change-hint {
  opacity: 1;
}

.btn-use-current-url {
  display: flex;
  align-items: center;
  gap: 6px;
  background: rgba(59, 130, 246, 0.9);
  color: white;
  padding: 8px 12px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 600;
  box-shadow: 0 2px 8px rgba(59, 130, 246, 0.3);
  backdrop-filter: blur(4px);
  transition: all 0.3s ease;
  border: none;
  cursor: pointer;
}

.btn-use-current-url:hover {
  background: rgba(37, 99, 235, 0.95);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4);
}

.btn-use-current-url svg {
  width: 16px;
  height: 16px;
}

.btn-use-current-url span {
  line-height: 1;
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
