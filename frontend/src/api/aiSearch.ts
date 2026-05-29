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
  answer?: string
  results: AISearchResult[]
}

export interface AISearchSnippetConfig {
  configured: boolean
  api_url: string
  instance_id: string
  namespace: string
}

export const aiSearchAPI = {
  async getSnippetConfig(): Promise<AISearchSnippetConfig> {
    const { data } = await apiClient.get<AISearchSnippetConfig>('/ai-search/snippet-config')
    return data
  },

  async search(query: string): Promise<AISearchResponse> {
    const trimmed = query.trim()
    const { data } = await apiClient.post<AISearchResponse>('/ai-search/search', { query: trimmed })
    return data
  }
}

export default aiSearchAPI
