import { apiClient } from '@/api/client'
import liustSubscriptionAPI from '@/api/admin/liustSubscription'
import packycodeSubscriptionAPI from '@/api/admin/packycodeSubscription'
import pixelSubscriptionAPI from '@/api/admin/pixelSubscription'
import qlhazycoderSubscriptionAPI from '@/api/admin/qlhazycoderSubscription'
import tcdmxSubscriptionAPI, { type TCDMXSubscriptionStatus } from '@/api/admin/tcdmxSubscription'
import xhyapiSubscriptionAPI from '@/api/admin/xhyapiSubscription'

export type ExternalSubscriptionTemplate =
  | 'newapi_console'
  | 'active_subscriptions'
  | 'openrouter_credits'
  | 'cloudflare_ai_gateway_credits'

export interface ExternalSubscriptionItem {
  id: number
  group_id: number
  group_name: string
  status: string
  window: 'daily' | 'weekly' | 'monthly' | 'unlimited' | 'subscription' | string
  limit_usd?: number
  used_usd: number
  remaining_usd?: number
  expires_at?: string
  days_remaining?: number
}

export interface ExternalSubscriptionProvider {
  id: string
  name: string
  enabled: boolean
  template: ExternalSubscriptionTemplate
  api_base_url: string
  api_token_configured: boolean
  user_id?: string
  refresh_token_configured: boolean
  match_keywords: string[]
  sort_order: number
}

export interface ExternalSubscriptionProviderInput {
  id?: string
  name: string
  enabled: boolean
  template: ExternalSubscriptionTemplate
  api_base_url: string
  api_token?: string
  user_id?: string
  refresh_token?: string
  match_keywords: string[]
  sort_order: number
}

export interface ExternalSubscriptionStatus {
  provider: string
  name: string
  template: ExternalSubscriptionTemplate
  enabled: boolean
  configured: boolean
  api_token_configured: boolean
  refresh_token_configured: boolean
  match_keywords: string[]
  sort_order: number
  currency: 'USD' | 'CNY' | string
  site_url: string
  error_code?: string
  error_message?: string
  total_limit_usd?: number
  used_usd: number
  remaining_usd?: number
  expires_at?: string
  days_remaining?: number
  active_count: number
  subscriptions: ExternalSubscriptionItem[]
  refreshed_at?: string
}

type LegacyExternalSubscriptionProvider = {
  provider: string
  name: string
  template: ExternalSubscriptionTemplate
  match_keywords: string[]
  sort_order: number
  getStatus: () => Promise<TCDMXSubscriptionStatus>
}

const legacyDisplayProviders: LegacyExternalSubscriptionProvider[] = [
  {
    provider: 'tcdmx',
    name: 'TCDMX',
    template: 'active_subscriptions',
    match_keywords: ['tcdmx', 'tcdmx.com'],
    sort_order: 10,
    getStatus: tcdmxSubscriptionAPI.getStatus,
  },
  {
    provider: 'qlhazycoder',
    name: 'QLHazyCoder',
    template: 'newapi_console',
    match_keywords: ['qlhazycoder', 'qlhazy', 'api.qlhazycoder.top'],
    sort_order: 20,
    getStatus: qlhazycoderSubscriptionAPI.getStatus,
  },
  {
    provider: 'packycode',
    name: 'PackyCode',
    template: 'newapi_console',
    match_keywords: ['packycode', 'packy', 'packyapi'],
    sort_order: 30,
    getStatus: packycodeSubscriptionAPI.getStatus,
  },
  {
    provider: 'xhyapi',
    name: 'XHYAPI',
    template: 'active_subscriptions',
    match_keywords: ['xhyapi', 'xhy', 'xhyapi.com'],
    sort_order: 40,
    getStatus: xhyapiSubscriptionAPI.getStatus,
  },
  {
    provider: 'pixel',
    name: 'Pixel',
    template: 'active_subscriptions',
    match_keywords: ['pixel', 'ai-pixel.online'],
    sort_order: 50,
    getStatus: pixelSubscriptionAPI.getStatus,
  },
  {
    provider: 'liust',
    name: 'LIUST',
    template: 'newapi_console',
    match_keywords: ['liust', 'liust.xyz'],
    sort_order: 60,
    getStatus: liustSubscriptionAPI.getStatus,
  },
]

const DISPLAY_STATUSES_CACHE_TTL_MS = 60_000

let displayStatusesCache: {
  expiresAt: number
  statuses: ExternalSubscriptionStatus[]
} | null = null
let displayStatusesRequest: Promise<ExternalSubscriptionStatus[]> | null = null

function cloneStatuses(statuses: ExternalSubscriptionStatus[]) {
  return statuses.map(status => ({
    ...status,
    match_keywords: [...status.match_keywords],
    subscriptions: status.subscriptions.map(subscription => ({ ...subscription })),
  }))
}

