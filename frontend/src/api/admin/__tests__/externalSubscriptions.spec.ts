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

  it('merges generic statuses with legacy provider-specific balances for display surfaces', async () => {
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
        data: {
          provider: 'tcdmx',
          enabled: true,
          configured: true,
          currency: 'USD',
          site_url: 'https://tcdmx.com',
          used_usd: 12,
          remaining_usd: 88,
          active_count: 1,
          subscriptions: [],
        },
      })
      .mockResolvedValueOnce({
        data: {
          provider: 'qlhazycoder',
          enabled: true,
          configured: true,
          currency: 'CNY',
          site_url: 'https://api.qlhazycoder.top',
          used_usd: 48,
          remaining_usd: 101,
          active_count: 1,
          subscriptions: [],
        },
      })
      .mockResolvedValueOnce({
        data: {
          provider: 'packycode',
          enabled: true,
          configured: true,
          currency: 'CNY',
          site_url: 'https://www.packyapi.com',
          used_usd: 31,
          remaining_usd: 89,
          active_count: 1,
          subscriptions: [],
        },
      })
      .mockResolvedValueOnce({
        data: {
          provider: 'xhyapi',
          enabled: true,
          configured: true,
          currency: 'USD',
          site_url: 'https://xhyapi.com',
          used_usd: 13,
          remaining_usd: 67,
          active_count: 1,
          subscriptions: [],
        },
      })
      .mockResolvedValueOnce({
        data: {
          provider: 'pixel',
          enabled: true,
          configured: true,
          currency: 'USD',
          site_url: 'https://ai-pixel.online',
          used_usd: 8,
          remaining_usd: 62,
          active_count: 1,
          subscriptions: [],
        },
      })
      .mockResolvedValueOnce({
        data: {
          provider: 'liust',
          enabled: true,
          configured: true,
          currency: 'USD',
          site_url: 'https://liust.xyz',
          used_usd: 14,
          remaining_usd: 76,
          active_count: 1,
          subscriptions: [],
        },
      })

    const result = await externalSubscriptionsAPI.getDisplayStatuses()

    expect(apiClient.get).toHaveBeenCalledWith('/admin/external-subscriptions/statuses')
    expect(apiClient.get).toHaveBeenCalledWith('/admin/tcdmx/subscription')
    expect(apiClient.get).toHaveBeenCalledWith('/admin/qlhazycoder/subscription')
    expect(apiClient.get).toHaveBeenCalledWith('/admin/packycode/subscription')
    expect(apiClient.get).toHaveBeenCalledWith('/admin/xhyapi/subscription')
    expect(apiClient.get).toHaveBeenCalledWith('/admin/pixel/subscription')
    expect(apiClient.get).toHaveBeenCalledWith('/admin/liust/subscription')
    expect(result.map(status => status.provider)).toEqual([
      'tcdmx',
      'qlhazycoder',
      'packycode',
      'xhyapi',
      'pixel',
      'liust',
      'openrouter',
    ])
    expect(result.find(status => status.provider === 'qlhazycoder')?.remaining_usd).toBe(101)
    expect(result.find(status => status.provider === 'openrouter')?.remaining_usd).toBe(21)
  })

  it('caches display statuses briefly so header and account cards do not refetch every legacy provider', async () => {
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
      .mockResolvedValue({
        data: {
          provider: 'tcdmx',
          enabled: false,
          configured: false,
          currency: 'USD',
          site_url: 'https://tcdmx.com',
          used_usd: 0,
          active_count: 0,
          subscriptions: [],
        },
      })

    const first = await externalSubscriptionsAPI.getDisplayStatuses()
    const second = await externalSubscriptionsAPI.getDisplayStatuses()

    expect(first.find(status => status.provider === 'openrouter')?.remaining_usd).toBe(21)
    expect(second.find(status => status.provider === 'openrouter')?.remaining_usd).toBe(21)
    expect(apiClient.get).toHaveBeenCalledTimes(7)
  })

  it('deletes a provider by id', async () => {
    vi.mocked(apiClient.delete).mockResolvedValueOnce({ data: { deleted: true } })

    await externalSubscriptionsAPI.deleteProvider('custom-provider')

    expect(apiClient.delete).toHaveBeenCalledWith('/admin/external-subscriptions/custom-provider')
  })
})
