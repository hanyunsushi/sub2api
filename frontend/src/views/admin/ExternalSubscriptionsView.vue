<template>
  <AppLayout>
    <TablePageLayout :scroll-mode="'page'" class="external-subscriptions-page">
      <template #filters>
        <div class="table-filter-shell flex flex-wrap items-center gap-3">
          <div class="table-filter-left flex flex-1 flex-wrap items-center gap-3">
            <div class="table-filter-search flex-1 sm:max-w-72">
              <input data-testid="admin-external-subscriptions-input-search-query"
                v-model="searchQuery"
                type="text"
                class="input"
                :placeholder="localText('搜索名称、ID、域名或关键字', 'Search name, ID, domain, or keyword')"
              />
            </div>
            <Select
              v-model="templateFilter"
              :options="templateFilterOptions"
              class="w-48"
            />
            <Select
              v-model="enabledFilter"
              :options="enabledFilterOptions"
              class="w-36"
            />
          </div>

          <div class="table-filter-actions flex w-full flex-shrink-0 flex-wrap items-center justify-end gap-2 lg:w-auto">
            <button data-testid="admin-external-subscriptions-button-refresh-all-true"
              type="button"
              class="btn btn-secondary"
              :disabled="loading || statusLoading"
              :title="t('common.refresh')"
              @click="refreshAll(true)"
            >
              <Icon name="refresh" size="md" :class="loading || statusLoading ? 'animate-spin' : ''" />
            </button>
            <button data-testid="admin-external-subscriptions-button-open-create-dialog" type="button" class="btn btn-primary" @click="openCreateDialog">
              <Icon name="plus" size="md" class="mr-2" />
              {{ localText('新增订阅', 'Add Provider') }}
            </button>
          </div>
        </div>
      </template>

      <template #table>
        <div class="external-subscription-card-shell">
          <div
            v-if="isInitialLoading"
            class="external-subscription-card-grid grid gap-3 md:grid-cols-2 xl:grid-cols-4"
          >
            <div
              v-for="index in 6"
              :key="index"
              class="external-subscription-card external-subscription-card-main"
            >
              <div class="h-10 w-10 animate-pulse rounded-lg bg-gray-100 dark:bg-dark-700"></div>
              <div class="mt-4 h-4 w-32 animate-pulse rounded bg-gray-100 dark:bg-dark-700"></div>
              <div class="mt-6 h-12 animate-pulse rounded bg-gray-100 dark:bg-dark-700"></div>
              <div class="mt-5 h-3 w-40 animate-pulse rounded bg-gray-100 dark:bg-dark-700"></div>
            </div>
          </div>

          <div
            v-else-if="filteredCards.length > 0"
            class="external-subscription-card-grid grid gap-3 md:grid-cols-2 xl:grid-cols-4"
          >
            <article
              v-for="card in filteredCards"
              :key="card.id"
              class="external-subscription-card external-subscription-card-main"
            >
              <div class="flex items-start justify-between gap-3">
                <div class="flex min-w-0 items-start gap-3">
                  <div
                    data-testid="external-subscription-logo"
                    class="external-subscription-logo"
                    :title="card.name"
                  >
                    <ProviderBrandIcon
                      :provider="card.logoText"
                      :model="card.name"
                      :logo-url="card.logoUrl"
                    />
                  </div>
                  <div class="min-w-0">
                    <div class="min-w-0">
                      <h3 class="truncate text-sm font-semibold text-gray-900 dark:text-white">
                        {{ card.name }}
                      </h3>
                      <div class="external-subscription-status-line">
                        <span :class="cardStatusDotClass(card)" aria-hidden="true"></span>
                        <span class="external-subscription-status-text truncate">
                          {{ cardStatusText(card) }}
                        </span>
                      </div>
                    </div>
                    <div class="mt-1 flex min-w-0 items-center gap-2">
                      <span class="external-subscription-provider-id truncate font-mono">
                        {{ card.id }}
                      </span>
                      <span class="external-subscription-template-chip truncate">
                        {{ cardTemplateLabel(card) }}
                      </span>
                    </div>
                  </div>
                </div>
                <div v-if="card.providerConfig" class="flex flex-shrink-0 items-center gap-1">
                  <button data-testid="admin-external-subscriptions-button-open-edit-dialog-card-provider-config"
                    type="button"
                    class="btn-ghost btn-icon"
                    :title="t('common.edit')"
                    @click="openEditDialog(card.providerConfig)"
                  >
                    <Icon name="edit" size="sm" />
                  </button>
                  <button data-testid="admin-external-subscriptions-button-open-delete-dialog-card-provider-config"
                    type="button"
                    class="btn-ghost btn-icon text-red-500 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20"
                    :title="t('common.delete')"
                    @click="openDeleteDialog(card.providerConfig)"
                  >
                    <Icon name="trash" size="sm" />
                  </button>
                </div>
              </div>

              <a data-testid="admin-external-subscriptions-link-a"
                class="external-subscription-card-link mt-2 block truncate font-mono text-xs"
                :href="card.siteUrl"
                :title="card.siteUrl"
                target="_blank"
                rel="noopener noreferrer"
              >
                {{ localText('前往官网', 'Official site') }}
              </a>

              <div class="external-subscription-balance-row mt-3">
                <div class="external-subscription-card-label">{{ localText('余额', 'Balance') }}</div>
                <div
                  class="external-subscription-balance-value truncate font-mono"
                  :title="formatCardBalance(card)"
                >
                  {{ formatCardBalance(card) }}
                </div>
              </div>

              <div class="external-subscription-card-facts mt-3">
                <div class="external-subscription-fact min-w-0">
                  <div class="external-subscription-card-label">{{ localText('期限', 'Expiry') }}</div>
                  <div class="external-subscription-fact-value truncate">
                    {{ formatCardExpiry(card) }}
                  </div>
                </div>
              </div>

              <div v-if="getCardQuotaProgress(card)" class="external-subscription-quota-progress mt-3">
                <div class="flex items-center justify-between gap-2">
                  <span class="external-subscription-card-label">{{ localText('额度', 'Quota') }}</span>
                  <span class="external-subscription-quota-progress-value font-mono">
                    {{ formatCardQuotaUsage(card) }}
                  </span>
                </div>
                <UsageProgressBar
                  data-testid="external-subscription-quota-progress"
                  label="EXT"
                  :utilization="getCardQuotaProgress(card)?.percent ?? 0"
                  :title="formatCardQuotaUsage(card)"
                  color="emerald"
                  :show-now-when-idle="false"
                />
              </div>

              <div class="external-subscription-config-meta mt-2">
                <span>{{ formatTokenMeta(card) }}</span>
                <span
                  v-if="card.template === 'active_subscriptions'"
                  class="external-subscription-config-separator"
                  aria-hidden="true"
                >
                  /
                </span>
                <span v-if="card.template === 'active_subscriptions'">
                  {{ formatRefreshTokenMeta(card) }}
                </span>
                <span v-if="card.readonly" class="external-subscription-config-readonly">
                  {{ localText('只读来源', 'Read-only') }}
                </span>
              </div>

              <div class="mt-auto flex flex-wrap gap-1 pt-3">
                <span
                  v-for="keyword in card.matchKeywords"
                  :key="keyword"
                  class="external-subscription-keyword"
                >
                  {{ keyword }}
                </span>
                <span v-if="card.matchKeywords.length === 0" class="text-xs text-gray-400">-</span>
              </div>
            </article>
          </div>

          <EmptyState
            v-else
            :title="localText('暂无外部订阅', 'No External Subscriptions')"
            :description="localText('新增一个 provider 后，它会进入右上角余额和匹配账号卡片。', 'Add a provider to show it in the header balance and matching account cards.')"
            :action-text="localText('新增订阅', 'Add Provider')"
            @action="openCreateDialog"
          />
        </div>
      </template>
    </TablePageLayout>

    <BaseDialog
      :show="showDialog"
      :title="editingProvider ? localText('编辑外部订阅', 'Edit External Subscription') : localText('新增外部订阅', 'Add External Subscription')"
      width="wide"
      @close="closeDialog"
    >
      <form id="external-subscription-form" class="space-y-5" @submit.prevent="handleSubmit">
        <div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          <button data-testid="admin-external-subscriptions-button-apply-preset-newapi-console"
            type="button"
            class="rounded-lg border border-primary-200 bg-primary-50 px-4 py-3 text-left transition-colors hover:border-primary-300 hover:bg-primary-100 dark:border-primary-800 dark:bg-primary-900/20 dark:hover:bg-primary-900/30"
            @click="applyPreset('newapi_console')"
          >
            <div class="text-sm font-semibold text-primary-700 dark:text-primary-300">NewAPI Console</div>
            <div class="mt-1 text-xs text-gray-500 dark:text-gray-400">
              {{ localText('QL、LIUST、PackyCode 这类控制台余额接口', 'For QL, LIUST, PackyCode style console balance APIs') }}
            </div>
          </button>
          <button data-testid="admin-external-subscriptions-button-apply-preset-active-subscriptions"
            type="button"
            class="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-left transition-colors hover:border-amber-300 hover:bg-amber-100 dark:border-amber-800 dark:bg-amber-900/20 dark:hover:bg-amber-900/30"
            @click="applyPreset('active_subscriptions')"
          >
            <div class="text-sm font-semibold text-amber-700 dark:text-amber-300">Active Subscriptions</div>
            <div class="mt-1 text-xs text-gray-500 dark:text-gray-400">
              {{ localText('TCDMX、XHY、Pixel 这类 /api/v1/subscriptions/active', 'For TCDMX, XHY, Pixel style /api/v1/subscriptions/active APIs') }}
            </div>
          </button>
          <button data-testid="admin-external-subscriptions-button-apply-preset-buzz-balance"
            type="button"
            class="rounded-lg border border-sky-200 bg-sky-50 px-4 py-3 text-left transition-colors hover:border-sky-300 hover:bg-sky-100 dark:border-sky-800 dark:bg-sky-900/20 dark:hover:bg-sky-900/30"
            @click="applyPreset('buzz_balance')"
          >
            <div class="text-sm font-semibold text-sky-700 dark:text-sky-300">Buzz Balance</div>
            <div class="mt-1 text-xs text-gray-500 dark:text-gray-400">
              {{ localText('Buzz /v1/dashboard/billing 余额接口', 'Buzz /v1/dashboard/billing balance API') }}
            </div>
          </button>
          <button data-testid="admin-external-subscriptions-button-apply-preset-openrouter-credits"
            type="button"
            class="rounded-lg border border-sky-200 bg-sky-50 px-4 py-3 text-left transition-colors hover:border-sky-300 hover:bg-sky-100 dark:border-sky-800 dark:bg-sky-900/20 dark:hover:bg-sky-900/30"
            @click="applyPreset('openrouter_credits')"
          >
            <div class="text-sm font-semibold text-sky-700 dark:text-sky-300">OpenRouter Credits</div>
            <div class="mt-1 text-xs text-gray-500 dark:text-gray-400">
              {{ localText('OpenRouter /api/v1/credits 余额接口', 'OpenRouter /api/v1/credits balance API') }}
            </div>
          </button>
          <button data-testid="admin-external-subscriptions-button-apply-preset-cloudflare-ai-gateway-credits"
            type="button"
            class="rounded-lg border border-orange-200 bg-orange-50 px-4 py-3 text-left transition-colors hover:border-orange-300 hover:bg-orange-100 dark:border-orange-800 dark:bg-orange-900/20 dark:hover:bg-orange-900/30"
            @click="applyPreset('cloudflare_ai_gateway_credits')"
          >
            <div class="text-sm font-semibold text-orange-700 dark:text-orange-300">Cloudflare AI Gateway</div>
            <div class="mt-1 text-xs text-gray-500 dark:text-gray-400">
              {{ localText('Cloudflare AI Gateway credit-balance', 'Cloudflare AI Gateway credit-balance') }}
            </div>
          </button>
          <button data-testid="admin-external-subscriptions-button-apply-preset-rawchat-subscriptions"
            type="button"
            class="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-left transition-colors hover:border-amber-300 hover:bg-amber-100 dark:border-amber-800 dark:bg-amber-900/20 dark:hover:bg-amber-900/30"
            @click="applyPreset('rawchat_subscriptions')"
          >
            <div class="text-sm font-semibold text-amber-700 dark:text-amber-300">RawChat</div>
            <div class="mt-1 text-xs text-gray-500 dark:text-gray-400">
              {{ localText('RawChat 用户中心订阅接口', 'RawChat user-center subscriptions API') }}
            </div>
          </button>
          <button data-testid="admin-external-subscriptions-button-apply-preset-mimo-token-plan"
            type="button"
            class="rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-left transition-colors hover:border-gray-300 hover:bg-gray-100 dark:border-dark-700 dark:bg-dark-800/70 dark:hover:bg-dark-700"
            @click="applyPreset('mimo_token_plan')"
          >
            <div class="text-sm font-semibold text-gray-700 dark:text-gray-200">Xiaomi MiMo</div>
            <div class="mt-1 text-xs text-gray-500 dark:text-gray-400">
              {{ localText('小米 MiMo Token Plan 余额接口', 'Xiaomi MiMo Token Plan balance API') }}
            </div>
          </button>
        </div>

        <div class="grid gap-4 sm:grid-cols-2">
          <div>
            <label class="input-label">
              ID <span class="text-red-500">*</span>
            </label>
            <input data-testid="admin-external-subscriptions-input-form-id"
              v-model="form.id"
              type="text"
              class="input font-mono"
              :disabled="Boolean(editingProvider)"
              required
              placeholder="custom-provider"
            />
          </div>
          <div>
            <label class="input-label">
              {{ localText('显示名称', 'Display Name') }} <span class="text-red-500">*</span>
            </label>
            <input data-testid="admin-external-subscriptions-input-form-name" v-model="form.name" type="text" class="input" required placeholder="PackyCode" />
          </div>
        </div>

        <LogoPicker
          v-model="form.logo_url"
          :label="localText('Logo URL', 'Logo URL')"
          :hint="localText('可填 Lobe Icons、Simple Icons 或自有图床地址；留空则按名称自动匹配。', 'Use a Lobe Icons, Simple Icons, or custom image URL; leave blank to auto-match by name.')"
          input-test-id="external-subscription-logo-url"
        />

        <div class="grid gap-4 sm:grid-cols-[1fr_12rem]">
          <div>
            <label class="input-label">
              API Base URL <span class="text-red-500">*</span>
            </label>
            <input data-testid="admin-external-subscriptions-input-form-api-base-url" v-model="form.api_base_url" type="url" class="input" required placeholder="https://api.example.com" />
          </div>
          <div>
            <label class="input-label">{{ localText('排序', 'Sort Order') }}</label>
            <input data-testid="admin-external-subscriptions-input-form-sort-order" v-model.number="form.sort_order" type="number" class="input" min="0" step="1" />
          </div>
        </div>

        <div class="grid gap-4 sm:grid-cols-3">
          <div>
            <label class="input-label">{{ localText('模板', 'Template') }}</label>
            <Select v-model="form.template" :options="templateOptions" />
          </div>
          <div>
            <label class="input-label">{{ localText('余额策略', 'Balance Strategy') }}</label>
            <Select v-model="form.balance_strategy" :options="balanceStrategyOptions" />
          </div>
          <div class="flex items-center justify-between rounded-lg border border-gray-200 px-3 py-2 dark:border-dark-700">
            <div>
              <div class="text-sm font-medium text-gray-700 dark:text-gray-200">{{ localText('启用', 'Enabled') }}</div>
              <div class="text-xs text-gray-500 dark:text-gray-400">{{ localText('关闭后不进入余额与账号卡片展示', 'Disabled providers are hidden from balance and account cards') }}</div>
            </div>
            <Toggle v-model="form.enabled" />
          </div>
        </div>

        <div class="grid gap-4 sm:grid-cols-2">
          <div>
            <label class="input-label">
              API Token
              <span v-if="editingProvider?.api_token_configured" class="ml-1 text-xs font-normal text-gray-400">
                leave blank to keep
              </span>
            </label>
            <input data-testid="admin-external-subscriptions-input-form-api-token"
              v-model="form.api_token"
              type="password"
              class="input"
              autocomplete="new-password"
              :placeholder="editingProvider?.api_token_configured ? localText('留空保持原 Token', 'leave blank to keep') : apiTokenPlaceholder"
            />
          </div>
          <div v-if="requiresUserId">
            <label class="input-label">{{ userIdLabel }}</label>
            <input data-testid="admin-external-subscriptions-input-form-user-id" v-model="form.user_id" type="text" class="input" :placeholder="userIdPlaceholder" />
          </div>
          <div v-if="requiresRefreshToken">
            <label class="input-label">
              Refresh Token
              <span v-if="editingProvider?.refresh_token_configured" class="ml-1 text-xs font-normal text-gray-400">
                leave blank to keep
              </span>
            </label>
            <input data-testid="admin-external-subscriptions-input-form-refresh-token"
              v-model="form.refresh_token"
              type="password"
              class="input"
              autocomplete="new-password"
              :placeholder="editingProvider?.refresh_token_configured ? localText('留空保持原 Refresh Token', 'leave blank to keep') : localText('可选，用于自动刷新', 'Optional, for automatic refresh')"
            />
          </div>
        </div>

        <div>
          <label class="input-label">{{ localText('账号匹配关键字', 'Account Match Keywords') }}</label>
          <textarea data-testid="admin-external-subscriptions-textarea-keywords-draft"
            v-model="keywordsDraft"
            rows="4"
            class="input font-mono text-sm"
            :placeholder="localText('每行或逗号分隔，例如 packycode, packyapi.com', 'Use one per line or comma separated, e.g. packycode, packyapi.com')"
          ></textarea>
          <p class="mt-1 text-xs text-gray-400">
            {{ localText('会匹配账号名称、备注、平台、类型、base_url、extra.external_provider 等字段。', 'Matches account name, notes, platform, type, base_url, extra.external_provider, and related fields.') }}
          </p>
        </div>
      </form>

      <template #footer>
        <div class="flex justify-end gap-3">
          <button data-testid="admin-external-subscriptions-button-close-dialog" type="button" class="btn btn-secondary" @click="closeDialog">
            {{ t('common.cancel') }}
          </button>
          <button data-testid="admin-external-subscriptions-button-submit" type="submit" form="external-subscription-form" class="btn btn-primary" :disabled="submitting">
            {{ submitting ? t('common.saving') : t('common.save') }}
          </button>
        </div>
      </template>
    </BaseDialog>

    <ConfirmDialog
      :show="showDeleteDialog"
      :title="localText('删除外部订阅', 'Delete External Subscription')"
      :message="localText(`确定删除 ${deletingProvider?.name || ''} 吗？`, `Delete ${deletingProvider?.name || ''}?`)"
      :confirm-text="t('common.delete')"
      :cancel-text="t('common.cancel')"
      danger
      @confirm="confirmDelete"
      @cancel="showDeleteDialog = false"
    />
  </AppLayout>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, reactive, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import externalSubscriptionsAPI, {
  type ExternalSubscriptionBalanceStrategy,
  type ExternalSubscriptionProvider,
  type ExternalSubscriptionProviderInput,
  type ExternalSubscriptionStatus,
  type ExternalSubscriptionTemplate,
} from '@/api/admin/externalSubscriptions'
import AppLayout from '@/components/layout/AppLayout.vue'
import TablePageLayout from '@/components/layout/TablePageLayout.vue'
import BaseDialog from '@/components/common/BaseDialog.vue'
import ConfirmDialog from '@/components/common/ConfirmDialog.vue'
import EmptyState from '@/components/common/EmptyState.vue'
import LogoPicker from '@/components/common/LogoPicker.vue'
import Select from '@/components/common/Select.vue'
import Toggle from '@/components/common/Toggle.vue'
import ProviderBrandIcon from '@/components/common/ProviderBrandIcon.vue'
import Icon from '@/components/icons/Icon.vue'
import UsageProgressBar from '@/components/account/UsageProgressBar.vue'
import { useAppStore } from '@/stores/app'
import {
  buildAccountExternalQuotaProgressMeta,
  type AccountExternalQuotaProgressPreference,
} from '@/utils/externalSubscriptionQuotaProgress'

