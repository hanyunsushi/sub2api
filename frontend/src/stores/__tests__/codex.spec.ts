import { describe, it, expect, vi, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useCodexStore } from '@/stores/codex'
import * as cpaAPI from '@/api/codex'
import * as metadataAPI from '@/api/codexMetadata'

vi.mock('@/api/codex', async () => {
  const actual = await vi.importActual<typeof import('@/api/codex')>('@/api/codex')
  return {
    ...actual,
    listAuthFiles: vi.fn(),
    uploadAuthFile: vi.fn(),
    deleteAuthFile: vi.fn(),
    getCodexAuthUrl: vi.fn(),
  }
})

vi.mock('@/api/codexMetadata', () => ({
  listGroups: vi.fn(),
  createGroup: vi.fn(),
  updateGroup: vi.fn(),
  deleteGroup: vi.fn(),
  listAccountMetadata: vi.fn(),
  updateAccountMetadata: vi.fn(),
  deleteAccountMetadata: vi.fn(),
}))

describe('useCodexStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
    localStorage.clear()
    sessionStorage.clear()
  })

  it('keeps CPA management key in sessionStorage only', () => {
    const store = useCodexStore()

    store.setManagementKey('secret-key')

    expect(store.managementKey).toBe('secret-key')
    expect(sessionStorage.getItem('codex.managementKey')).toBe('secret-key')
    expect(localStorage.getItem('codex.managementKey')).toBeNull()
  })

  it('loads CPA accounts and database metadata, then merges by auth name', async () => {
    vi.mocked(cpaAPI.listAuthFiles).mockResolvedValue([
      { name: 'account1.json', label: 'Raw Label', status: 'ok', source: 'file' },
      { name: 'account2.json', status: 'ok', source: 'memory' },
    ])
    vi.mocked(metadataAPI.listGroups).mockResolvedValue([
      { id: 7, name: 'Prod', color: '#d97757', sort_order: 0, created_at: '', updated_at: '' },
    ])
    vi.mocked(metadataAPI.listAccountMetadata).mockResolvedValue([
      {
        id: 10,
        auth_name: 'account1.json',
        group_id: 7,
        display_name: 'Display Name',
        note: 'main pool',
        local_tags: ['prod'],
        settings: { proxy_template: 'home' },
        sort_order: 2,
        created_at: '',
        updated_at: '',
      },
      {
        id: 11,
        auth_name: 'missing.json',
        group_id: null,
        display_name: 'Missing',
        note: '',
        local_tags: [],
        settings: {},
        sort_order: 9,
        created_at: '',
        updated_at: '',
      },
    ])
    const store = useCodexStore()
    store.setManagementKey('secret-key')

    await store.loadAll()

    expect(cpaAPI.listAuthFiles).toHaveBeenCalledWith({
      baseUrl: '/cpa-management',
      managementKey: 'secret-key',
    })
    expect(store.accounts).toHaveLength(2)
    const account = store.accounts.find((item) => item.name === 'account1.json')
    expect(account).toMatchObject({
      name: 'account1.json',
      label: 'Display Name',
      metadata: expect.objectContaining({ note: 'main pool' }),
      group: expect.objectContaining({ name: 'Prod' }),
    })
    expect(store.orphanMetadata).toHaveLength(1)
    expect(store.orphanMetadata[0].auth_name).toBe('missing.json')
  })

  it('updates metadata through API and refreshes local merged state', async () => {
    vi.mocked(cpaAPI.listAuthFiles).mockResolvedValue([
      { name: 'account1.json', label: 'Raw Label', status: 'ok' },
    ])
    vi.mocked(metadataAPI.listGroups).mockResolvedValue([])
    vi.mocked(metadataAPI.listAccountMetadata).mockResolvedValue([])
    vi.mocked(metadataAPI.updateAccountMetadata).mockResolvedValue({
      id: 10,
      auth_name: 'account1.json',
      group_id: null,
      display_name: 'New Label',
      note: '',
      local_tags: [],
      settings: {},
      sort_order: 0,
      created_at: '',
      updated_at: '',
    })
    const store = useCodexStore()
    store.setManagementKey('secret-key')
    await store.loadAll()

    await store.updateAccountMetadata('account1.json', { display_name: 'New Label' })

    expect(metadataAPI.updateAccountMetadata).toHaveBeenCalledWith(
      'account1.json',
      { display_name: 'New Label' }
    )
    expect(store.accounts[0].label).toBe('New Label')
  })

  it('uploads CPA auth file through CPA and refreshes merged accounts', async () => {
    vi.mocked(cpaAPI.uploadAuthFile).mockResolvedValue(undefined)
    vi.mocked(cpaAPI.listAuthFiles).mockResolvedValue([{ name: 'account1.json', status: 'ok', source: 'file' }])
    vi.mocked(metadataAPI.listGroups).mockResolvedValue([])
    vi.mocked(metadataAPI.listAccountMetadata).mockResolvedValue([])
    const file = new File(['{}'], 'account1.json', { type: 'application/json' })
    const store = useCodexStore()
    store.setManagementKey('secret-key')

    await store.uploadAuthFile(file)

    expect(cpaAPI.uploadAuthFile).toHaveBeenCalledWith(file, {
      baseUrl: '/cpa-management',
      managementKey: 'secret-key',
    })
    expect(store.accounts[0].name).toBe('account1.json')
  })

  it('deletes CPA file accounts and removes matching Sub2 metadata', async () => {
    vi.mocked(cpaAPI.deleteAuthFile).mockResolvedValue(undefined)
    vi.mocked(cpaAPI.listAuthFiles).mockResolvedValueOnce([
      { name: 'account1.json', status: 'ok', source: 'file' },
    ]).mockResolvedValueOnce([])
    vi.mocked(metadataAPI.listGroups).mockResolvedValue([])
    vi.mocked(metadataAPI.listAccountMetadata).mockResolvedValueOnce([
      {
        id: 10,
        auth_name: 'account1.json',
        group_id: null,
        display_name: 'Account One',
        note: '',
        local_tags: [],
        settings: {},
        sort_order: 0,
        created_at: '',
        updated_at: '',
      },
    ]).mockResolvedValueOnce([])
    vi.mocked(metadataAPI.deleteAccountMetadata).mockResolvedValue(undefined)
    const store = useCodexStore()
    store.setManagementKey('secret-key')
    await store.loadAll()

    await store.deleteAuthFile('account1.json')

    expect(cpaAPI.deleteAuthFile).toHaveBeenCalledWith('account1.json', {
      baseUrl: '/cpa-management',
      managementKey: 'secret-key',
    })
    expect(metadataAPI.deleteAccountMetadata).toHaveBeenCalledWith('account1.json')
    expect(store.accounts).toHaveLength(0)
  })

  it('does not delete runtime-only or non-file accounts from CPA', async () => {
    vi.mocked(cpaAPI.listAuthFiles).mockResolvedValue([
      { name: 'memory-account', status: 'ok', source: 'memory' },
    ])
    vi.mocked(metadataAPI.listGroups).mockResolvedValue([])
    vi.mocked(metadataAPI.listAccountMetadata).mockResolvedValue([])
    const store = useCodexStore()
    store.setManagementKey('secret-key')
    await store.loadAll()

    await expect(store.deleteAuthFile('memory-account')).rejects.toThrow('Only CPA file accounts can be deleted')

    expect(cpaAPI.deleteAuthFile).not.toHaveBeenCalled()
  })

  it('returns the CPA Codex OAuth URL without persisting the management key', async () => {
    vi.mocked(cpaAPI.getCodexAuthUrl).mockResolvedValue('https://example.com/oauth')
    const store = useCodexStore()
    store.setManagementKey('secret-key')

    await expect(store.getCodexAuthUrl()).resolves.toBe('https://example.com/oauth')

    expect(cpaAPI.getCodexAuthUrl).toHaveBeenCalledWith({
      baseUrl: '/cpa-management',
      managementKey: 'secret-key',
    })
    expect(localStorage.getItem('codex.managementKey')).toBeNull()
  })
})
