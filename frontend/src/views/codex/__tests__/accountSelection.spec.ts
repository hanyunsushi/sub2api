import { describe, expect, it } from 'vitest'
import {
  deleteSelectionTargets,
  isEveryPageDeletableAccountSelected,
  reconcileSelectedAccountNames,
  toggleAccountNameSelection,
  updatePageDeletableSelection,
} from '../accountSelection'
import type { CodexAccountMerged } from '@/types/codex'

function account(name: string, canDelete = true): CodexAccountMerged {
  return {
    key: name,
    name,
    provider: 'codex',
    label: name,
    status: 'active',
    statusMessage: '',
    source: canDelete ? 'file' : 'memory',
    canDelete,
    canDownload: false,
    canToggleDisabled: canDelete,
  }
}

describe('codex account selection helpers', () => {
  it('toggles account names without creating duplicates', () => {
    expect(toggleAccountNameSelection(['a.json'], 'b.json', true)).toEqual(['a.json', 'b.json'])
    expect(toggleAccountNameSelection(['a.json'], 'a.json', true)).toEqual(['a.json'])
    expect(toggleAccountNameSelection(['a.json', 'b.json'], 'a.json', false)).toEqual(['b.json'])
  })

  it('selects and clears only deletable accounts on the current page', () => {
    const offPage = 'outside.json'
    const page = [account('a.json'), account('memory.json', false), account('b.json')]

    const selected = updatePageDeletableSelection([offPage], page, true)
    expect(selected).toEqual([offPage, 'a.json', 'b.json'])
    expect(isEveryPageDeletableAccountSelected(page, selected)).toBe(true)

    expect(updatePageDeletableSelection(selected, page, false)).toEqual([offPage])
  })

  it('uses current account order and skips non-deletable targets for delete actions', () => {
    const accounts = [account('b.json'), account('memory.json', false), account('a.json')]

    expect(deleteSelectionTargets(['a.json', 'memory.json', 'b.json'], accounts).map((item) => item.name))
      .toEqual(['b.json', 'a.json'])
  })

  it('reconciles selected names after accounts disappear', () => {
    expect(reconcileSelectedAccountNames(['a.json', 'missing.json'], [account('a.json')])).toEqual(['a.json'])
  })
})
