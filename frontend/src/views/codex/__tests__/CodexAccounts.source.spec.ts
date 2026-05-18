import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const componentSource = readFileSync(resolve(__dirname, '../CodexAccounts.vue'), 'utf8')
const codexThemeSource = readFileSync(resolve(__dirname, '../../../styles/codex-theme.css'), 'utf8')

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
    expect(codexThemeSource).toContain('backdrop-filter: blur(14px) saturate(1.08)')
    expect(codexThemeSource).toContain('.dark .codex-panel')
    expect(codexThemeSource).toContain('.dark .codex-account-card')
  })
})
