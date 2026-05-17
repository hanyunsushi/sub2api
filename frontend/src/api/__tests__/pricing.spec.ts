import { describe, expect, it, vi } from 'vitest'

vi.mock('@/api/client', () => ({
  apiClient: {
    get: vi.fn().mockResolvedValue({
      data: {
        items: [],
        model_count: 0,
        last_updated: '2026-05-17T00:00:00Z',
        local_hash: 'abcdef12',
      },
    }),
  },
}))

describe('pricing api', () => {
  it('loads authenticated global pricing from the user-visible endpoint', async () => {
    const { apiClient } = await import('@/api/client')
    const { getGlobalPricing } = await import('@/api/pricing')

    const result = await getGlobalPricing()

    expect(apiClient.get).toHaveBeenCalledWith('/pricing/global', { signal: undefined })
    expect(result.model_count).toBe(0)
    expect(result.items).toEqual([])
  })
})
