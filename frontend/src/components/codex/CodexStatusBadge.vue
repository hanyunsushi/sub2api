<template>
  <span
    class="codex-status-badge"
    :class="`codex-status-badge--${normalizedStatus}`"
    :title="message || statusLabel"
  >
    <span class="codex-status-badge__dot" aria-hidden="true"></span>
    {{ statusLabel }}
  </span>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { CodexAccountStatus } from '@/types/codex'

const STATUS_LABELS: Record<CodexAccountStatus, string> = {
  active: 'Active',
  expiring: 'Expiring',
  failed: 'Failed',
  disabled: 'Disabled',
  unknown: 'Unknown',
}

const props = defineProps<{
  status: CodexAccountStatus
  message?: string
}>()

const normalizedStatus = computed<CodexAccountStatus>(() => {
  return props.status in STATUS_LABELS ? props.status : 'unknown'
})

const statusLabel = computed(() => STATUS_LABELS[normalizedStatus.value])
</script>
