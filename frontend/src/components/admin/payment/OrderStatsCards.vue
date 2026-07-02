<template>
  <div class="grid grid-cols-2 gap-4 lg:grid-cols-4">
    <!-- Today Revenue -->
    <div class="card p-4">
      <div class="flex items-center gap-3">
        <div class="rounded-lg bg-green-100 p-2 dark:bg-green-900/30">
          <Icon name="dollar" size="md" class="text-green-600 dark:text-green-400" :stroke-width="2" />
        </div>
        <div>
          <p class="text-xs font-medium text-[var(--anthropic-muted)] dark:text-[var(--anthropic-muted)]">{{ t('payment.admin.todayRevenue') }}</p>
          <p class="text-xl font-bold text-[var(--anthropic-fg)] dark:text-[var(--anthropic-fg)]">${{ formatMoney(stats.today_amount) }}</p>
          <p class="text-xs text-[var(--anthropic-muted)] dark:text-[var(--anthropic-muted)]">
            {{ stats.today_count }} {{ t('payment.admin.orders') }}
          </p>
        </div>
      </div>
    </div>

    <!-- Total Revenue -->
    <div class="card p-4">
      <div class="flex items-center gap-3">
        <div class="rounded-lg bg-[var(--anthropic-info-bg)] p-2 dark:bg-[var(--anthropic-info-bg)]">
          <Icon name="creditCard" size="md" class="text-[var(--anthropic-info)] dark:text-[var(--anthropic-info)]" :stroke-width="2" />
        </div>
        <div>
          <p class="text-xs font-medium text-[var(--anthropic-muted)] dark:text-[var(--anthropic-muted)]">{{ t('payment.admin.totalRevenue') }}</p>
          <p class="text-xl font-bold text-[var(--anthropic-fg)] dark:text-[var(--anthropic-fg)]">${{ formatMoney(stats.total_amount) }}</p>
          <p class="text-xs text-[var(--anthropic-muted)] dark:text-[var(--anthropic-muted)]">
            {{ stats.total_count }} {{ t('payment.admin.orders') }}
          </p>
        </div>
      </div>
    </div>

    <!-- Today Orders -->
    <div class="card p-4">
      <div class="flex items-center gap-3">
        <div class="rounded-lg bg-accent-200 p-2 dark:bg-accent-900/30">
          <Icon name="chart" size="md" class="text-accent-600 dark:text-accent-500" :stroke-width="2" />
        </div>
        <div>
          <p class="text-xs font-medium text-[var(--anthropic-muted)] dark:text-[var(--anthropic-muted)]">{{ t('payment.admin.todayOrders') }}</p>
          <p class="text-xl font-bold text-[var(--anthropic-fg)] dark:text-[var(--anthropic-fg)]">{{ stats.today_count }}</p>
        </div>
      </div>
    </div>

    <!-- Average Amount -->
    <div class="card p-4">
      <div class="flex items-center gap-3">
        <div class="rounded-lg bg-amber-100 p-2 dark:bg-amber-900/30">
          <Icon name="chart" size="md" class="text-amber-600 dark:text-amber-400" :stroke-width="2" />
        </div>
        <div>
          <p class="text-xs font-medium text-[var(--anthropic-muted)] dark:text-[var(--anthropic-muted)]">{{ t('payment.admin.avgAmount') }}</p>
          <p class="text-xl font-bold text-[var(--anthropic-fg)] dark:text-[var(--anthropic-fg)]">${{ formatMoney(stats.avg_amount) }}</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import Icon from '@/components/icons/Icon.vue'
import type { DashboardStats } from '@/types/payment'

const { t } = useI18n()

defineProps<{
  stats: DashboardStats
}>()

function formatMoney(value: number): string {
  return value.toFixed(2)
}
</script>
