<template>
  <button data-testid="user-monitor-monitor-card-button-emit-click"
    type="button"
    class="monitor-channel-card monitor-linked-card group text-left p-5 rounded-lg min-h-[280px] w-full bg-[var(--anthropic-page)] border border-[var(--anthropic-border)] dark:bg-[var(--anthropic-section)] dark:border-[var(--anthropic-border)] transition-all duration-300 ease-out flex flex-col"
    @click="emit('click')"
  >
    <!-- Header: icon + name/model + status chip -->
    <div class="flex items-start gap-3">
      <span
        class="monitor-provider-logo-shell w-9 h-9 rounded-xl ring-1 ring-[var(--anthropic-border-subtle)] dark:ring-[var(--anthropic-border-subtle)] grid place-items-center flex-shrink-0"
        :class="[providerGradient(item.provider), providerTintClass, monitorProviderClass(item.provider)]"
      >
        <ProviderBrandIcon :provider="item.provider" :model="item.primary_model" :logo-url="item.logo_url" />
      </span>
      <div class="flex-1 min-w-0">
        <div class="text-base font-semibold truncate text-[var(--anthropic-fg)] dark:text-[var(--anthropic-muted)]">
          {{ item.name }}
        </div>
        <div class="mt-0.5 flex items-center gap-1.5 min-w-0">
          <span
            class="monitor-provider-badge inline-flex items-center rounded-md px-1.5 py-0.5 text-[10px] font-medium flex-shrink-0"
            :class="[providerBadgeClass(item.provider), monitorProviderClass(item.provider)]"
          >
            {{ providerLabel(item.provider) }}
          </span>
          <!-- 纯配额模式主模型是占位符 "quota"，展示层替换为本地化「配额」标签 -->
          <span class="font-mono text-xs truncate text-gray-500 dark:text-gray-400">
            {{ formatMonitorModel(item.primary_model) }}
          </span>
          <span
            v-if="item.group_name"
            class="monitor-group-badge inline-flex items-center rounded-md px-1.5 py-0.5 text-[10px] font-medium bg-transparent text-[var(--anthropic-muted)] dark:bg-transparent dark:text-[var(--anthropic-muted)] flex-shrink-0"
            :class="monitorGroupClass(item.group_name)"
          >
            {{ item.group_name }}
          </span>
        </div>
      </div>
      <span
        class="monitor-status-badge px-2.5 py-1 rounded-full text-xs font-semibold flex-shrink-0"
        :class="[statusBadgeClass(item.primary_status), monitorStatusClass(item.primary_status)]"
      >
        {{ statusLabel(item.primary_status) }}
      </span>
    </div>

    <!-- Metrics -->
    <MonitorMetricPair
      primary-icon="bolt"
      :primary-label="t('monitorCommon.dialogLatency')"
      :primary-value="formatLatency(item.primary_latency_ms)"
      primary-unit="ms"
      secondary-icon="globe"
      :secondary-label="t('monitorCommon.endpointPing')"
      :secondary-value="formatLatency(item.primary_ping_latency_ms)"
      secondary-unit="ms"
    />

    <!-- 配额模式：最新用量/余额快照（服务端已按系统开关剥离，此处 flag 为纵深防御） -->
    <MonitorQuotaView v-if="quotaVisible" :snapshot="item.latest_quota" class="mt-2" />

    <!-- Divider -->
    <div class="mt-4 border-t border-[var(--anthropic-border)] dark:border-[var(--anthropic-border)]"></div>

    <!-- Availability row -->
    <MonitorAvailabilityRow
      :window-label="availabilityLabel"
      :value="availabilityValue"
      :samples-label="extraModelsCountLabel"
    />

    <!-- Timeline -->
    <MonitorTimeline
      :buckets="item.timeline"
      :countdown-seconds="countdownSeconds"
    />
  </button>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import type { UserMonitorView } from '@/api/channelMonitor'
import type { MonitorStatus } from '@/api/admin/channelMonitor'
import {
  useChannelMonitorFormat,
  providerGradient,
} from '@/composables/useChannelMonitorFormat'
import { isChannelMonitorQuotaVisible } from '@/utils/featureFlags'
import ProviderBrandIcon from '@/components/common/ProviderBrandIcon.vue'
import MonitorMetricPair from './MonitorMetricPair.vue'
import MonitorAvailabilityRow from './MonitorAvailabilityRow.vue'
import MonitorTimeline from './MonitorTimeline.vue'
import MonitorQuotaView from '@/components/common/MonitorQuotaView.vue'

// 图标配色与 utils/platformColors.ts 的平台色对齐（新 4 家）。
const PROVIDER_TINT: Record<string, string> = {
  openai: 'text-emerald-600 dark:text-emerald-300',
  anthropic: 'text-orange-600 dark:text-orange-300',
  gemini: 'text-sky-600 dark:text-sky-300',
  grok: 'text-zinc-700 dark:text-zinc-200',
  antigravity: 'text-purple-600 dark:text-purple-300',
  kimi: 'text-pink-600 dark:text-pink-300',
  zhipu: 'text-indigo-600 dark:text-indigo-300',
  deepseek: 'text-teal-600 dark:text-teal-300',
}

const props = defineProps<{
  item: UserMonitorView
  window: '7d' | '15d' | '30d'
  availabilityValue: number | null
  countdownSeconds: number
}>()

const emit = defineEmits<{
  (e: 'click'): void
}>()

const { t } = useI18n()
const {
  statusLabel,
  statusBadgeClass,
  providerLabel,
  providerBadgeClass,
  formatLatency,
  formatMonitorModel,
} = useChannelMonitorFormat()

const providerTintClass = computed(() =>
  PROVIDER_TINT[props.item.provider] ?? 'text-[var(--anthropic-muted)] dark:text-[var(--anthropic-muted)]'
)

function monitorProviderClass(provider: string): string {
  return `monitor-provider-${provider || 'default'}`
}

function monitorStatusClass(status: MonitorStatus | ''): string {
  return `monitor-status-${status || 'unknown'}`
}

function monitorGroupClass(groupName?: string | null): string {
  const normalized = (groupName || '').trim().toLowerCase()
  if (normalized.includes('gpt') || normalized.includes('openai')) return 'monitor-group-gpt'
  if (normalized.includes('claude') || normalized.includes('anthropic')) return 'monitor-group-claude'
  if (normalized.includes('gemini')) return 'monitor-group-gemini'
  return 'monitor-group-default'
}

const quotaVisible = computed(
  () => isChannelMonitorQuotaVisible() && !!props.item.latest_quota
)

const availabilityLabel = computed(() => {
  const win = t(`channelStatus.windowTab.${props.window}`)
  return `${t('monitorCommon.availabilityPrefix')} · ${win}`
})

const extraModelsCountLabel = computed(() => {
  const count = props.item.extra_models?.length ?? 0
  if (count === 0) return undefined
  return t('monitorCommon.extraModelsCount', { n: count })
})
</script>
