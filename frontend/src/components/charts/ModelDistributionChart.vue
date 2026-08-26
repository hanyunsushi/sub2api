<template>
  <div class="card model-distribution-card p-4">
    <div class="mb-4 flex items-center justify-between gap-3">
      <h3 class="text-sm font-semibold text-[var(--anthropic-fg)] dark:text-[var(--anthropic-fg)]">
        {{ !enableRankingView || activeView === 'model_distribution'
          ? t('admin.dashboard.modelDistribution')
          : t('admin.dashboard.spendingRankingTitle') }}
      </h3>
      <div class="flex flex-wrap items-center justify-end gap-2">
        <div
          v-if="showSourceToggle"
          ref="sourceTabsRef"
          class="route-tabs model-distribution-control-group model-distribution-route-tabs inline-flex"
          data-route-tabs="model-distribution-source"
          role="tablist"
          @mouseleave="moveSourceIndicatorToSelected"
          @focusout="handleSourceTabsFocusout"
        >
          <button data-testid="charts-model-distribution-chart-button-emit-update-source-requested"
            type="button"
            class="model-distribution-toggle"
            role="tab"
            data-route-id="requested"
            :aria-selected="source === 'requested'"
            :class="source === 'requested'
              ? 'model-distribution-toggle-active'
              : 'model-distribution-toggle-idle'"
            @mouseenter="moveIndicatorFromEvent"
            @focus="moveIndicatorFromEvent"
            @click="emit('update:source', 'requested')"
          >
            {{ t('usage.requestedModel') }}
          </button>
          <button data-testid="charts-model-distribution-chart-button-emit-update-source-upstream"
            type="button"
            class="model-distribution-toggle"
            role="tab"
            data-route-id="upstream"
            :aria-selected="source === 'upstream'"
            :class="source === 'upstream'
              ? 'model-distribution-toggle-active'
              : 'model-distribution-toggle-idle'"
            @mouseenter="moveIndicatorFromEvent"
            @focus="moveIndicatorFromEvent"
            @click="emit('update:source', 'upstream')"
          >
            {{ t('usage.upstreamModel') }}
          </button>
          <button data-testid="charts-model-distribution-chart-button-emit-update-source-mapping"
            type="button"
            class="model-distribution-toggle"
            role="tab"
            data-route-id="mapping"
            :aria-selected="source === 'mapping'"
            :class="source === 'mapping'
              ? 'model-distribution-toggle-active'
              : 'model-distribution-toggle-idle'"
            @mouseenter="moveIndicatorFromEvent"
            @focus="moveIndicatorFromEvent"
            @click="emit('update:source', 'mapping')"
          >
            {{ t('usage.mapping') }}
          </button>
        </div>
        <div
          v-if="showMetricToggle"
          ref="metricTabsRef"
          class="route-tabs model-distribution-control-group model-distribution-route-tabs inline-flex"
          data-route-tabs="model-distribution-metric"
          role="tablist"
          @mouseleave="moveMetricIndicatorToSelected"
          @focusout="handleMetricTabsFocusout"
        >
          <button data-testid="charts-model-distribution-chart-button-emit-update-metric-tokens"
            type="button"
            class="model-distribution-toggle"
            role="tab"
            data-route-id="tokens"
            :aria-selected="metric === 'tokens'"
            :class="metric === 'tokens'
              ? 'model-distribution-toggle-active'
              : 'model-distribution-toggle-idle'"
            @mouseenter="moveIndicatorFromEvent"
            @focus="moveIndicatorFromEvent"
            @click="emit('update:metric', 'tokens')"
          >
            {{ t('admin.dashboard.metricTokens') }}
          </button>
          <button data-testid="charts-model-distribution-chart-button-emit-update-metric-actual-cost"
            type="button"
            class="model-distribution-toggle"
            role="tab"
            data-route-id="actual_cost"
            :aria-selected="metric === 'actual_cost'"
            :class="metric === 'actual_cost'
              ? 'model-distribution-toggle-active'
              : 'model-distribution-toggle-idle'"
            @mouseenter="moveIndicatorFromEvent"
            @focus="moveIndicatorFromEvent"
            @click="emit('update:metric', 'actual_cost')"
          >
            {{ t('admin.dashboard.metricActualCost') }}
          </button>
        </div>
        <div
          v-if="enableRankingView"
          ref="rankingTabsRef"
          class="route-tabs model-distribution-control-group model-distribution-route-tabs inline-flex"
          data-route-tabs="model-distribution"
          role="tablist"
          @mouseleave="moveRankingIndicatorToSelected"
          @focusout="handleRankingTabsFocusout"
        >
          <button data-testid="charts-model-distribution-chart-button-active-view-model-distribution"
            type="button"
            class="model-distribution-toggle"
            role="tab"
            data-route-id="model_distribution"
            :aria-selected="activeView === 'model_distribution'"
            :class="
              activeView === 'model_distribution'
                ? 'model-distribution-toggle-active'
                : 'model-distribution-toggle-idle'
            "
            @mouseenter="moveRankingIndicatorFromEvent"
            @focus="moveRankingIndicatorFromEvent"
            @click="setActiveView('model_distribution')"
          >
            {{ t('admin.dashboard.viewModelDistribution') }}
          </button>
          <button data-testid="charts-model-distribution-chart-button-active-view-spending-ranking"
            type="button"
            class="model-distribution-toggle"
            role="tab"
            data-route-id="spending_ranking"
            :aria-selected="activeView === 'spending_ranking'"
            :class="
              activeView === 'spending_ranking'
                ? 'model-distribution-toggle-active'
                : 'model-distribution-toggle-idle'
            "
            @mouseenter="moveRankingIndicatorFromEvent"
            @focus="moveRankingIndicatorFromEvent"
            @click="setActiveView('spending_ranking')"
          >
            {{ t('admin.dashboard.viewSpendingRanking') }}
          </button>
        </div>
      </div>
    </div>

    <div v-if="activeView === 'model_distribution' && loading" class="flex h-48 items-center justify-center">
      <LoadingSpinner />
    </div>
    <div
      v-else-if="activeView === 'model_distribution' && displayModelStats.length > 0 && chartData"
      class="flex flex-col items-center gap-4 sm:flex-row sm:gap-6"
    >
      <div class="model-distribution-visual h-48 w-48">
        <Doughnut :data="chartData" :options="doughnutOptions" />
      </div>
      <div class="model-distribution-table-wrap max-h-48 flex-1 overflow-y-auto">
        <table class="w-full text-xs">
          <thead>
            <tr class="text-[var(--anthropic-muted)] dark:text-[var(--anthropic-muted)]">
              <th class="pb-2 text-left">{{ t('admin.dashboard.model') }}</th>
              <th class="pb-2 text-right">{{ t('admin.dashboard.requests') }}</th>
              <th class="pb-2 text-right">{{ t('admin.dashboard.tokens') }}</th>
              <th class="pb-2 text-right">{{ t('admin.dashboard.actual') }}</th>
              <th class="pb-2 text-right">{{ t('admin.dashboard.accountCost') }}</th>
              <th class="pb-2 text-right">{{ t('admin.dashboard.standard') }}</th>
            </tr>
          </thead>
          <tbody>
            <template v-for="model in displayModelStats" :key="model.model">
              <tr data-testid="charts-model-distribution-chart-tr-toggle-breakdown-model-model-model"
                class="model-distribution-row model-distribution-row-clickable border-t border-[var(--anthropic-border)] cursor-pointer transition-colors dark:border-[var(--anthropic-border)]"
                @click="toggleBreakdown('model', model.model)"
              >
                <td
                  class="max-w-[100px] truncate py-1.5 font-medium text-[var(--anthropic-fg)] dark:text-[var(--anthropic-fg)]"
                  :title="model.model"
                >
                  <span class="inline-flex items-center gap-1">
                    <svg v-if="expandedKey === `model-${model.model}`" class="h-3 w-3 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/></svg>
                    <svg v-else class="h-3 w-3 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/></svg>
                    {{ model.model }}
                  </span>
                </td>
                <td class="py-1.5 text-right text-[var(--anthropic-muted)] dark:text-[var(--anthropic-muted)]">
                  {{ formatNumber(model.requests) }}
                </td>
                <td class="py-1.5 text-right text-[var(--anthropic-muted)] dark:text-[var(--anthropic-muted)]">
                  {{ formatTokens(model.total_tokens) }}
                </td>
                <td class="py-1.5 text-right text-[var(--anthropic-muted)] dark:text-[var(--anthropic-muted)]">
                  ${{ formatCost(model.actual_cost) }}
                </td>
                <td class="py-1.5 text-right text-[var(--anthropic-muted)] dark:text-[var(--anthropic-muted)]">
                  ${{ formatCost(model.account_cost ?? 0) }}
                </td>
                <td class="py-1.5 text-right text-[var(--anthropic-muted)] dark:text-[var(--anthropic-muted)]">
                  ${{ formatCost(model.cost) }}
                </td>
              </tr>
              <tr v-if="expandedKey === `model-${model.model}`">
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
      v-else-if="activeView === 'model_distribution'"
      class="flex h-48 items-center justify-center text-sm text-[var(--anthropic-muted)] dark:text-[var(--anthropic-muted)]"
    >
      {{ t('admin.dashboard.noDataAvailable') }}
    </div>

    <div v-else-if="rankingLoading" class="flex h-48 items-center justify-center">
      <LoadingSpinner />
    </div>
    <div
      v-else-if="rankingError"
      class="flex h-48 items-center justify-center text-sm text-[var(--anthropic-muted)] dark:text-[var(--anthropic-muted)]"
    >
      {{ t('admin.dashboard.failedToLoad') }}
    </div>
    <div v-else-if="rankingDisplayItems.length > 0 && rankingChartData" class="flex items-center gap-6">
      <div class="model-distribution-visual h-48 w-48">
        <Doughnut :data="rankingChartData" :options="rankingDoughnutOptions" />
      </div>
      <div class="model-distribution-table-wrap max-h-48 flex-1 overflow-y-auto">
        <table class="w-full text-xs">
          <thead>
            <tr class="text-[var(--anthropic-muted)] dark:text-[var(--anthropic-muted)]">
              <th class="pb-2 text-left">{{ t('admin.dashboard.spendingRankingUser') }}</th>
              <th class="pb-2 text-right">{{ t('admin.dashboard.spendingRankingRequests') }}</th>
              <th class="pb-2 text-right">{{ t('admin.dashboard.spendingRankingTokens') }}</th>
              <th class="pb-2 text-right">{{ t('admin.dashboard.spendingRankingSpend') }}</th>
            </tr>
          </thead>
          <tbody>
            <tr data-testid="charts-model-distribution-chart-tr-tr"
              v-for="(item, index) in rankingDisplayItems"
              :key="item.isOther ? 'others' : `${item.user_id}-${index}`"
              class="model-distribution-row border-t border-[var(--anthropic-border)] transition-colors dark:border-[var(--anthropic-border)]"
              :class="item.isOther
                ? 'bg-[var(--anthropic-page)] dark:bg-[var(--anthropic-page)]'
                : 'cursor-pointer'"
              @click="item.isOther ? undefined : emit('ranking-click', item)"
            >
              <td class="py-1.5">
                <div class="flex min-w-0 items-center gap-2">
                  <span class="shrink-0 text-[11px] font-semibold text-[var(--anthropic-muted)] dark:text-[var(--anthropic-muted)]">
                    {{ item.isOther ? 'Σ' : `#${index + 1}` }}
                  </span>
                  <span
                    class="block max-w-[140px] truncate font-medium text-[var(--anthropic-fg)] dark:text-[var(--anthropic-fg)]"
                    :title="getRankingRowLabel(item)"
                  >
                    {{ getRankingRowLabel(item) }}
                  </span>
                </div>
              </td>
              <td class="py-1.5 text-right text-[var(--anthropic-muted)] dark:text-[var(--anthropic-muted)]">
                {{ formatNumber(item.requests) }}
              </td>
              <td class="py-1.5 text-right text-[var(--anthropic-muted)] dark:text-[var(--anthropic-muted)]">
                {{ formatTokens(item.tokens) }}
              </td>
              <td class="py-1.5 text-right text-[var(--anthropic-muted)] dark:text-[var(--anthropic-muted)]">
                ${{ formatCost(item.actual_cost) }}
              </td>
            </tr>
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
import type { ModelStat, UserSpendingRankingItem, UserBreakdownItem } from '@/types'
import { getUserBreakdown } from '@/api/admin/dashboard'
import { chartNeutralColor, getChartColors } from '@/utils/chartColors'

