<template>
  <div class="card p-4">
    <h3 class="mb-4 text-sm font-semibold text-[var(--anthropic-fg)] dark:text-[var(--anthropic-fg)]">
      {{ t('payment.admin.topUsers') }}
    </h3>
    <div
      v-if="!users?.length"
      class="flex h-32 items-center justify-center text-sm text-[var(--anthropic-muted)] dark:text-[var(--anthropic-muted)]"
    >
      {{ t('payment.admin.noData') }}
    </div>
    <div v-else class="space-y-2">
      <div
        v-for="(user, idx) in users"
        :key="user.user_id"
        class="flex items-center justify-between rounded-lg px-3 py-2 hover:bg-[var(--anthropic-section)] dark:hover:bg-[var(--anthropic-raised)]"
      >
        <div class="flex items-center gap-3">
          <span
            :class="[
              'flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold',
              rankClass(idx),
            ]"
          >
            {{ idx + 1 }}
          </span>
          <span class="text-sm text-[var(--anthropic-muted)] dark:text-[var(--anthropic-muted)]">{{ user.email }}</span>
        </div>
        <span class="text-sm font-medium text-[var(--anthropic-fg)] dark:text-[var(--anthropic-fg)]">
          ${{ user.amount.toFixed(2) }}
        </span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

defineProps<{
  users: { user_id: number; email: string; amount: number }[]
}>()

function rankClass(idx: number): string {
  if (idx === 0) return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
  if (idx === 1) return 'bg-[var(--anthropic-raised)] text-[var(--anthropic-muted)] dark:bg-[var(--anthropic-section)] dark:text-[var(--anthropic-muted)]'
  if (idx === 2) return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
  return 'bg-[var(--anthropic-raised)] text-[var(--anthropic-muted)] dark:bg-[var(--anthropic-section)] dark:text-[var(--anthropic-muted)]'
}
</script>
