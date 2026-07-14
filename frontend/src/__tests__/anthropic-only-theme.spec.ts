import { existsSync, readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import { describe, expect, it } from 'vitest'

const frontendRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../..')
const readFile = (file: string) => readFileSync(resolve(frontendRoot, file), 'utf8')

const appearanceThemeSource = readFile('src/composables/useAppearanceTheme.ts')
const styleSource = readFile('src/style.css')
const codexThemeSource = readFile('src/styles/codex-theme.css')
const targetedRepairSource = readFile('src/styles/targeted-visual-repair.css')
const sidebarSource = readFile('src/components/layout/AppSidebar.vue')
const usageSource = readFile('src/views/user/UsageView.vue')
const editAccountSource = readFile('src/components/account/EditAccountModal.vue')
const batchImageGuideSource = readFile('src/views/user/BatchImageGuideView.vue')
const localFontsSource = readFile('src/assets/fonts/local-fonts.css')
const indexSource = readFile('index.html')
const tailwindSource = readFile('tailwind.config.js')

describe('Anthropic-only appearance contract', () => {
  it('registers and applies Anthropic as the only appearance theme', () => {
    expect(appearanceThemeSource).toContain("export type AppearanceThemeId = 'anthropic'")
    expect(appearanceThemeSource).toContain("{ id: 'anthropic', label: 'Anthropic' }")
    expect(appearanceThemeSource).toContain("const activeTheme = ref<AppearanceThemeId>('anthropic')")
    expect(appearanceThemeSource).toContain("document.documentElement.classList.add('theme-anthropic')")
    expect(appearanceThemeSource).not.toContain('cloudflare')
    expect(appearanceThemeSource).not.toContain('theme-cloudflare')
  })

  it('removes Cloudflare appearance CSS and restores native text selection', () => {
    expect(styleSource).not.toContain('Cloudflare appearance theme')
    expect(styleSource).not.toContain('theme-cloudflare')
    expect(styleSource).not.toContain('[data-theme="cloudflare"]')
    expect(styleSource).toContain('--selection-bg: color-mix(in srgb, var(--color-clay) 50%, transparent);')
    expect(styleSource).toContain('--selection-text: var(--color-slate-dark);')
    expect(styleSource).toContain('::selection {')
    expect(styleSource).toContain('background: var(--selection-bg);')
    expect(styleSource).toContain('color: var(--selection-text);')
    expect(batchImageGuideSource).not.toContain('selection:')
  })

  it('keeps the account update action and CPA page on the Anthropic contract', () => {
    expect(editAccountSource).toMatch(
      /data-testid="account-edit-account-button-submit"[\s\S]*?class="btn btn-primary account-edit-submit-button"/,
    )
    expect(targetedRepairSource).toContain('body .modal-overlay .account-edit-submit-button:not(:disabled)')
    expect(targetedRepairSource).toContain('--button-spacer-hover: 1px;')
    expect(targetedRepairSource).toContain('--button-border-width-hover: 2px;')
    expect(targetedRepairSource).toContain('body .modal-overlay .account-edit-submit-button:where(:hover, :focus-visible):not(:disabled)')
    expect(targetedRepairSource).toContain('box-shadow: 0 0 0 var(--button-spacer-hover, 1px) var(--button-bg), 0 0 0 var(--button-border-width-hover, 2px) var(--button-border-hover) !important;')
    expect(codexThemeSource).toContain('CPA management final Anthropic surface/focus contract')
    expect(codexThemeSource).toContain(':root.theme-anthropic #app .app-layout-content .codex-admin')
    expect(codexThemeSource).not.toContain('theme-cloudflare')
    expect(codexThemeSource.toLowerCase()).not.toContain('#f6821f')
  })

  it('uses the same sidebar type size for system setting child routes', () => {
    expect(sidebarSource).not.toContain(
      'sidebar-system-child-link mb-0.5 py-1.5 text-sm',
    )
  })

  it('does not draw an extra strip around the usage route switch', () => {
    expect(usageSource).toContain(
      'class="user-usage-table-tabs mb-0 bg-transparent"',
    )
    expect(usageSource).not.toContain(
      'class="user-usage-table-tabs mb-0 px-4 pt-3"',
    )
  })

  it('self-hosts the design-system Source Han Chinese fonts', () => {
    expect(localFontsSource).toContain("font-family: 'Source Han Sans SC'")
    expect(localFontsSource).toContain("font-family: 'Source Han Serif SC'")
    expect(localFontsSource).toContain("./source-han/SourceHanSansCN-VF.woff2")
    expect(localFontsSource).toContain("./source-han/SourceHanSerifCN-VF.woff2")
    expect(indexSource).toContain('rel="preload" href="/src/assets/fonts/source-han/SourceHanSansCN-VF.woff2"')
    expect(indexSource).toContain('rel="preload" href="/src/assets/fonts/source-han/SourceHanSerifCN-VF.woff2"')
    expect(tailwindSource).toMatch(/'Anthropic Sans',\s*'Source Han Sans SC'/)
    expect(tailwindSource).toMatch(/'Anthropic Serif',\s*'Source Han Serif SC'/)
    expect(existsSync(resolve(frontendRoot, 'src/assets/fonts/source-han/SourceHanSansCN-VF.woff2'))).toBe(true)
    expect(existsSync(resolve(frontendRoot, 'src/assets/fonts/source-han/SourceHanSerifCN-VF.woff2'))).toBe(true)
  })
})
