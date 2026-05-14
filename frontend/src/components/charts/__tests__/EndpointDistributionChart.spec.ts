import { describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'

import EndpointDistributionChart from '../EndpointDistributionChart.vue'

const messages: Record<string, string> = {
  'usage.endpointDistribution': 'Endpoint Distribution',
  'usage.endpoint': 'Endpoint',
  'admin.dashboard.requests': 'Requests',
  'admin.dashboard.tokens': 'Tokens',
  'admin.dashboard.actual': 'Actual',
  'admin.dashboard.standard': 'Standard',
  'admin.dashboard.metricTokens': 'By Tokens',
  'admin.dashboard.metricActualCost': 'By Actual Cost',
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
  Doughnut: {
    props: ['data'],
    template: '<div class="chart-data">{{ JSON.stringify(data) }}</div>',
  },
}))

describe('EndpointDistributionChart', () => {
  it('uses a readable categorical palette for endpoint segments', () => {
    const wrapper = mount(EndpointDistributionChart, {
      props: {
        endpointStats: [
          { endpoint: '/v1/messages', requests: 10, total_tokens: 1000, cost: 1, actual_cost: 0.8 },
          { endpoint: '/v1/chat/completions', requests: 8, total_tokens: 800, cost: 0.8, actual_cost: 0.6 },
          { endpoint: '/v1/embeddings', requests: 6, total_tokens: 600, cost: 0.6, actual_cost: 0.4 },
          { endpoint: '/v1/responses', requests: 4, total_tokens: 400, cost: 0.4, actual_cost: 0.3 },
          { endpoint: '/v1/audio', requests: 2, total_tokens: 200, cost: 0.2, actual_cost: 0.1 },
        ],
      },
      global: {
        stubs: {
          LoadingSpinner: true,
        },
      },
    })

    const chartData = JSON.parse(wrapper.find('.chart-data').text())
    const colors = chartData.datasets[0].backgroundColor

    expect(colors.slice(0, 5)).toEqual(['#002FA7', '#3f63d8', '#0891b2', '#0f766e', '#b7791f'])
    expect(new Set(colors.slice(0, 5)).size).toBe(5)
  })
})
