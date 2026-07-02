<template>
  <div class="card endpoint-distribution-card p-4">
    <div class="mb-4 flex items-center justify-between gap-3">
      <h3 class="text-sm font-semibold text-[var(--anthropic-fg)] dark:text-[var(--anthropic-fg)]">
        {{ title || t('usage.endpointDistribution') }}
      </h3>
      <div class="flex flex-wrap items-center justify-end gap-2">
        <div
          v-if="showSourceToggle"
          ref="sourceTabsRef"
          class="route-tabs endpoint-distribution-control-group endpoint-distribution-route-tabs inline-flex"
          data-route-tabs="endpoint-distribution-source"
          role="tablist"
          @mouseleave="moveSourceIndicatorToSelected"
          @focusout="handleSourceTabsFocusout"
        >
          <button data-testid="charts-endpoint-distribution-chart-button-emit-update-source-inbound"
            type="button"
            class="endpoint-distribution-toggle"
            role="tab"
            data-route-id="inbound"
            :aria-selected="source === 'inbound'"
            :class="source === 'inbound'
              ? 'endpoint-distribution-toggle-active'
              : 'endpoint-distribution-toggle-idle'"
            @mouseenter="moveIndicatorFromEvent"
            @focus="moveIndicatorFromEvent"
            @click="emit('update:source', 'inbound')"
          >
            {{ t('usage.inbound') }}
          </button>
          <button data-testid="charts-endpoint-distribution-chart-button-emit-update-source-upstream"
            type="button"
            class="endpoint-distribution-toggle"
            role="tab"
            data-route-id="upstream"
            :aria-selected="source === 'upstream'"
            :class="source === 'upstream'
              ? 'endpoint-distribution-toggle-active'
              : 'endpoint-distribution-toggle-idle'"
            @mouseenter="moveIndicatorFromEvent"
            @focus="moveIndicatorFromEvent"
            @click="emit('update:source', 'upstream')"
          >
            {{ t('usage.upstream') }}
          </button>
          <button data-testid="charts-endpoint-distribution-chart-button-emit-update-source-path"
            type="button"
            class="endpoint-distribution-toggle"
            role="tab"
            data-route-id="path"
            :aria-selected="source === 'path'"
            :class="source === 'path'
              ? 'endpoint-distribution-toggle-active'
              : 'endpoint-distribution-toggle-idle'"
            @mouseenter="moveIndicatorFromEvent"
            @focus="moveIndicatorFromEvent"
            @click="emit('update:source', 'path')"
          >
            {{ t('usage.path') }}
          </button>
        </div>

        <div
          v-if="showMetricToggle"
          ref="metricTabsRef"
          class="route-tabs endpoint-distribution-control-group endpoint-distribution-route-tabs inline-flex"
          data-route-tabs="endpoint-distribution-metric"
          role="tablist"
          @mouseleave="moveMetricIndicatorToSelected"
          @focusout="handleMetricTabsFocusout"
        >
          <button data-testid="charts-endpoint-distribution-chart-button-emit-update-metric-tokens"
            type="button"
            class="endpoint-distribution-toggle"
            role="tab"
            data-route-id="tokens"
            :aria-selected="metric === 'tokens'"
            :class="metric === 'tokens'
              ? 'endpoint-distribution-toggle-active'
              : 'endpoint-distribution-toggle-idle'"
            @mouseenter="moveIndicatorFromEvent"
            @focus="moveIndicatorFromEvent"
            @click="emit('update:metric', 'tokens')"
          >
            {{ t('admin.dashboard.metricTokens') }}
          </button>
          <button data-testid="charts-endpoint-distribution-chart-button-emit-update-metric-actual-cost"
            type="button"
            class="endpoint-distribution-toggle"
            role="tab"
            data-route-id="actual_cost"
            :aria-selected="metric === 'actual_cost'"
            :class="metric === 'actual_cost'
              ? 'endpoint-distribution-toggle-active'
              : 'endpoint-distribution-toggle-idle'"
            @mouseenter="moveIndicatorFromEvent"
            @focus="moveIndicatorFromEvent"
            @click="emit('update:metric', 'actual_cost')"
          >
            {{ t('admin.dashboard.metricActualCost') }}
          </button>
        </div>
      </div>
    </div>
    <div v-if="loading" class="flex h-48 items-center justify-center">
      <LoadingSpinner />
    </div>
    <div v-else-if="displayEndpointStats.length > 0 && chartData" class="flex items-center gap-6">
      <div class="h-48 w-48">
        <Doughnut :data="chartData" :options="doughnutOptions" />
      </div>
      <div class="endpoint-distribution-table-wrap max-h-48 flex-1 overflow-y-auto">
        <table class="w-full text-xs">
          <thead>
            <tr class="endpoint-distribution-header-row text-[var(--anthropic-muted)] dark:text-[var(--anthropic-muted)]">
              <th class="pb-2 text-left">{{ t('usage.endpoint') }}</th>
              <th class="pb-2 text-right">{{ t('admin.dashboard.requests') }}</th>
              <th class="pb-2 text-right">{{ t('admin.dashboard.tokens') }}</th>
              <th class="pb-2 text-right">{{ t('admin.dashboard.actual') }}</th>
              <th class="pb-2 text-right">{{ t('admin.dashboard.standard') }}</th>
            </tr>
          </thead>
          <tbody>
            <template v-for="item in displayEndpointStats" :key="item.endpoint">
              <tr data-testid="charts-endpoint-distribution-chart-tr-toggle-breakdown-item-endpoint"
                class="border-t border-[var(--anthropic-border)] cursor-pointer transition-colors dark:border-[var(--anthropic-border)]"
                @click="toggleBreakdown(item.endpoint)"
              >
                <td class="max-w-[180px] truncate py-1.5 font-medium text-[var(--anthropic-fg)] dark:text-[var(--anthropic-fg)]" :title="item.endpoint">
                  <span class="inline-flex items-center gap-1">
                    <svg v-if="expandedKey === item.endpoint" class="h-3 w-3 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/></svg>
                    <svg v-else class="h-3 w-3 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/></svg>
                    {{ item.endpoint }}
                  </span>
                </td>
                <td class="py-1.5 text-right text-[var(--anthropic-muted)] dark:text-[var(--anthropic-muted)]">
                  {{ formatNumber(item.requests) }}
                </td>
                <td class="py-1.5 text-right text-[var(--anthropic-muted)] dark:text-[var(--anthropic-muted)]">
                  {{ formatTokens(item.total_tokens) }}
                </td>
                <td class="py-1.5 text-right text-[var(--anthropic-muted)] dark:text-[var(--anthropic-muted)]">
                  ${{ formatCost(item.actual_cost) }}
                </td>
                <td class="py-1.5 text-right text-[var(--anthropic-muted)] dark:text-[var(--anthropic-muted)]">
                  ${{ formatCost(item.cost) }}
                </td>
              </tr>
              <tr v-if="expandedKey === item.endpoint">
                <td colspan="5" class="p-0">
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
    <div v-else class="flex h-48 items-center justify-center text-sm text-[var(--anthropic-muted)] dark:text-[var(--anthropic-muted)]">
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
import type { EndpointStat, UserBreakdownItem } from '@/types'
import { getUserBreakdown } from '@/api/admin/dashboard'
import { getChartColors } from '@/utils/chartColors'

