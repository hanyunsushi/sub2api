import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'

import UsageView from '../UsageView.vue'

const styleSource = readFileSync(resolve(__dirname, '../../../style.css'), 'utf8')
const targetedRepairSource = readFileSync(resolve(__dirname, '../../../styles/targeted-visual-repair.css'), 'utf8')

const { list, getStats, getSnapshotV2, getById, getModelStats, listErrorLogs } = vi.hoisted(() => {
  vi.stubGlobal('localStorage', {
    getItem: vi.fn(() => null),
    setItem: vi.fn(),
    removeItem: vi.fn(),
  })

  return {
    list: vi.fn(),
    getStats: vi.fn(),
    getSnapshotV2: vi.fn(),
    getById: vi.fn(),
    getModelStats: vi.fn(),
    listErrorLogs: vi.fn(),
  }
})

const messages: Record<string, string> = {
  'admin.dashboard.timeRange': 'Time Range',
  'admin.dashboard.day': 'Day',
  'admin.dashboard.hour': 'Hour',
  'admin.usage.failedToLoadUser': 'Failed to load user',
}

const formatLocalDate = (date: Date): string => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

const cssBlock = (source: string, selector: string): string => {
  const start = source.indexOf(selector)
  expect(start, `Expected CSS selector ${selector}`).toBeGreaterThanOrEqual(0)
  const open = source.indexOf('{', start)
  expect(open, `Expected CSS selector ${selector} to open`).toBeGreaterThan(start)
  let depth = 0
  for (let index = open; index < source.length; index += 1) {
    const char = source[index]
    if (char === '{') depth += 1
    if (char === '}') {
      depth -= 1
      if (depth === 0) return source.slice(open + 1, index)
    }
  }
  throw new Error(`CSS block not closed for ${selector}`)
}

vi.mock('@/api/admin', () => ({
  adminAPI: {
    usage: {
      list,
      getStats,
    },
    dashboard: {
      getSnapshotV2,
      getModelStats,
    },
    users: {
      getById,
    },
  },
}))

vi.mock('@/api/admin/usage', () => ({
  adminUsageAPI: {
    list: vi.fn(),
  },
}))

vi.mock('@/api/admin/ops', () => ({
  listErrorLogs,
}))

vi.mock('@/stores/app', () => ({
  useAppStore: () => ({
    showError: vi.fn(),
    showWarning: vi.fn(),
    showSuccess: vi.fn(),
    showInfo: vi.fn(),
  }),
}))

vi.mock('@/utils/format', () => ({
  formatReasoningEffort: (value: string | null | undefined) => value ?? '-',
}))

vi.mock('vue-i18n', async () => {
  const actual = await vi.importActual<typeof import('vue-i18n')>('vue-i18n')
  return {
    ...actual,
    useI18n: () => ({
      t: (key: string) => messages[key] ?? key,
    }),
  }
})

vi.mock('vue-router', () => ({
  useRoute: () => ({
    query: {}
  })
}))

const AppLayoutStub = { template: '<div><slot /></div>' }
const UsageFiltersStub = { template: '<div><slot name="after-reset" /></div>' }
const UsageTableStub = {
  emits: ['userClick'],
  template: '<div data-test="usage-table"><button class="user-click" @click="$emit(\'userClick\', 2)">user</button></div>',
}
const ModelDistributionChartStub = {
  props: ['metric'],
  emits: ['update:metric'],
  template: `
    <div data-test="model-chart">
      <span class="metric">{{ metric }}</span>
      <button class="switch-metric" @click="$emit('update:metric', 'actual_cost')">switch</button>
    </div>
  `,
}
const GroupDistributionChartStub = {
  props: ['metric'],
  emits: ['update:metric'],
  template: `
    <div data-test="group-chart">
      <span class="metric">{{ metric }}</span>
      <button class="switch-metric" @click="$emit('update:metric', 'actual_cost')">switch</button>
    </div>
  `,
}

