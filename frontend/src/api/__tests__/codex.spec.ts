import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { apiClient } from '@/api/client'
import {
  CpaApiError,
  listAuthFiles,
  mapCpaAuthFileToView,
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
      success: 8,
      failed: 1,
    })
  })

  it('maps disabled and failed CPA status defensively', () => {
    expect(mapCpaAuthFileToView({ name: 'a.json', disabled: true }).status).toBe('disabled')
    expect(mapCpaAuthFileToView({ name: 'b.json', unavailable: true }).status).toBe('failed')
    expect(mapCpaAuthFileToView({ name: 'c.json', status: 'error' }).status).toBe('failed')
  })

  it('sends management key as Authorization bearer header without localStorage', async () => {
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
        }),
      })
    )
    expect(localStorage.getItem('codex.managementKey')).toBeNull()
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
