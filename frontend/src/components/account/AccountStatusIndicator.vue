<template>
  <div class="account-status-indicator flex items-center gap-2">
    <!-- Rate Limit Display (429) - Two-line layout -->
    <div v-if="isRateLimited" class="flex flex-col items-center gap-1">
      <span class="badge text-xs badge-warning">{{ t('admin.accounts.status.rateLimited') }}</span>
      <span class="text-[11px] text-[var(--anthropic-muted)] dark:text-[var(--anthropic-muted)]">{{ rateLimitResumeText }}</span>
    </div>

    <!-- Overload Display (529) - Two-line layout -->
    <div v-else-if="isOverloaded" class="flex flex-col items-center gap-1">
      <span class="badge text-xs badge-danger">{{ t('admin.accounts.status.overloaded') }}</span>
      <span class="text-[11px] text-[var(--anthropic-muted)] dark:text-[var(--anthropic-muted)]">{{ overloadCountdown }}</span>
    </div>

    <!-- Main Status Badge (shown when not rate limited/overloaded) -->
    <template v-else>
      <button data-testid="account-account-status-indicator-button-handle-temp-unsched-click"
        v-if="isTempUnschedulable"
        type="button"
        :class="['badge text-xs', statusClass, 'cursor-pointer']"
        :title="t('admin.accounts.status.viewTempUnschedDetails')"
        @click="handleTempUnschedClick"
      >
        {{ statusText }}
      </button>
      <span v-else :class="['badge text-xs', statusClass]">
        {{ statusText }}
      </span>
    </template>

    <!-- Error Info Indicator -->
    <div v-if="hasError && account.error_message">
      <button data-testid="account-account-status-indicator-button-button"
        type="button"
        class="account-status-tooltip-trigger h-4 w-4 cursor-help text-red-500 transition-colors hover:text-red-600 focus:outline-none dark:text-red-400 dark:hover:text-red-300"
        :aria-label="t('admin.accounts.status.viewTempUnschedDetails')"
        @mouseenter="showFloatingTooltip($event, String(account.error_message), 'bottom')"
        @mouseleave="hideFloatingTooltip"
        @focus="showFloatingTooltip($event, String(account.error_message), 'bottom')"
        @blur="hideFloatingTooltip"
      >
        <svg
          class="h-4 w-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          stroke-width="2"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z"
          />
        </svg>
      </button>
    </div>

    <!-- Rate Limit Indicator (429) -->
    <div v-if="isRateLimited">
      <span
        class="inline-flex items-center gap-1 rounded bg-amber-100 px-1.5 py-0.5 text-xs font-medium text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
        tabindex="0"
        @mouseenter="showFloatingTooltip($event, rateLimitTooltipText)"
        @mouseleave="hideFloatingTooltip"
        @focus="showFloatingTooltip($event, rateLimitTooltipText)"
        @blur="hideFloatingTooltip"
      >
        <Icon name="exclamationTriangle" size="xs" :stroke-width="2" />
        429
      </span>
    </div>

    <!-- Model Status Indicators (普通限流 / 超量请求中) -->
    <div
      v-if="activeModelStatuses.length > 0"
      :class="[
        activeModelStatuses.length <= 4
          ? 'flex flex-col gap-1'
          : activeModelStatuses.length <= 8
            ? 'columns-2 gap-x-2'
            : 'columns-3 gap-x-2'
      ]"
    >
      <div
        v-for="item in activeModelStatuses"
        :key="`${item.kind}-${item.model}`"
        class="mb-1 break-inside-avoid"
        tabindex="0"
        @mouseenter="showFloatingTooltip($event, getModelStatusTooltip(item))"
        @mouseleave="hideFloatingTooltip"
        @focus="showFloatingTooltip($event, getModelStatusTooltip(item))"
        @blur="hideFloatingTooltip"
      >
        <!-- 积分已用尽 -->
        <span
          v-if="item.kind === 'credits_exhausted'"
          class="inline-flex items-center gap-1 rounded bg-red-100 px-1.5 py-0.5 text-xs font-medium text-red-700 dark:bg-red-900/30 dark:text-red-400"
        >
          <Icon name="exclamationTriangle" size="xs" :stroke-width="2" />
          {{ t('admin.accounts.status.creditsExhausted') }}
          <span class="text-[10px] opacity-70">{{ formatCountdown(item.reset_at) }}</span>
        </span>
        <!-- 正在走积分（模型限流但积分可用）-->
        <span
          v-else-if="item.kind === 'credits_active'"
          class="inline-flex items-center gap-1 rounded bg-amber-100 px-1.5 py-0.5 text-xs font-medium text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
        >
          <span>⚡</span>
          {{ formatScopeName(item.model) }}
          <span class="text-[10px] opacity-70">{{ formatCountdown(item.reset_at) }}</span>
        </span>
        <!-- 普通模型限流 -->
        <span
          v-else
          class="inline-flex items-center gap-1 rounded bg-accent-200 px-1.5 py-0.5 text-xs font-medium text-accent-700 dark:bg-accent-900/30 dark:text-accent-500"
        >
          <Icon name="exclamationTriangle" size="xs" :stroke-width="2" />
          {{ formatScopeName(item.model) }}
          <span class="text-[10px] opacity-70">{{ formatCountdown(item.reset_at) }}</span>
        </span>
      </div>
    </div>

    <!-- Overload Indicator (529) -->
    <div v-if="isOverloaded">
      <span
        class="inline-flex items-center gap-1 rounded bg-red-100 px-1.5 py-0.5 text-xs font-medium text-red-700 dark:bg-red-900/30 dark:text-red-400"
        tabindex="0"
        @mouseenter="showFloatingTooltip($event, overloadTooltipText)"
        @mouseleave="hideFloatingTooltip"
        @focus="showFloatingTooltip($event, overloadTooltipText)"
        @blur="hideFloatingTooltip"
      >
        <Icon name="exclamationTriangle" size="xs" :stroke-width="2" />
        529
      </span>
    </div>
  </div>

  <Teleport to="body">
    <div
      v-if="floatingTooltip"
      :class="floatingTooltipClass"
      :style="floatingTooltipStyle"
      role="tooltip"
    >
      <div class="whitespace-pre-wrap break-words leading-relaxed text-gray-200">
        {{ floatingTooltip.text }}
      </div>
      <div class="account-status-tooltip-arrow account-status-floating-tooltip-arrow"></div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import Icon from '@/components/icons/Icon.vue'
