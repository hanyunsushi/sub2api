import { describe, expect, it } from 'vitest'

import type { ExternalSubscriptionStatus } from '@/api/admin/externalSubscriptions'
import type { Account } from '@/types'
import {
  buildExternalSubscriptionSearchText,
  findMatchingExternalSubscription,
} from '../externalSubscriptionMatch'

const status = (
  provider: string,
  matchKeywords: string[],
  overrides: Partial<ExternalSubscriptionStatus> = {},
): ExternalSubscriptionStatus => ({
  provider,
  name: provider,
  template: 'buzz_balance',
  balance_strategy: 'auto',
  enabled: true,
  configured: true,
  api_token_configured: true,
  refresh_token_configured: false,
  match_keywords: matchKeywords,
  sort_order: 0,
  currency: 'USD',
  site_url: `https://${provider}.example.com`,
  used_usd: 0,
  active_count: 0,
  subscriptions: [],
  ...overrides,
})

const account = (overrides: Partial<Account>): Account => ({
  id: 1,
  name: 'account',
  platform: 'anthropic',
  type: 'oauth',
  proxy_id: null,
  concurrency: 1,
  priority: 1,
  status: 'active',
  error_message: null,
  last_used_at: null,
  expires_at: null,
  auto_pause_on_expired: false,
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-01T00:00:00Z',
  schedulable: true,
  rate_limited_at: null,
  rate_limit_reset_at: null,
  overload_until: null,
  temp_unschedulable_until: null,
  temp_unschedulable_reason: null,
  session_window_start: null,
  session_window_end: null,
  session_window_status: null,
  ...overrides,
})

describe('external subscription account matching', () => {
  it('prefers QL for ql-claude accounts instead of matching Buzz through a generic claude keyword', () => {
    const qlClaude = account({
      name: 'ql-claude',
      custom_base_url: 'https://api.qlhazycoder.top/v1',
    })
    const buzz = status('buzz', ['buzz', 'buzzai.cc', 'claude'], { remaining_usd: 1 })
    const ql = status('qlhazycoder', ['ql', 'qlhazycoder', 'api.qlhazycoder.top'], { remaining_usd: 9 })

    expect(findMatchingExternalSubscription(qlClaude, [buzz, ql])?.provider).toBe('qlhazycoder')
  })

  it('does not use generic model-family keywords as account-card subscription matches', () => {
    const plainClaude = account({
      name: 'claude-main',
      custom_base_url: 'https://api.anthropic.com',
    })
    const buzz = status('buzz', ['buzz', 'buzzai.cc', 'claude'], { remaining_usd: 1 })

    expect(findMatchingExternalSubscription(plainClaude, [buzz])).toBeNull()
  })

  it('still matches provider-specific domains and aliases', () => {
    const buzzAccount = account({
      name: 'team balance',
      custom_base_url: 'https://buzzai.cc/v1',
    })
    const buzz = status('buzz', ['buzz', 'buzzai.cc', 'claude'], { remaining_usd: 1 })

    expect(buildExternalSubscriptionSearchText(buzzAccount)).toContain('buzzai.cc')
    expect(findMatchingExternalSubscription(buzzAccount, [buzz])?.provider).toBe('buzz')
  })
})
