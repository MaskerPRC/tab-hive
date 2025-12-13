<template>
  <!-- 详细信息面板 -->
  <div v-if="elementInfo" class="element-info">
    <!-- Tag -->
    <div class="info-item">
      <div class="info-icon info-icon-tag">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M4 7V4h16v3M9 20h6M12 4v16"/>
        </svg>
      </div>
      <div class="info-content">
        <div class="info-label">{{ $t('selectorToolbar.tagName') }}</div>
        <div class="info-value info-value-tag">
          &lt;{{ elementInfo.tagName || elementInfo.tag }}&gt;
        </div>
      </div>
    </div>

    <!-- Class -->
    <div v-if="elementInfo.className || elementInfo.class" class="info-item">
      <div class="info-icon info-icon-class">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="4" y1="9" x2="20" y2="9"/>
          <line x1="4" y1="15" x2="20" y2="15"/>
          <line x1="10" y1="3" x2="8" y2="21"/>
          <line x1="16" y1="3" x2="14" y2="21"/>
        </svg>
      </div>
      <div class="info-content">
        <div class="info-label">{{ $t('selectorToolbar.classList') }}</div>
        <p class="info-value info-value-class">
          {{ elementInfo.className || elementInfo.class }}
        </p>
      </div>
    </div>

    <!-- Size -->
    <div class="info-item">
      <div class="info-icon info-icon-size">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
          <line x1="9" y1="3" x2="9" y2="21"/>
          <line x1="3" y1="9" x2="21" y2="9"/>
        </svg>
      </div>
      <div class="info-content">
        <div class="info-label">{{ $t('selectorToolbar.dimensions') }}</div>
        <div class="info-value info-value-size">
          <span>{{ elementInfo.width || 0 }} px</span>
          <span class="separator">×</span>
          <span>{{ elementInfo.height || 0 }} px</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'ElementInfo',
  props: {
    elementInfo: {
      type: Object,
      default: null
    }
  }
}
</script>

<style scoped>
.element-info {
  background: #f8fafc;
  border-radius: 12px;
  padding: 12px;
  border: 1px solid #f1f5f9;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.info-item {
  display: flex;
  gap: 12px;
}

.info-icon {
  width: 20px;
  height: 20px;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  margin-top: 2px;
}

.info-icon-tag {
  background: #dbeafe;
  color: #2563eb;
}

.info-icon-class {
  background: #f3e8ff;
  color: #9333ea;
}

.info-icon-size {
  background: #d1fae5;
  color: #059669;
}

.info-content {
  flex: 1;
  overflow: hidden;
  min-width: 0;
}

.info-label {
  font-size: 10px;
  color: #94a3b8;
  font-weight: 700;
  text-transform: uppercase;
  margin-bottom: 4px;
}

.info-value {
  font-size: 12px;
  color: #475569;
  word-break: break-word;
}

.info-value-tag {
  font-family: 'Monaco', 'Menlo', 'Consolas', monospace;
  background: white;
  padding: 2px 6px;
  border-radius: 4px;
  border: 1px solid #e2e8f0;
  display: inline-block;
}

.info-value-class {
  font-family: 'Monaco', 'Menlo', 'Consolas', monospace;
  font-size: 11px;
  color: #64748b;
  line-height: 1.5;
  user-select: all;
}

.info-value-size {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 500;
  color: #1e293b;
}

.separator {
  color: #cbd5e1;
}
</style>

