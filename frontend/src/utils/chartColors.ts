export const chartCategoricalColors = [
  '#4290F0',
  '#F5B647',
  '#E8649D',
  '#8D58EE',
  '#50C3B6',
  '#D37536',
] as const

export const tokenTrendColors = {
  input: '#4290F0',
  output: '#F5B647',
  cacheCreation: '#E8649D',
  cacheRead: '#50C3B6',
  cacheHitRate: '#D37536',
} as const

export const chartNeutralColor = '#B9D6FF'

export const getOpsChartColors = () => ({
  brand: '#F48120',
  throughput: '#4290F0',
  tokenRate: '#F5B647',
  switchRate: '#50C3B6',
  requestError: '#F8A054',
  upstreamError: '#FC574A',
  businessLimited: '#B9D6FF',
  critical: '#FC574A',
  warning: '#F8A054',
  success: '#00A63E',
  neutral: '#B9D6FF',
})

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
 * charts follow the appearance theme. Falls back to Cloudflare orange when the
 * document/computed style is unavailable (SSR / tests).
 */
export const getThemeAccent = (fallback = '#F48120'): string => {
  if (typeof document === 'undefined' || typeof getComputedStyle !== 'function') {
    return fallback
  }
  const value = getComputedStyle(document.documentElement).getPropertyValue('--atelier-blue').trim()
  return value || fallback
}
