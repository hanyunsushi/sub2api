<template>
  <div v-if="visible" class="space-y-1">
    <!--
      Unified action row. Parents that already render their own "local query"
      affordance (e.g. AccountUsageCell's active-sampling refresh) pass it in
      via the #pre-actions slot so the user sees a single row of related
      buttons rather than two near-duplicate "查询" rows.

      The 5h / 7d window bars are deliberately NOT rendered here — the local
      active-sampling display (UsageProgressBar in AccountUsageCell) already
      owns that real estate. This cell is purely about the rate-limit reset
      credit: query its count, consume one if needed.
    -->
    <div class="flex flex-wrap items-center gap-1.5">
      <slot name="pre-actions" />

      <button
        type="button"
        class="openai-quota-reset-action inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-medium text-[var(--anthropic-muted)] transition-colors disabled:cursor-not-allowed disabled:opacity-50"
        data-testid="openai-quota-reset-query"
        :disabled="loading || resetting"
        :title="countButtonTitle"
        @click="handleQuery"
      >
        {{ t('admin.accounts.openaiQuotaReset.count') }}<span v-if="data"> {{ availableResetCount }}</span>
      </button>

      <button
        type="button"
        class="openai-quota-reset-action inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-medium text-[var(--anthropic-muted)] transition-colors disabled:cursor-not-allowed disabled:opacity-50"
        data-testid="openai-quota-reset-consume"
        :disabled="resetting || loading || !canReset"
        :title="resetButtonTitle"
        @click="handleReset"
      >
        {{ t('admin.accounts.openaiQuotaReset.reset') }}
      </button>
    </div>

    <!-- Error / success feedback -->
    <div
      v-if="error"
      class="text-[10px] text-red-600 dark:text-red-400"
      :title="error"
    >
      {{ truncatedError }}
    </div>
    <div
      v-else-if="resetMessage"
      class="text-[10px] text-emerald-600 dark:text-emerald-400"
    >
      {{ resetMessage }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import type { Account } from '@/types'
import {
  queryOpenAIQuota,
  resetOpenAIQuota,
  type OpenAIQuotaUsage,
  type OpenAIQuotaResetResult
} from '@/api/admin/accounts'

const props = defineProps<{
  account: Account
}>()

const { t } = useI18n()

// Visible only for OpenAI OAuth accounts.
const visible = computed(() => props.account.platform === 'openai' && props.account.type === 'oauth')

const loading = ref(false)
const resetting = ref(false)
const error = ref<string | null>(null)
const data = ref<OpenAIQuotaUsage | null>(null)
const resetMessage = ref<string | null>(null)

const availableResetCount = computed(() => data.value?.rate_limit_reset_credits?.available_count ?? 0)
const canReset = computed(() => availableResetCount.value > 0)

const resetButtonTitle = computed(() => {
  if (!data.value) return t('admin.accounts.openaiQuotaReset.resetTooltipNeedQuery')
  if (!canReset.value) return t('admin.accounts.openaiQuotaReset.resetTooltipNoCredits')
  return t('admin.accounts.openaiQuotaReset.resetTooltipReady')
})

// "次数" button doubles as the upstream-query trigger and the count display.
// Tooltip differs between "click to load" (no data yet) and "click to refresh".
const countButtonTitle = computed(() => {
  if (!data.value) return t('admin.accounts.openaiQuotaReset.countTooltipLoad')
  return t('admin.accounts.openaiQuotaReset.countTooltipRefresh')
})

const truncatedError = computed(() => {
  if (!error.value) return ''
  return error.value.length > 80 ? `${error.value.slice(0, 80)}…` : error.value
})

const extractErrorMessage = (e: unknown): string => {
  // The project's axios response interceptor (api/client.ts) flattens server
  // errors into { status, code, message, reason, ... } and re-rejects them, so
  // the message lives at the top level rather than under .response.data. Fall
  // back to the raw axios shape for the cancellation/network branches that
  // bypass the flattening, and finally to the generic i18n string.
  const err = e as {
    message?: string
    reason?: string
    response?: { data?: { message?: string; error?: string } }
  }
  return (
    err?.message ||
    err?.reason ||
    err?.response?.data?.message ||
    err?.response?.data?.error ||
    t('common.error')
  )
}

const handleQuery = async () => {
  if (loading.value) return
  loading.value = true
  error.value = null
  resetMessage.value = null
  try {
    data.value = await queryOpenAIQuota(props.account.id)
  } catch (e) {
    error.value = extractErrorMessage(e)
  } finally {
    loading.value = false
  }
}

const handleReset = async () => {
  if (resetting.value) return
  if (!canReset.value) {
    error.value = t('admin.accounts.openaiQuotaReset.noCreditsAvailable')
    return
  }
  resetting.value = true
  error.value = null
  resetMessage.value = null
  try {
    const result: OpenAIQuotaResetResult = await resetOpenAIQuota(props.account.id)
    // Refresh the reset-credit count so the badge reflects the consumed credit.
    // handleQuery clears resetMessage on entry, so the success toast is set
    // AFTER it resolves.
    await handleQuery()
    resetMessage.value = t('admin.accounts.openaiQuotaReset.resetSuccess', {
      windows: result.windows_reset
    })
  } catch (e) {
    error.value = extractErrorMessage(e)
  } finally {
    resetting.value = false
  }
}

watch(
  () => props.account.id,
  () => {
    // Account row may be reused across paginated lists; reset local state.
    data.value = null
    error.value = null
    resetMessage.value = null
    loading.value = false
    resetting.value = false
  }
)
</script>

<style scoped>
.openai-quota-reset-action {
  background: transparent;
  border: 0;
  box-shadow: none;
  text-decoration-line: underline;
  text-decoration-color: transparent;
  text-underline-offset: 0.22em;
}

.openai-quota-reset-action:hover,
.openai-quota-reset-action:focus-visible {
  background: transparent;
  color: var(--anthropic-fg);
  text-decoration-color: currentColor;
}
</style>
