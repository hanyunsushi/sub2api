import { describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'

import TokenUsageTrend from '../TokenUsageTrend.vue'

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
        <div class="line-chart-data">{{ JSON.stringify(data) }}</div>
        <div class="line-chart-options">{{ JSON.stringify(options) }}</div>
      </div>
    `,
  },
}))

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
    const wrapper = mount(TokenUsageTrend, {
      props: {
        trendData,
      },
      global: {
        stubs: {
          LoadingSpinner: true,
        },
      },
    })

    const chartData = JSON.parse(wrapper.find('.line-chart-data').text())
    const colors = chartData.datasets.map((dataset: { borderColor: string }) => dataset.borderColor)

    expect(colors).toEqual(['#002FA7', '#be3a5c', '#0891b2', '#0f766e', '#b7791f'])
    expect(new Set(colors).size).toBe(colors.length)
    expect(chartData.datasets[4].label).toBe('Cache Hit Rate')
    expect(chartData.datasets[4].borderDash).toEqual([5, 5])
    expect(chartData.datasets[4].yAxisID).toBe('yPercent')

    const chartOptions = JSON.parse(wrapper.find('.line-chart-options').text())
    expect(chartOptions.scales.yPercent.ticks.color).toBe('#b7791f')
  })

  it('calculates cache hit rate against all input-side tokens', () => {
    const wrapper = mount(TokenUsageTrend, {
      props: {
        trendData: [
          {
            date: '2026-05-15',
            requests: 1,
            input_tokens: 600,
            output_tokens: 120,
            cache_creation_tokens: 300,
            cache_read_tokens: 600,
            total_tokens: 1620,
            cost: 0.4,
            actual_cost: 0.2,
          },
        ],
      },
      global: {
        stubs: {
          LoadingSpinner: true,
        },
      },
    })

    const chartData = JSON.parse(wrapper.find('.line-chart-data').text())
    expect(chartData.datasets[4].label).toBe('Cache Hit Rate')
    expect(chartData.datasets[4].data).toEqual([40])
  })
})