import type { Account } from '@/types'
import { formatCountdown, formatDateTime, formatCountdownWithSuffix, formatTime } from '@/utils/format'

const { t } = useI18n()

const props = defineProps<{
  account: Account
}>()

const emit = defineEmits<{
  (e: 'show-temp-unsched', account: Account): void
}>()

type FloatingTooltipPlacement = 'top' | 'bottom'

type FloatingTooltipState = {
  text: string
  left: number
  top: number
  placement: FloatingTooltipPlacement
}

const floatingTooltip = ref<FloatingTooltipState | null>(null)

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max)

const showFloatingTooltip = (
  event: MouseEvent | FocusEvent,
  text: string,
  placement: FloatingTooltipPlacement = 'top',
) => {
  const target = event.currentTarget
  if (!(target instanceof HTMLElement) || !text) return

  const rect = target.getBoundingClientRect()
  const viewportWidth = window.innerWidth || 0
  const tooltipWidth = placement === 'bottom' ? 300 : 224
  const safeGap = 8
  const left = placement === 'bottom'
    ? clamp(rect.left, safeGap, Math.max(safeGap, viewportWidth - tooltipWidth - safeGap))
    : clamp(
        rect.left + rect.width / 2,
        tooltipWidth / 2 + safeGap,
        Math.max(tooltipWidth / 2 + safeGap, viewportWidth - tooltipWidth / 2 - safeGap),
      )

  floatingTooltip.value = {
    text,
    left,
    top: placement === 'bottom' ? rect.bottom + safeGap : rect.top - safeGap,
    placement,
  }
}

const hideFloatingTooltip = () => {
  floatingTooltip.value = null
}

const floatingTooltipClass = computed(() => [
  'account-status-tooltip',
  'account-status-floating-tooltip',
  floatingTooltip.value?.placement === 'bottom'
    ? 'account-status-floating-tooltip--bottom'
    : 'account-status-floating-tooltip--top',
])

const floatingTooltipStyle = computed(() => {
  if (!floatingTooltip.value) return {}
  return {
    left: `${floatingTooltip.value.left}px`,
    top: `${floatingTooltip.value.top}px`,
  }
})

// Computed: is rate limited (429)
const isRateLimited = computed(() => {
  if (!props.account.rate_limit_reset_at) return false
  return new Date(props.account.rate_limit_reset_at) > new Date()
})

