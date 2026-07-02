<template>
  <AppLayout>
    <div class="admin-dashboard-atelier space-y-6">
      <!-- Loading State -->
      <div v-if="loading" class="flex items-center justify-center py-12">
        <LoadingSpinner />
      </div>

      <template v-else-if="stats">
        <!-- Row 1: Core Stats -->
        <div class="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <!-- Total API Keys -->
          <div class="card p-4">
            <div class="flex items-center gap-3">
              <div class="dashboard-stat-icon">
                <Icon name="key" size="md" :stroke-width="2" />
              </div>
              <div>
                <p class="text-xs font-medium text-[var(--anthropic-muted)] dark:text-[var(--anthropic-muted)]">
                  {{ t('admin.dashboard.apiKeys') }}
                </p>
                <p class="numeric text-xl font-bold text-[var(--anthropic-fg)] dark:text-[var(--anthropic-fg)]">
                  {{ stats.total_api_keys }}
                </p>
                <p class="text-xs text-[var(--anthropic-muted)] dark:text-[var(--anthropic-muted)]">
                  {{ stats.active_api_keys }} {{ t('common.active') }}
                </p>
              </div>
            </div>
          </div>

          <!-- Service Accounts -->
          <div class="card p-4">
            <div class="flex items-center gap-3">
              <div class="dashboard-stat-icon">
                <Icon name="server" size="md" :stroke-width="2" />
              </div>
              <div>
                <p class="text-xs font-medium text-[var(--anthropic-muted)] dark:text-[var(--anthropic-muted)]">
                  {{ t('admin.dashboard.accounts') }}
                </p>
                <p class="numeric text-xl font-bold text-[var(--anthropic-fg)] dark:text-[var(--anthropic-fg)]">
                  {{ stats.total_accounts }}
                </p>
                <p class="text-xs">
                  <span class="text-[var(--anthropic-muted)] dark:text-[var(--anthropic-muted)]"
                    >{{ stats.normal_accounts }} {{ t('common.active') }}</span
                  >
                  <span v-if="stats.error_accounts > 0" class="ml-1 text-[var(--anthropic-error)]"
                    >{{ stats.error_accounts }} {{ t('common.error') }}</span
                  >
                </p>
              </div>
            </div>
          </div>

          <!-- Today Requests -->
          <div class="card p-4">
            <div class="flex items-center gap-3">
              <div class="dashboard-stat-icon">
                <Icon name="chart" size="md" :stroke-width="2" />
              </div>
              <div>
                <p class="text-xs font-medium text-[var(--anthropic-muted)] dark:text-[var(--anthropic-muted)]">
                  {{ t('admin.dashboard.todayRequests') }}
                </p>
                <p class="numeric text-xl font-bold text-[var(--anthropic-fg)] dark:text-[var(--anthropic-fg)]">
                  {{ stats.today_requests }}
                </p>
                <p class="text-xs text-[var(--anthropic-muted)] dark:text-[var(--anthropic-muted)]">
                  {{ t('common.total') }}: {{ formatNumber(stats.total_requests) }}
                </p>
              </div>
            </div>
          </div>

          <!-- New Users Today -->
          <div class="card p-4">
            <div class="flex items-center gap-3">
              <div class="dashboard-stat-icon">
                <Icon name="userPlus" size="md" :stroke-width="2" />
              </div>
              <div>
                <p class="text-xs font-medium text-[var(--anthropic-muted)] dark:text-[var(--anthropic-muted)]">
                  {{ t('admin.dashboard.users') }}
                </p>
                <p class="numeric text-xl font-bold text-[var(--anthropic-fg)] dark:text-[var(--anthropic-fg)]">
                  +{{ stats.today_new_users }}
                </p>
                <p class="text-xs text-[var(--anthropic-muted)] dark:text-[var(--anthropic-muted)]">
                  {{ t('common.total') }}: {{ formatNumber(stats.total_users) }}
                </p>
              </div>
            </div>
          </div>
        </div>

        <!-- Row 2: Token Stats -->
        <div class="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <!-- Today Tokens -->
          <div class="card p-4">
            <div class="flex items-center gap-3">
              <div class="dashboard-stat-icon">
                <Icon name="cube" size="md" :stroke-width="2" />
              </div>
              <div>
                <p class="text-xs font-medium text-[var(--anthropic-muted)] dark:text-[var(--anthropic-muted)]">
                  {{ t('admin.dashboard.todayTokens') }}
                </p>
                <p class="numeric text-xl font-bold text-[var(--anthropic-fg)] dark:text-[var(--anthropic-fg)]">
                  {{ formatTokens(stats.today_tokens) }}
                </p>
                <p class="text-xs">
                  <span
                    class="text-[var(--anthropic-muted)] dark:text-[var(--anthropic-muted)]"
                    :title="t('admin.dashboard.actual')"
                    >${{ formatCost(stats.today_actual_cost) }}</span
                  >
                  <span class="text-[var(--anthropic-muted)] dark:text-[var(--anthropic-muted)]"> / </span>
                  <span
                    class="text-[var(--anthropic-muted)] dark:text-[var(--anthropic-muted)]"
                    :title="t('admin.dashboard.accountCost')"
                    >${{ formatCost(stats.today_account_cost) }}</span
                  >
                  <span class="text-[var(--anthropic-muted)] dark:text-[var(--anthropic-muted)]"> / </span>
                  <span
                    class="text-[var(--anthropic-muted)] dark:text-[var(--anthropic-muted)]"
                    :title="t('admin.dashboard.standard')"
                    >${{ formatCost(stats.today_cost) }}</span
                  >
                </p>
              </div>
            </div>
          </div>

          <!-- Total Tokens -->
          <div class="card p-4">
            <div class="flex items-center gap-3">
              <div class="dashboard-stat-icon">
                <Icon name="database" size="md" :stroke-width="2" />
              </div>
              <div>
                <p class="text-xs font-medium text-[var(--anthropic-muted)] dark:text-[var(--anthropic-muted)]">
                  {{ t('admin.dashboard.totalTokens') }}
                </p>
                <p class="numeric text-xl font-bold text-[var(--anthropic-fg)] dark:text-[var(--anthropic-fg)]">
                  {{ formatTokens(stats.total_tokens) }}
                </p>
                <p class="text-xs">
                  <span
                    class="text-[var(--anthropic-muted)] dark:text-[var(--anthropic-muted)]"
                    :title="t('admin.dashboard.actual')"
                    >${{ formatCost(stats.total_actual_cost) }}</span
                  >
                  <span class="text-[var(--anthropic-muted)] dark:text-[var(--anthropic-muted)]"> / </span>
                  <span
                    class="text-[var(--anthropic-muted)] dark:text-[var(--anthropic-muted)]"
                    :title="t('admin.dashboard.accountCost')"
                    >${{ formatCost(stats.total_account_cost) }}</span
                  >
                  <span class="text-[var(--anthropic-muted)] dark:text-[var(--anthropic-muted)]"> / </span>
                  <span
                    class="text-[var(--anthropic-muted)] dark:text-[var(--anthropic-muted)]"
                    :title="t('admin.dashboard.standard')"
                    >${{ formatCost(stats.total_cost) }}</span
                  >
                </p>
              </div>
            </div>
          </div>

          <!-- Performance (RPM/TPM) -->
          <div class="card p-4">
            <div class="flex items-center gap-3">
              <div class="dashboard-stat-icon">
                <Icon name="bolt" size="md" :stroke-width="2" />
              </div>
              <div class="flex-1">
                <p class="text-xs font-medium text-[var(--anthropic-muted)] dark:text-[var(--anthropic-muted)]">
                  {{ t('admin.dashboard.performance') }}
                </p>
                <div class="flex items-baseline gap-2">
                  <p class="numeric text-xl font-bold text-[var(--anthropic-fg)] dark:text-[var(--anthropic-fg)]">
                    {{ formatTokens(stats.rpm) }}
                  </p>
                  <span class="text-xs text-[var(--anthropic-muted)] dark:text-[var(--anthropic-muted)]">RPM</span>
                </div>
                <div class="flex items-baseline gap-2">
                  <p class="numeric text-sm font-semibold text-[var(--anthropic-muted)] dark:text-[var(--anthropic-muted)]">
                    {{ formatTokens(stats.tpm) }}
                  </p>
                  <span class="text-xs text-[var(--anthropic-muted)] dark:text-[var(--anthropic-muted)]">TPM</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Avg Response Time -->
          <div class="card p-4">
            <div class="flex items-center gap-3">
              <div class="dashboard-stat-icon">
                <Icon name="clock" size="md" :stroke-width="2" />
              </div>
              <div>
                <p class="text-xs font-medium text-[var(--anthropic-muted)] dark:text-[var(--anthropic-muted)]">
                  {{ t('admin.dashboard.avgResponse') }}
                </p>
                <p class="numeric text-xl font-bold text-[var(--anthropic-fg)] dark:text-[var(--anthropic-fg)]">
                  {{ formatDuration(stats.average_duration_ms) }}
                </p>
                <p class="text-xs text-[var(--anthropic-muted)] dark:text-[var(--anthropic-muted)]">
                  {{ stats.active_users }} {{ t('admin.dashboard.activeUsers') }}
                </p>
              </div>
            </div>
          </div>
        </div>

        <!-- Charts Section -->
        <div class="space-y-6">
          <!-- Date Range Filter -->
          <div class="card dashboard-filter-card p-4">
            <div class="dashboard-filter-shell flex flex-wrap items-center gap-3">
              <div class="dashboard-filter-range flex items-center gap-1.5">
                <span class="filter-label text-[var(--anthropic-muted)] dark:text-[var(--anthropic-muted)]"
                  >{{ t('admin.dashboard.timeRange') }}:</span
                >
                <DateRangePicker
                  variant="text-control"
                  v-model:start-date="startDate"
                  v-model:end-date="endDate"
                  @change="onDateRangeChange"
                />
              </div>
              <button data-testid="admin-dashboard-button-load-dashboard-stats"
                @click="loadDashboardStats"
                :disabled="chartsLoading"
                class="btn btn-tertiary btn-tiny dashboard-paper-control dashboard-filter-refresh anthropic-refresh-action-button"
              >
                {{ t('common.refresh') }}
              </button>
              <div class="dashboard-filter-granularity flex items-center gap-1.5">
                <span class="filter-label text-[var(--anthropic-muted)] dark:text-[var(--anthropic-muted)]"
                  >{{ t('admin.dashboard.granularity') }}:</span
                >
                <div class="dashboard-granularity-control w-28">
                  <Select
                    variant="text-control"
                    v-model="granularity"
                    :options="granularityOptions"
                    @change="loadChartData"
                  />
                </div>
              </div>
            </div>
          </div>

          <!-- Charts Grid -->
          <div class="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <ModelDistributionChart
              :model-stats="modelStats"
              :enable-ranking-view="true"
              :ranking-items="rankingItems"
              :ranking-total-actual-cost="rankingTotalActualCost"
              :ranking-total-requests="rankingTotalRequests"
              :ranking-total-tokens="rankingTotalTokens"
              :loading="chartsLoading"
              :ranking-loading="rankingLoading"
              :ranking-error="rankingError"
              :start-date="startDate"
              :end-date="endDate"
              @ranking-click="goToUserUsage"
            />
            <TokenUsageTrend :trend-data="trendData" :loading="chartsLoading" />
          </div>

          <!-- User Usage Trend (Full Width) -->
          <div class="card p-4">
            <h3 class="mb-4 text-sm font-semibold text-[var(--anthropic-fg)] dark:text-[var(--anthropic-fg)]">
              {{ t('admin.dashboard.recentUsage') }} (Top 12)
            </h3>
            <div class="h-64">
              <div v-if="userTrendLoading" class="flex h-full items-center justify-center">
                <LoadingSpinner size="md" />
              </div>
              <Line v-else-if="userTrendChartData" :data="userTrendChartData" :options="lineOptions" />
              <div
                v-else
                class="flex h-full items-center justify-center text-sm text-[var(--anthropic-muted)] dark:text-[var(--anthropic-muted)]"
              >
                {{ t('admin.dashboard.noDataAvailable') }}
              </div>
            </div>
          </div>
        </div>
      </template>
    </div>
  </AppLayout>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import { useAppStore } from '@/stores/app'