describe('admin UsageView distribution metric toggles', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    list.mockReset()
    getStats.mockReset()
    getSnapshotV2.mockReset()
    getById.mockReset()
    getModelStats.mockReset()

    list.mockResolvedValue({
      items: [],
      total: 0,
      pages: 0,
    })
    getStats.mockResolvedValue({
      total_requests: 0,
      total_input_tokens: 0,
      total_output_tokens: 0,
      total_cache_tokens: 0,
      total_tokens: 0,
      total_cost: 0,
      total_actual_cost: 0,
      average_duration_ms: 0,
    })
    getSnapshotV2.mockResolvedValue({
      trend: [],
      models: [],
      groups: [],
    })
    getModelStats.mockResolvedValue({ models: [] })
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('keeps previous model stats visible during refresh until new data arrives', async () => {
    // 首次加载返回 A
    getModelStats.mockResolvedValueOnce({ models: [{ model: 'A', total_tokens: 10 }] })

    const wrapper = mount(UsageView, {
      global: { stubs: {
        AppLayout: AppLayoutStub, UsageStatsCards: true, UsageFilters: UsageFiltersStub,
        UsageTable: true, UsageExportProgress: true, UsageCleanupDialog: true,
        UserBalanceHistoryModal: true, AuditLogModal: true, Pagination: true, Select: true,
        DateRangePicker: true, Icon: true, TokenUsageTrend: true,
        ModelDistributionChart: ModelDistributionChartStub, GroupDistributionChart: GroupDistributionChartStub,
        EndpointDistributionChart: true,
      } },
    })
    vi.advanceTimersByTime(120)
    await flushPromises()
    expect((wrapper.vm as any).requestedModelStats).toEqual([{ model: 'A', total_tokens: 10 }])

    // 刷新:让第二次 getModelStats 处于 pending,断言旧数据 A 仍在(不被清空成 [])
    let resolveSecond: (v: any) => void = () => {}
    getModelStats.mockReturnValueOnce(new Promise((res) => { resolveSecond = res }))
    ;(wrapper.vm as any).refreshData()
    await flushPromises()
    expect((wrapper.vm as any).requestedModelStats).toEqual([{ model: 'A', total_tokens: 10 }])

    // 新数据到达后替换为 B
    resolveSecond({ models: [{ model: 'B', total_tokens: 20 }] })
    await flushPromises()
    expect((wrapper.vm as any).requestedModelStats).toEqual([{ model: 'B', total_tokens: 20 }])
  })

  it('keeps model and group metric toggles independent without refetching chart data', async () => {
    const wrapper = mount(UsageView, {
      global: {
        stubs: {
          AppLayout: AppLayoutStub,
          UsageStatsCards: true,
          UsageFilters: UsageFiltersStub,
          UsageTable: true,
          UsageExportProgress: true,
          UsageCleanupDialog: true,
          UserBalanceHistoryModal: true,
          Pagination: true,
          Select: true,
          DateRangePicker: true,
          Icon: true,
          TokenUsageTrend: true,
          ModelDistributionChart: ModelDistributionChartStub,
          GroupDistributionChart: GroupDistributionChartStub,
        },
      },
    })

    vi.advanceTimersByTime(120)
    await flushPromises()

    expect(getSnapshotV2).toHaveBeenCalledTimes(1)
    const now = new Date()
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000)
    expect(getSnapshotV2).toHaveBeenCalledWith(expect.objectContaining({
      start_date: formatLocalDate(yesterday),
      end_date: formatLocalDate(now),
      granularity: 'hour'
    }))

    const modelChart = wrapper.find('[data-test="model-chart"]')
    const groupChart = wrapper.find('[data-test="group-chart"]')

    expect(modelChart.find('.metric').text()).toBe('tokens')
    expect(groupChart.find('.metric').text()).toBe('tokens')

    await modelChart.find('.switch-metric').trigger('click')
    await flushPromises()

    expect(modelChart.find('.metric').text()).toBe('actual_cost')
    expect(groupChart.find('.metric').text()).toBe('tokens')
    expect(getSnapshotV2).toHaveBeenCalledTimes(1)

    await groupChart.find('.switch-metric').trigger('click')
    await flushPromises()

    expect(modelChart.find('.metric').text()).toBe('actual_cost')
    expect(groupChart.find('.metric').text()).toBe('actual_cost')
    expect(getSnapshotV2).toHaveBeenCalledTimes(1)
  })
})

describe('admin UsageView handleUserClick', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    list.mockReset()
    getStats.mockReset()
    getSnapshotV2.mockReset()
    getById.mockReset()

    list.mockResolvedValue({ items: [], total: 0, pages: 0 })
    getStats.mockResolvedValue({
      total_requests: 0, total_input_tokens: 0, total_output_tokens: 0,
      total_cache_tokens: 0, total_tokens: 0, total_cost: 0, total_actual_cost: 0, average_duration_ms: 0,
    })
    getSnapshotV2.mockResolvedValue({ trend: [], models: [], groups: [] })
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('opens user via include_deleted when clicking a usage row user', async () => {
    getById.mockResolvedValue({ id: 2, email: 'd@test.com', deleted_at: '2026-05-28T00:00:00Z' })

    const wrapper = mount(UsageView, {
      global: {
        stubs: {
          AppLayout: AppLayoutStub,
          UsageStatsCards: true,
          UsageFilters: UsageFiltersStub,
          UsageTable: UsageTableStub,
          UsageExportProgress: true,
          UsageCleanupDialog: true,
          UserBalanceHistoryModal: true,
          AuditLogModal: true,
          Pagination: true,
          Select: true,
          DateRangePicker: true,
          Icon: true,
          TokenUsageTrend: true,
          ModelDistributionChart: true,
          GroupDistributionChart: true,
          EndpointDistributionChart: true,
        },
      },
    })

    vi.advanceTimersByTime(120)
    await flushPromises()

    await wrapper.find('[data-test="usage-table"] .user-click').trigger('click')
    await flushPromises()

    expect(getById).toHaveBeenCalledWith(2, true)
  })
})

