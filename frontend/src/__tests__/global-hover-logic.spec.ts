import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import { describe, expect, it } from 'vitest'

const frontendRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const styleSource = readFileSync(resolve(frontendRoot, 'style.css'), 'utf8')

// Pull the appended "Global hover/highlight logic" section so assertions are
// scoped to the new calm-surface layer, not the legacy rules above it.
const marker = 'Global hover/highlight logic (all themes)'
const cfFilterMarker = 'Cloudflare theme — complete de-slab pass'
const calmLayer = styleSource.slice(
  styleSource.indexOf(marker),
  styleSource.indexOf(cfFilterMarker),
)

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

  it('does not neutralize interactive controls so they keep their highlight', () => {
    // The calm layer must not target buttons, sidebar links, menu/select
    // items, theme switcher, pagination or the AI search trigger.
    for (const interactive of [
      '.btn-primary', '.btn-secondary', '.sidebar-link',
      '.dropdown-item', '.select-option', '.theme-switcher-option',
      '.pagination-shell', '.ai-search-trigger',
    ]) {
      expect(calmLayer, `calm layer must leave ${interactive} alone`).not.toContain(interactive)
    }
  })
})

describe('Cloudflare theme — filter bars are not a black slab', () => {
  const cfMarker = 'Cloudflare theme — complete de-slab pass'
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
})
