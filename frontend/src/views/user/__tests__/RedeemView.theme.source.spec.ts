import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

import { describe, expect, it } from 'vitest'

const source = readFileSync(resolve(__dirname, '../RedeemView.vue'), 'utf8')

describe('user RedeemView theme source', () => {
  it('uses the active appearance accent for the balance hero instead of blue primary utilities', () => {
    expect(source).toContain('redeem-balance-hero')
    expect(source).toContain('redeem-balance-hero-muted')
    expect(source).toContain('linear-gradient(135deg, var(--atelier-terracotta-action), var(--atelier-terracotta-action-hover))')
    expect(source).not.toContain('bg-gradient-to-br from-primary-500 to-primary-600')
    expect(source).not.toContain('text-primary-100')
  })

  it('keeps recent activity semantic colors protected from appearance theme remapping', () => {
    expect(source).toContain('redeem-history-list')
    expect(source).toContain('.redeem-history-list :where(.bg-emerald-100')
    expect(source).toContain('.redeem-history-list :where(.text-emerald-600')
    expect(source).toContain('.redeem-history-list :where(.bg-red-100')
    expect(source).toContain('.redeem-history-list :where(.text-red-600')
    expect(source).toContain('.redeem-history-list :where(.bg-orange-100')
    expect(source).toContain('.redeem-history-list :where(.text-orange-600')
  })
})
