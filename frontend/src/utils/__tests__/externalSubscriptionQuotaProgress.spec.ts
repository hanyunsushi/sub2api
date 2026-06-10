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
      tone: 'safe',
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

  it('does not build account quota progress for non-whitelisted providers without a custom total', () => {
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

    expect(meta).toBeNull()
  })
})
