import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import { describe, expect, it } from 'vitest'

const frontendRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const styleSource = readFileSync(resolve(frontendRoot, 'style.css'), 'utf8')
const selectSource = readFileSync(resolve(frontendRoot, 'components/common/Select.vue'), 'utf8')
const dateRangePickerSource = readFileSync(resolve(frontendRoot, 'components/common/DateRangePicker.vue'), 'utf8')
const onboardingSource = readFileSync(resolve(frontendRoot, 'styles/onboarding.css'), 'utf8')

// Pull the appended "Global hover/highlight logic" section so assertions are
// scoped to the new calm-surface layer, not the legacy rules above it.
const marker = 'Global hover/highlight logic (all themes)'
const cfFilterMarker = 'Cloudflare theme — complete de-slab pass'
const stableHoverMarker = 'Global hover typography stability (all themes)'
const calmLayer = styleSource.slice(
  styleSource.indexOf(marker),
  styleSource.indexOf(cfFilterMarker),
)
const stableHoverLayer = styleSource.slice(styleSource.indexOf(stableHoverMarker))
const broadDropdownHoverBlock = stableHoverLayer.slice(
  stableHoverLayer.indexOf(':where(\n  .dropdown-item:hover'),
  stableHoverLayer.indexOf('.select-dropdown-portal {'),
)
const datePresetHoverBlock = stableHoverLayer.slice(
  stableHoverLayer.indexOf('body.dashboard-filter-menu-open .date-picker-dropdown-portal .date-picker-preset:hover:not(.date-picker-preset-active)'),
  stableHoverLayer.indexOf('.theme-switcher-option:hover:not(.theme-switcher-option-active)')
)
const onboardingCloseHoverBlock = onboardingSource.slice(
  onboardingSource.indexOf('.theme-tour-popover .driver-popover-close-btn:hover'),
  onboardingSource.indexOf('/* 4. Body Content */'),
)
const onboardingPrevHoverBlock = onboardingSource.slice(
  onboardingSource.indexOf('.theme-tour-popover .driver-popover-prev-btn:hover'),
  onboardingSource.indexOf('.dark .theme-tour-popover .driver-popover-prev-btn'),
)

const cssBlockContaining = (needle: string): string => {
  const start = styleSource.indexOf(needle)
  expect(start, `Could not find CSS block containing ${needle}`).toBeGreaterThanOrEqual(0)
  const open = styleSource.indexOf('{', start)
  const close = styleSource.indexOf('}', open)
  return styleSource.slice(start, close + 1)
}

describe('global hover logic — calm non-interactive surfaces', () => {
  it('appends a dedicated calm-hover override layer', () => {
    expect(styleSource).toContain(marker)
    // Surfaces freeze their paint on hover: no transform/lift.
    expect(calmLayer).toContain('transform: none !important;')
  })

  it('neutralizes hover recolor for cards, panels, tables and filter shells', () => {
    for (const surface of [
      '.card', '.paper-card', '.stat-card', '.summary-tile',
      '.codex-panel', '.ops-metric-card', '.table-wrapper',
      '.layout-section-fixed', '.dashboard-filter-card',
    ]) {
      expect(calmLayer, `calm layer should cover ${surface}`).toContain(surface)
    }
    // Table rows get a subtle neutral hover tint (CF dashboards highlight rows),
    // without lift/shadow/butter.
    expect(calmLayer).toContain('tbody tr:hover')
    expect(calmLayer).toContain('background: var(--atelier-ui-hover-surface) !important;')
  })

  it('keeps the calm-surface layer separate from true navigation and button affordances', () => {
    // Sidebar links and buttons keep affordance styling; menu/list options are
    // stabilized by the final typography layer instead of the surface layer.
    for (const interactive of ['.btn-primary', '.btn-secondary', '.sidebar-link']) {
      expect(calmLayer, `calm layer must leave ${interactive} alone`).not.toContain(interactive)
    }
  })
})

