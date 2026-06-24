import { describe, expect, it } from 'vitest'

import type { ExternalSubscriptionStatus } from '@/api/admin/externalSubscriptions'
import {
  buildAccountExternalQuotaProgressMeta,
  buildExternalQuotaProgressMeta,
  supportsExternalQuotaProgress,
  type AccountExternalQuotaProgressPreference,
} from '../externalSubscriptionQuotaProgress'

const status = (overrides: Partial<ExternalSubscriptionStatus>): ExternalSubscriptionStatus => ({
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
  used_usd: 0,
  active_count: 0,
  subscriptions: [],
  ...overrides,
})

describe('external subscription quota progress', () => {
  it('builds progress for RawChat from used and remaining quota', () => {
    const meta = buildExternalQuotaProgressMeta(status({
      total_limit_usd: 60,
      used_usd: 22.5,
      remaining_usd: 37.5,
    }))

    expect(meta).toMatchObject({
      visible: true,
      provider: 'rawchat',
      total: 60,
      used: 22.5,
      remaining: 37.5,
      tone: 'safe',
    })
    expect(meta?.percent).toBeCloseTo(37.5)
  })

  it('supports TCDMX and OpenRouter but skips balance-only providers', () => {
    expect(supportsExternalQuotaProgress(status({
      provider: 'tcdmx',
      name: 'TCDMX',
      template: 'active_subscriptions',
      site_url: 'https://tcdmx.com',
    }))).toBe(true)

    expect(supportsExternalQuotaProgress(status({
      provider: 'openrouter',
      name: 'OpenRouter',
      template: 'openrouter_credits',
      site_url: 'https://openrouter.ai',
    }))).toBe(true)

    expect(supportsExternalQuotaProgress(status({
      provider: 'buzz',
      name: 'Buzz',
      template: 'buzz_balance',
      site_url: 'https://buzzai.cc',
    }))).toBe(false)
  })

  it('does not show when only a total limit is available', () => {
    expect(buildExternalQuotaProgressMeta(status({
      total_limit_usd: 60,
      remaining_usd: undefined,
    }))).toBeNull()
  })

  it('does not build account quota progress until the account setting is enabled', () => {
    const meta = buildAccountExternalQuotaProgressMeta(status({
      total_limit_usd: 60,
      remaining_usd: 16.17,
    }), {
      enabled: false,
      mode: 'status_total',
      customTotal: null,
    })

    expect(meta).toBeNull()
  })

  it('builds account quota progress from provider total and remaining balance', () => {
    const meta = buildAccountExternalQuotaProgressMeta(status({
      total_limit_usd: 60,
      remaining_usd: 16.17,
    }), {
      enabled: true,
      mode: 'status_total',
      customTotal: null,
    })

    expect(meta).toMatchObject({
      provider: 'rawchat',
      total: 60,
      remaining: 16.17,
      used: 43.83,
      tone: 'warning',
    })
    expect(meta?.percent).toBeCloseTo(73.05)
  })

  it('builds account quota progress from provider total and used quota when remaining is absent', () => {
    const meta = buildAccountExternalQuotaProgressMeta(status({
      total_limit_usd: 60,
      used_usd: 12,
      remaining_usd: undefined,
    }), {
      enabled: true,
      mode: 'status_total',
      customTotal: null,
    })

    expect(meta).toMatchObject({
      provider: 'rawchat',
      total: 60,
      used: 12,
      remaining: 48,
      tone: 'safe',
    })
    expect(meta?.percent).toBeCloseTo(20)
  })

  it('builds account quota progress from a custom total when provider total is absent', () => {
    const preference: AccountExternalQuotaProgressPreference = {
      enabled: true,
      mode: 'custom_total',
      customTotal: 100,
    }

    const meta = buildAccountExternalQuotaProgressMeta(status({
      total_limit_usd: undefined,
      remaining_usd: 42,
    }), preference)

    expect(meta).toMatchObject({
      total: 100,
      remaining: 42,
      used: 58,
      tone: 'safe',
    })
    expect(meta?.percent).toBeCloseTo(58)
  })

  it('builds account quota progress for non-whitelisted providers when a custom total is set', () => {
    const preference: AccountExternalQuotaProgressPreference = {
      enabled: true,
      mode: 'custom_total',
      customTotal: 80,
    }

    const meta = buildAccountExternalQuotaProgressMeta(status({
      provider: 'buzz',
      name: 'Buzz',
      template: 'buzz_balance',
      site_url: 'https://buzzai.cc',
      remaining_usd: 20,
      total_limit_usd: undefined,
    }), preference)

    expect(meta).toMatchObject({
      provider: 'buzz',
      total: 80,
      remaining: 20,
      used: 60,
      tone: 'warning',
    })
    expect(meta?.percent).toBeCloseTo(75)
  })

  it('uses the official quota tone thresholds for external account quota bars', () => {
    expect(buildAccountExternalQuotaProgressMeta(status({
      provider: 'custom-provider',
      name: 'Custom Provider',
      template: 'newapi_console',
      remaining_usd: 31,
      total_limit_usd: 100,
    }), {
      enabled: true,
      mode: 'status_total',
      customTotal: null,
    })?.tone).toBe('safe')

    expect(buildAccountExternalQuotaProgressMeta(status({
      provider: 'custom-provider',
      name: 'Custom Provider',
      template: 'newapi_console',
      remaining_usd: 30,
      total_limit_usd: 100,
    }), {
      enabled: true,
      mode: 'status_total',
      customTotal: null,
    })?.tone).toBe('warning')

    expect(buildAccountExternalQuotaProgressMeta(status({
      provider: 'custom-provider',
      name: 'Custom Provider',
      template: 'newapi_console',
      remaining_usd: 10,
      total_limit_usd: 100,
    }), {
      enabled: true,
      mode: 'status_total',
      customTotal: null,
    })?.tone).toBe('danger')
  })

  it('builds account quota progress for non-whitelisted providers from provider total on account cards', () => {
    const meta = buildAccountExternalQuotaProgressMeta(status({
      provider: 'buzz',
      name: 'Buzz',
      template: 'buzz_balance',
      site_url: 'https://buzzai.cc',
      remaining_usd: 20,
      total_limit_usd: 80,
    }), {
      enabled: true,
      mode: 'status_total',
      customTotal: null,
    })

    expect(meta).toMatchObject({
      provider: 'buzz',
      total: 80,
      remaining: 20,
      used: 60,
      tone: 'warning',
    })
    expect(meta?.percent).toBeCloseTo(75)
  })

  it('builds account quota progress from local token usage and a custom token total', () => {
    const preference: AccountExternalQuotaProgressPreference = {
      enabled: true,
      mode: 'token_total',
      customTotal: null,
      tokenTotal: 1_000_000,
      tokenResetAt: '2026-06-11T00:00:00.000Z',
    }

    const meta = buildAccountExternalQuotaProgressMeta(status({
      provider: 'mimo',
      name: 'Xiaomi MiMo',
      template: 'mimo_token_plan',
      site_url: 'https://platform.xiaomimimo.com',
      configured: true,
      total_limit_usd: undefined,
      remaining_usd: undefined,
      used_usd: 0,
    }), preference, {
      tokenStats: {
        requests: 12,
        tokens: 250_000,
        cost: 0,
        standard_cost: 0,
        user_cost: 0,
      },
    })

    expect(meta).toMatchObject({
      provider: 'mimo',
      total: 1_000_000,
      used: 250_000,
      remaining: 750_000,
      tone: 'safe',
      unit: 'tokens',
    })
    expect(meta?.percent).toBeCloseTo(25)
  })

  it('does not show token quota progress until backend window stats are present', () => {
    const preference: AccountExternalQuotaProgressPreference = {
      enabled: true,
      mode: 'token_total',
      customTotal: null,
      tokenTotal: 1_000_000,
      tokenResetAt: '2026-06-11T00:00:00.000Z',
    }

    expect(buildAccountExternalQuotaProgressMeta(status({
      provider: 'mimo',
      name: 'Xiaomi MiMo',
      template: 'mimo_token_plan',
      site_url: 'https://platform.xiaomimimo.com',
      configured: true,
      total_limit_usd: undefined,
      remaining_usd: undefined,
      used_usd: 0,
    }), preference)).toBeNull()
  })

  it('builds token quota progress without an external subscription status', () => {
    const preference: AccountExternalQuotaProgressPreference = {
      enabled: true,
      mode: 'token_total',
      customTotal: null,
      tokenTotal: 500_000,
      tokenResetAt: '2026-06-11T00:00:00.000Z',
    }

    const meta = buildAccountExternalQuotaProgressMeta(null, preference, {
      tokenStats: {
        requests: 3,
        tokens: 125_000,
        cost: 0,
        standard_cost: 0,
        user_cost: 0,
      },
    })

    expect(meta).toMatchObject({
      provider: 'account',
      total: 500_000,
      used: 125_000,
      remaining: 375_000,
      tone: 'safe',
      unit: 'tokens',
    })
    expect(meta?.percent).toBeCloseTo(25)
  })
})
