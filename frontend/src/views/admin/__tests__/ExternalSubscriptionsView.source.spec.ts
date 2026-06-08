import { describe, expect, it } from 'vitest'
import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const sourcePath = resolve(__dirname, '../ExternalSubscriptionsView.vue')
const source = existsSync(sourcePath) ? readFileSync(sourcePath, 'utf8') : ''

describe('ExternalSubscriptionsView source', () => {
  it('is a standalone admin settings subpage backed by the generic external subscriptions API', () => {
    expect(source).toContain('<AppLayout>')
    expect(source).toContain('<TablePageLayout')
    expect(source).toContain('external-subscription-card-grid')
    expect(source).toContain('<BaseDialog')
    expect(source).toContain("import externalSubscriptionsAPI")
    expect(source).toContain('loadProviders')
    expect(source).toContain('loadStatuses')
  })

  it('supports all provider presets/templates and keeps secrets write-only', () => {
    expect(source).toContain("newapi_console")
    expect(source).toContain("active_subscriptions")
    expect(source).toContain("buzz_balance")
    expect(source).toContain("openrouter_credits")
    expect(source).toContain("cloudflare_ai_gateway_credits")
    expect(source).toContain("applyPreset('newapi_console')")
    expect(source).toContain("applyPreset('active_subscriptions')")
    expect(source).toContain("applyPreset('buzz_balance')")
    expect(source).toContain("applyPreset('openrouter_credits')")
    expect(source).toContain("applyPreset('cloudflare_ai_gateway_credits')")
    expect(source).toContain('form.api_token')
    expect(source).toContain('form.refresh_token')
    expect(source).toContain('api_token_configured')
    expect(source).toContain('refresh_token_configured')
    expect(source).toContain('leave blank to keep')
  })

  it('exposes matching keywords and sort order so new providers auto-match account cards and header ordering', () => {
    expect(source).toContain('match_keywords')
    expect(source).toContain('sort_order')
    expect(source).toContain('keywordsDraft')
    expect(source).toContain('parseKeywords')
    expect(source).toContain('providerMap')
    expect(source).toContain('displayCards')
  })

  it('renders providers as compact cards instead of the old horizontal data table', () => {
    expect(source).toContain(':scroll-mode="')
    expect(source).toContain('class="external-subscriptions-page"')
    expect(source).toContain('external-subscription-card-grid')
    expect(source).toContain('external-subscription-card')
    expect(source).toContain('v-for="card in filteredCards"')
    expect(source).toContain('external-subscription-card-shell')
    expect(source).toContain('external-subscription-card-main')
    expect(source).toContain('external-subscription-balance-row')
    expect(source).toContain('external-subscription-card-facts')
    expect(source).toContain('external-subscription-status-line')
    expect(source).toContain('external-subscription-config-meta')
    expect(source).not.toContain('external-subscription-token-state')
    expect(source).not.toContain('cardStatusBadgeClass')
    expect(source).not.toContain('<DataTable')
    expect(source).not.toContain('const columns = computed<Column[]>')
    expect(source).not.toContain("import DataTable")
  })

  it('lets the settings page scroll naturally without clipping the card grid', () => {
    expect(source).toContain('.external-subscriptions-page :deep(.layout-section-scrollable)')
    expect(source).toContain('.external-subscriptions-page :deep(.table-scroll-container)')
    expect(source).toContain('overflow: visible')
    expect(source).not.toContain('max-height: min(68vh, 720px);')
    expect(source).not.toContain('overflow-y: auto;')
  })

  it('uses generic display statuses and provider logos so settings cards match header and account balance surfaces', () => {
    expect(source).toContain("import ProviderBrandIcon from '@/components/common/ProviderBrandIcon.vue'")
    expect(source).toContain("import LogoPicker from '@/components/common/LogoPicker.vue'")
    expect(source).not.toContain("import buzzBalanceAPI")
    expect(source).toContain('<ProviderBrandIcon')
    expect(source).toContain(':logo-url="card.logoUrl"')
    expect(source).toContain('<LogoPicker')
    expect(source).toContain('v-model="form.logo_url"')
    expect(source).toContain('logoUrl: string')
    expect(source).toContain('logo_url: form.logo_url.trim()')
    expect(source).toContain('form.logo_url = provider.logo_url ||')
    expect(source).toContain('data-testid="external-subscription-logo"')
    expect(source).toContain('externalSubscriptionsAPI.getDisplayStatuses({ refresh: force })')
    expect(source).toContain('externalSubscriptionsAPI.subscribeDisplayStatuses')
    expect(source).not.toContain('externalSubscriptionsAPI.getStatuses()')
    expect(source).toContain('external-subscription-balance-value')
    expect(source).toContain('displayCards')
    expect(source).toContain('filteredCards')
  })
})
