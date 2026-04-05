<template>
  <Transition name="modal-fade">
    <div v-if="visible" class="basic-auth-overlay" @click.self="handleCancel">
      <div class="basic-auth-container" @click.stop>
        <div class="basic-auth-header">
          <div class="modal-title">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-right: 8px; vertical-align: middle;">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
              <path d="M7 11V7a5 5 0 0110 0v4"></path>
            </svg>
            {{ $t('basicAuth.title') }}
          </div>
          <button class="modal-close-btn" @click="handleCancel" :title="$t('common.cancel')">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>
        <div class="basic-auth-body">
          <div class="auth-info">
            <span class="auth-host">{{ host }}</span>
            <span v-if="realm" class="auth-realm">{{ realm }}</span>
          </div>
          <form @submit.prevent="handleSubmit">
            <div class="form-group">
              <label for="basic-auth-username">{{ $t('basicAuth.username') }}</label>
              <input
                id="basic-auth-username"
                ref="usernameInput"
                v-model="username"
                type="text"
                autocomplete="username"
                :placeholder="$t('basicAuth.username')"
              />
            </div>
            <div class="form-group">
              <label for="basic-auth-password">{{ $t('basicAuth.password') }}</label>
              <input
                id="basic-auth-password"
                v-model="password"
                type="password"
                autocomplete="current-password"
                :placeholder="$t('basicAuth.password')"
              />
            </div>
            <div class="form-actions">
              <button type="button" class="btn-cancel" @click="handleCancel">{{ $t('common.cancel') }}</button>
              <button type="submit" class="btn-submit">{{ $t('basicAuth.login') }}</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script>
import { ref, watch, nextTick } from 'vue'

export default {
  name: 'BasicAuthDialog',
  props: {
    visible: { type: Boolean, default: false },
    requestId: { type: String, default: '' },
    host: { type: String, default: '' },
    realm: { type: String, default: '' }
  },
  emits: ['submit', 'cancel'],
  setup(props, { emit }) {
    const username = ref('')
    const password = ref('')
    const usernameInput = ref(null)

    const handleSubmit = () => {
      emit('submit', {
        requestId: props.requestId,
        username: username.value,
        password: password.value
      })
      username.value = ''
      password.value = ''
    }

    const handleCancel = () => {
      emit('cancel', { requestId: props.requestId })
      username.value = ''
      password.value = ''
    }

    // Auto-focus username input when dialog opens
    watch(() => props.visible, (val) => {
      if (val) {
        nextTick(() => {
          usernameInput.value?.focus()
        })
      }
    })

    return { username, password, usernameInput, handleSubmit, handleCancel }
  }
}
</script>

<style scoped>
.basic-auth-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10001;
}

.basic-auth-container {
  width: 380px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
  overflow: hidden;
  animation: modal-scale-in 0.15s ease-out;
}

.basic-auth-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid #e0e0e0;
  background: #f8f9fa;
}

.modal-title {
  font-size: 15px;
  font-weight: 600;
  color: #333;
  display: flex;
  align-items: center;
}

.modal-close-btn {
  width: 32px;
  height: 32px;
  border: none;
  background: transparent;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: #666;
  transition: all 0.2s;
}

.modal-close-btn:hover {
  background: #e0e0e0;
  color: #333;
}

.basic-auth-body {
  padding: 20px;
}

.auth-info {
  margin-bottom: 16px;
  padding: 10px 12px;
  background: #f0f4f8;
  border-radius: 8px;
  font-size: 13px;
  color: #555;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.auth-host {
  font-weight: 600;
  color: #333;
  word-break: break-all;
}

.auth-realm {
  color: #777;
  font-size: 12px;
}

.form-group {
  margin-bottom: 14px;
}

.form-group label {
  display: block;
  font-size: 13px;
  font-weight: 500;
  color: #555;
  margin-bottom: 6px;
}

.form-group input {
  width: 100%;
  padding: 9px 12px;
  border: 1px solid #d0d5dd;
  border-radius: 8px;
  font-size: 14px;
  outline: none;
  transition: border-color 0.2s;
  box-sizing: border-box;
}

.form-group input:focus {
  border-color: #4a90d9;
  box-shadow: 0 0 0 3px rgba(74, 144, 217, 0.15);
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 20px;
}

.btn-cancel,
.btn-submit {
  padding: 8px 20px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  border: none;
}

.btn-cancel {
  background: #f0f0f0;
  color: #555;
}

.btn-cancel:hover {
  background: #e0e0e0;
}

.btn-submit {
  background: #4a90d9;
  color: white;
}

.btn-submit:hover {
  background: #3a7bc8;
}

@keyframes modal-scale-in {
  from { opacity: 0; transform: scale(0.95); }
  to { opacity: 1; transform: scale(1); }
}

.modal-fade-enter-active,
.modal-fade-leave-active {
  transition: opacity 0.15s ease;
}

.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;
}
</style>
