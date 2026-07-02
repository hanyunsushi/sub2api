import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

import { describe, expect, it } from 'vitest'

const source = readFileSync(resolve(__dirname, '../RedeemView.vue'), 'utf8')

describe('user RedeemView theme source', () => {
  it('uses the unified Anthropic page surface for the balance hero instead of a standalone color block', () => {
    expect(source).toContain('redeem-balance-hero')
    expect(source).toContain('redeem-balance-hero-muted')
    expect(source).toContain('border: 1px solid var(--anthropic-cookbook-border);')
    expect(source).toContain('background: var(--anthropic-page);')
    expect(source).toContain('color: var(--atelier-ink);')
    expect(source).toContain('class="mt-2 text-4xl font-bold text-[var(--anthropic-fg)]"')
    expect(source).toContain('class="text-[var(--anthropic-muted)]"')
    expect(source).toContain('color: var(--anthropic-muted);')
    expect(source).not.toContain('background: #e3dacc;')
    expect(source).not.toContain('class="mt-2 text-4xl font-bold text-white"')
    expect(source).not.toContain('class="text-white"')
    expect(source).not.toContain('linear-gradient(135deg, var(--atelier-terracotta-action), var(--atelier-terracotta-action-hover))')
    expect(source).not.toContain('bg-gradient-to-br from-primary-500 to-primary-600')
    expect(source).not.toContain('text-primary-100')
  })

  it('keeps recent activity semantic colors protected from appearance theme remapping', () => {
    expect(source).toContain('redeem-history-list')
    expect(source).toContain('getHistoryIconTone')
    expect(source).toContain('getHistoryValueTone')
    expect(source).toContain('redeem-history-icon--success')
    expect(source).toContain('redeem-history-icon--danger')
    expect(source).toContain('redeem-history-icon--info')
    expect(source).toContain('redeem-history-icon--warning')
    expect(source).toContain('redeem-history-icon--muted')
    expect(source).toContain('color: var(--atelier-status-success);')
    expect(source).toContain('color: var(--atelier-status-danger);')
    expect(source).toContain('color: var(--atelier-status-info);')
    expect(source).toContain('color: var(--atelier-status-critical);')
    expect(source).toContain('color: var(--atelier-muted);')
    expect(source).not.toContain('.redeem-history-list :where(.bg-emerald-100')
  })
})
