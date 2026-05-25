import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

import { describe, expect, it } from 'vitest'

const styleSource = readFileSync(resolve(__dirname, '../style.css'), 'utf8')
const appHeaderSource = readFileSync(resolve(__dirname, '../components/layout/AppHeader.vue'), 'utf8')
const appSidebarSource = readFileSync(resolve(__dirname, '../components/layout/AppSidebar.vue'), 'utf8')
const dashboardSource = readFileSync(resolve(__dirname, '../views/admin/DashboardView.vue'), 'utf8')
const opsDashboardHeaderSource = readFileSync(resolve(__dirname, '../views/admin/ops/components/OpsDashboardHeader.vue'), 'utf8')
const codexThemeSource = readFileSync(resolve(__dirname, '../styles/codex-theme.css'), 'utf8')
const globalPricingSource = readFileSync(resolve(__dirname, '../views/user/GlobalPricingView.vue'), 'utf8')
const materialSystemBlock = styleSource.slice(
  styleSource.indexOf('Atelier component material system'),
  styleSource.length
)

describe('console atelier palette restyle', () => {
  it('keeps the app shell on the two Downloads reference colors without introducing glass effects', () => {
    expect(styleSource).toContain('--atelier-canvas: var(--atelier-paper);')
    expect(styleSource).toContain('--atelier-material-1: var(--atelier-paper-2);')
    expect(styleSource).toContain('--atelier-material-2: var(--atelier-paper-2);')
    expect(styleSource).toContain('--atelier-console-grid-line: rgba(23, 21, 18, 0.035);')
    expect(styleSource).toContain('--atelier-console-grid-line-soft: rgba(23, 21, 18, 0.025);')
    expect(styleSource).toContain('--atelier-console-grid-size: 32px 32px;')
    expect(styleSource).toContain('radial-gradient(circle at 12% 18%, rgba(0, 47, 167, 0.06), transparent 28rem)')
    expect(styleSource).toContain('radial-gradient(circle at 84% 9%, rgba(199, 154, 58, 0.07), transparent 24rem)')
    expect(styleSource).toContain('linear-gradient(90deg, var(--atelier-console-grid-line) 1px, transparent 1px)')
    expect(styleSource).toContain('background-size: auto, auto, var(--atelier-console-grid-size), var(--atelier-console-grid-size), auto;')
    expect(styleSource).not.toContain('card-glass')
    expect(styleSource).not.toContain('glass-card')
    expect(styleSource).not.toContain('liquid')
    expect(materialSystemBlock).not.toContain(':where(.card, .paper-card, .paper-surface, .stat-card, .summary-tile, .admin-material-surface, .codex-panel, .codex-account-card):nth-of-type')
  })

  it('uses uniform paper-2 modules and dotted rules while preserving existing component class hooks', () => {
    expect(appHeaderSource).toContain('class="app-header-atelier paper-surface sticky')
    expect(appHeaderSource).toContain('data-testid="header-context-strip"')
    expect(appHeaderSource).toContain('app-header-meta-line')
    expect(appHeaderSource).toContain('app-header-route-meta')
    expect(appHeaderSource).toContain('max-w-[44vw]')
    expect(appHeaderSource).toContain('headerRouteLabel')
    expect(appHeaderSource).toContain('headerBalanceSummary')
    expect(appSidebarSource).toContain('class="sidebar-link')
    expect(dashboardSource).toContain('admin-dashboard-atelier')
    expect(dashboardSource).toContain('card dashboard-filter-card')
    expect(opsDashboardHeaderSource.match(/ops-metric-card/g)?.length).toBe(6)
    expect(opsDashboardHeaderSource.match(/ops-system-card/g)?.length).toBe(6)
    expect(globalPricingSource).toContain('summary-tile admin-material-surface')
    expect(globalPricingSource).toContain('table-wrapper admin-material-surface')
    expect(codexThemeSource).toContain('.codex-panel')
    expect(codexThemeSource).toContain('.codex-account-card')

    expect(materialSystemBlock).toContain('--atelier-card-surface: var(--atelier-paper-2);')
    expect(materialSystemBlock).toContain('background: var(--atelier-card-surface, var(--atelier-paper-2)) !important;')
    expect(materialSystemBlock).toContain('.app-layout-content :where(.ops-metric-card, .ops-system-card)')
    expect(materialSystemBlock).toContain('background: var(--atelier-paper-2) !important;')
    expect(materialSystemBlock).toContain('transform: translate3d(0, -2px, 0);')
    expect(materialSystemBlock).not.toContain('--atelier-card-rail')
    expect(materialSystemBlock).toContain('background: var(--atelier-console-rule);')
    expect(styleSource).toContain('--atelier-console-rule: repeating-linear-gradient(to right, var(--atelier-line-strong), var(--atelier-line-strong) 2px, transparent 2px, transparent 8px);')
  })

  it('themes console tables, inputs, and teleported menus as opaque atelier paper surfaces', () => {
    expect(materialSystemBlock).toContain('background: var(--atelier-paper-2) !important;')
    expect(materialSystemBlock).toContain('border-bottom: 1px solid var(--atelier-material-edge) !important;')
    expect(materialSystemBlock).toContain('background: var(--atelier-paper-2) !important;')
    expect(materialSystemBlock).toContain('background: color-mix(in srgb, var(--atelier-blue) 8%, var(--atelier-paper-2)) !important;')
    expect(materialSystemBlock).toContain('border-top: 1px dotted var(--atelier-material-edge) !important;')
    expect(materialSystemBlock).toContain('.floating-dropdown-portal')
    expect(materialSystemBlock).toContain('.select-dropdown-portal')
    expect(materialSystemBlock).toContain('.date-picker-dropdown-portal')
    expect(materialSystemBlock).not.toContain('background: transparent !important;')
  })

  it('keeps CPA/Codex panels on the same module palette without moving their layout', () => {
    expect(codexThemeSource).toContain('--codex-module-rule: var(--atelier-console-rule);')
    expect(codexThemeSource).toContain('border-bottom: 1px dotted var(--codex-border-strong);')
    expect(codexThemeSource).toContain('box-shadow: 0 10px 24px -22px var(--material-card-shadow);')
    expect(codexThemeSource).not.toContain('inset 4px 0 0 var(--codex-accent)')
    expect(codexThemeSource).not.toContain('grid-template-columns: minmax(0, 1fr) 420px;')
    expect(codexThemeSource).toContain('grid-template-columns: minmax(0, 1fr) 360px;')
  })
})
