import type { CodexAccountMerged } from '@/types/codex'

export function toggleAccountNameSelection(
  selectedNames: string[],
  authName: string,
  checked: boolean
): string[] {
  if (!authName) return selectedNames
  const names = new Set(selectedNames)
  if (checked) {
    names.add(authName)
  } else {
    names.delete(authName)
  }
  return Array.from(names)
}

export function pageDeletableAccounts(accounts: CodexAccountMerged[]): CodexAccountMerged[] {
  return accounts.filter((account) => account.canDelete)
}

export function isEveryPageDeletableAccountSelected(
  pageAccounts: CodexAccountMerged[],
  selectedNames: string[]
): boolean {
  const deletable = pageDeletableAccounts(pageAccounts)
  if (!deletable.length) return false
  const selected = new Set(selectedNames)
  return deletable.every((account) => selected.has(account.name))
}

export function updatePageDeletableSelection(
  selectedNames: string[],
  pageAccounts: CodexAccountMerged[],
  checked: boolean
): string[] {
  const pageNames = pageDeletableAccounts(pageAccounts).map((account) => account.name)
  const names = new Set(selectedNames)
  for (const name of pageNames) {
    if (checked) {
      names.add(name)
    } else {
      names.delete(name)
    }
  }
  return Array.from(names)
}

export function deleteSelectionTargets(
  selectedNames: string[],
  accounts: CodexAccountMerged[]
): CodexAccountMerged[] {
  const selected = new Set(selectedNames)
  return accounts.filter((account) => account.canDelete && selected.has(account.name))
}

export function reconcileSelectedAccountNames(
  selectedNames: string[],
  accounts: CodexAccountMerged[]
): string[] {
  const existingNames = new Set(accounts.map((account) => account.name))
  return selectedNames.filter((name) => existingNames.has(name))
}
