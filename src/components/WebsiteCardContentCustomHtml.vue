<template>
  <!-- 自定义 HTML 类型 -->
  <webview
    v-if="item.html"
    :key="`webview-custom-${item.id}`"
    :id="`webview-custom-${item.id}`"
    :src="customHtmlDataUrl"
    :ref="setCustomHtmlWebviewRef"
    class="custom-html-webview"
    :preload="webviewPreloadPath"
    webpreferences="javascript=yes,allowRunningInsecureContent=yes,contextIsolation=no,sandbox=no"
    allowpopups
  ></webview>
</template>

<script>
export default {
  name: 'WebsiteCardContentCustomHtml',
  props: {
    item: {
      type: Object,
      required: true
    },
    webviewPreloadPath: {
      type: String,
      required: true
    },
    customHtmlDataUrl: {
      type: String,
      required: true
    },
    setCustomHtmlWebviewRef: {
      type: Function,
      required: true
    }
  }
}
</script>

<style scoped>
.custom-html-webview {
  width: 100%;
  height: 100%;
  border: none;
  background: white;
  flex: 1;
  pointer-events: auto !important;
  min-height: 0;
}
</style>

