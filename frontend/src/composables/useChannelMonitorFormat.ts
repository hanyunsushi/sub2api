/**
 * Shared formatting helpers for channel monitor views (admin + user).
 *
 * Centralises:
 *  - status / provider label + badge class lookups
 *  - latency / availability / percent number formatting
 *  - dashboard-style helpers (HSL for availability, provider gradient, relative time)
 *
 * i18n keys live under `monitorCommon.*` so admin and user views share the
 * same translation source.
 */

import { useI18n } from 'vue-i18n'
import type { CheckMode, MonitorStatus, Provider } from '@/api/admin/channelMonitor'
import {
  PROVIDER_OPENAI,
  PROVIDER_ANTHROPIC,
  PROVIDER_GEMINI,
  PROVIDER_GROK,
  PROVIDER_ANTIGRAVITY,
  PROVIDER_KIMI,
  PROVIDER_ZHIPU,
  PROVIDER_DEEPSEEK,
  PROVIDER_MINIMAX,
  PROVIDER_OPENCODE_GO,
  PROVIDERS,
  STATUS_OPERATIONAL,
  STATUS_DEGRADED,
  STATUS_FAILED,
  STATUS_ERROR,
  CHECK_MODE_PROBE,
  CHECK_MODE_QUOTA,
  CHECK_MODE_QUOTA_PROBE,
} from '@/constants/channelMonitor'

const NEUTRAL_BADGE = 'border border-[var(--anthropic-border-subtle)] bg-transparent text-[var(--anthropic-muted)]'
const SUCCESS_BADGE = 'border border-[color-mix(in_srgb,var(--anthropic-success)_32%,transparent)] bg-transparent text-[var(--anthropic-success)]'
const INFO_BADGE = 'border border-[color-mix(in_srgb,var(--anthropic-info)_32%,transparent)] bg-transparent text-[var(--anthropic-info)]'
const WARNING_BADGE = 'border border-[color-mix(in_srgb,var(--anthropic-warning)_32%,transparent)] bg-transparent text-[var(--anthropic-warning)]'
const DANGER_BADGE = 'border border-[color-mix(in_srgb,var(--anthropic-error)_32%,transparent)] bg-transparent text-[var(--anthropic-error)]'
const PICKER_BASE = 'border bg-transparent text-[var(--anthropic-muted)]'

export interface AvailabilityRow {
  primary_status: MonitorStatus | ''
  availability_7d: number | null | undefined
}

