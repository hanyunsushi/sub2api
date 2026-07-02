<template>
  <span
    class="inline-flex items-center rounded-full border bg-transparent px-2.5 py-0.5 text-xs font-medium"
    :class="statusClass"
  >
    {{ statusLabel }}
  </span>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import type { OrderStatus } from '@/types/payment'

const props = defineProps<{
  status: OrderStatus
}>()

const { t } = useI18n()

const statusMap: Record<OrderStatus, { key: string; class: string }> = {
  PENDING: { key: 'payment.status.pending', class: 'border-[color-mix(in_srgb,var(--anthropic-warning)_32%,transparent)] text-[var(--anthropic-warning)]' },
  PAID: { key: 'payment.status.paid', class: 'border-[color-mix(in_srgb,var(--anthropic-info)_32%,transparent)] text-[var(--anthropic-info)]' },
  RECHARGING: { key: 'payment.status.recharging', class: 'border-[color-mix(in_srgb,var(--anthropic-info)_32%,transparent)] text-[var(--anthropic-info)]' },
  COMPLETED: { key: 'payment.status.completed', class: 'border-[color-mix(in_srgb,var(--anthropic-success)_32%,transparent)] text-[var(--anthropic-success)]' },
  EXPIRED: { key: 'payment.status.expired', class: 'border-[var(--anthropic-border)] text-[var(--anthropic-muted)]' },
  CANCELLED: { key: 'payment.status.cancelled', class: 'border-[var(--anthropic-border)] text-[var(--anthropic-muted)]' },
  FAILED: { key: 'payment.status.failed', class: 'border-[color-mix(in_srgb,var(--anthropic-error)_32%,transparent)] text-[var(--anthropic-error)]' },
  REFUND_REQUESTED: { key: 'payment.status.refund_requested', class: 'border-[color-mix(in_srgb,var(--anthropic-warning)_32%,transparent)] text-[var(--anthropic-warning)]' },
  REFUNDING: { key: 'payment.status.refunding', class: 'border-[color-mix(in_srgb,var(--anthropic-warning)_32%,transparent)] text-[var(--anthropic-warning)]' },
  REFUND_PENDING: { key: 'payment.status.refund_pending', class: 'border-[color-mix(in_srgb,var(--anthropic-warning)_32%,transparent)] text-[var(--anthropic-warning)]' },
  REFUNDED: { key: 'payment.status.refunded', class: 'border-[color-mix(in_srgb,var(--anthropic-info)_32%,transparent)] text-[var(--anthropic-info)]' },
  PARTIALLY_REFUNDED: { key: 'payment.status.partially_refunded', class: 'border-[color-mix(in_srgb,var(--anthropic-info)_32%,transparent)] text-[var(--anthropic-info)]' },
  REFUND_FAILED: { key: 'payment.status.refund_failed', class: 'border-[color-mix(in_srgb,var(--anthropic-error)_32%,transparent)] text-[var(--anthropic-error)]' },
}

const statusLabel = computed(() => {
  const entry = statusMap[props.status]
  return entry ? t(entry.key) : props.status
})

const statusClass = computed(() => {
  const entry = statusMap[props.status]
  return entry?.class ?? 'border-[var(--anthropic-border)] text-[var(--anthropic-muted)]'
})
</script>