const { t, locale } = useI18n()
const appStore = useAppStore()

const localText = (zh: string, en: string) => locale.value?.startsWith('zh') ? zh : en

const providers = ref<ExternalSubscriptionProvider[]>([])
const statuses = ref<ExternalSubscriptionStatus[]>([])
const loading = ref(false)
const statusLoading = ref(false)
const submitting = ref(false)
const searchQuery = ref('')
const templateFilter = ref<string>('')
const enabledFilter = ref<string>('')
const showDialog = ref(false)
const showDeleteDialog = ref(false)
const editingProvider = ref<ExternalSubscriptionProvider | null>(null)
const deletingProvider = ref<ExternalSubscriptionProvider | null>(null)
const keywordsDraft = ref('')

const form = reactive({
  id: '',
  name: '',
  enabled: true,
  template: 'newapi_console' as ExternalSubscriptionTemplate,
  balance_strategy: 'auto' as ExternalSubscriptionBalanceStrategy,
  api_base_url: '',
  logo_url: '',
  api_token: '',
  user_id: '',
  refresh_token: '',
  match_keywords: [] as string[],
  sort_order: 50,
})

const EXTERNAL_CARD_QUOTA_PROGRESS_PREFERENCE: AccountExternalQuotaProgressPreference = {
  enabled: true,
  mode: 'status_total',
  customTotal: null,
}