describe('global hover logic — stable typography for neutral option controls', () => {
  it('appends a final all-theme layer for hover text stability', () => {
    expect(styleSource).toContain(stableHoverMarker)
    expect(styleSource.lastIndexOf(stableHoverMarker)).toBeGreaterThan(styleSource.indexOf(cfFilterMarker))

    for (const selector of [
      '.dropdown-item:hover',
      '.select-dropdown-portal .select-option:not(.select-option-selected):not(.select-option-group)',
      '.select-dropdown-portal .select-option:hover',
      '.select-dropdown-portal .select-option-focused',
      '.date-picker-dropdown-portal .date-picker-preset:not(.date-picker-preset-active)',
      '.date-picker-dropdown-portal .date-picker-preset:hover:not(.date-picker-preset-active)',
      '.theme-switcher-option:hover:not(.theme-switcher-option-active)',
      '.action-menu-trigger:hover',
    ]) {
      expect(stableHoverLayer, `stable hover layer should cover ${selector}`).toContain(selector)
    }
  })

  it('keeps neutral option text tied to its resting token while hover uses surface only', () => {
    expect(stableHoverLayer).toContain('--select-option-stable-text: var(--select-option-text, var(--atelier-muted));')
    expect(stableHoverLayer).toContain(':root.theme-cloudflare body.dashboard-filter-menu-open .select-dropdown-portal')
    expect(stableHoverLayer).toContain('--select-option-stable-text: var(--atelier-ink);')
    expect(stableHoverLayer).toContain('color: var(--select-option-stable-text) !important;')
    expect(stableHoverLayer).toContain('color: var(--date-picker-muted-text, var(--atelier-muted)) !important;')
    expect(stableHoverLayer).toContain('background: var(--atelier-ui-hover-surface) !important;')
    expect(stableHoverLayer).toContain('-webkit-text-fill-color: currentColor !important;')
    expect(datePresetHoverBlock).not.toContain('color: var(--atelier-ink) !important;')
    expect(datePresetHoverBlock).toContain('color: var(--date-picker-muted-text, var(--atelier-muted)) !important;')
  })

  it('keeps selected select option text stable across hover and focus', () => {
    expect(stableHoverLayer).toContain('--select-option-selected-stable-text: var(--select-option-selected-text, var(--atelier-ink));')

    const selectedOptionBlock = stableHoverLayer.slice(
      stableHoverLayer.indexOf('.select-dropdown-portal .select-option-selected,'),
      stableHoverLayer.indexOf('.date-picker-dropdown-portal .date-picker-preset:not(.date-picker-preset-active)'),
    )
    for (const selector of [
      '.select-dropdown-portal .select-option-selected,',
      '.select-dropdown-portal .select-option-selected:hover,',
      '.select-dropdown-portal .select-option-selected.select-option-focused,',
      '.dark .select-dropdown-portal .select-option-selected:hover,',
    ]) {
      expect(selectedOptionBlock, `selected option block should cover ${selector}`).toContain(selector)
    }

    expect(selectedOptionBlock).toContain('color: var(--select-option-selected-stable-text) !important;')
    expect(selectedOptionBlock).toContain('-webkit-text-fill-color: currentColor !important;')
    expect(selectedOptionBlock).toContain(':where(.select-option-label, svg)')
    expect(selectedOptionBlock).toContain('color: inherit !important;')
  })

  it('does not let the broad dropdown hover rule catch filled action buttons', () => {
    expect(broadDropdownHoverBlock).toContain('.date-picker-apply')
    expect(broadDropdownHoverBlock).toContain(':not(.date-picker-apply)')
    expect(broadDropdownHoverBlock).toContain(':not(.codex-button--primary)')
  })

  it('removes component-level hover text repaint tokens for select options', () => {
    expect(selectSource).not.toContain('--select-option-hover-text')
    expect(selectSource).toContain('--select-option-stable-text: var(--select-option-text);')
    expect(selectSource).toContain('color: var(--select-option-stable-text);')
  })

  it('keeps date presets from repainting neutral text on hover in dark mode', () => {
    expect(dateRangePickerSource).not.toContain('color: #f8fbff;')
    expect(dateRangePickerSource).not.toContain('background: rgba(0, 47, 167, 0.24);')
    expect(dateRangePickerSource).toContain('.date-picker-dropdown-portal .date-picker-preset:hover:not(.date-picker-preset-active)')
    expect(dateRangePickerSource).toContain('color: var(--date-picker-muted-text);')
  })

  it('keeps dashboard date controls from forcing paper text on Cloudflare slabs', () => {
    const dashboardRangeHoverBlock = cssBlockContaining(
      '#app .app-layout-content .admin-dashboard-atelier .dashboard-filter-card > div > .dashboard-filter-range:hover :where(span, svg)',
    )
    expect(dashboardRangeHoverBlock).not.toContain('-webkit-text-fill-color: var(--atelier-paper)')
    expect(dashboardRangeHoverBlock).toContain('-webkit-text-fill-color: var(--atelier-slab-text) !important;')

    const dashboardDatePortalBlock = styleSource.slice(
      styleSource.indexOf('body:has(.admin-dashboard-atelier) .date-picker-dropdown-portal :where(.date-picker-presets'),
      styleSource.indexOf('body:has(.admin-dashboard-atelier) .date-picker-dropdown-portal :where(.date-picker-preset:hover'),
    )
    expect(dashboardDatePortalBlock).not.toContain('-webkit-text-fill-color: var(--atelier-paper)')
    expect(dashboardDatePortalBlock).not.toContain('border-color: var(--atelier-paper)')
    expect(dashboardDatePortalBlock).not.toContain('rgba(255, 250, 240')
    expect(dashboardDatePortalBlock).toContain('border-color: var(--atelier-slab-edge-soft) !important;')
    expect(dashboardDatePortalBlock).toContain('-webkit-text-fill-color: var(--atelier-slab-text) !important;')

    const tableDatePortalBlock = styleSource.slice(
      styleSource.indexOf('body:has(.table-page-layout) .date-picker-dropdown-portal,\nbody:has(.table-page-layout) .date-picker-dropdown-portal :where(.date-picker-presets'),
      styleSource.indexOf('body:has(.table-page-layout) .date-picker-dropdown-portal :where(.date-picker-preset:hover'),
    )
    expect(tableDatePortalBlock).not.toContain('-webkit-text-fill-color: var(--atelier-paper)')
    expect(tableDatePortalBlock).not.toContain('border-color: var(--atelier-paper)')
    expect(tableDatePortalBlock).not.toContain('rgba(255, 250, 240')
    expect(tableDatePortalBlock).toContain('border-color: var(--atelier-slab-edge-soft) !important;')
    expect(tableDatePortalBlock).toContain('-webkit-text-fill-color: var(--atelier-slab-text) !important;')
  })

  it('uses theme accent tokens for onboarding tour filled buttons', () => {
    expect(onboardingSource).not.toContain('background-color: #002FA7 !important;')
    expect(onboardingSource).not.toContain('rgba(0, 47, 167')
    expect(onboardingSource).toContain('.theme-tour-popover .driver-popover-next-btn')
    expect(onboardingSource).toContain('background-color: var(--atelier-blue) !important;')
    expect(onboardingSource).toContain('background-color: var(--atelier-blue-dark) !important;')
  })

  it('keeps onboarding neutral controls from repainting text to accent on hover', () => {
    expect(onboardingSource).toContain('.theme-tour-popover .driver-popover-close-btn:hover')
    expect(onboardingSource).toContain('.theme-tour-popover .driver-popover-prev-btn:hover')
    expect(onboardingCloseHoverBlock).not.toContain('color: var(--atelier-blue-dark) !important;')
    expect(onboardingPrevHoverBlock).not.toContain('color: var(--atelier-blue-dark) !important;')
    expect(onboardingCloseHoverBlock).toContain('background-color: var(--atelier-ui-hover-surface) !important; color: var(--atelier-ink) !important;')
    expect(onboardingPrevHoverBlock).toContain('background-color: var(--atelier-ui-hover-surface) !important; color: var(--atelier-ink) !important;')
  })
})