const { t } = useI18n()
import { adminAPI } from '@/api/admin'
import type {
  DashboardStats,
  TrendDataPoint,
  ModelStat,
  UserUsageTrendPoint,
  UserSpendingRankingItem
} from '@/types'
import AppLayout from '@/components/layout/AppLayout.vue'
import LoadingSpinner from '@/components/common/LoadingSpinner.vue'
import Icon from '@/components/icons/Icon.vue'
import DateRangePicker from '@/components/common/DateRangePicker.vue'
import Select from '@/components/common/Select.vue'
import ModelDistributionChart from '@/components/charts/ModelDistributionChart.vue'
import TokenUsageTrend from '@/components/charts/TokenUsageTrend.vue'
import { getChartColor, withChartAlpha } from '@/utils/chartColors'

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
  Filler
} from 'chart.js'
import { Line } from 'vue-chartjs'

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
  Filler
)

const appStore = useAppStore()
const router = useRouter()
const stats = ref<DashboardStats | null>(null)
const loading = ref(false)
const chartsLoading = ref(false)
const userTrendLoading = ref(false)
const rankingLoading = ref(false)
const rankingError = ref(false)

// Chart data
const trendData = ref<TrendDataPoint[]>([])
const modelStats = ref<ModelStat[]>([])
const userTrend = ref<UserUsageTrendPoint[]>([])
const rankingItems = ref<UserSpendingRankingItem[]>([])
const rankingTotalActualCost = ref(0)
const rankingTotalRequests = ref(0)
const rankingTotalTokens = ref(0)
let chartLoadSeq = 0
let usersTrendLoadSeq = 0
let rankingLoadSeq = 0
const rankingLimit = 12

