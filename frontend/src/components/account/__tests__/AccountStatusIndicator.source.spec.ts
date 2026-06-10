import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const source = readFileSync(resolve(__dirname, '../AccountStatusIndicator.vue'), 'utf8')

describe('AccountStatusIndicator source', () => {
  it('raises abnormal status tooltips above account card overlays and menus', () => {
    expect(source).toContain('account-status-tooltip')
    expect(source).toContain('account-status-tooltip-arrow')
    expect(source).toMatch(/z-\[\d{4,}\]/)
  })
})
