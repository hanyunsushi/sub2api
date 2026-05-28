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
                <Icon name="key" size="md" class="text-primary-700 dark:text-primary-300" :stroke-width="2" />
              </div>
              <div>
                <p class="text-xs font-medium text-gray-500 dark:text-gray-400">
                  {{ t('admin.dashboard.apiKeys') }}
                </p>
                <p class="text-xl font-bold text-gray-900 dark:text-white">
                  {{ stats.total_api_keys }}
                </p>
                <p class="text-xs text-gray-600 dark:text-gray-400">
                  {{ stats.active_api_keys }} {{ t('common.active') }}
                </p>
              </div>
            </div>
          </div>

          <!-- Service Accounts -->
          <div class="card p-4">
            <div class="flex items-center gap-3">
              <div class="dashboard-stat-icon">
                <Icon name="server" size="md" class="text-primary-700 dark:text-primary-300" :stroke-width="2" />
              </div>
              <div>
                <p class="text-xs font-medium text-gray-500 dark:text-gray-400">
                  {{ t('admin.dashboard.accounts') }}
                </p>
                <p class="text-xl font-bold text-gray-900 dark:text-white">
                  {{ stats.total_accounts }}
                </p>
                <p class="text-xs">
                  <span class="text-gray-600 dark:text-gray-400"
                    >{{ stats.normal_accounts }} {{ t('common.active') }}</span
                  >
                  <span v-if="stats.error_accounts > 0" class="ml-1 text-red-500"
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
                <Icon name="chart" size="md" class="text-primary-700 dark:text-primary-300" :stroke-width="2" />
              </div>
              <div>
                <p class="text-xs font-medium text-gray-500 dark:text-gray-400">
                  {{ t('admin.dashboard.todayRequests') }}
                </p>
                <p class="text-xl font-bold text-gray-900 dark:text-white">
                  {{ stats.today_requests }}
                </p>
                <p class="text-xs text-gray-500 dark:text-gray-400">
                  {{ t('common.total') }}: {{ formatNumber(stats.total_requests) }}
                </p>
              </div>
            </div>
          </div>

          <!-- New Users Today -->
          <div class="card p-4">
            <div class="flex items-center gap-3">
              <div class="dashboard-stat-icon">
                <Icon name="userPlus" size="md" class="text-primary-700 dark:text-primary-300" :stroke-width="2" />
              </div>
              <div>
                <p class="text-xs font-medium text-gray-500 dark:text-gray-400">
                  {{ t('admin.dashboard.users') }}
                </p>
                <p class="text-xl font-bold text-gray-900 dark:text-white">
                  +{{ stats.today_new_users }}
                </p>
                <p class="text-xs text-gray-500 dark:text-gray-400">
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
                <Icon name="cube" size="md" class="text-primary-700 dark:text-primary-300" :stroke-width="2" />
              </div>
              <div>
                <p class="text-xs font-medium text-gray-500 dark:text-gray-400">
                  {{ t('admin.dashboard.todayTokens') }}
                </p>
                <p class="text-xl font-bold text-gray-900 dark:text-white">
                  {{ formatTokens(stats.today_tokens) }}
                </p>
                <p class="text-xs">
                  <span
                    class="text-gray-700 dark:text-gray-300"
                    :title="t('admin.dashboard.actual')"
                    >${{ formatCost(stats.today_actual_cost) }}</span
                  >
                  <span class="text-gray-400 dark:text-gray-500"> / </span>
                  <span
                    class="text-gray-600 dark:text-gray-400"
                    :title="t('admin.dashboard.accountCost')"
                    >${{ formatCost(stats.today_account_cost) }}</span
                  >
                  <span class="text-gray-400 dark:text-gray-500"> / </span>
                  <span
                    class="text-gray-400 dark:text-gray-500"
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
                <Icon name="database" size="md" class="text-primary-700 dark:text-primary-300" :stroke-width="2" />
              </div>
              <div>
                <p class="text-xs font-medium text-gray-500 dark:text-gray-400">
                  {{ t('admin.dashboard.totalTokens') }}
                </p>
                <p class="text-xl font-bold text-gray-900 dark:text-white">
                  {{ formatTokens(stats.total_tokens) }}
                </p>
                <p class="text-xs">
                  <span
                    class="text-gray-700 dark:text-gray-300"
                    :title="t('admin.dashboard.actual')"
                    >${{ formatCost(stats.total_actual_cost) }}</span
                  >
                  <span class="text-gray-400 dark:text-gray-500"> / </span>
                  <span
                    class="text-gray-600 dark:text-gray-400"
                    :title="t('admin.dashboard.accountCost')"
                    >${{ formatCost(stats.total_account_cost) }}</span
                  >
                  <span class="text-gray-400 dark:text-gray-500"> / </span>
                  <span
                    class="text-gray-400 dark:text-gray-500"
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
                <Icon name="bolt" size="md" class="text-primary-700 dark:text-primary-300" :stroke-width="2" />
              </div>
              <div class="flex-1">
                <p class="text-xs font-medium text-gray-500 dark:text-gray-400">
                  {{ t('admin.dashboard.performance') }}
                </p>
                <div class="flex items-baseline gap-2">
                  <p class="text-xl font-bold text-gray-900 dark:text-white">
                    {{ formatTokens(stats.rpm) }}
                  </p>
                  <span class="text-xs text-gray-500 dark:text-gray-400">RPM</span>
                </div>
                <div class="flex items-baseline gap-2">
                  <p class="text-sm font-semibold text-gray-700 dark:text-gray-300">
                    {{ formatTokens(stats.tpm) }}
                  </p>
                  <span class="text-xs text-gray-500 dark:text-gray-400">TPM</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Avg Response Time -->
          <div class="card p-4">
            <div class="flex items-center gap-3">
              <div class="dashboard-stat-icon">
                <Icon name="clock" size="md" class="text-primary-700 dark:text-primary-300" :stroke-width="2" />
              </div>
              <div>
                <p class="text-xs font-medium text-gray-500 dark:text-gray-400">
                  {{ t('admin.dashboard.avgResponse') }}
                </p>
                <p class="text-xl font-bold text-gray-900 dark:text-white">
                  {{ formatDuration(stats.average_duration_ms) }}
                </p>
                <p class="text-xs text-gray-500 dark:text-gray-400">
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
            <div class="flex flex-wrap items-center gap-4">
              <div class="dashboard-filter-range flex items-center gap-2">
                <span class="text-sm font-medium text-gray-700 dark:text-gray-300"
                  >{{ t('admin.dashboard.timeRange') }}:</span
                >
                <DateRangePicker
                  v-model:start-date="startDate"
                  v-model:end-date="endDate"
                  @change="onDateRangeChange"
                />
              </div>
              <button
                @click="loadDashboardStats"
                :disabled="chartsLoading"
                class="btn btn-secondary dashboard-paper-control dashboard-filter-refresh"
              >
                {{ t('common.refresh') }}
              </button>
              <div class="dashboard-filter-granularity ml-auto flex items-center gap-2">
                <span class="text-sm font-medium text-gray-700 dark:text-gray-300"
                  >{{ t('admin.dashboard.granularity') }}:</span
                >
                <div class="dashboard-granularity-control w-28">
                  <Select
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
            <h3 class="mb-4 text-sm font-semibold text-gray-900 dark:text-white">
              {{ t('admin.dashboard.recentUsage') }} (Top 12)
            </h3>
            <div class="h-64">
              <div v-if="userTrendLoading" class="flex h-full items-center justify-center">
                <LoadingSpinner size="md" />
              </div>
              <Line v-else-if="userTrendChartData" :data="userTrendChartData" :options="lineOptions" />
              <div
                v-else
                class="flex h-full items-center justify-center text-sm text-gray-500 dark:text-gray-400"
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
  --dashboard-control-surface: var(--atelier-paper-2);
  --dashboard-control-edge: var(--atelier-line-strong);
  --dashboard-control-shadow: rgba(23, 21, 18, 0.2);
  --dashboard-module-shadow: rgba(23, 21, 18, 0.36);
  --dashboard-module-rule: var(--atelier-console-rule);
  --dashboard-hover-surface: var(--atelier-butter);
  --dashboard-hover-edge: color-mix(in srgb, var(--atelier-butter) 48%, var(--atelier-material-edge));
  font-family: var(--atelier-font-sans);
}

