import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const componentSource = readFileSync(resolve(__dirname, '../CodexAccounts.vue'), 'utf8')
const codexThemeSource = readFileSync(resolve(__dirname, '../../../styles/codex-theme.css'), 'utf8')
const styleSource = readFileSync(resolve(__dirname, '../../../style.css'), 'utf8')
const blockedBackdropFilter = ['backdrop', 'filter'].join('-')
const blockedWebkitBackdropFilter = ['-webkit', blockedBackdropFilter].join('-')

const getCssBlock = (selector: string) => {
  const start = codexThemeSource.indexOf(`${selector} {`)
  if (start === -1) return ''
  const end = codexThemeSource.indexOf('\n}', start)
  return end === -1 ? codexThemeSource.slice(start) : codexThemeSource.slice(start, end + 2)
}

const getLastCssBlock = (selector: string) => {
  const start = codexThemeSource.lastIndexOf(`${selector} {`)
  if (start === -1) return ''
  const end = codexThemeSource.indexOf('\n}', start)
  return end === -1 ? codexThemeSource.slice(start) : codexThemeSource.slice(start, end + 2)
}

describe('CodexAccounts source contracts', () => {
  it('removes the redundant topbar quota refresh while keeping the list action', () => {
    const topbarStart = componentSource.indexOf('<header class="codex-topbar">')
    const topbarEnd = componentSource.indexOf('</header>', topbarStart)
    const topbarSource = componentSource.slice(topbarStart, topbarEnd)

    expect(topbarSource).toContain('admin.codex.accounts.title')
    expect(topbarSource).toContain('admin.codex.accounts.description')
    expect(topbarSource).not.toContain('data-testid="codex-accounts-refresh-quota"')
    expect(topbarSource).not.toContain('refreshQuotaStatus')
    expect(componentSource).toContain('data-testid="codex-accounts-refresh-quota-list"')
    expect(componentSource).toContain('@click="refreshAccounts"')
    expect(componentSource).toContain('async function refreshAccounts()')
  })

  it('teleports the delete confirmation dialog to body so fixed centering uses the viewport', () => {
    expect(componentSource).toContain('<Teleport to="body">')
    expect(componentSource).toContain('class="codex-modal-backdrop"')
  })

  it('renders multi-select controls for batch auth account deletion', () => {
    expect(componentSource).toContain('selectedAuthNames')
    expect(componentSource).toContain('codex-selection-checkbox')
    expect(componentSource).toContain('toggleAccountSelection')
    expect(componentSource).toContain('requestDeleteSelectedAccounts')
    expect(componentSource).toContain('deleteSelectedAuthFiles')
  })

  it('uses the shared material card tokens on maintained CPA panels and account cards', () => {
    expect(codexThemeSource).toContain('.codex-panel')
    expect(codexThemeSource).toContain('.codex-account-card')
    expect(codexThemeSource).toContain('--material-card-surface')
    expect(codexThemeSource).toContain('--material-card-surface: var(--atelier-paper-2);')
    expect(codexThemeSource).toContain('--codex-bg: var(--atelier-paper);')
    expect(codexThemeSource).toContain('--codex-surface-soft: color-mix(in srgb, var(--atelier-dust) 16%, var(--atelier-paper));')
    expect(codexThemeSource).toContain('--codex-accent-soft: color-mix(in srgb, var(--atelier-ink) 6%, var(--atelier-paper));')
    expect(codexThemeSource).toContain('var(--material-card-surface);')
    expect(codexThemeSource).not.toContain('#eef3ff')
    expect(codexThemeSource).not.toContain('#edf2fb')
    expect(codexThemeSource).not.toContain('#dce6ee')
    expect(codexThemeSource).not.toContain('#e8eef8')
    expect(codexThemeSource).not.toContain('#dbe5fa')
    expect(codexThemeSource).not.toContain('background-size: 28px 28px, 28px 28px, auto;')
    expect(codexThemeSource).toContain('background: var(--codex-surface-strong);')
    expect(codexThemeSource).toContain('background: var(--codex-surface-soft);')
    expect(codexThemeSource).not.toContain('rgba(255, 250, 240, 0.58)')
    expect(codexThemeSource).not.toContain('rgba(243, 239, 229, 0.48)')
    expect(codexThemeSource).toContain('background: var(--codex-accent-soft);')
    expect(codexThemeSource).toContain('border-radius: 6px;')
    expect(codexThemeSource).not.toContain(blockedBackdropFilter)
    expect(codexThemeSource).not.toContain(blockedWebkitBackdropFilter)
    expect(codexThemeSource).not.toContain('inset 0 -1px')
    expect(codexThemeSource).toContain('.dark .codex-panel')
    expect(codexThemeSource).toContain('.dark .codex-account-card')
  })

  it('keeps the final CPA management surfaces and form focus on the Anthropic contract', () => {
    const finalTokenBlock = getLastCssBlock(':root:not(.theme-cloudflare):not([data-theme="cloudflare"]) #app .app-layout-content .codex-admin')
    const finalSurfaceBlock = getLastCssBlock(':root:not(.theme-cloudflare):not([data-theme="cloudflare"]) #app .app-layout-content .codex-admin :where(.codex-shell, .codex-topbar, .codex-main, .codex-side, .codex-panel, .codex-toolbar)')
    const finalToolbarBlock = getLastCssBlock(':root:not(.theme-cloudflare):not([data-theme="cloudflare"]) #app .app-layout-content .codex-admin .codex-toolbar')
    const finalInputBlock = getLastCssBlock(':root:not(.theme-cloudflare):not([data-theme="cloudflare"]) #app .app-layout-content .codex-admin :where(.codex-input, .codex-select, .codex-textarea)')
    const finalMouseFocusBlock = getLastCssBlock(':root:not(.theme-cloudflare):not([data-theme="cloudflare"]) #app .app-layout-content .codex-admin :where(.codex-input, .codex-select, .codex-textarea):where(:focus):not(:focus-visible)')
    const finalKeyboardFocusBlock = getLastCssBlock(':root:not(.theme-cloudflare):not([data-theme="cloudflare"]) #app .app-layout-content .codex-admin :where(.codex-input, .codex-select, .codex-textarea):where(:focus-visible)')

    expect(finalTokenBlock).toContain('--codex-surface-strong: var(--anthropic-page, var(--atelier-paper));')
    expect(finalTokenBlock).toContain('--material-card-surface: var(--anthropic-page, var(--atelier-paper));')
    expect(finalTokenBlock).toContain('--material-card-edge: var(--anthropic-cookbook-border')
    expect(finalSurfaceBlock).toContain('background: var(--anthropic-page, var(--atelier-paper)) !important;')
    expect(finalSurfaceBlock).toContain('border-color: var(--anthropic-cookbook-border')
    expect(finalToolbarBlock).toContain('border: 0 !important;')
    expect(finalInputBlock).toContain('--tw-ring-color: transparent !important;')
    expect(finalInputBlock).toContain('background: var(--anthropic-page, var(--atelier-paper)) !important;')
    expect(finalInputBlock).toContain('box-shadow: none !important;')
    expect(finalMouseFocusBlock).toContain('outline: 0 !important;')
    expect(finalMouseFocusBlock).toContain('box-shadow: none !important;')
    expect(finalKeyboardFocusBlock).toContain('outline: 2px solid var(--anthropic-focus, var(--atelier-focus)) !important;')
    expect(finalKeyboardFocusBlock).toContain('outline-offset: 3px !important;')
    expect(finalKeyboardFocusBlock).toContain('box-shadow: none !important;')
    expect(finalKeyboardFocusBlock).not.toContain('border-color: var(--atelier-focus)')
  })

  it('keeps CPA account cards on a local warm-paper hover treatment', () => {
    const accountCardHoverBlock = getCssBlock('.codex-account-card:hover')
    const accountCardBlock = getCssBlock('.codex-account-card')
    const selectedBlock = getCssBlock('.codex-account-card.is-selected')

    expect(styleSource).toContain('--anthropic-card-hover-surface: var(--atelier-surface-muted, #e8e6dc);')
    expect(accountCardBlock).toContain('--anthropic-card-hover-surface: var(--atelier-surface-muted);')
    expect(accountCardBlock).toContain('--anthropic-card-stable-border: var(--material-card-edge);')
    expect(accountCardHoverBlock).toContain('background: var(--anthropic-card-hover-surface);')
    expect(accountCardHoverBlock).toContain('box-shadow: none;')
    expect(accountCardHoverBlock).not.toContain('transform:')
    expect(accountCardHoverBlock).not.toContain('translateY(-2px)')
    expect(accountCardHoverBlock).not.toContain('rgba(20,20,19,.035)')
    expect(accountCardHoverBlock).not.toContain('rgba(20, 20, 19, 0.035)')
    expect(accountCardBlock).not.toContain('color-mix(in srgb, var(--home-card-accent)')
    expect(accountCardHoverBlock).not.toContain('var(--atelier-ui-hover-surface)')
    expect(accountCardHoverBlock).not.toContain('var(--atelier-butter')
    expect(accountCardHoverBlock).not.toMatch(/(?:amber|yellow)/i)
    expect(accountCardHoverBlock).not.toMatch(/(?:^|\n)\s*(?:color|-webkit-text-fill-color)\s*:/)
    expect(accountCardHoverBlock).not.toContain('var(--atelier-paper)')
    expect(accountCardHoverBlock).not.toContain('var(--codex-accent-soft)')
    expect(accountCardHoverBlock).not.toContain('rgba(0, 47, 167, 0.5)')
    expect(selectedBlock).not.toContain('transform:')
    expect(selectedBlock).not.toContain('background: var(--atelier-paper)')
    expect(selectedBlock).not.toContain('box-shadow: 0 18px')
  })

  it('does not add a fixed module scrollbar to the CPA account management shell', () => {
    const shellBlock = getCssBlock('.codex-shell')

    expect(shellBlock).not.toContain('overflow: hidden;')
    expect(shellBlock).not.toContain('min-height: calc(100dvh - 128px);')
  })

  it('uses opaque high-priority surfaces for the delete confirmation modal', () => {
    const backdropBlock = getCssBlock('.codex-modal-backdrop')
    const modalBlock = getCssBlock('.codex-modal')
    const modalListBlock = getCssBlock('.codex-modal-list')

    expect(backdropBlock).toContain('z-index: 100000030;')
    expect(backdropBlock).toContain('background: rgba(17, 24, 39, 0.46);')
    expect(backdropBlock).toContain('opacity: 1;')
    expect(modalBlock).toContain('background: var(--codex-surface-strong, var(--atelier-paper)) !important;')
    expect(modalBlock).toContain('opacity: 1;')
    expect(modalBlock).toContain('isolation: isolate;')
    expect(modalListBlock).toContain('background: var(--codex-surface-soft, var(--atelier-paper-2)) !important;')
    expect(modalListBlock).toContain('opacity: 1;')
  })
})
