import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const componentSource = readFileSync(resolve(__dirname, '../CodexAccounts.vue'), 'utf8')
const codexThemeSource = readFileSync(resolve(__dirname, '../../../styles/codex-theme.css'), 'utf8')
const blockedBackdropFilter = ['backdrop', 'filter'].join('-')
const blockedWebkitBackdropFilter = ['-webkit', blockedBackdropFilter].join('-')

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
    expect(codexThemeSource).toContain('--material-card-surface: color-mix(in srgb, #fffaf0 68%, #f3efe5);')
    expect(codexThemeSource).toContain('var(--material-card-surface);')
    expect(codexThemeSource).toContain('background-size: 28px 28px, 28px 28px, auto;')
    expect(codexThemeSource).toContain('background: var(--codex-accent-soft);')
    expect(codexThemeSource).toContain('border-radius: 6px;')
    expect(codexThemeSource).not.toContain(blockedBackdropFilter)
    expect(codexThemeSource).not.toContain(blockedWebkitBackdropFilter)
    expect(codexThemeSource).not.toContain('inset 0 -1px')
    expect(codexThemeSource).toContain('.dark .codex-panel')
    expect(codexThemeSource).toContain('.dark .codex-account-card')
  })

  it('does not add a fixed module scrollbar to the CPA account management shell', () => {
    const shellBlock = getCssBlock('.codex-shell')

    expect(shellBlock).not.toContain('overflow: hidden;')
    expect(shellBlock).not.toContain('min-height: calc(100dvh - 128px);')
  })
})
