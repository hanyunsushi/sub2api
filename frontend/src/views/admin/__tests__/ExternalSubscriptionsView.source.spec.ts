import { describe, expect, it } from 'vitest'
import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const sourcePath = resolve(__dirname, '../ExternalSubscriptionsView.vue')
const source = existsSync(sourcePath) ? readFileSync(sourcePath, 'utf8') : ''
const stylePath = resolve(__dirname, '../../../style.css')
const styleSource = existsSync(stylePath) ? readFileSync(stylePath, 'utf8') : ''
const targetedRepairPath = resolve(__dirname, '../../../styles/targeted-visual-repair.css')
const targetedRepairSource = existsSync(targetedRepairPath) ? readFileSync(targetedRepairPath, 'utf8') : ''

const cssBlock = (content: string, selector: string): string => {
  const start = content.indexOf(`${selector} {`)
  expect(start, `Expected CSS selector ${selector}`).toBeGreaterThanOrEqual(0)
  const end = content.indexOf('\n}', start)
  expect(end, `Expected CSS selector ${selector} to close`).toBeGreaterThan(start)
  return content.slice(start, end + 2)
}

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
    expect(source).toContain("rawchat_subscriptions")
    expect(source).toContain("mimo_token_plan")
    expect(source).toContain("applyPreset('newapi_console')")
    expect(source).toContain("applyPreset('active_subscriptions')")
    expect(source).toContain("applyPreset('buzz_balance')")
    expect(source).toContain("applyPreset('openrouter_credits')")
    expect(source).toContain("applyPreset('cloudflare_ai_gateway_credits')")
    expect(source).toContain("applyPreset('rawchat_subscriptions')")
    expect(source).toContain("applyPreset('mimo_token_plan')")
    expect(source).toContain('form.api_token')
    expect(source).toContain('form.refresh_token')
    expect(source).toContain('api_token_configured')
    expect(source).toContain('refresh_token_configured')
    expect(source).toContain('leave blank to keep')
  })

  it('exposes a persistent balance strategy selector wired into provider payloads', () => {
    expect(source).toContain('balance_strategy')
    expect(source).toContain('balanceStrategyOptions')
    expect(source).toContain('v-model="form.balance_strategy"')
    expect(source).toContain("auth_me_balance")
    expect(source).toContain("openai_billing")
    expect(source).toContain("newapi_user_quota")
    expect(source).toContain("Console Access Token")
    expect(source).toContain("model API key cannot read account quota")
    expect(source).toContain("newapi_subscription")
    expect(source).toContain("active_subscriptions")
    expect(source).toContain('balance_strategy: form.balance_strategy')
    expect(source).toContain('form.balance_strategy = provider.balance_strategy')
  })

  it('exposes matching keywords and sort order so new providers auto-match account cards and header ordering', () => {
    expect(source).toContain('match_keywords')
    expect(source).toContain('sort_order')
    expect(source).toContain('keywordsDraft')
    expect(source).toContain('parseKeywords')
    expect(source).toContain('providerMap')
    expect(source).toContain('displayCards')
  })

  it('keeps subscription count and sort order out of the visible card chrome', () => {
    expect(source).not.toContain("localText('订阅', 'Subs')")
    expect(source).not.toContain('{{ card.activeCount }}')
    expect(source).not.toContain('external-subscription-sort-fact')
    expect(source).not.toContain('external-subscription-sort-value')
    expect(source).toContain('sortOrder: number')
    expect(source).toContain('left.sortOrder - right.sortOrder')
    expect(source).toContain('v-model.number="form.sort_order"')
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

  it('uses compact card dimensions to reduce blank space in the external subscription grid', () => {
    expect(source).toContain('min-height: 10.5rem;')
    expect(source).toContain('padding: 0.875rem;')
    expect(source).toContain('gap-3 md:grid-cols-2 xl:grid-cols-4')
    expect(source).not.toContain('min-height: 13.75rem;')
    expect(source).not.toContain('padding: 1rem;')
    expect(source).not.toContain('grid gap-4 md:grid-cols-2 xl:grid-cols-3')
  })

  it('matches the account-card hover treatment on external subscription cards', () => {
    const localHoverBlock = cssBlock(source, '.external-subscription-card:hover')
    const localBaseBlock = cssBlock(source, '.external-subscription-card')
    const finalBaseBlock = cssBlock(
      targetedRepairSource,
      '#app .app-layout-content .external-subscriptions-page .external-subscription-card'
    )
    const finalHoverBlock = cssBlock(
      targetedRepairSource,
      '#app .app-layout-content .external-subscriptions-page .external-subscription-card:hover,\n#app .app-layout-content .external-subscriptions-page .external-subscription-card:focus-visible'
    )

    expect(localBaseBlock).toContain('--external-subscription-card-bg: var(--anthropic-page);')
    expect(localBaseBlock).toContain('--external-subscription-card-hover-bg: var(--external-subscription-card-bg);')
    expect(localBaseBlock).toContain('background: var(--external-subscription-card-bg);')
    expect(localBaseBlock).toContain('box-shadow: none;')
    expect(source).not.toContain('.external-subscription-card::before')
    expect(localHoverBlock).toContain('border-color: var(--anthropic-cookbook-border);')
    expect(localHoverBlock).toContain('background: var(--external-subscription-card-hover-bg);')
    expect(localHoverBlock).toContain('box-shadow: 0 8px 28px rgba(0, 0, 0, 0.08);')
    expect(localHoverBlock).toContain('transform: none;')
    expect(localHoverBlock).not.toContain('translateY(-2px)')
    expect(localHoverBlock).not.toContain('translate3d')
    expect(localHoverBlock).not.toContain('var(--atelier-ui-hover-surface)')
    expect(localHoverBlock).not.toContain('var(--atelier-butter')
    expect(localHoverBlock).not.toMatch(/(?:amber|yellow)/i)
    expect(localHoverBlock).not.toContain('var(--atelier-material-shadow)')
    expect(finalBaseBlock).toContain('--external-subscription-card-bg: var(--anthropic-page);')
    expect(finalBaseBlock).toContain('--external-subscription-card-hover-bg: var(--external-subscription-card-bg);')
    expect(finalBaseBlock).toContain('background: var(--external-subscription-card-bg) !important;')
    expect(finalBaseBlock).toContain('box-shadow: none !important;')
    expect(finalBaseBlock).toContain('transform: none !important;')
    expect(finalHoverBlock).toContain('border-color: var(--anthropic-cookbook-border) !important;')
    expect(finalHoverBlock).toContain('background: var(--external-subscription-card-hover-bg) !important;')
    expect(finalHoverBlock).toContain('box-shadow: 0 8px 28px rgba(0, 0, 0, 0.08) !important;')
    expect(finalHoverBlock).toContain('transform: none !important;')
    expect(finalHoverBlock).not.toContain('translate3d')
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
    expect(source).toContain("Quota authorization required")
    expect(source).toContain('formatStatusUsage(card.status)')
    expect(source).toContain('displayCards')
    expect(source).toContain('filteredCards')
  })

  it('does not expose a global quota progress switch because account cards configure quota bars per account', () => {
    expect(source).not.toContain('external-subscription-progress-toggle')
    expect(source).not.toContain('externalQuotaProgressEnabled')
    expect(source).not.toContain('useExternalQuotaProgressPreference')
    expect(source).not.toContain("localText('额度进度', 'Quota progress')")
    expect(source).toContain('buildAccountExternalQuotaProgressMeta(card.status, EXTERNAL_CARD_QUOTA_PROGRESS_PREFERENCE)')
  })

  it('renders external subscription card quota bars with the official usage progress component', () => {
    expect(source).toContain("import UsageProgressBar from '@/components/account/UsageProgressBar.vue'")
    expect(source).toContain('data-testid="external-subscription-quota-progress"')
    expect(source).toContain('<UsageProgressBar')
    expect(source).toContain('label="EXT"')
    expect(source).toContain(':utilization="getCardQuotaProgress(card)?.percent ?? 0"')
    expect(source).toContain('color="success"')
    expect(source).not.toContain('external-subscription-quota-progress-track')
    expect(source).not.toContain('external-subscription-quota-progress-fill')
    expect(source).not.toContain('externalQuotaProgressFillClass')
  })

  it('keeps quota progress fills on the Anthropic 81k semantic palette outside account cards', () => {
    const safeBlock = cssBlock(targetedRepairSource, '#app .app-layout-content :where(.usage-progress-fill--safe)')
    const warningBlock = cssBlock(targetedRepairSource, '#app .app-layout-content :where(.usage-progress-fill--warning)')
    const dangerBlock = cssBlock(targetedRepairSource, '#app .app-layout-content :where(.usage-progress-fill--danger)')
    expect(styleSource).toContain('.app-layout-content :where(.usage-progress-fill--safe')
    expect(styleSource).toContain('background: var(--anthropic-success);')
    expect(styleSource).toContain('.app-layout-content :where(.usage-progress-fill--warning')
    expect(styleSource).toContain('background: var(--anthropic-warning);')
    expect(styleSource).toContain('.app-layout-content :where(.usage-progress-fill--danger')
    expect(styleSource).toContain('background: var(--anthropic-error);')
    expect(safeBlock).toContain('background: var(--anthropic-success) !important;')
    expect(warningBlock).toContain('background: var(--anthropic-warning) !important;')
    expect(dangerBlock).toContain('background: var(--anthropic-error) !important;')
  })

  it('offers a Xiaomi MiMo preset without adding extra card information', () => {
    expect(source).toContain("{ value: 'mimo_token_plan', label: 'Xiaomi MiMo' }")
    expect(source).toContain("case 'mimo_token_plan':")
    expect(source).toContain("form.id = 'mimo'")
    expect(source).toContain("form.api_base_url = 'https://platform.xiaomimimo.com'")
    expect(source).toContain("return 'tp-xxxxx'")
    expect(source).toContain("keywordsDraft.value = 'mimo\\nxiaomi\\nxiaomimimo'")
  })

  it('uses account-card style official links instead of showing raw site URLs on provider cards', () => {
    expect(source).toContain("localText('前往官网', 'Official site')")
    expect(source).toContain(':title="card.siteUrl"')
    expect(source).not.toContain('{{ card.siteUrl }}')
  })

  it('uses 81k semantic status tokens instead of theme accent colors', () => {
    expect(source).toContain('external-subscription-status-dot--success')
    expect(source).toContain('external-subscription-status-dot--warning')
    expect(source).toContain('external-subscription-status-dot--danger')
    expect(source).toContain('external-subscription-status-dot--neutral')
    expect(source).toContain('var(--atelier-status-success)')
    expect(source).toContain('var(--atelier-status-warning)')
    expect(source).toContain('var(--atelier-status-danger)')
    expect(source).toContain('var(--atelier-status-neutral)')
    expect(source).not.toContain('external-subscription-status-dot.is-ok')
    expect(source).not.toContain('external-subscription-status-dot.is-error')
    expect(source).not.toContain('external-subscription-status-dot.is-muted')
    expect(source).not.toContain("? 'is-error'")
    expect(source).not.toContain("? 'is-muted'")
  })

  it('does not present package total as the remaining balance when upstream remaining is unknown', () => {
    expect(source).toContain("const unknown = localText('余额未知', 'Balance unknown')")
    expect(source).toContain('if (total) return `${unknown} / ${total}`')
    expect(source).not.toContain('if (total) return total')
  })

  it('keeps external subscription cards on the account-card paper ladder in final runtime locks', () => {
    expect(styleSource).not.toContain('background: var(--anthropic-home-card) !important;')
    expect(targetedRepairSource).toContain('#app .app-layout-content .external-subscriptions-page .external-subscription-card')
    expect(targetedRepairSource).toContain('--external-subscription-card-bg: var(--anthropic-page);')
    expect(targetedRepairSource).toContain('--external-subscription-card-hover-bg: var(--external-subscription-card-bg);')
    expect(targetedRepairSource).toContain('background: var(--external-subscription-card-bg) !important;')
    expect(targetedRepairSource).toContain('background: var(--external-subscription-card-hover-bg) !important;')
  })
})
