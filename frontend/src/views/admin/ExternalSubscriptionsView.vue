<template>
  <AppLayout>
    <div class="space-y-6">
      <section aria-label="Filters">
        <div class="table-filter-shell external-subscriptions-filter-shell flex flex-col gap-3 lg:flex-row lg:items-start">
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
              variant="text-control"
              v-model="schemeFilter"
              :options="schemeFilterOptions"
              class="w-48"
            />
            <Select
              variant="text-control"
              v-model="enabledFilter"
              :options="enabledFilterOptions"
              class="w-36"
            />
          </div>

          <div class="table-filter-actions flex w-full flex-shrink-0 flex-wrap items-center justify-end gap-3 lg:w-auto">
            <!-- 普通按钮 / 标准刷新：调用原refreshAll，SVG旋转/禁用跟随真实请求。 -->
            <RefreshButton data-testid="admin-external-subscriptions-button-refresh-all-true" :label="t('common.refresh')" :loading="loading || statusLoading" @refresh="refreshAll(true)" />
            <button data-testid="admin-external-subscriptions-button-open-create-dialog" type="button" class="btn btn-primary external-subscriptions-create-button" @click="openCreateDialog">
              {{ localText('新增订阅', 'Add Provider') }}
            </button>
          </div>
        </div>
      </section>

      <section aria-label="Subscriptions">
        <div class="external-subscription-card-shell">
          <!-- 加载反馈：首次真实请求显示小型点阵，不用空卡片骨架伪造内容。 -->
          <div v-if="isInitialLoading" class="grid min-h-44 place-items-center" aria-live="polite">
            <LoadingSpinner />
          </div>

          <div
            v-else-if="filteredCards.length > 0"
            class="external-subscription-card-grid"
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
                      <h3 class="break-words text-sm font-semibold text-gray-900 dark:text-white">
                        {{ card.name }}
                      </h3>
                      <div class="external-subscription-status-line">
                        <span :class="cardStatusDotClass(card)" aria-hidden="true"></span>
                        <span class="external-subscription-status-text truncate">
                          {{ cardStatusText(card) }}
                        </span>
                      </div>
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

              <div class="mt-3 flex min-w-0 flex-wrap items-center gap-2">
                <span class="external-subscription-provider-id break-all font-mono">
                  {{ card.id }}
                </span>
                <span class="external-subscription-template-chip break-words">
                  {{ cardSchemeLabel(card) }}
                </span>
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

              <!-- 数字展示 / 展示信息模块：余额和已用按卡片实际宽度并列，长金额完整换行。 -->
              <div class="external-subscription-metrics">
              <div class="external-subscription-balance-row">
                <div class="external-subscription-card-label">{{ localText('余额', 'Balance') }}</div>
                <div
                  class="external-subscription-balance-value font-mono"
                  :title="formatCardBalance(card)"
                >
                  {{ formatCardBalance(card) }}
                </div>
              </div>

              <div v-if="formatStatusUsage(card.status)" class="external-subscription-balance-row">
                <div class="external-subscription-card-label">{{ localText('已用', 'Used') }}</div>
                <div class="external-subscription-balance-value font-mono">
                  {{ formatStatusUsage(card.status) }}
                </div>
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

              <div class="mt-3 flex flex-wrap gap-1">
                <span
                  v-for="keyword in card.matchKeywords"
                  :key="keyword"
                  class="external-subscription-keyword"
                >
                  {{ keyword }}
                </span>
                <span v-if="card.matchKeywords.length === 0" class="text-xs text-gray-500">-</span>
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
      </section>
    </div>

    <BaseDialog
      :show="showDialog"
      :title="editingProvider ? localText('编辑外部订阅', 'Edit External Subscription') : localText('新增外部订阅', 'Add External Subscription')"
      width="wide"
      @close="closeDialog"
    >
      <form id="external-subscription-form" class="space-y-5" @submit.prevent="handleSubmit">
        <div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          <button
            v-for="definition in activeSchemeDefinitions"
            :key="definition.value"
            :data-testid="`admin-external-subscriptions-button-apply-preset-${definition.presetKey || definition.value}`"
            type="button"
            class="rounded-lg border border-gray-200 bg-white px-4 py-3 text-left transition-colors hover:border-gray-400 hover:bg-gray-50 dark:border-dark-600 dark:bg-dark-800 dark:hover:bg-dark-700"
            @click="applySchemePreset(definition.value)"
          >
            <div class="text-sm font-semibold text-gray-900 dark:text-white">{{ definition.label(localText) }}</div>
            <div class="mt-1 text-xs text-gray-500 dark:text-dark-400">
              {{ definition.description?.(localText) }}
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

        <div class="grid gap-4 sm:grid-cols-2">
          <div>
            <label class="input-label">{{ localText('配置方案', 'Configuration Scheme') }}</label>
            <Select v-model="form.scheme" :options="schemeOptions" />
          </div>
          <div class="flex items-center justify-between rounded-lg border border-gray-200 px-3 py-2 dark:border-dark-600">
            <div>
              <div class="text-sm font-medium text-gray-500 dark:text-dark-400">{{ localText('启用', 'Enabled') }}</div>
              <div class="text-xs text-gray-500 dark:text-dark-400">{{ localText('关闭后不进入余额与账号卡片展示', 'Disabled providers are hidden from balance and account cards') }}</div>
            </div>
            <Toggle v-model="form.enabled" />
          </div>
        </div>

        <div class="grid gap-4 sm:grid-cols-2">
          <div>
            <label class="input-label">
              {{ apiTokenLabel }}
              <span v-if="editingProvider?.api_token_configured" class="ml-1 text-xs font-normal text-gray-500">
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
            <p v-if="requiresConsoleToken || isCookieCredential" class="mt-1 text-xs text-gray-500">
              {{ isModelFlareForm
                ? localText('需填写 ModelFlare 浏览器登录 Cookie，并填写 User ID；模型 API Key 不能读取账户额度。', 'Paste the ModelFlare browser login Cookie and User ID. A model API key cannot read account quota.')
                : isA6APIForm
                ? localText('需填写浏览器登录 Cookie（完整 Cookie 请求头值），模型 API Key 不能读取账户额度。', 'Paste the browser login Cookie value. A model API key cannot read account quota.')
                : localText('需使用服务商控制台访问 Token，模型 API Key 不能读取账户额度。', 'Use a console access token. A model API key cannot read account quota.') }}
            </p>
          </div>
          <div v-if="requiresUserId">
            <label class="input-label">{{ userIdLabel }}</label>
            <input data-testid="admin-external-subscriptions-input-form-user-id" v-model="form.user_id" type="text" class="input" :placeholder="userIdPlaceholder" :required="requiresUserId" />
            <p v-if="isA6APIForm || isModelFlareForm || form.scheme === 'packycode_bearer_newapi_user'" class="mt-1 text-xs text-gray-500">
              {{ isModelFlareForm
                ? localText('ModelFlare 会发送 X-ModelFlare-User；请填写浏览器请求中的账号 ID。', 'ModelFlare sends X-ModelFlare-User; use the account ID from the browser request.')
                : localText('该方案会发送 New-API-User；请填写浏览器请求中的用户 ID。', 'This scheme sends New-API-User; use the user ID from the browser request.') }}
            </p>
          </div>
          <div v-if="requiresRefreshToken">
            <label class="input-label">
              Refresh Token
              <span v-if="editingProvider?.refresh_token_configured" class="ml-1 text-xs font-normal text-gray-500">
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
          <p class="mt-1 text-xs text-gray-500">
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
import RefreshButton from '@/components/common/RefreshButton.vue'
import LoadingSpinner from '@/components/common/LoadingSpinner.vue'
import { computed, onBeforeUnmount, onMounted, reactive, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import externalSubscriptionsAPI, {
  type ExternalSubscriptionBalanceStrategy,
  type ExternalSubscriptionProvider,
  type ExternalSubscriptionProviderInput,
  type ExternalSubscriptionScheme,
  type ExternalSubscriptionStatus,
  type ExternalSubscriptionTemplate,
} from '@/api/admin/externalSubscriptions'
import AppLayout from '@/components/layout/AppLayout.vue'
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
const schemeFilter = ref<string>('')
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
  scheme: 'pixel_access_token' as ExternalSubscriptionScheme,
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

type ExternalSubscriptionSchemeDefinition = {
  value: ExternalSubscriptionScheme
  template: ExternalSubscriptionTemplate
  balance_strategy: ExternalSubscriptionBalanceStrategy
  presetKey?: string
  providerId?: string
  providerName?: string
  apiBaseUrl?: string
  sortOrder?: number
  keywords?: string[]
  label: (localText: (zh: string, en: string) => string) => string
  description?: (localText: (zh: string, en: string) => string) => string
}

const activeSchemeDefinitions: ExternalSubscriptionSchemeDefinition[] = [
  {
    value: 'pixel_access_token',
    template: 'pixel_access_token',
    balance_strategy: 'pixel_user_quota',
    presetKey: 'pixel-access-token',
    providerId: 'pixel',
    providerName: 'PixelAPI',
    apiBaseUrl: 'https://api.ai-pixel.online',
    sortOrder: 40,
    keywords: ['pixel', 'ai-pixel.online', 'pixelapi.cc'],
    label: localText => localText('Pixel：Access Token', 'Pixel: Access Token'),
    description: localText => localText('Authorization: Bearer → /api/user/self', 'Authorization: Bearer → /api/user/self'),
  },
  {
    value: 'qlhazycoder_bearer_token',
    template: 'newapi_console',
    balance_strategy: 'newapi_subscription',
    presetKey: 'qlhazycoder-bearer-token',
    providerId: 'qlhazycoder',
    providerName: 'QLhazycoder',
    apiBaseUrl: 'https://api.qlhazycoder.top',
    sortOrder: 20,
    keywords: ['qlhazycoder', 'qlhazy'],
    label: localText => localText('QLhazycoder：Bearer 控制台 Token', 'QLhazycoder: Bearer console token'),
    description: localText => localText('Authorization: Bearer → 订阅与余额接口', 'Authorization: Bearer → subscription and balance APIs'),
  },
  {
    value: 'a6api_cookie_newapi_user',
    template: 'newapi_console',
    balance_strategy: 'newapi_user_quota',
    presetKey: 'a6api-cookie-newapi-user',
    providerId: 'a6api',
    providerName: 'A6API',
    apiBaseUrl: 'https://a6api.com',
    sortOrder: 45,
    keywords: ['a6api', 'a6api.com'],
    label: localText => localText('A6API：Cookie + New-API-User', 'A6API: Cookie + New-API-User'),
    description: localText => localText('Cookie + New-API-User → /api/user/self', 'Cookie + New-API-User → /api/user/self'),
  },
  {
    value: 'packycode_bearer_newapi_user',
    template: 'newapi_console',
    balance_strategy: 'newapi_user_quota',
    presetKey: 'packycode-bearer-newapi-user',
    providerId: 'packycode',
    providerName: 'PackyCode',
    apiBaseUrl: 'https://www.packyapi.com',
    sortOrder: 60,
    keywords: ['packycode', 'packyapi.com', 'packy'],
    label: localText => localText('PackyCode：Bearer 控制台 Token + New-API-User', 'PackyCode: Bearer console token + New-API-User'),
    description: localText => localText('Authorization + New-API-User → /api/user/self', 'Authorization + New-API-User → /api/user/self'),
  },
  {
    value: 'modelflare_cookie_user',
    template: 'newapi_console',
    balance_strategy: 'newapi_user_quota',
    presetKey: 'modelflare',
    providerId: 'modelflare',
    providerName: 'ModelFlare',
    apiBaseUrl: 'https://modelflare.dev',
    sortOrder: 65,
    keywords: ['modelflare', 'modelflare.dev'],
    label: localText => localText('ModelFlare：Cookie + X-ModelFlare-User', 'ModelFlare: Cookie + X-ModelFlare-User'),
    description: localText => localText('Cookie + X-ModelFlare-User → /api/user/self', 'Cookie + X-ModelFlare-User → /api/user/self'),
  },
  {
    value: 'openrouter_api_key',
    template: 'openrouter_credits',
    balance_strategy: 'auto',
    presetKey: 'openrouter-api-key',
    providerId: 'openrouter',
    providerName: 'OpenRouter',
    apiBaseUrl: 'https://openrouter.ai',
    sortOrder: 70,
    keywords: ['openrouter', 'openrouter.ai'],
    label: localText => localText('OpenRouter：API Key', 'OpenRouter: API Key'),
    description: localText => localText('Authorization: Bearer → /api/v1/credits', 'Authorization: Bearer → /api/v1/credits'),
  },
  {
    value: 'cloudflare_api_token_account_id',
    template: 'cloudflare_ai_gateway_credits',
    balance_strategy: 'auto',
    presetKey: 'cloudflare-api-token-account-id',
    providerId: 'cloudflare',
    providerName: 'Cloudflare AI Gateway',
    apiBaseUrl: 'https://api.cloudflare.com/client/v4',
    sortOrder: 80,
    keywords: ['cloudflare', 'ai-gateway', 'workers-ai'],
    label: localText => localText('Cloudflare：API Token + Account ID', 'Cloudflare: API Token + Account ID'),
    description: localText => localText('Authorization: Bearer + Account ID → AI Gateway credits', 'Authorization: Bearer + Account ID → AI Gateway credits'),
  },
]

const legacySchemeDefinitions: ExternalSubscriptionSchemeDefinition[] = [
  {
    value: 'newapi_user_quota',
    template: 'newapi_console',
    balance_strategy: 'newapi_user_quota',
    label: localText => localText('兼容旧方案：New API 用户额度', 'Legacy: New API user quota'),
  },
  {
    value: 'newapi_subscription',
    template: 'newapi_console',
    balance_strategy: 'newapi_subscription',
    label: localText => localText('旧方案：控制台凭据 → /api/subscription/self 套餐', 'Legacy: console credential → /api/subscription/self plans'),
  },
  {
    value: 'openrouter_credits',
    template: 'openrouter_credits',
    balance_strategy: 'auto',
    label: localText => localText('兼容旧方案：OpenRouter Credits', 'Legacy: OpenRouter credits'),
  },
  {
    value: 'cloudflare_ai_gateway_credits',
    template: 'cloudflare_ai_gateway_credits',
    balance_strategy: 'auto',
    label: localText => localText('兼容旧方案：Cloudflare AI Gateway Credits', 'Legacy: Cloudflare AI Gateway credits'),
  },
  {
    value: 'active_subscriptions',
    template: 'active_subscriptions',
    balance_strategy: 'active_subscriptions',
    label: localText => localText('旧方案：访问令牌 → 活跃订阅', 'Legacy: access token → active subscriptions'),
  },
  {
    value: 'buzz_balance',
    template: 'buzz_balance',
    balance_strategy: 'auto',
    label: localText => localText('旧方案：Buzz API Token → 账单余额', 'Legacy: Buzz API token → billing balance'),
  },
  {
    value: 'rawchat_subscriptions',
    template: 'rawchat_subscriptions',
    balance_strategy: 'auto',
    label: localText => localText('旧方案：RawChat Token → 用户订阅', 'Legacy: RawChat token → user subscriptions'),
  },
  {
    value: 'mimo_token_plan',
    template: 'mimo_token_plan',
    balance_strategy: 'auto',
    label: localText => localText('旧方案：MiMo Token → Token Plan', 'Legacy: MiMo token → Token Plan'),
  },
  {
    value: 'openai_billing',
    template: 'newapi_console',
    balance_strategy: 'openai_billing',
    label: localText => localText('旧方案：OpenAI → 账单额度', 'Legacy: OpenAI → billing quota'),
  },
  {
    value: 'auth_me_balance',
    template: 'active_subscriptions',
    balance_strategy: 'auth_me_balance',
    label: localText => localText('旧方案：访问令牌 → /api/v1/auth/me 余额', 'Legacy: access token → /api/v1/auth/me balance'),
  },
  {
    value: 'active_with_auth_me_balance',
    template: 'active_subscriptions',
    balance_strategy: 'active_with_auth_me_balance',
    label: localText => localText('旧方案：活跃订阅，失败回退 /auth/me', 'Legacy: active subscriptions with /auth/me fallback'),
  },
]

function schemeDefinition(scheme: ExternalSubscriptionScheme | string) {
  return [...activeSchemeDefinitions, ...legacySchemeDefinitions].find(item => item.value === scheme)
}

function schemeForPair(template: ExternalSubscriptionTemplate, balanceStrategy: ExternalSubscriptionBalanceStrategy) {
  const activeMatches = activeSchemeDefinitions.filter(item => (
    item.value === 'pixel_access_token' &&
    item.template === template && item.balance_strategy === balanceStrategy
  ))
  if (activeMatches.length === 1) return activeMatches[0].value
  if (activeMatches.length > 1) {
    const legacyMatch = legacySchemeDefinitions.find(item => (
      item.template === template && item.balance_strategy === balanceStrategy
    ))
    if (legacyMatch) return legacyMatch.value
  }
  const match = legacySchemeDefinitions.find(item => (
    item.template === template && item.balance_strategy === balanceStrategy
  ))
  if (match) return match.value
  if (balanceStrategy === 'auto') {
    const fallback = activeSchemeDefinitions.find(item => item.template === template)
      || legacySchemeDefinitions.find(item => item.template === template)
    if (fallback) return fallback.value
  }
  return 'pixel_access_token' as ExternalSubscriptionScheme
}

function schemeForProviderId(providerId: string, template: ExternalSubscriptionTemplate, balanceStrategy: ExternalSubscriptionBalanceStrategy) {
  const definition = activeSchemeDefinitions.find(item => item.providerId === providerId.trim().toLowerCase())
  return definition?.value || schemeForPair(template, balanceStrategy)
}

const schemeOptions = computed(() => {
  const current = editingProvider.value?.scheme || (editingProvider.value
    ? schemeForPair(editingProvider.value.template, editingProvider.value.balance_strategy)
    : '')
  const options = current && !activeSchemeDefinitions.some(item => item.value === current)
    ? [...activeSchemeDefinitions, ...legacySchemeDefinitions.filter(item => item.value === current)]
    : activeSchemeDefinitions
  return options.map(item => ({ value: item.value, label: item.label(localText) }))
})

const requiresPixelAccessToken = computed(() => form.scheme === 'pixel_access_token')
const isA6APIForm = computed(() => form.scheme === 'a6api_cookie_newapi_user')
const isModelFlareForm = computed(() => form.scheme === 'modelflare_cookie_user')
const isCookieCredential = computed(() => isA6APIForm.value || isModelFlareForm.value)
const requiresUserId = computed(() => (
  form.scheme === 'a6api_cookie_newapi_user' ||
  form.scheme === 'packycode_bearer_newapi_user' ||
  form.scheme === 'modelflare_cookie_user' ||
  form.scheme === 'cloudflare_api_token_account_id' ||
  form.scheme === 'newapi_subscription' ||
  form.scheme === 'newapi_user_quota' ||
  form.scheme === 'cloudflare_ai_gateway_credits'
))
const requiresRefreshToken = computed(() => form.scheme === 'active_subscriptions' && !requiresPixelAccessToken.value)

const userIdLabel = computed(() => (
  form.scheme === 'cloudflare_api_token_account_id'
    ? 'Account ID'
    : form.scheme === 'modelflare_cookie_user'
      ? localText('ModelFlare User ID', 'ModelFlare User ID')
      : form.scheme === 'a6api_cookie_newapi_user' || form.scheme === 'packycode_bearer_newapi_user'
        ? 'New-API-User'
    : localText('用户 ID', 'User ID')
))

const userIdPlaceholder = computed(() => (
  form.scheme === 'cloudflare_api_token_account_id'
    ? 'Cloudflare account id'
    : form.scheme === 'modelflare_cookie_user' ? 'ModelFlare user id' : '707'
))

const apiTokenPlaceholder = computed(() => {
  if (requiresPixelAccessToken.value) return 'Pixel Access Token'
  if (isCookieCredential.value) return localText('浏览器登录 Cookie', 'Browser login Cookie')
  if (requiresConsoleToken.value) return localText('控制台访问 Token', 'Console access token')
  if (form.scheme === 'openrouter_api_key') return 'sk-or-...'
  if (form.scheme === 'cloudflare_api_token_account_id') return 'Cloudflare API Token'
  return 'sk-...'
})

const requiresConsoleToken = computed(() => (
  form.scheme === 'qlhazycoder_bearer_token' ||
  form.scheme === 'packycode_bearer_newapi_user' ||
  form.scheme === 'newapi_user_quota' ||
  form.scheme === 'newapi_subscription'
))

const apiTokenLabel = computed(() => (
  requiresPixelAccessToken.value ? localText('访问令牌', 'Access Token') : (isA6APIForm.value || isModelFlareForm.value)
    ? localText('登录 Cookie', 'Login Cookie')
    : requiresConsoleToken.value ? localText('控制台访问 Token', 'Console Access Token')
      : form.scheme === 'openrouter_api_key' ? 'API Key'
      : form.scheme === 'cloudflare_api_token_account_id' ? 'API Token'
      : 'API Token'
))

const schemeFilterOptions = computed(() => [
  { value: '', label: localText('全部方案', 'All Schemes') },
  ...activeSchemeDefinitions.map(item => ({ value: item.value, label: item.label(localText) })),
])

const enabledFilterOptions = computed(() => [
  { value: '', label: localText('全部状态', 'All Status') },
  { value: 'enabled', label: localText('启用', 'Enabled') },
  { value: 'disabled', label: localText('停用', 'Disabled') },
])

type ExternalSubscriptionCard = {
  id: string
  name: string
  scheme: ExternalSubscriptionScheme
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
    if (schemeFilter.value && card.scheme !== schemeFilter.value) return false
    if (enabledFilter.value === 'enabled' && !card.enabled) return false
    if (enabledFilter.value === 'disabled' && card.enabled) return false
    if (!query) return true
    const haystack = [
      card.id,
      card.name,
      card.scheme,
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

function schemeLabel(scheme: ExternalSubscriptionScheme) {
  return schemeDefinition(scheme)?.label(localText) || localText('自定义外部订阅方案', 'Custom external subscription scheme')
}

function buildStatusCard(
  status: ExternalSubscriptionStatus,
  provider?: ExternalSubscriptionProvider,
): ExternalSubscriptionCard {
  const id = status.provider.trim().toLowerCase()
  return {
    id,
    name: provider?.name || status.name || id,
    scheme: provider?.scheme || status.scheme || schemeForProviderId(id, status.template, status.balance_strategy),
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
    scheme: provider.scheme || schemeForProviderId(provider.id, provider.template, provider.balance_strategy),
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
  form.scheme = 'pixel_access_token'
  form.api_base_url = ''
  form.logo_url = ''
  form.api_token = ''
  form.user_id = ''
  form.refresh_token = ''
  form.match_keywords = []
  form.sort_order = 50
  keywordsDraft.value = ''
}

function applySchemePreset(scheme: ExternalSubscriptionScheme) {
  form.scheme = scheme
  const definition = activeSchemeDefinitions.find(item => item.value === scheme)
  if (!definition) return
  form.id = definition.providerId || ''
  form.name = definition.providerName || ''
  form.api_base_url = definition.apiBaseUrl || ''
  form.logo_url = ''
  form.user_id = ''
  form.refresh_token = ''
  form.sort_order = definition.sortOrder ?? 50
  keywordsDraft.value = (definition.keywords || []).join('\n')
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
  form.scheme = provider.scheme || schemeForPair(provider.template, provider.balance_strategy)
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
    scheme: form.scheme,
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
  if (card.template === 'pixel_access_token') return card.apiTokenConfigured ? 'Access Token ready' : localText('访问令牌未配置', 'Access Token missing')
  if (card.scheme === 'a6api_cookie_newapi_user' || card.scheme === 'modelflare_cookie_user') return card.apiTokenConfigured ? localText('登录 Cookie 已配置', 'Browser Cookie ready') : localText('登录 Cookie 未配置', 'Browser Cookie missing')
  if (card.scheme === 'openrouter_api_key') return card.apiTokenConfigured ? 'API Key ready' : localText('API Key 未配置', 'API Key missing')
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
  if (status.balance_strategy === 'openai_billing') return localText('额度待授权', 'Quota authorization required')
  const unknown = localText('余额未知', 'Balance unknown')
  if (total) return `${unknown} / ${total}`
  return unknown
}

function formatStatusUsage(status?: ExternalSubscriptionStatus) {
  return formatMoney(status?.used_usd, status?.currency)
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

function cardSchemeLabel(card: ExternalSubscriptionCard) {
  return schemeLabel(card.scheme)
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
// 顶栏 / 普通按钮 / 默认弧边按钮：调用现有业务入口；加载时阻止重复触发。
</script>

<style scoped>
.external-subscription-card { @apply card flex min-w-0 flex-col p-4; }
/* 展示卡片：每列260px起按实际正文分配，卡片自适应内容高度，不拉伸到邻卡高度。 */
.external-subscription-card-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(min(100%, 260px), 1fr)); align-items: start; gap: 12px; }
.external-subscription-metrics { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; margin-top: 12px; }
.external-subscription-balance-value { overflow-wrap: anywhere; font-size: 20px; line-height: 26px; }
.external-subscription-card h3 { overflow-wrap: anywhere; }
@container kreepai-content (max-width: 360px) { .external-subscription-metrics { grid-template-columns: minmax(0, 1fr); } }
.external-subscription-logo { @apply inline-flex h-9 w-9 shrink-0 items-center justify-center; }
.external-subscription-status-line { @apply mt-1 flex items-center gap-1.5; }
.external-subscription-status-dot { @apply h-1.5 w-1.5 shrink-0 rounded-full bg-gray-400; }
.external-subscription-status-dot--success { @apply bg-green-500; }
.external-subscription-status-dot--warning { @apply bg-amber-500; }
.external-subscription-status-dot--danger { @apply bg-red-500; }
.external-subscription-status-text, .external-subscription-provider-id, .external-subscription-card-label { @apply text-xs text-gray-500 dark:text-dark-400; }
.external-subscription-template-chip, .external-subscription-keyword { @apply inline-flex rounded-md bg-gray-100 px-1.5 py-0.5 text-xs text-gray-600 dark:bg-dark-700 dark:text-dark-300; }
.external-subscription-card-link { @apply text-primary-600 hover:underline dark:text-primary-400; }
.external-subscription-balance-row { @apply border-t border-gray-100 pt-2 dark:border-dark-700; }
.external-subscription-balance-value { @apply mt-1 text-lg font-semibold text-gray-900 dark:text-white; }
.external-subscription-fact-value { @apply text-xs text-gray-700 dark:text-dark-300; }
.external-subscription-config-meta { @apply flex flex-wrap items-center gap-1 font-mono text-xs text-gray-500 dark:text-dark-400; }
.external-subscription-config-readonly { @apply text-primary-600 dark:text-primary-400; }
.external-subscription-quota-progress-value { @apply text-xs text-gray-600 dark:text-dark-300; }
</style>