.admin-dashboard-atelier :deep(.card) {
  border-radius: 8px;
  --atelier-card-accent: var(--atelier-blue);
  --atelier-card-surface: var(--atelier-paper-2);
  position: relative;
  overflow: hidden;
  border-color: var(--atelier-material-edge) !important;
  background: var(--atelier-paper-2) !important;
  box-shadow: 0 10px 24px -22px var(--dashboard-module-shadow);
  transition:
    transform 0.26s var(--atelier-ease),
    border-color 0.26s var(--atelier-ease),
    box-shadow 0.26s var(--atelier-ease),
    background-color 0.26s var(--atelier-ease);
}

.admin-dashboard-atelier :deep(.card)::after {
  content: none;
  display: none;
}

.admin-dashboard-atelier :deep(.card)::before {
  content: "";
  position: absolute;
  top: 0;
  right: 1rem;
  left: 1rem;
  height: 1px;
  background: var(--dashboard-module-rule);
  opacity: 0.82;
  pointer-events: none;
}

.admin-dashboard-atelier :deep(.card:hover) {
  transform: translate3d(0, -2px, 0);
  border-color: var(--dashboard-hover-edge) !important;
  background: var(--dashboard-hover-surface) !important;
  box-shadow: var(--atelier-material-shadow-hover) !important;
  color: var(--atelier-ink) !important;
}

