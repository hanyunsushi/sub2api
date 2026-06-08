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

  it('supports both provider presets/templates and keeps secrets write-only', () => {
    expect(source).toContain("newapi_console")
    expect(source).toContain("active_subscriptions")
    expect(source).toContain("openrouter_credits")
    expect(source).toContain("cloudflare_ai_gateway_credits")
    expect(source).toContain("applyPreset('newapi_console')")
    expect(source).toContain("applyPreset('active_subscriptions')")
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
    expect(source).toContain('refreshStatusMap')
  })

  it('renders providers as compact cards instead of the old horizontal data table', () => {
    expect(source).toContain('external-subscription-card-grid')
    expect(source).toContain('external-subscription-card')
    expect(source).toContain('v-for="provider in filteredProviders"')
    expect(source).not.toContain('<DataTable')
    expect(source).not.toContain('const columns = computed<Column[]>')
    expect(source).not.toContain("import DataTable")
  })

  it('uses display statuses and provider logos so settings cards match header and account balance surfaces', () => {
    expect(source).toContain("import ProviderBrandIcon from '@/components/common/ProviderBrandIcon.vue'")
    expect(source).toContain('<ProviderBrandIcon')
    expect(source).toContain('data-testid="external-subscription-logo"')
    expect(source).toContain('externalSubscriptionsAPI.getDisplayStatuses()')
    expect(source).not.toContain('externalSubscriptionsAPI.getStatuses()')
    expect(source).toContain('external-subscription-balance-value')
  })
})
