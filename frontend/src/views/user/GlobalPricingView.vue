<template>
  <AppLayout>
    <TablePageLayout>
      <template #filters>
        <div class="flex flex-col gap-4">
          <div class="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <div class="summary-tile">
              <span class="summary-label">{{ t('globalPricing.summary.totalModels') }}</span>
              <strong class="summary-value">{{ pricing?.model_count ?? items.length }}</strong>
            </div>
            <div class="summary-tile">
              <span class="summary-label">{{ t('globalPricing.summary.visibleModels') }}</span>
              <strong class="summary-value">{{ filteredItems.length }}</strong>
            </div>
            <div class="summary-tile">
              <span class="summary-label">{{ t('globalPricing.summary.providers') }}</span>
              <strong class="summary-value">{{ providerOptions.length }}</strong>
            </div>
            <div class="summary-tile">
              <span class="summary-label">{{ t('globalPricing.summary.updated') }}</span>
              <strong class="summary-value summary-value-small">{{ formattedLastUpdated }}</strong>
            </div>
          </div>

          <div class="flex flex-col justify-between gap-4 xl:flex-row xl:items-start">
            <div class="flex flex-1 flex-wrap items-center gap-3">
              <div class="relative w-full sm:w-80">
                <Icon
                  name="search"
                  size="md"
                  class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500"
                />
                <input
                  v-model="searchQuery"
                  type="text"
                  :placeholder="t('globalPricing.searchPlaceholder')"
                  class="input pl-10"
                />
              </div>

              <select v-model="providerFilter" class="input w-full sm:w-44">
                <option value="">{{ t('globalPricing.filters.allProviders') }}</option>
                <option v-for="provider in providerOptions" :key="provider" :value="provider">
                  {{ provider }}
                </option>
              </select>

              <select v-model="modeFilter" class="input w-full sm:w-40">
                <option value="">{{ t('globalPricing.filters.allModes') }}</option>
                <option v-for="mode in modeOptions" :key="mode" :value="mode">
                  {{ mode }}
                </option>
              </select>

              <label class="inline-flex h-10 items-center gap-2 rounded-lg border border-accent-200 bg-white px-3 text-sm text-gray-600 dark:border-dark-700 dark:bg-dark-800 dark:text-gray-300">
                <input
                  v-model="promptCachingOnly"
                  type="checkbox"
                  class="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500 dark:border-dark-600"
                />
                <span>{{ t('globalPricing.filters.promptCachingOnly') }}</span>
              </label>
            </div>

            <div class="flex w-full flex-shrink-0 flex-wrap items-center justify-end gap-3 xl:w-auto">
              <span class="hash-pill" :title="pricing?.local_hash || '-'">
                {{ t('globalPricing.dataHash') }}: {{ pricing?.local_hash || '-' }}
              </span>
              <button
                @click="loadPricing"
                :disabled="loading"
                class="btn btn-secondary"
                :title="t('common.refresh', 'Refresh')"
              >
                <Icon name="refresh" size="md" :class="loading ? 'animate-spin' : ''" />
              </button>
            </div>
          </div>
        </div>
      </template>

      <template #table>
        <div class="table-wrapper">
          <table class="global-pricing-table">
            <thead>
              <tr>
                <th class="sticky-col w-[260px]">{{ t('globalPricing.columns.model') }}</th>
                <th class="w-[150px]">{{ t('globalPricing.columns.provider') }}</th>
                <th class="w-[110px]">{{ t('globalPricing.columns.mode') }}</th>
                <th class="w-[130px]">{{ t('globalPricing.columns.input') }}</th>
                <th class="w-[150px]">{{ t('globalPricing.columns.cacheWrite') }}</th>
                <th class="w-[150px]">{{ t('globalPricing.columns.cacheRead') }}</th>
                <th class="w-[130px]">{{ t('globalPricing.columns.output') }}</th>
                <th class="w-[190px]">{{ t('globalPricing.columns.priority') }}</th>
                <th class="w-[170px]">{{ t('globalPricing.columns.image') }}</th>
                <th class="w-[220px]">{{ t('globalPricing.columns.capabilities') }}</th>
              </tr>
            </thead>

            <tbody v-if="loading">
              <tr v-for="idx in 8" :key="idx">
                <td v-for="cell in 10" :key="cell" :class="{ 'sticky-col': cell === 1 }">
                  <div class="skeleton-line" :class="cell === 1 ? 'w-48' : 'w-24'"></div>
                </td>
              </tr>
            </tbody>

            <tbody v-else-if="filteredItems.length === 0">
              <tr>
                <td colspan="10" class="py-14 text-center">
                  <Icon name="inbox" size="xl" class="mx-auto mb-3 h-12 w-12 text-gray-400" />
                  <p class="text-sm text-gray-500 dark:text-gray-400">{{ t('globalPricing.empty') }}</p>
                </td>
              </tr>
            </tbody>

            <tbody v-else>
              <tr v-for="item in filteredItems" :key="item.model" class="pricing-row">
                <td class="sticky-col">
                  <div class="min-w-0">
                    <p class="truncate font-medium text-gray-900 dark:text-white" :title="item.model">
                      {{ item.model }}
                    </p>
                    <p v-if="item.long_context_input_token_threshold > 0" class="mt-1 text-[11px] text-gray-500 dark:text-gray-400">
                      {{ t('globalPricing.longContextThreshold', { count: formatInteger(item.long_context_input_token_threshold) }) }}
                    </p>
                  </div>
                </td>
                <td>
                  <span class="meta-pill">{{ item.provider || '-' }}</span>
                </td>
                <td>
                  <span class="meta-pill uppercase">{{ item.mode || '-' }}</span>
                </td>
                <td class="price-cell">{{ formatTokenPrice(item.input_price) }}</td>
                <td class="price-cell">
                  <div>{{ formatTokenPrice(item.cache_write_price) }}</div>
                  <div v-if="item.cache_write_1h_price > 0" class="price-subline">
                    {{ t('globalPricing.above1h') }} {{ formatTokenPrice(item.cache_write_1h_price) }}
                  </div>
                </td>
                <td class="price-cell">{{ formatTokenPrice(item.cache_read_price) }}</td>
                <td class="price-cell">{{ formatTokenPrice(item.output_price) }}</td>
                <td>
                  <div class="compact-stack">
                    <span>{{ t('globalPricing.short.input') }} {{ formatTokenPrice(item.input_priority_price) }}</span>
                    <span>{{ t('globalPricing.short.output') }} {{ formatTokenPrice(item.output_priority_price) }}</span>
                    <span>{{ t('globalPricing.short.cacheRead') }} {{ formatTokenPrice(item.cache_read_priority_price) }}</span>
                  </div>
                </td>
                <td>
                  <div class="compact-stack">
                    <span>{{ t('globalPricing.short.perImage') }} {{ formatUnitPrice(item.image_output_price) }}</span>
                    <span>{{ t('globalPricing.short.imageToken') }} {{ formatTokenPrice(item.image_output_token_price) }}</span>
                  </div>
                </td>
                <td>
                  <div class="flex flex-wrap gap-1.5">
                    <span v-if="item.supports_prompt_caching" class="capability-pill">
                      {{ t('globalPricing.capabilities.promptCaching') }}
                    </span>
                    <span v-if="item.supports_service_tier" class="capability-pill">
                      {{ t('globalPricing.capabilities.serviceTier') }}
                    </span>
                    <span v-if="hasLongContextMultiplier(item)" class="capability-pill">
                      {{ t('globalPricing.capabilities.longContext') }}
                    </span>
                    <span v-if="!hasCapabilities(item)" class="text-xs text-gray-400">-</span>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </template>
    </TablePageLayout>
  </AppLayout>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import AppLayout from '@/components/layout/AppLayout.vue'
