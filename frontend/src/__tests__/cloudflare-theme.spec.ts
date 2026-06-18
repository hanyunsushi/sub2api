import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import { describe, expect, it } from 'vitest'

const frontendRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../..')
const readFile = (file: string) => readFileSync(resolve(frontendRoot, file), 'utf8')

const styleSource = readFile('src/style.css')
const codexThemeSource = readFile('src/styles/codex-theme.css')
const appearanceThemeSource = readFile('src/composables/useAppearanceTheme.ts')
const themeSwitcherSource = readFile('src/components/common/ThemeSwitcher.vue')
const themeLogoSource = readFile('src/components/common/ThemeLogo.vue')
const settingsViewSource = readFile('src/views/admin/SettingsView.vue')
const appHeaderSource = readFile('src/components/layout/AppHeader.vue')
const monitorCapacitySource = readFile('src/components/user/monitor/MonitorCapacityOverview.vue')
const adminSubscriptionsSource = readFile('src/views/admin/SubscriptionsView.vue')
const availableChannelsSource = readFile('src/views/user/AvailableChannelsView.vue')

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

const cssRuleFrom = (source: string, markerText: string) => {
  const markerIndex = source.indexOf(markerText)
  expect(markerIndex, `CSS marker not found: ${markerText}`).toBeGreaterThan(-1)
  const nextRuleIndex = source.indexOf('\n\n', markerIndex + markerText.length)
  const ruleEnd = nextRuleIndex === -1 ? source.length : nextRuleIndex
  return source.slice(markerIndex, ruleEnd)
}

const baseThemeBlock = cssBlockFrom(
  styleSource,
  '/* Base appearance tokens */\n:root {',
)
const cloudflareBlock = cssBlockFrom(
  styleSource,
  ':root[data-theme="cloudflare"],\n:root.theme-cloudflare {',
)
const anthropicBlock = cssBlockFrom(
  styleSource,
  ':root[data-theme="anthropic"],\n:root.theme-anthropic {',
)

// Every --atelier-* / font token declared by the base theme must also be
// declared by the Cloudflare theme, so the new theme fully re-skins the app.
const declaredTokens = (block: string) =>
  Array.from(block.matchAll(/^\s*(--[a-z0-9-]+)\s*:/gim)).map((match) => match[1])