ChartJS.register(ArcElement, Tooltip, Legend)

const { t } = useI18n()

type DistributionMetric = 'tokens' | 'actual_cost'
type ModelSource = 'requested' | 'upstream' | 'mapping'
type RankingDisplayItem = UserSpendingRankingItem & { isOther?: boolean }
const props = withDefaults(defineProps<{
  modelStats: ModelStat[]
  upstreamModelStats?: ModelStat[]
  mappingModelStats?: ModelStat[]
  source?: ModelSource
  enableRankingView?: boolean
  rankingItems?: UserSpendingRankingItem[]
  rankingTotalActualCost?: number
  rankingTotalRequests?: number
  rankingTotalTokens?: number
  loading?: boolean
  metric?: DistributionMetric
  showSourceToggle?: boolean
  showMetricToggle?: boolean
  rankingLoading?: boolean
  rankingError?: boolean
  startDate?: string
  endDate?: string
  filters?: Record<string, any>
}>(), {
  upstreamModelStats: () => [],
  mappingModelStats: () => [],
  source: 'requested',
  enableRankingView: false,
  rankingItems: () => [],
  rankingTotalActualCost: 0,
  rankingTotalRequests: 0,
  rankingTotalTokens: 0,
  loading: false,
  metric: 'tokens',
  showSourceToggle: false,
  showMetricToggle: false,
  rankingLoading: false,
  rankingError: false
})

