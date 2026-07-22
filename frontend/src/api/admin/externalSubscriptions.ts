import { apiClient } from '@/api/client'
export type ExternalSubscriptionTemplate =
  | 'newapi_console'
  | 'active_subscriptions'
  | 'buzz_balance'
  | 'openrouter_credits'
  | 'cloudflare_ai_gateway_credits'
  | 'rawchat_subscriptions'
  | 'mimo_token_plan'

export type ExternalSubscriptionBalanceStrategy =
  | 'auto'
  | 'openai_billing'
  | 'newapi_user_quota'
  | 'newapi_subscription'
  | 'active_subscriptions'
  | 'auth_me_balance'
  | 'active_with_auth_me_balance'

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
  balance_strategy: ExternalSubscriptionBalanceStrategy
  api_base_url: string
  logo_url?: string
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
  balance_strategy: ExternalSubscriptionBalanceStrategy
  api_base_url: string
  logo_url?: string
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
  balance_strategy: ExternalSubscriptionBalanceStrategy
  enabled: boolean
  configured: boolean
  logo_url?: string
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

export interface AccountExternalQuotaProgressPreferencePayload {
  enabled: boolean
  mode: 'status_total' | 'custom_total' | 'token_total'
  customTotal?: number | null
  tokenTotal?: number | null
  tokenResetAt?: string | null
}

export type AccountExternalQuotaProgressSettingsPayload = Record<string, AccountExternalQuotaProgressPreferencePayload>

interface AccountExternalQuotaProgressSettingsResponse {
  settings?: AccountExternalQuotaProgressSettingsPayload
}

const DISPLAY_STATUSES_CACHE_TTL_MS = 60_000
const DISPLAY_STATUSES_STORAGE_TTL_MS = 30 * 60_000
const DISPLAY_STATUSES_STORAGE_KEY = 'sub2api.externalSubscriptionDisplayStatuses.v2'

let displayStatusesCache: {
  expiresAt: number
  statuses: ExternalSubscriptionStatus[]
} | null = null
let displayStatusesRequest: Promise<ExternalSubscriptionStatus[]> | null = null
let displayStatusesForceRefreshNext = false
const displayStatusesListeners = new Set<(statuses: ExternalSubscriptionStatus[]) => void>()

function cloneStatuses(statuses: ExternalSubscriptionStatus[]) {
  return statuses.map(status => ({
    ...status,
    match_keywords: [...status.match_keywords],
    subscriptions: status.subscriptions.map(subscription => ({ ...subscription })),
  }))
}

function staleDisplayStatuses() {
  return displayStatusesCache?.statuses?.length
    ? cloneStatuses(displayStatusesCache.statuses)
    : null
}

