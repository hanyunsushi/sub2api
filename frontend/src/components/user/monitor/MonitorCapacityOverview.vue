<template>
  <section
    v-if="cards.length > 0"
    class="monitor-capacity-overview mb-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4"
    aria-label="Platform shared capacity"
  >
    <article
      v-for="card in cards"
      :key="card.group"
      class="monitor-capacity-card rounded-2xl border border-gray-200/80 bg-white/75 p-4 shadow-card dark:border-dark-700/70 dark:bg-dark-800/60"
    >
      <div class="flex items-start justify-between gap-3">
        <div>
          <div class="text-[10px] font-semibold uppercase tracking-widest text-gray-400">
            {{ localText('共享容量', 'Shared capacity') }}
          </div>
          <div class="mt-1 text-lg font-semibold uppercase text-gray-900 dark:text-gray-100">
            {{ card.group }}
          </div>
        </div>
        <div class="flex -space-x-2">
          <span
            v-for="logo in card.previewLogos"
            :key="logo.key"
            class="monitor-capacity-logo"
            :title="logo.title"
          >
            <ProviderBrandIcon
              :provider="logo.provider"
              :model="logo.model"
              :logo-url="logo.logoUrl"
            />
          </span>
        </div>
      </div>

      <div class="mt-5">
        <div class="font-mono text-3xl font-bold tabular-nums leading-none text-gray-900 dark:text-white">
          {{ formatBalance(card.balanceTotal) }}
        </div>
        <div class="mt-1 text-xs text-gray-500 dark:text-gray-400">
          {{ localText('账号余额加总', 'Total account balance') }}
        </div>
      </div>

      <div class="mt-4 grid grid-cols-2 gap-2 text-xs">
        <div class="rounded-xl border border-gray-100 bg-gray-50/80 p-2 dark:border-dark-700/50 dark:bg-dark-900/40">
          <div class="text-gray-400">{{ localText('余额来源', 'Sources') }}</div>
          <div class="mt-1 font-mono font-semibold text-gray-800 dark:text-gray-100">
            {{ card.balanceSourceCount }}
          </div>
        </div>
        <div class="rounded-xl border border-gray-100 bg-gray-50/80 p-2 dark:border-dark-700/50 dark:bg-dark-900/40">
          <div class="text-gray-400">{{ localText('监控渠道', 'Channels') }}</div>
          <div class="mt-1 font-mono font-semibold text-gray-800 dark:text-gray-100">
            {{ card.monitorCount }}
          </div>
        </div>
      </div>

      <div class="mt-4">
        <div class="mb-2 flex items-center justify-between text-xs">
          <span class="font-medium text-gray-500 dark:text-gray-400">
            {{ localText('账号状态', 'Account status') }}
          </span>
          <span class="font-mono text-gray-400">
            {{ card.monitorCount }}
          </span>
        </div>
        <div
          class="monitor-capacity-status-bar"
          role="img"
          :aria-label="statusBarLabel(card.statusSegments)"
        >
          <span
            v-for="segment in card.statusSegments"
            :key="segment.key"
            class="monitor-capacity-status-segment"
            :class="segment.className"
            :style="{ width: `${segment.percent}%` }"
            :title="`${segment.label}: ${segment.count}`"
          ></span>
        </div>
        <div class="monitor-capacity-status-grid mt-3 grid grid-cols-2 gap-2">
          <div
            v-for="segment in card.statusSegments"
            :key="`${segment.key}-label`"
            class="monitor-capacity-status-stat"
          >
            <span class="monitor-capacity-status-dot" :class="segment.className"></span>
            <span class="truncate">{{ segment.label }}</span>
            <strong class="font-mono">{{ segment.count }}</strong>
          </div>
        </div>
      </div>
    </article>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import type { UserMonitorView } from '@/api/channelMonitor'
import type { ExternalSubscriptionStatus } from '@/api/admin/externalSubscriptions'
import ProviderBrandIcon from '@/components/common/ProviderBrandIcon.vue'
import {
  STATUS_DEGRADED,
  STATUS_ERROR,
  STATUS_FAILED,
  STATUS_OPERATIONAL,
} from '@/constants/channelMonitor'