const expandedKey = ref<string | null>(null)
const breakdownItems = ref<UserBreakdownItem[]>([])
const breakdownLoading = ref(false)

const toggleBreakdown = async (type: string, id: string) => {
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
      model: id,
      model_source: props.source,
    })
    breakdownItems.value = res.users || []
  } catch {
    breakdownItems.value = []
  } finally {
    breakdownLoading.value = false
  }
}

const emit = defineEmits<{
  'update:metric': [value: DistributionMetric]
  'update:source': [value: ModelSource]
  'ranking-click': [item: UserSpendingRankingItem]
}>()

const enableRankingView = computed(() => props.enableRankingView)
const activeView = ref<'model_distribution' | 'spending_ranking'>('model_distribution')
const rankingTabsRef = ref<HTMLElement | null>(null)
const sourceTabsRef = ref<HTMLElement | null>(null)
const metricTabsRef = ref<HTMLElement | null>(null)

const setActiveView = (view: 'model_distribution' | 'spending_ranking') => {
  activeView.value = view
  void nextTick(moveRankingIndicatorToSelected)
}

function moveRankingIndicator(button: HTMLElement | null) {
  moveIndicator(rankingTabsRef.value, button)
}

function moveIndicator(tabs: HTMLElement | null, button: HTMLElement | null) {
  if (!tabs || !button) return

  const tabsRect = tabs.getBoundingClientRect()
  const buttonRect = button.getBoundingClientRect()
  tabs.style.setProperty('--route-indicator-x', `${buttonRect.left - tabsRect.left}px`)
  tabs.style.setProperty('--route-indicator-w', `${buttonRect.width}px`)
}

