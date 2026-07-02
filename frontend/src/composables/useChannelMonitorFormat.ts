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
import type { MonitorStatus, Provider } from '@/api/admin/channelMonitor'
import {
  PROVIDER_OPENAI,
  PROVIDER_ANTHROPIC,
  PROVIDER_GEMINI,
  STATUS_OPERATIONAL,
  STATUS_DEGRADED,
  STATUS_FAILED,
  STATUS_ERROR,
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
    if (p === PROVIDER_OPENAI || p === PROVIDER_ANTHROPIC || p === PROVIDER_GEMINI) {
      return t(`monitorCommon.providers.${p}`)
    }
    return p || '-'
  }

  function providerBadgeClass(p: Provider | string): string {
    switch (p) {
      case PROVIDER_OPENAI:
        return SUCCESS_BADGE
      case PROVIDER_ANTHROPIC:
        return WARNING_BADGE
      case PROVIDER_GEMINI:
        return INFO_BADGE
      default:
        return NEUTRAL_BADGE
    }
  }

  /**
   * Tailwind class for a provider radio-button-style picker (active/inactive state).
   * Uses the shared Anthropic semantic set with transparent surfaces.
   */
  function providerPickerClass(p: Provider | string, active: boolean): string {
    switch (p) {
      case PROVIDER_OPENAI:
        return active
          ? `${PICKER_BASE} border-[color-mix(in_srgb,var(--anthropic-success)_48%,transparent)] text-[var(--anthropic-success)]`
          : `${PICKER_BASE} border-[var(--anthropic-border-subtle)] hover:border-[color-mix(in_srgb,var(--anthropic-success)_32%,transparent)] hover:text-[var(--anthropic-success)]`
      case PROVIDER_ANTHROPIC:
        return active
          ? `${PICKER_BASE} border-[color-mix(in_srgb,var(--anthropic-warning)_48%,transparent)] text-[var(--anthropic-warning)]`
          : `${PICKER_BASE} border-[var(--anthropic-border-subtle)] hover:border-[color-mix(in_srgb,var(--anthropic-warning)_32%,transparent)] hover:text-[var(--anthropic-warning)]`
      case PROVIDER_GEMINI:
        return active
          ? `${PICKER_BASE} border-[color-mix(in_srgb,var(--anthropic-info)_48%,transparent)] text-[var(--anthropic-info)]`
          : `${PICKER_BASE} border-[var(--anthropic-border-subtle)] hover:border-[color-mix(in_srgb,var(--anthropic-info)_32%,transparent)] hover:text-[var(--anthropic-info)]`
      default:
        return active
          ? `${PICKER_BASE} border-[var(--anthropic-border-hover)]`
          : `${PICKER_BASE} border-[var(--anthropic-border-subtle)] hover:border-[var(--anthropic-border-hover)]`
    }
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
    providerBadgeClass,
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
    default:
      return 'anthropic-icon-tile'
  }
}
