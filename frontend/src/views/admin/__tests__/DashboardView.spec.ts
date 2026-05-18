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
const globalCardSource = globalStyleSource.slice(
  globalStyleSource.indexOf('/* ============ 基础面板 ============ */'),
  globalStyleSource.indexOf('/* ============ 统计卡片 ============ */')
)

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

  it('uses global Apple-style material cards while keeping dashboard-only control glass scoped', () => {
    expect(dashboardSource).toContain('admin-dashboard-liquid')
    expect(dashboardSource).toContain('dashboard-filter-card')
    expect(dashboardSource).toContain('dashboard-glass-control')
    expect(dashboardSource).toContain('dashboard-granularity-control')
    expect(dashboardSource).toContain('--dashboard-card-surface')
    expect(dashboardSource).toContain('--dashboard-card-edge')
    expect(dashboardSource).toContain('--dashboard-card-shadow')
    expect(dashboardSource).toContain('--dashboard-control-surface: rgba(255, 255, 255, 0.72);')
    expect(dashboardSource).toContain('.admin-dashboard-liquid :deep(.card)')
    expect(dashboardSource).toContain('backdrop-filter: blur(22px) saturate(1.18);')
    expect(dashboardSource).toContain('.admin-dashboard-liquid :deep(.date-picker-trigger)')
    expect(dashboardSource).toContain('.admin-dashboard-liquid :deep(.dashboard-granularity-control .select-trigger)')
    expect(dashboardSource).toContain('@media (prefers-reduced-transparency: reduce)')
    expect(dashboardSource).toContain('@supports not ((backdrop-filter: blur(1px)) or (-webkit-backdrop-filter: blur(1px)))')
    expect(dashboardSource).not.toContain('--dashboard-glass-surface')
    expect(dashboardSource).not.toContain('--dashboard-material-surface')
    expect(dashboardSource).not.toContain('.admin-dashboard-liquid::before')
    expect(dashboardSource).not.toContain(':deep(.card::before)')
    expect(dashboardSource).not.toContain(':deep(.card::after)')
    expect(dashboardSource).not.toContain('mask-image')
    expect(dashboardSource).not.toContain(':global(.dark) .admin-dashboard-liquid')
    expect(dashboardSource).not.toContain('.sidebar')
    expect(dashboardSource).not.toContain('Codex')

    expect(globalStyleSource).toContain('.card {')
    expect(globalStyleSource).toContain('backdrop-filter: blur(14px) saturate(1.08);')
    expect(globalStyleSource).toContain('.dark .card')
    expect(globalStyleSource).toContain('rgba(5, 7, 12, 0.86)')
    expect(globalCardSource).not.toContain('mask-image')
  })
})