const templateOptions = computed(() => [
  { value: 'newapi_console', label: 'NewAPI Console' },
  { value: 'active_subscriptions', label: 'Active Subscriptions' },
  { value: 'buzz_balance', label: 'Buzz Balance' },
  { value: 'openrouter_credits', label: 'OpenRouter Credits' },
  { value: 'cloudflare_ai_gateway_credits', label: 'Cloudflare AI Gateway' },
  { value: 'rawchat_subscriptions', label: 'RawChat' },
  { value: 'mimo_token_plan', label: 'Xiaomi MiMo' },
])

const balanceStrategyOptions = computed(() => [
  { value: 'auto', label: localText('自动', 'Auto') },
  { value: 'newapi_user_quota', label: 'NewAPI User Quota' },
  { value: 'newapi_subscription', label: 'NewAPI Subscription' },
  { value: 'active_subscriptions', label: 'Active Subscriptions' },
  { value: 'auth_me_balance', label: 'Auth Me Balance' },
  { value: 'active_with_auth_me_balance', label: 'Active + Auth Me' },
])

const requiresUserId = computed(() => (
  form.template === 'newapi_console' ||
  form.template === 'cloudflare_ai_gateway_credits'
))

const requiresRefreshToken = computed(() => form.template === 'active_subscriptions')

