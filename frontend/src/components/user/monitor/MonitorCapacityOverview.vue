<template>
  <section
    v-if="cards.length > 0"
    class="monitor-capacity-overview mb-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4"
    aria-label="Platform shared capacity"
  >
    <article
      v-for="card in cards"
      :key="card.groupKey"
      class="monitor-capacity-card monitor-linked-card rounded-lg border p-4"
      data-testid="monitor-capacity-card"
      :data-capacity-group="card.groupKey"
    >
      <div class="flex items-start justify-between gap-3">
        <div>
          <div class="text-[10px] font-semibold uppercase tracking-widest text-[var(--anthropic-muted)]">
            {{ localText('共享容量', 'Shared capacity') }}
          </div>
          <div class="mt-1 text-lg font-semibold uppercase text-[var(--anthropic-fg)] dark:text-[var(--anthropic-muted)]">
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
        <div class="font-mono text-3xl font-bold tabular-nums leading-none text-[var(--anthropic-fg)] dark:text-[var(--anthropic-fg)]">
          {{ formatBalance(card.balanceTotal) }}
        </div>
        <div class="mt-1 text-xs text-[var(--anthropic-muted)] dark:text-[var(--anthropic-muted)]">
          {{ localText('账号余额加总', 'Total account balance') }}
        </div>
      </div>

      <div class="mt-4 grid grid-cols-2 gap-2 text-xs">
        <div class="monitor-capacity-metric-tile rounded-xl border border-[var(--anthropic-border)] bg-[var(--anthropic-page)] p-2 dark:border-[var(--anthropic-border)] dark:bg-[var(--anthropic-page)]">
          <div class="text-[var(--anthropic-muted)]">{{ localText('余额来源', 'Sources') }}</div>
          <div class="mt-1 font-mono font-semibold text-[var(--anthropic-fg)] dark:text-[var(--anthropic-muted)]">
            {{ card.balanceSourceCount }}
          </div>
        </div>
        <div class="monitor-capacity-metric-tile rounded-xl border border-[var(--anthropic-border)] bg-[var(--anthropic-page)] p-2 dark:border-[var(--anthropic-border)] dark:bg-[var(--anthropic-page)]">
          <div class="text-[var(--anthropic-muted)]">{{ localText('监控渠道', 'Channels') }}</div>
          <div class="mt-1 font-mono font-semibold text-[var(--anthropic-fg)] dark:text-[var(--anthropic-muted)]">
            {{ card.monitorCount }}
          </div>
        </div>
      </div>

      <div class="mt-4">
        <div class="mb-2 flex items-center justify-between text-xs">
          <span class="font-medium text-[var(--anthropic-muted)] dark:text-[var(--anthropic-muted)]">
            {{ localText('账号状态', 'Account status') }}
          </span>
          <span class="font-mono text-[var(--anthropic-muted)]">
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
import { systemAILogoPresetIDFromURL } from '@/utils/providerBrandIcon'
import {
  STATUS_DEGRADED,
  STATUS_ERROR,
  STATUS_FAILED,
  STATUS_OPERATIONAL,
} from '@/constants/channelMonitor'

const knownGroupExternalKeywords: Record<string, string[]> = {
  gpt: ['gpt', 'openai', 'chatgpt'],
  claude: ['claude', 'anthropic', 'buzz', 'buzzai', 'buzzai.cc', 'qlhazycoder', 'qlhazycoder.top', 'qlhazy'],
  mimo: ['mimo'],
}

const dynamicProviderAliases: string[][] = [
  ['rawchat', 'rawchat.cn', 'rawc', 'codex'],
]

const props = defineProps<{
  items: UserMonitorView[]
  statuses: ExternalSubscriptionStatus[]
  loading?: boolean
}>()

const { locale } = useI18n()
const localText = (zh: string, en: string) => locale.value?.startsWith('zh') ? zh : en

