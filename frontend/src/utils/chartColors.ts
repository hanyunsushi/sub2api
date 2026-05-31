export const chartCategoricalColors = [
  '#002FA7',
  '#001E6E',
  '#c79a3a',
  '#4f6a8c',
  '#171512',
  '#8e6c1f',
  '#2f7d59',
  '#b44536',
  '#70685c',
  '#ddd2bd',
  '#98907f',
  '#d5dfd4',
] as const

export const tokenTrendColors = {
  input: '#002FA7',
  output: '#001E6E',
  cacheCreation: '#c79a3a',
  cacheRead: '#4f6a8c',
  cacheHitRate: '#171512',
} as const

export const chartNeutralColor = '#98907f'

export const getChartColor = (index: number): string => {
  return chartCategoricalColors[index % chartCategoricalColors.length]
}

export const getChartColors = (count: number): string[] => {
  return Array.from({ length: count }, (_, index) => getChartColor(index))
}

export const withChartAlpha = (hexColor: string, alpha = 0.14): string => {
  const normalized = hexColor.replace('#', '')
  if (!/^[0-9a-fA-F]{6}$/.test(normalized)) {
    return hexColor
  }

  const red = parseInt(normalized.slice(0, 2), 16)
  const green = parseInt(normalized.slice(2, 4), 16)
  const blue = parseInt(normalized.slice(4, 6), 16)
  return `rgba(${red}, ${green}, ${blue}, ${alpha})`
}

/**
 * Read the active theme accent (`--atelier-blue`) at runtime so single-series
 * charts follow the appearance theme: Klein blue under Newspaper, Cloudflare
 * orange under the Cloudflare theme. Falls back to the Newspaper Klein blue
 * when the document/computed style is unavailable (SSR / tests).
 */
export const getThemeAccent = (fallback = '#002FA7'): string => {
  if (typeof document === 'undefined' || typeof getComputedStyle !== 'function') {
    return fallback
  }
  const value = getComputedStyle(document.documentElement).getPropertyValue('--atelier-blue').trim()
  return value || fallback
}
