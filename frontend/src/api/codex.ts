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
    const bodyRecord = typeof body === 'object' && body !== null ? (body as Record<string, unknown>) : null
    const message =
      typeof body === 'string'
        ? body || response.statusText
        : String(bodyRecord?.message || bodyRecord?.error || response.statusText)
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
  const params = new URLSearchParams({ name })
  await cpaRequest<unknown>(`/auth-files?${params.toString()}`, {
    method: 'DELETE',
    ...options,
  })
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
  for (const key of ['account', 'account_info', 'quota', 'usage', 'billing', 'stats']) {
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

export function mapCpaAuthFileToView(raw: CpaAuthFileRaw): CodexAccountView {
  const name = String(raw.name || raw.auth_index || raw.id || '')
  const source = normalizeSource(raw.source)
  const runtimeOnly = raw.runtime_only === true
  const statusMessage = String(raw.status_message || raw.status || '')
  const label = firstString(raw, ['label', 'account', 'email', 'username', 'display_name']) || name
  const lastError = firstString(raw, [
    'last_error',
    'last_error_message',
    'error_message',
    'failure_reason',
    'last_failure',
    'error',
  ])

  return {
    key: String(raw.auth_index || raw.id || name),
    name,
    provider: String(raw.provider || 'codex'),
    label,
    status: normalizeStatus(raw),
    statusMessage,
    source,
    canDelete: source === 'file',
    canDownload: source === 'file' && !runtimeOnly,
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
    balanceText: firstString(raw, ['balance_text', 'credit_text', 'credits_text', 'remaining_balance_text']),
    quotaText: firstString(raw, ['quota_text', 'quota', 'limit_text', 'rate_limit', 'plan', 'tier', 'subscription']),
    usageText: firstString(raw, ['usage_text', 'usage', 'used_text', 'recent_usage', 'usage_status']),
    lastError: lastError && lastError !== statusMessage ? lastError : undefined,
    lastErrorAt: firstString(raw, ['last_error_at', 'error_at', 'failed_at', 'last_failed_at']),
    success: raw.success,
    failed: raw.failed,
  }
}
