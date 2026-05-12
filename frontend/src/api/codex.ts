import type {
  CodexAccountSource,
  CodexAccountStatus,
  CodexAccountView,
  CpaAuthFileRaw,
  CpaRequestOptions,
} from '@/types/codex'

export const DEFAULT_CPA_MANAGEMENT_BASE = '/cpa-management'

export class CpaApiError extends Error {
  status?: number

  constructor(message: string, status?: number) {
    super(message)
    this.name = 'CpaApiError'
    this.status = status
  }
}

function joinBaseAndPath(baseUrl: string, path: string): string {
  const base = baseUrl.replace(/\/+$/, '') || DEFAULT_CPA_MANAGEMENT_BASE
  const suffix = path.startsWith('/') ? path : `/${path}`
  return `${base}${suffix}`
}

function shouldAttachSub2APIAdminToken(baseUrl: string): boolean {
  const trimmed = baseUrl.trim()
  if (!trimmed || trimmed.startsWith('/')) return true

  try {
    return new URL(trimmed, window.location.origin).origin === window.location.origin
  } catch {
    return false
  }
}

async function readResponseBody(response: Response): Promise<unknown> {
  const contentType = response.headers.get('content-type') || ''
  if (contentType.includes('application/json')) {
    return response.json()
  }
  return response.text()
}

async function cpaRequest<T>(path: string, options: CpaRequestOptions & RequestInit = {}): Promise<T> {
  const {
    baseUrl = DEFAULT_CPA_MANAGEMENT_BASE,
    managementKey,
    signal,
    headers,
    ...init
  } = options
  const requestHeaders: Record<string, string> = {
    Accept: 'application/json',
    ...(headers as Record<string, string> | undefined),
  }
  const sub2apiToken = localStorage.getItem('auth_token')
  if (sub2apiToken && shouldAttachSub2APIAdminToken(baseUrl)) {
    requestHeaders['X-Sub2API-Authorization'] = `Bearer ${sub2apiToken}`
  }
  if (managementKey) {
    requestHeaders.Authorization = `Bearer ${managementKey}`
  }

  const response = await fetch(joinBaseAndPath(baseUrl, path), {
    ...init,
    signal,
    headers: requestHeaders,
  })
  const body = await readResponseBody(response)

  if (!response.ok) {
    const message = errorMessageFromPayload(body, response.statusText)
    throw new CpaApiError(message, response.status)
  }

  return body as T
}

function extractAuthFiles(payload: unknown): CpaAuthFileRaw[] {
  if (Array.isArray(payload)) return payload as CpaAuthFileRaw[]
  if (!payload || typeof payload !== 'object') {
    throw new CpaApiError('Invalid CPA auth-files response')
  }

  const record = payload as Record<string, unknown>
  const candidates = [record.auth_files, record.files, record.items, record.data]
  for (const candidate of candidates) {
    if (Array.isArray(candidate)) return candidate as CpaAuthFileRaw[]
  }
  throw new CpaApiError('Invalid CPA auth-files response')
}

export async function listAuthFiles(options: CpaRequestOptions = {}): Promise<CpaAuthFileRaw[]> {
  const payload = await cpaRequest<unknown>('/auth-files', {
    method: 'GET',
    cache: 'no-store',
    ...options,
  })
  return extractAuthFiles(payload)
}

export async function uploadAuthFile(file: File, options: CpaRequestOptions = {}): Promise<void> {
  const formData = new FormData()
  formData.append('file', file)
  await cpaRequest<unknown>('/auth-files', {
    method: 'POST',
    body: formData,
    ...options,
  })
}

export async function deleteAuthFile(name: string, options: CpaRequestOptions = {}): Promise<void> {
  try {
    await cpaRequest<unknown>(`/auth-files?name=${encodeURIComponent(name)}`, {
      method: 'DELETE',
      ...options,
    })
  } catch (err) {
    if (err instanceof CpaApiError && [400, 404, 405].includes(err.status ?? 0)) {
      await cpaRequest<unknown>('/auth-files', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ names: [name] }),
        ...options,
      })
      return
    }
    throw err
  }
}