describe('admin UsageView errors tab filter forwarding', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    list.mockReset()
    getStats.mockReset()
    getSnapshotV2.mockReset()
    getModelStats.mockReset()
    listErrorLogs.mockReset()

    list.mockResolvedValue({ items: [], total: 0, pages: 0 })
    getStats.mockResolvedValue({
      total_requests: 0, total_input_tokens: 0, total_output_tokens: 0,
      total_cache_tokens: 0, total_tokens: 0, total_cost: 0, total_actual_cost: 0, average_duration_ms: 0,
    })
    getSnapshotV2.mockResolvedValue({ trend: [], models: [], groups: [] })
    getModelStats.mockResolvedValue({ models: [] })
    listErrorLogs.mockResolvedValue({ items: [], total: 0, pages: 0 })
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('forwards model/account_id/group_id to listErrorLogs on the errors tab', async () => {
    const wrapper = mount(UsageView, {
      global: { stubs: {
        AppLayout: AppLayoutStub, UsageStatsCards: true, UsageFilters: UsageFiltersStub,
        UsageTable: true, UsageExportProgress: true, UsageCleanupDialog: true,
        UserBalanceHistoryModal: true, AuditLogModal: true, Pagination: true, Select: true,
        DateRangePicker: true, Icon: true, TokenUsageTrend: true,
        ModelDistributionChart: true, GroupDistributionChart: true, EndpointDistributionChart: true,
        OpsErrorLogTable: true, OpsErrorDetailModal: true,
      } },
    })
    vi.advanceTimersByTime(120)
    await flushPromises()

    // 模拟用户在过滤器里选择了模型/账户/分组
    const vm = wrapper.vm as any
    vm.filters.model = 'gpt-5.3-codex'
    vm.filters.account_id = 7
    vm.filters.group_id = 3
    await flushPromises()

    // 切换到「错误请求」route tab 触发 loadAdminErrors
    const tabs = wrapper.findAll('[role="tab"]')
    await tabs[1].trigger('click')
    await flushPromises()

    expect(listErrorLogs).toHaveBeenCalledWith(expect.objectContaining({
      view: 'all',
      model: 'gpt-5.3-codex',
      account_id: 7,
      group_id: 3,
    }))
  })
})

