import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import { describe, expect, it } from 'vitest'

const routerPath = resolve(dirname(fileURLToPath(import.meta.url)), '../index.ts')
const routerSource = readFileSync(routerPath, 'utf8')
const sidebarPath = resolve(dirname(fileURLToPath(import.meta.url)), '../../components/layout/AppSidebar.vue')
const sidebarSource = readFileSync(sidebarPath, 'utf8')
const viewPath = resolve(dirname(fileURLToPath(import.meta.url)), '../../views/user/GlobalPricingView.vue')
const viewSource = readFileSync(viewPath, 'utf8')

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

  it('shows independent color provider icons in the first pricing table column', () => {
    expect(viewSource).toContain("import ProviderBrandIcon from '@/components/common/ProviderBrandIcon.vue'")
    expect(viewSource).toContain("{{ t('globalPricing.columns.brand') }}")
    expect(viewSource).toContain('<ProviderBrandIcon :provider="item.provider" :model="item.model" />')
    expect(viewSource).toContain('brand-sticky-col brand-cell')
    expect(viewSource).toContain('<span class="sr-only">{{ item.provider || item.model }}</span>')
    expect(viewSource).toContain('colspan="11"')
    expect(viewSource).not.toContain("import ProviderIcon from '@/components/user/monitor/ProviderIcon.vue'")
  })

  it('uses shared material card surfaces on maintained pricing modules', () => {
    expect(viewSource).toContain('summary-tile')
    expect(viewSource).toContain('table-wrapper')
    expect(viewSource).toContain('summary-tile admin-material-surface')
    expect(viewSource).toContain('table-wrapper admin-material-surface')
    expect(viewSource).toContain('--material-card-surface')
    expect(viewSource).toContain('backdrop-filter: blur(20px) saturate(1.2) contrast(1.02)')
    expect(viewSource).not.toContain('inset 0 -1px')
    expect(viewSource).toContain('.dark .summary-tile')
    expect(viewSource).toContain('.dark .table-wrapper')
  })
})