// Helper function to format date in local timezone
const formatLocalDate = (date: Date): string => {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

const getLast24HoursRangeDates = (): { start: string; end: string } => {
  const end = new Date()
  const start = new Date(end.getTime() - 24 * 60 * 60 * 1000)
  return {
    start: formatLocalDate(start),
    end: formatLocalDate(end)
  }
}

// Date range
const granularity = ref<'day' | 'hour'>('hour')
const defaultRange = getLast24HoursRangeDates()
const startDate = ref(defaultRange.start)
const endDate = ref(defaultRange.end)

// Granularity options for Select component
const granularityOptions = computed(() => [
  { value: 'day', label: t('admin.dashboard.day') },
  { value: 'hour', label: t('admin.dashboard.hour') }
])

// Dark mode detection
const isDarkMode = computed(() => {
  return document.documentElement.classList.contains('dark')
})

// Chart colors
const chartColors = computed(() => ({
  text: isDarkMode.value ? '#e5e7eb' : '#374151',
  grid: isDarkMode.value ? '#374151' : '#e5e7eb'
}))

// Line chart options (for user trend chart)
const lineOptions = computed(() => ({
  responsive: true,
  maintainAspectRatio: false,
  interaction: {
    intersect: false,
    mode: 'index' as const
  },
  plugins: {
    legend: {
      position: 'top' as const,
      labels: {
        color: chartColors.value.text,
        usePointStyle: true,
        pointStyle: 'circle',
        padding: 15,
        font: {
          size: 11
        }
      }
    },
    tooltip: {
      itemSort: (a: any, b: any) => {
        const aValue = typeof a?.raw === 'number' ? a.raw : Number(a?.parsed?.y ?? 0)
        const bValue = typeof b?.raw === 'number' ? b.raw : Number(b?.parsed?.y ?? 0)
        return bValue - aValue
      },
      callbacks: {
        label: (context: any) => {
          return `${context.dataset.label}: ${formatTokens(context.raw)}`
        }
      }
    }
  },
  scales: {
    x: {
      grid: {
        color: chartColors.value.grid
      },
      ticks: {
        color: chartColors.value.text,
        font: {
          size: 10
        }
      }
    },
    y: {
      grid: {
        color: chartColors.value.grid
      },
      ticks: {
        color: chartColors.value.text,
        font: {
          size: 10
        },
        callback: (value: string | number) => formatTokens(Number(value))
      }
    }
  }
}))

// User trend chart data
const userTrendChartData = computed(() => {
  if (!userTrend.value?.length) return null

  const getDisplayName = (point: UserUsageTrendPoint): string => {
    const username = point.username?.trim()
    if (username) {
      return username
    }

    const email = point.email?.trim()
    if (email) {
      return email
    }

    return t('admin.redeem.userPrefix', { id: point.user_id })
  }

  // Group by user_id to avoid merging different users with the same display name
  const userGroups = new Map<number, { name: string; data: Map<string, number> }>()
  const allDates = new Set<string>()

  userTrend.value.forEach((point) => {
    allDates.add(point.date)
    const key = point.user_id
    if (!userGroups.has(key)) {
      userGroups.set(key, { name: getDisplayName(point), data: new Map() })
    }
    userGroups.get(key)!.data.set(point.date, point.tokens)
  })

  const sortedDates = Array.from(allDates).sort()
  const datasets = Array.from(userGroups.values()).map((group, idx) => ({
    label: group.name,
    data: sortedDates.map((date) => group.data.get(date) || 0),
    borderColor: getChartColor(idx),
    backgroundColor: withChartAlpha(getChartColor(idx)),
    fill: false,
    tension: 0.3
  }))

  return {
    labels: sortedDates,
    datasets
  }
})

// Format helpers
const formatTokens = (value: number | undefined): string => {
  if (value === undefined || value === null) return '0'
  if (value >= 1_000_000_000) {
    return `${(value / 1_000_000_000).toFixed(2)}B`
  } else if (value >= 1_000_000) {
    return `${(value / 1_000_000).toFixed(2)}M`
  } else if (value >= 1_000) {
    return `${(value / 1_000).toFixed(2)}K`
  }
  return value.toLocaleString()
}

const formatNumber = (value: number): string => {
  return value.toLocaleString()
}

const formatCost = (value: number | null | undefined): string => {
  if (value === undefined || value === null) return '0.0000'
  if (value >= 1000) {
    return (value / 1000).toFixed(2) + 'K'
  } else if (value >= 1) {
    return value.toFixed(2)
  } else if (value >= 0.01) {
    return value.toFixed(3)
  }
  return value.toFixed(4)
}

const formatDuration = (ms: number): string => {
  if (ms >= 1000) {
    return `${(ms / 1000).toFixed(2)}s`
  }
  return `${Math.round(ms)}ms`
}

const goToUserUsage = (item: UserSpendingRankingItem) => {
  void router.push({
    path: '/admin/usage',
    query: {
      user_id: String(item.user_id),
      start_date: startDate.value,
      end_date: endDate.value
    }
  })
}

// Date range change handler
const onDateRangeChange = (range: {
  startDate: string
  endDate: string
  preset: string | null
}) => {
  // Auto-select granularity based on date range
  const start = new Date(range.startDate)
  const end = new Date(range.endDate)
  const daysDiff = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))

  // If range is 1 day, use hourly granularity
  if (daysDiff <= 1) {
    granularity.value = 'hour'
  } else {
    granularity.value = 'day'
  }

  loadChartData()
}