type AccountModelStatusItem = {
  kind: 'rate_limit' | 'credits_exhausted' | 'credits_active'
  model: string
  reset_at: string
}

// Computed: active model statuses (普通模型限流 + 积分耗尽 + 走积分中)
const activeModelStatuses = computed<AccountModelStatusItem[]>(() => {
  const extra = props.account.extra as Record<string, unknown> | undefined
  const modelLimits = extra?.model_rate_limits as
    | Record<string, { rate_limited_at: string; rate_limit_reset_at: string }>
    | undefined
  const now = new Date()
  const items: AccountModelStatusItem[] = []

  if (!modelLimits) return items

  // 检查 AICredits key 是否生效（积分是否耗尽）
  const aiCreditsEntry = modelLimits['AICredits']
  const hasActiveAICredits = aiCreditsEntry && new Date(aiCreditsEntry.rate_limit_reset_at) > now
  const allowOverages = !!(extra?.allow_overages)

  for (const [model, info] of Object.entries(modelLimits)) {
    if (new Date(info.rate_limit_reset_at) <= now) continue

    if (model === 'AICredits') {
      // AICredits key → 积分已用尽
      items.push({ kind: 'credits_exhausted', model, reset_at: info.rate_limit_reset_at })
    } else if (allowOverages && !hasActiveAICredits) {
      // 普通模型限流 + overages 启用 + 积分可用 → 正在走积分
      items.push({ kind: 'credits_active', model, reset_at: info.rate_limit_reset_at })
    } else {
      // 普通模型限流
      items.push({ kind: 'rate_limit', model, reset_at: info.rate_limit_reset_at })
    }
  }

  return items
})

const formatScopeName = (scope: string): string => {
  const aliases: Record<string, string> = {
    // Claude 系列
    'claude-fable-5': 'CFable5',
    'claude-opus-4-6': 'COpus46',
    'claude-opus-4-6-thinking': 'COpus46T',
    'claude-opus-4-7': 'COpus47',
    'claude-opus-4-8': 'COpus48',
    'claude-opus-5': 'COpus5',
    'claude-sonnet-4-6': 'CSon46',
    'claude-sonnet-4-5': 'CSon45',
    'claude-sonnet-4-5-thinking': 'CSon45T',
    // Gemini 2.5 系列
    'gemini-2.5-flash': 'G25F',
    'gemini-2.5-flash-lite': 'G25FL',
    'gemini-2.5-flash-thinking': 'G25FT',
    'gemini-2.5-pro': 'G25P',
    'gemini-2.5-flash-image': 'G25I',
    // Gemini 3.5 系列
    'gemini-3.5-flash': 'G35F',
    // Gemini 3 系列
    'gemini-3-flash': 'G3F',
    'gemini-3.1-pro-high': 'G3PH',
    'gemini-3.1-pro-low': 'G3PL',
    'gemini-3-pro-image': 'G3PI',
    'gemini-3.1-flash-image': 'G31FI',
    // 其他
    'gpt-oss-120b-medium': 'GPT120',
    'tab_flash_lite_preview': 'TabFL',
    // 旧版 scope 别名（兼容）
    claude: 'Claude',
    claude_sonnet: 'CSon',
    claude_opus: 'COpus',
    claude_haiku: 'CHaiku',
    gemini_text: 'Gemini',
    gemini_image: 'GImg',
    gemini_flash: 'GFlash',
    gemini_pro: 'GPro',
  }
  return aliases[scope] || scope
}

const getModelStatusTooltip = (item: AccountModelStatusItem) => {
  if (item.kind === 'credits_exhausted') {
    return t('admin.accounts.status.creditsExhaustedUntil', { time: formatTime(item.reset_at) })
  }
  if (item.kind === 'credits_active') {
    return t('admin.accounts.status.modelCreditOveragesUntil', {
      model: formatScopeName(item.model),
      time: formatTime(item.reset_at),
    })
  }
  return t('admin.accounts.status.modelRateLimitedUntil', {
    model: formatScopeName(item.model),
    time: formatTime(item.reset_at),
  })
}

// Computed: is overloaded (529)
const isOverloaded = computed(() => {
  if (!props.account.overload_until) return false
  return new Date(props.account.overload_until) > new Date()
})

// Computed: is temp unschedulable
const isTempUnschedulable = computed(() => {
  if (!props.account.temp_unschedulable_until) return false
  return new Date(props.account.temp_unschedulable_until) > new Date()
})