ChartJS.register(ArcElement, Tooltip, Legend)

const { t } = useI18n()

type DistributionMetric = 'tokens' | 'actual_cost'
type EndpointSource = 'inbound' | 'upstream' | 'path'

const props = withDefaults(
  defineProps<{
    endpointStats: EndpointStat[]
    upstreamEndpointStats?: EndpointStat[]
    endpointPathStats?: EndpointStat[]
    loading?: boolean
    title?: string
    metric?: DistributionMetric
    source?: EndpointSource
    showMetricToggle?: boolean
    showSourceToggle?: boolean
    startDate?: string
    endDate?: string
    filters?: Record<string, any>
  }>(),
  {
    upstreamEndpointStats: () => [],
    endpointPathStats: () => [],
    loading: false,
    title: '',
    metric: 'tokens',
    source: 'inbound',
    showMetricToggle: false,
    showSourceToggle: false
  }
)

const emit = defineEmits<{
  'update:metric': [value: DistributionMetric]
  'update:source': [value: EndpointSource]
}>()

const expandedKey = ref<string | null>(null)
const breakdownItems = ref<UserBreakdownItem[]>([])
const breakdownLoading = ref(false)
const sourceTabsRef = ref<HTMLElement | null>(null)
const metricTabsRef = ref<HTMLElement | null>(null)

function moveIndicator(tabs: HTMLElement | null, button: HTMLElement | null) {
  if (!tabs || !button) return

  const tabsRect = tabs.getBoundingClientRect()
  const buttonRect = button.getBoundingClientRect()
  tabs.style.setProperty('--route-indicator-x', `${buttonRect.left - tabsRect.left}px`)
  tabs.style.setProperty('--route-indicator-w', `${buttonRect.width}px`)
}

function selectedRouteButton(
  tabs: HTMLElement | null,
  routeId: string
) {
  return tabs?.querySelector<HTMLElement>(`button[data-route-id="${routeId}"]`) ?? null
}

