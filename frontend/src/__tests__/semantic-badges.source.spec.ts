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
})
