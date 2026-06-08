import { beforeEach, describe, expect, it, vi } from 'vitest'

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
    externalSubscriptionsAPI.clearDisplayStatusesCache()
  })

  it('lists configurable providers without exposing secrets', async () => {
    vi.mocked(apiClient.get).mockResolvedValueOnce({
      data: [
        {
          id: 'qlhazycoder',
          name: 'qlhazycoder',
          enabled: true,
          template: 'newapi_console',
          api_base_url: 'https://api.qlhazycoder.top',
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
        api_base_url: 'https://newapi.example',
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
        api_base_url: 'https://renamed.example',
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
      api_base_url: 'https://newapi.example',
      api_token: 'secret',
      match_keywords: ['newapi.example'],
      sort_order: 70,
    })
    await externalSubscriptionsAPI.updateProvider('custom-newapi', {
      name: 'Renamed NewAPI',
      enabled: true,
      template: 'newapi_console',
      api_base_url: 'https://renamed.example',
      match_keywords: ['renamed.example'],
      sort_order: 70,
    })

    expect(apiClient.post).toHaveBeenCalledWith('/admin/external-subscriptions', expect.objectContaining({
      id: 'custom-newapi',
      template: 'newapi_console',
    }))
    expect(apiClient.put).toHaveBeenCalledWith('/admin/external-subscriptions/custom-newapi', expect.objectContaining({
      name: 'Renamed NewAPI',
    }))
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

  it('deletes a provider by id', async () => {
    vi.mocked(apiClient.delete).mockResolvedValueOnce({ data: { deleted: true } })

    await externalSubscriptionsAPI.deleteProvider('custom-provider')

    expect(apiClient.delete).toHaveBeenCalledWith('/admin/external-subscriptions/custom-provider')
  })
})