function moveSourceIndicatorToSelected() {
  moveIndicator(sourceTabsRef.value, selectedRouteButton(sourceTabsRef.value, props.source))
}

function moveMetricIndicatorToSelected() {
  moveIndicator(metricTabsRef.value, selectedRouteButton(metricTabsRef.value, props.metric))
}

function moveIndicatorFromEvent(event: Event) {
  const button = event.currentTarget as HTMLElement | null
  moveIndicator(button?.closest<HTMLElement>('[data-route-tabs]') ?? null, button)
}

function handleRouteTabsFocusout(event: FocusEvent, tabs: HTMLElement | null, moveToSelected: () => void) {
  const nextTarget = event.relatedTarget
  if (!(nextTarget instanceof Node) || !tabs?.contains(nextTarget)) {
    moveToSelected()
  }
}

function handleSourceTabsFocusout(event: FocusEvent) {
  handleRouteTabsFocusout(event, sourceTabsRef.value, moveSourceIndicatorToSelected)
}

function handleMetricTabsFocusout(event: FocusEvent) {
  handleRouteTabsFocusout(event, metricTabsRef.value, moveMetricIndicatorToSelected)
}

function moveAllIndicatorsToSelected() {
  moveSourceIndicatorToSelected()
  moveMetricIndicatorToSelected()
}

const toggleBreakdown = async (endpoint: string) => {
  if (expandedKey.value === endpoint) {
    expandedKey.value = null
    return
  }
  expandedKey.value = endpoint
  breakdownLoading.value = true
  breakdownItems.value = []
  try {
    const res = await getUserBreakdown({
      ...props.filters,
      start_date: props.startDate,
      end_date: props.endDate,
      endpoint,
      endpoint_type: props.source,
    })
    breakdownItems.value = res.users || []
  } catch {
    breakdownItems.value = []
  } finally {
    breakdownLoading.value = false
  }
}

const displayEndpointStats = computed(() => {
  const sourceStats = props.source === 'upstream'
    ? props.upstreamEndpointStats
    : props.source === 'path'
      ? props.endpointPathStats
      : props.endpointStats
  if (!sourceStats?.length) return []

  const metricKey = props.metric === 'actual_cost' ? 'actual_cost' : 'total_tokens'
  return [...sourceStats].sort((a, b) => b[metricKey] - a[metricKey])
})

const chartData = computed(() => {
  if (!displayEndpointStats.value?.length) return null

  return {
    labels: displayEndpointStats.value.map((item) => item.endpoint),
    datasets: [
      {
        data: displayEndpointStats.value.map((item) =>
          props.metric === 'actual_cost' ? item.actual_cost : item.total_tokens
        ),
        backgroundColor: getChartColors(displayEndpointStats.value.length),
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
  void nextTick(moveAllIndicatorsToSelected)
  window.addEventListener('resize', moveAllIndicatorsToSelected)
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', moveAllIndicatorsToSelected)
})

watch(() => [props.source, props.metric, props.showSourceToggle, props.showMetricToggle], () => {
  void nextTick(moveAllIndicatorsToSelected)
})
</script>

<style scoped>
.endpoint-distribution-card {
  background: var(--anthropic-page) !important;
  border-color: var(--anthropic-cookbook-border) !important;
  box-shadow: none !important;
  transform: none !important;
}

.endpoint-distribution-card :where(.endpoint-distribution-control-group, .endpoint-distribution-table-wrap) {
  background: var(--anthropic-page) !important;
  border: 1px solid var(--anthropic-cookbook-border);
  box-shadow: none;
}

.endpoint-distribution-control-group {
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

.endpoint-distribution-route-tabs::before {
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

.endpoint-distribution-toggle {
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

.endpoint-distribution-toggle:hover,
.endpoint-distribution-toggle:focus-visible {
  color: var(--anthropic-fg);
  background: transparent;
  box-shadow: none;
}

.endpoint-distribution-toggle-active {
  background: transparent !important;
  color: var(--anthropic-fg) !important;
  box-shadow: none !important;
}

.endpoint-distribution-toggle-idle {
  color: var(--anthropic-muted) !important;
}

.endpoint-distribution-table-wrap {
  padding: 0.5rem 0.75rem;
  border-radius: 8px;
}

.endpoint-distribution-table-wrap :where(table, thead, tbody, tr, th, td) {
  background: var(--anthropic-page) !important;
}

.endpoint-distribution-header-row :where(th) {
  background: var(--anthropic-page) !important;
  color: var(--anthropic-muted) !important;
}

.endpoint-distribution-table-wrap tbody tr {
  border-color: var(--anthropic-cookbook-border) !important;
}

.endpoint-distribution-table-wrap tbody tr:hover {
  background: var(--anthropic-section) !important;
}
</style>
