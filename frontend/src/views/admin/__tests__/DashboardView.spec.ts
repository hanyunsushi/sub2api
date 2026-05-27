import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import { beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'

import type { DashboardStats } from '@/types'
import DashboardView from '../DashboardView.vue'

const dashboardSource = readFileSync(
  resolve(dirname(fileURLToPath(import.meta.url)), '../DashboardView.vue'),
  'utf8'
)
const globalStyleSource = readFileSync(
  resolve(dirname(fileURLToPath(import.meta.url)), '../../../style.css'),
  'utf8'
)
const globalMaterialSource = globalStyleSource.slice(
  globalStyleSource.indexOf('Atelier component material system'),
  globalStyleSource.length
)
const blockedBackdropFilter = ['backdrop', 'filter'].join('-')
const blockedWebkitBackdropFilter = ['-webkit', blockedBackdropFilter].join('-')
const blockedSupportsBackdrop = ['@supports not ((', blockedBackdropFilter].join('')

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

  it('uses a single dashboard material card layer while keeping controls flat', () => {
    expect(dashboardSource).toContain('admin-dashboard-atelier')
    expect(dashboardSource).toContain('grid grid-cols-2 gap-4 lg:grid-cols-4')
    expect(dashboardSource).not.toContain('dashboard-page-head')
    expect(dashboardSource).not.toContain('dashboard-display')
    expect(dashboardSource).not.toContain('dashboard-kpi-grid')
    expect(dashboardSource).not.toContain('dashboard-kpi-card')
    expect(dashboardSource).not.toContain('dashboard-perf-band')
    expect(dashboardSource).not.toContain('dashboard-chart-grid')
    expect(dashboardSource).not.toContain('dashboard-top12-card')
    expect(dashboardSource).not.toContain('const dashboardRangeLabel = computed')
    expect(dashboardSource).not.toContain('const clampPercent = (value: number, total: number): string =>')
    expect(dashboardSource).toContain('card dashboard-filter-card')
    expect(dashboardSource).toContain('dashboard-paper-control')
    expect(dashboardSource).toContain('dashboard-granularity-control')
    expect(dashboardSource).toContain('--dashboard-control-surface: var(--atelier-paper-2);')
    expect(dashboardSource).toContain('--dashboard-control-edge: var(--atelier-line-strong);')
    expect(dashboardSource).not.toContain('class="dashboard-card')
    expect(dashboardSource).not.toContain('.dashboard-card {')
    expect(dashboardSource).not.toContain('--dashboard-card-surface')
    expect(dashboardSource).toContain('.admin-dashboard-atelier :deep(.card) {')
    expect(dashboardSource).toContain('--atelier-card-accent: var(--atelier-blue);')
    expect(dashboardSource).toContain('--atelier-card-surface: var(--atelier-paper-2);')
    expect(dashboardSource).toContain('background: var(--atelier-paper-2) !important;')
    expect(dashboardSource).toContain('border-color: var(--atelier-material-edge) !important;')
    expect(dashboardSource).toContain('.admin-dashboard-atelier :deep(.card:hover)')
    expect(dashboardSource).toContain('transform: translate3d(0, -2px, 0);')
    expect(dashboardSource).toContain('background: var(--dashboard-hover-surface) !important;')
    expect(dashboardSource).toContain('color: var(--atelier-ink) !important;')
    expect(dashboardSource).toContain('--dashboard-module-rule: var(--atelier-console-rule);')
    expect(dashboardSource).toContain('.admin-dashboard-atelier :deep(.card)::before')
    expect(dashboardSource).toContain('.admin-dashboard-atelier > .grid > .card::after')
    expect(dashboardSource).toContain('linear-gradient(var(--atelier-blue), var(--atelier-blue))')
    expect(dashboardSource).toContain('.admin-dashboard-atelier :deep(.card .text-xl)')
    expect(dashboardSource).toContain('font-family: var(--atelier-font-serif);')
    expect(dashboardSource).toContain('font-style: italic;')
    expect(dashboardSource).toContain('.admin-dashboard-atelier :deep(.card canvas)')
    expect(dashboardSource).toContain('.admin-dashboard-atelier :deep(.card)::after')
    expect(dashboardSource).toContain('content: none;')
    expect(dashboardSource).toContain('display: none;')
    expect(dashboardSource).not.toContain('.admin-dashboard-atelier :deep(.card:nth-child')
    expect(dashboardSource).not.toContain('--atelier-card-accent: var(--atelier-dust);')
    expect(dashboardSource).not.toContain('--atelier-card-accent: var(--atelier-blue-dark);')
    expect(dashboardSource).not.toContain('--atelier-card-accent: var(--atelier-butter);')
    expect(dashboardSource).not.toContain(blockedBackdropFilter)
    expect(dashboardSource).not.toContain(blockedWebkitBackdropFilter)
    expect(dashboardSource).toContain('.admin-dashboard-atelier :deep(.date-picker-trigger)')
    expect(dashboardSource).toContain('.admin-dashboard-atelier :deep(.dashboard-granularity-control .select-trigger)')
    expect(dashboardSource).toContain('background: var(--atelier-butter) !important;')
    expect(dashboardSource).toContain('color: var(--atelier-paper);')
    expect(dashboardSource).toContain('background: var(--atelier-ink) !important;')
    expect(dashboardSource).toContain('color: var(--atelier-paper) !important;')
    expect(dashboardSource).toContain('.admin-dashboard-atelier :deep(.dashboard-filter-card > div > .dashboard-filter-range)')
    expect(dashboardSource).toContain('.admin-dashboard-atelier :deep(.dashboard-filter-card .dashboard-filter-refresh)::after')
    expect(dashboardSource).toContain('.admin-dashboard-atelier :deep(.dashboard-filter-card > div > .flex:not(.dashboard-filter-range))')
    expect(dashboardSource).toContain('.admin-dashboard-atelier :deep(.dashboard-filter-card:hover)')
    expect(dashboardSource).toContain('handleDashboardFilterPointerDown')
    expect(dashboardSource).toContain('dashboard-filter-menu-open')
    expect(dashboardSource).toContain('--dashboard-hover-surface: var(--atelier-butter);')
    expect(dashboardSource).not.toContain('background: var(--atelier-material-butter) !important;')
    expect(dashboardSource).toContain('background: var(--atelier-material-1);')
    expect(dashboardSource).toContain('color: var(--atelier-ink);')
    expect(dashboardSource).toContain('fill: none !important;')
    expect(dashboardSource).toContain('stroke: currentColor !important;')
    expect(globalStyleSource).toContain('.dashboard-stat-icon {')
    expect(globalStyleSource).toContain('background: var(--atelier-material-1);')
    expect(globalStyleSource).toContain('.dashboard-stat-icon svg,')
    expect(globalStyleSource).toContain('.dashboard-stat-icon svg *')
    expect(globalStyleSource).toContain('fill: none !important;')
    expect(globalStyleSource).toContain('.dashboard-stat-icon-lg')
    expect(dashboardSource).toContain('.dashboard-stat-icon :deep(svg *)')
    expect(dashboardSource).not.toContain('dashboard-chart-card')
    expect(dashboardSource).not.toContain('.admin-dashboard-atelier :deep(.dashboard-chart-card)')
    expect(globalStyleSource).toContain('body.dashboard-filter-menu-open :where(.date-picker-dropdown-portal, .select-dropdown-portal)')
    expect(globalStyleSource).toContain('--atelier-butter: #c79a3a;')
    expect(globalStyleSource).toContain('--atelier-butter-soft: #c79a3a;')
    expect(dashboardSource).not.toContain('background: var(--atelier-blue);\n  color: var(--atelier-white);')
    expect(dashboardSource).not.toContain('background: #002FA7;\n  color: #f8fbff;')
    expect(dashboardSource).not.toContain('@media (prefers-reduced-transparency: reduce)')
    expect(dashboardSource).not.toContain(blockedSupportsBackdrop)
    expect(dashboardSource).not.toContain('--dashboard-material-surface')
    expect(dashboardSource).not.toContain('.admin-dashboard-atelier::before')
    expect(dashboardSource).not.toContain(':deep(.card::before)')
    expect(dashboardSource).not.toContain(':deep(.card::before)')
    expect(dashboardSource).not.toContain('mask-image')
    expect(dashboardSource).not.toContain('inset 0 -1px')
    expect(dashboardSource).not.toContain(':global(.dark) .admin-dashboard-atelier')
    expect(dashboardSource).not.toContain('.sidebar')
    expect(dashboardSource).not.toContain('Codex')

    expect(globalStyleSource).toContain('.card {')
    expect(globalStyleSource).toContain('background: var(--atelier-surface)')
    expect(globalStyleSource).not.toContain(blockedBackdropFilter)
    expect(globalStyleSource).toContain('--atelier-surface: #171512;')
    expect(globalMaterialSource).toContain('.dark .app-layout-shell :where(.card, .paper-card, .paper-surface, .stat-card, .summary-tile')
    expect(globalMaterialSource).toContain(':where(.card, .paper-card, .paper-surface, .stat-card, .summary-tile')
    expect(globalStyleSource).toContain('.admin-material-surface')
    expect(globalStyleSource).toContain('.app-layout-content :where(div, section, article):where(')
    expect(globalStyleSource).toContain('[class~="rounded-lg"]')
    expect(globalStyleSource).toContain('[class~="bg-white"]')
    expect(globalStyleSource).toContain('[class~="bg-gray-50/50"]')
    expect(globalStyleSource).toContain(':not([class~="btn"])')
    expect(globalMaterialSource).not.toContain('mask-image')
    expect(globalMaterialSource).not.toContain('inset 0 -1px')
  })
})
