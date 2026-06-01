import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const sourcePath = resolve(__dirname, '../AccountsView.vue')
const source = readFileSync(sourcePath, 'utf8')

describe('AccountsView external quota card metadata', () => {
  it('loads BuzzAI and TCDMX quota summaries for matching account cards', () => {
    expect(source).toContain("import buzzBalanceAPI")
    expect(source).toContain("import tcdmxSubscriptionAPI")
    expect(source).toContain("fetchExternalQuotaSummaries")
    expect(source).toContain("getAccountExternalQuota")
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

  it('uses external provider base URLs instead of provider subpages for account card links', () => {
    expect(source).toContain("const defaultBuzzURL = 'https://buzzai.cc'")
    expect(source).toContain("const defaultTCDMXURL = 'https://tcdmx.com'")
    expect(source).not.toContain("https://buzzai.cc/dashboard/billing")
    expect(source).not.toContain("https://tcdmx.com/subscriptions")
  })

  it('only shows provider quota cards after that provider summary is enabled and configured', () => {
    expect(source).toContain('canShowBuzzExternalQuota')
    expect(source).toContain('buzzBalance.value?.enabled')
    expect(source).toContain('buzzBalance.value?.configured')
    expect(source).toContain('canShowTCDMXExternalQuota')
    expect(source).toContain('tcdmxSubscription.value?.enabled')
    expect(source).toContain('tcdmxSubscription.value?.configured')
    expect(source).toContain("if (provider === 'tcdmx' && canShowTCDMXExternalQuota())")
    expect(source).toContain("if (provider === 'buzz' && canShowBuzzExternalQuota())")
  })

  it('keeps TCDMX account cards visible with a clear invalid-token state', () => {
    expect(source).toContain('tcdmxSubscription.value?.error_code')
    expect(source).toContain("localText('Token 失效', 'Token invalid')")
    expect(source).toContain("localText('请更新 Token', 'Update token')")
  })

  it('renders a provider logo before each account card name and supports custom logo URLs', () => {
    expect(source).toContain('data-testid="account-provider-logo"')
    expect(source).toContain('getAccountLogo(row)')
    expect(source).toContain('getAccountLogoAlt(row)')
    expect(source).toContain('account-provider-logo-img')
    expect(source).toContain('account-provider-logo-fallback')
    expect(source).toContain('custom_logo_url')
    expect(source).toContain('logo_url')
    expect(source).toContain("import { aiLogoUrlForProvider } from '@/utils/providerBrandIcon'")
    expect(source).toContain('aiLogoUrlForProvider(')
  })
})