function selectedRankingTabButton() {
  return rankingTabsRef.value?.querySelector<HTMLElement>(
    `button[data-route-id="${activeView.value}"]`
  ) ?? null
}

function selectedRouteButton(tabs: HTMLElement | null, routeId: string) {
  return tabs?.querySelector<HTMLElement>(`button[data-route-id="${routeId}"]`) ?? null
}

function moveRankingIndicatorToSelected() {
  moveRankingIndicator(selectedRankingTabButton())
}

function moveSourceIndicatorToSelected() {
  moveIndicator(sourceTabsRef.value, selectedRouteButton(sourceTabsRef.value, props.source))
}

function moveMetricIndicatorToSelected() {
  moveIndicator(metricTabsRef.value, selectedRouteButton(metricTabsRef.value, props.metric))
}

function moveRankingIndicatorFromEvent(event: Event) {
  moveRankingIndicator(event.currentTarget as HTMLElement | null)
}

function moveIndicatorFromEvent(event: Event) {
  const button = event.currentTarget as HTMLElement | null
  moveIndicator(button?.closest<HTMLElement>('[data-route-tabs]') ?? null, button)
}

function handleRankingTabsFocusout(event: FocusEvent) {
  const nextTarget = event.relatedTarget
  if (!(nextTarget instanceof Node) || !rankingTabsRef.value?.contains(nextTarget)) {
    moveRankingIndicatorToSelected()
  }
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
  moveRankingIndicatorToSelected()
  moveSourceIndicatorToSelected()
  moveMetricIndicatorToSelected()
}

onMounted(() => {
  void nextTick(moveAllIndicatorsToSelected)
  window.addEventListener('resize', moveAllIndicatorsToSelected)
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', moveAllIndicatorsToSelected)
})

watch(() => [props.source, props.metric, props.showSourceToggle, props.showMetricToggle, activeView.value], () => {
  void nextTick(moveAllIndicatorsToSelected)
})

const displayModelStats = computed(() => {
  const sourceStats = props.source === 'upstream'
    ? props.upstreamModelStats
    : props.source === 'mapping'
      ? props.mappingModelStats
      : props.modelStats
  if (!sourceStats?.length) return []

  const metricKey = props.metric === 'actual_cost' ? 'actual_cost' : 'total_tokens'
  return [...sourceStats].sort((a, b) => b[metricKey] - a[metricKey])
})

