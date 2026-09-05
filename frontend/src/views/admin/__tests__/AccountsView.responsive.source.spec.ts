import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

import { describe, expect, it } from 'vitest'

const viewSource = readFileSync(resolve(__dirname, '../AccountsView.vue'), 'utf8')
const dataTableSource = readFileSync(resolve(__dirname, '../../../components/common/DataTable.vue'), 'utf8')
const repairSource = readFileSync(resolve(__dirname, '../../../styles/targeted-visual-repair.css'), 'utf8')

describe('AccountsView responsive toolbar contract', () => {
  it('keeps the account filter and action groups width-constrained on portrait screens', () => {
    expect(viewSource).toContain('accounts-filter-shell flex flex-col gap-3 lg:flex-row lg:items-start')
    expect(repairSource).toContain('@media (max-width: 720px)')
    expect(repairSource).toContain('.table-page-layout.mobile-mode.accounts-table-page .table-page-filter-section > .table-filter-shell')
    expect(repairSource).toContain('#app .app-layout-content .table-page-filter-section > .table-filter-shell')
    expect(repairSource).toContain('min-width: 0 !important;')
    expect(repairSource).toContain('flex: 1 1 100% !important;')
    expect(repairSource).toContain('flex-wrap: wrap !important;')
    expect(repairSource).toContain('width: calc(50% - (var(--anthropic-control-gap) / 2)) !important;')
  })

  it('keeps the account card grid renderer active below the shared mobile table breakpoint', () => {
    expect(viewSource).toContain('mobile-table-layout')
    expect(dataTableSource).toContain('!isDesktopViewport && !props.mobileTableLayout')
    expect(repairSource).toContain('accounts-table-page .account-card-table-frame > .table-wrapper')
    expect(repairSource).toContain('max-width: 22.5rem !important;')
    expect(repairSource).toContain('@media (max-width: 480px)')
  })

  it('caps account card tracks on wide screens instead of stretching them with the page', () => {
    const compactTrack = 'grid-template-columns: repeat(auto-fill, minmax(min(100%, 22.5rem), 22.5rem)) !important;'
    expect(repairSource).toContain(compactTrack)
    expect(repairSource).toContain('justify-content: start !important;')
    expect(repairSource).toContain(
      '.accounts-table-page .table-wrapper > table > tbody > tr'
    )

    const finalLockIndex = repairSource.lastIndexOf(compactTrack)
    const mobileModeLegacyTrackIndex = repairSource.lastIndexOf(
      'grid-template-columns: repeat(auto-fill, minmax(min(100%, 300px), 1fr)) !important;'
    )
    expect(finalLockIndex).toBeGreaterThan(mobileModeLegacyTrackIndex)
  })

  it('keeps auto-refresh selections visibly checkable', () => {
    expect(viewSource).toContain('v-if="autoRefreshEnabled" name="check"')
    expect(viewSource).toContain('v-if="autoRefreshIntervalSeconds === sec" name="check"')
    expect(viewSource).toContain('items-center justify-between')
  })
})
