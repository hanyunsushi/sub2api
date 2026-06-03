import { describe, expect, it, vi } from 'vitest'

const post = vi.fn()

vi.mock('@/api/client', () => ({
  apiClient: {
    post,
  },
}))

describe('admin backup API', () => {
  it('allows manual AI Search knowledge sync to wait longer than the default API timeout', async () => {
    post.mockResolvedValueOnce({
      data: { ok: true, message: 'AI Search knowledge sync completed' },
    })

    const backupAPI = (await import('@/api/admin/backup')).default

    await backupAPI.syncAISearchKnowledge()

    expect(post).toHaveBeenCalledWith(
      '/admin/backups/ai-search-sync',
      undefined,
      expect.objectContaining({
        timeout: expect.any(Number),
      })
    )
    expect(post.mock.calls[0][2].timeout).toBeGreaterThan(60000)
  })
})
