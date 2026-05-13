import type { CodexAccountMerged } from '@/types/codex'

export interface CodexAccountFilters {
  query: string
  status: string
  groupId: string
}

export function filterCodexAccounts(
  accounts: CodexAccountMerged[],
  filters: CodexAccountFilters
): CodexAccountMerged[] {
  const query = filters.query.trim().toLowerCase()

  return accounts.filter((account) => {
    if (filters.status !== 'all' && account.status !== filters.status) return false
    if (!matchesGroupFilter(account, filters.groupId)) return false
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

function matchesGroupFilter(account: CodexAccountMerged, groupId: string): boolean {
  if (groupId === 'all') return true
  const accountGroupId = account.group?.id ?? account.metadata?.group_id ?? null
  if (groupId === 'ungrouped') return accountGroupId == null
  return accountGroupId === Number(groupId)
}