type CapacityCard = {
  groupKey: string
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

type MonitorCapacityGroup = {
  key: string
  label: string
  monitors: UserMonitorView[]
}

const cards = computed<CapacityCard[]>(() => {
  const groups = buildMonitorGroups(props.items)
  return groups
    .map((group) => {
      const monitors = group.monitors
      const matchedStatuses = matchStatusesForGroup(group.key, monitors, props.statuses)
      const balanceStatuses = matchedStatuses.filter(hasUsableBalance)
      const balanceTotal = balanceStatuses.reduce((sum, status) => sum + (status.remaining_usd ?? 0), 0)
      return {
        groupKey: group.key,
        group: group.label,
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
  const groups = new Map<string, MonitorCapacityGroup>()
  for (const item of items) {
    const key = normalizeGroupName(item.group_name)
    if (!key) continue
    const existing = groups.get(key)
    if (existing) {
      existing.monitors.push(item)
      continue
    }
    groups.set(key, {
      key,
      label: item.group_name.trim() || key,
      monitors: [item],
    })
  }
  return Array.from(groups.values())
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
  const groupKeywords = resolveGroupExternalKeywords(group, monitors)
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

function resolveGroupExternalKeywords(group: string, monitors: UserMonitorView[]) {
  const keywords = new Set<string>([group, ...(knownGroupExternalKeywords[group] ?? [])])
  const groupAndMonitorText = [group, ...monitors.map(monitorSearchText)].join(' ')
  for (const aliases of dynamicProviderAliases) {
    if (aliases.some(alias => groupAndMonitorText.includes(alias))) {
      aliases.forEach(alias => keywords.add(alias))
    }
  }
  return Array.from(keywords).filter(Boolean)
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
  const systemLogoID = systemAILogoPresetIDFromURL(logo.logoUrl)
  if (systemLogoID) return canonicalLogoProviderKey(systemLogoID)
  const text = [
    logo.provider,
    logo.model,
    logo.title,
  ].join(' ').trim().toLowerCase()
  if (!text) return ''
  return canonicalLogoProviderKey(text)
}

function canonicalLogoProviderKey(text: string) {
  const knownAliases: Array<[string, string[]]> = [
    ['codex', ['codex']],
    ['rawchat', ['rawchat', 'rawchat.cn', 'rawc']],
    ['free', ['free']],
    ['cloudflare', ['cloudflare', 'cf', 'ai-gateway', 'workers ai']],
    ['openrouter', ['openrouter', 'openrouter.ai']],
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
  min-width: 0;
  border-color: var(--anthropic-cookbook-border, rgba(20, 19, 19, 0.08));
  background: var(--anthropic-page, #faf9f5);
  color: var(--atelier-ink);
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.05);
  transition:
    background-color 350ms ease,
    border-color 0.25s ease,
    box-shadow 0.25s ease;
}

.monitor-capacity-card:hover {
  border-color: var(--anthropic-cookbook-border-hover, rgba(20, 19, 19, 0.16));
  background: var(--anthropic-cookbook-hover, #f5f4ed);
  box-shadow: 0 8px 28px rgba(0, 0, 0, 0.08);
  outline: 0;
  text-decoration: none;
}

.monitor-capacity-card:focus-visible {
  border-color: var(--anthropic-cookbook-border-hover, rgba(20, 19, 19, 0.16));
  background: var(--anthropic-cookbook-hover, #f5f4ed);
  box-shadow: 0 8px 28px rgba(0, 0, 0, 0.08);
  outline: 2px solid var(--atelier-focus);
  outline-offset: 2px;
  text-decoration: none;
}

.monitor-capacity-card > * {
  position: relative;
}

.monitor-capacity-metric-tile {
  transition:
    background-color 350ms ease,
    border-color 0.25s ease;
}

.monitor-capacity-card:hover .monitor-capacity-metric-tile,
.monitor-capacity-card:focus-visible .monitor-capacity-metric-tile,
.monitor-capacity-card:focus-within .monitor-capacity-metric-tile {
  border-color: var(--anthropic-cookbook-border-hover, rgba(20, 19, 19, 0.16));
  background: var(--anthropic-cookbook-hover, #f5f4ed);
}

.monitor-capacity-overview:has(.monitor-capacity-card:hover) .monitor-capacity-card:not(:hover) .monitor-capacity-metric-tile,
.monitor-capacity-overview:has(.monitor-capacity-card:focus-visible) .monitor-capacity-card:not(:focus-visible) .monitor-capacity-metric-tile {
  border-color: var(--anthropic-cookbook-border, rgba(20, 19, 19, 0.08));
  background: var(--anthropic-raised, #e8e6dc);
}

.monitor-capacity-logo {
  align-items: center;
  background: var(--atelier-paper);
  border: 1px solid var(--atelier-line);
  border-radius: 0.5rem;
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
  min-width: 0;
  overflow: hidden;
  border-radius: 999px;
  background: var(--atelier-surface-muted);
}

.monitor-capacity-status-grid {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.monitor-capacity-status-segment {
  display: block;
  min-width: 0;
  transition: width 0.2s var(--atelier-ease);
}

.monitor-capacity-status-segment + .monitor-capacity-status-segment {
  box-shadow: inset 1px 0 0 var(--atelier-paper);
}

.monitor-capacity-status-stat {
  align-items: center;
  color: var(--atelier-muted);
  display: grid;
  font-size: 0.6875rem;
  gap: 0.25rem 0.375rem;
  grid-template-columns: 0.5rem minmax(0, 1fr) 1.5rem;
  min-width: 0;
  white-space: nowrap;
}

.monitor-capacity-status-stat strong {
  justify-self: center;
  min-width: 1.5rem;
  text-align: center;
}

.monitor-capacity-status-dot {
  border-radius: 999px;
  display: inline-block;
  height: 0.5rem;
  width: 0.5rem;
}

.monitor-capacity-status-segment--available {
  background: var(--atelier-status-success);
}

.monitor-capacity-status-segment--limited {
  background: var(--atelier-status-warning);
}

.monitor-capacity-status-segment--error {
  background: var(--atelier-status-danger);
}

.monitor-capacity-status-segment--disabled {
  background: var(--atelier-dust);
}

.dark .monitor-capacity-logo {
  background: var(--atelier-surface);
  border-color: var(--atelier-line);
}
</style>
