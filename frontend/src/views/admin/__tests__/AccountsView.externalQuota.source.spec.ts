import { describe, expect, it } from 'vitest'
import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const sourcePath = resolve(__dirname, '../AccountsView.vue')
const source = readFileSync(sourcePath, 'utf8')
const styleSource = readFileSync(resolve(__dirname, '../../../style.css'), 'utf8')
const dataTableSource = readFileSync(resolve(__dirname, '../../../components/common/DataTable.vue'), 'utf8')
const externalSubscriptionMatchSource = readFileSync(resolve(__dirname, '../../../utils/externalSubscriptionMatch.ts'), 'utf8')
const externalQuotaSettingsModalSource = readFileSync(resolve(__dirname, '../../../components/admin/account/ExternalQuotaProgressSettingsModal.vue'), 'utf8')
const accountsAPISource = readFileSync(resolve(__dirname, '../../../api/admin/accounts.ts'), 'utf8')
const electricBorderPath = resolve(__dirname, '../../../components/common/ElectricBorder.vue')
const electricBorderSource = existsSync(electricBorderPath) ? readFileSync(electricBorderPath, 'utf8') : ''
const creepeeHoverTransform = 'var(--creepee-home-card-hover-transform)'
const creepeeHoverShadow = 'var(--creepee-home-card-hover-shadow)'
const homepageHoverTransform = '--creepee-home-card-hover-transform: translate3d(0, -4px, 0);'
const homepageHoverShadow =
  '--creepee-home-card-hover-shadow: 0 26px 44px -34px color-mix(in srgb, var(--home-card-accent) 58%, transparent);'

const cssBlock = (content: string, selector: string): string => {
  const start = content.indexOf(`${selector} {`)
  expect(start, `Expected CSS selector ${selector}`).toBeGreaterThanOrEqual(0)
  const end = content.indexOf('\n}', start)
  expect(end, `Expected CSS selector ${selector} to close`).toBeGreaterThan(start)
  return content.slice(start, end + 2)
}

const lastCssBlock = (content: string, selector: string): { block: string; start: number } => {
  const start = content.lastIndexOf(`${selector} {`)
  expect(start, `Expected CSS selector ${selector}`).toBeGreaterThanOrEqual(0)
  const end = content.indexOf('\n}', start)
  expect(end, `Expected CSS selector ${selector} to close`).toBeGreaterThan(start)
  return { block: content.slice(start, end + 2), start }
}

