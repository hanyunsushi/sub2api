import { beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'

import type { DashboardStats } from '@/types'
import DashboardView from '../DashboardView.vue'
import dashboardSource from '../DashboardView.vue?raw'

const blockedBackdropFilter = ['backdrop', 'filter'].join('-')
const blockedWebkitBackdropFilter = ['-webkit', blockedBackdropFilter].join('-')

const { getSnapshotV2, getUserUsageTrend, getUserSpendingRanking } = vi.hoisted(() => ({
  getSnapshotV2: vi.fn(),
  getUserUsageTrend: vi.fn(),
  getUserSpendingRanking: vi.fn()
}))

vi.mock('@/api/admin', () => ({
  adminAPI: {
    dashboard: {
      getSnapshotV2,
      getUserUsageTrend,
      getUserSpendingRanking
    }
  }
}))

vi.mock('@/stores/app', () => ({
  useAppStore: () => ({
    showError: vi.fn()
  })
}))

vi.mock('@/components/layout/AppLayout.vue', () => ({
  default: {
    template: '<div><slot /></div>'
  }
}))

vi.mock('vue-router', () => ({
  useRouter: () => ({
    push: vi.fn()
  })
}))

vi.mock('vue-i18n', async () => {
  const actual = await vi.importActual<typeof import('vue-i18n')>('vue-i18n')
  return {
    ...actual,
    useI18n: () => ({
      t: (key: string) => key
    })
  }
})

const formatLocalDate = (date: Date): string => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

const createDashboardStats = (): DashboardStats => ({
  total_users: 0,
  today_new_users: 0,
  active_users: 0,
  hourly_active_users: 0,
  stats_updated_at: '',
  stats_stale: false,
  total_api_keys: 0,
  active_api_keys: 0,
  total_accounts: 0,
  normal_accounts: 0,
  error_accounts: 0,
  ratelimit_accounts: 0,
  overload_accounts: 0,
  total_requests: 0,
  total_input_tokens: 0,
  total_output_tokens: 0,
  total_cache_creation_tokens: 0,
  total_cache_read_tokens: 0,
  total_tokens: 0,
  total_cost: 0,
  total_actual_cost: 0,
  today_requests: 0,
  today_input_tokens: 0,
  today_output_tokens: 0,
  today_cache_creation_tokens: 0,
  today_cache_read_tokens: 0,
  today_tokens: 0,
  today_cost: 0,
  today_actual_cost: 0,
  average_duration_ms: 0,
  uptime: 0,
  rpm: 0,
  tpm: 0
})

describe('admin DashboardView', () => {
  beforeEach(() => {
    getSnapshotV2.mockReset()
    getUserUsageTrend.mockReset()
    getUserSpendingRanking.mockReset()

    getSnapshotV2.mockResolvedValue({
      stats: createDashboardStats(),
      trend: [],
      models: []
    })
    getUserUsageTrend.mockResolvedValue({
      trend: [],
      start_date: '',
      end_date: '',
      granularity: 'hour'
    })
    getUserSpendingRanking.mockResolvedValue({
      ranking: [],
      total_actual_cost: 0,
      total_requests: 0,
      total_tokens: 0,
      start_date: '',
      end_date: ''
    })
  })

  it('uses last 24 hours as default dashboard range', async () => {
    mount(DashboardView, {
      global: {
        stubs: {
          AppLayout: { template: '<div><slot /></div>' },
          LoadingSpinner: true,
          Icon: true,
          DateRangePicker: true,
          Select: true,
          ModelDistributionChart: true,
          TokenUsageTrend: true,
          Line: true
        }
      }
    })

    await flushPromises()

    const now = new Date()
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000)

    expect(getSnapshotV2).toHaveBeenCalledTimes(1)
    expect(getSnapshotV2).toHaveBeenCalledWith(expect.objectContaining({
      start_date: formatLocalDate(yesterday),
      end_date: formatLocalDate(now),
      granularity: 'hour'
    }))
  })

  it('keeps dashboard cards static and uses document-level refresh/button surfaces', () => {
    expect(dashboardSource).toContain('admin-dashboard-atelier')
    expect(dashboardSource).toContain('grid grid-cols-2 gap-4 lg:grid-cols-4')
    expect(dashboardSource).toContain('card dashboard-filter-card')
    expect(dashboardSource).toContain('dashboard-paper-control')
    expect(dashboardSource).toContain('dashboard-granularity-control')
    expect(dashboardSource).toContain('class="btn btn-tertiary btn-tiny dashboard-paper-control dashboard-filter-refresh anthropic-refresh-action-button"')

    expect(dashboardSource).toContain('.admin-dashboard-atelier :deep(.card) {')
    expect(dashboardSource).toContain('.admin-dashboard-atelier :deep(.card:hover)')
    expect(dashboardSource).toContain('border-color: var(--anthropic-cookbook-border) !important;')
    expect(dashboardSource).toContain('background: var(--anthropic-page) !important;')
    expect(dashboardSource).toContain('box-shadow: none !important;')
    expect(dashboardSource).not.toContain('--dashboard-control-surface')
    expect(dashboardSource).not.toContain('--dashboard-control-edge')
    expect(dashboardSource).not.toContain('--dashboard-card-surface')
    expect(dashboardSource).not.toContain('--dashboard-hover-surface')
    expect(dashboardSource).not.toContain('background: var(--dashboard-hover-surface) !important;')
    expect(dashboardSource).not.toContain('var(--atelier-material-shadow-hover) !important;')
    expect(dashboardSource).not.toContain('.admin-dashboard-atelier :deep(.dashboard-filter-card:hover)')
    expect(dashboardSource).not.toContain('.admin-dashboard-atelier :deep(.dashboard-filter-card .dashboard-filter-refresh)::after')
    expect(dashboardSource).not.toContain(blockedBackdropFilter)
    expect(dashboardSource).not.toContain(blockedWebkitBackdropFilter)

    expect(dashboardSource).toContain('handleDashboardFilterPointerDown')
    expect(dashboardSource).toContain('dashboard-filter-menu-open')
    expect(dashboardSource).toContain('.dashboard-stat-icon :deep(svg *)')
    expect(dashboardSource).toContain('fill: none !important;')
    expect(dashboardSource).toContain('stroke: currentColor !important;')
  })
})
