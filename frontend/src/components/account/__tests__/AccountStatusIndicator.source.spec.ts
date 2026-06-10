import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const source = readFileSync(resolve(__dirname, '../AccountStatusIndicator.vue'), 'utf8')

describe('AccountStatusIndicator source', () => {
  it('raises abnormal status tooltips above account card overlays and menus', () => {
    expect(source).toContain('account-status-tooltip')
    expect(source).toContain('account-status-tooltip-arrow')
    expect(source).toContain('<Teleport to="body">')
    expect(source).toContain('account-status-floating-tooltip')
    expect(source).toContain('position: fixed')
    expect(source).toContain('2147483647')
    expect(source).not.toContain('z-[10050]')
  })
})
