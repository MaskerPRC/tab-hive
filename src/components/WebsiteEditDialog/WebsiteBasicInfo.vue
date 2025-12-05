<template>
  <div class="basic-info-grid">
    <div class="form-group">
      <label>{{ $t('websiteBasicInfo.name') }}</label>
      <div class="input-wrapper">
        <div class="input-icon">
          <i class="fa-solid fa-tag"></i>
        </div>
        <input
          :value="title"
          @input="$emit('update:title', $event.target.value)"
          type="text"
          :placeholder="$t('websiteBasicInfo.namePlaceholder')"
          class="form-input"
          @keyup.enter="$emit('enter')"
          ref="titleInput"
        />
      </div>
    </div>
    <div class="form-group">
      <label>{{ $t('websiteBasicInfo.url') }}</label>
      <div class="input-wrapper">
        <div class="input-icon">
          <i class="fa-solid fa-link"></i>
        </div>
        <input
          :value="url"
          @input="$emit('update:url', $event.target.value)"
          type="text"
          :placeholder="$t('websiteBasicInfo.urlPlaceholder')"
          class="form-input url-input"
          @keyup.enter="$emit('enter')"
        />
      </div>
    </div>
  </div>
</template>

<script>
import { ref, watch, nextTick } from 'vue'
import { useI18n } from 'vue-i18n'

export default {
  name: 'WebsiteBasicInfo',
  props: {
    title: {
      type: String,
      default: ''
    },
    url: {
      type: String,
      default: ''
    },
    autoFocus: {
      type: Boolean,
      default: false
    }
  },
  emits: ['update:title', 'update:url', 'enter'],
  setup(props) {
    const titleInput = ref(null)

    watch(() => props.autoFocus, (newVal) => {
      if (newVal) {
        nextTick(() => {
          if (titleInput.value) {
            titleInput.value.focus()
          }
        })
      }
    }, { immediate: true })

    return {
      titleInput
    }
  }
}
</script>

<style scoped>
.basic-info-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1.5rem;
}

@media (min-width: 768px) {
  .basic-info-grid {
    grid-template-columns: 1fr 2fr;
  }
}

.form-group {
  margin-bottom: 0;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  color: #374151;
  font-weight: 500;
  font-size: 0.875rem;
}

.input-wrapper {
  position: relative;
}

.input-icon {
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  display: flex;
  align-items: center;
  padding-left: 0.75rem;
  pointer-events: none;
  color: #9ca3af;
}

.input-icon i {
  font-size: 0.875rem;
}

.form-input {
  width: 100%;
  padding: 0.625rem 1rem 0.625rem 2.25rem;
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 0.5rem;
  font-size: 0.875rem;
  transition: all 0.2s;
  color: #1f2937;
  font-weight: 500;
}

.form-input:focus {
  outline: none;
  border-color: #f97316;
  box-shadow: 0 0 0 2px rgba(249, 115, 22, 0.1);
  background: white;
}

.url-input {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
  font-size: 0.875rem;
  color: #4b5563;
  font-weight: 400;
}

@media (max-width: 768px) {
  .basic-info-grid {
    grid-template-columns: 1fr;
  }
}
</style>

