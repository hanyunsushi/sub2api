<template>
  <AppLayout>
    <TablePageLayout>
      <template #filters>
        <div class="table-filter-shell flex flex-wrap items-center gap-3">
          <div class="table-filter-left flex flex-1 flex-wrap items-center gap-3">
            <div class="table-filter-search flex-1 sm:max-w-72">
              <input
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
            <button
              type="button"
              class="btn btn-secondary"
              :disabled="loading || statusLoading"
              :title="t('common.refresh')"
              @click="refreshAll"
            >
              <Icon name="refresh" size="md" :class="loading || statusLoading ? 'animate-spin' : ''" />
            </button>
            <button type="button" class="btn btn-primary" @click="openCreateDialog">
              <Icon name="plus" size="md" class="mr-2" />
              {{ localText('新增订阅', 'Add Provider') }}
            </button>
          </div>
        </div>
      </template>

      <template #table>
        <div
          v-if="loading"
          class="external-subscription-card-grid grid gap-4 md:grid-cols-2 xl:grid-cols-3"
        >
          <div
            v-for="index in 6"
            :key="index"
            class="external-subscription-card rounded-lg border border-gray-200 bg-white p-4 dark:border-dark-700 dark:bg-dark-900"
          >
            <div class="h-4 w-28 animate-pulse rounded bg-gray-100 dark:bg-dark-700"></div>
            <div class="mt-3 h-3 w-40 animate-pulse rounded bg-gray-100 dark:bg-dark-700"></div>
            <div class="mt-5 h-10 animate-pulse rounded bg-gray-100 dark:bg-dark-700"></div>
          </div>
        </div>

        <div
          v-else-if="filteredProviders.length > 0"
          class="external-subscription-card-grid grid gap-4 md:grid-cols-2 xl:grid-cols-3"
        >
          <article
            v-for="provider in filteredProviders"
            :key="provider.id"
            class="external-subscription-card flex min-h-[13rem] flex-col rounded-lg border border-gray-200 bg-white p-4 shadow-sm transition-colors hover:border-primary-200 dark:border-dark-700 dark:bg-dark-900 dark:hover:border-primary-800"
          >
            <div class="flex items-start justify-between gap-3">
              <div class="min-w-0">
                <div class="flex min-w-0 items-center gap-2">
                  <h3 class="truncate text-sm font-semibold text-gray-900 dark:text-white">
                    {{ provider.name }}
                  </h3>
                  <span
                    :class="[
                      'semantic-badge',
                      provider.enabled ? 'semantic-badge--success' : 'semantic-badge--neutral'
                    ]"
                  >
                    {{ provider.enabled ? localText('启用', 'Enabled') : localText('停用', 'Disabled') }}
                  </span>
                </div>
                <div class="mt-1 font-mono text-xs text-gray-400">
                  {{ provider.id }}
                </div>
              </div>
              <div class="flex flex-shrink-0 items-center gap-1">
                <button
                  type="button"
                  class="btn-ghost btn-icon"
                  :title="t('common.edit')"
                  @click="openEditDialog(provider)"
                >
                  <Icon name="edit" size="sm" />
                </button>
                <button
                  type="button"
                  class="btn-ghost btn-icon text-red-500 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20"
                  :title="t('common.delete')"
                  @click="openDeleteDialog(provider)"
                >
                  <Icon name="trash" size="sm" />
                </button>
              </div>
            </div>

            <a
              class="mt-3 block truncate font-mono text-xs text-primary-600 hover:text-primary-700 dark:text-primary-300"
              :href="provider.api_base_url"
              target="_blank"
              rel="noopener noreferrer"
            >
              {{ provider.api_base_url }}
            </a>

            <div class="mt-4 grid grid-cols-2 gap-3 text-xs">
              <div class="rounded-md bg-gray-50 p-2 dark:bg-dark-800">
                <div class="text-gray-400">{{ localText('模板', 'Template') }}</div>
                <div class="mt-1 truncate font-medium text-gray-700 dark:text-gray-200">
                  {{ templateLabel(provider.template) }}
                </div>
              </div>
              <div class="rounded-md bg-gray-50 p-2 dark:bg-dark-800">
                <div class="text-gray-400">{{ localText('排序', 'Sort') }}</div>
                <div class="mt-1 font-mono font-medium text-gray-700 dark:text-gray-200">
                  {{ provider.sort_order }}
                </div>
              </div>
              <div class="rounded-md bg-gray-50 p-2 dark:bg-dark-800">
                <div class="text-gray-400">{{ localText('余额', 'Balance') }}</div>
                <div class="mt-1 truncate font-medium text-gray-700 dark:text-gray-200">
                  {{ formatStatusBalance(statusMap[provider.id]) }}
                </div>
              </div>
              <div class="rounded-md bg-gray-50 p-2 dark:bg-dark-800">
                <div class="text-gray-400">{{ localText('订阅期限', 'Expiry') }}</div>
                <div class="mt-1 truncate font-medium text-gray-700 dark:text-gray-200">
                  {{ formatStatusExpiry(statusMap[provider.id]) }}
                </div>
              </div>
            </div>

            <div class="mt-4 flex flex-wrap gap-1">
              <span
                :class="provider.api_token_configured ? 'semantic-badge semantic-badge--success' : 'semantic-badge semantic-badge--neutral'"
              >
                API Token
              </span>
              <span
                v-if="provider.template === 'active_subscriptions'"
                :class="provider.refresh_token_configured ? 'semantic-badge semantic-badge--success' : 'semantic-badge semantic-badge--neutral'"
              >
                Refresh Token
              </span>
              <span
                v-if="provider.user_id"
                class="semantic-badge semantic-badge--info"
              >
                {{ provider.template === 'cloudflare_ai_gateway_credits' ? 'Account ID' : 'UID' }}
                {{ provider.user_id }}
              </span>
            </div>

            <div class="mt-auto flex flex-wrap gap-1 pt-4">
              <span
                v-for="keyword in provider.match_keywords"
                :key="keyword"
                class="rounded-md bg-gray-100 px-2 py-0.5 font-mono text-[11px] text-gray-600 dark:bg-dark-700 dark:text-dark-300"
              >
                {{ keyword }}
              </span>
              <span v-if="provider.match_keywords.length === 0" class="text-xs text-gray-400">-</span>
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
      </template>
    </TablePageLayout>

    <BaseDialog
      :show="showDialog"
      :title="editingProvider ? localText('编辑外部订阅', 'Edit External Subscription') : localText('新增外部订阅', 'Add External Subscription')"
      width="wide"
      @close="closeDialog"
    >
      <form id="external-subscription-form" class="space-y-5" @submit.prevent="handleSubmit">
        <div class="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <button
            type="button"
            class="rounded-lg border border-primary-200 bg-primary-50 px-4 py-3 text-left transition-colors hover:border-primary-300 hover:bg-primary-100 dark:border-primary-800 dark:bg-primary-900/20 dark:hover:bg-primary-900/30"
            @click="applyPreset('newapi_console')"
          >
            <div class="text-sm font-semibold text-primary-700 dark:text-primary-300">NewAPI Console</div>
            <div class="mt-1 text-xs text-gray-500 dark:text-gray-400">
              {{ localText('QL、LIUST、PackyCode 这类控制台余额接口', 'For QL, LIUST, PackyCode style console balance APIs') }}
            </div>
          </button>
          <button
            type="button"
            class="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-left transition-colors hover:border-amber-300 hover:bg-amber-100 dark:border-amber-800 dark:bg-amber-900/20 dark:hover:bg-amber-900/30"
            @click="applyPreset('active_subscriptions')"
          >
            <div class="text-sm font-semibold text-amber-700 dark:text-amber-300">Active Subscriptions</div>
            <div class="mt-1 text-xs text-gray-500 dark:text-gray-400">
              {{ localText('TCDMX、XHY、Pixel 这类 /api/v1/subscriptions/active', 'For TCDMX, XHY, Pixel style /api/v1/subscriptions/active APIs') }}
            </div>
          </button>
          <button
            type="button"
            class="rounded-lg border border-sky-200 bg-sky-50 px-4 py-3 text-left transition-colors hover:border-sky-300 hover:bg-sky-100 dark:border-sky-800 dark:bg-sky-900/20 dark:hover:bg-sky-900/30"
            @click="applyPreset('openrouter_credits')"
          >
            <div class="text-sm font-semibold text-sky-700 dark:text-sky-300">OpenRouter Credits</div>
            <div class="mt-1 text-xs text-gray-500 dark:text-gray-400">
              {{ localText('OpenRouter /api/v1/credits 余额接口', 'OpenRouter /api/v1/credits balance API') }}
            </div>
          </button>
          <button
            type="button"
            class="rounded-lg border border-orange-200 bg-orange-50 px-4 py-3 text-left transition-colors hover:border-orange-300 hover:bg-orange-100 dark:border-orange-800 dark:bg-orange-900/20 dark:hover:bg-orange-900/30"
            @click="applyPreset('cloudflare_ai_gateway_credits')"
          >
            <div class="text-sm font-semibold text-orange-700 dark:text-orange-300">Cloudflare AI Gateway</div>
            <div class="mt-1 text-xs text-gray-500 dark:text-gray-400">
              {{ localText('Cloudflare AI Gateway credit-balance', 'Cloudflare AI Gateway credit-balance') }}
            </div>
          </button>
        </div>

        <div class="grid gap-4 sm:grid-cols-2">
          <div>
            <label class="input-label">
              ID <span class="text-red-500">*</span>
            </label>
            <input
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
            <input v-model="form.name" type="text" class="input" required placeholder="PackyCode" />
          </div>
        </div>

        <div class="grid gap-4 sm:grid-cols-[1fr_12rem]">
          <div>
            <label class="input-label">
              API Base URL <span class="text-red-500">*</span>
            </label>
            <input v-model="form.api_base_url" type="url" class="input" required placeholder="https://api.example.com" />
          </div>
          <div>
            <label class="input-label">{{ localText('排序', 'Sort Order') }}</label>
            <input v-model.number="form.sort_order" type="number" class="input" min="0" step="1" />
          </div>
        </div>

        <div class="grid gap-4 sm:grid-cols-2">
          <div>
            <label class="input-label">{{ localText('模板', 'Template') }}</label>
            <Select v-model="form.template" :options="templateOptions" />
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
            <input
              v-model="form.api_token"
              type="password"
              class="input"
              autocomplete="new-password"
              :placeholder="editingProvider?.api_token_configured ? localText('留空保持原 Token', 'leave blank to keep') : apiTokenPlaceholder"
            />
          </div>
          <div v-if="requiresUserId">
            <label class="input-label">{{ userIdLabel }}</label>
            <input v-model="form.user_id" type="text" class="input" :placeholder="userIdPlaceholder" />
          </div>
          <div v-if="requiresRefreshToken">
            <label class="input-label">
              Refresh Token
              <span v-if="editingProvider?.refresh_token_configured" class="ml-1 text-xs font-normal text-gray-400">
                leave blank to keep
              </span>
            </label>
            <input
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
          <textarea
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
          <button type="button" class="btn btn-secondary" @click="closeDialog">
            {{ t('common.cancel') }}
          </button>
          <button type="submit" form="external-subscription-form" class="btn btn-primary" :disabled="submitting">
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
import { computed, onMounted, reactive, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import externalSubscriptionsAPI, {
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
import Select from '@/components/common/Select.vue'
import Toggle from '@/components/common/Toggle.vue'
import Icon from '@/components/icons/Icon.vue'
import { useAppStore } from '@/stores/app'

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
  api_base_url: '',
  api_token: '',
  user_id: '',
  refresh_token: '',
  match_keywords: [] as string[],
  sort_order: 50,
})

