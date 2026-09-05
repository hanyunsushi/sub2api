import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const read = (path: string) => readFileSync(resolve(__dirname, path), 'utf8')

describe('responsive card and status visual contracts', () => {
  it('keeps generic mobile table cards and monitor cards compact', () => {
    const dataTable = read('../components/common/DataTable.vue')
    const monitorGrid = read('../components/user/monitor/MonitorCardGrid.vue')
    const repairCss = read('../styles/targeted-visual-repair.css')

    expect(dataTable).toContain('data-table-mobile-cards')
    expect(dataTable).toContain('data-table-mobile-card')
    expect(monitorGrid).toContain('monitor-channel-card-grid')
    expect(monitorGrid).toContain('class="monitor-channel-card p-5')
    expect(repairCss).toContain('data-table-mobile-cards .data-table-mobile-card')
    expect(repairCss).toContain('max-width: 22.5rem !important;')
    expect(repairCss).toContain('.monitor-channel-card-grid .monitor-channel-card')
    expect(repairCss).toContain('@media (max-width: 480px)')
  })

  it('keeps usage and group records in the table renderer on narrow screens', () => {
    expect(read('../views/user/UsageView.vue')).toContain('mobile-table-layout')
    expect(read('../components/admin/usage/UsageTable.vue')).toContain('mobile-table-layout')
    expect(read('../views/admin/GroupsView.vue')).toContain('mobile-table-layout')
  })

  it('uses solid semantic status chips only for profile and account status indicators', () => {
    const repairCss = read('../styles/targeted-visual-repair.css')

    expect(repairCss).toContain('.profile-overview-hero, .accounts-table-page .account-status-indicator')
    expect(repairCss).toContain('background: var(--anthropic-success) !important;')
    expect(repairCss).toContain('background: var(--anthropic-error) !important;')
    expect(repairCss).toContain('color: var(--anthropic-page) !important;')
  })

  it('marks the teleported profile menu so brackets are suppressed outside #app', () => {
    const header = read('../components/layout/AppHeader.vue')
    const rollbackCss = read('../styles/bracket-rollback-eof.css')

    expect(header).toContain('topbar-underline-menu user-profile-dropdown')
    expect(rollbackCss).toContain('html body .user-profile-dropdown')
    expect(rollbackCss).toContain('content: none !important;')
  })
})