const GROUP_ORDER = ['gpt', 'claude', 'mimo', 'free']
const groupExternalKeywords: Record<string, string[]> = {
  gpt: ['gpt', 'openai', 'chatgpt'],
  claude: ['claude', 'anthropic', 'buzz', 'buzzai', 'buzzai.cc'],
  mimo: ['mimo'],
  free: ['free', 'rawchat', 'rawchat.cn', 'codex'],
}

const props = defineProps<{
  items: UserMonitorView[]
  statuses: ExternalSubscriptionStatus[]
  loading?: boolean
}>()

const { locale } = useI18n()
const localText = (zh: string, en: string) => locale.value?.startsWith('zh') ? zh : en

type CapacityCard = {
  group: string
  monitorCount: number
  balanceTotal: number
  balanceSourceCount: number
  matchedStatuses: ExternalSubscriptionStatus[]
  previewLogos: CapacityLogoItem[]
  statusSegments: CapacityStatusSegment[]
}

type CapacityLogoItem = {
  key: string
  provider: string
  model: string
  logoUrl: string
  title: string
}

type CapacityStatusSegment = {
  key: 'available' | 'limited' | 'error' | 'disabled'
  label: string
  count: number
  percent: number
  className: string
}

const cards = computed<CapacityCard[]>(() => {
  const groups = buildMonitorGroups(props.items)
  return GROUP_ORDER
    .filter(group => groups.has(group))
    .map((group) => {
      const monitors = groups.get(group) ?? []
      const matchedStatuses = matchStatusesForGroup(group, monitors, props.statuses)
      const balanceStatuses = matchedStatuses.filter(hasUsableBalance)
      const balanceTotal = balanceStatuses.reduce((sum, status) => sum + (status.remaining_usd ?? 0), 0)
      return {
        group,
        monitorCount: monitors.length,
        balanceTotal,
        balanceSourceCount: balanceStatuses.length,
        matchedStatuses,
        previewLogos: buildPreviewLogos(matchedStatuses, monitors),
        statusSegments: buildStatusSegments(monitors),
      }
    })
})

function buildMonitorGroups(items: UserMonitorView[]) {
  const groups = new Map<string, UserMonitorView[]>()
  for (const item of items) {
    const group = normalizeGroupName(item.group_name)
    if (!GROUP_ORDER.includes(group)) continue
    const next = groups.get(group) ?? []
    next.push(item)
    groups.set(group, next)
  }
  return groups
}

function normalizeGroupName(value?: string | null) {
  return (value || '').trim().toLowerCase()
}

function hasUsableBalance(status: ExternalSubscriptionStatus) {
  return (
    status.enabled &&
    status.configured &&
    !status.error_code &&
    typeof status.remaining_usd === 'number' &&
    Number.isFinite(status.remaining_usd)
  )
}

function matchStatusesForGroup(
  group: string,
  monitors: UserMonitorView[],
  statuses: ExternalSubscriptionStatus[],
) {
  const monitorText = monitors.map(monitorSearchText).join(' ')
  const groupKeywords = groupExternalKeywords[group] ?? [group]
  const candidates = statuses.filter(status => status.enabled && status.configured)
  const matches = candidates.filter((status) => {
    const statusText = statusSearchText(status)
    if (statusText.includes(group)) return true
    if (groupKeywords.some(keyword => statusText.includes(keyword))) return true
    return status.match_keywords.some((keyword) => {
      const normalized = keyword.trim().toLowerCase()
      return normalized !== '' && monitorText.includes(normalized)
    })
  })
  return matches.sort((left, right) => {
    if (left.sort_order !== right.sort_order) return left.sort_order - right.sort_order
    return (left.name || left.provider).localeCompare(right.name || right.provider)
  })
}

