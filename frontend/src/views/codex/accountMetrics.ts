import type { CodexAccountMerged } from '@/types/codex'

export interface CodexAccountMetrics {
  total: number
  active: number
  failed: number
  quotaExhausted: number
}

export function getCodexAccountMetrics(accounts: CodexAccountMerged[]): CodexAccountMetrics {
  return accounts.reduce<CodexAccountMetrics>(
    (metrics, account) => {
      metrics.total += 1
      if (account.status === 'active') metrics.active += 1
      if (account.status === 'failed') metrics.failed += 1
      if (account.status === 'active' && account.quotaExhausted) metrics.quotaExhausted += 1
      return metrics
    },
    {
      total: 0,
      active: 0,
      failed: 0,
      quotaExhausted: 0,
    }
  )
}
