import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

import { describe, expect, it } from 'vitest'

const loginSource = readFileSync(resolve(__dirname, '../LoginView.vue'), 'utf8')
const registerSource = readFileSync(resolve(__dirname, '../RegisterView.vue'), 'utf8')
const styleSource = readFileSync(resolve(__dirname, '../../../style.css'), 'utf8')

describe('login agreement input gate', () => {
  it('keeps login inputs locked while exposing a hoverable agreement hint wrapper', () => {
    expect(loginSource).toContain('const agreementInputLocked = computed(')
    expect(loginSource).toContain("loginAgreementMode.value === 'checkbox'")
    expect(loginSource).toContain('const agreementInputHint = computed(')
    expect(loginSource).toContain('请先勾选下方使用协议后再输入。')
    expect(loginSource.match(/auth-agreement-locked-field/g)?.length ?? 0).toBeGreaterThanOrEqual(2)
    expect(loginSource).toContain(':data-agreement-hint="agreementInputLocked ? agreementInputHint : undefined"')
    expect(loginSource).toContain(':tabindex="agreementInputLocked ? 0 : undefined"')
    expect(loginSource).toContain(':title="agreementInputLocked ? agreementInputHint : undefined"')
    expect(loginSource).toContain(':disabled="authActionDisabled"')
  })

  it('keeps registration inputs locked while exposing a hoverable agreement hint wrapper', () => {
    expect(registerSource).toContain('const agreementInputLocked = computed(')
    expect(registerSource).toContain("loginAgreementMode.value === 'checkbox'")
    expect(registerSource).toContain('const agreementInputHint = computed(')
    expect(registerSource).toContain('请先勾选下方使用协议后再输入。')
    expect(registerSource.match(/auth-agreement-locked-field/g)?.length ?? 0).toBeGreaterThanOrEqual(4)
    expect(registerSource).toContain(':data-agreement-hint="agreementInputLocked ? agreementInputHint : undefined"')
    expect(registerSource).toContain(':tabindex="agreementInputLocked ? 0 : undefined"')
    expect(registerSource).toContain(':title="agreementInputLocked ? agreementInputHint : undefined"')
    expect(registerSource).toContain(':disabled="registrationActionDisabled"')
  })

  it('renders the hint from the field wrapper because disabled inputs cannot reliably emit hover or focus feedback', () => {
    expect(styleSource).toContain('.auth-agreement-locked-field::after')
    expect(styleSource).toContain('content: attr(data-agreement-hint);')
    expect(styleSource).toContain('.auth-agreement-locked-field:hover::after')
    expect(styleSource).toContain('.auth-agreement-locked-field:focus-visible::after')
    expect(styleSource).toContain('pointer-events: none;')
    expect(styleSource).not.toContain('input.auth-agreement-locked-field')
  })
})