import TablePageLayout from '@/components/layout/TablePageLayout.vue'
import Icon from '@/components/icons/Icon.vue'
import pricingAPI, { type GlobalPricingItem, type GlobalPricingResponse } from '@/api/pricing'
import { useAppStore } from '@/stores/app'
import { extractApiErrorMessage } from '@/utils/apiError'
import { formatScaled } from '@/utils/pricing'

const { t, locale } = useI18n()
const appStore = useAppStore()

const pricing = ref<GlobalPricingResponse | null>(null)
const items = ref<GlobalPricingItem[]>([])
const loading = ref(false)
const searchQuery = ref('')
const providerFilter = ref('')
const modeFilter = ref('')
const promptCachingOnly = ref(false)

const providerOptions = computed(() =>
  Array.from(new Set(items.value.map((item) => item.provider).filter(Boolean))).sort((a, b) =>
    a.localeCompare(b),
  ),
)

const modeOptions = computed(() =>
  Array.from(new Set(items.value.map((item) => item.mode).filter(Boolean))).sort((a, b) =>
    a.localeCompare(b),
  ),
)

const filteredItems = computed(() => {
  const q = searchQuery.value.trim().toLowerCase()
  return items.value.filter((item) => {
    if (providerFilter.value && item.provider !== providerFilter.value) return false
    if (modeFilter.value && item.mode !== modeFilter.value) return false
    if (promptCachingOnly.value && !item.supports_prompt_caching) return false
    if (!q) return true
    return (
      item.model.toLowerCase().includes(q) ||
      (item.provider || '').toLowerCase().includes(q) ||
      (item.mode || '').toLowerCase().includes(q)
    )
  })
})

