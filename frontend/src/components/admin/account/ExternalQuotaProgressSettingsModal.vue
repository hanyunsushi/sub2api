<template>
  <BaseDialog
    :show="show"
    :title="localText('额度条', 'Quota bar')"
    width="normal"
    :z-index="70"
    @close="emit('close')"
  >
    <form id="external-quota-progress-settings-form" class="space-y-5" @submit.prevent="handleSubmit">
      <div class="rounded-lg border border-gray-200 bg-gray-50/70 px-3 py-2 dark:border-dark-700 dark:bg-dark-800/60">
        <div class="truncate text-sm font-semibold text-gray-900 dark:text-white">
          {{ account?.name || '-' }}
        </div>
        <div class="mt-1 flex items-center justify-between gap-3 text-xs text-gray-500 dark:text-gray-400">
          <span class="truncate">{{ subscriptionLabel }}</span>
          <span class="font-mono">{{ balanceText }}</span>
        </div>
      </div>

      <label class="flex items-center justify-between gap-3 rounded-lg border border-gray-200 px-3 py-2 dark:border-dark-700">
        <span class="text-sm font-medium text-gray-700 dark:text-gray-200">
          {{ localText('启用额度条', 'Enable quota bar') }}
        </span>
        <Toggle v-model="form.enabled" />
      </label>

      <fieldset class="space-y-2">
        <legend class="input-label">{{ localText('计算方式', 'Calculation') }}</legend>
        <div class="grid gap-2 sm:grid-cols-2">
          <label
            :class="[
              'external-quota-mode-option',
              form.mode === 'status_total' ? 'external-quota-mode-option--active' : '',
              !hasStatusTotal ? 'external-quota-mode-option--disabled' : ''
            ]"
          >
            <input
              v-model="form.mode"
              type="radio"
              class="sr-only"
              value="status_total"
              :disabled="!hasStatusTotal"
            />
            <span>{{ localText('余额 / 订阅总额', 'Balance / provider total') }}</span>
            <span class="font-mono text-xs">{{ statusTotalText }}</span>
          </label>
          <label
            :class="[
              'external-quota-mode-option',
              form.mode === 'custom_total' ? 'external-quota-mode-option--active' : ''
            ]"
          >
            <input
              v-model="form.mode"
              type="radio"
              class="sr-only"
              value="custom_total"
            />
            <span>{{ localText('余额 / 自定义总额', 'Balance / custom total') }}</span>
            <span class="font-mono text-xs">{{ customTotalText }}</span>
          </label>
        </div>
      </fieldset>

      <div v-if="form.mode === 'custom_total'" class="space-y-1.5">
        <label class="input-label">{{ localText('自定义总额', 'Custom total') }}</label>
        <input
          v-model="form.customTotal"
          type="number"
          min="0"
          step="0.01"
          class="input font-mono"
          inputmode="decimal"
        />
      </div>

      <div class="external-quota-preview rounded-lg border border-gray-200 px-3 py-2 dark:border-dark-700">
        <div class="mb-2 flex items-center justify-between gap-3 text-xs text-gray-500 dark:text-gray-400">
          <span>{{ localText('预览', 'Preview') }}</span>
          <span class="font-mono">{{ previewAmountText }}</span>
        </div>
        <UsageProgressBar
          v-if="previewMeta"
          label="EXT"
          :utilization="previewMeta.percent"
          color="amber"
          :show-now-when-idle="false"
        />
        <div v-else class="h-6 rounded bg-gray-100 dark:bg-dark-800"></div>
      </div>
    </form>

    <template #footer>
      <div class="flex justify-end gap-3">
        <button type="button" class="btn btn-secondary" @click="emit('close')">
          {{ t('common.cancel') }}
        </button>
        <button type="submit" form="external-quota-progress-settings-form" class="btn btn-primary">
          {{ t('common.save') }}
        </button>
      </div>
    </template>
  </BaseDialog>
</template>