// Load data
const loadDashboardSnapshot = async (includeStats: boolean) => {
  const currentSeq = ++chartLoadSeq
  if (includeStats && !stats.value) {
    loading.value = true
  }
  chartsLoading.value = true
  try {
    const response = await adminAPI.dashboard.getSnapshotV2({
      start_date: startDate.value,
      end_date: endDate.value,
      granularity: granularity.value,
      include_stats: includeStats,
      include_trend: true,
      include_model_stats: true,
      include_group_stats: false,
      include_users_trend: false
    })
    if (currentSeq !== chartLoadSeq) return
    if (includeStats && response.stats) {
      stats.value = response.stats
    }
    trendData.value = response.trend || []
    modelStats.value = response.models || []
  } catch (error) {
    if (currentSeq !== chartLoadSeq) return
    appStore.showError(t('admin.dashboard.failedToLoad'))
    console.error('Error loading dashboard snapshot:', error)
  } finally {
    if (currentSeq === chartLoadSeq) {
      loading.value = false
      chartsLoading.value = false
    }
  }
}

const loadUsersTrend = async () => {
  const currentSeq = ++usersTrendLoadSeq
  userTrendLoading.value = true
  try {
    const response = await adminAPI.dashboard.getUserUsageTrend({
      start_date: startDate.value,
      end_date: endDate.value,
      granularity: granularity.value,
      limit: 12
    })
    if (currentSeq !== usersTrendLoadSeq) return
    userTrend.value = response.trend || []
  } catch (error) {
    if (currentSeq !== usersTrendLoadSeq) return
    console.error('Error loading users trend:', error)
    userTrend.value = []
  } finally {
    if (currentSeq === usersTrendLoadSeq) {
      userTrendLoading.value = false
    }
  }
}

