import { describe, expect, it } from 'vitest'
import { getCodexAccountMetrics } from '../accountMetrics'
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

describe('getCodexAccountMetrics', () => {
  it('counts quota-exhausted CPA accounts as active and separately from failed', () => {
    const metrics = getCodexAccountMetrics([
      account({ name: 'healthy.json', status: 'active' }),
      account({ name: 'empty.json', status: 'active', quotaExhausted: true }),
      account({ name: 'auth-failed.json', status: 'failed' }),
      account({ name: 'disabled.json', status: 'disabled' }),
    ])

    expect(metrics).toEqual({
      total: 4,
      active: 2,
      failed: 1,
      quotaExhausted: 1,
    })
  })
})
