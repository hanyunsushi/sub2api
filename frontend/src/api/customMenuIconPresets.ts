import { apiClient } from '@/api/client'

export interface AppendCustomMenuSVGIconPresetResponse {
  custom_menu_svg_icon_presets: string[]
}

export async function appendCustomMenuSVGIconPreset(url: string): Promise<AppendCustomMenuSVGIconPresetResponse> {
  const { data } = await apiClient.post<AppendCustomMenuSVGIconPresetResponse>(
    '/settings/custom-menu-svg-icon-presets',
    { url }
  )
  return data
}
