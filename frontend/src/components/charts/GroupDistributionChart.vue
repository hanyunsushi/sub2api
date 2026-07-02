<template>
  <div class="card group-distribution-card p-4">
    <div class="mb-4 flex items-center justify-between gap-3">
      <h3 class="text-sm font-semibold text-[var(--anthropic-fg)] dark:text-[var(--anthropic-fg)]">
        {{ t('admin.dashboard.groupDistribution') }}
      </h3>
      <div
        v-if="showMetricToggle"
        ref="metricTabsRef"
        class="route-tabs group-distribution-control-group group-distribution-route-tabs inline-flex"
        data-route-tabs="group-distribution-metric"
        role="tablist"
        @mouseleave="moveMetricIndicatorToSelected"
        @focusout="handleMetricTabsFocusout"
      >
        <button data-testid="charts-group-distribution-chart-button-emit-update-metric-tokens"
          type="button"
          class="group-distribution-toggle"
          role="tab"
          data-route-id="tokens"
          :aria-selected="metric === 'tokens'"
          :class="metric === 'tokens'
            ? 'group-distribution-toggle-active'
            : 'group-distribution-toggle-idle'"
          @mouseenter="moveIndicatorFromEvent"
          @focus="moveIndicatorFromEvent"
          @click="emit('update:metric', 'tokens')"
        >
          {{ t('admin.dashboard.metricTokens') }}
        </button>
        <button data-testid="charts-group-distribution-chart-button-emit-update-metric-actual-cost"
          type="button"
          class="group-distribution-toggle"
          role="tab"
          data-route-id="actual_cost"
          :aria-selected="metric === 'actual_cost'"
          :class="metric === 'actual_cost'
            ? 'group-distribution-toggle-active'
            : 'group-distribution-toggle-idle'"
          @mouseenter="moveIndicatorFromEvent"
          @focus="moveIndicatorFromEvent"
          @click="emit('update:metric', 'actual_cost')"
        >
          {{ t('admin.dashboard.metricActualCost') }}
        </button>
      </div>
    </div>
    <div v-if="loading" class="flex h-48 items-center justify-center">
      <LoadingSpinner />
    </div>
    <div v-else-if="displayGroupStats.length > 0 && chartData" class="flex items-center gap-6">
      <div class="h-48 w-48">
        <Doughnut :data="chartData" :options="doughnutOptions" />
      </div>
      <div class="group-distribution-table-wrap max-h-48 flex-1 overflow-y-auto">
        <table class="w-full text-xs">
          <thead>
            <tr class="group-distribution-header-row text-[var(--anthropic-muted)] dark:text-[var(--anthropic-muted)]">
              <th class="pb-2 text-left">{{ t('admin.dashboard.group') }}</th>
              <th class="pb-2 text-right">{{ t('admin.dashboard.requests') }}</th>
              <th class="pb-2 text-right">{{ t('admin.dashboard.tokens') }}</th>
              <th class="pb-2 text-right">{{ t('admin.dashboard.actual') }}</th>
              <th class="pb-2 text-right">{{ t('admin.dashboard.accountCost') }}</th>
              <th class="pb-2 text-right">{{ t('admin.dashboard.standard') }}</th>
            </tr>
          </thead>
          <tbody>
            <template v-for="group in displayGroupStats" :key="group.group_id">
              <tr data-testid="charts-group-distribution-chart-tr-tr"
                class="border-t border-[var(--anthropic-border)] transition-colors dark:border-[var(--anthropic-border)]"
                :class="group.group_id > 0 ? 'cursor-pointer' : ''"
                @click="group.group_id > 0 && toggleBreakdown('group', group.group_id)"
              >
                <td
                  class="max-w-[100px] truncate py-1.5 font-medium"
                  :class="group.group_id > 0 ? 'text-[var(--anthropic-fg)] dark:text-[var(--anthropic-fg)]' : 'text-[var(--anthropic-fg)] dark:text-[var(--anthropic-fg)]'"
                  :title="group.group_name || String(group.group_id)"
                >
                  <span class="inline-flex items-center gap-1">
                    <svg v-if="group.group_id > 0 && expandedKey === `group-${group.group_id}`" class="h-3 w-3 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/></svg>
                    <svg v-else-if="group.group_id > 0" class="h-3 w-3 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/></svg>
                    {{ group.group_name || t('admin.dashboard.noGroup') }}
                  </span>
                </td>
                <td class="py-1.5 text-right text-[var(--anthropic-muted)] dark:text-[var(--anthropic-muted)]">
                  {{ formatNumber(group.requests) }}
                </td>
                <td class="py-1.5 text-right text-[var(--anthropic-muted)] dark:text-[var(--anthropic-muted)]">
                  {{ formatTokens(group.total_tokens) }}
                </td>
                <td class="py-1.5 text-right text-[var(--anthropic-muted)] dark:text-[var(--anthropic-muted)]">
                  ${{ formatCost(group.actual_cost) }}
                </td>
                <td class="py-1.5 text-right text-[var(--anthropic-muted)] dark:text-[var(--anthropic-muted)]">
                  ${{ formatCost(group.account_cost ?? 0) }}
                </td>
                <td class="py-1.5 text-right text-[var(--anthropic-muted)] dark:text-[var(--anthropic-muted)]">
                  ${{ formatCost(group.cost) }}
                </td>
              </tr>
              <!-- User breakdown sub-rows -->
              <tr v-if="expandedKey === `group-${group.group_id}`">
                <td colspan="6" class="p-0">
                  <UserBreakdownSubTable
                    :items="breakdownItems"
                    :loading="breakdownLoading"
                  />
                </td>
              </tr>
            </template>
          </tbody>
        </table>
      </div>
    </div>
    <div
      v-else
      class="flex h-48 items-center justify-center text-sm text-[var(--anthropic-muted)] dark:text-[var(--anthropic-muted)]"
    >
      {{ t('admin.dashboard.noDataAvailable') }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js'
import { Doughnut } from 'vue-chartjs'
import LoadingSpinner from '@/components/common/LoadingSpinner.vue'
import UserBreakdownSubTable from './UserBreakdownSubTable.vue'
import type { GroupStat, UserBreakdownItem } from '@/types'
import { getUserBreakdown } from '@/api/admin/dashboard'
import { getChartColors } from '@/utils/chartColors'

ChartJS.register(ArcElement, Tooltip, Legend)

const { t } = useI18n()

type DistributionMetric = 'tokens' | 'actual_cost'

const props = withDefaults(defineProps<{
  groupStats: GroupStat[]
  loading?: boolean
  metric?: DistributionMetric
  showMetricToggle?: boolean
  startDate?: string
  endDate?: string
  filters?: Record<string, any>
}>(), {
  loading: false,
  metric: 'tokens',
  showMetricToggle: false,
})

const emit = defineEmits<{
  'update:metric': [value: DistributionMetric]
}>()

const expandedKey = ref<string | null>(null)
const breakdownItems = ref<UserBreakdownItem[]>([])
const breakdownLoading = ref(false)
const metricTabsRef = ref<HTMLElement | null>(null)

function moveIndicator(tabs: HTMLElement | null, button: HTMLElement | null) {
  if (!tabs || !button) return

  const tabsRect = tabs.getBoundingClientRect()
  const buttonRect = button.getBoundingClientRect()
  tabs.style.setProperty('--route-indicator-x', `${buttonRect.left - tabsRect.left}px`)
  tabs.style.setProperty('--route-indicator-w', `${buttonRect.width}px`)
}

function selectedMetricTabButton() {
  return metricTabsRef.value?.querySelector<HTMLElement>(
    `button[data-route-id="${props.metric}"]`
  ) ?? null
}

function moveMetricIndicatorToSelected() {
  moveIndicator(metricTabsRef.value, selectedMetricTabButton())
}

function moveIndicatorFromEvent(event: Event) {
  const button = event.currentTarget as HTMLElement | null
  moveIndicator(button?.closest<HTMLElement>('[data-route-tabs]') ?? null, button)
}

function handleMetricTabsFocusout(event: FocusEvent) {
  const nextTarget = event.relatedTarget
  if (!(nextTarget instanceof Node) || !metricTabsRef.value?.contains(nextTarget)) {
    moveMetricIndicatorToSelected()
  }
}

const toggleBreakdown = async (type: string, id: number | string) => {
  const key = `${type}-${id}`
  if (expandedKey.value === key) {
    expandedKey.value = null
    return
  }
  expandedKey.value = key
  breakdownLoading.value = true
  breakdownItems.value = []
  try {
    const res = await getUserBreakdown({
      ...props.filters,
      start_date: props.startDate,
      end_date: props.endDate,
      group_id: Number(id),
    })
    breakdownItems.value = res.users || []
  } catch {
    breakdownItems.value = []
  } finally {
    breakdownLoading.value = false
  }
}

const displayGroupStats = computed(() => {
  if (!props.groupStats?.length) return []

  const metricKey = props.metric === 'actual_cost' ? 'actual_cost' : 'total_tokens'
  return [...props.groupStats].sort((a, b) => b[metricKey] - a[metricKey])
})

const chartData = computed(() => {
  if (!props.groupStats?.length) return null

  return {
    labels: displayGroupStats.value.map((g) => g.group_name || String(g.group_id)),
    datasets: [
      {
        data: displayGroupStats.value.map((g) => props.metric === 'actual_cost' ? g.actual_cost : g.total_tokens),
        backgroundColor: getChartColors(displayGroupStats.value.length),
        borderWidth: 0
      }
    ]
  }
})

const doughnutOptions = computed(() => ({
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      display: false
    },
    tooltip: {
      callbacks: {
        label: (context: any) => {
          const value = context.raw as number
          const total = context.dataset.data.reduce((a: number, b: number) => a + b, 0)
          const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : '0.0'
          const formattedValue = props.metric === 'actual_cost'
            ? `$${formatCost(value)}`
            : formatTokens(value)
          return `${context.label}: ${formattedValue} (${percentage}%)`
        }
      }
    }
  }
}))

