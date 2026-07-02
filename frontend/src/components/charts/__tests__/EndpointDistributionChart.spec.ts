import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

import { describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'

import EndpointDistributionChart from '../EndpointDistributionChart.vue'

const source = readFileSync(resolve(__dirname, '../EndpointDistributionChart.vue'), 'utf8')

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

    expect(colors.slice(0, 5)).toEqual(['#6a9bcc', '#d1a24a', '#c46686', '#cbcadb', '#788c5d'])
    expect(new Set(colors.slice(0, 5)).size).toBe(5)
  })

  it('uses route-tabs for source and metric switches', async () => {
    const wrapper = mount(EndpointDistributionChart, {
      props: {
        endpointStats: [
          { endpoint: '/v1/messages', requests: 10, total_tokens: 1000, cost: 1, actual_cost: 0.8 },
        ],
        showSourceToggle: true,
        showMetricToggle: true,
      },
      global: {
        stubs: {
          LoadingSpinner: true,
        },
      },
    })

    const tabLists = wrapper.findAll('[role="tablist"]')
    expect(tabLists).toHaveLength(2)
    expect(tabLists[0].classes()).toContain('route-tabs')
    expect(tabLists[0].attributes('data-route-tabs')).toBe('endpoint-distribution-source')
    expect(tabLists[1].attributes('data-route-tabs')).toBe('endpoint-distribution-metric')

    const tabs = wrapper.findAll('[role="tab"]')
    expect(tabs.map((tab) => tab.attributes('data-route-id'))).toEqual([
      'inbound',
      'upstream',
      'path',
      'tokens',
      'actual_cost',
    ])
    expect(tabs[0].attributes('aria-selected')).toBe('true')
    expect(tabs[3].attributes('aria-selected')).toBe('true')

    await tabs[1].trigger('click')
    await tabs[4].trigger('click')

    expect(wrapper.emitted('update:source')?.[0]).toEqual(['upstream'])
    expect(wrapper.emitted('update:metric')?.[0]).toEqual(['actual_cost'])
  })

  it('keeps endpoint table header on the same paper surface as the card', () => {
    expect(source).toContain('class="endpoint-distribution-table-wrap max-h-48 flex-1 overflow-y-auto"')
    expect(source).toContain('class="endpoint-distribution-header-row text-[var(--anthropic-muted)] dark:text-[var(--anthropic-muted)]"')
    expect(source).toContain('.endpoint-distribution-table-wrap :where(table, thead, tbody, tr, th, td)')
    expect(source).toContain('background: var(--anthropic-page) !important;')
    expect(source).toContain('.endpoint-distribution-header-row :where(th)')
    expect(source).toContain('color: var(--anthropic-muted) !important;')
  })

  it('guards the local route-tabs indicator against segmented-button drift', () => {
    expect(source).toContain('class="route-tabs endpoint-distribution-control-group endpoint-distribution-route-tabs inline-flex"')
    expect(source).toContain('data-route-tabs="endpoint-distribution-source"')
    expect(source).toContain('data-route-tabs="endpoint-distribution-metric"')
    expect(source).toContain('role="tablist"')
    expect(source).toContain('role="tab"')
    expect(source).toContain(':aria-selected="source === \'inbound\'"')
    expect(source).toContain(':aria-selected="metric === \'actual_cost\'"')
    expect(source).toContain("tabs.style.setProperty('--route-indicator-x'")
    expect(source).toContain("tabs.style.setProperty('--route-indicator-w'")
    expect(source).toContain('@mouseleave="moveSourceIndicatorToSelected"')
    expect(source).toContain('@focusout="handleMetricTabsFocusout"')
    expect(source).not.toContain('bg-[var(--anthropic-section)] p-0.5')
    expect(source).not.toContain('rounded-md px-2.5 py-1 text-xs')
  })
})
