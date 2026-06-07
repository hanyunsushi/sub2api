import { apiClient } from '@/api/client'

export type ExternalSubscriptionTemplate =
  | 'newapi_console'
  | 'active_subscriptions'
  | 'openrouter_credits'
  | 'cloudflare_ai_gateway_credits'

export interface ExternalSubscriptionItem {
  id: number
  group_id: number
  group_name: string
  status: string
  window: 'daily' | 'weekly' | 'monthly' | 'unlimited' | 'subscription' | string
  limit_usd?: number
  used_usd: number
  remaining_usd?: number
  expires_at?: string
  days_remaining?: number
}

export interface ExternalSubscriptionProvider {
  id: string
  name: string
  enabled: boolean
  template: ExternalSubscriptionTemplate
  api_base_url: string
  api_token_configured: boolean
  user_id?: string
  refresh_token_configured: boolean
  match_keywords: string[]
  sort_order: number
}

export interface ExternalSubscriptionProviderInput {
  id?: string
  name: string
  enabled: boolean
  template: ExternalSubscriptionTemplate
  api_base_url: string
  api_token?: string
  user_id?: string
  refresh_token?: string
  match_keywords: string[]
  sort_order: number
}

export interface ExternalSubscriptionStatus {
  provider: string
  name: string
  template: ExternalSubscriptionTemplate
  enabled: boolean
  configured: boolean
  api_token_configured: boolean
  refresh_token_configured: boolean
  match_keywords: string[]
  sort_order: number
  currency: 'USD' | 'CNY' | string
  site_url: string
  error_code?: string
  error_message?: string
  total_limit_usd?: number
  used_usd: number
  remaining_usd?: number
  expires_at?: string
  days_remaining?: number
  active_count: number
  subscriptions: ExternalSubscriptionItem[]
  refreshed_at?: string
}

export async function listProviders(): Promise<ExternalSubscriptionProvider[]> {
  const { data } = await apiClient.get<ExternalSubscriptionProvider[]>('/admin/external-subscriptions')
  return data
}

export async function createProvider(input: ExternalSubscriptionProviderInput): Promise<ExternalSubscriptionProvider> {
  const { data } = await apiClient.post<ExternalSubscriptionProvider>('/admin/external-subscriptions', input)
  return data
}

export async function updateProvider(id: string, input: ExternalSubscriptionProviderInput): Promise<ExternalSubscriptionProvider> {
  const { data } = await apiClient.put<ExternalSubscriptionProvider>(`/admin/external-subscriptions/${encodeURIComponent(id)}`, input)
  return data
}

export async function deleteProvider(id: string): Promise<void> {
  await apiClient.delete(`/admin/external-subscriptions/${encodeURIComponent(id)}`)
}

export async function getStatuses(): Promise<ExternalSubscriptionStatus[]> {
  const { data } = await apiClient.get<ExternalSubscriptionStatus[]>('/admin/external-subscriptions/statuses')
  return data
}

export default {
  listProviders,
  createProvider,
  updateProvider,
  deleteProvider,
  getStatuses,
}
