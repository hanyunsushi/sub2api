import { describe, expect, it } from 'vitest'
import { filterCodexAccounts, sortCodexAccounts } from '../accountFilters'
import type { CodexAccountMerged } from '@/types/codex'

function account(partial: Partial<CodexAccountMerged>): CodexAccountMerged {
  return {
    key: partial.name ?? 'account.json',
    name: partial.name ?? 'account.json',
    provider: 'codex',
    label: partial.label ?? partial.name ?? 'account.json',
    status: partial.status ?? 'active',
    statusMessage: '',
    source: 'file',
    canDelete: true,
    canDownload: false,
    canToggleDisabled: true,
    ...partial,
  }
}

describe('filterCodexAccounts', () => {
  it('filters accounts by selected CPA group', () => {
    const accounts = [
      account({
        name: 'prod.json',
        group: { id: 1, name: 'Prod', color: '#002FA7', sort_order: 0, created_at: '', updated_at: '' },
      }),
      account({
        name: 'dev.json',
        group: { id: 2, name: 'Dev', color: '#002FA7', sort_order: 1, created_at: '', updated_at: '' },
      }),
      account({ name: 'none.json' }),
    ]

    const result = filterCodexAccounts(accounts, { query: '', status: 'all', groupId: '1' })

    expect(result.map((item) => item.name)).toEqual(['prod.json'])
  })

  it('combines group filtering with status, text search, and ungrouped accounts', () => {
    const accounts = [
      account({
        name: 'prod-ok.json',
        status: 'active',
        metadata: {
          id: 1,
          auth_name: 'prod-ok.json',
          group_id: 1,
          display_name: '',
          note: 'main pool',
          local_tags: [],
          settings: {},
          sort_order: 0,
          created_at: '',
          updated_at: '',
        },
      }),
      account({
        name: 'prod-failed.json',
        status: 'failed',
        metadata: {
          id: 2,
          auth_name: 'prod-failed.json',
          group_id: 1,
          display_name: '',
          note: 'main pool',
          local_tags: [],
          settings: {},
          sort_order: 0,
          created_at: '',
          updated_at: '',
        },
      }),
      account({
        name: 'scratch.json',
        status: 'failed',
        metadata: {
          id: 3,
          auth_name: 'scratch.json',
          group_id: null,
          display_name: '',
          note: 'scratch pool',
          local_tags: ['scratch'],
          settings: {},
          sort_order: 0,
          created_at: '',
          updated_at: '',
        },
      }),
    ]

    expect(filterCodexAccounts(accounts, { query: 'pool', status: 'failed', groupId: '1' }).map((item) => item.name))
      .toEqual(['prod-failed.json'])
    expect(filterCodexAccounts(accounts, { query: 'scratch', status: 'all', groupId: 'ungrouped' }).map((item) => item.name))
      .toEqual(['scratch.json'])
  })

  it('filters accounts by empty usage data or positive balance', () => {
    const accounts = [
      account({ name: 'empty.json' }),
      account({ name: 'zero.json', quotaRemainingPercent: 0, usageText: '5h remaining 0%' }),
      account({ name: 'weekly.json', quotaWindows: [{ key: 'weekly', label: 'weekly', remainingPercent: 22 }] }),
      account({ name: 'cash.json', balance: 8 }),
    ]

    expect(filterCodexAccounts(accounts, {
      query: '',
      status: 'all',
      groupId: 'all',
      usageState: 'empty',
    }).map((item) => item.name)).toEqual(['empty.json'])

    expect(filterCodexAccounts(accounts, {
      query: '',
      status: 'all',
      groupId: 'all',
      usageState: 'has_balance',
    }).map((item) => item.name)).toEqual(['weekly.json', 'cash.json'])
  })
})

describe('sortCodexAccounts', () => {
  it('sorts by name, CPA priority, certificate modification date, and balance', () => {
    const accounts = [
      account({ name: 'beta.json', cpaPriority: 20, modifiedAt: '2026-05-11T00:00:00Z', balance: 4 }),
      account({ name: 'alpha.json', cpaPriority: 5, modifiedAt: '2026-05-12T00:00:00Z', quotaRemainingPercent: 70 }),
      account({ name: 'gamma.json', modifiedAt: '2026-05-10T00:00:00Z', balance: 1 }),
    ]

    expect(sortCodexAccounts(accounts, { key: 'name', direction: 'asc' }).map((item) => item.name))
      .toEqual(['alpha.json', 'beta.json', 'gamma.json'])
    expect(sortCodexAccounts(accounts, { key: 'cpaPriority', direction: 'asc' }).map((item) => item.name))
      .toEqual(['alpha.json', 'beta.json', 'gamma.json'])
    expect(sortCodexAccounts(accounts, { key: 'modifiedAt', direction: 'desc' }).map((item) => item.name))
      .toEqual(['alpha.json', 'beta.json', 'gamma.json'])
    expect(sortCodexAccounts(accounts, { key: 'balance', direction: 'desc' }).map((item) => item.name))
      .toEqual(['alpha.json', 'beta.json', 'gamma.json'])
  })
})
