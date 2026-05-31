import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import { describe, expect, it } from 'vitest'

const frontendRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../..')
const readFile = (file: string) => readFileSync(resolve(frontendRoot, file), 'utf8')

const styleSource = readFile('src/style.css')
const codexThemeSource = readFile('src/styles/codex-theme.css')
const appearanceThemeSource = readFile('src/composables/useAppearanceTheme.ts')

// Cloudflare brand palette
const cfOrange = '#f6821f'
const cfGold = '#fbad41'

// Extract the body of a balanced { ... } block that starts at the given selector text.
const cssBlockFrom = (source: string, selectorText: string) => {
  const selectorIndex = source.indexOf(selectorText)
  expect(selectorIndex, `selector not found: ${selectorText}`).toBeGreaterThan(-1)
  const openBraceIndex = source.indexOf('{', selectorIndex)
  let depth = 0
  for (let index = openBraceIndex; index < source.length; index += 1) {
    const char = source[index]
    if (char === '{') depth += 1
    if (char === '}') {
      depth -= 1
      if (depth === 0) return source.slice(openBraceIndex + 1, index)
    }
  }
  throw new Error(`CSS block not closed for ${selectorText}`)
}

const newspaperBlock = cssBlockFrom(
  styleSource,
  ':root,\n:root[data-theme="newspaper"],\n:root.theme-newspaper {',
)
const cloudflareBlock = cssBlockFrom(
  styleSource,
  ':root[data-theme="cloudflare"],\n:root.theme-cloudflare {',
)

// Every --atelier-* / font token declared by the Newspaper theme must also be
// declared by the Cloudflare theme, so the new theme fully re-skins the app.
const declaredTokens = (block: string) =>
  Array.from(block.matchAll(/^\s*(--[a-z0-9-]+)\s*:/gim)).map((match) => match[1])

describe('Cloudflare appearance theme', () => {
  it('registers Cloudflare as a selectable theme option without removing Newspaper', () => {
    expect(appearanceThemeSource).toContain("export type AppearanceThemeId = 'newspaper' | 'cloudflare'")
    expect(appearanceThemeSource).toContain("{ id: 'newspaper', label: 'Newspaper' }")
    expect(appearanceThemeSource).toContain("{ id: 'cloudflare', label: 'Cloudflare' }")
    expect(appearanceThemeSource).toContain(
      "document.documentElement.classList.toggle('theme-cloudflare', theme === 'cloudflare')",
    )
  })

  it('defines a Cloudflare theme token block covering every Newspaper token', () => {
    expect(styleSource).toContain('Cloudflare appearance theme')
    expect(styleSource).toContain(':root[data-theme="cloudflare"]')
    expect(styleSource).toContain(':root.theme-cloudflare')
    expect(cloudflareBlock).toContain('--app-theme-name: "Cloudflare";')

    const newspaperTokens = declaredTokens(newspaperBlock)
    const cloudflareTokens = new Set(declaredTokens(cloudflareBlock))
    const missing = newspaperTokens.filter((token) => !cloudflareTokens.has(token))
    expect(missing, `Cloudflare theme is missing tokens: ${missing.join(', ')}`).toEqual([])
  })

  it('uses the Cloudflare brand palette as the accent axis on a white canvas', () => {
    expect(cloudflareBlock).toContain('--atelier-paper: #ffffff;')
    expect(cloudflareBlock).toContain(`--atelier-blue: ${cfOrange};`)
    expect(cloudflareBlock).toContain(`--atelier-butter: ${cfGold};`)
    expect(cloudflareBlock).toContain('--atelier-ink: #36393a;')
    // Cloudflare's product UI is sans-serif, not the Newspaper serif stack.
    expect(cloudflareBlock).toContain('--atelier-font-sans: var(--sans);')
    expect(cloudflareBlock).toMatch(/--sans:\s*"Inter"/)
    // No Klein-blue leakage in the Cloudflare token block.
    expect(cloudflareBlock.toLowerCase()).not.toContain('#002fa7')
    expect(cloudflareBlock).not.toContain('0, 47, 167')
  })

  it('re-tints the hardcoded literals that bypass the token axis', () => {
    // Body background gradient + codex admin accents must follow the brand.
    expect(styleSource).toContain('rgba(246, 130, 31, 0.06)')
    expect(codexThemeSource).toContain(':root.theme-cloudflare .codex-admin')
    expect(codexThemeSource).toContain(`--codex-accent: ${cfOrange};`)
    expect(codexThemeSource).toContain(`--codex-violet: ${cfOrange};`)
  })

  it('defines slab tokens so dark Newspaper control surfaces become light under Cloudflare', () => {
    // Base (Newspaper) keeps the dark ink slab; Cloudflare flips slabs to light.
    expect(newspaperBlock).toContain('--atelier-slab-surface: var(--atelier-ink);')
    expect(newspaperBlock).toContain('--atelier-slab-text: var(--atelier-paper);')
    expect(cloudflareBlock).toContain('--atelier-slab-surface: var(--atelier-paper-2);')
    expect(cloudflareBlock).toContain('--atelier-slab-field: var(--atelier-paper);')
    expect(cloudflareBlock).toContain('--atelier-slab-text: var(--atelier-ink);')
    // The master filter-shell slab rule must reference the token, not hardcoded ink.
    expect(styleSource).toContain('background: var(--atelier-slab-surface) !important;')
    // Cloudflare hover must be a neutral gray, not an orange tint.
    expect(cloudflareBlock).toContain('--atelier-ui-hover-surface: #eef0f2;')
    expect(cloudflareBlock).not.toContain('color-mix(in srgb, var(--atelier-blue) 8%, var(--atelier-paper-2))')
    // Cloudflare must repaint dropdown/date-picker portals + ops toolbar away from ink.
    expect(styleSource).toContain('Cloudflare theme — complete de-slab pass')
    expect(styleSource).toContain(':root.theme-cloudflare .select-dropdown-portal.ops-toolbar-select-menu')
    expect(styleSource).toContain(':root.theme-cloudflare .ops-diagnosis-popover')
  })

  it('does not move layout — the Cloudflare theme is colour/typography only', () => {
    for (const banned of [
      'grid-template-columns',
      'display: grid',
      'display: flex',
      'position:',
      'width:',
      'height:',
      'padding:',
      'margin:',
    ]) {
      expect(cloudflareBlock, `Cloudflare token block must not contain ${banned}`).not.toContain(banned)
    }
  })
})