const templateOptions = computed(() => [
  { value: 'newapi_console', label: 'NewAPI Console' },
  { value: 'active_subscriptions', label: 'Active Subscriptions' },
  { value: 'openrouter_credits', label: 'OpenRouter Credits' },
  { value: 'cloudflare_ai_gateway_credits', label: 'Cloudflare AI Gateway' },
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
  if (form.template === 'openrouter_credits') return 'sk-or-...'
  if (form.template === 'cloudflare_ai_gateway_credits') return 'Cloudflare API Token'
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

const statusMap = computed<Record<string, ExternalSubscriptionStatus>>(() => refreshStatusMap(statuses.value))

const filteredProviders = computed(() => {
  const query = searchQuery.value.trim().toLowerCase()
  return providers.value.filter((provider) => {
    if (templateFilter.value && provider.template !== templateFilter.value) return false
    if (enabledFilter.value === 'enabled' && !provider.enabled) return false
    if (enabledFilter.value === 'disabled' && provider.enabled) return false
    if (!query) return true
    const haystack = [
      provider.id,
      provider.name,
      provider.template,
      provider.api_base_url,
      provider.user_id,
      ...provider.match_keywords,
    ].join(' ').toLowerCase()
    return haystack.includes(query)
  })
})

function refreshStatusMap(items: ExternalSubscriptionStatus[]) {
  return items.reduce<Record<string, ExternalSubscriptionStatus>>((acc, item) => {
    acc[item.provider] = item
    return acc
  }, {})
}

function templateLabel(template: ExternalSubscriptionTemplate) {
  switch (template) {
    case 'active_subscriptions':
      return 'Active Subscriptions'
    case 'openrouter_credits':
      return 'OpenRouter Credits'
    case 'cloudflare_ai_gateway_credits':
      return 'Cloudflare AI Gateway'
    default:
      return 'NewAPI Console'
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
  form.api_base_url = ''
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
    if (!form.api_base_url) form.api_base_url = 'https://api.example.com'
    if (!form.name) form.name = 'NewAPI'
    if (!form.id) form.id = 'newapi-provider'
    if (!keywordsDraft.value.trim()) keywordsDraft.value = 'newapi\napi.example.com'
    return
  }
  if (template === 'active_subscriptions') {
    if (!form.api_base_url) form.api_base_url = 'https://example.com'
    if (!form.name) form.name = 'Active Subscription'
    if (!form.id) form.id = 'active-provider'
    if (!keywordsDraft.value.trim()) keywordsDraft.value = 'example.com\nactive-provider'
    return
  }
  if (template === 'openrouter_credits') {
    if (!form.api_base_url) form.api_base_url = 'https://openrouter.ai'
    if (!form.name) form.name = 'OpenRouter'
    if (!form.id) form.id = 'openrouter'
    if (form.sort_order === 50) form.sort_order = 70
    if (!keywordsDraft.value.trim()) keywordsDraft.value = 'openrouter\nopenrouter.ai'
    return
  }
  if (template === 'cloudflare_ai_gateway_credits') {
    if (!form.api_base_url) form.api_base_url = 'https://api.cloudflare.com/client/v4'
    if (!form.name) form.name = 'Cloudflare AI Gateway'
    if (!form.id) form.id = 'cloudflare'
    if (form.sort_order === 50) form.sort_order = 80
    if (!keywordsDraft.value.trim()) keywordsDraft.value = 'cloudflare\nai-gateway\nworkers-ai'
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
  form.api_base_url = provider.api_base_url
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
    api_base_url: form.api_base_url.trim(),
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

async function loadStatuses() {
  statusLoading.value = true
  try {
    statuses.value = await externalSubscriptionsAPI.getStatuses()
  } catch (error: any) {
    statuses.value = []
    appStore.showError(error?.message || localText('订阅状态读取失败', 'Failed to load subscription statuses'))
  } finally {
    statusLoading.value = false
  }
}

async function refreshAll() {
  await Promise.all([loadProviders(), loadStatuses()])
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
    await refreshAll()
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
    await refreshAll()
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

function isInvalidToken(code?: string | null) {
  const normalized = (code || '').trim().toUpperCase()
  return normalized === '401' || normalized === 'INVALID_TOKEN' || normalized === 'TOKEN_EXPIRED'
}

function formatStatusBalance(status?: ExternalSubscriptionStatus) {
  if (!status) return '-'
  if (!status.enabled || !status.configured) return localText('未配置', 'Not configured')
  if (status.error_code) return isInvalidToken(status.error_code) ? localText('Token 失效', 'Token invalid') : localText('读取失败', 'Read failed')
  const remaining = formatMoney(status.remaining_usd, status.currency)
  const total = formatMoney(status.total_limit_usd, status.currency)
  if (remaining && total) return `${remaining} / ${total}`
  if (remaining) return remaining
  if (total) return total
  if (status.active_count > 0) return localText(`${status.active_count} 个订阅`, `${status.active_count} subscriptions`)
  return localText('无有效订阅', 'No active subscriptions')
}

function formatStatusExpiry(status?: ExternalSubscriptionStatus) {
  if (!status) return '-'
  if (status.error_code) return isInvalidToken(status.error_code) ? localText('请更新 Token', 'Update token') : (status.error_message || localText('请检查配置', 'Check settings'))
  if (!status.expires_at) return localText('长期', 'Long-term')
  const parsed = new Date(status.expires_at)
  if (Number.isNaN(parsed.getTime())) return localText('长期', 'Long-term')
  return parsed.toISOString().slice(0, 10)
}

onMounted(() => {
  void refreshAll()
})
</script>
