import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { ExternalSubscriptionStatus } from '@/api/admin/externalSubscriptions'

const status = (overrides: Partial<ExternalSubscriptionStatus> = {}): ExternalSubscriptionStatus => ({
  provider: 'rawchat',
  name: 'RawChat',
  template: 'rawchat_subscriptions',
  balance_strategy: 'auto',
  enabled: true,
  configured: true,
  api_token_configured: true,
  refresh_token_configured: false,
  match_keywords: [],
  sort_order: 0,
  currency: 'USD',
  site_url: 'https://rawchat.cn',
  used_usd: 12,
  remaining_usd: 48,
  total_limit_usd: 60,
  active_count: 1,
  subscriptions: [],
  ...overrides,
})

describe('useAccountExternalQuotaProgressSettings', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.resetModules()
  })

  it('shows supported account quota bars by default until the account is explicitly disabled', async () => {
    const {
      useAccountExternalQuotaProgressSettings,
    } = await import('../useAccountExternalQuotaProgressSettings')

    const {
      getAccountExternalQuotaProgressPreference,
      setAccountExternalQuotaProgressPreference,
    } = useAccountExternalQuotaProgressSettings()
    const account = { id: 101 }
    const subscription = status()

    expect(getAccountExternalQuotaProgressPreference(account, subscription)).toMatchObject({
      enabled: true,
      mode: 'status_total',
      customTotal: null,
    })

    setAccountExternalQuotaProgressPreference(account, subscription, {
      enabled: false,
      mode: 'status_total',
      customTotal: null,
    })

    expect(getAccountExternalQuotaProgressPreference(account, subscription).enabled).toBe(false)
  })
})
