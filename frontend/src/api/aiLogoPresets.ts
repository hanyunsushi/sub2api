import { apiClient } from '@/api/client'

export interface AppendCustomAILogoPresetResponse {
  custom_ai_logo_presets: string[]
}

export async function appendCustomAILogoPreset(url: string): Promise<AppendCustomAILogoPresetResponse> {
  const { data } = await apiClient.post<AppendCustomAILogoPresetResponse>('/settings/ai-logo-presets', { url })
  return data
}

export async function deleteCustomAILogoPreset(url: string): Promise<AppendCustomAILogoPresetResponse> {
  const { data } = await apiClient.delete<AppendCustomAILogoPresetResponse>('/settings/ai-logo-presets', {
    data: { url },
  })
  return data
}