const userIdLabel = computed(() => (
  form.template === 'cloudflare_ai_gateway_credits'
    ? 'Account ID'
    : localText('用户 ID', 'User ID')
))

const userIdPlaceholder = computed(() => (
  form.template === 'cloudflare_ai_gateway_credits' ? 'Cloudflare account id' : '707'
))

const apiTokenPlaceholder = computed(() => {
  if (form.template === 'buzz_balance') return 'Buzz API Token'
  if (form.template === 'openrouter_credits') return 'sk-or-...'
  if (form.template === 'cloudflare_ai_gateway_credits') return 'Cloudflare API Token'
  if (form.template === 'rawchat_subscriptions') return 'RawChat token'
  if (form.template === 'mimo_token_plan') return 'tp-xxxxx'
  return 'sk-...'
})

const templateFilterOptions = computed(() => [
  { value: '', label: localText('全部模板', 'All Templates') },
  ...templateOptions.value,
])

const enabledFilterOptions = computed(() => [
  { value: '', label: localText('全部状态', 'All Status') },
  { value: 'enabled', label: localText('启用', 'Enabled') },
  { value: 'disabled', label: localText('停用', 'Disabled') },
])

type ExternalSubscriptionCard = {
  id: string
  name: string
  template: ExternalSubscriptionTemplate
  enabled: boolean
  configured: boolean
  apiTokenConfigured: boolean
  refreshTokenConfigured: boolean
  matchKeywords: string[]
  sortOrder: number
  currency: string
  siteUrl: string
  balance: string
  expiry: string
  errorCode?: string
  errorMessage?: string
  status?: ExternalSubscriptionStatus
  providerConfig?: ExternalSubscriptionProvider
  readonly: boolean
  logoText: string
  logoUrl: string
}