describe('admin UsageView visual source guards', () => {
  it('uses the Anthropic route-tabs contract for usage detail switching', () => {
    const source = readFileSync(resolve(__dirname, '../UsageView.vue'), 'utf8')

    expect(source).toContain('class="route-shell usage-detail-route-shell"')
    expect(source).toContain('class="route-tabs usage-detail-route-tabs"')
    expect(source).toContain('data-route-tabs="admin-usage-detail"')
    expect(source).toContain('role="tablist"')
    expect(source).toContain('role="tab"')
    expect(source).toContain('data-route-id="usage"')
    expect(source).toContain('data-route-id="errors"')
    expect(source).toContain(':aria-selected="activeTab === \'usage\'"')
    expect(source).toContain(':aria-selected="activeTab === \'errors\'"')
    expect(source).toContain('class="route-panels usage-detail-route-panels"')
    expect(source).toContain('class="route-panel usage-detail-route-panel"')
    expect(source).toContain('data-route-group="admin-usage-detail"')
    expect(source).toContain('data-route-panel="usage"')
    expect(source).toContain('data-route-panel="errors"')
    expect(source).toContain('setUsageTab(\'usage\')')
    expect(source).toContain("tabs.style.setProperty('--route-indicator-x'")
    expect(source).toContain("tabs.style.setProperty('--route-indicator-w'")
    expect(source).toContain('@mouseleave="moveUsageIndicatorToSelected"')
    expect(source).toContain('@focusout="handleUsageTabsFocusout"')
    expect(source).not.toContain('class="tab"')
    expect(source).not.toContain('tab-active')

    const routeTabsBlock = cssBlock(source, '.usage-detail-route-tabs::before')
    expect(routeTabsBlock).toContain('width: var(--route-indicator-w);')
    expect(routeTabsBlock).toContain('background: var(--anthropic-page);')
    expect(routeTabsBlock).toContain('box-shadow: 0 0 0 1px var(--anthropic-border-soft);')
    expect(routeTabsBlock).toContain('transform: translateX(var(--route-indicator-x));')
    const panelBlock = cssBlock(source, '.usage-detail-route-panel {')
    expect(panelBlock).toContain('opacity: 0;')
    expect(panelBlock).toContain('visibility: hidden;')
    expect(panelBlock).toContain('transform: translateY(8px);')
    const activePanelBlock = cssBlock(source, '.usage-detail-route-panel.active')
    expect(activePanelBlock).toContain('opacity: 1;')
    expect(activePanelBlock).toContain('visibility: visible;')
    expect(activePanelBlock).toContain('transform: translateY(0);')
  })

  it('uses the level-one underline dropdown menu contract for usage filters', () => {
    const usageSource = readFileSync(resolve(__dirname, '../UsageView.vue'), 'utf8')
    const underlinePortalBlock = cssBlock(styleSource, '.topbar-underline-menu,')
    const underlineItemBlock = cssBlock(styleSource, '.topbar-underline-menu :where(.dropdown-item, .balance-row),')
    const underlineHoverBlock = cssBlock(styleSource, '.topbar-underline-menu :where(.dropdown-item:hover, .dropdown-item:focus-visible, .balance-row:hover, .balance-row:focus-visible),')
    const underlineSelectedBlock = cssBlock(styleSource, '.filter-underline-menu :where(.select-option-selected, .select-option-selected:hover, .select-option-focused, .date-picker-preset-active, .date-picker-preset-active:hover)')

    expect(usageSource).toContain('<DateRangePicker')
    expect(usageSource).toContain('variant="text-control"')
    expect(usageSource).toContain('class="table-filter-shell usage-time-filter-shell')
    expect(underlinePortalBlock).toContain('padding: 0.75rem;')
    expect(underlineItemBlock).toContain('background: transparent !important;')
    expect(underlineItemBlock).toContain('text-decoration-line: underline;')
    expect(underlineHoverBlock).toContain('background: transparent !important;')
    expect(underlineHoverBlock).toContain('text-decoration-color: currentColor;')
    expect(underlineSelectedBlock).toContain('border-radius: 0;')
    expect(underlineSelectedBlock).toContain('background: transparent !important;')
    expect(underlineSelectedBlock).toContain('box-shadow: none !important;')
  })

  it('keeps dashboard and usage filter cards single-framed with no stitch pseudo-element', () => {
    const cardBlock = cssBlock(targetedRepairSource, '#app .app-layout-content :where(.dashboard-filter-card, .usage-time-filter-card, .usage-filter-card, .risk-control-toolbar-actions, .risk-control-record-filters, .codex-list-actions__filters)')
    const shellBlock = cssBlock(targetedRepairSource, '#app .app-layout-content :where(.table-page-filter-section > .usage-filter-shell, .usage-time-filter-card > .usage-time-filter-shell, .usage-filter-card > .usage-filter-shell)')

    expect(cardBlock).toContain('border: 1px solid var(--anthropic-cookbook-border) !important;')
    expect(cardBlock).toContain('background: var(--anthropic-page) !important;')
    expect(cardBlock).toContain('box-shadow: none !important;')
    expect(cardBlock).toContain('padding: 0.75rem 1rem !important;')
    expect(shellBlock).toContain('border: 0 !important;')
    expect(shellBlock).toContain('background: transparent !important;')
    expect(targetedRepairSource).not.toContain('.dashboard-filter-card::after')
    expect(targetedRepairSource).not.toContain('.usage-time-filter-card::after')

    const adminUsageTimeCardBlock = cssBlock(targetedRepairSource, '#app .app-layout-content .admin-usage-atelier .usage-time-filter-card')
    const adminUsageTimeShellBlock = cssBlock(targetedRepairSource, '#app .app-layout-content .admin-usage-atelier .usage-time-filter-card > .usage-time-filter-shell')
    const adminUsageTimeGroupsBlock = cssBlock(targetedRepairSource, '#app .app-layout-content .admin-usage-atelier .usage-time-filter-shell :where(.usage-time-filter-range, .usage-time-filter-granularity)')
    const adminUsageTimeLabelBlock = cssBlock(targetedRepairSource, '#app .app-layout-content .admin-usage-atelier .usage-time-filter-shell .filter-label')

    expect(adminUsageTimeCardBlock).toContain('display: flex !important;')
    expect(adminUsageTimeCardBlock).toContain('align-items: center !important;')
    expect(adminUsageTimeCardBlock).toContain('min-height: 4.625rem !important;')
    expect(adminUsageTimeShellBlock).toContain('min-height: var(--anthropic-control-height) !important;')
    expect(adminUsageTimeShellBlock).toContain('align-items: center !important;')
    expect(adminUsageTimeGroupsBlock).toContain('display: inline-flex !important;')
    expect(adminUsageTimeGroupsBlock).toContain('align-items: center !important;')
    expect(adminUsageTimeLabelBlock).toContain('align-items: center !important;')
  })
})
