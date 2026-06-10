import type { ExternalSubscriptionStatus } from '@/api/admin/externalSubscriptions'

export type ExternalQuotaProgressTone = 'safe' | 'warning' | 'danger'

export interface ExternalQuotaProgressMeta {
  visible: boolean
  provider: 'rawchat' | 'tcdmx' | 'openrouter'
  used: number
  remaining: number
  total: number
  percent: number
  tone: ExternalQuotaProgressTone
}

export type ExternalQuotaProgressMode = 'status_total' | 'custom_total'

export interface AccountExternalQuotaProgressPreference {
  enabled: boolean
  mode: ExternalQuotaProgressMode
  customTotal?: number | null
}

const PROGRESS_PROVIDER_ALIASES: Record<ExternalQuotaProgressMeta['provider'], string[]> = {
  rawchat: ['rawchat', 'rawchat.cn', 'rawc'],
  tcdmx: ['tcdmx'],
  openrouter: ['openrouter', 'openrouter.ai'],
}

const isFiniteNumber = (value: unknown): value is number => (
  typeof value === 'number' && Number.isFinite(value)
)

const clampPercent = (value: number) => Math.max(0, Math.min(value, 100))

const toneFromPercent = (percent: number): ExternalQuotaProgressTone => (
  percent >= 90
    ? 'danger'
    : percent >= 75
      ? 'warning'
      : 'safe'
)

const providerKeyFromStatus = (status: ExternalSubscriptionStatus): ExternalQuotaProgressMeta['provider'] | null => {
  const text = [
    status.provider,
    status.name,
    status.site_url,
    status.template,
    ...status.match_keywords,
  ].join(' ').toLowerCase()

  for (const [provider, aliases] of Object.entries(PROGRESS_PROVIDER_ALIASES)) {
    if (aliases.some(alias => text.includes(alias))) {
      return provider as ExternalQuotaProgressMeta['provider']
    }
  }

  if (status.template === 'rawchat_subscriptions') return 'rawchat'
  if (status.template === 'openrouter_credits') return 'openrouter'
  return null
}

export const supportsExternalQuotaProgress = (status?: ExternalSubscriptionStatus | null) => {
  if (!status) return false
  return providerKeyFromStatus(status) !== null
}

export const buildExternalQuotaProgressMeta = (
  status?: ExternalSubscriptionStatus | null,
): ExternalQuotaProgressMeta | null => {
  if (!status || !status.enabled || !status.configured || status.error_code) return null

  const provider = providerKeyFromStatus(status)
  if (!provider) return null

  const used = isFiniteNumber(status.used_usd) ? Math.max(0, status.used_usd) : 0
  const hasExplicitRemaining = isFiniteNumber(status.remaining_usd)
  let total = isFiniteNumber(status.total_limit_usd) ? Math.max(0, status.total_limit_usd) : 0
  let remaining = hasExplicitRemaining ? Math.max(0, status.remaining_usd as number) : Number.NaN

  if (!hasExplicitRemaining && used <= 0) return null

  if ((!total || !Number.isFinite(total)) && Number.isFinite(remaining)) {
    total = used + remaining
  }
  if (!Number.isFinite(remaining) && total > 0) {
    remaining = Math.max(0, total - used)
  }

  if (!Number.isFinite(total) || total <= 0 || !Number.isFinite(remaining)) return null

  const percent = clampPercent((used / total) * 100)
  const tone = toneFromPercent(percent)

  return {
    visible: true,
    provider,
    used,
    remaining,
    total,
    percent,
    tone,
  }
}

export const buildAccountExternalQuotaProgressMeta = (
  status: ExternalSubscriptionStatus | null | undefined,
  preference: AccountExternalQuotaProgressPreference | null | undefined,
): ExternalQuotaProgressMeta | null => {
  if (!status || !preference?.enabled || !status.enabled || !status.configured || status.error_code) return null

  const provider = providerKeyFromStatus(status)
  if (!provider || !isFiniteNumber(status.remaining_usd)) return null

  const remaining = Math.max(0, status.remaining_usd)
  const total = preference.mode === 'custom_total'
    ? Math.max(0, Number(preference.customTotal ?? 0))
    : isFiniteNumber(status.total_limit_usd)
      ? Math.max(0, status.total_limit_usd)
      : 0

  if (!Number.isFinite(total) || total <= 0) return null

  const used = Math.max(0, total - remaining)
  const percent = clampPercent((used / total) * 100)

  return {
    visible: true,
    provider,
    used,
    remaining,
    total,
    percent,
    tone: toneFromPercent(percent),
  }
}
