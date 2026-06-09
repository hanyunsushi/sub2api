import { beforeEach, describe, expect, it, vi } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

import { apiClient } from '@/api/client'
import externalSubscriptionsAPI from '@/api/admin/externalSubscriptions'

vi.mock('@/api/client', () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}))

describe('admin external subscriptions api', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.clearAllMocks()
    localStorage.clear()
    externalSubscriptionsAPI.clearStoredDisplayStatusesCache()
  })

  it('lists configurable providers without exposing secrets', async () => {
    vi.mocked(apiClient.get).mockResolvedValueOnce({
      data: [
        {
          id: 'qlhazycoder',
          name: 'qlhazycoder',
          enabled: true,
          template: 'newapi_console',
          balance_strategy: 'newapi_user_quota',
          api_base_url: 'https://api.qlhazycoder.top',
          logo_url: 'https://cdn.example.com/qlhazy.png',
          api_token_configured: true,
          user_id: '707',
          refresh_token_configured: false,
          match_keywords: ['qlhazycoder'],
          sort_order: 20,
        },
      ],
    })

    const result = await externalSubscriptionsAPI.listProviders()

    expect(apiClient.get).toHaveBeenCalledWith('/admin/external-subscriptions')
    expect(result[0].id).toBe('qlhazycoder')
    expect(result[0].balance_strategy).toBe('newapi_user_quota')
    expect(result[0].logo_url).toBe('https://cdn.example.com/qlhazy.png')
    expect(result[0]).not.toHaveProperty('api_token')
    expect(result[0]).not.toHaveProperty('refresh_token')
  })

  it('creates and updates providers through the generic endpoint', async () => {
    vi.mocked(apiClient.post).mockResolvedValueOnce({
      data: {
        id: 'custom-newapi',
        name: 'Custom NewAPI',
        enabled: true,
        template: 'newapi_console',
        balance_strategy: 'newapi_user_quota',
        api_base_url: 'https://newapi.example',
        logo_url: 'https://cdn.example.com/custom.png',
        api_token_configured: true,
        refresh_token_configured: false,
        match_keywords: ['newapi.example'],
        sort_order: 70,
      },
    })
    vi.mocked(apiClient.put).mockResolvedValueOnce({
      data: {
        id: 'custom-newapi',
        name: 'Renamed NewAPI',
        enabled: true,
        template: 'newapi_console',
        balance_strategy: 'newapi_subscription',
        api_base_url: 'https://renamed.example',
        logo_url: 'https://cdn.example.com/renamed.png',
        api_token_configured: true,
        refresh_token_configured: false,
        match_keywords: ['renamed.example'],
        sort_order: 70,
      },
    })

    await externalSubscriptionsAPI.createProvider({
      id: 'custom-newapi',
      name: 'Custom NewAPI',
      enabled: true,
      template: 'newapi_console',
      balance_strategy: 'newapi_user_quota',
      api_base_url: 'https://newapi.example',
      logo_url: 'https://cdn.example.com/custom.png',
      api_token: 'secret',
      match_keywords: ['newapi.example'],
      sort_order: 70,
    })
    await externalSubscriptionsAPI.updateProvider('custom-newapi', {
      name: 'Renamed NewAPI',
      enabled: true,
      template: 'newapi_console',
      balance_strategy: 'newapi_subscription',
      api_base_url: 'https://renamed.example',
      logo_url: 'https://cdn.example.com/renamed.png',
      match_keywords: ['renamed.example'],
      sort_order: 70,
    })

    expect(apiClient.post).toHaveBeenCalledWith('/admin/external-subscriptions', expect.objectContaining({
      id: 'custom-newapi',
      template: 'newapi_console',
      balance_strategy: 'newapi_user_quota',
      logo_url: 'https://cdn.example.com/custom.png',
    }))
    expect(apiClient.put).toHaveBeenCalledWith('/admin/external-subscriptions/custom-newapi', expect.objectContaining({
      name: 'Renamed NewAPI',
      balance_strategy: 'newapi_subscription',
      logo_url: 'https://cdn.example.com/renamed.png',
    }))
  })

  it('accepts the RawChat external subscription template in provider payloads', async () => {
    vi.mocked(apiClient.post).mockResolvedValueOnce({
      data: {
        id: 'rawchat',
        name: 'RawChat',
        enabled: true,
        template: 'rawchat_subscriptions',
        balance_strategy: 'auto',
        api_base_url: 'https://rawchat.cn',
        api_token_configured: true,
        refresh_token_configured: false,
        match_keywords: ['rawchat'],
        sort_order: 65,
      },
    })

    const created = await externalSubscriptionsAPI.createProvider({
      id: 'rawchat',
      name: 'RawChat',
      enabled: true,
      template: 'rawchat_subscriptions',
      balance_strategy: 'auto',
      api_base_url: 'https://rawchat.cn',
      api_token: 'rawchat-token',
      match_keywords: ['rawchat'],
      sort_order: 65,
    })

    expect(apiClient.post).toHaveBeenCalledWith('/admin/external-subscriptions', expect.objectContaining({
      id: 'rawchat',
      template: 'rawchat_subscriptions',
      api_base_url: 'https://rawchat.cn',
    }))
    expect(created.template).toBe('rawchat_subscriptions')
  })

  it('clears stored display snapshots after provider configuration changes', async () => {
    vi.mocked(apiClient.get).mockResolvedValueOnce({
      data: [
        {
          provider: 'openrouter',
          name: 'OpenRouter',
          template: 'openrouter_credits',
          enabled: true,
          configured: true,
          api_token_configured: true,
          refresh_token_configured: false,
          match_keywords: ['openrouter'],
          sort_order: 70,
          currency: 'USD',
          site_url: 'https://openrouter.ai',
          used_usd: 4,
          remaining_usd: 21,
          active_count: 0,
          subscriptions: [],
        },
      ],
    })
    vi.mocked(apiClient.post).mockResolvedValueOnce({
      data: {
        id: 'custom-newapi',
        name: 'Custom NewAPI',
        enabled: true,
        template: 'newapi_console',
        api_base_url: 'https://newapi.example',
        api_token_configured: true,
        refresh_token_configured: false,
        match_keywords: ['newapi.example'],
        sort_order: 70,
      },
    })

    await externalSubscriptionsAPI.getDisplayStatuses()
    vi.resetModules()
    const reloadedBeforeChange = await import('@/api/admin/externalSubscriptions')
    expect((await reloadedBeforeChange.default.getDisplayStatuses()).map(status => status.provider)).toEqual(['openrouter'])

    await reloadedBeforeChange.default.createProvider({
      id: 'custom-newapi',
      name: 'Custom NewAPI',
      enabled: true,
      template: 'newapi_console',
      api_base_url: 'https://newapi.example',
      api_token: 'secret',
      match_keywords: ['newapi.example'],
      sort_order: 70,
    })
    vi.resetModules()
    vi.mocked(apiClient.get).mockRejectedValueOnce(new Error('no stale provider after edit'))
    const reloadedAfterChange = await import('@/api/admin/externalSubscriptions')

    await expect(reloadedAfterChange.default.getDisplayStatuses()).rejects.toThrow('no stale provider after edit')
  })

  it('uses a fresh display status storage namespace after RawChat balance parsing changes', () => {
    expect(readFileSync(resolve(__dirname, '../externalSubscriptions.ts'), 'utf8')).toContain(
      'sub2api.externalSubscriptionDisplayStatuses.v2',
    )
  })

  it('refreshes display statuses immediately after provider logo changes', async () => {
    vi.mocked(apiClient.put).mockResolvedValueOnce({
      data: {
        id: 'pixel',
        name: 'Pixel',
        enabled: true,
        template: 'active_subscriptions',
        balance_strategy: 'active_with_auth_me_balance',
        api_base_url: 'https://ai-pixel.online',
        logo_url: 'https://cdn.example.com/pixel-new.png',
        api_token_configured: true,
        refresh_token_configured: false,
        match_keywords: ['pixel'],
        sort_order: 50,
      },
    })
    vi.mocked(apiClient.get).mockResolvedValueOnce({
      data: [
        {
          provider: 'pixel',
          name: 'Pixel',
          template: 'active_subscriptions',
          balance_strategy: 'active_with_auth_me_balance',
          enabled: true,
          configured: true,
          logo_url: 'https://cdn.example.com/pixel-new.png',
          api_token_configured: true,
          refresh_token_configured: false,
          match_keywords: ['pixel'],
          sort_order: 50,
          currency: 'USD',
          site_url: 'https://ai-pixel.online',
          used_usd: 8,
          remaining_usd: 62,
          active_count: 1,
          subscriptions: [],
        },
      ],
    })

    await externalSubscriptionsAPI.updateProvider('pixel', {
      name: 'Pixel',
      enabled: true,
      template: 'active_subscriptions',
      balance_strategy: 'active_with_auth_me_balance',
      api_base_url: 'https://ai-pixel.online',
      logo_url: 'https://cdn.example.com/pixel-new.png',
      match_keywords: ['pixel'],
      sort_order: 50,
    })
    const refreshed = await externalSubscriptionsAPI.getDisplayStatuses()

    expect(apiClient.get).toHaveBeenCalledWith('/admin/external-subscriptions/statuses', {
      params: { refresh: 1, _: expect.any(Number) },
    })
    expect(refreshed[0].logo_url).toBe('https://cdn.example.com/pixel-new.png')
  })

  it('loads all provider statuses for the header and account cards', async () => {
    vi.mocked(apiClient.get).mockResolvedValueOnce({
      data: [
        {
          provider: 'packycode',
          name: 'PackyCode',
          template: 'newapi_console',
          enabled: true,
          configured: true,
          logo_url: 'https://cdn.example.com/packy.png',
          api_token_configured: true,
          refresh_token_configured: false,
          match_keywords: ['packycode'],
          sort_order: 60,
          currency: 'CNY',
          site_url: 'https://www.packyapi.com',
          used_usd: 31.2,
          remaining_usd: 88.8,
          active_count: 1,
          subscriptions: [],
        },
      ],
    })

    const result = await externalSubscriptionsAPI.getStatuses()

    expect(apiClient.get).toHaveBeenCalledWith('/admin/external-subscriptions/statuses')
    expect(result[0].provider).toBe('packycode')
    expect(result[0].logo_url).toBe('https://cdn.example.com/packy.png')
    expect(result[0].remaining_usd).toBe(88.8)
    expect(result[0]).not.toHaveProperty('api_token')
  })

  it('loads display statuses from the unified generic endpoint only', async () => {
    vi.mocked(apiClient.get).mockResolvedValueOnce({
      data: [
        {
          provider: 'buzz',
          name: 'Buzz',
          template: 'buzz_balance',
          enabled: true,
          configured: true,
          api_token_configured: true,
          refresh_token_configured: false,
          match_keywords: ['buzz', 'buzzai', 'claude'],
          sort_order: 5,
          currency: 'USD',
          site_url: 'https://buzzai.cc',
          total_limit_usd: 100,
          used_usd: 12.34,
          remaining_usd: 87.66,
          active_count: 1,
          subscriptions: [],
        },
        {
          provider: 'qlhazycoder',
          name: 'QLHazyCoder',
          template: 'newapi_console',
          enabled: true,
          configured: true,
          api_token_configured: true,
          refresh_token_configured: false,
          match_keywords: ['qlhazycoder'],
          sort_order: 20,
          currency: 'CNY',
          site_url: 'https://api.qlhazycoder.top',
          used_usd: 48,
          remaining_usd: 101,
          active_count: 1,
          subscriptions: [],
        },
        {
          provider: 'openrouter',
          name: 'OpenRouter',
          template: 'openrouter_credits',
          enabled: true,
          configured: true,
          api_token_configured: true,
          refresh_token_configured: false,
          match_keywords: ['openrouter'],
          sort_order: 70,
          currency: 'USD',
          site_url: 'https://openrouter.ai',
          used_usd: 4,
          remaining_usd: 21,
          active_count: 0,
          subscriptions: [],
        },
      ],
    })

    const result = await externalSubscriptionsAPI.getDisplayStatuses()

    expect(apiClient.get).toHaveBeenCalledWith('/admin/external-subscriptions/statuses')
    expect(apiClient.get).not.toHaveBeenCalledWith('/admin/buzz/balance')
    expect(apiClient.get).not.toHaveBeenCalledWith('/admin/tcdmx/subscription')
    expect(apiClient.get).not.toHaveBeenCalledWith('/admin/qlhazycoder/subscription')
    expect(apiClient.get).not.toHaveBeenCalledWith('/admin/packycode/subscription')
    expect(apiClient.get).not.toHaveBeenCalledWith('/admin/xhyapi/subscription')
    expect(apiClient.get).not.toHaveBeenCalledWith('/admin/pixel/subscription')
    expect(apiClient.get).not.toHaveBeenCalledWith('/admin/liust/subscription')
    expect(apiClient.get).toHaveBeenCalledTimes(1)
    expect(result.map(status => status.provider)).toEqual([
      'buzz',
      'qlhazycoder',
      'openrouter',
    ])
    expect(result.find(status => status.provider === 'buzz')?.remaining_usd).toBe(87.66)
    expect(result.find(status => status.provider === 'qlhazycoder')?.remaining_usd).toBe(101)
    expect(result.find(status => status.provider === 'openrouter')?.remaining_usd).toBe(21)
  })

  it('loads Buzz from the generic display-status contract instead of a separate balance API', async () => {
    vi.mocked(apiClient.get)
      .mockResolvedValueOnce({
        data: [
          {
            provider: 'buzz',
            name: 'Buzz',
            template: 'buzz_balance',
            enabled: true,
            configured: true,
            api_token_configured: true,
            refresh_token_configured: false,
            match_keywords: ['buzz', 'buzzai', 'claude'],
            sort_order: 5,
            currency: 'USD',
            site_url: 'https://buzzai.cc',
            total_limit_usd: 100,
            used_usd: 12.34,
            remaining_usd: 87.66,
            active_count: 1,
            subscriptions: [],
          },
        ],
      })

    const result = await externalSubscriptionsAPI.getDisplayStatuses()

    expect(apiClient.get).toHaveBeenCalledWith('/admin/external-subscriptions/statuses')
    expect(apiClient.get).not.toHaveBeenCalledWith('/admin/buzz/balance')
    expect(result.map(status => status.provider)).toEqual(['buzz'])
    expect(result[0].template).toBe('buzz_balance')
    expect(result[0].remaining_usd).toBe(87.66)
  })

  it('caches display statuses briefly so header and account cards do not refetch every provider', async () => {
    vi.mocked(apiClient.get).mockResolvedValueOnce({
        data: [
          {
            provider: 'openrouter',
            name: 'OpenRouter',
            template: 'openrouter_credits',
            enabled: true,
            configured: true,
            api_token_configured: true,
            refresh_token_configured: false,
            match_keywords: ['openrouter'],
            sort_order: 70,
            currency: 'USD',
            site_url: 'https://openrouter.ai',
            used_usd: 4,
            remaining_usd: 21,
            active_count: 0,
            subscriptions: [],
          },
        ],
      })

    const first = await externalSubscriptionsAPI.getDisplayStatuses()
    const second = await externalSubscriptionsAPI.getDisplayStatuses()

    expect(first.find(status => status.provider === 'openrouter')?.remaining_usd).toBe(21)
    expect(second.find(status => status.provider === 'openrouter')?.remaining_usd).toBe(21)
    expect(apiClient.get).toHaveBeenCalledTimes(1)
  })

  it('returns expired in-memory display statuses immediately and refreshes in the background', async () => {
    vi.mocked(apiClient.get)
      .mockResolvedValueOnce({
        data: [
          {
            provider: 'openrouter',
            name: 'OpenRouter',
            template: 'openrouter_credits',
            enabled: true,
            configured: true,
            api_token_configured: true,
            refresh_token_configured: false,
            match_keywords: ['openrouter'],
            sort_order: 70,
            currency: 'USD',
            site_url: 'https://openrouter.ai',
            used_usd: 4,
            remaining_usd: 21,
            active_count: 0,
            subscriptions: [],
          },
        ],
      })
      .mockResolvedValueOnce({
        data: [
          {
            provider: 'openrouter',
            name: 'OpenRouter',
            template: 'openrouter_credits',
            enabled: true,
            configured: true,
            api_token_configured: true,
            refresh_token_configured: false,
            match_keywords: ['openrouter'],
            sort_order: 70,
            currency: 'USD',
            site_url: 'https://openrouter.ai',
            used_usd: 5,
            remaining_usd: 30,
            active_count: 0,
            subscriptions: [],
          },
        ],
      })

    const first = await externalSubscriptionsAPI.getDisplayStatuses()
    vi.advanceTimersByTime(60_001)
    const second = await externalSubscriptionsAPI.getDisplayStatuses()
    await Promise.resolve()
    await Promise.resolve()
    const third = await externalSubscriptionsAPI.getDisplayStatuses()

    expect(first[0].remaining_usd).toBe(21)
    expect(second[0].remaining_usd).toBe(21)
    expect(third[0].remaining_usd).toBe(30)
    expect(apiClient.get).toHaveBeenCalledTimes(2)
  })

  it('returns the last good display statuses when every source fails after cache expiry', async () => {
    vi.mocked(apiClient.get)
      .mockResolvedValueOnce({
        data: [
          {
            provider: 'openrouter',
            name: 'OpenRouter',
            template: 'openrouter_credits',
            enabled: true,
            configured: true,
            api_token_configured: true,
            refresh_token_configured: false,
            match_keywords: ['openrouter'],
            sort_order: 70,
            currency: 'USD',
            site_url: 'https://openrouter.ai',
            used_usd: 4,
            remaining_usd: 21,
            active_count: 0,
            subscriptions: [],
          },
        ],
      })
      .mockRejectedValue(new Error('all balance sources unavailable'))

    const first = await externalSubscriptionsAPI.getDisplayStatuses()

    vi.advanceTimersByTime(60_001)

    const second = await externalSubscriptionsAPI.getDisplayStatuses()

    expect(first.map(status => status.provider)).toEqual(['openrouter'])
    expect(second.map(status => status.provider)).toEqual(['openrouter'])
    expect(apiClient.get).toHaveBeenCalledTimes(2)
  })

  it('hydrates display statuses from localStorage after a hard page refresh', async () => {
    vi.mocked(apiClient.get).mockResolvedValueOnce({
      data: [
        {
          provider: 'liust',
          name: 'LIUST',
          template: 'newapi_console',
          enabled: true,
          configured: true,
          api_token_configured: true,
          refresh_token_configured: false,
          match_keywords: ['liust'],
          sort_order: 50,
          currency: 'CNY',
          site_url: 'https://liust.xyz',
          used_usd: 2,
          remaining_usd: 14.33,
          active_count: 1,
          subscriptions: [],
        },
      ],
    })

    const first = await externalSubscriptionsAPI.getDisplayStatuses()
    expect(first[0].provider).toBe('liust')

    vi.resetModules()
    vi.mocked(apiClient.get).mockRejectedValueOnce(new Error('slow upstream'))
    const reloaded = await import('@/api/admin/externalSubscriptions')

    const second = await reloaded.default.getDisplayStatuses()

    expect(second.map(status => status.provider)).toEqual(['liust'])
    expect(second[0].remaining_usd).toBe(14.33)
  })

  it('deletes a provider by id', async () => {
    vi.mocked(apiClient.delete).mockResolvedValueOnce({ data: { deleted: true } })

    await externalSubscriptionsAPI.deleteProvider('custom-provider')

    expect(apiClient.delete).toHaveBeenCalledWith('/admin/external-subscriptions/custom-provider')
  })
})