.admin-dashboard-atelier > .grid > .card::after {
  content: "";
  position: absolute;
  right: 1rem;
  bottom: 0.75rem;
  left: 1rem;
  display: block;
  height: 3px;
  background:
    linear-gradient(var(--atelier-blue), var(--atelier-blue)) 0 0 / 42% 100% no-repeat,
    var(--atelier-paper);
  pointer-events: none;
}

.admin-dashboard-atelier > .grid > .card:nth-child(2n)::after {
  background:
    linear-gradient(var(--atelier-blue), var(--atelier-blue)) 0 0 / 58% 100% no-repeat,
    var(--atelier-paper);
}

.admin-dashboard-atelier > .grid > .card:nth-child(3n)::after {
  background:
    linear-gradient(var(--atelier-blue), var(--atelier-blue)) 0 0 / 76% 100% no-repeat,
    var(--atelier-paper);
}

.admin-dashboard-atelier :deep(.card .text-xl),
.admin-dashboard-atelier :deep(.card .text-sm.font-semibold) {
  color: var(--atelier-blue) !important;
}

.admin-dashboard-atelier :deep(.card .text-xl) {
  font-family: var(--atelier-font-mono);
  font-style: normal;
  font-weight: 600;
  letter-spacing: -0.02em;
}

.admin-dashboard-atelier :deep(.card .text-xs) {
  font-family: var(--atelier-font-mono);
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
  border: 1px solid var(--atelier-ink) !important;
  border-radius: 8px;
  background: var(--atelier-butter) !important;
  color: var(--atelier-ink);
  box-shadow: none !important;
}

.admin-dashboard-atelier :deep(.dashboard-filter-card)::before {
  right: 1rem;
  left: 1rem;
  background: repeating-linear-gradient(to right, rgba(23, 21, 18, 0.36), rgba(23, 21, 18, 0.36) 2px, transparent 2px, transparent 8px);
}

.admin-dashboard-atelier :deep(.dashboard-filter-card)::after {
  content: "";
  position: absolute;
  inset: 0;
  z-index: 4;
  display: block;
  height: auto;
  border-radius: inherit;
  background:
    var(--atelier-filter-stitch-horizontal) top left / 100% 1px no-repeat,
    var(--atelier-filter-stitch-horizontal) bottom left / 100% 1px no-repeat,
    var(--atelier-filter-stitch-vertical) top left / 1px 100% no-repeat,
    var(--atelier-filter-stitch-vertical) top right / 1px 100% no-repeat;
  pointer-events: none;
}

