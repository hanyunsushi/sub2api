<template>
  <BaseDialog
    :show="show"
    :title="localText('额度条', 'Quota bar')"
    width="normal"
    :z-index="70"
    @close="emit('close')"
  >
    <form id="external-quota-progress-settings-form" class="space-y-5" @submit.prevent="handleSubmit">
      <div class="rounded-lg border border-[var(--anthropic-border)] bg-[var(--anthropic-section)] px-3 py-2 dark:border-[var(--anthropic-border)] dark:bg-[var(--anthropic-section)]">
        <div class="truncate text-sm font-semibold text-[var(--anthropic-fg)] dark:text-[var(--anthropic-fg)]">
          {{ account?.name || '-' }}
        </div>
        <div class="mt-1 flex items-center justify-between gap-3 text-xs text-[var(--anthropic-muted)] dark:text-[var(--anthropic-muted)]">
          <span class="truncate">{{ subscriptionLabel }}</span>
          <span class="font-mono">{{ balanceText }}</span>
        </div>
      </div>

      <label class="flex items-center justify-between gap-3 rounded-lg border border-[var(--anthropic-border)] px-3 py-2 dark:border-[var(--anthropic-border)]">
        <span class="text-sm font-medium text-[var(--anthropic-muted)] dark:text-[var(--anthropic-muted)]">
          {{ localText('启用额度条', 'Enable quota bar') }}
        </span>
        <Toggle v-model="form.enabled" />
      </label>

      <fieldset class="space-y-2">
        <legend class="input-label">{{ localText('计算方式', 'Calculation') }}</legend>
        <div class="grid gap-2 sm:grid-cols-3">
          <label
            :class="[
              'external-quota-mode-option',
              form.mode === 'status_total' ? 'external-quota-mode-option--active' : '',
              !hasStatusTotal ? 'external-quota-mode-option--disabled' : ''
            ]"
          >
            <input data-testid="admin-account-external-quota-progress-settings-input-form-mode"
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
            <input data-testid="admin-account-external-quota-progress-settings-input-form-mode-2"
              v-model="form.mode"
              type="radio"
              class="sr-only"
              value="custom_total"
            />
            <span>{{ localText('余额 / 自定义总额', 'Balance / custom total') }}</span>
            <span class="font-mono text-xs">{{ customTotalText }}</span>
          </label>
          <label
            :class="[
              'external-quota-mode-option',
              form.mode === 'token_total' ? 'external-quota-mode-option--active' : ''
            ]"
          >
            <input data-testid="admin-account-external-quota-progress-settings-input-form-mode-3"
              v-model="form.mode"
              type="radio"
              class="sr-only"
              value="token_total"
            />
            <span>{{ localText('Token 用量 / 总量', 'Token usage / total') }}</span>
            <span class="font-mono text-xs">{{ tokenTotalText }}</span>
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
          data-testid="external-quota-progress-custom-total"
        />
      </div>

      <div v-if="form.mode === 'token_total'" class="grid gap-3 sm:grid-cols-2">
        <div class="space-y-1.5">
          <label class="input-label">{{ localText('Token 总量', 'Token total') }}</label>
          <input
            v-model="form.tokenTotal"
            type="number"
            min="0"
            step="1"
            class="input font-mono"
            inputmode="numeric"
            data-testid="external-quota-progress-token-total"
          />
        </div>
        <div class="space-y-1.5">
          <label class="input-label">{{ localText('统计窗口', 'Usage window') }}</label>
          <div class="external-quota-token-window">
            <span class="min-w-0 truncate font-mono text-xs">{{ tokenWindowText }}</span>
            <button
              type="button"
              class="btn btn-secondary btn-sm"
              data-testid="external-quota-progress-refresh-token-window"
              @click="refreshTokenWindow"
            >
              {{ localText('刷新统计', 'Refresh stats') }}
            </button>
          </div>
        </div>
      </div>

      <div class="external-quota-preview rounded-lg border border-[var(--anthropic-border)] px-3 py-2 dark:border-[var(--anthropic-border)]">
        <div class="mb-2 flex items-center justify-between gap-3 text-xs text-[var(--anthropic-muted)] dark:text-[var(--anthropic-muted)]">
          <span>{{ localText('预览', 'Preview') }}</span>
          <span class="font-mono">{{ previewAmountText }}</span>
        </div>
        <UsageProgressBar
          v-if="previewMeta"
          label="EXT"
          :utilization="previewMeta.percent"
          color="success"
          :show-now-when-idle="false"
        />
        <div v-else class="h-6 rounded bg-[var(--anthropic-raised)] dark:bg-[var(--anthropic-section)]"></div>
      </div>
    </form>

    <template #footer>
      <div class="flex justify-end gap-3">
        <button type="button" class="btn btn-secondary" data-testid="external-quota-progress-cancel" @click="emit('close')">
          {{ t('common.cancel') }}
        </button>
        <button type="submit" form="external-quota-progress-settings-form" class="btn btn-primary" data-testid="external-quota-progress-save">
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
import { buildAccountExternalQuotaProgressPreferenceKey } from '@/composables/useAccountExternalQuotaProgressSettings'
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
const localText = (zh: string, en: string) => locale?.value?.startsWith('zh') ? zh : en

