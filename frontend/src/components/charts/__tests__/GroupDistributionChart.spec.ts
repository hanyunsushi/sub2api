import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

import { describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'

import GroupDistributionChart from '../GroupDistributionChart.vue'

const source = readFileSync(resolve(__dirname, '../GroupDistributionChart.vue'), 'utf8')

const messages: Record<string, string> = {
  'admin.dashboard.groupDistribution': 'Group Distribution',
  'admin.dashboard.group': 'Group',
  'admin.dashboard.noGroup': 'No Group',
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

describe('GroupDistributionChart', () => {
  const groupStats = [
    {
      group_id: 1,
      group_name: 'group-a',
      requests: 9,
      total_tokens: 1200,
      cost: 1.8,
      actual_cost: 0.1,
      account_cost: 0.2,
    },
    {
      group_id: 2,
      group_name: 'group-b',
      requests: 4,
      total_tokens: 600,
      cost: 0.7,
      actual_cost: 0.9,
      account_cost: 0.4,
    },
  ]

  it('uses total_tokens and token ordering by default', () => {
    const wrapper = mount(GroupDistributionChart, {
      props: {
        groupStats,
      },
      global: {
        stubs: {
          LoadingSpinner: true,
        },
      },
    })

    const chartData = JSON.parse(wrapper.find('.chart-data').text())
    expect(chartData.labels).toEqual(['group-a', 'group-b'])
    expect(chartData.datasets[0].data).toEqual([1200, 600])

    const rows = wrapper.findAll('tbody tr')
    expect(rows[0].text()).toContain('group-a')
    expect(rows[1].text()).toContain('group-b')

    const options = (wrapper.vm as any).$?.setupState.doughnutOptions
    const label = options.plugins.tooltip.callbacks.label({
      label: 'group-a',
      raw: 1200,
      dataset: { data: [1200, 600] },
    })
    expect(label).toBe('group-a: 1.20K (66.7%)')
  })

  it('uses a readable categorical palette for group segments', () => {
    const wrapper = mount(GroupDistributionChart, {
      props: {
        groupStats: [
          ...groupStats,
          {
            group_id: 3,
            group_name: 'group-c',
            requests: 3,
            total_tokens: 500,
            cost: 0.5,
            actual_cost: 0.4,
            account_cost: 0.45,
          },
          {
            group_id: 4,
            group_name: 'group-d',
            requests: 2,
            total_tokens: 400,
            cost: 0.4,
            actual_cost: 0.3,
            account_cost: 0.35,
          },
          {
            group_id: 5,
            group_name: 'group-e',
            requests: 1,
            total_tokens: 300,
            cost: 0.3,
            actual_cost: 0.2,
            account_cost: 0.25,
          },
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

  it('uses actual_cost and reorders rows in actual cost mode', () => {
    const wrapper = mount(GroupDistributionChart, {
      props: {
        groupStats,
        metric: 'actual_cost',
      },
      global: {
        stubs: {
          LoadingSpinner: true,
        },
      },
    })

    const chartData = JSON.parse(wrapper.find('.chart-data').text())
    expect(chartData.labels).toEqual(['group-b', 'group-a'])
    expect(chartData.datasets[0].data).toEqual([0.9, 0.1])

    const rows = wrapper.findAll('tbody tr')
    expect(rows[0].text()).toContain('group-b')
    expect(rows[1].text()).toContain('group-a')

    const options = (wrapper.vm as any).$?.setupState.doughnutOptions
    const label = options.plugins.tooltip.callbacks.label({
      label: 'group-b',
      raw: 0.9,
      dataset: { data: [0.9, 0.1] },
    })
    expect(label).toBe('group-b: $0.900 (90.0%)')
  })

  it('uses route-tabs for the metric switch', async () => {
    const wrapper = mount(GroupDistributionChart, {
      props: {
        groupStats,
        showMetricToggle: true,
      },
      global: {
        stubs: {
          LoadingSpinner: true,
        },
      },
    })

    const tabList = wrapper.find('[role="tablist"]')
    expect(tabList.exists()).toBe(true)
    expect(tabList.classes()).toContain('route-tabs')
    expect(tabList.attributes('data-route-tabs')).toBe('group-distribution-metric')

    const tabs = wrapper.findAll('[role="tab"]')
    expect(tabs.map((tab) => tab.attributes('data-route-id'))).toEqual(['tokens', 'actual_cost'])
    expect(tabs[0].attributes('aria-selected')).toBe('true')

    await tabs[1].trigger('click')

    expect(wrapper.emitted('update:metric')?.[0]).toEqual(['actual_cost'])
  })

  it('guards route-tabs and same-surface table header source', () => {
    expect(source).toContain('class="route-tabs group-distribution-control-group group-distribution-route-tabs inline-flex"')
    expect(source).toContain('data-route-tabs="group-distribution-metric"')
    expect(source).toContain('role="tablist"')
    expect(source).toContain('role="tab"')
    expect(source).toContain(':aria-selected="metric === \'tokens\'"')
    expect(source).toContain(':aria-selected="metric === \'actual_cost\'"')
    expect(source).toContain('class="group-distribution-table-wrap max-h-48 flex-1 overflow-y-auto"')
    expect(source).toContain('class="group-distribution-header-row text-[var(--anthropic-muted)] dark:text-[var(--anthropic-muted)]"')
    expect(source).toContain('.group-distribution-table-wrap :where(table, thead, tbody, tr, th, td)')
    expect(source).toContain('.group-distribution-header-row :where(th)')
    expect(source).not.toContain('bg-[var(--anthropic-section)] p-0.5')
    expect(source).not.toContain('rounded-md px-2.5 py-1 text-xs')
  })
})
