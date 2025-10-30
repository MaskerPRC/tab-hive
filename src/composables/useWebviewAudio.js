/**
 * Webview 音频控制 Composable
 * 负责 webview 的静音状态管理
 */

import { watch, computed } from 'vue'

export function useWebviewAudio(props, { isElectron, webviewRef }) {
  // 计算实际的静音状态：全局静音优先
  const effectiveMuted = computed(() => {
    return props.globalMuted || props.item.muted || false
  })

  // 切换静音状态
  const handleToggleMute = (emit, index) => {
    console.log('[useWebviewAudio] 切换静音状态')
    emit('toggle-mute', index)
  }
  
  // 应用静音状态到 webview
  const applyMuteState = (webview) => {
    if (!webview) return
    try {
      const muted = effectiveMuted.value
      webview.setAudioMuted(muted)
      console.log('[useWebviewAudio] 应用静音状态:', muted, '(全局静音:', props.globalMuted, ', 网站静音:', props.item.muted, ')')
    } catch (error) {
      console.error('[useWebviewAudio] 应用静音状态失败:', error)
    }
  }

  // 监听静音状态变化，应用到 webview
  const watchMuteState = () => {
    // 监听实际静音状态（考虑全局静音和网站静音）
    watch(effectiveMuted, (newMuted) => {
      if (isElectron.value && webviewRef.value) {
        try {
          webviewRef.value.setAudioMuted(newMuted)
          console.log('[useWebviewAudio] 设置静音状态:', newMuted, '(全局静音:', props.globalMuted, ', 网站静音:', props.item.muted, ')')
        } catch (error) {
          console.error('[useWebviewAudio] 设置静音失败:', error)
        }
      }
    }, { immediate: true })
  }

  return {
    handleToggleMute,
    applyMuteState,
    watchMuteState
  }
}