function readStoredDisplayStatuses(now = Date.now()) {
  if (typeof localStorage === 'undefined') return null
  try {
    const raw = localStorage.getItem(DISPLAY_STATUSES_STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as {
      savedAt?: number
      statuses?: ExternalSubscriptionStatus[]
    }
    if (
      typeof parsed.savedAt !== 'number' ||
      now - parsed.savedAt > DISPLAY_STATUSES_STORAGE_TTL_MS ||
      !Array.isArray(parsed.statuses) ||
      parsed.statuses.length === 0
    ) {
      return null
    }
    return cloneStatuses(parsed.statuses)
  } catch {
    return null
  }
}

function writeStoredDisplayStatuses(statuses: ExternalSubscriptionStatus[], now = Date.now()) {
  if (typeof localStorage === 'undefined' || statuses.length === 0) return
  try {
    localStorage.setItem(DISPLAY_STATUSES_STORAGE_KEY, JSON.stringify({
      savedAt: now,
      statuses: cloneStatuses(statuses),
    }))
  } catch {
    // Ignore storage quota/private-mode errors; in-memory cache still works.
  }
}

function setDisplayStatusesCache(statuses: ExternalSubscriptionStatus[], now = Date.now()) {
  displayStatusesCache = {
    expiresAt: now + DISPLAY_STATUSES_CACHE_TTL_MS,
    statuses: cloneStatuses(statuses),
  }
  writeStoredDisplayStatuses(statuses, now)
}

function rememberDisplayStatuses(statuses: ExternalSubscriptionStatus[], now = Date.now()) {
  if (statuses.length === 0) return
  setDisplayStatusesCache(statuses, now)
  emitDisplayStatuses(statuses)
}

function hydrateDisplayStatusesCache(now = Date.now()) {
  const stored = readStoredDisplayStatuses(now)
  if (!stored) return null
  displayStatusesCache = {
    expiresAt: now + DISPLAY_STATUSES_CACHE_TTL_MS,
    statuses: cloneStatuses(stored),
  }
  return cloneStatuses(stored)
}

async function hydrateDisplayStatusesFromBackendSnapshot(now = Date.now()) {
  try {
    const statuses = await getDisplayStatusesSnapshot()
    if (statuses.length === 0) return null
    displayStatusesCache = {
      expiresAt: now + DISPLAY_STATUSES_CACHE_TTL_MS,
      statuses: cloneStatuses(statuses),
    }
    writeStoredDisplayStatuses(statuses, now)
    return cloneStatuses(statuses)
  } catch {
    return null
  }
}

function emitDisplayStatuses(statuses: ExternalSubscriptionStatus[]) {
  const cloned = cloneStatuses(statuses)
  displayStatusesListeners.forEach((listener) => {
    try {
      listener(cloneStatuses(cloned))
    } catch {
      // Listener errors must not break shared balance loading.
    }
  })
}

export function clearDisplayStatusesCache() {
  displayStatusesCache = null
  displayStatusesRequest = null
}

export function clearStoredDisplayStatusesCache() {
  clearDisplayStatusesCache()
  displayStatusesForceRefreshNext = false
  try {
    localStorage.removeItem(DISPLAY_STATUSES_STORAGE_KEY)
  } catch {
    // ignore storage failures
  }
}

export async function getDisplayStatusesSnapshot(): Promise<ExternalSubscriptionStatus[]> {
  const { data } = await apiClient.get<ExternalSubscriptionStatus[]>('/admin/external-subscriptions/display-statuses-snapshot')
  return data
}

export async function getAccountQuotaProgressSettings(): Promise<AccountExternalQuotaProgressSettingsPayload> {
  const { data } = await apiClient.get<AccountExternalQuotaProgressSettingsResponse>('/admin/external-subscriptions/account-quota-progress-settings')
  return data.settings ?? {}
}

export async function updateAccountQuotaProgressSettings(settings: AccountExternalQuotaProgressSettingsPayload): Promise<AccountExternalQuotaProgressSettingsPayload> {
  const { data } = await apiClient.put<AccountExternalQuotaProgressSettingsResponse>('/admin/external-subscriptions/account-quota-progress-settings', {
    settings,
  })
  return data.settings ?? {}
}

function invalidateDisplayStatusesForConfigChange() {
  clearStoredDisplayStatusesCache()
  displayStatusesForceRefreshNext = true
}

export function subscribeDisplayStatuses(listener: (statuses: ExternalSubscriptionStatus[]) => void): () => void {
  displayStatusesListeners.add(listener)
  return () => {
    displayStatusesListeners.delete(listener)
  }
}

export async function listProviders(): Promise<ExternalSubscriptionProvider[]> {
  const { data } = await apiClient.get<ExternalSubscriptionProvider[]>('/admin/external-subscriptions')
  return data
}

export async function createProvider(input: ExternalSubscriptionProviderInput): Promise<ExternalSubscriptionProvider> {
  const { data } = await apiClient.post<ExternalSubscriptionProvider>('/admin/external-subscriptions', input)
  invalidateDisplayStatusesForConfigChange()
  return data
}

export async function updateProvider(id: string, input: ExternalSubscriptionProviderInput): Promise<ExternalSubscriptionProvider> {
  const { data } = await apiClient.put<ExternalSubscriptionProvider>(`/admin/external-subscriptions/${encodeURIComponent(id)}`, input)
  invalidateDisplayStatusesForConfigChange()
  return data
}

export async function deleteProvider(id: string): Promise<void> {
  await apiClient.delete(`/admin/external-subscriptions/${encodeURIComponent(id)}`)
  invalidateDisplayStatusesForConfigChange()
}

export async function getStatuses(): Promise<ExternalSubscriptionStatus[]> {
  const { data } = await apiClient.get<ExternalSubscriptionStatus[]>('/admin/external-subscriptions/statuses')
  return data
}

export async function getDisplayStatuses(options: { refresh?: boolean } = {}): Promise<ExternalSubscriptionStatus[]> {
  const now = Date.now()
  const forceRefresh = Boolean(options.refresh || displayStatusesForceRefreshNext)
  if (!forceRefresh && displayStatusesCache && displayStatusesCache.expiresAt > now) {
    return cloneStatuses(displayStatusesCache.statuses)
  }
  if (!forceRefresh && displayStatusesCache?.statuses?.length) {
    refreshDisplayStatusesInBackground()
    return cloneStatuses(displayStatusesCache.statuses)
  }
  const hydrated = !forceRefresh && !displayStatusesCache ? hydrateDisplayStatusesCache(now) : null
  if (hydrated) {
    refreshDisplayStatusesInBackground()
    return hydrated
  }
  if (displayStatusesRequest) {
    return cloneStatuses(await displayStatusesRequest)
  }
  displayStatusesForceRefreshNext = false
  displayStatusesRequest = loadDisplayStatuses(forceRefresh)
  try {
    const statuses = await displayStatusesRequest
    if (statuses.length === 0 && !forceRefresh) {
      const stale = staleDisplayStatuses() || hydrated || await hydrateDisplayStatusesFromBackendSnapshot(now)
      if (stale) return stale
    }
    rememberDisplayStatuses(statuses, now)
    return cloneStatuses(statuses)
  } catch (error) {
    if (!forceRefresh) {
      const stale = staleDisplayStatuses() || hydrated || await hydrateDisplayStatusesFromBackendSnapshot(now)
      if (stale) return stale
    }
    throw error
  } finally {
    displayStatusesRequest = null
  }
}

export function refreshDisplayStatusesInBackground(options: { force?: boolean } = {}): void {
  if (displayStatusesRequest) return
  displayStatusesRequest = loadDisplayStatuses(Boolean(options.force))
  void displayStatusesRequest.then((statuses) => {
    rememberDisplayStatuses(statuses)
  }).catch(() => {
    // Callers already have stale data; keep background refresh quiet.
  }).finally(() => {
    displayStatusesRequest = null
  })
}

async function loadDisplayStatuses(forceRefresh = false): Promise<ExternalSubscriptionStatus[]> {
  if (!forceRefresh) return getStatuses()
  const { data } = await apiClient.get<ExternalSubscriptionStatus[]>('/admin/external-subscriptions/statuses', {
    params: { refresh: 1, _: Date.now() },
  })
  return data
}

export default {
  listProviders,
  createProvider,
  updateProvider,
  deleteProvider,
  getStatuses,
  getDisplayStatuses,
  getDisplayStatusesSnapshot,
  refreshDisplayStatusesInBackground,
  subscribeDisplayStatuses,
  clearDisplayStatusesCache,
  clearStoredDisplayStatusesCache,
  getAccountQuotaProgressSettings,
  updateAccountQuotaProgressSettings,
}
