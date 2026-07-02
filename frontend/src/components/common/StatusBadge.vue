<template>
  <div class="status-badge flex items-center gap-1.5">
    <span
      :class="[
        'status-badge__dot inline-block h-2 w-2 rounded-full',
        variantClass
      ]"
    ></span>
    <span class="status-badge__label text-sm">
      {{ label }}
    </span>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  status: string
  label: string
}>()

const variantClass = computed(() => {
  switch (props.status) {
    case 'active':
    case 'success':
    case 'healthy':
    case 'ok':
      return 'status-badge__dot--success'
    case 'running':
    case 'info':
      return 'status-badge__dot--info'
    case 'warning':
    case 'pending':
      return 'status-badge__dot--warning'
    case 'error':
    case 'danger':
    case 'failed':
    case 'failure':
      return 'status-badge__dot--error'
    case 'disabled':
    case 'inactive':
    case 'unknown':
    case 'neutral':
      return 'status-badge__dot--neutral'
    default:
      return 'status-badge__dot--neutral'
  }
})
</script>

<style scoped>
.status-badge {
  background: transparent;
  color: var(--anthropic-muted);
}

.status-badge__label {
  color: var(--anthropic-muted);
}

.status-badge__dot {
  --status-badge-dot-color: var(--anthropic-raised);
  background: var(--status-badge-dot-color);
  box-shadow: 0 0 0 1px color-mix(in srgb, var(--status-badge-dot-color) 28%, transparent);
}

.status-badge__dot--success {
  --status-badge-dot-color: var(--anthropic-success);
}

.status-badge__dot--info {
  --status-badge-dot-color: var(--anthropic-info);
}

.status-badge__dot--warning {
  --status-badge-dot-color: var(--anthropic-warning);
}

.status-badge__dot--error {
  --status-badge-dot-color: var(--anthropic-error);
}

.status-badge__dot--neutral {
  --status-badge-dot-color: var(--anthropic-raised);
}
</style>
