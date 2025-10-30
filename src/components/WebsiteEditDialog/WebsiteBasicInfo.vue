<template>
  <div class="form-row">
    <div class="form-group">
      <label>{{ $t('websiteBasicInfo.name') }}</label>
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
    <div class="form-group">
      <label>{{ $t('websiteBasicInfo.url') }}</label>
      <input
        :value="url"
        @input="$emit('update:url', $event.target.value)"
        type="text"
        :placeholder="$t('websiteBasicInfo.urlPlaceholder')"
        class="form-input"
        @keyup.enter="$emit('enter')"
      />
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
.form-row {
  display: flex;
  gap: 20px;
  margin-bottom: 20px;
}

.form-row .form-group {
  flex: 1;
  margin-bottom: 0;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  color: #333;
  font-weight: 500;
  font-size: 14px;
}

.form-input {
  width: 100%;
  padding: 12px 15px;
  border: 2px solid #e0e0e0;
  border-radius: 6px;
  font-size: 14px;
  transition: border-color 0.3s;
}

.form-input:focus {
  outline: none;
  border-color: var(--primary-color);
}

@media (max-width: 900px) {
  .form-row {
    flex-direction: column;
    gap: 0;
  }
  
  .form-row .form-group {
    margin-bottom: 20px;
  }
}
</style>