export async function setAuthFileDisabled(
  name: string,
  disabled: boolean,
  options: CpaRequestOptions = {}
): Promise<void> {
  await cpaRequest<unknown>('/auth-files/status', {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ name, disabled }),
    ...options,
  })
}

interface CpaApiCallResponse {
  status_code?: number
  statusCode?: number
  header?: Record<string, unknown>
  headers?: Record<string, unknown>
  body?: unknown
  bodyText?: string
}

const CODEX_USAGE_URL = 'https://chatgpt.com/backend-api/wham/usage'
const CODEX_USAGE_HEADERS = {
  Authorization: 'Bearer $TOKEN$',
  'Content-Type': 'application/json',
  'User-Agent': 'codex_cli_rs/0.76.0 (Debian 13.0.0; x86_64) WindowsTerminal',
}
const CODEX_QUOTA_REFRESH_CONCURRENCY = 4

function parseMaybeJSON(value: unknown): unknown {
  if (typeof value !== 'string') return value
  const trimmed = value.trim()
  if (!trimmed) return null
  try {
    return JSON.parse(trimmed)
  } catch {
    return value
  }
}

function errorMessageFromPayload(value: unknown, fallback: string): string {
  const parsed = parseMaybeJSON(value)
  if (parsed instanceof Error) return parsed.message || fallback
  if (parsed === null || parsed === undefined) return fallback
  if (typeof parsed === 'string') return parsed.trim() || fallback
  if (typeof parsed === 'number' || typeof parsed === 'boolean') return String(parsed)
  if (Array.isArray(parsed)) {
    const messages = parsed.map((item) => errorMessageFromPayload(item, '')).filter(Boolean)
    if (messages.length) return messages.join('; ')
  }
  if (typeof parsed === 'object') {
    const record = parsed as Record<string, unknown>
    for (const key of ['message', 'error', 'detail', 'reason', 'text', 'description', 'status_message', 'statusMessage']) {
      const message = errorMessageFromPayload(record[key], '')
      if (message) return message
    }
    try {
      const serialized = JSON.stringify(parsed)
      return serialized && serialized !== '{}' ? serialized : fallback
    } catch {
      return fallback
    }
  }
  return fallback
}

function stringValue(value: unknown): string | undefined {
  if (typeof value === 'string' && value.trim()) return value.trim()
  if (typeof value === 'number' && Number.isFinite(value)) return String(value)
  return undefined
}

function numberValue(value: unknown): number | undefined {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value === 'string' && value.trim()) {
    const parsed = Number(value)
    if (Number.isFinite(parsed)) return parsed
  }
  return undefined
}

function decodeBase64URL(value: string): string | null {
  try {
    const padded = value.replace(/-/g, '+').replace(/_/g, '/').padEnd(Math.ceil(value.length / 4) * 4, '=')
    return globalThis.atob(padded)
  } catch {
    return null
  }
}

function decodeJWTObject(value: unknown): Record<string, unknown> | null {
  if (!value) return null
  if (typeof value === 'object' && !Array.isArray(value)) return value as Record<string, unknown>
  if (typeof value !== 'string') return null
  const parts = value.trim().split('.')
  if (parts.length < 2) return null
  const decoded = decodeBase64URL(parts[1])
  if (!decoded) return null
  const parsed = parseMaybeJSON(decoded)
  return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? (parsed as Record<string, unknown>) : null
}

function nestedRecord(raw: CpaAuthFileRaw, key: string): Record<string, unknown> | null {
  const value = raw[key]
  return value && typeof value === 'object' && !Array.isArray(value) ? (value as Record<string, unknown>) : null
}

function codexAccountID(raw: CpaAuthFileRaw): string | undefined {
  const metadata = nestedRecord(raw, 'metadata')
  const attributes = nestedRecord(raw, 'attributes')
  for (const candidate of [
    raw.chatgpt_account_id,
    raw.chatgptAccountId,
    raw.account_id,
    raw.accountId,
    metadata?.chatgpt_account_id,
    metadata?.chatgptAccountId,
    metadata?.account_id,
    metadata?.accountId,
    attributes?.chatgpt_account_id,
    attributes?.chatgptAccountId,
    attributes?.account_id,
    attributes?.accountId,
  ]) {
    const accountID = stringValue(candidate)
    if (accountID) return accountID
  }
  for (const token of [raw.id_token, raw.idToken, metadata?.id_token, metadata?.idToken, attributes?.id_token, attributes?.idToken]) {
    const decoded = decodeJWTObject(token)
    const accountID = stringValue(decoded?.chatgpt_account_id || decoded?.chatgptAccountId)
    if (accountID) return accountID
  }
  return undefined
}

