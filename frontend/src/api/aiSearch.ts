import { apiClient } from './client'

export interface AISearchResult {
  id: string
  title: string
  snippet: string
  url?: string
  source: string
  score: number
}

export interface AISearchResponse {
  query: string
  configured: boolean
  results: AISearchResult[]
}

export const aiSearchAPI = {
  async search(query: string): Promise<AISearchResponse> {
    const trimmed = query.trim()
    const { data } = await apiClient.post<AISearchResponse>('/ai-search/search', { query: trimmed })
    return data
  }
}

export default aiSearchAPI