describe('Cloudflare theme — filter bars are not a black slab', () => {
  const cfMarker = 'Cloudflare theme — complete de-slab pass'
  const finalHoverMarker = 'Final authoritative CF hover for neutral filter-bar buttons'
  const cfLayer = styleSource.slice(styleSource.indexOf(cfMarker))

  it('repaints ink-filled filter shells to a light panel under the Cloudflare theme', () => {
    expect(styleSource).toContain(cfMarker)
    expect(cfLayer).toContain(':root.theme-cloudflare')
    expect(cfLayer).toContain('.table-page-filter-section')
    expect(cfLayer).toContain('.dashboard-filter-card')
    expect(cfLayer).toContain('.usage-time-filter-card')
    // Light surface + ink text instead of --atelier-ink slab.
    expect(cfLayer).toContain('background: var(--atelier-paper-2) !important;')
    expect(cfLayer).toContain('color: var(--atelier-ink) !important;')
    // The scoped overrides must not paint these shells with the ink slab.
    expect(cfLayer).not.toContain('background: var(--atelier-ink) !important;')
  })

  it('keeps a last-wins neutral hover for filter-bar buttons that are not filled actions', () => {
    expect(styleSource).toContain(finalHoverMarker)
    expect(styleSource.lastIndexOf(finalHoverMarker)).toBeGreaterThan(styleSource.indexOf('CF filter-action button hover'))
    expect(styleSource.lastIndexOf(finalHoverMarker)).toBeGreaterThan(styleSource.indexOf(stableHoverMarker))

    const finalHoverLayer = styleSource.slice(styleSource.lastIndexOf(finalHoverMarker))
    expect(finalHoverLayer).toContain(':root.theme-cloudflare body #app .app-layout-content .table-page-layout .table-page-filter-section')
    for (const zone of [
      '.table-filter-actions',
      '.users-filter-actions',
      '.usage-filter-actions',
      '.table-filter-left',
      '.users-filter-left',
      '.usage-filter-left',
      '.users-filter-tools',
    ]) {
      expect(finalHoverLayer).toContain(zone)
    }
    expect(finalHoverLayer).toContain(':not(.btn-primary):not(.btn-success):not(.users-filter-create):not(:disabled):hover')
    expect(finalHoverLayer).toContain('background: var(--atelier-ui-hover-surface) !important;')
    expect(finalHoverLayer).toContain('border-color: var(--atelier-line-strong) !important;')
    expect(finalHoverLayer).toContain('color: var(--atelier-ink) !important;')
  })

  it('keeps Cloudflare filled action borders on brand orange instead of ink black', () => {
    expect(cfLayer).toContain(':root.theme-cloudflare :where(.btn-primary, .btn-success, .btn-warning, .btn-stripe, .date-picker-apply, .codex-button--primary)')
    expect(cfLayer).toContain('border-color: var(--atelier-blue) !important;')
  })

  it('keeps Cloudflare date picker apply hover as a filled action, not a neutral preset', () => {
    expect(cfLayer).toContain(':root.theme-cloudflare :where(.date-picker-dropdown-portal .date-picker-apply):hover:not(:disabled)')
    expect(cfLayer).toContain('background: var(--atelier-blue-dark) !important;')
    expect(cfLayer).toContain('color: var(--atelier-white) !important;')
  })

  it('uses neutral edge tokens instead of ink-black borders for filter and toolbar controls', () => {
    for (const needle of [
      '.app-layout-content .table-page-layout > .layout-section-fixed :where(.select-trigger, .date-picker-trigger, input[type="date"], input[type="search"], input[type="text"].input)',
      '#app .app-layout-content .table-page-layout > .layout-section-fixed.table-page-filter-section\n  :where(.table-filter-left, .users-filter-left, .usage-filter-left)\n  :where(.select-trigger, .date-picker-trigger, input[type="date"], input[type="search"], input[type="text"].input, .input)',
      '#app .app-layout-content .table-page-layout > .layout-section-fixed.table-page-filter-section\n  :where(.table-filter-actions, .users-filter-actions, .usage-filter-actions)\n  :where(.btn-secondary, .btn-ghost, .btn-primary, .btn-danger, button):not(:disabled)',
      '#app .app-layout-content .admin-dashboard-atelier .dashboard-filter-card,\n#app .app-layout-content .admin-dashboard-atelier .dashboard-filter-card:hover',
      '#app .app-layout-content .admin-usage-atelier .usage-time-filter-card',
      '#app .app-layout-content .admin-usage-atelier .usage-time-filter-range .date-picker-trigger',
      '#app .app-layout-content .admin-usage-atelier .usage-time-filter-granularity .select-trigger,',
      '#app .app-layout-content .user-keys-atelier .keys-filter-left :where(.select-trigger, input.input)',
      '#app .app-layout-content .user-usage-atelier .usage-filter-left :where(.select-trigger, .date-picker-trigger, input.input)',
      '#app .app-layout-content .user-usage-atelier .usage-filter-actions :where(.btn-secondary, .btn-primary, button):not(:disabled)',
      '#app .app-layout-content .global-pricing-filter-left :where(input.input, select.input)',
      '#app .app-layout-content .global-pricing-filter-actions :where(.btn-secondary, button):not(:disabled)',
      '#app .app-layout-content .ops-dashboard-atelier .ops-monitor-toolbar-controls .select-trigger,',
    ]) {
      const block = cssBlockContaining(needle)
      expect(block, `${needle} should not keep ink-black borders`).not.toContain('border-color: var(--atelier-ink)')
      expect(block, `${needle} should not keep light-on-dark inset outlines`).not.toContain('rgba(255, 250, 240')
      expect(block, `${needle} should use an edge token`).toMatch(/border-color: var\(--atelier-(?:slab-edge|material-edge|line-strong)\) !important;/)
    }
  })
})
