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

export function mapCpaAuthFileToView(raw: CpaAuthFileRaw): CodexAccountView {
  const name = String(raw.name || raw.auth_index || raw.id || '')
  const source = normalizeSource(raw.source)
  const runtimeOnly = raw.runtime_only === true

  return {
    key: String(raw.auth_index || raw.id || name),
    name,
    provider: String(raw.provider || 'codex'),
    label: String(raw.label || raw.account || raw.email || name),
    status: normalizeStatus(raw),
    statusMessage: String(raw.status_message || raw.status || ''),
    source,
    canDelete: source === 'file',
    canDownload: source === 'file' && !runtimeOnly,
    size: typeof raw.size === 'number' ? raw.size : undefined,
    modifiedAt: raw.modtime || raw.updated_at || raw.created_at,
    lastRefreshAt: raw.last_refresh,
    email: raw.email,
    success: raw.success,
    failed: raw.failed,
  }
}
