import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

import { describe, expect, it } from 'vitest'

const authLayoutSource = readFileSync(resolve(__dirname, '../AuthLayout.vue'), 'utf8')

describe('AuthLayout source', () => {
  it('reads the split auth shell copy from i18n instead of hardcoded mixed-language strings', () => {
    expect(authLayoutSource).toContain("t('auth.layout.kicker')")
    expect(authLayoutSource).toContain("t('auth.layout.quoteLineOne')")
    expect(authLayoutSource).toContain("t('auth.layout.quoteLineTwo')")
    expect(authLayoutSource).toContain("t('auth.layout.defaultSubtitle')")
    expect(authLayoutSource).toContain("t('auth.layout.backToHome')")
    expect(authLayoutSource).toContain("t('auth.layout.copyright'")
    expect(authLayoutSource).toContain("t('auth.layout.points.accounts')")
    expect(authLayoutSource).not.toContain('WILL makes')
    expect(authLayoutSource).not.toContain('账号、订阅与渠道状态统一归档。')
    expect(authLayoutSource).not.toContain('All rights reserved.')
  })
})
