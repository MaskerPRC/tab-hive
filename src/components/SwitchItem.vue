<template>
  <div class="switch-item">
    <div class="switch-item-left">
      <span class="switch-icon">
        <svg v-if="icon === 'eye'" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
          <circle cx="12" cy="12" r="3"/>
        </svg>
        <svg v-else-if="icon === 'eye-off'" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
          <line x1="1" y1="1" x2="23" y2="23"/>
        </svg>
        <svg v-else-if="icon === 'volume-2'" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
          <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"/>
        </svg>
        <svg v-else-if="icon === 'volume-x'" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
          <line x1="23" y1="9" x2="17" y2="15"/>
          <line x1="17" y1="9" x2="23" y2="15"/>
        </svg>
        <svg v-else-if="icon === 'zap'" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
        </svg>
      </span>
      <span class="switch-label">{{ label }}</span>
    </div>
    <button
      @click="$emit('change')"
      class="switch-toggle"
      :class="{ 'checked': checked }"
    >
      <span class="switch-thumb"></span>
    </button>
  </div>
</template>

<script>
export default {
  name: 'SwitchItem',
  props: {
    icon: {
      type: String,
      required: true
    },
    label: {
      type: String,
      required: true
    },
    checked: {
      type: Boolean,
      default: false
    }
  },
  emits: ['change']
}
</script>

<style scoped>
.switch-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.5rem 0;
}

.switch-item-left {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #475569;
}

.switch-icon {
  color: #94a3b8;
  display: flex;
  align-items: center;
}

.switch-label {
  font-size: 0.875rem;
  font-weight: 500;
}

.switch-toggle {
  position: relative;
  display: inline-flex;
  height: 1.25rem;
  width: 2.25rem;
  flex-shrink: 0;
  cursor: pointer;
  border-radius: 9999px;
  border: none;
  background-color: #cbd5e1;
  transition: background-color 0.3s;
  padding: 0;
}

.switch-toggle.checked {
  background-color: #f97316;
}

.switch-thumb {
  display: inline-block;
  height: 0.875rem;
  width: 0.875rem;
  border-radius: 9999px;
  background-color: white;
  box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
  transition: transform 0.3s;
  transform: translateX(0.125rem);
}

.switch-toggle.checked .switch-thumb {
  transform: translateX(1.125rem);
}
</style>