const loadUserSpendingRanking = async () => {
  const currentSeq = ++rankingLoadSeq
  rankingLoading.value = true
  rankingError.value = false
  try {
    const response = await adminAPI.dashboard.getUserSpendingRanking({
      start_date: startDate.value,
      end_date: endDate.value,
      limit: rankingLimit
    })
    if (currentSeq !== rankingLoadSeq) return
    rankingItems.value = response.ranking || []
    rankingTotalActualCost.value = response.total_actual_cost || 0
    rankingTotalRequests.value = response.total_requests || 0
    rankingTotalTokens.value = response.total_tokens || 0
  } catch (error) {
    if (currentSeq !== rankingLoadSeq) return
    console.error('Error loading user spending ranking:', error)
    rankingItems.value = []
    rankingTotalActualCost.value = 0
    rankingTotalRequests.value = 0
    rankingTotalTokens.value = 0
    rankingError.value = true
  } finally {
    if (currentSeq === rankingLoadSeq) {
      rankingLoading.value = false
    }
  }
}

const loadDashboardStats = async () => {
  await Promise.all([
    loadDashboardSnapshot(true),
    loadUsersTrend(),
    loadUserSpendingRanking()
  ])
}

const loadChartData = async () => {
  await Promise.all([
    loadDashboardSnapshot(false),
    loadUsersTrend(),
    loadUserSpendingRanking()
  ])
}