function buildStatusSegments(monitors: UserMonitorView[]): CapacityStatusSegment[] {
  const counts = {
    available: 0,
    limited: 0,
    error: 0,
    disabled: 0,
  }
  for (const monitor of monitors) {
    switch (monitor.primary_status) {
      case STATUS_OPERATIONAL:
        counts.available += 1
        break
      case STATUS_DEGRADED:
        counts.limited += 1
        break
      case STATUS_FAILED:
      case STATUS_ERROR:
        counts.error += 1
        break
      default:
        counts.disabled += 1
        break
    }
  }
  const total = monitors.length || 1
  return [
    {
      key: 'available',
      label: localText('可用', 'Available'),
      count: counts.available,
      percent: segmentPercent(counts.available, total),
      className: 'monitor-capacity-status-segment--available',
    },
    {
      key: 'limited',
      label: localText('限流', 'Limited'),
      count: counts.limited,
      percent: segmentPercent(counts.limited, total),
      className: 'monitor-capacity-status-segment--limited',
    },
    {
      key: 'error',
      label: localText('错误', 'Error'),
      count: counts.error,
      percent: segmentPercent(counts.error, total),
      className: 'monitor-capacity-status-segment--error',
    },
    {
      key: 'disabled',
      label: localText('停用', 'Disabled'),
      count: counts.disabled,
      percent: segmentPercent(counts.disabled, total),
      className: 'monitor-capacity-status-segment--disabled',
    },
  ]
}

function segmentPercent(count: number, total: number) {
  if (count <= 0) return 0
  return (count / total) * 100
}

function statusBarLabel(segments: CapacityStatusSegment[]) {
  return segments.map(segment => `${segment.label}: ${segment.count}`).join(', ')
}

function monitorSearchText(item: UserMonitorView) {
  return [
    item.name,
    item.group_name,
    item.provider,
    item.primary_model,
    item.logo_url,
    ...(item.extra_models || []).map(model => model.model),
  ].join(' ').toLowerCase()
}

function statusSearchText(status: ExternalSubscriptionStatus) {
  return [
    status.provider,
    status.name,
    status.site_url,
    status.template,
    ...status.match_keywords,
  ].join(' ').toLowerCase()
}

function statusLogoText(status: ExternalSubscriptionStatus) {
  return [
    status.provider,
    status.name,
    status.site_url,
    ...status.match_keywords,
  ].join(' ')
}

function buildPreviewLogos(
  statuses: ExternalSubscriptionStatus[],
  monitors: UserMonitorView[],
) {
  const logos: CapacityLogoItem[] = []
  const seenVisualKeys = new Set<string>()
  const seenProviderKeys = new Set<string>()
  const appendLogo = (logo: CapacityLogoItem) => {
    const normalizedKey = logoVisualKey(logo)
    const providerKey = logoProviderKey(logo)
    if (!normalizedKey && !providerKey) return
    if (normalizedKey && seenVisualKeys.has(normalizedKey)) return
    if (providerKey && seenProviderKeys.has(providerKey)) return
    if (normalizedKey) seenVisualKeys.add(normalizedKey)
    if (providerKey) seenProviderKeys.add(providerKey)
    logos.push(logo)
  }

  for (const status of statuses) {
    const logoUrl = status.logo_url || ''
    appendLogo({
      key: `status:${status.provider}:${status.name || status.site_url || logoUrl}`,
      provider: statusLogoText(status),
      model: status.name,
      logoUrl,
      title: status.name || status.provider,
    })
    if (logos.length >= 4) return logos
  }

  for (const item of monitors) {
    const logoUrl = item.logo_url.trim()
    if (!logoUrl) continue
    appendLogo({
      key: `monitor:${logoUrl || item.provider}:${item.name}:${item.primary_model}`,
      provider: monitorLogoText(item),
      model: item.primary_model || item.name,
      logoUrl,
      title: item.name || item.provider,
    })
    if (logos.length >= 4) return logos
  }

  return logos
}

function logoVisualKey(logo: CapacityLogoItem) {
  const logoUrl = normalizeLogoUrl(logo.logoUrl)
  if (logoUrl) return `url:${logoUrl}`
  return [
    'fallback',
    logo.provider,
    logo.model,
    logo.title,
  ].join(':').trim().toLowerCase()
}

