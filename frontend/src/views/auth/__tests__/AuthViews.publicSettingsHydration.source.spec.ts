import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

import { describe, expect, it } from 'vitest'

const loginViewSource = readFileSync(resolve(__dirname, '../LoginView.vue'), 'utf8')
const registerViewSource = readFileSync(resolve(__dirname, '../RegisterView.vue'), 'utf8')

describe('auth view public settings hydration source', () => {
  it('hydrates login view from injected or cached app settings before falling back to a raw request', () => {
    expect(loginViewSource).toContain('appStore.cachedPublicSettings ||')
    expect(loginViewSource).toContain('(await appStore.fetchPublicSettings()) ||')
    expect(loginViewSource).toContain('(await getPublicSettings())')
    expect(loginViewSource).toContain('if (appStore.cachedPublicSettings) {')
    expect(loginViewSource).toContain('applyPublicSettings(appStore.cachedPublicSettings)')
  })

  it('derives register copy from the app store instead of a local Sub2API fallback ref', () => {
    expect(registerViewSource).toContain("appStore.cachedPublicSettings?.site_name || appStore.siteName || 'Sub2API'")
    expect(registerViewSource).not.toContain("const siteName = ref<string>('Sub2API')")
    expect(registerViewSource).toContain('appStore.cachedPublicSettings ||')
    expect(registerViewSource).toContain('(await appStore.fetchPublicSettings()) ||')
    expect(registerViewSource).toContain('(await getPublicSettings())')
  })
})