function codexPlanType(raw: CpaAuthFileRaw, usage: Record<string, unknown>): string | undefined {
  const metadata = nestedRecord(raw, 'metadata')
  const attributes = nestedRecord(raw, 'attributes')
  const idToken = decodeJWTObject(raw.id_token)
  const metadataToken = decodeJWTObject(metadata?.id_token)
  const candidates = [
    usage.plan_type,
    usage.planType,
    raw.plan_type,
    raw.planType,
    idToken?.plan_type,
    idToken?.planType,
    metadata?.plan_type,
    metadata?.planType,
    metadataToken?.plan_type,
    metadataToken?.planType,
    attributes?.plan_type,
    attributes?.planType,
  ]
  for (const candidate of candidates) {
    const value = stringValue(candidate)?.toLowerCase()
    if (value) return value
  }
  return undefined
}

function codexPlanLabel(planType: string | undefined): string | undefined {
  if (!planType) return undefined
  const normalized = planType.toLowerCase()
  if (normalized === 'pro') return 'Pro 20x'
  if (['prolite', 'pro-lite', 'pro_lite'].includes(normalized)) return 'Pro 5x'
  if (normalized === 'plus') return 'Plus'
  if (normalized === 'team') return 'Team'
  if (normalized === 'free') return 'Free'
  return planType
}

function isCodexAuthFile(raw: CpaAuthFileRaw): boolean {
  const name = stringValue(raw.name)?.toLowerCase()
  const typeFields = [
    raw.provider,
    raw.channel,
    raw.type,
    raw.account_type,
    raw.accountType,
    raw.platform,
    raw.service,
    raw.kind,
  ]
  return typeFields.some((value) => stringValue(value)?.toLowerCase().includes('codex')) || !!name?.startsWith('codex-')
}

function windowRemainingPercent(windowValue: unknown): number | undefined {
  if (!windowValue || typeof windowValue !== 'object') return undefined
  const record = windowValue as Record<string, unknown>
  const used = numberValue(record.used_percent ?? record.usedPercent)
  if (used === undefined) return undefined
  return Math.max(0, Math.min(100, Math.round(100 - used)))
}

function limitWindowSeconds(windowValue: unknown): number | undefined {
  if (!windowValue || typeof windowValue !== 'object') return undefined
  const record = windowValue as Record<string, unknown>
  return numberValue(record.limit_window_seconds ?? record.limitWindowSeconds)
}

function codexUsageSummary(usage: Record<string, unknown>): string | undefined {
  const rateLimit = (usage.rate_limit || usage.rateLimit) as Record<string, unknown> | undefined
  if (!rateLimit || typeof rateLimit !== 'object') return undefined

  const rawWindows = [rateLimit.primary_window, rateLimit.primaryWindow, rateLimit.secondary_window, rateLimit.secondaryWindow]
  const parts: string[] = []
  for (const windowValue of rawWindows) {
    const remaining = windowRemainingPercent(windowValue)
    if (remaining === undefined) continue
    const seconds = limitWindowSeconds(windowValue)
    const label = seconds === 18000 ? '5h' : seconds === 604800 ? 'weekly' : 'quota'
    const text = `${label} remaining ${remaining}%`
    if (!parts.includes(text)) parts.push(text)
  }
  return parts.length ? parts.join(', ') : undefined
}

function codexPrimaryRemaining(usage: Record<string, unknown>): string | undefined {
  const remaining = codexPrimaryRemainingPercent(usage)
  return remaining === undefined ? undefined : `${remaining}%`
}

function codexPrimaryRemainingPercent(usage: Record<string, unknown>): number | undefined {
  const rateLimit = (usage.rate_limit || usage.rateLimit) as Record<string, unknown> | undefined
  if (!rateLimit || typeof rateLimit !== 'object') return undefined
  return windowRemainingPercent(rateLimit.primary_window || rateLimit.primaryWindow)
}

