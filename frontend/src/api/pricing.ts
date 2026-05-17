/**
 * User-visible global model pricing API.
 */

import { apiClient } from './client'

export interface GlobalPricingItem {
  model: string
  provider: string
  mode: string
  input_price: number
  input_priority_price: number
  output_price: number
  output_priority_price: number
  cache_write_price: number
  cache_write_1h_price: number
  cache_read_price: number
  cache_read_priority_price: number
  image_output_price: number
  image_output_token_price: number
  supports_prompt_caching: boolean
  supports_service_tier: boolean
  long_context_input_token_threshold: number
  long_context_input_cost_multiplier: number
  long_context_output_cost_multiplier: number
}

export interface GlobalPricingResponse {
  items: GlobalPricingItem[]
  model_count: number
  last_updated: string
  local_hash: string
}

export async function getGlobalPricing(options?: { signal?: AbortSignal }): Promise<GlobalPricingResponse> {
  const { data } = await apiClient.get<GlobalPricingResponse>('/pricing/global', {
    signal: options?.signal,
  })
  return data
}

export const pricingAPI = { getGlobalPricing }

export default pricingAPI