const isInitialLoading = computed(() => (
  loading.value && statusLoading.value && displayCards.value.length === 0
))

const providerMap = computed<Record<string, ExternalSubscriptionProvider>>(() => (
  providers.value.reduce<Record<string, ExternalSubscriptionProvider>>((acc, provider) => {
    acc[provider.id.trim().toLowerCase()] = provider
    return acc
  }, {})
))

const displayCards = computed<ExternalSubscriptionCard[]>(() => {
  const cards: ExternalSubscriptionCard[] = []

  const statusCards = statuses.value.map((status) => {
    const id = status.provider.trim().toLowerCase()
    return buildStatusCard(status, providerMap.value[id])
  })
  cards.push(...statusCards)

  const displayed = new Set(cards.map(card => card.id))
  for (const provider of providers.value) {
    const id = provider.id.trim().toLowerCase()
    if (displayed.has(id)) continue
    cards.push(buildProviderOnlyCard(provider))
  }

  return cards.sort((left, right) => {
    if (left.sortOrder !== right.sortOrder) return left.sortOrder - right.sortOrder
    return left.name.localeCompare(right.name)
  })
})

const filteredCards = computed(() => {
  const query = searchQuery.value.trim().toLowerCase()
  return displayCards.value.filter((card) => {
    if (templateFilter.value && card.template !== templateFilter.value) return false
    if (enabledFilter.value === 'enabled' && !card.enabled) return false
    if (enabledFilter.value === 'disabled' && card.enabled) return false
    if (!query) return true
    const haystack = [
      card.id,
      card.name,
      card.template,
      card.siteUrl,
      card.balance,
      card.expiry,
      ...card.matchKeywords,
    ].join(' ').toLowerCase()
    return haystack.includes(query)
  })
})

function buildProviderLogoText(provider: ExternalSubscriptionProvider) {
  return [
    provider.id,
    provider.name,
    provider.api_base_url,
    ...provider.match_keywords,
  ].join(' ')
}

function templateLabel(template: ExternalSubscriptionTemplate) {
  switch (template) {
    case 'buzz_balance':
      return 'Buzz Balance'
    case 'active_subscriptions':
      return 'Active Subscriptions'
    case 'openrouter_credits':
      return 'OpenRouter Credits'
    case 'cloudflare_ai_gateway_credits':
      return 'Cloudflare AI Gateway'
    case 'rawchat_subscriptions':
      return 'RawChat'
    case 'mimo_token_plan':
      return 'Xiaomi MiMo'
    default:
      return 'NewAPI Console'
  }
}

function buildStatusCard(
  status: ExternalSubscriptionStatus,
  provider?: ExternalSubscriptionProvider,
): ExternalSubscriptionCard {
  const id = status.provider.trim().toLowerCase()
  return {
    id,
    name: provider?.name || status.name || id,
    template: provider?.template || status.template,
    enabled: status.enabled,
    configured: status.configured,
    apiTokenConfigured: provider?.api_token_configured ?? status.api_token_configured,
    refreshTokenConfigured: provider?.refresh_token_configured ?? status.refresh_token_configured,
    matchKeywords: provider?.match_keywords?.length ? provider.match_keywords : status.match_keywords,
    sortOrder: provider?.sort_order ?? status.sort_order,
    currency: status.currency,
    siteUrl: provider?.api_base_url || status.site_url,
    logoUrl: provider?.logo_url || status.logo_url || '',
    balance: formatStatusBalance(status),
    expiry: formatStatusExpiry(status),
    errorCode: status.error_code,
    errorMessage: status.error_message,
    status,
    providerConfig: provider,
    readonly: !provider,
    logoText: provider ? buildProviderLogoText(provider) : [
      id,
      status.name,
      status.site_url,
      ...status.match_keywords,
    ].join(' '),
  }
}

function buildProviderOnlyCard(provider: ExternalSubscriptionProvider): ExternalSubscriptionCard {
  return {
    id: provider.id,
    name: provider.name,
    template: provider.template,
    enabled: provider.enabled,
    configured: provider.api_token_configured || provider.refresh_token_configured || Boolean(provider.user_id),
    apiTokenConfigured: provider.api_token_configured,
    refreshTokenConfigured: provider.refresh_token_configured,
    matchKeywords: provider.match_keywords,
    sortOrder: provider.sort_order,
    currency: 'USD',
    siteUrl: provider.api_base_url,
    logoUrl: provider.logo_url || '',
    balance: provider.enabled ? localText('未同步', 'Unsynced') : localText('停用', 'Disabled'),
    expiry: '-',
    status: undefined,
    providerConfig: provider,
    readonly: false,
    logoText: buildProviderLogoText(provider),
  }
}

function parseKeywords(value: string) {
  return value
    .split(/[\n,，]+/)
    .map(item => item.trim().toLowerCase())
    .filter((item, index, arr) => item !== '' && arr.indexOf(item) === index)
}

