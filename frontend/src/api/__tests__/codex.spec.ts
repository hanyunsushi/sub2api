import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { apiClient } from '@/api/client'
import {
  CpaApiError,
  deleteAuthFile,
  getCodexAuthUrl,
  listAuthFiles,
  mapCpaAuthFileToView,
  refreshCodexQuotas,
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

  it('formats nested CPA error objects as readable status text', () => {
    const view = mapCpaAuthFileToView({
      name: 'failed.json',
      status: 'error',
      status_message: {
        error: {
          message: 'quota refresh unauthorized',
        },
      },
    } as any)

    expect(view.statusMessage).toBe('quota refresh unauthorized')
    expect(view.statusMessage).not.toBe('[object Object]')
  })

  it('treats CPA disk fallback entries without source as deletable json files', () => {
    const view = mapCpaAuthFileToView({
      name: 'fallback-account.json',
      type: 'file',
      modtime: '2026-05-10T10:00:00Z',
    })

    expect(view).toMatchObject({
      name: 'fallback-account.json',
      source: 'unknown',
      canDelete: true,
      canDownload: true,
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
        cache: 'no-store',
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

  it('deletes a CPA auth file using CPA JSON body contract', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      headers: new Headers({ 'content-type': 'application/json' }),
      json: async () => ({ ok: true }),
    })

    await deleteAuthFile('folder/account 1.json', { managementKey: 'secret-key' })

    expect(mockFetch).toHaveBeenCalledWith(
      '/cpa-management/auth-files',
      expect.objectContaining({
        method: 'DELETE',
        body: JSON.stringify({ names: ['folder/account 1.json'] }),
        headers: expect.objectContaining({
          'Content-Type': 'application/json',
        }),
      })
    )
  })

  it('refreshes Codex quota through CPA api-call and merges visible usage fields', async () => {
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({
          status_code: 200,
          body: {
            plan_type: 'plus',
            rate_limit: {
              primary_window: {
                limit_window_seconds: 18000,
                used_percent: 12,
                reset_after_seconds: 600,
              },
              secondary_window: {
                limit_window_seconds: 604800,
                used_percent: 34,
                reset_after_seconds: 86400,
              },
            },
          },
        }),
      })

    const result = await refreshCodexQuotas(
      [
        {
          name: 'codex-account.json',
          provider: 'codex',
          auth_index: '3',
          id_token: 'header.eyJjaGF0Z3B0X2FjY291bnRfaWQiOiJhY2N0LTEifQ.sig',
        },
      ],
      { managementKey: 'secret-key' }
    )

    expect(mockFetch).toHaveBeenCalledWith(
      '/cpa-management/api-call',
      expect.objectContaining({
        method: 'POST',
        body: expect.stringContaining('"authIndex":"3"'),
      })
    )
    const requestBody = JSON.parse(mockFetch.mock.calls[0][1].body as string)
    expect(requestBody).toMatchObject({
      authIndex: '3',
      method: 'GET',
      url: 'https://chatgpt.com/backend-api/wham/usage',
      header: expect.objectContaining({
        Authorization: 'Bearer $TOKEN$',
        'Chatgpt-Account-Id': 'acct-1',
      }),
    })
    expect(result[0]).toMatchObject({
      status: 'ok',
      quota_text: 'Plus',
      usage_text: expect.stringContaining('5h remaining 88%'),
    })
  })

  it('refreshes Codex quota for alternate CPA type fields and top-level account id', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      headers: new Headers({ 'content-type': 'application/json' }),
      json: async () => ({
        status_code: 200,
        body: {
          plan_type: 'team',
          rate_limit: {
            primary_window: {
              limit_window_seconds: 604800,
              used_percent: 25,
            },
          },
        },
      }),
    })

    const result = await refreshCodexQuotas(
      [
        {
          name: 'team-account.json',
          channel: 'codex',
          auth_index: '7',
          chatgpt_account_id: 'acct-top-level',
        },
      ],
      { managementKey: 'secret-key' }
    )

    const requestBody = JSON.parse(mockFetch.mock.calls[0][1].body as string)
    expect(requestBody.header).toMatchObject({
      'Chatgpt-Account-Id': 'acct-top-level',
    })
    expect(result[0]).toMatchObject({
      status: 'ok',
      quota_text: 'Team',
      usage_text: 'weekly remaining 75%',
    })
  })

  it('limits concurrent CPA api-call quota refresh requests', async () => {
    let activeRequests = 0
    let maxActiveRequests = 0
    mockFetch.mockImplementation(async () => {
      activeRequests += 1
      maxActiveRequests = Math.max(maxActiveRequests, activeRequests)
      await new Promise((resolve) => setTimeout(resolve, 5))
      activeRequests -= 1
      return {
        ok: true,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({
          status_code: 200,
          body: {
            plan_type: 'free',
            rate_limit: {
              primary_window: {
                limit_window_seconds: 604800,
                used_percent: 10,
              },
            },
          },
        }),
      }
    })

    const authFiles = Array.from({ length: 9 }, (_, index) => ({
      name: `codex-${index}.json`,
      provider: 'codex',
      auth_index: String(index),
    }))

    await refreshCodexQuotas(authFiles, { managementKey: 'secret-key' })

    expect(maxActiveRequests).toBeLessThanOrEqual(4)
    expect(mockFetch).toHaveBeenCalledTimes(9)
  })

  it('keeps readable errors when CPA api-call returns nested error objects', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      headers: new Headers({ 'content-type': 'application/json' }),
      json: async () => ({
        status_code: 401,
        body: {
          error: {
            message: 'auth refresh required',
          },
        },
      }),
    })

    const result = await refreshCodexQuotas(
      [
        {
          name: 'codex-account.json',
          provider: 'codex',
          auth_index: '3',
        },
      ],
      { managementKey: 'secret-key' }
    )

    expect(result[0]).toMatchObject({
      status: 'error',
      status_message: 'auth refresh required',
      last_error: 'auth refresh required',
    })
    expect(result[0].status_message).not.toBe('[object Object]')
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
