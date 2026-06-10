import { describe, expect, it } from 'vitest'

import type { ExternalSubscriptionStatus } from '@/api/admin/externalSubscriptions'
import {
  buildExternalQuotaProgressMeta,
  supportsExternalQuotaProgress,
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
})