// Computed: has error status
const hasError = computed(() => {
  return props.account.status === 'error'
})

const isQuotaExceeded = computed(() => {
  const exceeded = (used?: number | null, limit?: number | null) =>
    typeof limit === 'number' && limit > 0 && typeof used === 'number' && used >= limit
  return (
    exceeded(props.account.quota_used, props.account.quota_limit) ||
    exceeded(props.account.quota_daily_used, props.account.quota_daily_limit) ||
    exceeded(props.account.quota_weekly_used, props.account.quota_weekly_limit)
  )
})

// Computed: countdown text for rate limit (429)
const rateLimitCountdown = computed(() => {
  return formatCountdown(props.account.rate_limit_reset_at)
})

const rateLimitResumeText = computed(() => {
  if (!rateLimitCountdown.value) return ''
  return t('admin.accounts.status.rateLimitedAutoResume', { time: rateLimitCountdown.value })
})

const rateLimitTooltipText = computed(() => (
  t('admin.accounts.status.rateLimitedUntil', { time: formatDateTime(props.account.rate_limit_reset_at) })
))

// Computed: countdown text for overload (529)
const overloadCountdown = computed(() => {
  return formatCountdownWithSuffix(props.account.overload_until)
})

const overloadTooltipText = computed(() => (
  t('admin.accounts.status.overloadedUntil', { time: formatTime(props.account.overload_until) })
))

// Computed: status badge class
const statusClass = computed(() => {
  if (!props.account.status) {
    return 'badge-gray'
  }
  if (hasError.value) {
    return 'badge-danger'
  }
  if (isTempUnschedulable.value) {
    return 'badge-warning'
  }
  if (props.account.status !== 'active') {
    return props.account.status === 'error' ? 'badge-danger' : 'badge-gray'
  }
  if (isQuotaExceeded.value) {
    return 'badge-warning'
  }
  if (!props.account.schedulable) {
    return 'badge-gray'
  }
  return 'badge-success'
})

// Computed: status text
const statusText = computed(() => {
  if (hasError.value) {
    return t('admin.accounts.status.error')
  }
  if (isTempUnschedulable.value) {
    return t('admin.accounts.status.tempUnschedulable')
  }
  if (props.account.status !== 'active') {
    return t(`admin.accounts.status.${props.account.status}`)
  }
  if (isQuotaExceeded.value) {
    return t('admin.accounts.status.quotaExceeded')
  }
  if (!props.account.schedulable) {
    return t('admin.accounts.status.paused')
  }
  return t(`admin.accounts.status.${props.account.status}`)
})

const handleTempUnschedClick = () => {
  if (!isTempUnschedulable.value) return
  emit('show-temp-unsched', props.account)
}
</script>

<style scoped>
.account-status-tooltip-trigger {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  border: 0;
  background: transparent;
}

.account-status-floating-tooltip {
  position: fixed;
  z-index: 2147483647;
  pointer-events: none;
  width: min(14rem, calc(100vw - 1rem));
  border-radius: 0.5rem;
  background: rgb(17 24 39);
  padding: 0.5rem 0.75rem;
  color: #fff;
  font-size: 0.75rem;
  line-height: 1.35;
  text-align: center;
  box-shadow:
    0 18px 35px rgba(15, 23, 42, 0.2),
    0 0 0 1px rgba(255, 255, 255, 0.08);
}

.account-status-floating-tooltip--top {
  transform: translate(-50%, -100%);
}

.account-status-floating-tooltip--bottom {
  width: min(18.75rem, calc(100vw - 1rem));
  text-align: left;
}

.account-status-floating-tooltip-arrow {
  position: absolute;
  width: 0;
  height: 0;
  border: 0.25rem solid transparent;
}

.account-status-floating-tooltip--top .account-status-floating-tooltip-arrow {
  left: 50%;
  top: 100%;
  transform: translateX(-50%);
  border-top-color: rgb(17 24 39);
}

.account-status-floating-tooltip--bottom .account-status-floating-tooltip-arrow {
  left: 0.75rem;
  bottom: 100%;
  border-bottom-color: rgb(17 24 39);
}

.dark .account-status-floating-tooltip {
  background: rgb(31 41 55);
}

.dark .account-status-floating-tooltip--top .account-status-floating-tooltip-arrow {
  border-top-color: rgb(31 41 55);
}

.dark .account-status-floating-tooltip--bottom .account-status-floating-tooltip-arrow {
  border-bottom-color: rgb(31 41 55);
}
</style>