const formattedLastUpdated = computed(() => {
  const raw = pricing.value?.last_updated
  if (!raw) return '-'
  const date = new Date(raw)
  if (Number.isNaN(date.getTime())) return '-'
  return new Intl.DateTimeFormat(locale.value, {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
})

function formatTokenPrice(value: number): string {
  if (!value || value <= 0) return '-'
  return `${formatScaled(value, 1_000_000)} ${t('globalPricing.unitPerMillion')}`
}

function formatUnitPrice(value: number): string {
  if (!value || value <= 0) return '-'
  return formatScaled(value, 1)
}

function formatInteger(value: number): string {
  return new Intl.NumberFormat(locale.value).format(value)
}

function hasLongContextMultiplier(item: GlobalPricingItem): boolean {
  return item.long_context_input_cost_multiplier > 0 || item.long_context_output_cost_multiplier > 0
}

function hasCapabilities(item: GlobalPricingItem): boolean {
  return item.supports_prompt_caching || item.supports_service_tier || hasLongContextMultiplier(item)
}

async function loadPricing() {
  loading.value = true
  try {
    const data = await pricingAPI.getGlobalPricing()
    pricing.value = data
    items.value = data.items
  } catch (err: unknown) {
    appStore.showError(extractApiErrorMessage(err, t('globalPricing.loadFailed')))
  } finally {
    loading.value = false
  }
}

onMounted(loadPricing)
</script>

<style scoped>
.summary-tile {
  @apply rounded-lg border border-accent-200 bg-white px-4 py-3 dark:border-dark-700 dark:bg-dark-800;
}

.summary-label {
  @apply block text-xs font-medium text-gray-500 dark:text-gray-400;
}

.summary-value {
  @apply mt-1 block font-mono text-xl font-semibold text-gray-900 dark:text-white;
}

.summary-value-small {
  @apply text-sm;
}

.hash-pill,
.meta-pill,
.capability-pill {
  @apply inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium;
}

.hash-pill {
  @apply border-accent-200 bg-white text-gray-500 dark:border-dark-700 dark:bg-dark-800 dark:text-gray-400;
}

.meta-pill {
  @apply border-gray-200 bg-gray-50 text-gray-600 dark:border-dark-700 dark:bg-dark-900/60 dark:text-gray-300;
}

.capability-pill {
  @apply border-primary-200 bg-primary-50 text-primary-700 dark:border-primary-800/60 dark:bg-primary-900/20 dark:text-primary-300;
}

.global-pricing-table {
  @apply w-full border-collapse text-sm;
}

.global-pricing-table th {
  @apply sticky top-0 z-[1] whitespace-nowrap border-b border-accent-200 bg-primary-50/95 px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-accent-700 backdrop-blur-sm dark:border-dark-700 dark:bg-dark-800/95 dark:text-dark-300;
}

.global-pricing-table td {
  @apply whitespace-nowrap border-b border-accent-100 px-4 py-3 align-top text-gray-700 dark:border-dark-800 dark:text-gray-300;
}

.pricing-row {
  @apply transition-colors hover:bg-gray-50/60 dark:hover:bg-dark-900/50;
}

.sticky-col {
  @apply sticky left-0 z-[2] bg-white shadow-[1px_0_0_rgba(226,232,240,0.9)] dark:bg-dark-800 dark:shadow-[1px_0_0_rgba(55,65,81,0.9)];
}

thead .sticky-col {
  @apply z-[3] bg-primary-50/95 dark:bg-dark-800/95;
}

.price-cell {
  @apply font-mono text-[13px] text-gray-900 dark:text-white;
}

.price-subline {
  @apply mt-1 font-sans text-[11px] text-gray-500 dark:text-gray-400;
}

.compact-stack {
  @apply flex flex-col gap-1 font-mono text-[12px] leading-snug text-gray-700 dark:text-gray-300;
}

.skeleton-line {
  @apply h-4 animate-pulse rounded bg-gray-200 dark:bg-dark-700;
}
</style>
