<template>
  <!-- 普通网站类型 -->
  <template v-if="item.url">
    <!-- 主 webview -->
    <webview
      :key="`webview-${item.id}-${item.sessionInstance || 'default'}`"
      :ref="setWebviewRef"
      :id="`webview-${item.id}`"
      :data-webview-id="item.id"
      :partition="partitionName"
      class="website-webview"
      :class="{ 'mobile-view': item.deviceType === 'mobile' }"
      :preload="webviewPreloadPath"
      webpreferences="javascript=yes,allowRunningInsecureContent=yes,contextIsolation=no,sandbox=no"
      allowpopups
    ></webview>

    <!-- 后台缓冲 webview(双缓冲机制) -->
    <webview
      v-if="isBufferLoading"
      :key="`webview-buffer-${item.id}-${item.sessionInstance || 'default'}`"
      :ref="setBufferWebviewRef"
      :id="`webview-buffer-${item.id}`"
      :data-webview-id="`buffer-${item.id}`"
      :src="bufferUrl"
      :partition="partitionName"
      class="website-webview buffer-webview"
      :class="{ 'mobile-view': item.deviceType === 'mobile', 'buffer-ready': isBufferReady }"
      :preload="webviewPreloadPath"
      webpreferences="javascript=yes,allowRunningInsecureContent=yes,contextIsolation=no,sandbox=no"
      allowpopups
    ></webview>
  </template>
</template>

<script>
export default {
  name: 'WebsiteCardContentNormal',
  props: {
    item: {
      type: Object,
      required: true
    },
    isElectron: {
      type: Boolean,
      required: true
    },
    webviewPreloadPath: {
      type: String,
      required: true
    },
    partitionName: {
      type: String,
      required: true
    },
    websiteUrl: {
      type: String,
      required: true
    },
    isBufferLoading: {
      type: Boolean,
      default: false
    },
    isBufferReady: {
      type: Boolean,
      default: false
    },
    bufferUrl: {
      type: String,
      default: ''
    },
    setWebviewRef: {
      type: Function,
      required: true
    },
    setBufferWebviewRef: {
      type: Function,
      required: true
    },
    setIframeRef: {
      type: Function,
      required: true
    }
  }
}
</script>

<style scoped>
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

.website-webview.mobile-view,
.website-iframe.mobile-view {
  max-width: 375px;
  margin: 0 auto;
  border: 2px solid #ddd;
  border-radius: 20px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
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
</style>






