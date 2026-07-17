import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

import { describe, expect, it } from 'vitest'

const readSource = (relativePath: string) => readFileSync(resolve(__dirname, relativePath), 'utf8')

const authLayoutSource = readSource('../../../components/layout/AuthLayout.vue')
const loginSource = readSource('../LoginView.vue')
const registerSource = readSource('../RegisterView.vue')
const targetedStyleSource = readSource('../../../styles/targeted-visual-repair.css')

describe('auth layout rhythm', () => {
  it('centers the aside copy inside its own panel', () => {
    expect(targetedStyleSource).toContain('margin-inline: auto;')
    expect(targetedStyleSource).not.toContain('margin-left: auto;')
  })

  it.each([
    ['login', loginSource, 'auth-login-button-submit'],
    ['register', registerSource, 'auth-register-button-submit'],
  ])('places the %s agreement immediately before the submit button', (_, source, submitTestId) => {
    const agreementIndex = source.indexOf('<LoginAgreementPrompt')
    const submitIndex = source.indexOf(`data-testid="${submitTestId}"`)

    expect(agreementIndex).toBeGreaterThanOrEqual(0)
    expect(submitIndex).toBeGreaterThan(agreementIndex)
  })

  it('uses the agreement typography and one spacing rhythm for auth footer text', () => {
    expect(authLayoutSource).toContain('--auth-flow-gap: 20px;')
    expect(authLayoutSource).toContain('font-size: 13px;')
    expect(authLayoutSource).toContain('line-height: 20px;')
    expect(targetedStyleSource).toContain('gap: var(--auth-flow-gap);')
    expect(authLayoutSource).toContain('.auth-footer-link,\n.auth-copyright {')
    expect(authLayoutSource).toContain('margin-top: var(--auth-flow-gap);')
    expect(targetedStyleSource).toContain('.auth-ascii-shell :where(.auth-submit-button) {\n  margin-top: 0;')
    expect(targetedStyleSource).not.toContain('.auth-ascii-shell :where(.auth-submit-button) {\n  margin-top: 2px;')
  })
})
