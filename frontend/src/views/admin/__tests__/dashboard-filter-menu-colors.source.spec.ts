import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

import { describe, expect, it } from 'vitest'

const styleSource = readFileSync(resolve(__dirname, '../../../style.css'), 'utf8')

describe('dashboard filter menu colors', () => {
  const dashboardMenuStart = styleSource.indexOf('body.dashboard-filter-menu-open :where(.date-picker-dropdown-portal, .select-dropdown-portal)')
  const dashboardMenuBlock = styleSource.slice(
    dashboardMenuStart,
    styleSource.indexOf('body:has(.table-page-layout) :where(.select-dropdown-portal, .date-picker-dropdown-portal)', dashboardMenuStart),
  )

  it('keeps selected dropdown options readable with the same bright surface as hover', () => {
    expect(styleSource).toContain('body.dashboard-filter-menu-open :where(.date-picker-dropdown-portal, .select-dropdown-portal)')
    expect(styleSource).toContain('body:has(.table-page-layout) :where(.select-dropdown-portal, .date-picker-dropdown-portal)')
    expect(styleSource).toContain('--select-menu-selected-surface: var(--atelier-ui-hover-surface);')
    expect(styleSource).toContain('--select-menu-selected-text: var(--atelier-ink);')
    expect(styleSource).toContain('--date-picker-active-surface: var(--atelier-ui-hover-surface);')
    expect(styleSource).toContain('--date-picker-active-text: var(--atelier-ink);')
    expect(styleSource).not.toContain('--select-menu-selected-surface: var(--atelier-blue);')
    expect(styleSource).not.toContain('--select-menu-selected-text: var(--atelier-white);')
    expect(styleSource).not.toContain('--date-picker-active-surface: var(--atelier-blue);')
    expect(styleSource).not.toContain('--date-picker-active-text: var(--atelier-white);')
  })

  it('does not force dashboard date menu text to paper white on light themes', () => {
    expect(dashboardMenuBlock).toContain('--select-menu-plain-text: var(--atelier-slab-text);')
    expect(dashboardMenuBlock).toContain('--date-picker-plain-text: var(--atelier-slab-text);')
    expect(dashboardMenuBlock).toContain('--date-picker-muted-text: var(--atelier-slab-text);')
    expect(dashboardMenuBlock).not.toContain('--select-menu-plain-text: var(--atelier-paper);')
    expect(dashboardMenuBlock).not.toContain('--date-picker-plain-text: var(--atelier-paper);')
    expect(dashboardMenuBlock).not.toContain('--date-picker-muted-text: var(--atelier-paper);')
  })
})
