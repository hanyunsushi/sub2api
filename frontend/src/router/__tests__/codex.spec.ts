import { describe, expect, it } from 'vitest'
import { codexRoutes } from '@/router/codex'

describe('codexRoutes', () => {
  it('registers an admin-only Codex accounts route', () => {
    const route = codexRoutes.find((item) => item.name === 'AdminCodexAccounts')

    expect(route?.path).toBe('/admin/codex/accounts')
    expect(route?.meta).toMatchObject({
      requiresAuth: true,
      requiresAdmin: true,
      title: 'Codex Account Management',
      titleKey: 'admin.codex.accounts.title',
      descriptionKey: 'admin.codex.accounts.description',
    })
  })

  it('redirects the Codex admin root to accounts', () => {
    expect(codexRoutes[0]).toMatchObject({
      path: '/admin/codex',
      redirect: '/admin/codex/accounts',
    })
  })
})