const chartData = computed(() => {
  if (!displayModelStats.value.length) return null

  return {
    labels: displayModelStats.value.map((m) => m.model),
    datasets: [
      {
        data: displayModelStats.value.map((m) => props.metric === 'actual_cost' ? m.actual_cost : m.total_tokens),
        backgroundColor: getChartColors(displayModelStats.value.length),
        borderWidth: 0
      }
    ]
  }
})

const rankingChartData = computed(() => {
  if (!props.rankingItems?.length) return null

  const labels = props.rankingItems.map((item, index) => `#${index + 1} ${getRankingUserLabel(item)}`)
  const data = props.rankingItems.map((item) => item.actual_cost)
  const backgroundColor = getChartColors(props.rankingItems.length)

  if (otherRankingItem.value) {
    labels.push(t('admin.dashboard.spendingRankingOther'))
    data.push(otherRankingItem.value.actual_cost)
    backgroundColor.push(chartNeutralColor)
  }

  return {
    labels,
    datasets: [
      {
        data,
        backgroundColor,
        borderWidth: 0
      }
    ]
  }
})

const otherRankingItem = computed<RankingDisplayItem | null>(() => {
  if (!props.rankingItems?.length) return null

  const rankedActualCost = props.rankingItems.reduce((sum, item) => sum + item.actual_cost, 0)
  const rankedRequests = props.rankingItems.reduce((sum, item) => sum + item.requests, 0)
  const rankedTokens = props.rankingItems.reduce((sum, item) => sum + item.tokens, 0)

  const otherActualCost = Math.max((props.rankingTotalActualCost || 0) - rankedActualCost, 0)
  const otherRequests = Math.max((props.rankingTotalRequests || 0) - rankedRequests, 0)
  const otherTokens = Math.max((props.rankingTotalTokens || 0) - rankedTokens, 0)

  if (otherActualCost <= 0.000001 && otherRequests <= 0 && otherTokens <= 0) return null

  return {
    user_id: 0,
    email: '',
    username: '',
    actual_cost: otherActualCost,
    requests: otherRequests,
    tokens: otherTokens,
    isOther: true
  }
})

const rankingDisplayItems = computed<RankingDisplayItem[]>(() => {
  if (!props.rankingItems?.length) return []
  return otherRankingItem.value
    ? [...props.rankingItems, otherRankingItem.value]
    : [...props.rankingItems]
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

const rankingDoughnutOptions = computed(() => ({
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
          return `${context.label}: $${formatCost(value)} (${percentage}%)`
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

const getRankingUserLabel = (item: UserSpendingRankingItem): string => {
  if (item.username?.trim()) return item.username.trim()
  if (item.email?.trim()) return item.email.trim()
  return t('admin.redeem.userPrefix', { id: item.user_id })
}

const getRankingRowLabel = (item: RankingDisplayItem): string => {
  if (item.isOther) return t('admin.dashboard.spendingRankingOther')
  return getRankingUserLabel(item)
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
</script>

<style scoped>
.model-distribution-card {
  background: var(--anthropic-page) !important;
  border-color: var(--anthropic-cookbook-border) !important;
  box-shadow: none !important;
  transform: none !important;
}

.model-distribution-card :where(.model-distribution-control-group, .model-distribution-table-wrap) {
  background: var(--anthropic-page) !important;
  border: 1px solid var(--anthropic-cookbook-border);
  box-shadow: none;
}

.model-distribution-control-group {
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

.model-distribution-route-tabs::before {
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

.model-distribution-toggle {
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

.model-distribution-toggle:hover,
.model-distribution-toggle:focus-visible {
  color: var(--anthropic-fg);
  background: transparent;
  box-shadow: none;
}

.model-distribution-toggle-active {
  background: transparent !important;
  color: var(--anthropic-fg) !important;
  box-shadow: none !important;
}

.model-distribution-toggle-idle {
  color: var(--anthropic-muted) !important;
}

.model-distribution-visual,
.model-distribution-table-wrap {
  border-radius: 8px;
}

.model-distribution-visual {
  padding: 0;
  background: transparent !important;
  border: 0 !important;
  box-shadow: none !important;
}

.model-distribution-table-wrap {
  padding: 0.5rem 0.75rem;
}

.model-distribution-table-wrap :where(table, thead, tbody, tr, th, td) {
  background: var(--anthropic-page) !important;
}

.model-distribution-table-wrap th {
  color: var(--anthropic-muted) !important;
}

.model-distribution-row {
  border-color: var(--anthropic-cookbook-border) !important;
}

.model-distribution-row-clickable:hover {
  background: var(--anthropic-section) !important;
}
</style>
