import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'

import TokenUsageTrend from '../TokenUsageTrend.vue'
import type { TrendDataPoint } from '@/types'

type ChartDatasetSnapshot = {
  label: string
  data: number[]
  borderColor?: string
  borderDash?: number[]
  yAxisID?: string
}

type ChartDataSnapshot = {
  datasets: ChartDatasetSnapshot[]
}

const messages: Record<string, string> = {
  'admin.dashboard.tokenUsageTrend': 'Token Usage Trend',
  'admin.dashboard.noDataAvailable': 'No data available',
}

vi.mock('vue-i18n', async () => {
  const actual = await vi.importActual<typeof import('vue-i18n')>('vue-i18n')
  return {
    ...actual,
    useI18n: () => ({
      t: (key: string) => messages[key] ?? key,
    }),
  }
})

vi.mock('vue-chartjs', () => ({
  Line: {
    props: ['data', 'options'],
    template: `
      <div>
        <div class="line-chart-data chart-data">{{ JSON.stringify(data) }}</div>
        <div class="line-chart-options">{{ JSON.stringify(options) }}</div>
      </div>
    `,
  },
}))

const mountTrend = (trendData: TrendDataPoint[]) =>
  mount(TokenUsageTrend, {
    props: {
      trendData,
    },
    global: {
      stubs: {
        LoadingSpinner: true,
      },
    },
  })

const readChartData = (wrapper: ReturnType<typeof mount>): ChartDataSnapshot =>
  JSON.parse(wrapper.find('.line-chart-data').text()) as ChartDataSnapshot

describe('TokenUsageTrend', () => {
  const trendData = [
    {
      date: '2026-05-13',
      requests: 10,
      input_tokens: 1200,
      output_tokens: 800,
      cache_creation_tokens: 300,
      cache_read_tokens: 600,
      total_tokens: 2900,
      cost: 1.2,
      actual_cost: 0.8,
    },
    {
      date: '2026-05-14',
      requests: 12,
      input_tokens: 1500,
      output_tokens: 900,
      cache_creation_tokens: 200,
      cache_read_tokens: 700,
      total_tokens: 3300,
      cost: 1.4,
      actual_cost: 0.9,
    },
  ]

  it('uses distinct semantic colors for token lines and cache hit rate', () => {
    const wrapper = mountTrend(trendData)

    const chartData = readChartData(wrapper)
    const colors = chartData.datasets.map((dataset) => dataset.borderColor)

    expect(colors).toEqual(['#002FA7', '#001E6E', '#c79a3a', '#4f6a8c', '#171512'])
    expect(new Set(colors).size).toBe(colors.length)
    expect(chartData.datasets[4].label).toBe('Cache Hit Rate')
    expect(chartData.datasets[4].borderDash).toEqual([5, 5])
    expect(chartData.datasets[4].yAxisID).toBe('yPercent')

    const chartOptions = JSON.parse(wrapper.find('.line-chart-options').text()) as {
      scales: { yPercent: { ticks: { color: string } } }
    }
    expect(chartOptions.scales.yPercent.ticks.color).toBe('#171512')
  })

  it('calculates cache hit rate against all prompt tokens', () => {
    const wrapper = mountTrend([
      {
        date: '2026-05-08',
        requests: 1,
        input_tokens: 500,
        output_tokens: 100,
        cache_creation_tokens: 0,
        cache_read_tokens: 1500,
        total_tokens: 2100,
        cost: 0.01,
        actual_cost: 0.005,
      },
    ])

    const chartData = readChartData(wrapper)
    const hitRateDataset = chartData.datasets.find((dataset) => dataset.label === 'Cache Hit Rate')

    expect(hitRateDataset?.data[0]).toBe(75)
  })

  it('returns 0 hit rate when all prompt tokens are zero', () => {
    const wrapper = mountTrend([
      {
        date: '2026-05-08',
        requests: 0,
        input_tokens: 0,
        output_tokens: 0,
        cache_creation_tokens: 0,
        cache_read_tokens: 0,
        total_tokens: 0,
        cost: 0,
        actual_cost: 0,
      },
    ])

    const chartData = readChartData(wrapper)
    const hitRateDataset = chartData.datasets.find((dataset) => dataset.label === 'Cache Hit Rate')

    expect(hitRateDataset?.data[0]).toBe(0)
  })

  it('includes cache_creation_tokens in denominator for Anthropic models', () => {
    const wrapper = mountTrend([
      {
        date: '2026-05-08',
        requests: 1,
        input_tokens: 200,
        output_tokens: 50,
        cache_creation_tokens: 300,
        cache_read_tokens: 500,
        total_tokens: 1050,
        cost: 0.02,
        actual_cost: 0.01,
      },
    ])

    const chartData = readChartData(wrapper)
    const hitRateDataset = chartData.datasets.find((dataset) => dataset.label === 'Cache Hit Rate')

    expect(hitRateDataset?.data[0]).toBe(50)
  })
})
