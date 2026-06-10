import type { ExternalSubscriptionStatus } from '@/api/admin/externalSubscriptions'
import type { Account } from '@/types'

const GENERIC_MODEL_KEYWORDS = new Set([
  'anthropic',
  'claude',
  'claude-code',
  'claudecode',
  'openai',
  'gemini',
  'codex',
])

const splitTokens = (value: string) =>
  value
    .toLowerCase()
    .split(/[^a-z0-9]+/i)
    .filter(Boolean)

const normalize = (value?: string | null) => (value || '').trim().toLowerCase()

export const buildExternalSubscriptionSearchText = (account: Account) => {
  const credentials = account.credentials ?? {}
  const extra = account.extra ?? {}
  const parts = [
    account.name,
    account.notes,
    account.platform,
    account.type,
    credentials.base_url,
    credentials.api_base_url,
    credentials.endpoint,
    extra.custom_base_url,
    extra.external_provider,
    account.custom_base_url,
  ]
  return parts
    .filter((part): part is string => typeof part === 'string' && part.trim() !== '')
    .join(' ')
    .toLowerCase()
}

const keywordScore = (text: string, tokenSet: Set<string>, keyword: string) => {
  const normalized = normalize(keyword)
  if (!normalized || GENERIC_MODEL_KEYWORDS.has(normalized)) return 0

  if (normalized.includes('.') || normalized.includes('/')) {
    return text.includes(normalized) ? 90 + Math.min(normalized.length, 30) : 0
  }

  const keywordTokens = splitTokens(normalized)
  if (keywordTokens.length === 0) return 0
  if (keywordTokens.every(token => tokenSet.has(token))) {
    return 70 + Math.min(normalized.length, 30)
  }

  if (normalized.length >= 4 && text.includes(normalized)) {
    return 40 + Math.min(normalized.length, 30)
  }

  return 0
}

const providerScore = (text: string, tokenSet: Set<string>, subscription: ExternalSubscriptionStatus) => {
  const provider = normalize(subscription.provider)
  const providerName = normalize(subscription.name)
  const providerCandidates = [provider, providerName].filter(Boolean)

  return providerCandidates.reduce((best, candidate) => {
    if (tokenSet.has(candidate)) return Math.max(best, 120 + Math.min(candidate.length, 30))
    if (candidate.length >= 4 && text.includes(candidate)) return Math.max(best, 80 + Math.min(candidate.length, 30))
    return best
  }, 0)
}

type MatchCandidate = {
  score: number
  subscription: ExternalSubscriptionStatus
}

export const findMatchingExternalSubscription = (
  account: Account,
  subscriptions: ExternalSubscriptionStatus[],
) => {
  const text = buildExternalSubscriptionSearchText(account)
  if (!text) return null
  const tokenSet = new Set(splitTokens(text))

  let best: MatchCandidate | null = null
  for (const subscription of subscriptions) {
    if (!subscription.enabled || !subscription.configured) continue
    const score = Math.max(
      providerScore(text, tokenSet, subscription),
      ...subscription.match_keywords.map(keyword => keywordScore(text, tokenSet, keyword)),
    )
    if (score <= 0) continue
    if (
      !best ||
      score > best.score ||
      (score === best.score && subscription.sort_order < best.subscription.sort_order)
    ) {
      best = { score, subscription }
    }
  }

  return best?.subscription ?? null
}
