/**
 * Webview 音频控制 Composable
 * 负责 webview 的静音状态管理
 */

import { watch } from 'vue'

export function useWebviewAudio(props, { isElectron, webviewRef }) {
  // 切换静音状态
  const handleToggleMute = (emit, index) => {
    console.log('[useWebviewAudio] 切换静音状态')
    emit('toggle-mute', index)
  }
  
  // 应用静音状态到 webview
  const applyMuteState = (webview) => {
    if (!webview) return
    try {
      const muted = props.item.muted || false
      webview.setAudioMuted(muted)
      console.log('[useWebviewAudio] 应用静音状态:', muted)
    } catch (error) {
      console.error('[useWebviewAudio] 应用静音状态失败:', error)
    }
  }

  // 监听静音状态变化，应用到 webview
  const watchMuteState = () => {
    watch(() => props.item.muted, (newMuted) => {
      if (isElectron.value && webviewRef.value) {
        try {
          webviewRef.value.setAudioMuted(newMuted || false)
          console.log('[useWebviewAudio] 设置静音状态:', newMuted)
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