function logoProviderKey(logo: CapacityLogoItem) {
  const text = [
    logo.provider,
    logo.model,
    logo.title,
  ].join(' ').trim().toLowerCase()
  if (!text) return ''
  const knownAliases: Array<[string, string[]]> = [
    ['codex', ['codex']],
    ['rawchat', ['rawchat', 'rawchat.cn', 'rawc']],
    ['free', ['free']],
    ['openai', ['openai', 'chatgpt', 'gpt']],
    ['claude', ['claude', 'anthropic', 'buzz', 'buzzai', 'buzzai.cc']],
    ['mimo', ['mimo']],
  ]
  const matched = knownAliases.find(([, aliases]) => aliases.some(alias => text.includes(alias)))
  if (matched) return `provider:${matched[0]}`
  return `provider:${text.replace(/https?:\/\/|www\.|[^a-z0-9]+/g, ' ').trim().replace(/\s+/g, '-')}`
}

function normalizeLogoUrl(value: string) {
  const raw = value.trim()
  if (!raw) return ''
  try {
    const parsed = new URL(raw)
    parsed.hash = ''
    parsed.search = ''
    return parsed.toString().replace(/\/+$/, '').toLowerCase()
  } catch {
    return raw.toLowerCase()
  }
}

function monitorLogoText(item: UserMonitorView) {
  return [
    item.provider,
    item.name,
    item.group_name,
    item.primary_model,
  ].join(' ')
}

function formatBalance(value: number) {
  if (!Number.isFinite(value) || value <= 0) return '$0.00'
  return `$${value.toFixed(2)}`
}
</script>

<style scoped>
.monitor-capacity-card {
  position: relative;
  overflow: hidden;
}

.monitor-capacity-card::before {
  content: "";
  position: absolute;
  inset: 0;
  background: linear-gradient(135deg, rgba(59, 130, 246, 0.08), transparent 45%, rgba(16, 163, 127, 0.08));
  pointer-events: none;
}

.monitor-capacity-card > * {
  position: relative;
}

.monitor-capacity-logo {
  align-items: center;
  background: rgba(255, 255, 255, 0.88);
  border: 1px solid rgba(17, 24, 39, 0.08);
  border-radius: 0.625rem;
  display: inline-flex;
  height: 2rem;
  justify-content: center;
  overflow: hidden;
  width: 2rem;
}

.monitor-capacity-logo :deep(.provider-brand-icon) {
  border: 0 !important;
  border-radius: inherit !important;
  box-shadow: none !important;
  height: 100% !important;
  width: 100% !important;
}

.monitor-capacity-status-bar {
  display: flex;
  height: 0.625rem;
  width: 100%;
  overflow: hidden;
  border-radius: 999px;
  background: color-mix(in srgb, var(--atelier-dust) 20%, transparent);
}

.monitor-capacity-status-segment {
  display: block;
  min-width: 0;
  transition: width 0.2s var(--atelier-ease);
}

.monitor-capacity-status-segment + .monitor-capacity-status-segment {
  box-shadow: inset 1px 0 0 rgba(255, 255, 255, 0.58);
}

.monitor-capacity-status-stat {
  align-items: center;
  color: var(--atelier-muted);
  display: grid;
  font-size: 0.6875rem;
  gap: 0.25rem 0.375rem;
  grid-template-columns: auto minmax(0, 1fr) auto;
  min-width: 0;
  white-space: nowrap;
}

.monitor-capacity-status-stat strong {
  justify-self: end;
  min-width: 1.25rem;
  text-align: right;
}

.monitor-capacity-status-dot {
  border-radius: 999px;
  display: inline-block;
  height: 0.5rem;
  width: 0.5rem;
}

.monitor-capacity-status-segment--available {
  background: #10a37f;
}

.monitor-capacity-status-segment--limited {
  background: var(--atelier-butter);
}

.monitor-capacity-status-segment--error {
  background: var(--atelier-red);
}

.monitor-capacity-status-segment--disabled {
  background: var(--atelier-dust);
}

.dark .monitor-capacity-logo {
  background: rgba(15, 23, 42, 0.88);
  border-color: rgba(148, 163, 184, 0.18);
}
</style>
