import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import { describe, expect, it } from 'vitest'

const routerPath = resolve(dirname(fileURLToPath(import.meta.url)), '../index.ts')
const source = readFileSync(routerPath, 'utf8')

describe('external subscriptions route', () => {
  it('registers external subscriptions as an admin-only system settings child page', () => {
    expect(source).toContain("path: '/admin/settings/external-subscriptions'")
    expect(source).toContain("name: 'AdminExternalSubscriptions'")
    expect(source).toContain("component: () => import('@/views/admin/ExternalSubscriptionsView.vue')")
    expect(source).toContain("titleKey: 'admin.externalSubscriptions.title'")
    expect(source).toContain("descriptionKey: 'admin.externalSubscriptions.description'")
    expect(source).toContain('requiresAdmin: true')
  })
})
