export const chartCategoricalColors = [
  '#2563eb',
  '#7c3aed',
  '#0891b2',
  '#0f766e',
  '#b7791f',
  '#be3a5c',
  '#4f46e5',
  '#64748b',
  '#2f7d59',
  '#c05621',
  '#0284c7',
  '#8b5cf6',
] as const

export const tokenTrendColors = {
  input: '#2563eb',
  output: '#7c3aed',
  cacheCreation: '#0891b2',
  cacheRead: '#0f766e',
  cacheHitRate: '#b7791f',
} as const

export const chartNeutralColor = '#94a3b8'

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