describe('Cloudflare appearance theme', () => {
  it('registers only Cloudflare and Anthropic as selectable global themes', () => {
    expect(appearanceThemeSource).toContain("export type AppearanceThemeId = 'cloudflare' | 'anthropic'")
    expect(appearanceThemeSource).not.toContain('newspaper')
    expect(appearanceThemeSource).not.toContain('theme-newspaper')
    expect(appearanceThemeSource).toContain("{ id: 'cloudflare', label: 'Cloudflare' }")
    expect(appearanceThemeSource).toContain("{ id: 'anthropic', label: 'Anthropic' }")
    expect(appearanceThemeSource).toContain(
      "document.documentElement.classList.toggle('theme-cloudflare', theme === 'cloudflare')",
    )
    expect(appearanceThemeSource).toContain(
      "document.documentElement.classList.toggle('theme-anthropic', theme === 'anthropic')",
    )
  })

  it('hydrates the default theme from public settings when the user has no local override', () => {
    expect(appearanceThemeSource).not.toContain('const STORAGE_KEY')
    expect(appearanceThemeSource).not.toContain('localStorage.getItem(STORAGE_KEY)')
    expect(appearanceThemeSource).not.toContain('localStorage.setItem(STORAGE_KEY')
    expect(appearanceThemeSource).toContain('getInjectedAppearanceThemeDefault')
    expect(appearanceThemeSource).toContain('window.__APP_CONFIG__?.appearance_theme_default')
    expect(appearanceThemeSource).toContain('updateAppearanceThemeDefault')
  })

  it('uses branded logomarks in the admin-only global theme switcher', () => {
    expect(themeSwitcherSource).toContain("import ThemeLogo from '@/components/common/ThemeLogo.vue'")
    expect(themeLogoSource).toContain('CloudflareLogoMark')
    expect(themeLogoSource).toContain('ClaudeLogoMark')
    expect(themeSwitcherSource).toContain('<ThemeLogo :theme-id="currentTheme"')
    expect(themeSwitcherSource).toContain('v-if="authStore.isAdmin"')
    expect(themeLogoSource).not.toContain('<CloudflareLogoMark class="h-5 w-5 flex-shrink-0" />')
    expect(themeLogoSource).toContain("viewBox: '0 0 209.51 94.74'")
    expect(themeLogoSource).toContain('M143.05 93.42')
    expect(themeLogoSource).toContain('M168.22 41.15')
    expect(themeLogoSource).toContain('#F48120')
    expect(themeLogoSource).toContain('#FAAD3F')
    expect(themeLogoSource).toContain("import ModelIcon from '@/components/common/ModelIcon.vue'")
    expect(themeLogoSource).toContain("model: 'claude'")
    expect(themeLogoSource).not.toContain('NewspaperLogoMark')
    expect(themeLogoSource).not.toContain('data-theme-logo="newspaper"')
    expect(themeLogoSource).not.toContain('M11.96 3.25')
    expect(themeSwitcherSource).not.toContain('<Icon name="book"')
    expect(themeSwitcherSource).not.toContain('applyGlobally')
    expect(themeSwitcherSource).not.toContain('所有人可见')
    expect(themeSwitcherSource).toContain('adminAPI.settings.updateAppearanceThemeDefault')
    expect(themeSwitcherSource).not.toContain('adminAPI.settings.updateSettings')
  })

  it('moves the public default theme setting into the admin general settings form', () => {
    expect(settingsViewSource).toContain('form.appearance_theme_default')
    expect(settingsViewSource).toContain('import ThemeLogo from "@/components/common/ThemeLogo.vue"')
    expect(settingsViewSource).toContain('import { appearanceThemeOptions, type AppearanceThemeId } from "@/composables/useAppearanceTheme"')
    expect(settingsViewSource).toContain("admin.settings.site.defaultTheme")
    expect(settingsViewSource).toContain("admin.settings.site.defaultThemeHint")
    expect(readFile('src/i18n/locales/zh.ts')).toContain('管理员选择后全站强制启用')
    expect(readFile('src/i18n/locales/en.ts')).toContain('Forced site-wide')
    expect(settingsViewSource).toContain('v-for="theme in appearanceThemeOptions"')
    expect(settingsViewSource).toContain('data-testid="settings-default-theme-option"')
    expect(settingsViewSource).toContain('<ThemeLogo :theme-id="theme.id"')
    expect(settingsViewSource).not.toContain('<option value="newspaper">Newspaper</option>')
    expect(settingsViewSource).not.toContain('<option value="cloudflare">Cloudflare</option>')
    expect(settingsViewSource).not.toContain('<option value="anthropic">Anthropic</option>')
    expect(settingsViewSource).toContain('appearance_theme_default: form.appearance_theme_default')
  })

  it('defines a Cloudflare theme token block covering every base appearance token', () => {
    expect(styleSource).toContain('Cloudflare appearance theme')
    expect(styleSource).toContain(':root[data-theme="cloudflare"]')
    expect(styleSource).toContain(':root.theme-cloudflare')
    expect(cloudflareBlock).toContain('--app-theme-name: "Cloudflare";')

    const baseTokens = declaredTokens(baseThemeBlock)
    const cloudflareTokens = new Set(declaredTokens(cloudflareBlock))
    const missing = baseTokens.filter((token) => !cloudflareTokens.has(token))
    expect(missing, `Cloudflare theme is missing tokens: ${missing.join(', ')}`).toEqual([])
  })

  it('defines an Anthropic theme token block covering every base appearance token', () => {
    expect(styleSource).toContain('Anthropic appearance theme')
    expect(styleSource).toContain(':root[data-theme="anthropic"]')
    expect(styleSource).toContain(':root.theme-anthropic')
    expect(anthropicBlock).toContain('--app-theme-name: "Anthropic";')

    const baseTokens = declaredTokens(baseThemeBlock)
    const anthropicTokens = new Set(declaredTokens(anthropicBlock))
    const missing = baseTokens.filter((token) => !anthropicTokens.has(token))
    expect(missing, `Anthropic theme is missing tokens: ${missing.join(', ')}`).toEqual([])
  })

  it('uses the Anthropic warm editorial palette from the Obsidian design guide', () => {
    expect(anthropicBlock).toContain('--atelier-paper: #f5f4ed;')
    expect(anthropicBlock).toContain('--atelier-paper-2: #faf9f5;')
    expect(anthropicBlock).toContain('--atelier-ink: #141413;')
    expect(anthropicBlock).toContain('--atelier-dark: #30302e;')
    expect(anthropicBlock).toContain('--atelier-muted: #5e5d59;')
    expect(anthropicBlock).toContain('--atelier-blue: #c96442;')
    expect(anthropicBlock).toContain('--atelier-butter: #d97757;')
    expect(anthropicBlock).toContain('--atelier-focus: #3898ec;')
    expect(anthropicBlock).toContain('--atelier-line: #f0eee6;')
    expect(anthropicBlock).toContain('--atelier-font-serif: var(--serif);')
    expect(anthropicBlock).toMatch(/--serif:\s*Georgia/)
    expect(anthropicBlock.toLowerCase()).not.toContain('#002fa7')
    expect(anthropicBlock).not.toContain('linear-gradient')
    expect(anthropicBlock).not.toContain('radial-gradient')
  })

  it('keeps ops toolbar dropdowns and health popovers readable on light themes', () => {
    expect(styleSource).toContain('Theme readability patch')
    expect(styleSource).toContain(':root.theme-cloudflare #app .app-layout-content .ops-dashboard-atelier .ops-monitor-toolbar-meta')
    expect(styleSource).toContain(':root.theme-anthropic #app .app-layout-content .ops-dashboard-atelier .ops-monitor-toolbar-meta')
    expect(styleSource).toContain(':root.theme-cloudflare #app .app-layout-content .ops-dashboard-atelier .ops-monitor-toolbar-controls .select-trigger')
    expect(styleSource).toContain(':root.theme-anthropic #app .app-layout-content .ops-dashboard-atelier .ops-monitor-toolbar-controls .select-trigger')
    expect(styleSource).toContain(':root.theme-cloudflare #app .app-layout-content .ops-dashboard-atelier .ops-monitor-toolbar-controls .select-trigger :where(.select-value, .select-icon, svg, path, span)')
    expect(styleSource).toContain(':root.theme-anthropic #app .app-layout-content .ops-dashboard-atelier .ops-monitor-toolbar-controls .select-trigger :where(.select-value, .select-icon, svg, path, span)')
    expect(styleSource).toContain(':root.theme-cloudflare .select-dropdown-portal.ops-toolbar-select-menu')
    expect(styleSource).toContain(':root.theme-anthropic .select-dropdown-portal.ops-toolbar-select-menu')
    expect(styleSource).toContain(':root.theme-cloudflare body.dashboard-filter-menu-open :where(.date-picker-dropdown-portal, .select-dropdown-portal)')
    expect(styleSource).toContain(':root.theme-anthropic body.dashboard-filter-menu-open :where(.date-picker-dropdown-portal, .select-dropdown-portal)')
    expect(styleSource).toContain(':root.theme-cloudflare body:has(.admin-dashboard-atelier) :where(.date-picker-dropdown-portal, .select-dropdown-portal)')
    expect(styleSource).toContain(':root.theme-anthropic body:has(.admin-dashboard-atelier) :where(.date-picker-dropdown-portal, .select-dropdown-portal)')
    expect(styleSource).toContain(':root.theme-cloudflare .ops-diagnosis-popover')
    expect(styleSource).toContain(':root.theme-anthropic .ops-diagnosis-popover')
    expect(styleSource).toContain('.ops-diagnosis-popover-panel')
    expect(styleSource).toContain(':root.theme-cloudflare .ops-diagnosis-popover-panel')
    expect(styleSource).toContain(':root.theme-anthropic .ops-diagnosis-popover-panel')
    expect(styleSource).toContain('.ops-diagnosis-popover-panel :where(h4, div, span, p, svg, path)')
    expect(styleSource).toContain('#app .app-layout-content .user-keys-atelier .keys-page-actions :where(.btn-secondary, .btn-primary):not(:disabled)')
    expect(styleSource).toContain('-webkit-text-fill-color: var(--atelier-ink) !important;')
  })

  it('uses terracotta for enabled switch rails across the app', () => {
    const toggleBlock = cssBlockFrom(styleSource, '#app .app-layout-content .toggle-switch.bg-primary-600')
    expect(toggleBlock).toContain('background: var(--atelier-butter) !important;')
    expect(toggleBlock).toContain('border-color: var(--atelier-butter-dark) !important;')
    expect(toggleBlock).not.toContain('var(--atelier-ink)')
  })

  it('uses live provider logos in the shared balance chip and capacity cards', () => {
    expect(appHeaderSource).toContain('ProviderBrandIcon')
    expect(appHeaderSource).toContain('data-testid="header-balance-provider-logo"')
    expect(appHeaderSource).toContain('data-testid="header-balance-dropdown-provider-logo"')
    expect(appHeaderSource).toContain(':logo-url="currentExternalSubscriptionInChip.logo_url"')
    expect(appHeaderSource).toContain(':data-logo-url="currentExternalSubscriptionInChip.logo_url || \'\'"')
    expect(appHeaderSource).toContain(':logo-url="subscription.logo_url"')
    expect(appHeaderSource).toContain(':data-logo-url="subscription.logo_url || \'\'"')
    expect(monitorCapacitySource).toContain(':logo-url="logo.logoUrl"')
    expect(monitorCapacitySource).toContain('buildPreviewLogos(matchedStatuses, monitors)')
    expect(monitorCapacitySource).toContain('logoVisualKey(logo)')
    expect(monitorCapacitySource).toContain('return `url:${logoUrl}`')
  })

  it('keeps shared capacity status counts attached to their labels', () => {
    expect(monitorCapacitySource).toContain('monitor-capacity-status-grid mt-3 grid grid-cols-2 gap-2')
    expect(monitorCapacitySource).not.toContain('mt-3 grid grid-cols-4 gap-2')
    const statusStatBlock = cssBlockFrom(monitorCapacitySource, '.monitor-capacity-status-stat')
    expect(statusStatBlock).toContain('grid-template-columns: 0.5rem minmax(0, 1fr) 1.5rem;')
    expect(statusStatBlock).toContain('white-space: nowrap;')
    expect(monitorCapacitySource).toContain('.monitor-capacity-status-stat strong')
    const statusCountBlock = cssBlockFrom(monitorCapacitySource, '.monitor-capacity-status-stat strong')
    expect(statusCountBlock).toContain('justify-self: center;')
    expect(statusCountBlock).toContain('text-align: center;')
    expect(statusCountBlock).not.toContain('justify-self: end;')
    expect(statusCountBlock).not.toContain('text-align: right;')
  })

  it('applies Anthropic beyond tokens with terracotta actions, editorial type, and readable filters', () => {
    expect(styleSource).toContain('Anthropic theme — editorial component pass')
    expect(styleSource).toContain(':root.theme-anthropic #app .app-layout-content :where(.page-title, .modal-title, .dialog-header h2')
    expect(styleSource).toContain('font-family: var(--atelier-font-serif) !important;')
    expect(styleSource).toContain(':root.theme-anthropic :where(.btn-primary, .btn-success, .date-picker-apply, .codex-button--primary)')
    expect(styleSource).not.toContain(':root.theme-anthropic :where(.btn-primary, .btn-success, .btn-warning, .date-picker-apply, .codex-button--primary)')
    expect(styleSource).toContain(':root.theme-anthropic :where(.btn-warning)')
    expect(styleSource).toContain('background: #f59e0b !important;')
    expect(styleSource).toContain('background: var(--atelier-blue) !important;')
    expect(styleSource).toContain(':root.theme-anthropic #app .app-layout-content .table-page-layout > .layout-section-fixed.table-page-filter-section')
    expect(styleSource).toContain(':root.theme-anthropic #app .app-layout-content .table-page-layout > .layout-section-fixed.table-page-filter-section')
    expect(styleSource).toContain(':where(.select-trigger, .date-picker-trigger, input[type="date"], input[type="search"], input[type="text"].input, .input)')
    expect(styleSource).toContain('-webkit-text-fill-color: var(--atelier-ink) !important;')
    expect(styleSource).toContain(':root.theme-anthropic body:has(.table-page-layout) :where(.select-dropdown-portal, .date-picker-dropdown-portal)')
    expect(styleSource).toContain(':root.theme-anthropic .select-dropdown-portal')
    expect(styleSource).toContain('--select-option-stable-text: var(--atelier-ink);')
    expect(styleSource).toContain('--select-option-selected-surface: var(--atelier-sand);')
  })

  it('keeps Anthropic top-right primary actions terracotta without repainting plain filter buttons', () => {
    const legacySlabIndex = styleSource.indexOf(
      '#app .app-layout-content .table-page-layout > .layout-section-fixed.table-page-filter-section\n' +
        '  :where(.table-filter-actions, .users-filter-actions, .usage-filter-actions)\n' +
        '  :where(.btn-secondary, .btn-ghost, .btn-primary, .btn-danger, button):not(:disabled)',
    )
    const anthropicPrimaryIndex = styleSource.indexOf(
      ':root.theme-anthropic #app .app-layout-content .table-page-layout > .layout-section-fixed.table-page-filter-section\n' +
        '  :where(.table-filter-actions, .users-filter-actions, .usage-filter-actions)\n' +
        '  :where(.btn-primary, .btn-success, .users-filter-create):not(:disabled)',
    )

    expect(legacySlabIndex).toBeGreaterThan(-1)
    expect(anthropicPrimaryIndex).toBeGreaterThan(legacySlabIndex)

    const primaryFilterRule = cssBlockFrom(
      styleSource,
      ':root.theme-anthropic #app .app-layout-content .table-page-layout > .layout-section-fixed.table-page-filter-section\n' +
        '  :where(.table-filter-actions, .users-filter-actions, .usage-filter-actions)\n' +
        '  :where(.btn-primary, .btn-success, .users-filter-create):not(:disabled)',
    )
    expect(primaryFilterRule).toContain('background: var(--atelier-blue) !important;')
    expect(primaryFilterRule).toContain('color: var(--atelier-paper-2) !important;')
    expect(primaryFilterRule).toContain('-webkit-text-fill-color: var(--atelier-paper-2) !important;')
    expect(primaryFilterRule).not.toContain(':where(button)')
    expect(primaryFilterRule).not.toContain('var(--atelier-slab-field)')
  })

  it('keeps the rotating balance provider left-aligned while centering the amount without a painted text band', () => {
    const headerBalanceBlock = cssBlockFrom(appHeaderSource, '.header-balance-chip-fixed')
    expect(headerBalanceBlock).toContain('display: grid !important;')
    expect(headerBalanceBlock).toContain('grid-template-columns: minmax(0, auto) minmax(0, 1fr);')
    expect(headerBalanceBlock).toContain('width: 14.4rem;')
    expect(headerBalanceBlock).toContain('min-width: 14.4rem;')
    expect(headerBalanceBlock).toContain('max-width: 14.4rem;')
    expect(headerBalanceBlock).toContain('justify-content: stretch;')
    expect(headerBalanceBlock).not.toContain('justify-content: flex-end;')
    expect(appHeaderSource).not.toContain('.header-balance-chip-fixed .header-balance-provider-logo {\n  margin-left: auto;')
    expect(appHeaderSource).toContain('flex: 0 0 auto;')
    const identityBlock = cssBlockFrom(appHeaderSource, '.header-balance-chip-identity')
    expect(identityBlock).toContain('justify-self: start;')
    expect(identityBlock).toContain('background: transparent;')
    expect(identityBlock).toContain('box-shadow: none;')
    expect(appHeaderSource).toContain('header-balance-provider-name')
    expect(appHeaderSource).toContain('header-balance-chip-amount')
    const amountBlock = cssBlockFrom(appHeaderSource, '.header-balance-chip-amount')
    expect(amountBlock).toContain('grid-column: 2;')
    expect(amountBlock).toContain('justify-self: stretch;')
    expect(amountBlock).toContain('text-align: center;')
    expect(amountBlock).toContain('background: transparent;')
    expect(amountBlock).not.toContain('margin-left: auto;')
    expect(amountBlock).not.toContain('text-align: right;')
    const systemAmountBlock = cssBlockFrom(appHeaderSource, '.header-balance-system-amount')
    expect(systemAmountBlock).toContain('grid-column: 2;')
    expect(systemAmountBlock).toContain('justify-self: stretch;')
    expect(systemAmountBlock).toContain('text-align: center;')
    expect(systemAmountBlock).toContain('background: transparent;')
    expect(systemAmountBlock).not.toContain('text-align: right;')
    expect(styleSource).toContain('.header-balance-chip-identity')
    expect(styleSource).toContain('.header-balance-chip-amount')
    expect(styleSource).toContain('.header-balance-system-amount')
    const globalPaintResetBlock = cssBlockFrom(styleSource, '/* Header balance chip paint reset.')
    expect(globalPaintResetBlock).toContain('background: transparent !important;')
    expect(globalPaintResetBlock).toContain('box-shadow: none !important;')
  })

  it('keeps channel status and dashboard top-right controls readable under Anthropic', () => {
    expect(styleSource).toContain(':root.theme-anthropic #app .app-layout-content .auto-refresh-button')
    expect(styleSource).toContain(':root.theme-anthropic #app .app-layout-content :where(.dashboard-filter-refresh):not(:disabled)')
    expect(styleSource).toContain('background: var(--atelier-blue) !important;')
    expect(styleSource).toContain('color: var(--atelier-paper-2) !important;')
    expect(styleSource).toContain('.auto-refresh-button :where(svg, path, span)')
    expect(styleSource).toContain('color: var(--atelier-ink) !important;')
  })

  it('marks generic table filter panes so Anthropic keeps a single paper header and terracotta actions', () => {
    expect(adminSubscriptionsSource).toContain('table-filter-left')
    expect(adminSubscriptionsSource).toContain('table-filter-actions')
    expect(availableChannelsSource).toContain('table-filter-left')
    expect(availableChannelsSource).toContain('table-filter-actions')
    expect(styleSource).toContain('Anthropic theme — final table filter action pass')
    expect(styleSource).toContain(':where(.btn-primary, .btn-success, .users-filter-create, .dashboard-filter-refresh):not(:disabled)')
  })

  it('keeps top-right action buttons terracotta across all console themes', () => {
    expect(styleSource).toContain('Console terracotta action pass')
    expect(styleSource).toContain('--atelier-terracotta-action: #c96442;')
    expect(styleSource).toContain('--atelier-terracotta-action-hover: #a64f34;')
    expect(styleSource).toContain('.table-filter-actions')
    expect(styleSource).toContain('.users-filter-create')
    expect(styleSource).toContain('.dashboard-filter-refresh')
    expect(styleSource).toContain('.keys-filter-actions')
    expect(styleSource).toContain('.user-usage-atelier .usage-filter-actions')
    expect(styleSource).toContain('.admin-usage-atelier .usage-record-filter-wrap .usage-filter-actions')
    expect(styleSource).toContain('.global-pricing-filter-actions')
    expect(styleSource).toContain('.table-page-layout.accounts-table-page > .layout-section-fixed.table-page-filter-section .table-filter-actions')
    const actionBlock = cssBlockFrom(styleSource, '/* Console terracotta action pass. */')
    const actionRule = cssRuleFrom(styleSource, '/* Console terracotta action pass. */')
    expect(actionBlock).toContain('background: var(--atelier-terracotta-action) !important;')
    expect(actionBlock).toContain('color: var(--atelier-paper-2) !important;')
    expect(actionBlock).toContain('-webkit-text-fill-color: var(--atelier-paper-2) !important;')
    expect(actionRule).toContain(':where(.btn-primary, .btn-success, .users-filter-create, .dashboard-filter-refresh):not(:disabled)')
    expect(actionBlock).not.toContain(':where(.btn, button, [role="button"])')
    expect(actionRule).not.toContain(':where(.btn, button, [role="button"])')
    const readableFilterButtonBlock = cssBlockFrom(styleSource, '/* Console readable light action fallback. */')
    const readableFilterButtonRule = cssRuleFrom(styleSource, '/* Console readable light action fallback. */')
    expect(readableFilterButtonBlock).toContain('color: var(--atelier-ink) !important;')
    expect(readableFilterButtonBlock).toContain('-webkit-text-fill-color: var(--atelier-ink) !important;')
    expect(readableFilterButtonBlock).not.toContain('background: var(--atelier-terracotta-action)')
    expect(readableFilterButtonRule).toContain(':where(.btn, button, [role="button"])')
    expect(readableFilterButtonRule).toContain(':not(.btn-primary):not(.btn-success):not(.users-filter-create):not(.dashboard-filter-refresh)')
    expect(actionBlock).not.toContain('var(--atelier-slab-field)')
  })

  it('keeps small user key table icons readable on paper buttons', () => {
    expect(styleSource).toContain('#app .app-layout-content .user-keys-atelier')
    expect(styleSource).toContain(':where(button.rounded, button.rounded-lg)')
    expect(styleSource).toContain(':where(svg, path)')
    const keyIconBlock = cssBlockFrom(
      styleSource,
      '#app .app-layout-content .user-keys-atelier\n' +
        '  :where(button.rounded, button.rounded-lg)\n' +
        '  :where(svg, path)',
    )
    expect(keyIconBlock).toContain('color: inherit !important;')
    expect(keyIconBlock).toContain('stroke: currentColor !important;')
  })

  it('uses the Cloudflare brand palette as the accent axis on a white canvas', () => {
    expect(cloudflareBlock).toContain('--atelier-paper: #ffffff;')
    expect(cloudflareBlock).toContain(`--atelier-blue: ${cfOrange};`)
    expect(cloudflareBlock).toContain(`--atelier-butter: ${cfGold};`)
    expect(cloudflareBlock).toContain('--atelier-ink: #36393a;')
    // Cloudflare's product UI is sans-serif, not the base serif stack.
    expect(cloudflareBlock).toContain('--atelier-font-sans: var(--sans);')
    expect(cloudflareBlock).toMatch(/--sans:\s*"Inter"/)
    // No Klein-blue leakage in the Cloudflare token block.
    expect(cloudflareBlock.toLowerCase()).not.toContain('#002fa7')
    expect(cloudflareBlock).not.toContain('0, 47, 167')
  })

  it('uses neutral Cloudflare-gray scrollbar tokens globally', () => {
    expect(cloudflareBlock).toContain('--atelier-scrollbar: #9b9b9b;')
    expect(cloudflareBlock).toContain('--atelier-scrollbar-hover: #777777;')
    expect(cloudflareBlock).toContain('--atelier-scrollbar-track: #f1f1f1;')
  })

  it('re-tints the hardcoded literals that bypass the token axis', () => {
    // Body background gradient + codex admin accents must follow the brand.
    expect(styleSource).toContain('rgba(246, 130, 31, 0.06)')
    // Text selection re-tinted to Cloudflare orange (no Klein-blue leak).
    expect(styleSource).toContain(':root.theme-cloudflare ::selection')
    expect(styleSource).toContain('background: rgba(246, 130, 31, 0.18);')
    expect(codexThemeSource).toContain(':root.theme-cloudflare .codex-admin')
    expect(codexThemeSource).toContain(`--codex-accent: ${cfOrange};`)
    expect(codexThemeSource).toContain(`--codex-violet: ${cfOrange};`)
  })

  it('defines slab tokens so dark base control surfaces become light under Cloudflare', () => {
    // The base token layer keeps the dark ink slab; Cloudflare flips slabs to light.
    expect(baseThemeBlock).toContain('--atelier-slab-surface: var(--atelier-ink);')
    expect(baseThemeBlock).toContain('--atelier-slab-text: var(--atelier-paper);')
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