describe('AccountsView external quota card metadata', () => {
  it('loads generic external subscription quota summaries for matching account cards', () => {
    expect(source).not.toContain("import buzzBalanceAPI")
    expect(source).toContain("import externalSubscriptionsAPI")
    expect(source).toContain("type ExternalSubscriptionStatus")
    expect(source).toContain("fetchExternalQuotaSummaries")
    expect(source).toContain("externalSubscriptionsAPI.getDisplayStatuses()")
    expect(source).toContain("getAccountExternalQuota")
    expect(source).not.toContain("externalSubscriptionsAPI.getStatuses()")
    expect(source).not.toContain("buzzBalanceAPI.getBalance()")
    expect(source).not.toContain("buildBuzzExternalQuota")
    expect(source).not.toContain("canShowBuzzExternalQuota")
  })

  it('renders external quota details inside the account card name area with provider links', () => {
    expect(source).toContain('data-testid="account-external-quota"')
    expect(source).toContain('account-external-quota-link')
    expect(source).toContain('account-card-name-main')
    expect(source).toContain('getAccountExternalQuota(row)?.formattedBalance')
    expect(source).toContain('getAccountExternalQuota(row)?.formattedExpiry')
    expect(source).not.toContain('data-testid="account-external-quota-card-progress"')
    expect(source).not.toContain('account-external-quota-card-progress')
    expect(source).toContain("localText('前往官网', 'Official site')")
    expect(source).toContain("return localText('长期', 'Long-term')")
    expect(source).not.toContain("return localText('未返回', 'Not returned')")
    expect(source).not.toContain("localText('打开', 'Open')")
    expect(styleSource).toContain('.account-card-name-main')
    expect(styleSource).toContain('.account-external-quota')
    expect(styleSource).toContain('width: 100%;')
    expect(styleSource).not.toMatch(/td\[data-column-key="name"\]\s*\{\s*padding-right: 9\.25rem !important;/)
  })

  it('matches generic external subscriptions from provider match_keywords instead of hardcoded provider branches', () => {
    expect(source).toContain('externalSubscriptionStatuses')
    expect(source).toContain('getMatchedExternalSubscription')
    expect(source).toContain("import { findMatchingExternalSubscription } from '@/utils/externalSubscriptionMatch'")
    expect(source).toContain('findMatchingExternalSubscription(account, externalSubscriptionStatuses.value)')
    expect(externalSubscriptionMatchSource).toContain('match_keywords')
    expect(externalSubscriptionMatchSource).toContain('GENERIC_MODEL_KEYWORDS')
    expect(externalSubscriptionMatchSource).toContain('buildExternalSubscriptionSearchText(account)')
    expect(source).not.toContain('buildExternalSearchText(account)')
    expect(source).toContain("rawchat: 'RawChat'")
    expect(source).not.toContain('canShowTCDMXExternalQuota')
    expect(source).not.toContain('canShowQLHazyCoderExternalQuota')
    expect(source).not.toContain("text.includes('buzzai.cc')")
    expect(source).not.toContain("if (provider === 'packycode'")
    expect(source).not.toContain("text.includes('xhyapi.com') || text.includes('xhyapi') || text.includes('xhy')")
  })

  it('keeps invalid external subscription tokens visible with a clear state', () => {
    expect(source).toContain('subscription.error_code')
    expect(source).toContain('isExternalSubscriptionInvalidToken')
    expect(source).toContain("localText('Token 失效', 'Token invalid')")
    expect(source).toContain("localText('请更新 Token', 'Update token')")
  })

  it('uses per-account quota progress settings instead of a global account-page switch', () => {
    expect(source).toContain("import ExternalQuotaProgressSettingsModal from '@/components/admin/account/ExternalQuotaProgressSettingsModal.vue'")
    expect(source).toContain("import UsageProgressBar from '@/components/account/UsageProgressBar.vue'")
    expect(source).toContain("import { buildAccountExternalQuotaProgressPreferenceKey, useAccountExternalQuotaProgressSettings } from '@/composables/useAccountExternalQuotaProgressSettings'")
    expect(source).toContain('loadAccountExternalQuotaProgressSettings')
    expect(source).toContain('void loadAccountExternalQuotaProgressSettings()')
    expect(source).toContain('getAccountExternalQuotaProgressPreference(account, subscription)')
    expect(source).toContain('buildAccountExternalQuotaProgressPreferenceKey(account, subscription)')
    expect(source).toContain('account.external_quota_token_stats?.[preferenceKey]')
    expect(source).toContain('openExternalQuotaProgressSettings(row)')
    expect(source).toContain('getAccountExternalQuotaProgressPreference(account, subscription ?? null)')
    expect(source).toContain('setAccountExternalQuotaProgressPreference(')
    expect(source).not.toContain('if (!subscription) return')
    expect(source).toContain('saveExternalQuotaProgressSettings')
    expect(source).toContain('data-testid="account-external-quota-progress-action"')
    expect(source).toContain("localText('额度条', 'Quota bar')")
    expect(source).not.toContain('v-if="getMatchedExternalSubscription(row)"')
    expect(source).toContain('<ExternalQuotaProgressSettingsModal')
    expect(source).toContain(':settings="externalQuotaProgressSettings.current"')
    expect(externalQuotaSettingsModalSource).toContain('hasProviderTotal(props.subscription)')
    expect(externalQuotaSettingsModalSource).not.toContain('supportsExternalQuotaProgress(props.subscription)')
    expect(externalQuotaSettingsModalSource).toContain("form.mode = next.mode === 'token_total' || next.mode === 'custom_total' || hasStatusTotal.value")
    expect(source).not.toContain("import { useExternalQuotaProgressPreference } from '@/composables/useExternalQuotaProgressPreference'")
    expect(source).not.toContain('setExternalQuotaProgressEnabled(!externalQuotaProgressEnabled)')
    expect(source).not.toContain("localText('显示额度进度条', 'Show quota progress')")
  })

  it('renders a per-account schedule lock next to the scheduling control without changing schedulable directly', () => {
    expect(source).toContain('data-testid="account-schedule-lock-action"')
    expect(source).toContain('row.schedule_locked')
    expect(source).toContain('handleToggleScheduleLock(row)')
    expect(source).toContain('togglingScheduleLock')
    expect(source).toContain('adminAPI.accounts.setScheduleLocked')
    expect(source).toContain('updateScheduleLockedInList([a.id], updated?.schedule_locked ?? nextLocked)')
    expect(accountsAPISource).toContain('setScheduleLocked')
    expect(accountsAPISource).toContain('/schedule-lock')
  })

  it('adds a token quota progress template with account-local usage stats and refresh time', () => {
    expect(externalQuotaSettingsModalSource).toContain("value=\"token_total\"")
    expect(externalQuotaSettingsModalSource).toContain("localText('Token 用量 / 总量', 'Token usage / total')")
    expect(externalQuotaSettingsModalSource).toContain("localText('Token 总量', 'Token total')")
    expect(externalQuotaSettingsModalSource).toContain("localText('Token 刷新时间', 'Token refresh time')")
    expect(externalQuotaSettingsModalSource).toContain('type="datetime-local"')
    expect(externalQuotaSettingsModalSource).toContain('buildAccountExternalQuotaProgressPreferenceKey(props.account, props.subscription ?? null)')
    expect(externalQuotaSettingsModalSource).toContain('props.account.external_quota_token_stats?.[key]')
    expect(externalQuotaSettingsModalSource).toContain("next.mode === 'token_total'")
    expect(source).toContain('formatExternalTokens')
    expect(source).toContain("progress?.unit === 'tokens'")
  })

  it('places the external quota progress under the official usage window cell', () => {
    const usageCellIndex = source.indexOf('<template #cell-usage="{ row }">')
    const progressIndex = source.indexOf('data-testid="account-external-quota-usage-progress"')

    expect(usageCellIndex).toBeGreaterThan(0)
    expect(progressIndex).toBeGreaterThan(usageCellIndex)
    expect(progressIndex).toBeLessThan(source.indexOf('<template #cell-proxy="{ row }">'))
    expect(source.slice(usageCellIndex, progressIndex)).toContain('<AccountUsageCell')
    expect(source.slice(usageCellIndex, source.indexOf('<template #cell-proxy="{ row }">'))).toContain('<UsageProgressBar')
    expect(source).not.toContain('data-testid="account-external-quota-card-progress"')
    expect(source).not.toContain('account-external-quota-progress-track')
    expect(styleSource).not.toContain('.account-external-quota-progress-track')
    expect(styleSource).not.toContain('.account-external-quota-card-progress')
  })

  it('keeps account calling helpers hoisted before the immediate watcher runs', () => {
    expect(source).toContain('function hasLiveAccountActivity(row: Account)')
    expect(source).toContain('function syncAccountCallingGrace()')
    expect(source).not.toContain('const syncAccountCallingGrace = () =>')
    expect(source.indexOf('function syncAccountCallingGrace()')).toBeLessThan(
      source.indexOf('{ immediate: true }')
    )
  })

  it('renders a provider logo before each account card name and supports custom logo URLs', () => {
    expect(source).toContain('data-testid="account-provider-logo"')
    expect(source).toContain("import ProviderBrandIcon from '@/components/common/ProviderBrandIcon.vue'")
    expect(source).toContain('<ProviderBrandIcon')
    expect(source).toContain(':provider="getAccountLogoProvider(row)"')
    expect(source).toContain(':logo-url="getAccountCustomLogo(row)"')
    expect(source).not.toContain('account-provider-logo-img')
    expect(source).not.toContain('account-provider-logo-fallback')
    expect(source).toContain('custom_logo_url')
    expect(source).toContain('logo_url')
    expect(source).not.toContain("import { aiLogoUrlForProvider } from '@/utils/providerBrandIcon'")
  })

  it('keeps rate and priority together on the account card and supports quick priority edits', () => {
    expect(source).toContain('data-testid="account-rate-quick-adjust"')
    expect(source).toContain('data-testid="account-priority-quick-adjust"')
    expect(source).toContain('data-testid="account-card-controls"')
    expect(source).toContain("localText('降低优先级', 'Lower priority')")
    expect(source).toContain("localText('提高优先级', 'Raise priority')")
    expect(source).toContain('rateMultiplierMenu')
    expect(source).toContain('openRateMultiplierMenu(row, $event)')
    expect(source).toContain('adminAPI.accounts.updateRateMultiplier')
    expect(source).toContain('handleRateMultiplierSave')
    expect(source).toContain('handlePriorityQuickAdjust')
    expect(source).toContain('priorityUpdatingIds')
    expect(source).toContain('adminAPI.accounts.update(account.id, { priority: nextPriority })')
    expect(source).toContain('rate_multiplier')
    expect(source).not.toContain('account-rate-quick-adjust flex flex-col items-center')
    expect(source.indexOf('data-testid="account-rate-quick-adjust"')).toBeLessThan(
      source.indexOf('data-testid="account-priority-quick-adjust"')
    )
    expect(source).not.toContain('adminAPI.accounts.update(row.id, { rate_multiplier')
  })

  it('marks actively used account rows with the pasted canvas ElectricBorder treatment', () => {
    expect(electricBorderSource).not.toBe('')
    expect(electricBorderSource).toContain('canvas.getContext')
    expect(electricBorderSource).toContain('octavedNoise')
    expect(electricBorderSource).toContain('getRoundedRectPoint')
    expect(electricBorderSource).toContain('ResizeObserver')
    expect(electricBorderSource).toContain('requestAnimationFrame')
    expect(electricBorderSource).toContain('eb-glow-1')
    expect(electricBorderSource).toContain('ctx.lineWidth = 1')
    expect(electricBorderSource).not.toContain('ctx.lineWidth = props.thickness')
    expect(dataTableSource).toContain('name="row-overlay"')
    expect(source).toContain("import ElectricBorder from '@/components/common/ElectricBorder.vue'")
    expect(source).toContain('<template #row-overlay="{ row }">')
    expect(source).toContain('<ElectricBorder')
    expect(source).toContain('color="#c96442"')
    expect(source).toContain(':speed="1.5"')
    expect(source).toContain(':chaos="0.02"')
    expect(source).toContain(':border-radius="16"')
    expect(source).toContain(':thickness="2"')
    expect(source).toContain(':row-class="getAccountRowClass"')
    expect(source).toContain('getAccountRowClass')
    expect(source).toContain('isAccountCalling(row)')
    expect(source).toContain('current_concurrency')
    expect(source).toContain('active_sessions')
    expect(source).toContain('codex-account-card-calling')
    expect(source).toContain('account-electric-border')
    expect(styleSource).not.toContain('account-electric-border-spin')
    expect(styleSource).not.toContain('conic-gradient(')
  })

  it('keeps the active account border alive for one minute after a short activity gap', () => {
    expect(source).toContain('const ACCOUNT_CALLING_GRACE_MS = 60_000')
    expect(source).toContain('accountCallingGraceUntil')
    expect(source).toContain('accountCallingNow')
    expect(source).toContain('hasLiveAccountActivity(row)')
    expect(source).toContain('syncAccountCallingGrace')
    expect(source).toContain('startAccountCallingGraceTicker')
    expect(source).toContain('stopAccountCallingGraceTicker')
    expect(source).toContain('accountCallingGraceUntil.set(account.id, Date.now() + ACCOUNT_CALLING_GRACE_MS)')
    expect(source).toContain('return graceUntil > accountCallingNow.value')
    expect(source).toContain('watch(')
  })

  it('matches the Creepee homepage recommendation-card hover treatment on admin account table cards', () => {
    const accountRowHoverBlock = cssBlock(
      styleSource,
      '#app .app-layout-content .accounts-table-page .table-wrapper tbody tr:hover'
    )
    const globalHoverBlock = cssBlock(
      styleSource,
      '#app .app-layout-content :where(.codex-account-card, .monitor-capacity-card, .external-subscription-card, .accounts-table-page .table-wrapper tbody tr):hover'
    )
    const themedGlobalHoverBlock = cssBlock(
      styleSource,
      ':root:is(.theme-cloudflare, .theme-anthropic, [data-theme="cloudflare"], [data-theme="anthropic"]) #app .app-layout-content :where(.codex-account-card, .monitor-capacity-card, .external-subscription-card, .accounts-table-page .table-wrapper tbody tr):hover'
    )
    const globalBaseBlock = cssBlock(
      styleSource,
      '#app .app-layout-content :where(.codex-account-card, .monitor-capacity-card, .external-subscription-card, .accounts-table-page .table-wrapper tbody tr)'
    )
    const tableResetIndex = styleSource.indexOf(
      '#app .app-layout-content :where(.table-wrapper, .table-scroll-container) tbody tr:hover'
    )
    const finalAccountRowHover = lastCssBlock(
      styleSource,
      '#app .app-layout-content .accounts-table-page .table-wrapper tbody tr:hover'
    )

    expect(styleSource).toContain(homepageHoverTransform)
    expect(styleSource).toContain(homepageHoverShadow)
    expect(styleSource).toContain(`--creepee-home-card-hover-shadow: ${homepageHoverShadow.split(': ')[1]}`)
    expect(accountRowHoverBlock).toContain(homepageHoverShadow)
    expect(accountRowHoverBlock).toContain(`transform: ${creepeeHoverTransform};`)
    expect(accountRowHoverBlock).toContain(`box-shadow: ${creepeeHoverShadow};`)
    expect(accountRowHoverBlock).not.toContain('translate3d(0, -2px, 0)')
    expect(accountRowHoverBlock).not.toContain('rgba(20, 20, 19, 0.035)')
    expect(accountRowHoverBlock).not.toMatch(/(?:^|\n)\s*background(?:-color)?\s*:/)
    expect(accountRowHoverBlock).not.toContain('var(--atelier-ui-hover-surface)')
    expect(accountRowHoverBlock).not.toContain('var(--atelier-butter')
    expect(accountRowHoverBlock).not.toMatch(/(?:amber|yellow)/i)
    expect(accountRowHoverBlock).not.toContain('border-color')
    expect(accountRowHoverBlock).not.toMatch(/(?:^|\n)\s*(?:color|-webkit-text-fill-color)\s*:/)
    expect(globalHoverBlock).toContain('.accounts-table-page .table-wrapper tbody tr')
    expect(globalBaseBlock).toContain(homepageHoverShadow)
    expect(globalHoverBlock).toContain(`transform: ${creepeeHoverTransform} !important;`)
    expect(globalHoverBlock).toContain(`box-shadow: ${creepeeHoverShadow} !important;`)
    expect(globalHoverBlock).not.toContain('translateY(-2px)')
    expect(globalHoverBlock).not.toContain('rgba(20, 20, 19, 0.035)')
    expect(globalHoverBlock).not.toMatch(/(?:^|\n)\s*background(?:-color)?\s*:/)
    expect(globalHoverBlock).not.toContain('var(--atelier-ui-hover-surface)')
    expect(globalHoverBlock).not.toContain('var(--atelier-butter')
    expect(globalHoverBlock).not.toMatch(/(?:amber|yellow)/i)
    expect(globalHoverBlock).not.toContain('border-color')
    expect(globalHoverBlock).not.toMatch(/(?:^|\n)\s*(?:color|-webkit-text-fill-color)\s*:/)
    expect(themedGlobalHoverBlock).toContain(`transform: ${creepeeHoverTransform} !important;`)
    expect(themedGlobalHoverBlock).toContain(`box-shadow: ${creepeeHoverShadow} !important;`)
    expect(themedGlobalHoverBlock).not.toContain('var(--atelier-material-shadow')
    expect(themedGlobalHoverBlock).not.toContain('rgba(20, 20, 19, 0.024)')
    expect(themedGlobalHoverBlock).not.toContain('translateY(-2px)')
    expect(themedGlobalHoverBlock).not.toMatch(/(?:^|\n)\s*background(?:-color)?\s*:/)
    expect(themedGlobalHoverBlock).not.toContain('border-color')
    expect(themedGlobalHoverBlock).not.toMatch(/(?:^|\n)\s*(?:color|-webkit-text-fill-color)\s*:/)
    expect(finalAccountRowHover.start).toBeGreaterThan(tableResetIndex)
    expect(finalAccountRowHover.block).toContain(homepageHoverShadow)
    expect(finalAccountRowHover.block).toContain(`transform: ${creepeeHoverTransform} !important;`)
    expect(finalAccountRowHover.block).toContain(`box-shadow: ${creepeeHoverShadow} !important;`)
    expect(finalAccountRowHover.block).not.toContain('translate3d(0, -2px, 0)')
    expect(finalAccountRowHover.block).not.toContain('rgba(20, 20, 19, 0.035)')
    expect(finalAccountRowHover.block).not.toMatch(/(?:^|\n)\s*background(?:-color)?\s*:/)
    expect(finalAccountRowHover.block).not.toContain('var(--atelier-ui-hover-surface)')
    expect(finalAccountRowHover.block).not.toContain('var(--atelier-butter')
    expect(finalAccountRowHover.block).not.toMatch(/(?:amber|yellow)/i)
    expect(finalAccountRowHover.block).not.toContain('border-color')
    expect(finalAccountRowHover.block).not.toMatch(/(?:^|\n)\s*(?:color|-webkit-text-fill-color)\s*:/)
  })
})
