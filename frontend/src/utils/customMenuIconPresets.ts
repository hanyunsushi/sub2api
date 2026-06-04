export interface CustomMenuIconPreset {
  id: string
  label: string
  url: string
}

export interface CustomMenuIconRuntimeConfig {
  custom_menu_svg_icon_presets?: string[] | null
}

let runtimeCustomMenuSVGIconPresetURLs: string[] = []

function normalizeHTTPURL(raw?: string | null): string {
  const value = (raw || '').trim()
  if (!value) return ''
  try {
    const parsed = new URL(value)
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return ''
    return parsed.toString()
  } catch {
    return ''
  }
}

function customMenuIconPresetId(url: string): string {
  try {
    const parsed = new URL(url)
    const lastPath = parsed.pathname.split('/').filter(Boolean).pop() || parsed.hostname
    return `custom-menu-${lastPath.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 40) || 'icon'}`
  } catch {
    return 'custom-menu-icon'
  }
}

export function normalizeCustomMenuSVGIconPresetURLs(
  urls?: Array<string | null | undefined> | null,
): string[] {
  const seen = new Set<string>()
  const result: string[] = []
  for (const item of urls ?? []) {
    const url = normalizeHTTPURL(item)
    if (!url || seen.has(url)) continue
    seen.add(url)
    result.push(url)
    if (result.length >= 48) break
  }
  return result
}

export function setCustomMenuIconRuntimeConfig(config?: CustomMenuIconRuntimeConfig | null) {
  runtimeCustomMenuSVGIconPresetURLs = normalizeCustomMenuSVGIconPresetURLs(
    config?.custom_menu_svg_icon_presets,
  )
}

export function rememberCustomMenuSVGIconPreset(rawURL?: string | null): CustomMenuIconPreset[] {
  const url = normalizeHTTPURL(rawURL)
  if (!url) return getMergedCustomMenuSVGIconPresets()
  runtimeCustomMenuSVGIconPresetURLs = normalizeCustomMenuSVGIconPresetURLs([
    url,
    ...runtimeCustomMenuSVGIconPresetURLs,
  ])
  return getMergedCustomMenuSVGIconPresets()
}

export function getMergedCustomMenuSVGIconPresets(): CustomMenuIconPreset[] {
  return runtimeCustomMenuSVGIconPresetURLs.map((url) => ({
    id: customMenuIconPresetId(url),
    label: 'Custom menu SVG icon',
    url,
  }))
}

export function isCustomMenuIconURL(raw?: string | null): boolean {
  return normalizeHTTPURL(raw) !== ''
}
