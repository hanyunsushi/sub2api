import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const componentSource = readFileSync(resolve(__dirname, '../CodexAccounts.vue'), 'utf8')
const codexThemeSource = readFileSync(resolve(__dirname, '../../../styles/codex-theme.css'), 'utf8')
const styleSource = readFileSync(resolve(__dirname, '../../../style.css'), 'utf8')
const blockedBackdropFilter = ['backdrop', 'filter'].join('-')
const blockedWebkitBackdropFilter = ['-webkit', blockedBackdropFilter].join('-')
const creepeeHoverTransform = 'var(--creepee-home-card-hover-transform)'
const creepeeHoverShadow = 'var(--creepee-home-card-hover-shadow)'
const homepageHoverTransform = '--creepee-home-card-hover-transform: translate3d(0, -4px, 0);'
const homepageHoverShadow =
  '--creepee-home-card-hover-shadow: 0 26px 44px -34px rgba(20, 20, 19, 0.18);'

const getCssBlock = (selector: string) => {
  const start = codexThemeSource.indexOf(`${selector} {`)
  if (start === -1) return ''
  const end = codexThemeSource.indexOf('\n}', start)
  return end === -1 ? codexThemeSource.slice(start) : codexThemeSource.slice(start, end + 2)
}

describe('CodexAccounts source contracts', () => {
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
    expect(codexThemeSource).toContain('--codex-accent-soft: color-mix(in srgb, var(--atelier-blue) 10%, var(--atelier-paper));')
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

  it('matches the Creepee homepage recommendation-card hover treatment on account cards', () => {
    const accountCardHoverBlock = getCssBlock('.codex-account-card:hover')
    const accountCardBlock = getCssBlock('.codex-account-card')
    const selectedBlock = getCssBlock('.codex-account-card.is-selected')

    expect(styleSource).toContain(homepageHoverTransform)
    expect(accountCardBlock).toContain(homepageHoverShadow)
    expect(accountCardHoverBlock).toContain(`transform: ${creepeeHoverTransform};`)
    expect(accountCardHoverBlock).toContain(`box-shadow: ${creepeeHoverShadow};`)
    expect(accountCardHoverBlock).not.toContain('translateY(-2px)')
    expect(accountCardHoverBlock).not.toContain('rgba(20,20,19,.035)')
    expect(accountCardHoverBlock).not.toContain('rgba(20, 20, 19, 0.035)')
    expect(accountCardBlock).not.toContain('color-mix(in srgb, var(--home-card-accent)')
    expect(accountCardHoverBlock).not.toMatch(/(?:^|\n)\s*background(?:-color)?\s*:/)
    expect(accountCardHoverBlock).not.toContain('var(--atelier-ui-hover-surface)')
    expect(accountCardHoverBlock).not.toContain('var(--atelier-butter')
    expect(accountCardHoverBlock).not.toMatch(/(?:amber|yellow)/i)
    expect(accountCardHoverBlock).not.toContain('border-color')
    expect(accountCardHoverBlock).not.toMatch(/(?:^|\n)\s*(?:color|-webkit-text-fill-color)\s*:/)
    expect(accountCardHoverBlock).not.toContain('var(--atelier-paper)')
    expect(accountCardHoverBlock).not.toContain('var(--codex-accent-soft)')
    expect(accountCardHoverBlock).not.toContain('rgba(0, 47, 167, 0.5)')
    expect(selectedBlock).not.toContain('transform:')
    expect(selectedBlock).not.toContain('background: var(--atelier-paper)')
    expect(selectedBlock).not.toContain(creepeeHoverShadow)
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
