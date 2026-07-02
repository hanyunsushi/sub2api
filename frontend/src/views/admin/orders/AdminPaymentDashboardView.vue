<template>
  <AppLayout>
    <div class="space-y-6">
      <!-- Header with Day Switcher -->
      <div class="payment-dashboard-filter-bar table-page-filter-section flex items-center justify-end">
        <div class="payment-dashboard-filter-shell table-filter-shell flex flex-wrap items-center gap-3">
          <div class="payment-dashboard-day-switcher flex items-center gap-3">
            <button data-testid="admin-orders-admin-payment-dashboard-button-days-d"
              v-for="d in DAYS_OPTIONS"
              :key="d"
              type="button"
              class="px-3 py-1.5 text-xs font-medium transition-colors first:rounded-l-lg last:rounded-r-lg"
              :class="days === d
                ? 'bg-[var(--anthropic-fg)] text-white'
                : 'text-[var(--anthropic-muted)] hover:bg-[var(--anthropic-raised)] dark:text-[var(--anthropic-muted)] dark:hover:bg-[var(--anthropic-raised)]'"
              @click="days = d"
            >
              {{ d }}{{ t('payment.admin.daySuffix') }}
            </button>
          </div>
          <button data-testid="admin-orders-admin-payment-dashboard-button-load-dashboard" @click="loadDashboard" :disabled="loading" class="btn btn-primary anthropic-refresh-action-button payment-dashboard-refresh-button" :title="t('common.refresh')">
            {{ t("common.refresh") }}
          </button>
        </div>
      </div>

      <!-- Dashboard Content -->
      <div v-if="loading" class="flex items-center justify-center py-12">
        <LoadingSpinner />
      </div>
      <template v-else-if="stats">
        <OrderStatsCards :stats="stats" />
        <DailyRevenueChart :data="stats.daily_series || []" :loading="loading" />
        <div class="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div class="card p-4">
            <h3 class="mb-4 text-sm font-semibold text-[var(--anthropic-fg)] dark:text-[var(--anthropic-fg)]">{{ t('payment.admin.paymentDistribution') }}</h3>
            <div v-if="!stats.payment_methods?.length" class="flex h-32 items-center justify-center text-sm text-[var(--anthropic-muted)] dark:text-[var(--anthropic-muted)]">{{ t('payment.admin.noData') }}</div>
            <div v-else class="space-y-3">
              <div v-for="method in stats.payment_methods" :key="method.type" class="flex items-center justify-between">
                <div class="flex items-center gap-2">
                  <span :class="['inline-block h-3 w-3 rounded-full', methodColor(method.type)]"></span>
                  <span class="text-sm text-[var(--anthropic-muted)] dark:text-[var(--anthropic-muted)]">{{ t('payment.methods.' + method.type, method.type) }}</span>
                </div>
                <div class="text-right">
                  <span class="text-sm font-medium text-[var(--anthropic-fg)] dark:text-[var(--anthropic-fg)]">&yen;{{ method.amount.toFixed(2) }}</span>
                  <span class="ml-2 text-xs text-[var(--anthropic-muted)] dark:text-[var(--anthropic-muted)]">({{ method.count }})</span>
                </div>
              </div>
            </div>
          </div>
          <div class="card p-4">
            <h3 class="mb-4 text-sm font-semibold text-[var(--anthropic-fg)] dark:text-[var(--anthropic-fg)]">{{ t('payment.admin.topUsers') }}</h3>
            <div v-if="!stats.top_users?.length" class="flex h-32 items-center justify-center text-sm text-[var(--anthropic-muted)] dark:text-[var(--anthropic-muted)]">{{ t('payment.admin.noData') }}</div>
            <div v-else class="space-y-2">
              <div v-for="(user, idx) in stats.top_users" :key="user.user_id" class="flex items-center justify-between rounded-lg px-3 py-2 hover:bg-[var(--anthropic-section)] dark:hover:bg-[var(--anthropic-raised)]">
                <div class="flex items-center gap-3">
                  <span :class="['flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold', rankClass(idx)]">{{ idx + 1 }}</span>
                  <span class="text-sm text-[var(--anthropic-muted)] dark:text-[var(--anthropic-muted)]">{{ user.email }}</span>
                </div>
                <span class="text-sm font-medium text-[var(--anthropic-fg)] dark:text-[var(--anthropic-fg)]">&yen;{{ user.amount.toFixed(2) }}</span>
              </div>
            </div>
          </div>
        </div>
      </template>
    </div>
  </AppLayout>
</template>

<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useAppStore } from '@/stores/app'
import { adminPaymentAPI } from '@/api/admin/payment'
import { extractI18nErrorMessage } from '@/utils/apiError'
import type { DashboardStats } from '@/types/payment'
import AppLayout from '@/components/layout/AppLayout.vue'
import LoadingSpinner from '@/components/common/LoadingSpinner.vue'
import OrderStatsCards from '@/components/admin/payment/OrderStatsCards.vue'
import DailyRevenueChart from '@/components/admin/payment/DailyRevenueChart.vue'

const { t } = useI18n()
const appStore = useAppStore()

const DAYS_OPTIONS = [7, 30, 90] as const
const days = ref<number>(30)
const loading = ref(false)
const stats = ref<DashboardStats | null>(null)

function methodColor(type: string): string {
  const c: Record<string, string> = {
    alipay: 'bg-[var(--anthropic-info)]', wxpay: 'bg-green-500',
    alipay_direct: 'bg-[var(--anthropic-info)]', wxpay_direct: 'bg-green-400',
    stripe: 'bg-accent-800',
  }
  return c[type] || 'bg-gray-400'
}

function rankClass(idx: number): string {
  if (idx === 0) return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
  if (idx === 1) return 'bg-[var(--anthropic-raised)] text-[var(--anthropic-muted)] dark:bg-[var(--anthropic-section)] dark:text-[var(--anthropic-muted)]'
  if (idx === 2) return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
  return 'bg-[var(--anthropic-raised)] text-[var(--anthropic-muted)] dark:bg-[var(--anthropic-section)] dark:text-[var(--anthropic-muted)]'
}

async function loadDashboard() {
  loading.value = true
  try {
    const res = await adminPaymentAPI.getDashboard(days.value)
    stats.value = res.data
  } catch (err: unknown) {
    appStore.showError(extractI18nErrorMessage(err, t, 'payment.errors', t('common.error')))
  } finally {
    loading.value = false
  }
}

watch(days, () => loadDashboard())
onMounted(() => loadDashboard())
</script>