const formatTokens = (value: number): string => {
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

const formatCost = (value: number): string => {
  if (value >= 1000) {
    return (value / 1000).toFixed(2) + 'K'
  } else if (value >= 1) {
    return value.toFixed(2)
  } else if (value >= 0.01) {
    return value.toFixed(3)
  }
  return value.toFixed(4)
}

onMounted(() => {
  void nextTick(moveMetricIndicatorToSelected)
  window.addEventListener('resize', moveMetricIndicatorToSelected)
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', moveMetricIndicatorToSelected)
})

watch(() => [props.metric, props.showMetricToggle], () => {
  void nextTick(moveMetricIndicatorToSelected)
})
</script>

<style scoped>
.group-distribution-card {
  background: var(--anthropic-page) !important;
  border-color: var(--anthropic-cookbook-border) !important;
  box-shadow: none !important;
  transform: none !important;
}

.group-distribution-card :where(.group-distribution-control-group, .group-distribution-table-wrap) {
  background: var(--anthropic-page) !important;
  border: 1px solid var(--anthropic-cookbook-border);
  box-shadow: none;
}

.group-distribution-control-group {
  --route-indicator-x: 0.25rem;
  --route-indicator-w: 0px;
  position: relative;
  isolation: isolate;
  min-height: 3rem;
  align-items: center;
  gap: 0;
  padding: 0.25rem !important;
  border: 0 !important;
  border-radius: 16px !important;
  background: var(--anthropic-raised) !important;
  box-shadow: inset 0 0 0 1px var(--anthropic-border-soft);
  width: fit-content;
}

.group-distribution-route-tabs::before {
  content: "";
  position: absolute;
  z-index: 0;
  top: 0.25rem;
  bottom: 0.25rem;
  left: 0;
  width: var(--route-indicator-w);
  border-radius: 12px;
  background: var(--anthropic-page);
  box-shadow: 0 0 0 1px var(--anthropic-border-soft);
  transform: translateX(var(--route-indicator-x));
  transition:
    transform 0.24s var(--anthropic-ease-out, cubic-bezier(0.215, 0.61, 0.355, 1)),
    width 0.24s var(--anthropic-ease-out, cubic-bezier(0.215, 0.61, 0.355, 1)),
    background-color 0.2s ease,
    box-shadow 0.2s ease;
  pointer-events: none;
}

.group-distribution-toggle {
  position: relative;
  z-index: 1;
  display: inline-flex;
  min-height: 2.5rem;
  align-items: center;
  justify-content: center;
  padding: 0.5rem 1rem;
  border: 0;
  border-radius: 12px;
  background: transparent;
  color: var(--anthropic-muted);
  box-shadow: none;
  font-family: var(--atelier-font-sans);
  font-size: var(--anthropic-control-font-size, 0.8125rem);
  font-weight: var(--anthropic-control-font-weight, 500);
  line-height: var(--anthropic-control-line-height, 1.25rem);
  letter-spacing: 0;
  text-decoration-line: none;
  white-space: nowrap;
  transition:
    background-color 0.2s ease-in-out,
    color 0.1s ease-in-out,
    box-shadow 0.2s ease-in-out;
}

.group-distribution-toggle:hover,
.group-distribution-toggle:focus-visible {
  color: var(--anthropic-fg);
  background: transparent;
  box-shadow: none;
}

.group-distribution-toggle-active {
  background: transparent !important;
  color: var(--anthropic-fg) !important;
  box-shadow: none !important;
}

.group-distribution-toggle-idle {
  color: var(--anthropic-muted) !important;
}

.group-distribution-table-wrap {
  padding: 0.5rem 0.75rem;
  border-radius: 8px;
}

.group-distribution-table-wrap :where(table, thead, tbody, tr, th, td) {
  background: var(--anthropic-page) !important;
}

.group-distribution-header-row :where(th) {
  background: var(--anthropic-page) !important;
  color: var(--anthropic-muted) !important;
}

.group-distribution-table-wrap tbody tr {
  border-color: var(--anthropic-cookbook-border) !important;
}

.group-distribution-table-wrap tbody tr:hover {
  background: var(--anthropic-section) !important;
}
</style>
