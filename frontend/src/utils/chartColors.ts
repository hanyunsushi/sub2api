export const chartCategoricalColors = [
  '#6a9bcc',
  '#d1a24a',
  '#c46686',
  '#cbcadb',
  '#788c5d',
  '#d97757',
] as const

export const tokenTrendColors = {
  input: '#6a9bcc',
  output: '#d1a24a',
  cacheCreation: '#c46686',
  cacheRead: '#788c5d',
  cacheHitRate: '#d97757',
} as const

export const chartNeutralColor = '#e8e6dc'

export const accountStatsChartColors = {
  accountBilled: '#6a9bcc',
  userBilled: '#788c5d',
  requests: '#d97757',
} as const

export const getOpsChartColors = () => ({
  brand: '#d97757',
  throughput: '#6396d6',
  tokenRate: '#eda100',
  switchRate: '#788c5d',
  requestError: '#b53333',
  upstreamError: '#6396d6',
  businessLimited: '#eda100',
  critical: '#b53333',
  warning: '#eda100',
  success: '#6ea100',
  neutral: '#e8e6dc',
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
 * charts follow the appearance theme. Falls back to Slate when the
 * document/computed style is unavailable (SSR / tests).
 */
export const getThemeAccent = (fallback = '#141413'): string => {
  if (typeof document === 'undefined' || typeof getComputedStyle !== 'function') {
    return fallback
  }
  const value = getComputedStyle(document.documentElement).getPropertyValue('--atelier-blue').trim()
  return value || fallback
}