export function clearDisplayStatusesCache() {
  displayStatusesCache = null
  displayStatusesRequest = null
}

function normalizeDisplayStatus(
  status: TCDMXSubscriptionStatus,
  fallback: LegacyExternalSubscriptionProvider,
): ExternalSubscriptionStatus {
  return {
    provider: (status.provider || fallback.provider).trim().toLowerCase(),
    name: fallback.name,
    template: fallback.template,
    enabled: status.enabled,
    configured: status.configured,
    api_token_configured: status.configured,
    refresh_token_configured: false,
    match_keywords: fallback.match_keywords,
    sort_order: fallback.sort_order,
    currency: status.currency,
    site_url: status.site_url,
    error_code: status.error_code,
    error_message: status.error_message,
    total_limit_usd: status.total_limit_usd,
    used_usd: status.used_usd,
    remaining_usd: status.remaining_usd,
    expires_at: status.expires_at,
    days_remaining: status.days_remaining,
    active_count: status.active_count,
    subscriptions: status.subscriptions,
    refreshed_at: status.refreshed_at,
  }
}

function mergeDisplayStatuses(
  genericStatuses: ExternalSubscriptionStatus[],
  legacyStatuses: ExternalSubscriptionStatus[],
) {
  const byProvider = new Map<string, ExternalSubscriptionStatus>()
  for (const status of legacyStatuses) {
    byProvider.set(status.provider.trim().toLowerCase(), status)
  }
  for (const status of genericStatuses) {
    byProvider.set(status.provider.trim().toLowerCase(), status)
  }
  return [...byProvider.values()].sort((left, right) => {
    if (left.sort_order !== right.sort_order) return left.sort_order - right.sort_order
    return left.name.localeCompare(right.name)
  })
}

export async function listProviders(): Promise<ExternalSubscriptionProvider[]> {
  const { data } = await apiClient.get<ExternalSubscriptionProvider[]>('/admin/external-subscriptions')
  return data
}

export async function createProvider(input: ExternalSubscriptionProviderInput): Promise<ExternalSubscriptionProvider> {
  const { data } = await apiClient.post<ExternalSubscriptionProvider>('/admin/external-subscriptions', input)
  clearDisplayStatusesCache()
  return data
}

export async function updateProvider(id: string, input: ExternalSubscriptionProviderInput): Promise<ExternalSubscriptionProvider> {
  const { data } = await apiClient.put<ExternalSubscriptionProvider>(`/admin/external-subscriptions/${encodeURIComponent(id)}`, input)
  clearDisplayStatusesCache()
  return data
}

export async function deleteProvider(id: string): Promise<void> {
  await apiClient.delete(`/admin/external-subscriptions/${encodeURIComponent(id)}`)
  clearDisplayStatusesCache()
}

export async function getStatuses(): Promise<ExternalSubscriptionStatus[]> {
  const { data } = await apiClient.get<ExternalSubscriptionStatus[]>('/admin/external-subscriptions/statuses')
  return data
}

export async function getDisplayStatuses(): Promise<ExternalSubscriptionStatus[]> {
  const now = Date.now()
  if (displayStatusesCache && displayStatusesCache.expiresAt > now) {
    return cloneStatuses(displayStatusesCache.statuses)
  }
  if (displayStatusesRequest) {
    return cloneStatuses(await displayStatusesRequest)
  }
  displayStatusesRequest = loadDisplayStatuses()
  try {
    const statuses = await displayStatusesRequest
    displayStatusesCache = {
      expiresAt: now + DISPLAY_STATUSES_CACHE_TTL_MS,
      statuses: cloneStatuses(statuses),
    }
    return cloneStatuses(statuses)
  } finally {
    displayStatusesRequest = null
  }
}

async function loadDisplayStatuses(): Promise<ExternalSubscriptionStatus[]> {
  const [genericResult, ...legacyResults] = await Promise.allSettled([
    getStatuses(),
    ...legacyDisplayProviders.map(provider => provider.getStatus()),
  ])
  const genericStatuses = genericResult.status === 'fulfilled' ? genericResult.value : []
  const legacyStatuses = legacyResults
    .map((result, index) => {
      if (result.status !== 'fulfilled') return null
      return normalizeDisplayStatus(result.value, legacyDisplayProviders[index])
    })
    .filter((status): status is ExternalSubscriptionStatus => status !== null)
  return mergeDisplayStatuses(genericStatuses, legacyStatuses)
}

export default {
  listProviders,
  createProvider,
  updateProvider,
  deleteProvider,
  getStatuses,
  getDisplayStatuses,
  clearDisplayStatusesCache,
}
