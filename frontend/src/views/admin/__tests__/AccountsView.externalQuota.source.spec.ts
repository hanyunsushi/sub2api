import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const sourcePath = resolve(__dirname, '../AccountsView.vue')
const source = readFileSync(sourcePath, 'utf8')

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
    expect(source).toContain('getAccountExternalQuota(row)?.formattedBalance')
    expect(source).toContain('getAccountExternalQuota(row)?.formattedExpiry')
    expect(source).toContain("localText('前往官网', 'Official site')")
    expect(source).toContain("return localText('长期', 'Long-term')")
    expect(source).not.toContain("return localText('未返回', 'Not returned')")
    expect(source).not.toContain("localText('打开', 'Open')")
  })

  it('matches generic external subscriptions from provider match_keywords instead of hardcoded provider branches', () => {
    expect(source).toContain('externalSubscriptionStatuses')
    expect(source).toContain('getMatchedExternalSubscription')
    expect(source).toContain('match_keywords')
    expect(source).toContain('buildExternalSearchText(account)')
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

  it('adds a compact quick rate multiplier control next to the account more action without using full account edit payloads', () => {
    expect(source).toContain('data-testid="account-rate-quick-adjust"')
    expect(source).toContain('rateMultiplierMenu')
    expect(source).toContain('openRateMultiplierMenu(row, $event)')
    expect(source).toContain('adminAPI.accounts.updateRateMultiplier')
    expect(source).toContain('handleRateMultiplierSave')
    expect(source).toContain('rate_multiplier')
    expect(source).not.toContain('adminAPI.accounts.update(row.id, { rate_multiplier')
  })
})
