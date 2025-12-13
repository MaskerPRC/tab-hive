<template>
  <button
    class="icon-button"
    :class="{ 'danger': danger }"
    @click="$emit('click')"
    :title="label"
  >
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <!-- Monitor icon -->
      <rect v-if="icon === 'monitor'" x="2" y="3" width="20" height="14" rx="2" ry="2"/>
      <line v-if="icon === 'monitor'" x1="8" y1="21" x2="16" y2="21"/>
      <line v-if="icon === 'monitor'" x1="12" y1="17" x2="12" y2="21"/>
      
      <!-- Help circle icon -->
      <circle v-if="icon === 'help-circle'" cx="12" cy="12" r="10"/>
      <path v-if="icon === 'help-circle'" d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/>
      <line v-if="icon === 'help-circle'" x1="12" y1="17" x2="12.01" y2="17"/>
      
      <!-- Trash icon -->
      <polyline v-if="icon === 'trash-2'" points="3 6 5 6 21 6"/>
      <path v-if="icon === 'trash-2'" d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
      
      <!-- Settings icon (gear) -->
      <circle v-if="icon === 'settings'" cx="12" cy="12" r="3"/>
      <path v-if="icon === 'settings'" d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
    </svg>
    <span class="icon-button-label">{{ label }}</span>
  </button>
</template>

<script>
export default {
  name: 'IconButton',
  props: {
    icon: {
      type: String,
      required: true
    },
    label: {
      type: String,
      required: true
    },
    danger: {
      type: Boolean,
      default: false
    }
  },
  emits: ['click']
}
</script>

<style scoped>
.icon-button {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 0.5rem;
  border-radius: 0.5rem;
  transition: all 0.2s;
  gap: 0.25rem;
  background: transparent;
  border: none;
  cursor: pointer;
  color: #475569;
}

.icon-button:hover {
  background: #f1f5f9;
  color: #1e293b;
}

.icon-button.danger:hover {
  background: #fef2f2;
  color: #dc2626;
}

.icon-button-label {
  font-size: 0.625rem;
  font-weight: 500;
}
</style>