function resetForm() {
  form.id = ''
  form.name = ''
  form.enabled = true
  form.template = 'newapi_console'
  form.balance_strategy = 'auto'
  form.api_base_url = ''
  form.logo_url = ''
  form.api_token = ''
  form.user_id = ''
  form.refresh_token = ''
  form.match_keywords = []
  form.sort_order = 50
  keywordsDraft.value = ''
}

function applyPreset(template: ExternalSubscriptionTemplate) {
  form.template = template
  if (template === 'newapi_console') {
    if (form.balance_strategy === 'auto') form.balance_strategy = 'newapi_subscription'
    if (!form.api_base_url) form.api_base_url = 'https://api.example.com'
    if (!form.name) form.name = 'NewAPI'
    if (!form.id) form.id = 'newapi-provider'
    if (!keywordsDraft.value.trim()) keywordsDraft.value = 'newapi\napi.example.com'
    return
  }
  if (template === 'active_subscriptions') {
    if (form.balance_strategy === 'auto') form.balance_strategy = 'active_subscriptions'
    if (!form.api_base_url) form.api_base_url = 'https://example.com'
    if (!form.name) form.name = 'Active Subscription'
    if (!form.id) form.id = 'active-provider'
    if (!keywordsDraft.value.trim()) keywordsDraft.value = 'example.com\nactive-provider'
    return
  }
  if (template === 'buzz_balance') {
    form.balance_strategy = 'auto'
    if (!form.api_base_url) form.api_base_url = 'https://buzzai.cc'
    if (!form.name) form.name = 'Buzz'
    if (!form.id) form.id = 'buzz'
    if (form.sort_order === 50) form.sort_order = 5
    if (!keywordsDraft.value.trim()) keywordsDraft.value = 'buzz\nbuzzai\nbuzzai.cc\nclaude'
    return
  }
  if (template === 'openrouter_credits') {
    form.balance_strategy = 'auto'
    if (!form.api_base_url) form.api_base_url = 'https://openrouter.ai'
    if (!form.name) form.name = 'OpenRouter'
    if (!form.id) form.id = 'openrouter'
    if (form.sort_order === 50) form.sort_order = 70
    if (!keywordsDraft.value.trim()) keywordsDraft.value = 'openrouter\nopenrouter.ai'
    return
  }
  if (template === 'cloudflare_ai_gateway_credits') {
    form.balance_strategy = 'auto'
    if (!form.api_base_url) form.api_base_url = 'https://api.cloudflare.com/client/v4'
    if (!form.name) form.name = 'Cloudflare AI Gateway'
    if (!form.id) form.id = 'cloudflare'
    if (form.sort_order === 50) form.sort_order = 80
    if (!keywordsDraft.value.trim()) keywordsDraft.value = 'cloudflare\nai-gateway\nworkers-ai'
    return
  }
  if (template === 'rawchat_subscriptions') {
    form.balance_strategy = 'auto'
    if (!form.api_base_url) form.api_base_url = 'https://rawchat.cn'
    if (!form.name) form.name = 'RawChat'
    if (!form.id) form.id = 'rawchat'
    if (form.sort_order === 50) form.sort_order = 90
    if (!keywordsDraft.value.trim()) keywordsDraft.value = 'rawchat\nrawchat.cn'
    return
  }
  if (template === 'mimo_token_plan') {
    form.balance_strategy = 'auto'
    if (!form.api_base_url) form.api_base_url = 'https://platform.xiaomimimo.com'
    if (!form.name) form.name = 'Xiaomi MiMo'
    if (!form.id) form.id = 'mimo'
    if (form.sort_order === 50) form.sort_order = 95
    if (!keywordsDraft.value.trim()) keywordsDraft.value = 'mimo\nxiaomi\nxiaomimimo'
  }
}

function openCreateDialog() {
  editingProvider.value = null
  resetForm()
  showDialog.value = true
}

function openEditDialog(provider: ExternalSubscriptionProvider) {
  editingProvider.value = provider
  form.id = provider.id
  form.name = provider.name
  form.enabled = provider.enabled
  form.template = provider.template
  form.balance_strategy = provider.balance_strategy
  form.api_base_url = provider.api_base_url
  form.logo_url = provider.logo_url || ''
  form.api_token = ''
  form.user_id = provider.user_id || ''
  form.refresh_token = ''
  form.match_keywords = [...provider.match_keywords]
  form.sort_order = provider.sort_order
  keywordsDraft.value = provider.match_keywords.join('\n')
  showDialog.value = true
}

function openDeleteDialog(provider: ExternalSubscriptionProvider) {
  deletingProvider.value = provider
  showDeleteDialog.value = true
}

function closeDialog() {
  showDialog.value = false
  editingProvider.value = null
}

function buildPayload(): ExternalSubscriptionProviderInput {
  return {
    id: editingProvider.value ? undefined : form.id.trim().toLowerCase(),
    name: form.name.trim(),
    enabled: form.enabled,
    template: form.template,
    balance_strategy: form.balance_strategy,
    api_base_url: form.api_base_url.trim(),
    logo_url: form.logo_url.trim(),
    api_token: form.api_token.trim(),
    user_id: requiresUserId.value ? form.user_id.trim() : '',
    refresh_token: requiresRefreshToken.value ? form.refresh_token.trim() : '',
    match_keywords: parseKeywords(keywordsDraft.value),
    sort_order: Number.isFinite(form.sort_order) ? Number(form.sort_order) : 50,
  }
}

async function loadProviders() {
  loading.value = true
  try {
    providers.value = await externalSubscriptionsAPI.listProviders()
  } catch (error: any) {
    appStore.showError(error?.message || localText('外部订阅加载失败', 'Failed to load external subscriptions'))
  } finally {
    loading.value = false
  }
}

async function loadStatuses(force = false) {
  statusLoading.value = true
  try {
    statuses.value = await externalSubscriptionsAPI.getDisplayStatuses({ refresh: force })
  } catch (error: any) {
    if (statuses.value.length === 0) statuses.value = []
    appStore.showError(error?.message || localText('订阅状态读取失败', 'Failed to load subscription statuses'))
  } finally {
    statusLoading.value = false
  }
}

