import { describe, expect, it } from 'vitest'

import legacyEn from '../locales/en'
import modularEn from '../locales/en/index'
import legacyZh from '../locales/zh'
import modularZh from '../locales/zh/index'
import { i18n, loadLocaleMessages } from '../index'
import { mergeLocaleMessages } from '../mergeLocaleMessages'

describe('runtime locale merge', () => {
  it.each([
    ['zh', modularZh, legacyZh],
    ['en', modularEn, legacyEn]
  ] as const)('adds modular messages while preserving legacy customizations for %s', (_locale, modular, legacy) => {
    const merged = mergeLocaleMessages(modular, legacy) as typeof modular

    expect(merged.nav.securityAudit).toBe(modular.nav.securityAudit)
    expect(merged.nav.auditLogs).toBe(modular.nav.auditLogs)
    expect(merged.admin.promptAudit.title).toBe(modular.admin.promptAudit.title)
    expect(merged.admin.accounts.columns.upstreamBillingRate).toBe(
      modular.admin.accounts.columns.upstreamBillingRate
    )
    expect(merged.admin.accounts.duplicateAccount).toBe(modular.admin.accounts.duplicateAccount)
    expect(merged.nav.globalPricing).toBe(legacy.nav.globalPricing)
    expect(merged.admin.codex.accounts.title).toBe(legacy.admin.codex.accounts.title)
  })

  it('loads the merged messages through the application locale loader', async () => {
    await Promise.all([loadLocaleMessages('zh'), loadLocaleMessages('en')])

    const runtimeZh = i18n.global.getLocaleMessage('zh') as typeof modularZh
    const runtimeEn = i18n.global.getLocaleMessage('en') as typeof modularEn

    expect(runtimeZh.nav.securityAudit).toBe('安全审计')
    expect(runtimeZh.admin.accounts.columns.upstreamBillingRate).toBe('上游声明倍率')
    expect(runtimeZh.admin.accounts.duplicateAccount).toBe('复制账号')
    expect(runtimeEn.nav.securityAudit).toBe('Security Audit')
    expect(runtimeEn.admin.accounts.columns.upstreamBillingRate).toBe('Upstream Declared Rate')
    expect(runtimeEn.admin.accounts.duplicateAccount).toBe('Duplicate Account')
  })
})
