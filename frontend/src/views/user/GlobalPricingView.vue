<template>
  <AppLayout>
    <TablePageLayout class="global-pricing-atelier" scroll-mode="page">
      <template #filters>
        <div class="global-pricing-filter-stack">
          <div class="global-pricing-summary-row global-pricing-linked-hover-group grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <div class="summary-tile global-pricing-linked-card admin-material-surface">
              <span class="summary-label">{{ t('globalPricing.summary.totalModels') }}</span>
              <strong class="summary-value">{{ pricing?.model_count ?? items.length }}</strong>
            </div>
            <div class="summary-tile global-pricing-linked-card admin-material-surface">
              <span class="summary-label">{{ t('globalPricing.summary.visibleModels') }}</span>
              <strong class="summary-value">{{ filteredItems.length }}</strong>
            </div>
            <div class="summary-tile global-pricing-linked-card admin-material-surface">
              <span class="summary-label">{{ t('globalPricing.summary.providers') }}</span>
              <strong class="summary-value">{{ providerOptions.length }}</strong>
            </div>
            <div class="summary-tile global-pricing-linked-card admin-material-surface">
              <span class="summary-label">{{ t('globalPricing.summary.updated') }}</span>
              <strong class="summary-value summary-value-small">{{ formattedLastUpdated }}</strong>
            </div>
          </div>

          <div class="global-pricing-filter-card table-page-filter-section">
            <div class="global-pricing-filter-shell table-filter-shell">
              <div class="global-pricing-filter-left table-filter-left flex flex-1 flex-wrap items-center gap-3">
                <div class="global-pricing-search-control relative w-full sm:w-96">
                  <Icon
                    name="search"
                    size="md"
                    class="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--anthropic-muted)] dark:text-[var(--anthropic-muted)]"
                  />
                  <input
                    v-model="searchQuery"
                    type="text"
                    :placeholder="t('globalPricing.searchPlaceholder')"
                    class="input pl-10"
                    data-testid="global-pricing-search"
                  />
                </div>

                <Select
                  v-model="providerFilter"
                  class="w-full sm:w-44"
                  :options="providerFilterOptions"
                  data-testid="global-pricing-filter-provider"
                />

                <Select
                  v-model="modeFilter"
                  class="w-full sm:w-40"
                  :options="modeFilterOptions"
                  data-testid="global-pricing-filter-mode"
                />

                <label class="global-pricing-checkbox-filter inline-flex items-center gap-2 text-sm text-[var(--anthropic-muted)] dark:text-[var(--anthropic-muted)]">
                  <input
                    v-model="promptCachingOnly"
                    type="checkbox"
                    class="h-4 w-4 rounded border-[var(--anthropic-border)] text-[var(--anthropic-fg)] focus:ring-0 focus-visible:ring-2 focus-visible:ring-[var(--atelier-focus)] dark:border-[var(--anthropic-border)]"
                    data-testid="global-pricing-prompt-caching-only"
                  />
                  <span>{{ t('globalPricing.filters.promptCachingOnly') }}</span>
                </label>
              </div>

              <div class="global-pricing-filter-actions table-filter-actions flex w-full flex-shrink-0 flex-wrap items-center justify-end gap-3 xl:w-auto">
                <span class="hash-pill" :title="pricing?.local_hash || '-'">
                  {{ t('globalPricing.dataHash') }}: {{ pricing?.local_hash || '-' }}
                </span>
                <button
                  @click="loadPricing"
                  :disabled="loading"
                  class="btn btn-primary anthropic-refresh-action-button global-pricing-refresh-button"
                  data-testid="global-pricing-refresh"
                  :title="t('common.refresh', 'Refresh')"
                >
                  {{ t("common.refresh", "Refresh") }}
                </button>
              </div>
            </div>
          </div>
        </div>
      </template>

      <template #table>
        <div class="table-wrapper admin-material-surface global-pricing-card-frame">
          <table class="global-pricing-table">
            <thead>
              <tr>
                <th class="brand-sticky-col brand-cell w-14">{{ t('globalPricing.columns.brand') }}</th>
                <th class="model-sticky-col w-[260px]">{{ t('globalPricing.columns.model') }}</th>
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

            <tbody v-if="loading" class="global-pricing-skeleton-body">
              <tr v-for="idx in 8" :key="idx">
                <td
                  v-for="cell in 11"
                  :key="cell"
                  :class="[cell === 1 ? 'brand-sticky-col brand-cell' : '', cell === 2 ? 'model-sticky-col' : '']"
                >
                  <div v-if="cell === 1" class="skeleton-icon"></div>
                  <div v-else class="skeleton-line" :class="cell === 2 ? 'w-48' : 'w-24'"></div>
                </td>
              </tr>
            </tbody>

            <tbody v-else-if="filteredItems.length === 0" class="global-pricing-empty-body">
              <tr>
                <td colspan="11" class="py-14 text-center">
                  <Icon name="inbox" size="xl" class="mx-auto mb-3 h-12 w-12 text-[var(--anthropic-muted)]" />
                  <p class="text-sm text-[var(--anthropic-muted)] dark:text-[var(--anthropic-muted)]">{{ t('globalPricing.empty') }}</p>
                </td>
              </tr>
            </tbody>

            <tbody v-else class="global-pricing-card-body">
              <tr v-for="item in filteredItems" :key="item.model" class="pricing-row">
                <td class="brand-sticky-col brand-cell" :data-card-label="t('globalPricing.columns.brand')">
                <!-- uses shared AI logo CDN images -->
                <ProviderBrandIcon :provider="item.provider" :model="item.model" />
                  <span class="sr-only">{{ item.provider || item.model }}</span>
                </td>
                <td class="model-sticky-col" :data-card-label="t('globalPricing.columns.model')">
                  <div class="min-w-0">
                    <p class="truncate font-medium text-[var(--anthropic-fg)] dark:text-[var(--anthropic-fg)]" :title="item.model">
                      {{ item.model }}
                    </p>
                    <p v-if="item.long_context_input_token_threshold > 0" class="mt-1 text-[11px] text-[var(--anthropic-muted)] dark:text-[var(--anthropic-muted)]">
                      {{ t('globalPricing.longContextThreshold', { count: formatInteger(item.long_context_input_token_threshold) }) }}
                    </p>
                  </div>
                </td>
                <td :data-card-label="t('globalPricing.columns.provider')">
                  <span :class="['meta-pill', 'meta-pill-provider', providerPillClass(item.provider)]">
                    {{ item.provider || '-' }}
                  </span>
                </td>
                <td :data-card-label="t('globalPricing.columns.mode')">
                  <span class="meta-pill meta-pill-mode uppercase">{{ item.mode || '-' }}</span>
                </td>
                <td class="price-cell" :data-card-label="t('globalPricing.columns.input')">{{ formatTokenPrice(item.input_price) }}</td>
                <td class="price-cell" :data-card-label="t('globalPricing.columns.cacheWrite')">
                  <div>{{ formatTokenPrice(item.cache_write_price) }}</div>
                  <div v-if="item.cache_write_1h_price > 0" class="price-subline">
                    {{ t('globalPricing.above1h') }} {{ formatTokenPrice(item.cache_write_1h_price) }}
                  </div>
                </td>
                <td class="price-cell" :data-card-label="t('globalPricing.columns.cacheRead')">{{ formatTokenPrice(item.cache_read_price) }}</td>
                <td class="price-cell" :data-card-label="t('globalPricing.columns.output')">{{ formatTokenPrice(item.output_price) }}</td>
                <td :data-card-label="t('globalPricing.columns.priority')">
                  <div class="compact-stack">
                    <span>{{ t('globalPricing.short.input') }} {{ formatTokenPrice(item.input_priority_price) }}</span>
                    <span>{{ t('globalPricing.short.output') }} {{ formatTokenPrice(item.output_priority_price) }}</span>
                    <span>{{ t('globalPricing.short.cacheRead') }} {{ formatTokenPrice(item.cache_read_priority_price) }}</span>
                  </div>
                </td>
                <td :data-card-label="t('globalPricing.columns.image')">
                  <div class="compact-stack">
                    <span>{{ t('globalPricing.short.perImage') }} {{ formatUnitPrice(item.image_output_price) }}</span>
                    <span>{{ t('globalPricing.short.imageToken') }} {{ formatTokenPrice(item.image_output_token_price) }}</span>
                  </div>
                </td>
                <td :data-card-label="t('globalPricing.columns.capabilities')">
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
                    <span v-if="!hasCapabilities(item)" class="text-xs text-[var(--anthropic-muted)]">-</span>
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
import ProviderBrandIcon from '@/components/common/ProviderBrandIcon.vue'
import Select from '@/components/common/Select.vue'
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

