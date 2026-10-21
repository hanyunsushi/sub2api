import type { Chart, Plugin } from 'chart.js'

// 展示信息模块：AWS分类色的已核验顺序；Apple状态色不由此替换。
// https://cloudscape.design/foundation/visual-foundation/data-vis-colors/
export const consoleChartColors = ['#688ae8', '#c33d69', '#2ea597', '#8456ce', '#e07941', '#3759ce', '#962249', '#096f64', '#6237a7', '#a84401', '#273ea5', '#780d35'] as const
export function consoleSeriesColors(_fallback: string[]): string[] {
  return [...consoleChartColors]
}
interface DistributionData { labels: string[]; datasets: { data: number[]; backgroundColor?: string[] }[] }
// 展示信息模块：图形最多5扇区，长尾只在图形中合并；原业务明细/排序/数值仍由组件完整保留。
export function consoleDistribution<T extends DistributionData>(source: T, otherLabel: string): T {
  const aggregate = source.labels.length > 5
  const count = aggregate ? 4 : source.labels.length
  return {
    ...source,
    labels: aggregate ? [...source.labels.slice(0, count), `${otherLabel} (${source.labels.length - count})`] : [...source.labels],
    datasets: source.datasets.map(dataset => ({
      ...dataset,
      data: aggregate ? [...dataset.data.slice(0, count), dataset.data.slice(count).reduce((sum, value) => sum + value, 0)] : [...dataset.data],
      backgroundColor: [...consoleChartColors.slice(0, aggregate ? 5 : count)],
    })),
  }
}
const BODY_FONT = 'Inter, "Resource Han Rounded CN", sans-serif'
const NUMERIC_FONT = '"Courier Prime", monospace'
const subscriptions = new WeakMap<Chart, () => void>()

// 数字展示 / 组件绘制动画：按图实例适配，不修改Chart.defaults，独立站与Console一致，不污染其他应用。
export const consoleChartPlugin: Plugin = {
  id: 'kreeper-console-chart-style',
  beforeInit(chart) {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)')
    // 保存原始配置而非Chart.js解析器Proxy；将解析器写回会破坏后续交互/动画解析。
    const originalAnimation = chart.config.options?.animation
    const updateMotion = () => {
      chart.options.animation = media.matches ? false : originalAnimation
      chart.update('none')
    }
    if (media.matches) chart.options.animation = false
    media.addEventListener('change', updateMotion)
    subscriptions.set(chart, () => media.removeEventListener('change', updateMotion))
    // Canvas也必须在本应用自托管字体实际就绪后重算度量。
    void document.fonts?.load(`12px ${NUMERIC_FONT}`).then(() => {
      if (subscriptions.has(chart)) chart.update('none')
    }).catch(() => {})
  },
  beforeUpdate(chart) {
    chart.options.font = { ...chart.options.font, family: BODY_FONT, size: 12, lineHeight: '16px' }
    chart.options.color = '#5e5e5e'
    const legend = chart.options.plugins?.legend
    if (legend && typeof legend === 'object' && legend.labels) {
      legend.labels.font = { ...legend.labels.font, family: BODY_FONT, size: 12, lineHeight: '16px' }
      legend.labels.color = '#5e5e5e'
    }
    const tooltip = chart.options.plugins?.tooltip
    if (tooltip && typeof tooltip === 'object') {
      tooltip.titleFont = { ...tooltip.titleFont, family: BODY_FONT }
      tooltip.bodyFont = { ...tooltip.bodyFont, family: BODY_FONT }
      tooltip.footerFont = { ...tooltip.footerFont, family: BODY_FONT }
    }
    for (const scale of Object.values(chart.options.scales ?? {})) {
      if (!scale) continue
      if (scale.ticks) {
        scale.ticks.font = { ...(typeof scale.ticks.font === 'object' ? scale.ticks.font : {}), family: NUMERIC_FONT, size: 12, lineHeight: '16px' }
        scale.ticks.color = '#5e5e5e'
      }
      if (scale.grid) scale.grid.color = '#dedee3'
    }
  },
  afterDestroy(chart) { subscriptions.get(chart)?.(); subscriptions.delete(chart) },
}
export function consoleChartPlugins(): Plugin[] {
  return [consoleChartPlugin]
}