const handleDashboardFilterPointerDown = (event: PointerEvent) => {
  const target = event.target as Element | null
  if (!target?.closest('.dashboard-filter-card')) return
  document.body.classList.add('dashboard-filter-menu-open')
}

const handleDashboardFilterBodyClick = (event: MouseEvent) => {
  const target = event.target as Element | null
  if (target?.closest('.dashboard-filter-card, .date-picker-dropdown-portal, .select-dropdown-portal')) return
  document.body.classList.remove('dashboard-filter-menu-open')
}

onMounted(() => {
  document.addEventListener('pointerdown', handleDashboardFilterPointerDown, true)
  document.addEventListener('click', handleDashboardFilterBodyClick, true)
  loadDashboardStats()
})

onBeforeUnmount(() => {
  document.removeEventListener('pointerdown', handleDashboardFilterPointerDown, true)
  document.removeEventListener('click', handleDashboardFilterBodyClick, true)
  document.body.classList.remove('dashboard-filter-menu-open')
})
</script>

<style scoped>
.admin-dashboard-atelier {
  font-family: var(--atelier-font-sans);
}

.admin-dashboard-atelier :deep(.card) {
  position: relative;
  overflow: hidden;
  border-color: var(--anthropic-cookbook-border) !important;
  border-radius: 8px;
  background: var(--anthropic-page) !important;
  box-shadow: none !important;
  transition:
    background-color 0.15s ease,
    border-color 0.15s ease,
    color 0.15s ease;
}