function mergeCodexQuota(raw: CpaAuthFileRaw, usagePayload: unknown): CpaAuthFileRaw {
  const usage = parseMaybeJSON(usagePayload)
  if (!usage || typeof usage !== 'object' || Array.isArray(usage)) {
    throw new CpaApiError('Invalid CPA Codex quota response')
  }
  const usageRecord = usage as Record<string, unknown>
  const planType = codexPlanType(raw, usageRecord)
  return {
    ...raw,
    status: 'ok',
    status_message: '',
    plan_type: planType || raw.plan_type,
    quota_text: codexPlanLabel(planType) || firstString(raw, ['quota_text', 'quota', 'plan', 'tier', 'subscription']),
    usage_text: codexUsageSummary(usageRecord) || firstString(raw, ['usage_text', 'usage', 'used_text', 'recent_usage']),
    balance_text: codexPrimaryRemaining(usageRecord) || firstString(raw, ['balance_text', 'credit_text', 'remaining_balance_text']),
    quota_remaining_percent: codexPrimaryRemainingPercent(usageRecord),
    last_refresh: new Date().toISOString(),
    last_error: undefined,
  }
}

async function cpaApiCall(request: Record<string, unknown>, options: CpaRequestOptions): Promise<CpaApiCallResponse> {
  const response = await cpaRequest<CpaApiCallResponse>('/api-call', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request),
    ...options,
  })
  const statusCode = Number(response.status_code ?? response.statusCode ?? 0)
  if (statusCode < 200 || statusCode >= 300) {
    const message = errorMessageFromPayload(response.body ?? response.bodyText, `HTTP ${statusCode}`)
    throw new CpaApiError(message, statusCode)
  }
  return response
}

async function mapWithConcurrency<T, R>(
  items: T[],
  concurrency: number,
  worker: (item: T, index: number) => Promise<R>
): Promise<R[]> {
  const results = new Array<R>(items.length)
  let nextIndex = 0
  const workerCount = Math.max(1, Math.min(concurrency, items.length))
  await Promise.all(
    Array.from({ length: workerCount }, async () => {
      while (nextIndex < items.length) {
        const index = nextIndex
        nextIndex += 1
        results[index] = await worker(items[index], index)
      }
    })
  )
  return results
}

export async function refreshCodexQuotas(
  authFiles: CpaAuthFileRaw[],
  options: CpaRequestOptions = {}
): Promise<CpaAuthFileRaw[]> {
  return mapWithConcurrency(
    authFiles,
    CODEX_QUOTA_REFRESH_CONCURRENCY,
    async (raw) => {
      if (!isCodexAuthFile(raw)) return raw
      const authIndex = stringValue(raw.auth_index ?? raw.authIndex)
      if (!authIndex) {
        return {
          ...raw,
          status: 'error',
          status_message: 'Auth file missing auth_index',
          last_error: 'Auth file missing auth_index',
          last_error_at: new Date().toISOString(),
        }
      }

      try {
        const headers: Record<string, string> = { ...CODEX_USAGE_HEADERS }
        const accountID = codexAccountID(raw)
        if (accountID) headers['Chatgpt-Account-Id'] = accountID
        const response = await cpaApiCall(
          {
            authIndex,
            method: 'GET',
            url: CODEX_USAGE_URL,
            header: headers,
          },
          options
        )
        return mergeCodexQuota(raw, response.body ?? response.bodyText)
      } catch (err) {
        const message = errorMessageFromPayload(err, 'Failed to refresh Codex quota')
        return {
          ...raw,
          status: 'error',
          status_message: message,
          last_error_code: err instanceof CpaApiError ? err.status : undefined,
          last_error: message,
          last_error_at: new Date().toISOString(),
        }
      }
    }
  )
}

function extractCodexAuthUrl(payload: unknown): string {
  if (typeof payload === 'string') {
    const trimmed = payload.trim()
    if (trimmed) return validateCodexAuthUrl(trimmed)
  }
  if (!payload || typeof payload !== 'object') {
    throw new CpaApiError('Invalid CPA codex-auth-url response')
  }

  const record = payload as Record<string, unknown>
  const candidates = [
    record.auth_url,
    record.url,
    record.codex_auth_url,
    record.login_url,
    record.oauth_url,
  ]
  for (const candidate of candidates) {
    if (typeof candidate === 'string' && candidate.trim()) return validateCodexAuthUrl(candidate.trim())
  }
  if (record.data && typeof record.data === 'object') {
    return extractCodexAuthUrl(record.data)
  }
  throw new CpaApiError('Invalid CPA codex-auth-url response')
}

