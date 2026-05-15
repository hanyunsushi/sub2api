import type { CodexAccountMerged } from '@/types/codex'

export type CodexUsageStateFilter = 'all' | 'empty' | 'has_balance'
export type CodexAccountSortKey = 'default' | 'name' | 'cpaPriority' | 'modifiedAt' | 'balance'
export type CodexAccountSortDirection = 'asc' | 'desc'

export interface CodexAccountFilters {
  query: string
  status: string
  groupId: string
  usageState?: CodexUsageStateFilter
}

export interface CodexAccountSort {
  key: CodexAccountSortKey
  direction: CodexAccountSortDirection
}

export function filterCodexAccounts(
  accounts: CodexAccountMerged[],
  filters: CodexAccountFilters
): CodexAccountMerged[] {
  const query = filters.query.trim().toLowerCase()

  return accounts.filter((account) => {
    if (filters.status !== 'all' && account.status !== filters.status) return false
    if (!matchesGroupFilter(account, filters.groupId)) return false
    if (!matchesUsageStateFilter(account, filters.usageState || 'all')) return false
    if (!query) return true

    const haystack = [
      account.name,
      account.label,
      account.email,
      account.group?.name,
      account.metadata?.note,
      ...(account.metadata?.local_tags ?? []),
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase()

    return haystack.includes(query)
  })
}

export function sortCodexAccounts(
  accounts: CodexAccountMerged[],
  sort: CodexAccountSort
): CodexAccountMerged[] {
  if (sort.key === 'default') return [...accounts]

  return [...accounts].sort((a, b) => {
    const compared = compareBySortKey(a, b, sort)
    if (compared !== 0) return compared
    return a.name.localeCompare(b.name)
  })
}

function matchesGroupFilter(account: CodexAccountMerged, groupId: string): boolean {
  if (groupId === 'all') return true
  const accountGroupId = account.group?.id ?? account.metadata?.group_id ?? null
  if (groupId === 'ungrouped') return accountGroupId == null
  return accountGroupId === Number(groupId)
}

function matchesUsageStateFilter(account: CodexAccountMerged, usageState: CodexUsageStateFilter): boolean {
  if (usageState === 'all') return true
  if (usageState === 'empty') return !hasUsageData(account)
  if (usageState === 'has_balance') return (accountBalanceSortValue(account) ?? 0) > 0
  return true
}

function hasUsageData(account: CodexAccountMerged): boolean {
  return Boolean(
    account.balance !== undefined ||
    account.balanceText ||
    account.quotaRemainingPercent !== undefined ||
    account.usageText ||
    account.quotaWindows?.length
  )
}

function compareBySortKey(
  a: CodexAccountMerged,
  b: CodexAccountMerged,
  sort: CodexAccountSort
): number {
  if (sort.key === 'name') {
    return applyDirection(a.name.localeCompare(b.name), sort.direction)
  }

  const valueA = sortValue(a, sort.key)
  const valueB = sortValue(b, sort.key)
  const missingA = valueA === undefined
  const missingB = valueB === undefined
  if (missingA && missingB) return 0
  if (missingA) return 1
  if (missingB) return -1

  const compared = (valueA as number) - (valueB as number)
  return applyDirection(compared, sort.direction)
}

function sortValue(account: CodexAccountMerged, key: CodexAccountSortKey): number | undefined {
  if (key === 'cpaPriority') return account.cpaPriority
  if (key === 'modifiedAt') return dateSortValue(account.modifiedAt)
  if (key === 'balance') return accountBalanceSortValue(account)
  return undefined
}

function dateSortValue(value: string | undefined): number | undefined {
  if (!value) return undefined
  const timestamp = new Date(value).getTime()
  return Number.isFinite(timestamp) ? timestamp : undefined
}

function accountBalanceSortValue(account: CodexAccountMerged): number | undefined {
  if (account.quotaWindows?.length) {
    return Math.max(...account.quotaWindows.map((window) => window.remainingPercent))
  }
  if (account.quotaRemainingPercent !== undefined) return account.quotaRemainingPercent
  if (account.balance !== undefined) return account.balance
  return numericTextValue(account.balanceText) ?? remainingPercentTextValue(account.usageText)
}

function numericTextValue(value: string | undefined): number | undefined {
  if (!value) return undefined
  const match = value.replace(/,/g, '').match(/-?\d+(?:\.\d+)?/)
  if (!match) return undefined
  const parsed = Number(match[0])
  return Number.isFinite(parsed) ? parsed : undefined
}

function remainingPercentTextValue(value: string | undefined): number | undefined {
  if (!value || !/(remaining|left|available|剩余|可用)/i.test(value)) return undefined
  const matches = Array.from(value.matchAll(/(\d+(?:\.\d+)?)\s*%/g))
  const values = matches
    .map((match) => Number(match[1]))
    .filter((item) => Number.isFinite(item))
  return values.length ? Math.max(...values) : undefined
}

function applyDirection(value: number, direction: CodexAccountSortDirection): number {
  return direction === 'asc' ? value : -value
}
