<template>
  <div class="card">
    <div class="border-b border-[var(--anthropic-border)] px-6 py-4 dark:border-[var(--anthropic-border)]">
      <h2 class="text-lg font-semibold text-[var(--anthropic-fg)] dark:text-[var(--anthropic-fg)]">{{ t('dashboard.quickActions') }}</h2>
    </div>
    <div class="space-y-3 p-4">
      <button data-testid="user-dashboard-user-dashboard-quick-actions-button-push-keys" @click="router.push('/keys')" class="group flex w-full items-center gap-4 rounded-xl bg-[var(--anthropic-section)] p-4 text-left transition-all duration-200 dark:bg-[var(--anthropic-section)]">
        <div class="dashboard-stat-icon dashboard-stat-icon-lg transition-transform">
          <Icon name="key" size="lg" class="text-[var(--anthropic-fg)] dark:text-[var(--anthropic-fg)]" />
        </div>
        <div class="min-w-0 flex-1">
          <p class="text-sm font-medium text-[var(--anthropic-fg)] dark:text-[var(--anthropic-fg)]">{{ t('dashboard.createApiKey') }}</p>
          <p class="text-xs text-[var(--anthropic-muted)] dark:text-dark-400">{{ t('dashboard.generateNewKey') }}</p>
        </div>
        <Icon
          name="chevronRight"
          size="md"
          class="text-[var(--anthropic-muted)] transition-colors dark:text-dark-500"
        />
      </button>

      <button data-testid="user-dashboard-user-dashboard-quick-actions-button-push-usage" @click="router.push('/usage')" class="group flex w-full items-center gap-4 rounded-xl bg-[var(--anthropic-section)] p-4 text-left transition-all duration-200 dark:bg-[var(--anthropic-section)]">
        <div class="dashboard-stat-icon dashboard-stat-icon-lg transition-transform">
          <Icon name="chart" size="lg" class="text-[var(--anthropic-fg)] dark:text-[var(--anthropic-fg)]" />
        </div>
        <div class="min-w-0 flex-1">
          <p class="text-sm font-medium text-[var(--anthropic-fg)] dark:text-[var(--anthropic-fg)]">{{ t('dashboard.viewUsage') }}</p>
          <p class="text-xs text-[var(--anthropic-muted)] dark:text-dark-400">{{ t('dashboard.checkDetailedLogs') }}</p>
        </div>
        <Icon
          name="chevronRight"
          size="md"
          class="text-[var(--anthropic-muted)] transition-colors dark:text-dark-500"
        />
      </button>

      <button v-if="canUseBatchImage" data-testid="user-dashboard-user-dashboard-quick-actions-button-push-batch-image" @click="router.push('/batch-image')" class="group flex w-full items-center gap-4 rounded-xl bg-[var(--anthropic-section)] p-4 text-left transition-all duration-200 dark:bg-[var(--anthropic-section)]">
        <div class="dashboard-stat-icon dashboard-stat-icon-lg transition-transform">
          <Icon name="sparkles" size="lg" class="text-[var(--anthropic-fg)] dark:text-[var(--anthropic-fg)]" />
        </div>
        <div class="min-w-0 flex-1">
          <p class="text-sm font-medium text-[var(--anthropic-fg)] dark:text-[var(--anthropic-fg)]">{{ t('dashboard.batchImageAgent') }}</p>
          <p class="text-xs text-[var(--anthropic-muted)] dark:text-dark-400">{{ t('dashboard.batchImageAgentDesc') }}</p>
        </div>
        <Icon
          name="chevronRight"
          size="md"
          class="text-[var(--anthropic-muted)] transition-colors dark:text-dark-500"
        />
      </button>

      <button data-testid="user-dashboard-user-dashboard-quick-actions-button-push-redeem" @click="router.push('/redeem')" class="group flex w-full items-center gap-4 rounded-xl bg-[var(--anthropic-section)] p-4 text-left transition-all duration-200 dark:bg-[var(--anthropic-section)]">
        <div class="dashboard-stat-icon dashboard-stat-icon-lg transition-transform">
          <Icon name="gift" size="lg" class="text-[var(--anthropic-fg)] dark:text-[var(--anthropic-fg)]" />
        </div>
        <div class="min-w-0 flex-1">
          <p class="text-sm font-medium text-[var(--anthropic-fg)] dark:text-[var(--anthropic-fg)]">{{ t('dashboard.redeemCode') }}</p>
          <p class="text-xs text-[var(--anthropic-muted)] dark:text-dark-400">{{ t('dashboard.addBalanceWithCode') }}</p>
        </div>
        <Icon
          name="chevronRight"
          size="md"
          class="text-[var(--anthropic-muted)] transition-colors dark:text-dark-500"
        />
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import Icon from '@/components/icons/Icon.vue'
import { useBatchImageAccess } from '@/composables/useBatchImageAccess'
const router = useRouter()
const { t } = useI18n()
const { canUseBatchImage, refreshBatchImageAccess } = useBatchImageAccess()

onMounted(() => {
  void refreshBatchImageAccess()
})
</script>