.admin-dashboard-atelier :deep(.dashboard-filter-card > div) {
  min-height: 3.25rem;
  align-items: center;
}

.admin-dashboard-atelier :deep(.dashboard-filter-card > div > .dashboard-filter-range) {
  margin: -1rem 0 -1rem -1rem;
  padding: 1rem 0.75rem 1rem 1rem;
  align-items: center;
  align-self: stretch;
  position: relative;
  border-right: 0;
  background: var(--atelier-ink);
  color: var(--atelier-paper);
}

.admin-dashboard-atelier :deep(.dashboard-filter-card > div > .dashboard-filter-range)::after {
  content: none;
}

.admin-dashboard-atelier :deep(.dashboard-filter-card > div > .dashboard-filter-refresh) {
  align-self: center;
  margin: 0;
}

.admin-dashboard-atelier :deep(.dashboard-filter-card > div > .flex:not(.dashboard-filter-range)) {
  color: var(--atelier-ink);
}

.admin-dashboard-atelier :deep(.dashboard-filter-card > div > .flex:not(.dashboard-filter-range) > span) {
  color: var(--atelier-ink) !important;
  font-family: var(--atelier-font-mono);
  font-size: 0.625rem;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.admin-dashboard-atelier :deep(.dashboard-filter-card > div > .dashboard-filter-range > span) {
  color: var(--atelier-paper) !important;
  -webkit-text-fill-color: var(--atelier-paper) !important;
  font-family: var(--atelier-font-mono);
  font-size: 0.625rem;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.admin-dashboard-atelier :deep(.dashboard-filter-card > div > .dashboard-filter-range:hover > span) {
  color: var(--atelier-paper) !important;
  -webkit-text-fill-color: var(--atelier-paper) !important;
}

.admin-dashboard-atelier :deep(.dashboard-filter-card > div > .dashboard-filter-granularity) {
  align-self: center;
}

.admin-dashboard-atelier :deep(.dashboard-filter-card .dashboard-paper-control),
.admin-dashboard-atelier :deep(.date-picker-trigger),
.admin-dashboard-atelier :deep(.dashboard-granularity-control .select-trigger) {
  border-color: rgba(255, 250, 240, 0.28) !important;
  background: var(--atelier-ink) !important;
  color: var(--atelier-paper) !important;
  font-family: var(--atelier-font-mono);
  box-shadow: none !important;
}

.admin-dashboard-atelier :deep(.dashboard-filter-card .dashboard-paper-control) {
  position: relative;
  overflow: visible;
}

.admin-dashboard-atelier :deep(.date-picker-trigger *),
.admin-dashboard-atelier :deep(.dashboard-granularity-control .select-trigger *) {
  color: var(--atelier-paper) !important;
}

.admin-dashboard-atelier :deep(.dashboard-filter-card .dashboard-paper-control:hover),
.admin-dashboard-atelier :deep(.date-picker-trigger:hover),
.admin-dashboard-atelier :deep(.dashboard-granularity-control .select-trigger:hover) {
  border-color: var(--atelier-paper) !important;
  background: var(--atelier-ink) !important;
  color: var(--atelier-paper) !important;
}

.admin-dashboard-atelier:where(.dark *) {
  --dashboard-control-surface: var(--atelier-paper-2);
  --dashboard-control-edge: rgba(23, 21, 18, 0.18);
  --dashboard-control-shadow: rgba(17, 24, 39, 0.16);
}

.admin-dashboard-atelier:where(.dark *) :deep(.dashboard-filter-card),
.admin-dashboard-atelier:where(.dark *) :deep(.dashboard-filter-card .dashboard-paper-control),
.admin-dashboard-atelier:where(.dark *) :deep(.date-picker-trigger),
.admin-dashboard-atelier:where(.dark *) :deep(.dashboard-granularity-control .select-trigger) {
  border-color: var(--dashboard-control-edge);
  background: var(--dashboard-control-surface);
}

.dashboard-stat-icon {
  background: var(--atelier-material-1);
  border: 1px solid var(--atelier-material-edge);
  color: var(--atelier-ink);
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