const form = reactive({
  enabled: false,
  mode: 'status_total' as ExternalQuotaProgressMode,
  customTotal: '',
  tokenTotal: '',
  tokenResetAt: '',
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

const parseTokenTotal = () => {
  const value = Number(form.tokenTotal)
  return Number.isFinite(value) && value > 0 ? value : null
}

const parseTokenResetAt = () => {
  if (!form.tokenResetAt) return null
  const parsed = new Date(form.tokenResetAt)
  if (Number.isNaN(parsed.getTime())) return null
  const now = Date.now()
  return new Date(Math.min(parsed.getTime(), now)).toISOString()
}

const toISOStringValue = (value?: string | null) => {
  if (!value) return ''
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return ''
  return parsed.toISOString()
}

const defaultTokenResetAt = () => new Date().toISOString()

const currentPreference = computed<AccountExternalQuotaProgressPreference>(() => ({
  enabled: form.enabled,
  mode: form.mode,
  customTotal: parseCustomTotal(),
  tokenTotal: parseTokenTotal(),
  tokenResetAt: parseTokenResetAt(),
}))

const hasStatusTotal = computed(() => (
  hasProviderTotal(props.subscription)
))

const subscriptionLabel = computed(() => props.subscription?.name || props.subscription?.provider || '-')
const balanceText = computed(() => formatAmount(props.subscription?.remaining_usd, props.subscription?.currency))
const statusTotalText = computed(() => formatAmount(props.subscription?.total_limit_usd, props.subscription?.currency))
const customTotalText = computed(() => formatAmount(parseCustomTotal(), props.subscription?.currency))
const tokenTotalText = computed(() => formatTokens(parseTokenTotal()))
const tokenWindowText = computed(() => {
  const parsed = parseTokenResetAt()
  if (!parsed) return localText('未刷新', 'Not refreshed')
  return localText(
    `自 ${formatDateTime(parsed)} 起`,
    `Since ${formatDateTime(parsed)}`,
  )
})
const tokenStats = computed(() => {
  if (!props.account) return null
  const key = buildAccountExternalQuotaProgressPreferenceKey(props.account, props.subscription ?? null)
  return props.account.external_quota_token_stats?.[key] ?? null
})
const previewMeta = computed(() => buildAccountExternalQuotaProgressMeta(props.subscription, currentPreference.value, {
  tokenStats: tokenStats.value,
}))
const previewAmountText = computed(() => {
  if (!previewMeta.value) return '-'
  const remaining = previewMeta.value.unit === 'tokens'
    ? formatTokens(previewMeta.value.remaining)
    : formatAmount(previewMeta.value.remaining, props.subscription?.currency)
  const total = previewMeta.value.unit === 'tokens'
    ? formatTokens(previewMeta.value.total)
    : formatAmount(previewMeta.value.total, props.subscription?.currency)
  return `${remaining} / ${total}`
})

function formatTokens(value?: number | null) {
  if (typeof value !== 'number' || !Number.isFinite(value)) return '-'
  return `${Math.round(value).toLocaleString()} token`
}

function formatDateTime(value: string) {
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return '-'
  return parsed.toLocaleString(locale.value?.startsWith('zh') ? 'zh-CN' : 'en-US', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function refreshTokenWindow() {
  form.tokenResetAt = new Date().toISOString()
}

watch(
  () => [props.show, props.settings, props.subscription] as const,
  () => {
    if (!props.show) return
    const next = props.settings ?? { enabled: false, mode: 'status_total', customTotal: null }
    form.enabled = next.enabled === true
    form.mode = next.mode === 'token_total' || next.mode === 'custom_total' || hasStatusTotal.value
      ? next.mode
      : 'custom_total'
    form.customTotal = typeof next.customTotal === 'number' && Number.isFinite(next.customTotal)
      ? String(next.customTotal)
      : ''
    form.tokenTotal = typeof next.tokenTotal === 'number' && Number.isFinite(next.tokenTotal)
      ? String(next.tokenTotal)
      : ''
    form.tokenResetAt = toISOStringValue(next.tokenResetAt) || defaultTokenResetAt()
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

.external-quota-token-window {
  align-items: center;
  border: 1px solid var(--atelier-material-edge, rgba(17, 24, 39, 0.12));
  border-radius: 8px;
  display: flex;
  gap: 0.5rem;
  justify-content: space-between;
  min-height: 2.5rem;
  padding: 0.375rem 0.375rem 0.375rem 0.75rem;
}
</style>
