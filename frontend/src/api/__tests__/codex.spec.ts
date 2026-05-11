import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { apiClient } from '@/api/client'
import {
  CpaApiError,
  deleteAuthFile,
  getCodexAuthUrl,
  listAuthFiles,
  mapCpaAuthFileToView,
  uploadAuthFile,
} from '@/api/codex'
import * as codexMetadataAPI from '@/api/codexMetadata'

vi.mock('@/api/client', () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}))

const mockFetch = vi.fn()

describe('codex CPA API adapter', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', mockFetch)
    mockFetch.mockReset()
    localStorage.clear()
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('maps raw CPA auth file fields into stable account view', () => {
    const view = mapCpaAuthFileToView({
      auth_index: 'idx-1',
      name: 'account1.json',
      label: 'Work',
      provider: 'openai',
      status: 'ok',
      source: 'file',
      size: 123,
      modtime: '2026-05-10T10:00:00Z',
      email: 'user@example.com',
      balance: '12.5',
      quota_text: 'Pro plan',
      usage_text: '5h 20%',
      last_error: 'rate limit',
      last_error_at: '2026-05-10T11:00:00Z',
      success: 8,
      failed: 1,
    })

    expect(view).toMatchObject({
      key: 'idx-1',
      name: 'account1.json',
      provider: 'openai',
      label: 'Work',
      status: 'active',
      source: 'file',
      canDelete: true,
      canDownload: true,
      size: 123,
      modifiedAt: '2026-05-10T10:00:00Z',
      email: 'user@example.com',
      balance: 12.5,
      quotaText: 'Pro plan',
      usageText: '5h 20%',
      lastError: 'rate limit',
      lastErrorAt: '2026-05-10T11:00:00Z',
      success: 8,
      failed: 1,
    })
  })

  it('maps nested CPA account quota fields without exposing raw auth data', () => {
    const view = mapCpaAuthFileToView({
      name: 'nested.json',
      account: {
        email: 'nested@example.com',
        remaining_balance: 3,
        plan: 'Team',
      },
      billing: {
        usage_text: '7d 40%',
      },
      stats: {
        last_error_message: 'token refresh failed',
      },
    })

    expect(view).toMatchObject({
      label: 'nested@example.com',
      balance: 3,
      quotaText: 'Team',
      usageText: '7d 40%',
      lastError: 'token refresh failed',
    })
  })

  it('maps disabled and failed CPA status defensively', () => {
    expect(mapCpaAuthFileToView({ name: 'a.json', disabled: true }).status).toBe('disabled')
    expect(mapCpaAuthFileToView({ name: 'b.json', unavailable: true }).status).toBe('failed')
    expect(mapCpaAuthFileToView({ name: 'c.json', status: 'error' }).status).toBe('failed')
  })

  it('sends management key as Authorization bearer header without localStorage', async () => {
    localStorage.setItem('auth_token', 'sub2api-admin-token')
    mockFetch.mockResolvedValue({
      ok: true,
      headers: new Headers({ 'content-type': 'application/json' }),
      json: async () => ({ auth_files: [{ name: 'account1.json' }] }),
    })

    const result = await listAuthFiles({
      baseUrl: '/cpa-management/',
      managementKey: 'secret-key',
    })

    expect(result).toHaveLength(1)
    expect(mockFetch).toHaveBeenCalledWith(
      '/cpa-management/auth-files',
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: 'Bearer secret-key',
          'X-Sub2API-Authorization': 'Bearer sub2api-admin-token',
        }),
      })
    )
    expect(localStorage.getItem('codex.managementKey')).toBeNull()
  })

  it('does not send Sub2API admin token to absolute external CPA URLs', async () => {
    localStorage.setItem('auth_token', 'sub2api-admin-token')
    mockFetch.mockResolvedValue({
      ok: true,
      headers: new Headers({ 'content-type': 'application/json' }),
      json: async () => ({ auth_files: [] }),
    })

    await listAuthFiles({
      baseUrl: 'https://cpa.example.test/v0/management',
      managementKey: 'secret-key',
    })

    expect(mockFetch).toHaveBeenCalledWith(
      'https://cpa.example.test/v0/management/auth-files',
      expect.objectContaining({
        headers: expect.not.objectContaining({
          'X-Sub2API-Authorization': expect.any(String),
        }),
      })
    )
  })

  it('handles non-JSON CPA error responses', async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      status: 502,
      statusText: 'Bad Gateway',
      headers: new Headers({ 'content-type': 'text/plain' }),
      text: async () => 'upstream unavailable',
    })

    await expect(listAuthFiles({ managementKey: 'secret-key' })).rejects.toMatchObject({
      status: 502,
      message: 'upstream unavailable',
    })
  })

  it('handles JSON CPA error responses with error field', async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      status: 401,
      statusText: 'Unauthorized',
      headers: new Headers({ 'content-type': 'application/json' }),
      json: async () => ({ error: 'invalid management key' }),
    })

    await expect(listAuthFiles({ managementKey: 'bad-key' })).rejects.toMatchObject({
      status: 401,
      message: 'invalid management key',
    })
  })

  it('throws CpaApiError for malformed auth-files payload', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      headers: new Headers({ 'content-type': 'application/json' }),
      json: async () => ({ unexpected: true }),
    })

    await expect(listAuthFiles({ managementKey: 'secret-key' })).rejects.toBeInstanceOf(CpaApiError)
  })

  it('uploads Codex auth JSON to CPA using multipart file field', async () => {
    const file = new File(['{"token":"secret"}'], 'codex.json', { type: 'application/json' })
    mockFetch.mockResolvedValue({
      ok: true,
      headers: new Headers({ 'content-type': 'application/json' }),
      json: async () => ({ ok: true }),
    })

    await uploadAuthFile(file, { managementKey: 'secret-key' })

    expect(mockFetch).toHaveBeenCalledWith(
      '/cpa-management/auth-files',
      expect.objectContaining({
        method: 'POST',
        body: expect.any(FormData),
        headers: expect.not.objectContaining({
          'Content-Type': expect.any(String),
        }),
      })
    )
    const body = mockFetch.mock.calls[0][1].body as FormData
    expect(body.get('file')).toBe(file)
  })

  it('deletes a CPA auth file by name', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      headers: new Headers({ 'content-type': 'application/json' }),
      json: async () => ({ ok: true }),
    })

    await deleteAuthFile('folder/account 1.json', { managementKey: 'secret-key' })

    expect(mockFetch).toHaveBeenCalledWith(
      '/cpa-management/auth-files?name=folder%2Faccount+1.json',
      expect.objectContaining({ method: 'DELETE' })
    )
  })

  it('extracts Codex OAuth URL from CPA response defensively', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      headers: new Headers({ 'content-type': 'application/json' }),
      json: async () => ({ data: { auth_url: 'https://auth.openai.com/oauth' } }),
    })

    await expect(getCodexAuthUrl({ managementKey: 'secret-key' })).resolves.toBe('https://auth.openai.com/oauth')
    expect(mockFetch).toHaveBeenCalledWith(
      '/cpa-management/codex-auth-url?is_webui=true',
      expect.objectContaining({ method: 'GET' })
    )
  })

  it('rejects unsafe Codex OAuth URLs from CPA responses', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      headers: new Headers({ 'content-type': 'application/json' }),
      json: async () => ({ auth_url: 'javascript:alert(1)' }),
    })

    await expect(getCodexAuthUrl({ managementKey: 'secret-key' })).rejects.toBeInstanceOf(CpaApiError)
  })
})

describe('codex metadata API adapter', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('uses Sub2API admin Codex metadata endpoints', async () => {
    vi.mocked(apiClient.get).mockResolvedValueOnce({ data: [{ id: 1, name: 'Prod' }] })
    vi.mocked(apiClient.put).mockResolvedValueOnce({ data: { auth_name: 'account1.json' } })

    await expect(codexMetadataAPI.listGroups()).resolves.toEqual([{ id: 1, name: 'Prod' }])
    await expect(codexMetadataAPI.updateAccountMetadata('account1.json', {
      display_name: 'Account One',
    })).resolves.toEqual({ auth_name: 'account1.json' })

    expect(apiClient.get).toHaveBeenCalledWith('/admin/codex/groups')
    expect(apiClient.put).toHaveBeenCalledWith(
      '/admin/codex/accounts/account1.json/metadata',
      { display_name: 'Account One' }
    )
  })
})
