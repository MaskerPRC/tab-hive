<template>
  <div
    v-if="show"
    class="certificate-error-overlay"
    :class="{ 'with-shadow': showShadow, 'dark-mode': darkMode }"
  >
    <div class="certificate-error-content">
      <div class="certificate-error-icon">🔒</div>
      <h3 class="certificate-error-title">{{ $t('other.certificateError') }}</h3>
      <p class="certificate-error-description">{{ $t('other.certificateErrorDescription') }}</p>
      <p class="certificate-error-hint">{{ $t('other.certificateErrorHint') }}</p>
      <div class="certificate-error-actions">
        <button class="btn-ignore" @click="$emit('ignore')">
          {{ $t('other.ignoreCertificateError') }}
        </button>
        <button class="btn-reload" @click="$emit('reload')">
          {{ $t('other.reload') }}
        </button>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'CertificateErrorOverlay',
  props: {
    show: {
      type: Boolean,
      default: false
    },
    showShadow: {
      type: Boolean,
      default: true
    },
    darkMode: {
      type: Boolean,
      default: false
    }
  },
  emits: ['ignore', 'reload']
}
</script>

<style scoped>
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
  box-shadow: none;
}

.certificate-error-overlay.dark-mode {
  background: rgba(26, 26, 26, 0.85);
}

.certificate-error-content {
  max-width: 440px;
  text-align: center;
  padding: 2.5rem 2rem;
  background: white;
  border-radius: 16px;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 
              0 2px 4px -1px rgba(0, 0, 0, 0.06),
              0 20px 25px -5px rgba(0, 0, 0, 0.1), 
              0 10px 10px -5px rgba(0, 0, 0, 0.04);
  border: 1px solid rgba(0,0,0,0.05);
}

.dark-mode .certificate-error-content {
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

.dark-mode .certificate-error-title {
  color: #f7fafc;
}

.certificate-error-description {
  font-size: 0.95rem;
  margin: 0 0 0.5rem 0;
  color: #4a5568;
  line-height: 1.6;
}

.dark-mode .certificate-error-description {
  color: #a0aec0;
}

.certificate-error-hint {
  font-size: 0.85rem;
  margin: 0 0 2rem 0;
  color: #718096;
}

.dark-mode .certificate-error-hint {
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

.dark-mode .btn-ignore {
  background: rgba(197, 48, 48, 0.15);
  color: #fc8181;
  border: 1px solid rgba(197, 48, 48, 0.3);
}

.dark-mode .btn-ignore:hover {
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

.dark-mode .btn-reload {
  background: rgba(66, 153, 225, 0.15);
  color: #63b3ed;
  border: 1px solid rgba(66, 153, 225, 0.3);
}

.dark-mode .btn-reload:hover {
  background: rgba(66, 153, 225, 0.25);
  border-color: rgba(66, 153, 225, 0.4);
}

.btn-ignore:active,
.btn-reload:active {
  transform: translateY(0);
}
</style>

