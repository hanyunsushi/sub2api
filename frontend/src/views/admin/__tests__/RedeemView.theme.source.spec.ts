import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const source = readFileSync(resolve(__dirname, '../RedeemView.vue'), 'utf8')
const repairSource = readFileSync(
  resolve(__dirname, '../../../styles/targeted-visual-repair.css'),
  'utf8',
)

describe('RedeemView theme source', () => {
  it('uses the Anthropic card surface for the invitation hint instead of blue utility classes', () => {
    expect(source).toContain('redeem-invitation-hint')
    expect(source).toContain('redeem-invitation-hint-text')
    expect(source).toContain('background: #e3dacc;')
    expect(source).toContain('color: var(--atelier-ink);')
    expect(source).not.toContain('background: color-mix(in srgb, var(--atelier-blue) 12%, var(--atelier-paper-2));')
    expect(source).not.toContain('color: var(--atelier-blue-dark);')
    expect(source).not.toContain('bg-blue-50')
    expect(source).not.toContain('text-blue-700')
    expect(source).not.toContain('dark:bg-blue-900/20')
    expect(source).not.toContain('dark:text-blue-300')
  })

  it('scopes admin redeem primary leftovers to the Anthropic card surface', () => {
    expect(source).toContain('class="admin-redeem-atelier"')
    expect(repairSource).toContain('.admin-redeem-atelier.admin-redeem-atelier')
    expect(repairSource).toContain('input[type="checkbox"].text-primary-600')
    expect(repairSource).toContain('accent-color: #e3dacc !important;')
    expect(repairSource).toContain('button.border-primary-500.bg-primary-50')
  })
})