function validateCodexAuthUrl(url: string): string {
  let parsed: URL
  try {
    parsed = new URL(url)
  } catch {
    throw new CpaApiError('Invalid CPA codex-auth-url response')
  }

  const hostname = parsed.hostname.toLowerCase()
  const allowedHost =
    hostname === 'openai.com' ||
    hostname.endsWith('.openai.com') ||
    hostname === 'chatgpt.com' ||
    hostname.endsWith('.chatgpt.com')
  if (parsed.protocol !== 'https:' || !allowedHost) {
    throw new CpaApiError('Unsafe CPA codex-auth-url response')
  }
  return url
}

export async function getCodexAuthUrl(options: CpaRequestOptions = {}): Promise<string> {
  const payload = await cpaRequest<unknown>('/codex-auth-url?is_webui=true', {
    method: 'GET',
    ...options,
  })
  return extractCodexAuthUrl(payload)
}

function normalizeStatus(raw: CpaAuthFileRaw): CodexAccountStatus {
  if (raw.disabled) return 'disabled'
  if (raw.unavailable) return 'failed'

  const status = String(raw.status || '').toLowerCase()
  if (/^[1-5]\d{2}$/.test(status)) return 'failed'
  if (['ok', 'ready', 'active', 'enabled', 'success'].includes(status)) return 'active'
  if (['expiring', 'expired', 'stale'].includes(status)) return 'expiring'
  if (['error', 'failed', 'unavailable', 'invalid'].includes(status)) return 'failed'
  return 'unknown'
}

function normalizeSource(source: unknown): CodexAccountSource {
  if (source === 'file') return 'file'
  if (source === 'memory') return 'memory'
  return 'unknown'
}

function valueCandidates(raw: CpaAuthFileRaw): Record<string, unknown>[] {
  const candidates: Record<string, unknown>[] = [raw]
  for (const key of [
    'account',
    'account_info',
    'quota',
    'usage',
    'billing',
    'stats',
    'error',
    'last_error',
    'status_message',
    'statusMessage',
  ]) {
    const value = raw[key]
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      candidates.push(value as Record<string, unknown>)
    }
  }
  return candidates
}

function firstString(raw: CpaAuthFileRaw, keys: string[]): string | undefined {
  for (const candidate of valueCandidates(raw)) {
    for (const key of keys) {
      const value = candidate[key]
      if (typeof value === 'string' && value.trim()) return value.trim()
      if (typeof value === 'number' && Number.isFinite(value)) return String(value)
    }
  }
  return undefined
}

function firstNumber(raw: CpaAuthFileRaw, keys: string[]): number | undefined {
  for (const candidate of valueCandidates(raw)) {
    for (const key of keys) {
      const value = candidate[key]
      if (typeof value === 'number' && Number.isFinite(value)) return value
      if (typeof value === 'string' && value.trim()) {
        const parsed = Number(value.replace(/,/g, ''))
        if (Number.isFinite(parsed)) return parsed
      }
    }
  }
  return undefined
}

function clampPercent(value: number | undefined): number | undefined {
  if (value === undefined) return undefined
  return Math.max(0, Math.min(100, Math.round(value)))
}

function percentFromText(value: string | undefined): number | undefined {
  if (!value) return undefined
  const match = value.match(/(\d+(?:\.\d+)?)\s*%/)
  if (!match) return undefined
  return clampPercent(Number(match[1]))
}

function remainingPercentFromText(value: string | undefined): number | undefined {
  if (!value) return undefined
  const lower = value.toLowerCase()
  if (!/(remaining|left|available|剩余|可用)/.test(lower)) return undefined
  return percentFromText(value)
}

