import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

import { describe, expect, it } from 'vitest'

const styleSource = readFileSync(resolve(__dirname, '../style.css'), 'utf8')
const redeemSource = readFileSync(resolve(__dirname, '../views/admin/RedeemView.vue'), 'utf8')
const promoSource = readFileSync(resolve(__dirname, '../views/admin/PromoCodesView.vue'), 'utf8')
const announcementsSource = readFileSync(resolve(__dirname, '../views/admin/AnnouncementsView.vue'), 'utf8')
const usersSource = readFileSync(resolve(__dirname, '../views/admin/UsersView.vue'), 'utf8')
const accountStatusSource = readFileSync(resolve(__dirname, '../components/account/AccountStatusIndicator.vue'), 'utf8')
const monitorSource = readFileSync(resolve(__dirname, '../views/admin/ChannelMonitorView.vue'), 'utf8')
const monitorCellSource = readFileSync(resolve(__dirname, '../components/admin/monitor/MonitorPrimaryModelCell.vue'), 'utf8')
const monitorFormatSource = readFileSync(resolve(__dirname, '../composables/useChannelMonitorFormat.ts'), 'utf8')

const cssBlock = (selector: string) => {
  const selectorIndex = styleSource.indexOf(selector)
  expect(selectorIndex, `selector not found: ${selector}`).toBeGreaterThan(-1)
  const openBraceIndex = styleSource.indexOf('{', selectorIndex)
  let depth = 0
  for (let index = openBraceIndex; index < styleSource.length; index += 1) {
    const char = styleSource[index]
    if (char === '{') depth += 1
    if (char === '}') {
      depth -= 1
      if (depth === 0) return styleSource.slice(openBraceIndex + 1, index)
    }
  }
  throw new Error(`CSS block not closed for ${selector}`)
}

describe('semantic badges', () => {
  it('defines semantic badge colors after the generic badge restyle', () => {
    expect(styleSource.indexOf('.semantic-badge')).toBeGreaterThan(
      styleSource.indexOf(':where(.badge, [class*="badge"], [class*="pill"], [class*="chip"])')
    )
    expect(styleSource).toContain('.semantic-badge--success')
    expect(styleSource).toContain('.semantic-badge--warning')
    expect(styleSource).toContain('.semantic-badge--danger')
    expect(styleSource).toContain('.semantic-badge--info')
    expect(styleSource).toContain('.semantic-badge--primary')
    expect(styleSource).toContain('.semantic-badge--provider-openai')
    expect(styleSource).toContain('.semantic-badge--provider-anthropic')
    expect(styleSource).toContain('.semantic-badge--provider-gemini')
    expect(cssBlock('.badge-success')).toContain('background: #dcfce7;')
    expect(cssBlock('.badge-success')).toContain('color: #166534;')
    expect(cssBlock('.badge-warning')).toContain('background: #fef3c7;')
    expect(cssBlock('.badge-warning')).toContain('color: #92400e;')
    expect(cssBlock('.badge-danger')).toContain('background: #fee2e2;')
    expect(cssBlock('.badge-danger')).toContain('color: #991b1b;')
    expect(cssBlock('.semantic-badge--success')).not.toContain('var(--atelier')
    expect(cssBlock('.semantic-badge--warning')).not.toContain('var(--atelier')
    expect(cssBlock('.semantic-badge--danger')).not.toContain('var(--atelier')
  })

  it('uses semantic classes on requested admin/user status and type badges', () => {
    for (const source of [
      redeemSource,
      promoSource,
      announcementsSource,
      usersSource,
      accountStatusSource,
      monitorSource,
      monitorCellSource,
      monitorFormatSource,
    ]) {
      expect(source).toContain('semantic-badge')
    }
    expect(redeemSource).toContain('redeemTypeBadgeClass')
    expect(redeemSource).toContain('redeemStatusBadgeClass')
    expect(promoSource).toContain('semantic-badge--success')
    expect(announcementsSource).toContain('announcementNotifyBadgeClass')
    expect(usersSource).toContain('userRoleBadgeClass')
    expect(usersSource).toContain('userStatusBadgeClass')
    expect(accountStatusSource).toContain('semantic-badge--danger')
    expect(monitorFormatSource).toContain('semantic-badge--provider-openai')
  })

  it('keeps account status badges on fixed monitor-like traffic light colors', () => {
    expect(accountStatusSource).toContain('account-status-badge')
    expect(accountStatusSource).toContain('account-status-badge--success')
    expect(accountStatusSource).toContain('account-status-badge--warning')
    expect(accountStatusSource).toContain('account-status-badge--danger')
    expect(accountStatusSource).toContain('account-status-badge--neutral')
    expect(accountStatusSource).toContain("return 'semantic-badge semantic-badge--warning account-status-badge account-status-badge--warning'")

    expect(styleSource).toContain('Account status badges are semantic indicators; do not theme-shift their traffic-light colors.')
    expect(styleSource).toContain('.account-status-badge--success')
    expect(styleSource).toContain('--account-status-color: #10a37f;')
    expect(styleSource).toContain('.account-status-badge--warning')
    expect(styleSource).toContain('--account-status-color: #d97706;')
    expect(styleSource).toContain('.account-status-badge--danger')
    expect(styleSource).toContain('--account-status-color: #dc2626;')
    expect(styleSource).toContain('.account-status-badge--neutral')
    expect(styleSource).toContain('.dark .account-status-badge--neutral {\n  --account-status-color: #6b7280;')
    expect(styleSource).not.toContain('.account-status-badge--success {\n  --account-status-color: var(--atelier')
  })
})
