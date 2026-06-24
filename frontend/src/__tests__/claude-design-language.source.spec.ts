import { readdirSync, readFileSync, statSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import { describe, expect, it } from 'vitest'

const frontendRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../..')
const readSource = (file: string) => readFileSync(resolve(frontendRoot, file), 'utf8')

const styleSource = readSource('src/style.css')
const codexThemeSource = readSource('src/styles/codex-theme.css')
const tailwindConfigSource = readSource('tailwind.config.js')
const appearanceThemeSource = readSource('src/composables/useAppearanceTheme.ts')
const appStoreSource = readSource('src/stores/app.ts')
const adminSettingsSource = readSource('src/views/admin/SettingsView.vue')
const providerBrandIconSource = readSource('src/utils/providerBrandIcon.ts')
const zhLocaleSource = readSource('src/i18n/locales/zh.ts')
const enLocaleSource = readSource('src/i18n/locales/en.ts')
const dynamicManifestSource = readFileSync(resolve(frontendRoot, '../backend/internal/web/embed_on.go'), 'utf8')
const indexHtmlSource = readSource('index.html')
const manifest = JSON.parse(readSource('public/site.webmanifest'))

const runtimeSourceFiles = (directory: string): string[] => readdirSync(directory).flatMap((entry) => {
  const path = resolve(directory, entry)
  const stats = statSync(path)
  if (stats.isDirectory()) {
    if (entry === '__tests__') return []
    return runtimeSourceFiles(path)
  }
  if (!/\.(vue|ts|js|css|html|svg|json)$/.test(entry)) return []
  return [path]
})

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

const baseThemeBlock = cssBlockFrom(styleSource, '/* Base appearance tokens */\n:root {')
const anthropicBlock = cssBlockFrom(
  styleSource,
  ':root[data-theme="anthropic"],\n:root.theme-anthropic {',
)

describe('Claude design language source contract', () => {
  it('uses Anthropic as the no-config fallback across the browser entrypoints', () => {
    expect(appearanceThemeSource).toContain("const activeTheme = ref<AppearanceThemeId>('anthropic')")
    expect(appearanceThemeSource).toContain(": 'anthropic'")
    expect(appStoreSource).toContain("updateAppearanceThemeDefault(config.appearance_theme_default || 'anthropic')")
    expect(appStoreSource).toContain("appearance_theme_default: 'anthropic'")
    expect(adminSettingsSource).toContain('form.appearance_theme_default = isAppearanceThemeId(settings.appearance_theme_default)')
    expect(adminSettingsSource).not.toContain('? settings.appearance_theme_default\n      : "cloudflare"')
    expect(adminSettingsSource).toContain('? settings.appearance_theme_default\n      : "anthropic"')
    expect(indexHtmlSource).toContain('<meta name="theme-color" content="#c96442" />')
    expect(manifest.background_color).toBe('#f5f4ed')
    expect(manifest.theme_color).toBe('#c96442')
    expect(dynamicManifestSource).toContain('"background_color": "#f5f4ed"')
    expect(dynamicManifestSource).toContain('"theme_color":      "#c96442"')
  })

  it('matches the local Claude / Anthropic design guide tokens', () => {
    for (const block of [baseThemeBlock, anthropicBlock]) {
      expect(block).toContain('--atelier-paper: #f5f4ed;')
      expect(block).toContain('--atelier-paper-2: #faf9f5;')
      expect(block).toContain('--atelier-ink: #141413;')
      expect(block).toContain('--atelier-dark: #30302e;')
      expect(block).toContain('--atelier-text: #4d4c48;')
      expect(block).toContain('--atelier-muted: #5e5d59;')
      expect(block).toContain('--atelier-dust: #87867f;')
      expect(block).toContain('--atelier-sand: #e8e6dc;')
      expect(block).toContain('--atelier-line: #f0eee6;')
      expect(block).toContain('--atelier-ring: #d1cfc5;')
      expect(block).toContain('--atelier-blue: #c96442;')
      expect(block).toContain('--atelier-blue-dark: #a64f34;')
      expect(block).toContain('--atelier-butter: #d97757;')
      expect(block).toContain('--atelier-focus: #3898ec;')
      expect(block).toContain('--serif: Georgia, "Times New Roman"')
      expect(block).not.toContain('linear-gradient')
      expect(block).not.toContain('radial-gradient')
    }
  })

  it('maps legacy utility colors to terracotta instead of the old blue-purple AI axis', () => {
    expect(tailwindConfigSource).toContain("const terracotta = '#c96442'")
    expect(tailwindConfigSource).toContain('primary: terracottaScale')
    expect(tailwindConfigSource).toContain('blue: terracottaScale')
    expect(tailwindConfigSource).toContain('indigo: terracottaScale')
    expect(tailwindConfigSource).toContain('purple: terracottaScale')
    expect(tailwindConfigSource).toContain('violet: terracottaScale')
    expect(tailwindConfigSource).toContain("'gradient-primary': 'linear-gradient(135deg, #c96442 0%, #b85a3b 100%)'")
    expect(tailwindConfigSource).not.toContain('const kleinBlue')
    expect(tailwindConfigSource).not.toContain('#002FA7')
    expect(tailwindConfigSource).not.toContain('rgba(0, 47, 167')
  })

  it('keeps the CPA/Codex module on the shared Claude token axis', () => {
    expect(codexThemeSource).toContain('--codex-text: var(--atelier-ink);')
    expect(codexThemeSource).toContain('--codex-accent: var(--atelier-blue);')
    expect(codexThemeSource).toContain('--codex-accent-strong: var(--atelier-blue-dark);')
    expect(codexThemeSource).toContain('--codex-violet: var(--atelier-blue);')
    expect(codexThemeSource).toContain('box-shadow: 0 12px 42px rgba(201, 100, 66, 0.14);')
    expect(codexThemeSource).not.toContain('#002FA7')
    expect(codexThemeSource).not.toContain('rgba(0, 47, 167')
  })

  it('uses a single restrained hover language for maintained cards', () => {
    expect(styleSource).toContain('--creepee-home-card-hover-transform: translate3d(0, -2px, 0);')
    expect(styleSource).toContain('--creepee-home-card-hover-shadow: 0 12px 42px rgba(20, 20, 19, 0.055);')
    expect(styleSource).toContain('--creepee-home-card-hover-shadow: var(--atelier-material-shadow-hover);')
    expect(styleSource).not.toContain('translate3d(0, -4px, 0)')
    expect(styleSource).not.toContain('12px 0 28px')
  })

  it('keeps the authenticated admin shell on the Claude editorial pass', () => {
    expect(styleSource).toContain('Anthropic authenticated admin pass')
    expect(styleSource).toContain(':root.theme-anthropic #app .app-layout-content .app-route-page')
    expect(styleSource).toContain(':where(.admin-dashboard-atelier, .admin-usage-atelier, .table-page-layout, .settings-tabs-shell)')
    expect(styleSource).toContain(':where(.card, .paper-card, .paper-surface, .stat-card, .summary-tile, .usage-stat-card, .admin-material-surface, .table-wrapper, .table-scroll-container, .dashboard-filter-card, .usage-time-filter-card, .usage-record-filter-wrap)')
    expect(styleSource).toContain(':where(.table-wrapper, .table-scroll-container) :where(table)')
    expect(styleSource).toContain(':where(.settings-tabs-shell, .settings-tabs, .theme-default-option)')
    expect(styleSource).toContain('.driver-popover.theme-tour-popover')
    expect(styleSource).toContain('box-shadow: var(--claude-admin-ring), 0 12px 42px rgba(20, 20, 19, 0.045) !important;')
  })

  it('keeps runtime sources free of the retired Klein blue brand axis', () => {
    const sources = [
      ...runtimeSourceFiles(resolve(frontendRoot, 'src')),
      resolve(frontendRoot, 'index.html'),
      resolve(frontendRoot, 'public/site.webmanifest'),
      resolve(frontendRoot, '../backend/internal/web/embed_on.go'),
    ]

    const offenders = sources
      .map((file) => [file, readFileSync(file, 'utf8')] as const)
      .filter(([, source]) => (
        source.includes('#002FA7')
        || source.includes('#002fa7')
        || source.includes('rgba(0, 47, 167')
        || source.includes('rgb(0, 47, 167')
        || source.includes('Klein blue')
        || source.includes('Klein-blue')
        || source.includes('kleinBlue')
        || source.includes('#f3f6ff')
      ))
      .map(([file]) => file.replace(`${frontendRoot}/`, ''))

    expect(offenders).toEqual([])
    expect(providerBrandIconSource).toContain("color: '#C96442'")
    expect(providerBrandIconSource).toContain("color: '#4285F4'")
    expect(zhLocaleSource).toContain('background: #faf9f5; border-left: 3px solid #c96442')
    expect(enLocaleSource).toContain('background: #faf9f5; border-left: 3px solid #c96442')
  })
})