export function useChannelMonitorFormat() {
  const { t } = useI18n()

  function statusLabel(s: MonitorStatus | ''): string {
    if (!s) return t('monitorCommon.status.unknown')
    return t(`monitorCommon.status.${s}`)
  }

  function statusBadgeClass(s: MonitorStatus | ''): string {
    switch (s) {
      case STATUS_OPERATIONAL:
        return SUCCESS_BADGE
      case STATUS_DEGRADED:
        return WARNING_BADGE
      case STATUS_FAILED:
      case STATUS_ERROR:
        return DANGER_BADGE
      default:
        return NEUTRAL_BADGE
    }
  }

  function providerLabel(p: Provider | string): string {
    if (PROVIDERS.includes(p as Provider)) {
      return t(`monitorCommon.providers.${p}`)
    }
    return p || '-'
  }

  function checkModeLabel(m: CheckMode | string): string {
    if (m === 'probe' || m === 'quota' || m === 'quota_probe') {
      return t(`monitorCommon.checkMode.${m}`)
    }
    return m || '-'
  }

  /**
   * Display label for a monitor's primary model. Pure-quota monitors carry the
   * literal placeholder "quota" (the probe target is an account, not a model),
   * which must not leak into the UI as a fake model name — render the
   * localized mode label instead. quota_probe keeps a real model name.
   */
  const QUOTA_MODEL_PLACEHOLDER = 'quota'

  function formatMonitorModel(model: string): string {
    if (model === QUOTA_MODEL_PLACEHOLDER) {
      return t('monitorCommon.checkMode.quota')
    }
    return model
  }

  function providerBadgeClass(p: Provider | string): string {
    switch (p) {
      case PROVIDER_OPENAI:
      case PROVIDER_DEEPSEEK:
        return SUCCESS_BADGE
      case PROVIDER_ANTHROPIC:
      case PROVIDER_MINIMAX:
      case PROVIDER_OPENCODE_GO:
        return WARNING_BADGE
      case PROVIDER_GEMINI:
      case PROVIDER_ANTIGRAVITY:
      case PROVIDER_KIMI:
      case PROVIDER_ZHIPU:
        return INFO_BADGE
      case PROVIDER_GROK:
        return NEUTRAL_BADGE
      default:
        return NEUTRAL_BADGE
    }
  }

  /**
   * Tailwind class for the check-mode badge shown next to the provider badge
   * in the admin monitor list. Quota-bearing modes = blue (数据源是账号配额),
   * plain probe = neutral grey.
   */
  function checkModeBadgeClass(m: CheckMode | string): string {
    switch (m) {
      case CHECK_MODE_QUOTA:
      case CHECK_MODE_QUOTA_PROBE:
        return INFO_BADGE
      case CHECK_MODE_PROBE:
      default:
        return NEUTRAL_BADGE
    }
  }

  /**
   * Tailwind class for a provider radio-button-style picker (active/inactive state).
   * Uses the shared Anthropic semantic set with transparent surfaces.
   */
  function providerPickerClass(p: Provider | string, active: boolean): string {
    if (!active) {
      return `${PICKER_BASE} border-[var(--anthropic-border-subtle)] hover:border-[var(--anthropic-border-hover)]`
    }
    return `${PICKER_BASE} ${providerBadgeClass(p)}`
  }

  function formatLatency(ms: number | null | undefined): string {
    if (ms == null) return t('monitorCommon.latencyEmpty')
    return String(Math.round(ms))
  }

  function formatPercent(v: number | null | undefined): string {
    if (v == null || Number.isNaN(v)) return '-'
    return `${v.toFixed(2)}%`
  }

  function formatAvailability(row: AvailabilityRow): string {
    if (!row.primary_status) return '-'
    return formatPercent(row.availability_7d)
  }

  function formatRelativeTime(iso: string | null | undefined): string {
    if (!iso) return t('monitorCommon.latencyEmpty')
    const ts = Date.parse(iso)
    if (Number.isNaN(ts)) return t('monitorCommon.latencyEmpty')
    const diffSec = Math.max(0, Math.floor((Date.now() - ts) / 1000))
    if (diffSec < 60) return t('monitorCommon.relativeSecondsAgo', { n: diffSec })
    const diffMin = Math.floor(diffSec / 60)
    if (diffMin < 60) return t('monitorCommon.relativeMinutesAgo', { n: diffMin })
    const diffHour = Math.floor(diffMin / 60)
    if (diffHour < 24) return t('monitorCommon.relativeHoursAgo', { n: diffHour })
    const diffDay = Math.floor(diffHour / 24)
    return t('monitorCommon.relativeDaysAgo', { n: diffDay })
  }

  return {
    statusLabel,
    statusBadgeClass,
    providerLabel,
    checkModeLabel,
    formatMonitorModel,
    providerBadgeClass,
    checkModeBadgeClass,
    providerPickerClass,
    formatLatency,
    formatPercent,
    formatAvailability,
    formatRelativeTime,
  }
}

/**
 * Map availability percent to an Anthropic semantic colour.
 * Returns undefined for null/NaN so callers can fall back to a neutral colour.
 */
export function hslForPct(pct: number | null | undefined): string | undefined {
  if (pct === null || pct === undefined || Number.isNaN(pct)) return undefined
  if (pct >= 99) return 'var(--anthropic-success)'
  if (pct >= 95) return 'var(--anthropic-warning)'
  return 'var(--anthropic-error)'
}

/**
 * Tailwind surface class for the provider icon tile background.
 */
export function providerGradient(provider: string): string {
  switch (provider) {
    case PROVIDER_OPENAI:
      return 'anthropic-stat-icon-success'
    case PROVIDER_ANTHROPIC:
      return 'anthropic-stat-icon-warning'
    case PROVIDER_GEMINI:
      return 'anthropic-stat-icon-info'
    case PROVIDER_GROK:
      return 'anthropic-icon-tile'
    case PROVIDER_ANTIGRAVITY:
      return 'anthropic-stat-icon-info'
    case PROVIDER_KIMI:
      return 'anthropic-stat-icon-info'
    case PROVIDER_ZHIPU:
      return 'anthropic-stat-icon-info'
    case PROVIDER_DEEPSEEK:
      return 'anthropic-stat-icon-success'
    case PROVIDER_MINIMAX:
      return 'anthropic-stat-icon-warning'
    case PROVIDER_OPENCODE_GO:
      return 'anthropic-stat-icon-warning'
    default:
      return 'anthropic-icon-tile'
  }
}