<script setup lang="ts">
import { computed, reactive, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import BaseDialog from '@/components/common/BaseDialog.vue'
import Toggle from '@/components/common/Toggle.vue'
import UsageProgressBar from '@/components/account/UsageProgressBar.vue'
import type { ExternalSubscriptionStatus } from '@/api/admin/externalSubscriptions'
import type { Account } from '@/types'
import {
  buildAccountExternalQuotaProgressMeta,
  type AccountExternalQuotaProgressPreference,
  type ExternalQuotaProgressMode,
} from '@/utils/externalSubscriptionQuotaProgress'

const props = defineProps<{
  show: boolean
  account: Account | null
  subscription: ExternalSubscriptionStatus | null
  settings: AccountExternalQuotaProgressPreference | null
}>()

const emit = defineEmits<{
  close: []
  save: [settings: AccountExternalQuotaProgressPreference]
}>()

const { t, locale } = useI18n()
const localText = (zh: string, en: string) => locale.value?.startsWith('zh') ? zh : en

const form = reactive({
  enabled: false,
  mode: 'status_total' as ExternalQuotaProgressMode,
  customTotal: '',
})

const hasProviderTotal = (subscription?: ExternalSubscriptionStatus | null) => (
  typeof subscription?.total_limit_usd === 'number' &&
  Number.isFinite(subscription.total_limit_usd) &&
  subscription.total_limit_usd > 0
)

const formatAmount = (value?: number | null, currency?: string | null) => {
  if (typeof value !== 'number' || !Number.isFinite(value)) return '-'
  const normalized = (currency || '').trim().toUpperCase()
  if (normalized === 'CNY' || normalized === 'RMB') return `¥${value.toFixed(2)}`
  if (normalized === 'JPY') return `¥${value.toFixed(0)}`
  if (normalized && normalized !== 'USD') return `${normalized} ${value.toFixed(2)}`
  return `$${value.toFixed(2)}`
}

const parseCustomTotal = () => {
  const value = Number(form.customTotal)
  return Number.isFinite(value) && value > 0 ? value : null
}

const currentPreference = computed<AccountExternalQuotaProgressPreference>(() => ({
  enabled: form.enabled,
  mode: form.mode,
  customTotal: parseCustomTotal(),
}))

const hasStatusTotal = computed(() => (
  hasProviderTotal(props.subscription)
))

const subscriptionLabel = computed(() => props.subscription?.name || props.subscription?.provider || '-')
const balanceText = computed(() => formatAmount(props.subscription?.remaining_usd, props.subscription?.currency))
const statusTotalText = computed(() => formatAmount(props.subscription?.total_limit_usd, props.subscription?.currency))
const customTotalText = computed(() => formatAmount(parseCustomTotal(), props.subscription?.currency))
const previewMeta = computed(() => buildAccountExternalQuotaProgressMeta(props.subscription, currentPreference.value))
const previewAmountText = computed(() => {
  if (!previewMeta.value || !props.subscription) return '-'
  const remaining = formatAmount(previewMeta.value.remaining, props.subscription.currency)
  const total = formatAmount(previewMeta.value.total, props.subscription.currency)
  return `${remaining} / ${total}`
})

watch(
  () => [props.show, props.settings, props.subscription] as const,
  () => {
    if (!props.show) return
    const next = props.settings ?? { enabled: false, mode: 'status_total', customTotal: null }
    form.enabled = next.enabled === true
    form.mode = next.mode === 'custom_total' || hasStatusTotal.value
      ? next.mode
      : 'custom_total'
    form.customTotal = typeof next.customTotal === 'number' && Number.isFinite(next.customTotal)
      ? String(next.customTotal)
      : ''
  },
  { immediate: true },
)

const handleSubmit = () => {
  emit('save', currentPreference.value)
}
</script>

<style scoped>
.external-quota-mode-option {
  display: grid;
  gap: 0.25rem;
  min-height: 4.5rem;
  cursor: pointer;
  border: 1px solid var(--atelier-material-edge, rgba(17, 24, 39, 0.12));
  border-radius: 8px;
  padding: 0.75rem;
  color: var(--atelier-text, #4b5563);
  background: color-mix(in srgb, var(--atelier-paper-2, #ffffff) 94%, transparent);
  transition:
    border-color 0.18s ease,
    background-color 0.18s ease,
    color 0.18s ease;
}

.external-quota-mode-option--active {
  border-color: var(--atelier-terracotta-action, #c96442);
  color: var(--atelier-ink, #171512);
  background: color-mix(in srgb, var(--atelier-terracotta-action, #c96442) 9%, var(--atelier-paper-2, #ffffff));
}

.external-quota-mode-option--disabled {
  cursor: not-allowed;
  opacity: 0.52;
}
</style>
