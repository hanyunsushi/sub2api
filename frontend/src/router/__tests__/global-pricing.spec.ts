import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import { describe, expect, it } from 'vitest'

const routerPath = resolve(dirname(fileURLToPath(import.meta.url)), '../index.ts')
const routerSource = readFileSync(routerPath, 'utf8')
const sidebarPath = resolve(dirname(fileURLToPath(import.meta.url)), '../../components/layout/AppSidebar.vue')
const sidebarSource = readFileSync(sidebarPath, 'utf8')

describe('global pricing route and navigation', () => {
  it('registers a user-visible authenticated global pricing route', () => {
    expect(routerSource).toContain("path: '/global-pricing'")
    expect(routerSource).toContain("name: 'GlobalPricing'")
    expect(routerSource).toContain("component: () => import('@/views/user/GlobalPricingView.vue')")
    expect(routerSource).toContain("titleKey: 'globalPricing.title'")
    expect(routerSource).toContain("descriptionKey: 'globalPricing.description'")
  })

  it('adds global pricing to both regular user and admin personal navigation', () => {
    expect(sidebarSource).toContain("path: '/global-pricing'")
    expect(sidebarSource).toContain("label: t('nav.globalPricing')")
    expect(sidebarSource).toContain('icon: PriceTagIcon')
    expect(sidebarSource).toContain("const personalNavItems = computed((): NavItem[] => finalizeNav(buildSelfNavItems(false)))")
  })
})
