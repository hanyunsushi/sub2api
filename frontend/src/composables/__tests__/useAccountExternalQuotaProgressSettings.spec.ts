import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { ExternalSubscriptionStatus } from '@/api/admin/externalSubscriptions'

vi.mock('@/api/admin/externalSubscriptions', () => ({
  default: {
    getAccountQuotaProgressSettings: vi.fn(),
    updateAccountQuotaProgressSettings: vi.fn(),
  },
}))

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
    vi.clearAllMocks()
  })

  it('loads persisted settings from the backend before falling back to defaults', async () => {
    const externalSubscriptionsAPI = (await import('@/api/admin/externalSubscriptions')).default
    vi.mocked(externalSubscriptionsAPI.getAccountQuotaProgressSettings).mockResolvedValueOnce({
      '101:rawchat:rawchat_subscriptions:rawchat': {
        enabled: false,
        mode: 'status_total',
        customTotal: null,
      },
    })
    const {
      useAccountExternalQuotaProgressSettings,
    } = await import('../useAccountExternalQuotaProgressSettings')

    const {
      loadAccountExternalQuotaProgressSettings,
      getAccountExternalQuotaProgressPreference,
    } = useAccountExternalQuotaProgressSettings()
    const account = { id: 101 }
    const subscription = status()

    await loadAccountExternalQuotaProgressSettings()

    expect(externalSubscriptionsAPI.getAccountQuotaProgressSettings).toHaveBeenCalledTimes(1)
    expect(getAccountExternalQuotaProgressPreference(account, subscription).enabled).toBe(false)
  })

  it('retries backend loading after a transient failure instead of pinning stale local settings', async () => {
    const externalSubscriptionsAPI = (await import('@/api/admin/externalSubscriptions')).default
    vi.mocked(externalSubscriptionsAPI.getAccountQuotaProgressSettings)
      .mockRejectedValueOnce(new Error('network down'))
      .mockResolvedValueOnce({
        '101:rawchat:rawchat_subscriptions:rawchat': {
          enabled: false,
          mode: 'custom_total',
          customTotal: 120,
        },
      })
    const {
      useAccountExternalQuotaProgressSettings,
    } = await import('../useAccountExternalQuotaProgressSettings')

    const {
      loadAccountExternalQuotaProgressSettings,
      getAccountExternalQuotaProgressPreference,
    } = useAccountExternalQuotaProgressSettings()
    const account = { id: 101 }
    const subscription = status()

    await loadAccountExternalQuotaProgressSettings()
    await loadAccountExternalQuotaProgressSettings()

    expect(externalSubscriptionsAPI.getAccountQuotaProgressSettings).toHaveBeenCalledTimes(2)
    expect(getAccountExternalQuotaProgressPreference(account, subscription)).toMatchObject({
      enabled: false,
      mode: 'custom_total',
      customTotal: 120,
    })
  })

  it('shows supported account quota bars by default until the account is explicitly disabled', async () => {
    const externalSubscriptionsAPI = (await import('@/api/admin/externalSubscriptions')).default
    vi.mocked(externalSubscriptionsAPI.getAccountQuotaProgressSettings).mockResolvedValueOnce({})
    vi.mocked(externalSubscriptionsAPI.updateAccountQuotaProgressSettings).mockResolvedValueOnce({
      '101:rawchat:rawchat_subscriptions:rawchat': {
        enabled: false,
        mode: 'status_total',
        customTotal: null,
      },
    })
    const {
      useAccountExternalQuotaProgressSettings,
    } = await import('../useAccountExternalQuotaProgressSettings')

    const {
      loadAccountExternalQuotaProgressSettings,
      getAccountExternalQuotaProgressPreference,
      setAccountExternalQuotaProgressPreference,
    } = useAccountExternalQuotaProgressSettings()
    const account = { id: 101 }
    const subscription = status()

    await loadAccountExternalQuotaProgressSettings()

    expect(getAccountExternalQuotaProgressPreference(account, subscription)).toMatchObject({
      enabled: true,
      mode: 'status_total',
      customTotal: null,
    })

    await setAccountExternalQuotaProgressPreference(account, subscription, {
      enabled: false,
      mode: 'status_total',
      customTotal: null,
    })

    expect(externalSubscriptionsAPI.updateAccountQuotaProgressSettings).toHaveBeenCalledWith({
      '101:rawchat:rawchat_subscriptions:rawchat': {
        enabled: false,
        mode: 'status_total',
        customTotal: null,
      },
    })
    expect(getAccountExternalQuotaProgressPreference(account, subscription).enabled).toBe(false)
  })

  it('merges current backend settings before saving one account preference', async () => {
    const externalSubscriptionsAPI = (await import('@/api/admin/externalSubscriptions')).default
    vi.mocked(externalSubscriptionsAPI.getAccountQuotaProgressSettings)
      .mockResolvedValueOnce({})
      .mockResolvedValueOnce({
        '202:openrouter:openrouter_credits:openrouter': {
          enabled: false,
          mode: 'custom_total',
          customTotal: 50,
        },
      })
    vi.mocked(externalSubscriptionsAPI.updateAccountQuotaProgressSettings).mockResolvedValueOnce({
      '101:rawchat:rawchat_subscriptions:rawchat': {
        enabled: false,
        mode: 'status_total',
        customTotal: null,
      },
      '202:openrouter:openrouter_credits:openrouter': {
        enabled: false,
        mode: 'custom_total',
        customTotal: 50,
      },
    })
    const {
      useAccountExternalQuotaProgressSettings,
    } = await import('../useAccountExternalQuotaProgressSettings')

    const {
      loadAccountExternalQuotaProgressSettings,
      setAccountExternalQuotaProgressPreference,
    } = useAccountExternalQuotaProgressSettings()

    await loadAccountExternalQuotaProgressSettings()
    await setAccountExternalQuotaProgressPreference({ id: 101 }, status(), {
      enabled: false,
      mode: 'status_total',
      customTotal: null,
    })

    expect(externalSubscriptionsAPI.updateAccountQuotaProgressSettings).toHaveBeenCalledWith({
      '101:rawchat:rawchat_subscriptions:rawchat': {
        enabled: false,
        mode: 'status_total',
        customTotal: null,
      },
      '202:openrouter:openrouter_credits:openrouter': {
        enabled: false,
        mode: 'custom_total',
        customTotal: 50,
      },
    })
  })

  it('normalizes and persists token quota progress settings per account', async () => {
    const externalSubscriptionsAPI = (await import('@/api/admin/externalSubscriptions')).default
    vi.mocked(externalSubscriptionsAPI.getAccountQuotaProgressSettings)
      .mockResolvedValueOnce({})
      .mockResolvedValueOnce({})
    vi.mocked(externalSubscriptionsAPI.updateAccountQuotaProgressSettings).mockResolvedValueOnce({
      '303:mimo:mimo_token_plan:xiaomi mimo': {
        enabled: true,
        mode: 'token_total',
        customTotal: null,
        tokenTotal: 1_000_000,
        tokenResetAt: '2026-06-11T00:00:00.000Z',
      },
    })
    const {
      useAccountExternalQuotaProgressSettings,
    } = await import('../useAccountExternalQuotaProgressSettings')

    const {
      loadAccountExternalQuotaProgressSettings,
      getAccountExternalQuotaProgressPreference,
      setAccountExternalQuotaProgressPreference,
    } = useAccountExternalQuotaProgressSettings()
    const account = { id: 303 }
    const subscription = status({
      provider: 'mimo',
      name: 'Xiaomi MiMo',
      template: 'mimo_token_plan',
      site_url: 'https://platform.xiaomimimo.com',
    })

    await loadAccountExternalQuotaProgressSettings()
    await setAccountExternalQuotaProgressPreference(account, subscription, {
      enabled: true,
      mode: 'token_total',
      customTotal: null,
      tokenTotal: 1_000_000,
      tokenResetAt: '2026-06-11T00:00:00.000Z',
    })

    expect(externalSubscriptionsAPI.updateAccountQuotaProgressSettings).toHaveBeenCalledWith({
      '303:mimo:mimo_token_plan:xiaomi mimo': {
        enabled: true,
        mode: 'token_total',
        customTotal: null,
        tokenTotal: 1_000_000,
        tokenResetAt: '2026-06-11T00:00:00.000Z',
      },
    })
    expect(getAccountExternalQuotaProgressPreference(account, subscription)).toMatchObject({
      enabled: true,
      mode: 'token_total',
      tokenTotal: 1_000_000,
      tokenResetAt: '2026-06-11T00:00:00.000Z',
    })
  })
})
