import { beforeEach, describe, expect, it, vi } from 'vitest'

const post = vi.fn()

vi.mock('@/api/client', () => ({
  apiClient: {
    post
  }
}))

describe('AI Search API adapter', () => {
  beforeEach(() => {
    post.mockReset()
  })

  it('posts trimmed search queries to the user AI Search endpoint', async () => {
    post.mockResolvedValueOnce({
      data: {
        query: 'FAQ',
        configured: true,
        answer: 'FAQ 可以在右上角 ask ai 中查询。',
        results: []
      }
    })

    const aiSearchAPI = (await import('@/api/aiSearch')).default

    const result = await aiSearchAPI.search('  FAQ  ')

    expect(post).toHaveBeenCalledWith('/ai-search/search', { query: 'FAQ' })
    expect(result.configured).toBe(true)
    expect(result.answer).toBe('FAQ 可以在右上角 ask ai 中查询。')
  })
})
