export const CODEX_ACCOUNTS_PAGE_SIZE = 50

export function getAccountPageCount(
  total: number,
  pageSize = CODEX_ACCOUNTS_PAGE_SIZE
): number {
  const safeTotal = Math.max(0, total)
  const safePageSize = Math.max(1, pageSize)
  return Math.max(1, Math.ceil(safeTotal / safePageSize))
}

export function clampAccountPage(
  page: number,
  total: number,
  pageSize = CODEX_ACCOUNTS_PAGE_SIZE
): number {
  if (!Number.isFinite(page)) return 1
  const totalPages = getAccountPageCount(total, pageSize)
  return Math.min(Math.max(1, Math.trunc(page)), totalPages)
}

export function paginateCodexAccounts<T>(
  accounts: T[],
  page: number,
  pageSize = CODEX_ACCOUNTS_PAGE_SIZE
): T[] {
  const currentPage = clampAccountPage(page, accounts.length, pageSize)
  const start = (currentPage - 1) * pageSize
  return accounts.slice(start, start + pageSize)
}