const providerFilterOptions = computed(() => [
  { value: '', label: t('globalPricing.filters.allProviders') },
  ...providerOptions.value.map(provider => ({ value: provider, label: provider })),
])

const modeFilterOptions = computed(() => [
  { value: '', label: t('globalPricing.filters.allModes') },
  ...modeOptions.value.map(mode => ({ value: mode, label: mode })),
])

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

function providerPillClass(provider?: string): string {
  const normalized = (provider || '').toLowerCase()
  if (normalized.includes('anthropic') || normalized.includes('claude')) return 'meta-pill-provider-anthropic'
  if (normalized.includes('openai') || normalized.includes('gpt')) return 'meta-pill-provider-openai'
  if (normalized.includes('gemini') || normalized.includes('google')) return 'meta-pill-provider-gemini'
  if (normalized.includes('xai') || normalized.includes('grok')) return 'meta-pill-provider-xai'
  if (normalized.includes('cloudflare') || normalized.includes('azure') || normalized.includes('openrouter')) {
    return 'meta-pill-provider-infra'
  }
  return 'meta-pill-provider-default'
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
.global-pricing-filter-stack {
  display: grid;
  gap: 1rem;
}

.summary-tile {
  --material-card-surface: var(--atelier-paper-2);
  --material-card-edge: var(--atelier-material-edge);
  --material-card-shadow: rgba(17, 24, 39, 0.36);
  @apply rounded-lg border px-4 py-3;
  border-color: var(--material-card-edge);
  background: var(--material-card-surface);
  box-shadow: 0 10px 24px -22px var(--material-card-shadow);
}

.summary-tile::before {
  content: "";
  display: block;
  height: 1px;
  margin-bottom: 10px;
  background: var(--atelier-console-rule);
}

.table-wrapper {
  --material-card-surface: var(--anthropic-page);
  --material-table-header-surface: var(--anthropic-page);
  --material-table-cell-surface: var(--anthropic-page);
  --material-table-hover-surface: var(--anthropic-cookbook-hover);
  --material-card-edge: var(--anthropic-cookbook-border);
  --material-row-edge: var(--anthropic-border-soft);
  border: 1px solid var(--material-card-edge);
  border-radius: 8px;
  background: var(--material-card-surface);
  box-shadow: none;
}

.dark .table-wrapper {
  --material-card-surface: var(--anthropic-page);
  --material-table-header-surface: var(--anthropic-page);
  --material-table-cell-surface: var(--anthropic-page);
  --material-table-hover-surface: var(--anthropic-cookbook-hover);
  --material-card-edge: var(--anthropic-cookbook-border);
  --material-row-edge: var(--anthropic-border-soft);
}

.dark .summary-tile {
  background: var(--material-card-surface);
  box-shadow: 0 10px 24px -22px var(--material-card-shadow);
}

.dark .table-wrapper {
  background: var(--material-card-surface);
  box-shadow: none;
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
  @apply dark:border-dark-700 dark:bg-dark-800 dark:text-gray-400;
  border-color: var(--atelier-line);
  background: var(--atelier-paper-2);
  color: var(--atelier-muted);
}

.meta-pill {
  @apply dark:border-dark-700 dark:bg-dark-900/60 dark:text-gray-300;
  border-color: var(--atelier-line);
  background: var(--atelier-dust-soft);
  color: var(--atelier-dust);
}

.meta-pill-provider {
  border-color: var(--provider-pill-border);
  background: var(--provider-pill-bg);
  color: var(--provider-pill-fg);
}

.meta-pill-provider-anthropic {
  --provider-pill-border: color-mix(in srgb, var(--anthropic-accent) 32%, transparent);
  --provider-pill-bg: transparent;
  --provider-pill-fg: var(--anthropic-accent);
}

.meta-pill-provider-openai {
  --provider-pill-border: var(--anthropic-success-border);
  --provider-pill-bg: var(--anthropic-success-bg);
  --provider-pill-fg: var(--anthropic-success);
}

.meta-pill-provider-gemini,
.meta-pill-provider-infra {
  --provider-pill-border: var(--anthropic-info-border);
  --provider-pill-bg: var(--anthropic-info-bg);
  --provider-pill-fg: var(--anthropic-info);
}

.meta-pill-provider-xai {
  --provider-pill-border: var(--anthropic-error-border);
  --provider-pill-bg: var(--anthropic-error-bg);
  --provider-pill-fg: var(--anthropic-error);
}

.meta-pill-provider-default,
.meta-pill-mode {
  --provider-pill-border: var(--anthropic-cookbook-border);
  --provider-pill-bg: var(--anthropic-section);
  --provider-pill-fg: var(--anthropic-muted);
}

.capability-pill {
  @apply dark:border-primary-800/60 dark:bg-primary-900/20 dark:text-primary-300;
  border-color: color-mix(in srgb, var(--atelier-blue) 22%, var(--atelier-line));
  background: var(--atelier-blue-soft);
  color: var(--atelier-blue);
}

.global-pricing-table {
  @apply w-full border-collapse text-sm;
}

.global-pricing-table th {
  @apply sticky top-0 z-[1] whitespace-nowrap border-b border-accent-200 px-4 py-3 text-left text-xs font-medium uppercase tracking-wide dark:border-dark-700 dark:bg-dark-800 dark:text-dark-300;
  border-color: var(--material-row-edge);
  background: var(--material-table-header-surface);
  color: var(--anthropic-muted);
}

.global-pricing-table td {
  @apply whitespace-nowrap border-b border-accent-100 px-4 py-3 align-top dark:border-dark-800 dark:text-gray-300;
  border-color: var(--material-row-edge);
  background: var(--material-table-cell-surface);
  color: var(--anthropic-fg);
}

.pricing-row {
  @apply transition-colors dark:hover:bg-dark-900/50;
}

.pricing-row:hover {
  background: var(--material-table-hover-surface);
}

.pricing-row:hover td,
.pricing-row:hover .brand-sticky-col,
.pricing-row:hover .model-sticky-col {
  background: var(--material-table-hover-surface);
}

.brand-cell {
  @apply px-3 text-center align-middle;
}

.brand-sticky-col {
  @apply sticky left-0 z-[3] dark:bg-dark-800;
  background: var(--material-table-cell-surface);
}

.model-sticky-col {
  @apply sticky left-0 z-[2] dark:bg-dark-800 dark:shadow-[1px_0_0_rgba(55,65,81,0.9)];
  left: 3.5rem;
  background: var(--material-table-cell-surface);
  box-shadow: 1px 0 0 var(--material-row-edge);
}

thead .brand-sticky-col,
thead .model-sticky-col {
  @apply z-[3] dark:bg-dark-800/95;
  background: var(--material-table-header-surface);
}

.price-cell {
  @apply font-mono text-[13px] dark:text-white;
  color: var(--atelier-blue-dark);
}

.price-subline {
  @apply mt-1 font-sans text-[11px] text-gray-500 dark:text-gray-400;
}

.compact-stack {
  @apply flex flex-col gap-1 font-mono text-[12px] leading-snug text-gray-700 dark:text-gray-300;
}

.skeleton-line {
  @apply h-4 rounded;
  background: var(--anthropic-loading-gradient, linear-gradient(90deg, var(--anthropic-section), var(--anthropic-raised), var(--anthropic-section)));
  background-size: 220% 100%;
  animation: anthropic-loading-sweep 1.2s ease-in-out infinite;
}

.skeleton-icon {
  @apply mx-auto h-7 w-7 rounded-md;
  background: var(--anthropic-loading-gradient, linear-gradient(90deg, var(--anthropic-section), var(--anthropic-raised), var(--anthropic-section)));
  background-size: 220% 100%;
  animation: anthropic-loading-sweep 1.2s ease-in-out infinite;
}

@media (prefers-reduced-motion: reduce) {
  .skeleton-line,
  .skeleton-icon {
    background: var(--anthropic-section);
    animation: none;
  }
}
</style>