function quotaRemainingPercent(raw: CpaAuthFileRaw, balanceText?: string, usageText?: string): number | undefined {
  const direct = firstNumber(raw, [
    'quota_remaining_percent',
    'remaining_percent',
    'remaining_pct',
    'remaining_quota_percent',
    'available_percent',
    'available_pct',
  ])
  if (direct !== undefined) return clampPercent(direct)

  const used = firstNumber(raw, [
    'quota_used_percent',
    'used_percent',
    'usage_percent',
  ])
  if (used !== undefined) return clampPercent(100 - used)

  return percentFromText(balanceText) ?? remainingPercentFromText(usageText)
}

function firstErrorCode(raw: CpaAuthFileRaw): string | undefined {
  const candidates = valueCandidates(raw)
  for (const candidate of candidates) {
    for (const key of [
      'last_error_code',
      'error_code',
      'errorCode',
      'status_code',
      'statusCode',
      'http_status',
      'httpStatus',
      'code',
    ]) {
      const code = stringValue(candidate[key])
      if (code && /^(?:[1-5]\d{2}|[A-Z0-9][A-Z0-9_-]{2,})$/i.test(code)) return code
    }
  }

  const status = stringValue(raw.status)
  if (status && /^[1-5]\d{2}$/.test(status)) return status
  return undefined
}

function readableErrorText(statusMessage: string, lastError?: string): string | undefined {
  const text = lastError || statusMessage
  if (!text || ['error', 'failed', 'invalid', 'unavailable'].includes(text.toLowerCase())) return undefined
  return text
}

export function mapCpaAuthFileToView(raw: CpaAuthFileRaw): CodexAccountView {
  const name = String(raw.name || raw.auth_index || raw.id || '')
  const source = normalizeSource(raw.source)
  const runtimeOnly = raw.runtime_only === true
  const jsonFileName = name.toLowerCase().endsWith('.json')
  const status = normalizeStatus(raw)
  const statusMessagePayload = status === 'failed'
    ? raw.status_message || raw.statusMessage || raw.last_error || raw.error_message || raw.failure_reason || raw.error || raw.status
    : raw.status_message || raw.status
  const statusMessage = errorMessageFromPayload(statusMessagePayload, '')
  const label = firstString(raw, ['label', 'account', 'email', 'username', 'display_name']) || name
  const balanceText = firstString(raw, ['balance_text', 'credit_text', 'credits_text', 'remaining_balance_text'])
  const usageText = firstString(raw, ['usage_text', 'usage', 'used_text', 'recent_usage', 'usage_status'])
  const lastError = firstString(raw, [
    'last_error',
    'last_error_message',
    'error_message',
    'failure_reason',
    'last_failure',
    'error',
    'message',
    'detail',
    'reason',
    'text',
    'description',
  ])
  const errorText = readableErrorText(statusMessage, lastError)

  return {
    key: String(raw.auth_index || raw.id || name),
    name,
    provider: String(raw.provider || 'codex'),
    label,
    status,
    statusMessage,
    source,
    canDelete: !!name && !runtimeOnly && source !== 'memory' && (source === 'file' || jsonFileName),
    canDownload: !!name && !runtimeOnly && source !== 'memory' && (source === 'file' || jsonFileName),
    canToggleDisabled: !!name && !runtimeOnly && source !== 'memory',
    size: typeof raw.size === 'number' ? raw.size : undefined,
    modifiedAt: raw.modtime || raw.updated_at || raw.created_at,
    lastRefreshAt: firstString(raw, ['last_refresh', 'last_checked_at', 'refreshed_at']),
    email: raw.email,
    balance: firstNumber(raw, [
      'balance',
      'credit',
      'credits',
      'credit_balance',
      'remaining_balance',
      'available_balance',
      'available_credits',
      'free_credits',
    ]),
    balanceText,
    quotaRemainingPercent: quotaRemainingPercent(raw, balanceText, usageText),
    quotaText: firstString(raw, ['quota_text', 'quota', 'limit_text', 'rate_limit', 'plan', 'tier', 'subscription']),
    usageText,
    errorCode: firstErrorCode(raw),
    errorText,
    lastError: lastError && lastError !== statusMessage ? lastError : undefined,
    lastErrorAt: firstString(raw, ['last_error_at', 'error_at', 'failed_at', 'last_failed_at']),
    success: raw.success,
    failed: raw.failed,
  }
}