.admin-dashboard-atelier :deep(.card)::after,
.admin-dashboard-atelier :deep(.card)::before {
  content: none;
  display: none;
}

.admin-dashboard-atelier :deep(.card:hover),
.admin-dashboard-atelier :deep(.card:focus-within) {
  transform: none !important;
  border-color: var(--anthropic-cookbook-border) !important;
  background: var(--anthropic-page) !important;
  box-shadow: none !important;
  color: var(--atelier-ink) !important;
}

.admin-dashboard-atelier :deep(.card .text-xl),
.admin-dashboard-atelier :deep(.card .text-sm.font-semibold) {
  color: var(--atelier-ink) !important;
}

.admin-dashboard-atelier :deep(.card .text-xl) {
  font-family: var(--atelier-font-mono);
  font-style: normal;
  font-weight: 600;
  letter-spacing: -0.02em;
}

.admin-dashboard-atelier :deep(.card .text-xs) {
  font-family: var(--atelier-font-sans);
  font-size: 0.625rem;
  letter-spacing: 0.08em;
  color: var(--atelier-muted) !important;
}

.admin-dashboard-atelier :deep(.card h3) {
  color: var(--atelier-ink) !important;
}

.admin-dashboard-atelier :deep(.card canvas) {
  filter: saturate(0.92);
}

.admin-dashboard-atelier :deep(.dashboard-filter-card) {
  border: 1px solid var(--anthropic-cookbook-border) !important;
  border-radius: 8px;
  background: var(--anthropic-page) !important;
  color: var(--atelier-slab-text);
  box-shadow: none !important;
}

.admin-dashboard-atelier :deep(.dashboard-filter-card)::before,
.admin-dashboard-atelier :deep(.dashboard-filter-card)::after {
  content: none;
  display: none;
}

.admin-dashboard-atelier :deep(.dashboard-filter-card > div) {
  min-height: 3rem;
  align-items: center;
}

.admin-dashboard-atelier :deep(.dashboard-filter-card > div > .dashboard-filter-range) {
  margin: 0;
  padding: 0;
  align-items: center;
  align-self: center;
  position: relative;
  border-right: 0;
  background: transparent;
  color: var(--atelier-slab-text);
}

.admin-dashboard-atelier :deep(.dashboard-filter-card > div > .dashboard-filter-range)::after {
  content: none;
}

.admin-dashboard-atelier :deep(.dashboard-filter-card > div > .dashboard-filter-refresh) {
  align-self: center;
  margin: 0;
}

.admin-dashboard-atelier :deep(.dashboard-filter-card > div > .flex:not(.dashboard-filter-range)) {
  color: var(--atelier-slab-text);
}

.admin-dashboard-atelier :deep(.dashboard-filter-card > div > .flex:not(.dashboard-filter-range) > span) {
  color: var(--atelier-slab-text) !important;
  font-family: var(--atelier-font-sans);
  font-size: var(--anthropic-control-font-size, 0.8125rem);
  font-weight: var(--anthropic-control-font-weight, 500);
  line-height: var(--anthropic-control-line-height, 1.25rem);
  letter-spacing: 0;
  text-transform: none;
}

.admin-dashboard-atelier :deep(.dashboard-filter-card > div > .dashboard-filter-range > span) {
  color: var(--atelier-slab-text) !important;
  -webkit-text-fill-color: var(--atelier-slab-text) !important;
  font-family: var(--atelier-font-sans);
  font-size: var(--anthropic-control-font-size, 0.8125rem);
  font-weight: var(--anthropic-control-font-weight, 500);
  line-height: var(--anthropic-control-line-height, 1.25rem);
  letter-spacing: 0;
  text-transform: none;
}

