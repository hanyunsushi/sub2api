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
    expect(source).toContain("return localText('长期', 'Long-term')")
    expect(source).not.toContain("return localText('未返回', 'Not returned')")
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
})
