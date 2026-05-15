import { describe, expect, it } from 'vitest'
import {
  CODEX_ACCOUNTS_PAGE_SIZE,
  clampAccountPage,
  paginateCodexAccounts,
  getAccountPageCount,
} from '../accountPagination'
import type { CodexAccountMerged } from '@/types/codex'

function account(index: number): CodexAccountMerged {
  return {
    key: `codex-${index}.json`,
    name: `codex-${index}.json`,
    provider: 'codex',
    label: `codex-${index}`,
    status: 'active',
    statusMessage: '',
    source: 'file',
    canDelete: true,
    canDownload: false,
    canToggleDisabled: true,
  }
}

describe('codex account pagination', () => {
  it('shows 50 auth files per page', () => {
    const accounts = Array.from({ length: 121 }, (_, index) => account(index + 1))

    expect(CODEX_ACCOUNTS_PAGE_SIZE).toBe(50)
    expect(getAccountPageCount(accounts.length, CODEX_ACCOUNTS_PAGE_SIZE)).toBe(3)
    expect(paginateCodexAccounts(accounts, 1).map((item) => item.name)).toHaveLength(50)
    expect(paginateCodexAccounts(accounts, 2)[0]?.name).toBe('codex-51.json')
    expect(paginateCodexAccounts(accounts, 3).map((item) => item.name)).toHaveLength(21)
  })

  it('clamps the current page when filters or deletes shrink the list', () => {
    expect(clampAccountPage(0, 121, CODEX_ACCOUNTS_PAGE_SIZE)).toBe(1)
    expect(clampAccountPage(99, 121, CODEX_ACCOUNTS_PAGE_SIZE)).toBe(3)
    expect(clampAccountPage(3, 49, CODEX_ACCOUNTS_PAGE_SIZE)).toBe(1)
    expect(clampAccountPage(2, 0, CODEX_ACCOUNTS_PAGE_SIZE)).toBe(1)
  })
})