async function refreshAll(force = false) {
  await Promise.all([loadProviders(), loadStatuses(force)])
}

async function handleSubmit() {
  submitting.value = true
  try {
    const payload = buildPayload()
    if (editingProvider.value) {
      await externalSubscriptionsAPI.updateProvider(editingProvider.value.id, payload)
    } else {
      await externalSubscriptionsAPI.createProvider(payload)
    }
    appStore.showSuccess(t('common.success'))
    closeDialog()
    await refreshAll(true)
  } catch (error: any) {
    appStore.showError(error?.message || t('common.error'))
  } finally {
    submitting.value = false
  }
}

async function confirmDelete() {
  if (!deletingProvider.value) return
  try {
    await externalSubscriptionsAPI.deleteProvider(deletingProvider.value.id)
    appStore.showSuccess(t('common.success'))
    showDeleteDialog.value = false
    deletingProvider.value = null
    await refreshAll(true)
  } catch (error: any) {
    appStore.showError(error?.message || t('common.error'))
  }
}

function formatMoney(value?: number | null, currency?: string | null) {
  if (typeof value !== 'number' || !Number.isFinite(value)) return null
  const normalized = (currency || '').trim().toUpperCase()
  if (normalized === 'CNY' || normalized === 'RMB') return `¥${value.toFixed(2)}`
  if (normalized === 'JPY') return `¥${value.toFixed(0)}`
  if (normalized && normalized !== 'USD') return `${normalized} ${value.toFixed(2)}`
  return `$${value.toFixed(2)}`
}

function formatDate(value?: string | null) {
  if (!value) return localText('长期', 'Long-term')
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return localText('长期', 'Long-term')
  return parsed.toISOString().slice(0, 10)
}

function isInvalidToken(code?: string | null) {
  const normalized = (code || '').trim().toUpperCase()
  return normalized === '401' || normalized === 'INVALID_TOKEN' || normalized === 'TOKEN_EXPIRED'
}

function cardStatusDotClass(card: ExternalSubscriptionCard) {
  return [
    'external-subscription-status-dot',
    `external-subscription-status-dot--${cardStatusTone(card)}`,
  ]
}

function cardStatusTone(card: ExternalSubscriptionCard) {
  if (!card.enabled) return 'neutral'
  if (!card.configured) return 'warning'
  if (card.errorCode) return 'danger'
  return 'success'
}

function cardStatusText(card: ExternalSubscriptionCard) {
  if (!card.enabled) return localText('停用', 'Disabled')
  if (!card.configured) return localText('未配置', 'Not configured')
  if (card.errorCode) return isInvalidToken(card.errorCode) ? localText('Token 失效', 'Token invalid') : localText('读取失败', 'Read failed')
  return localText('正常', 'OK')
}

function formatTokenMeta(card: ExternalSubscriptionCard) {
  return card.apiTokenConfigured ? 'API Token ready' : localText('Token 未配置', 'Token missing')
}

function formatRefreshTokenMeta(card: ExternalSubscriptionCard) {
  return card.refreshTokenConfigured ? 'Refresh Token ready' : localText('Refresh Token 未配置', 'Refresh Token missing')
}

function formatStatusBalance(status?: ExternalSubscriptionStatus) {
  if (!status) return '-'
  if (!status.enabled || !status.configured) return localText('未配置', 'Not configured')
  if (status.error_code) return isInvalidToken(status.error_code) ? localText('Token 失效', 'Token invalid') : localText('读取失败', 'Read failed')
  const remaining = formatMoney(status.remaining_usd, status.currency)
  const total = formatMoney(status.total_limit_usd, status.currency)
  if (remaining && total) return `${remaining} / ${total}`
  if (remaining) return remaining
  const unknown = localText('余额未知', 'Balance unknown')
  if (total) return `${unknown} / ${total}`
  return unknown
}

function formatStatusExpiry(status?: ExternalSubscriptionStatus) {
  if (!status) return '-'
  if (status.error_code) return isInvalidToken(status.error_code) ? localText('请更新 Token', 'Update token') : (status.error_message || localText('请检查配置', 'Check settings'))
  return formatDate(status.expires_at)
}

function formatCardBalance(card: ExternalSubscriptionCard) {
  return card.balance
}

function formatCardExpiry(card: ExternalSubscriptionCard) {
  return card.expiry
}

function getCardQuotaProgress(card: ExternalSubscriptionCard) {
  if (!card.status) return null
  return buildAccountExternalQuotaProgressMeta(card.status, EXTERNAL_CARD_QUOTA_PROGRESS_PREFERENCE)
}

function formatCardQuotaUsage(card: ExternalSubscriptionCard) {
  const progress = getCardQuotaProgress(card)
  if (!progress || !card.status) return '-'
  const used = formatMoney(progress.used, card.status.currency)
  const total = formatMoney(progress.total, card.status.currency)
  return used && total ? `${used} / ${total}` : '-'
}

function cardTemplateLabel(card: ExternalSubscriptionCard) {
  return templateLabel(card.template)
}

const unsubscribeExternalSubscriptionStatuses = externalSubscriptionsAPI.subscribeDisplayStatuses((nextStatuses) => {
  statuses.value = nextStatuses
})

onMounted(() => {
  void refreshAll()
})

onBeforeUnmount(() => {
  unsubscribeExternalSubscriptionStatuses()
})
</script>

<style scoped>
.external-subscriptions-page :deep(.layout-section-scrollable),
.external-subscriptions-page :deep(.table-scroll-container) {
  flex: none;
  min-height: 0;
  height: auto;
  overflow: visible;
}

.external-subscriptions-page :deep(.table-scroll-container) {
  border-color: transparent;
  background: transparent;
  box-shadow: none;
}

.external-subscriptions-page :deep(.table-scroll-container)::before {
  display: none;
}