.admin-dashboard-atelier :deep(.dashboard-filter-card > div > .dashboard-filter-range:hover > span) {
  color: var(--atelier-slab-text) !important;
  -webkit-text-fill-color: var(--atelier-slab-text) !important;
}

.admin-dashboard-atelier :deep(.dashboard-filter-card > div > .dashboard-filter-granularity) {
  align-self: center;
  background: transparent !important;
}

.admin-dashboard-atelier :deep(.dashboard-filter-card .dashboard-paper-control),
.admin-dashboard-atelier :deep(.date-picker-trigger),
.admin-dashboard-atelier :deep(.dashboard-granularity-control .select-trigger) {
  border-color: transparent !important;
  background: transparent !important;
  color: var(--atelier-slab-text) !important;
  font-family: var(--atelier-font-sans);
  box-shadow: none !important;
}

.admin-dashboard-atelier :deep(.dashboard-filter-card .dashboard-paper-control) {
  position: relative;
  overflow: visible;
}

.admin-dashboard-atelier :deep(.date-picker-trigger *),
.admin-dashboard-atelier :deep(.dashboard-granularity-control .select-trigger *) {
  color: var(--atelier-slab-text) !important;
}

.admin-dashboard-atelier :deep(.dashboard-filter-card .dashboard-paper-control:hover),
.admin-dashboard-atelier :deep(.date-picker-trigger:hover),
.admin-dashboard-atelier :deep(.dashboard-granularity-control .select-trigger:hover) {
  border-color: transparent !important;
  background: transparent !important;
  color: var(--atelier-slab-text) !important;
}

.admin-dashboard-atelier :deep(.dashboard-filter-card .dashboard-filter-refresh.btn.btn-tertiary.btn-tiny.dashboard-paper-control) {
  --button-bg: transparent;
  --button-border: var(--anthropic-cookbook-border);
  --button-border-hover: var(--anthropic-cookbook-border-hover);
  min-height: var(--anthropic-control-height, 2rem);
  padding: 0.375rem 0.625rem;
  border-color: var(--button-border) !important;
  border-radius: 8px;
  background: transparent !important;
  color: var(--anthropic-fg) !important;
  box-shadow: var(--anthropic-button-ring) !important;
  font-size: var(--anthropic-control-font-size, 0.8125rem);
  font-weight: var(--anthropic-control-font-weight, 500);
  line-height: var(--anthropic-control-line-height, 1.25rem);
}

.admin-dashboard-atelier :deep(.dashboard-filter-card .dashboard-filter-refresh.btn.btn-tertiary.btn-tiny.dashboard-paper-control:hover) {
  background: transparent !important;
  color: var(--anthropic-fg) !important;
  box-shadow: var(--anthropic-button-ring-hover) !important;
}

.admin-dashboard-atelier:where(.dark *) {
  --anthropic-cookbook-border: rgba(20, 19, 19, 0.08);
  --anthropic-cookbook-border-hover: rgba(20, 19, 19, 0.16);
}

.admin-dashboard-atelier:where(.dark *) :deep(.dashboard-filter-card),
.admin-dashboard-atelier:where(.dark *) :deep(.dashboard-filter-card .dashboard-paper-control),
.admin-dashboard-atelier:where(.dark *) :deep(.date-picker-trigger),
.admin-dashboard-atelier:where(.dark *) :deep(.dashboard-granularity-control .select-trigger) {
  border-color: transparent;
  background: transparent;
}

.dashboard-stat-icon {
  background: transparent;
  border: 1px solid var(--anthropic-cookbook-border);
  color: var(--atelier-muted);
  box-shadow: none;
}

.dashboard-stat-icon :deep(svg),
.dashboard-stat-icon :deep(svg *),
.dashboard-stat-icon :deep(path) {
  color: currentColor !important;
  fill: none !important;
  stroke: currentColor !important;
}

.dashboard-stat-icon:where(.dark *) {
  color: var(--atelier-ink);
}

</style>
