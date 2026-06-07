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
        <DataTable
          :columns="columns"
          :data="filteredProviders"
          :loading="loading"
          row-key="id"
          default-sort-key="sort_order"
          default-sort-order="asc"
        >
          <template #cell-name="{ row }">
            <div class="min-w-0">
              <div class="flex items-center gap-2">
                <span class="font-medium text-gray-900 dark:text-white">{{ row.name }}</span>
                <span
                  :class="[
                    'semantic-badge',
                    row.enabled ? 'semantic-badge--success' : 'semantic-badge--neutral'
                  ]"
                >
                  {{ row.enabled ? localText('启用', 'Enabled') : localText('停用', 'Disabled') }}
                </span>
              </div>
              <div class="mt-1 font-mono text-xs text-gray-400">{{ row.id }}</div>
              <a
                class="mt-1 block max-w-64 truncate text-xs text-primary-600 hover:text-primary-700 dark:text-primary-300"
                :href="row.api_base_url"
                target="_blank"
                rel="noopener noreferrer"
              >
                {{ row.api_base_url }}
              </a>
            </div>
          </template>

          <template #cell-template="{ row }">
            <div class="space-y-1">
              <span class="semantic-badge semantic-badge--info">
                {{ templateLabel(row.template) }}
              </span>
              <div
                v-if="row.template === 'newapi_console' && row.user_id"
                class="font-mono text-xs text-gray-400"
              >
                UID {{ row.user_id }}
              </div>
            </div>
          </template>

          <template #cell-config="{ row }">
            <div class="space-y-1 text-xs">
              <div class="flex items-center gap-2">
                <span :class="row.api_token_configured ? 'text-green-600 dark:text-green-400' : 'text-gray-400'">
                  API Token
                </span>
                <Icon :name="row.api_token_configured ? 'check' : 'x'" size="xs" />
              </div>
              <div class="flex items-center gap-2">
                <span :class="row.refresh_token_configured ? 'text-green-600 dark:text-green-400' : 'text-gray-400'">
                  Refresh Token
                </span>
                <Icon :name="row.refresh_token_configured ? 'check' : 'x'" size="xs" />
              </div>
            </div>
          </template>

          <template #cell-balance="{ row }">
            <div class="text-sm text-gray-700 dark:text-gray-200">
              {{ formatStatusBalance(statusMap[row.id]) }}
            </div>
          </template>

          <template #cell-expires_at="{ row }">
            <div class="text-sm text-gray-600 dark:text-gray-300">
              {{ formatStatusExpiry(statusMap[row.id]) }}
            </div>
          </template>

          <template #cell-match_keywords="{ row }">
            <div class="flex max-w-72 flex-wrap gap-1">
              <span
                v-for="keyword in row.match_keywords"
                :key="keyword"
                class="rounded-md bg-gray-100 px-2 py-0.5 font-mono text-[11px] text-gray-600 dark:bg-dark-700 dark:text-dark-300"
              >
                {{ keyword }}
              </span>
              <span v-if="row.match_keywords.length === 0" class="text-sm text-gray-400">-</span>
            </div>
          </template>

          <template #cell-actions="{ row }">
            <div class="flex items-center gap-1">
              <button
                type="button"
                class="flex flex-col items-center gap-0.5 rounded-lg p-1.5 text-gray-500 transition-colors hover:bg-gray-100 hover:text-primary-600 dark:hover:bg-dark-700 dark:hover:text-primary-400"
                @click="openEditDialog(row)"
              >
                <Icon name="edit" size="sm" />
                <span class="text-xs">{{ t('common.edit') }}</span>
              </button>
              <button
                type="button"
                class="flex flex-col items-center gap-0.5 rounded-lg p-1.5 text-gray-500 transition-colors hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20 dark:hover:text-red-400"
                @click="openDeleteDialog(row)"
              >
                <Icon name="trash" size="sm" />
                <span class="text-xs">{{ t('common.delete') }}</span>
              </button>
            </div>
          </template>

          <template #empty>
            <EmptyState
              :title="localText('暂无外部订阅', 'No External Subscriptions')"
              :description="localText('新增一个 provider 后，它会进入右上角余额和匹配账号卡片。', 'Add a provider to show it in the header balance and matching account cards.')"
              :action-text="localText('新增订阅', 'Add Provider')"
              @action="openCreateDialog"
            />
          </template>
        </DataTable>
      </template>
    </TablePageLayout>

    <BaseDialog
      :show="showDialog"
      :title="editingProvider ? localText('编辑外部订阅', 'Edit External Subscription') : localText('新增外部订阅', 'Add External Subscription')"
      width="wide"
      @close="closeDialog"
    >
      <form id="external-subscription-form" class="space-y-5" @submit.prevent="handleSubmit">
        <div class="grid gap-3 sm:grid-cols-2">
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
              :placeholder="editingProvider?.api_token_configured ? localText('留空保持原 Token', 'leave blank to keep') : 'sk-...'"
            />
          </div>
          <div v-if="form.template === 'newapi_console'">
            <label class="input-label">{{ localText('用户 ID', 'User ID') }}</label>
            <input v-model="form.user_id" type="text" class="input" placeholder="707" />
          </div>
          <div v-else>
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
import type { Column } from '@/components/common/types'
import AppLayout from '@/components/layout/AppLayout.vue'
import TablePageLayout from '@/components/layout/TablePageLayout.vue'
import DataTable from '@/components/common/DataTable.vue'
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

const columns = computed<Column[]>(() => [
  { key: 'name', label: localText('名称', 'Name'), sortable: true },
  { key: 'template', label: localText('模板', 'Template'), sortable: true },
  { key: 'config', label: localText('配置', 'Config') },
  { key: 'balance', label: localText('余额', 'Balance') },
  { key: 'expires_at', label: localText('订阅期限', 'Expiry') },
  { key: 'match_keywords', label: localText('匹配关键字', 'Keywords') },
  { key: 'sort_order', label: localText('排序', 'Sort'), sortable: true },
  { key: 'actions', label: localText('操作', 'Actions') },
])

const templateOptions = computed(() => [
  { value: 'newapi_console', label: 'NewAPI Console' },
  { value: 'active_subscriptions', label: 'Active Subscriptions' },
])

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
  return template === 'active_subscriptions' ? 'Active Subscriptions' : 'NewAPI Console'
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
  } else {
    if (!form.api_base_url) form.api_base_url = 'https://example.com'
    if (!form.name) form.name = 'Active Subscription'
    if (!form.id) form.id = 'active-provider'
    if (!keywordsDraft.value.trim()) keywordsDraft.value = 'example.com\nactive-provider'
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
    user_id: form.user_id.trim(),
    refresh_token: form.refresh_token.trim(),
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