.external-subscription-card-shell {
  overflow: visible;
  padding: 0.125rem;
}

.external-subscription-card-grid {
  align-items: stretch;
}

.external-subscription-card {
  --home-card-accent: var(--atelier-blue);
  --creepee-card-hover-surface: color-mix(in srgb, var(--atelier-paper-2) 96%, var(--atelier-paper));
  --creepee-home-card-hover-shadow: 0 26px 44px -34px color-mix(in srgb, var(--home-card-accent) 58%, transparent);
  position: relative;
  display: flex;
  min-height: 10.5rem;
  flex-direction: column;
  overflow: hidden;
  border: 1px solid var(--atelier-material-edge);
  border-radius: 8px;
  background: color-mix(in srgb, var(--atelier-paper-2) 96%, var(--atelier-paper));
  box-shadow: none;
  padding: 0.875rem;
  transition:
    transform 280ms var(--atelier-ease),
    background-color 280ms var(--atelier-ease),
    box-shadow 280ms var(--atelier-ease);
}

.external-subscription-card::before {
  content: "";
  position: absolute;
  top: 0;
  right: 0.875rem;
  left: 0.875rem;
  height: 1px;
  background: var(--atelier-console-rule);
  opacity: 1;
  pointer-events: none;
}

.external-subscription-card:hover {
  box-shadow: var(--creepee-home-card-hover-shadow);
  transform: var(--creepee-home-card-hover-transform);
}

.external-subscription-logo {
  display: inline-flex;
  height: 2.25rem;
  width: 2.25rem;
  flex: 0 0 2.25rem;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  border: 1px solid var(--atelier-material-edge);
  border-radius: 8px;
  background: color-mix(in srgb, var(--atelier-paper) 78%, transparent);
}

.external-subscription-logo :deep(.provider-brand-icon) {
  height: 100% !important;
  width: 100% !important;
  border: 0 !important;
  border-radius: inherit !important;
  box-shadow: none !important;
}

.external-subscription-logo :deep(.provider-brand-image-system) {
  height: 1.25rem !important;
  width: 1.25rem !important;
  object-fit: contain !important;
}

.external-subscription-logo :deep(.provider-brand-image-custom) {
  height: 100% !important;
  width: 100% !important;
  object-fit: cover !important;
}

.external-subscription-card-link {
  color: var(--atelier-blue);
}

.external-subscription-card-link:hover {
  color: var(--atelier-blue-dark);
}

.external-subscription-provider-id {
  color: var(--atelier-muted);
  font-size: 0.6875rem;
  line-height: 1rem;
}

.external-subscription-status-line {
  display: flex;
  min-width: 0;
  align-items: center;
  gap: 0.375rem;
  margin-top: 0.1875rem;
}

.external-subscription-status-dot {
  width: 0.375rem;
  height: 0.375rem;
  flex: 0 0 0.375rem;
  border-radius: 999px;
  background: var(--atelier-muted);
}

.external-subscription-status-dot--success {
  background: #10a37f;
}

.external-subscription-status-dot--warning {
  background: #d97706;
}

.external-subscription-status-dot--danger {
  background: #dc2626;
}

.external-subscription-status-dot--neutral {
  background: #6b7280;
}

.external-subscription-status-text {
  color: var(--atelier-muted);
  font-size: 0.6875rem;
  font-weight: 600;
  line-height: 1rem;
}

.external-subscription-template-chip {
  max-width: 9rem;
  border: 1px solid var(--atelier-material-edge);
  border-radius: 999px;
  background: color-mix(in srgb, var(--atelier-paper) 76%, transparent);
  color: var(--atelier-muted);
  font-size: 0.625rem;
  line-height: 1rem;
  padding: 0 0.375rem;
}

.external-subscription-balance-row {
  border-top: 1px solid var(--atelier-material-edge);
  padding-top: 0.7rem;
}

.external-subscription-card-label {
  color: var(--atelier-muted);
  font-size: 0.6875rem;
  font-weight: 600;
  letter-spacing: 0;
}

.external-subscription-balance-value {
  color: var(--atelier-ink);
  font-size: 1.2rem;
  font-weight: 650;
  line-height: 1.55rem;
  margin-top: 0.125rem;
}

.external-subscription-card-facts {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  row-gap: 0.25rem;
}

.external-subscription-fact-value {
  color: var(--atelier-ink-soft);
  font-size: 0.75rem;
  font-weight: 500;
  line-height: 1rem;
  margin-top: 0.125rem;
}

.external-subscription-config-meta {
  display: flex;
  min-width: 0;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.25rem;
  color: color-mix(in srgb, var(--atelier-muted) 88%, transparent);
  font-family: var(--atelier-font-mono);
  font-size: 0.6875rem;
  line-height: 1rem;
}

.external-subscription-config-separator {
  color: color-mix(in srgb, var(--atelier-muted) 58%, transparent);
}

.external-subscription-config-readonly {
  color: var(--atelier-blue);
}

.external-subscription-quota-progress {
  display: grid;
  gap: 0.35rem;
}

.external-subscription-quota-progress-value {
  color: var(--atelier-ink-soft);
  font-size: 0.75rem;
  font-weight: 650;
}

.external-subscription-keyword {
  border: 1px solid var(--atelier-material-edge);
  border-radius: 6px;
  background: color-mix(in srgb, var(--atelier-paper) 76%, transparent);
  color: var(--atelier-muted);
  font-family: var(--atelier-font-mono);
  font-size: 0.6875rem;
  line-height: 1rem;
  padding: 0.125rem 0.375rem;
}

.dark .external-subscription-card {
  --creepee-card-hover-surface: var(--atelier-paper-2);
  background: var(--atelier-paper-2);
  box-shadow: none;
}

.dark .external-subscription-keyword {
  background: color-mix(in srgb, var(--atelier-butter-soft) 28%, transparent);
}

@media (max-width: 1023px) {
  .external-subscription-card-shell {
    overflow: visible;
  }
}
</style>
