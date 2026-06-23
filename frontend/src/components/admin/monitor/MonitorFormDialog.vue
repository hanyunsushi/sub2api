<template>
  <BaseDialog
    :show="show"
    :title="editing ? t('admin.channelMonitor.editTitle') : t('admin.channelMonitor.createTitle')"
    width="wide"
    @close="$emit('close')"
  >
    <form id="channel-monitor-form" @submit.prevent="handleSubmit" class="space-y-5">
      <div>
        <label class="input-label">{{ t('admin.channelMonitor.form.name') }} <span class="text-red-500">*</span></label>
        <input v-model="form.name" type="text" required class="input" data-testid="monitor-form-name" :placeholder="t('admin.channelMonitor.form.namePlaceholder')" />
      </div>

      <div>
        <label class="input-label">{{ t('admin.channelMonitor.form.provider') }} <span class="text-red-500">*</span></label>
        <div class="grid grid-cols-3 gap-3">
          <button data-testid="admin-monitor-monitor-form-button-provider-opt-value"
            v-for="opt in providerOptions"
            :key="opt.value"
            type="button"
            :aria-pressed="form.provider === opt.value"
            class="flex items-center justify-center gap-2 rounded-lg border-2 px-3 py-2.5 text-sm font-medium transition-colors"
            :class="providerPickerClass(opt.value, form.provider === opt.value)"
            @click="form.provider = opt.value"
          >
            <ProviderBrandIcon :provider="opt.value" :model="form.primary_model || opt.value" :logo-url="form.logo_url" />
            <span>{{ opt.label }}</span>
          </button>
        </div>
      </div>

      <LogoPicker
        v-model="form.logo_url"
        :label="t('admin.channelMonitor.form.logo')"
        :hint="t('admin.channelMonitor.form.logoHint')"
        input-test-id="channel-monitor-logo-url"
      />

      <div v-if="form.provider === PROVIDER_OPENAI" class="rounded-lg border border-blue-100 bg-blue-50/50 p-3 dark:border-blue-500/20 dark:bg-blue-500/10">
        <label class="input-label">{{ t('admin.channelMonitor.form.apiMode') }}</label>
        <div class="grid gap-3 sm:grid-cols-2">
          <button data-testid="admin-monitor-monitor-form-button-api-mode-opt-value"
            v-for="opt in apiModeOptions"
            :key="opt.value"
            type="button"
            :aria-pressed="form.api_mode === opt.value"
            class="rounded-lg border-2 px-3 py-2 text-left transition-colors"
            :class="apiModeButtonClass(opt.value)"
            @click="form.api_mode = opt.value"
          >
            <span class="block text-sm font-semibold">{{ opt.label }}</span>
            <span class="mt-0.5 block text-xs opacity-80">{{ opt.hint }}</span>
          </button>
        </div>
      </div>

      <div>
        <label class="input-label">{{ t('admin.channelMonitor.form.endpoint') }} <span class="text-red-500">*</span></label>
        <div class="flex gap-2">
          <input v-model="form.endpoint" type="text" required class="input flex-1" data-testid="monitor-form-endpoint" :placeholder="t('admin.channelMonitor.form.endpointPlaceholder')" />
          <button type="button" @click="useCurrentDomain" class="btn btn-secondary whitespace-nowrap" data-testid="monitor-form-use-current-domain">
            {{ t('admin.channelMonitor.form.useCurrentDomain') }}
          </button>
        </div>
      </div>

      <div>
        <label class="input-label">
          {{ t('admin.channelMonitor.form.apiKey') }}<span v-if="!editing" class="text-red-500"> *</span>
        </label>
        <div class="flex gap-2">
          <input
            v-model="form.api_key"
            type="password"
            :required="!editing"
            class="input flex-1"
            data-testid="monitor-form-api-key"
            :placeholder="editing ? t('admin.channelMonitor.form.apiKeyEditPlaceholder') : t('admin.channelMonitor.form.apiKeyPlaceholder')"
          />
          <button type="button" @click="openMyKeyPicker" class="btn btn-secondary whitespace-nowrap" data-testid="monitor-form-use-my-key">
            {{ t('admin.channelMonitor.form.useMyKey') }}
          </button>
        </div>
        <p v-if="editing && editing.api_key_masked" class="mt-1 text-xs text-gray-400">{{ editing.api_key_masked }}</p>
      </div>

      <div>
        <label class="input-label">{{ t('admin.channelMonitor.form.primaryModel') }} <span class="text-red-500">*</span></label>
        <input data-testid="admin-monitor-monitor-form-input-form-primary-model"
          v-model="form.primary_model"
          type="text"
          required
          class="input font-medium"
          :class="getPlatformTextClass(form.provider)"
          :placeholder="t('admin.channelMonitor.form.primaryModelPlaceholder')"
        />
      </div>

      <div>
        <label class="input-label">{{ t('admin.channelMonitor.form.extraModels') }}</label>
        <ModelTagInput
          :models="form.extra_models"
          :platform="form.provider"
          :placeholder="t('admin.channelMonitor.form.extraModelsPlaceholder')"
          @update:models="form.extra_models = $event"
        />
      </div>

      <div>
        <label class="input-label">{{ t('admin.channelMonitor.form.groupName') }}</label>
        <input v-model="form.group_name" type="text" class="input" data-testid="monitor-form-group-name" :placeholder="t('admin.channelMonitor.form.groupNamePlaceholder')" />
      </div>

      <div>
        <label class="input-label">{{ t('admin.channelMonitor.form.accountBinding') }}</label>
        <div class="channel-monitor-account-binding-list">
          <button data-testid="admin-monitor-monitor-form-button-clear-account-binding"
            type="button"
            class="channel-monitor-account-binding-option"
            :class="{ 'channel-monitor-account-binding-option--active': form.account_ids.length === 0 }"
            @click="clearAccountBinding"
          >
            {{ t('admin.channelMonitor.form.accountBindingNone') }}
          </button>
          <button data-testid="admin-monitor-monitor-form-button-toggle-account-binding-account-id"
            v-for="account in accountsForBinding"
            :key="account.id"
            type="button"
            class="channel-monitor-account-binding-option"
            :class="{ 'channel-monitor-account-binding-option--active': form.account_ids.includes(account.id) }"
            @click="toggleAccountBinding(account.id)"
          >
            <span class="truncate">{{ account.name }}</span>
            <span class="font-mono text-[11px] opacity-70">#{{ account.id }}</span>
          </button>
        </div>
        <p class="mt-1 text-xs text-gray-400">
          {{ accountsForBindingLoading ? t('admin.channelMonitor.form.accountBindingLoading') : t('admin.channelMonitor.form.accountBindingHint') }}
        </p>
      </div>

      <div>
        <label class="input-label">{{ t('admin.channelMonitor.form.intervalSeconds') }} <span class="text-red-500">*</span></label>
        <input v-model.number="form.interval_seconds" type="number" min="15" max="3600" required class="input" data-testid="monitor-form-interval-seconds" />
        <p class="mt-1 text-xs text-gray-400">{{ t('admin.channelMonitor.form.intervalSecondsHint') }}</p>
      </div>

      <div>
        <label class="input-label">{{ t('admin.channelMonitor.form.jitterSeconds') }}</label>
        <input v-model.number="form.jitter_seconds" type="number" min="0" :max="maxJitterSeconds" class="input" data-testid="monitor-form-jitter-seconds" />
        <p class="mt-1 text-xs text-gray-400">{{ t('admin.channelMonitor.form.jitterSecondsHint') }}</p>
      </div>

      <div class="flex items-center justify-between">
        <label class="input-label mb-0">{{ t('admin.channelMonitor.form.enabled') }}</label>
        <Toggle v-model="form.enabled" />
      </div>

      <!-- 高级设置区：请求模板 + 自定义 headers/body -->
      <details class="rounded-lg border border-gray-200 bg-gray-50/50 p-3 dark:border-dark-700 dark:bg-dark-900/30">
        <summary class="cursor-pointer text-sm font-medium text-gray-700 dark:text-gray-300">
          {{ t('admin.channelMonitor.advanced.section') }}
        </summary>
        <p class="mt-1 text-xs text-gray-400">{{ t('admin.channelMonitor.advanced.sectionHint') }}</p>

        <div class="mt-4 space-y-4">
          <div>
            <label class="input-label">{{ t('admin.channelMonitor.templateField.label') }}</label>
            <Select
              v-model="templateSelectValue"
              :options="templateOptions"
              :placeholder="t('admin.channelMonitor.templateField.placeholder')"
            />
            <p class="mt-1 text-xs text-gray-400">{{ t('admin.channelMonitor.templateField.applyHint') }}</p>
          </div>

          <MonitorAdvancedRequestConfig
            :provider="form.provider"
            :api-mode="form.api_mode"
            :extra-headers="form.extra_headers"
            :body-override-mode="form.body_override_mode"
            :body-override="form.body_override"
            @update:extra-headers="form.extra_headers = $event"
            @update:body-override-mode="form.body_override_mode = $event"
            @update:body-override="form.body_override = $event"
          />
        </div>
      </details>
    </form>

    <template #footer>
      <div class="flex justify-end gap-3">
        <button @click="$emit('close')" type="button" class="btn btn-secondary" data-testid="monitor-form-cancel">
          {{ t('common.cancel') }}
        </button>
        <button
          type="submit"
          form="channel-monitor-form"
          :disabled="submitting"
          class="btn btn-primary"
          data-testid="monitor-form-submit"
        >
          {{ submitting
            ? t('common.submitting')
            : editing ? t('common.update') : t('common.create') }}
        </button>
      </div>
    </template>
  </BaseDialog>

  <MonitorKeyPickerDialog
    :show="showKeyPicker"
    :loading="myKeysLoading"
    :keys="myActiveKeys"
    :provider="form.provider"
    :user-group-rates="userGroupRates"
    @close="showKeyPicker = false"
    @pick="pickMyKey"
  />
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useAppStore } from '@/stores/app'
import { extractApiErrorMessage } from '@/utils/apiError'
import { adminAPI } from '@/api/admin'
import { keysAPI } from '@/api/keys'
import { userGroupsAPI } from '@/api/groups'
import type {
  BodyOverrideMode,
  ChannelMonitor,
  CreateParams,
  APIMode,
  Provider,
  UpdateParams,
} from '@/api/admin/channelMonitor'
import type { ChannelMonitorTemplate } from '@/api/admin/channelMonitorTemplate'
import type { Account, ApiKey } from '@/types'
import BaseDialog from '@/components/common/BaseDialog.vue'
import Toggle from '@/components/common/Toggle.vue'
import Select from '@/components/common/Select.vue'
import ProviderBrandIcon from '@/components/common/ProviderBrandIcon.vue'
import LogoPicker from '@/components/common/LogoPicker.vue'
import ModelTagInput from '@/components/admin/channel/ModelTagInput.vue'
import { getPlatformTextClass } from '@/components/admin/channel/types'
import MonitorKeyPickerDialog from '@/components/admin/monitor/MonitorKeyPickerDialog.vue'
import MonitorAdvancedRequestConfig from '@/components/admin/monitor/MonitorAdvancedRequestConfig.vue'
import { useChannelMonitorFormat } from '@/composables/useChannelMonitorFormat'
import {
  PROVIDER_OPENAI,
  PROVIDER_ANTHROPIC,
  PROVIDER_GEMINI,
  API_MODE_CHAT_COMPLETIONS,
  API_MODE_RESPONSES,
  DEFAULT_INTERVAL_SECONDS,
} from '@/constants/channelMonitor'

const props = defineProps<{
  show: boolean
  monitor: ChannelMonitor | null
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'saved'): void
}>()

const { t } = useI18n()
const appStore = useAppStore()
const { providerPickerClass } = useChannelMonitorFormat()

// System-configured default interval for new monitors. Falls back to the static
// constant when public settings haven't loaded yet or store the legacy 0 value.
const systemDefaultInterval = computed<number>(() => {
  const configured = appStore.cachedPublicSettings?.channel_monitor_default_interval_seconds
  return configured && configured > 0 ? configured : DEFAULT_INTERVAL_SECONDS
})

// editing is true when we have an existing monitor
const editing = computed<ChannelMonitor | null>(() => props.monitor)

const submitting = ref(false)

// API key picker
const showKeyPicker = ref(false)
const myKeysLoading = ref(false)
const myActiveKeys = ref<ApiKey[]>([])
const userGroupRates = ref<Record<number, number>>({})

interface MonitorForm {
  name: string
  logo_url: string
  provider: Provider
  api_mode: APIMode
  endpoint: string
  api_key: string
  primary_model: string
  extra_models: string[]
  group_name: string
  interval_seconds: number
  jitter_seconds: number
  enabled: boolean
  account_ids: number[]
  // 高级设置快照
  template_id: number | null
  extra_headers: Record<string, string>
  body_override_mode: BodyOverrideMode
  body_override: Record<string, unknown> | null
}

const form = reactive<MonitorForm>({
  name: '',
  logo_url: '',
  provider: PROVIDER_ANTHROPIC,
  api_mode: API_MODE_CHAT_COMPLETIONS,
  endpoint: '',
  api_key: '',
  primary_model: '',
  extra_models: [],
  group_name: '',
  interval_seconds: systemDefaultInterval.value,
  jitter_seconds: 0,
  enabled: true,
  account_ids: [],
  template_id: null,
  extra_headers: {},
  body_override_mode: 'off',
  body_override: null,
})

// jitter 上限与后端校验一致：interval - jitter 不得低于最小检测间隔 15 秒。
const maxJitterSeconds = computed<number>(() => Math.max(0, (form.interval_seconds || 0) - 15))

let suppressFormWatchers = false
const accountBindingTouched = ref(false)

// 可用模板列表（进入 dialog 时一次性拉取 cache；按 provider / api mode 过滤）。
const templatesCache = ref<ChannelMonitorTemplate[]>([])
const templatesLoading = ref(false)
const accountsForBinding = ref<Account[]>([])
const accountsForBindingLoading = ref(false)

const templateOptions = computed(() => {
  const items = templatesCache.value.filter((t) => {
    if (t.provider !== form.provider) return false
    if (form.provider !== PROVIDER_OPENAI) return true
    return normalizeAPIMode(t.api_mode) === form.api_mode
  })
  return [
    { value: '', label: t('admin.channelMonitor.templateField.none') },
    ...items.map((t) => ({ value: String(t.id), label: templateOptionLabel(t) })),
  ]
})

async function loadTemplates() {
  if (templatesCache.value.length > 0) return
  templatesLoading.value = true
  try {
    const { items } = await adminAPI.channelMonitorTemplate.list()
    templatesCache.value = items
  } catch (err: unknown) {
    // 模板拉取失败不阻塞监控表单，用户可以不选模板
    console.warn('load monitor templates failed', err)
  } finally {
    templatesLoading.value = false
  }
}

async function loadAccountsForBinding() {
  accountsForBindingLoading.value = true
  try {
    const res = await adminAPI.accounts.list(1, 100, { platform: form.provider })
    accountsForBinding.value = res.items || []
    applyCreateAccountBindingSuggestion()
  } catch (err: unknown) {
    accountsForBinding.value = []
    console.warn('load channel monitor account binding options failed', err)
  } finally {
    accountsForBindingLoading.value = false
  }
}

// 模板下拉绑定：value 是 string（Select 组件约束），需要与 number | null 互转。
const templateSelectValue = computed<string>({
  get: () => (form.template_id == null ? '' : String(form.template_id)),
  set: (raw: string) => {
    if (raw === '') {
      form.template_id = null
      return
    }
    const id = Number(raw)
    if (!Number.isFinite(id)) return
    form.template_id = id
    // 应用模板 = 拷贝快照
    const tpl = templatesCache.value.find((t) => t.id === id)
    if (tpl) {
      suppressFormWatchers = true
      form.api_mode = normalizeAPIMode(tpl.api_mode)
      form.template_id = id
      form.extra_headers = { ...(tpl.extra_headers || {}) }
      form.body_override_mode = tpl.body_override_mode
      form.body_override = tpl.body_override ? { ...tpl.body_override } : null
      suppressFormWatchers = false
    }
  },
})

const apiModeOptions = computed<{ value: APIMode; label: string; hint: string }[]>(() => [
  {
    value: API_MODE_CHAT_COMPLETIONS,
    label: t('admin.channelMonitor.form.apiModeChatCompletions'),
    hint: t('admin.channelMonitor.form.apiModeChatCompletionsHint'),
  },
  {
    value: API_MODE_RESPONSES,
    label: t('admin.channelMonitor.form.apiModeResponses'),
    hint: t('admin.channelMonitor.form.apiModeResponsesHint'),
  },
])

function normalizeAPIMode(mode: APIMode | undefined | null): APIMode {
  return mode === API_MODE_RESPONSES ? API_MODE_RESPONSES : API_MODE_CHAT_COMPLETIONS
}

function normalizeAccountMatchName(name: string | null | undefined): string {
  return (name || '').trim().toLowerCase()
}

function normalizeAccountIDs(ids: number[]): number[] {
  const seen = new Set<number>()
  const out: number[] = []
  for (const id of ids) {
    if (!Number.isFinite(id) || id <= 0 || seen.has(id)) continue
    seen.add(id)
    out.push(id)
  }
  return out
}

function matchingAccountIDsForMonitorName(): number[] {
  const monitorName = normalizeAccountMatchName(form.name)
  if (!monitorName) return []
  return accountsForBinding.value
    .filter(account => normalizeAccountMatchName(account.name) === monitorName)
    .map(account => account.id)
}

function applyCreateAccountBindingSuggestion() {
  if (editing.value || accountBindingTouched.value) return
  form.account_ids = normalizeAccountIDs(matchingAccountIDsForMonitorName())
}

function toggleAccountBinding(id: number) {
  if (!Number.isFinite(id) || id <= 0) return
  accountBindingTouched.value = true
  if (form.account_ids.includes(id)) {
    form.account_ids = form.account_ids.filter(existing => existing !== id)
    return
  }
  form.account_ids = normalizeAccountIDs([...form.account_ids, id])
}

function clearAccountBinding() {
  accountBindingTouched.value = true
  form.account_ids = []
}

function apiModeButtonClass(mode: APIMode): string {
  const active = form.api_mode === mode
  if (active) {
    return 'border-primary-500 bg-white text-primary-700 shadow-sm dark:border-primary-400 dark:bg-primary-500/15 dark:text-primary-300'
  }
  return 'border-blue-100 bg-white/70 text-gray-600 hover:border-primary-300 dark:border-dark-700 dark:bg-dark-800 dark:text-gray-400'
}

function templateOptionLabel(tpl: ChannelMonitorTemplate): string {
  if (tpl.provider !== PROVIDER_OPENAI) return tpl.name
  const labelKey = normalizeAPIMode(tpl.api_mode) === API_MODE_RESPONSES
    ? 'admin.channelMonitor.form.apiModeResponses'
    : 'admin.channelMonitor.form.apiModeChatCompletions'
  return `${tpl.name} · ${t(labelKey)}`
}

function clearRequestSnapshot() {
  form.template_id = null
  form.extra_headers = {}
  form.body_override_mode = 'off'
  form.body_override = null
}

interface ProviderOption {
  value: Provider
  label: string
}

const providerOptions = computed<ProviderOption[]>(() => [
  { value: PROVIDER_ANTHROPIC, label: t('monitorCommon.providers.anthropic') },
  { value: PROVIDER_OPENAI, label: t('monitorCommon.providers.openai') },
  { value: PROVIDER_GEMINI, label: t('monitorCommon.providers.gemini') },
])

// Clear api_key whenever provider changes to avoid cross-provider key mismatch.
// Editing mode loads api_key='' via loadFromMonitor and only sets it on user
// typing, so clearing on provider change is always a safe no-op until the user
// picks a new key.
// 同时清空 template_id（模板有 provider 归属，跨平台不通用）。
watch(() => form.provider, () => {
  if (suppressFormWatchers) return
  form.api_key = ''
  if (form.provider !== PROVIDER_OPENAI) {
    form.api_mode = API_MODE_CHAT_COMPLETIONS
  }
  form.account_ids = []
  accountBindingTouched.value = false
  void loadAccountsForBinding()
  clearRequestSnapshot()
}, { flush: 'sync' })

watch(() => form.api_mode, () => {
  if (suppressFormWatchers) return
  if (form.provider === PROVIDER_OPENAI) {
    clearRequestSnapshot()
  }
}, { flush: 'sync' })

function resetForm() {
  suppressFormWatchers = true
  form.name = ''
  form.logo_url = ''
  form.provider = PROVIDER_ANTHROPIC
  form.api_mode = API_MODE_CHAT_COMPLETIONS
  form.endpoint = ''
  form.api_key = ''
  form.primary_model = ''
  form.extra_models = []
  form.group_name = ''
  form.interval_seconds = systemDefaultInterval.value
  form.jitter_seconds = 0
  form.enabled = true
  form.account_ids = []
  accountBindingTouched.value = false
  form.template_id = null
  form.extra_headers = {}
  form.body_override_mode = 'off'
  form.body_override = null
  suppressFormWatchers = false
}

function loadFromMonitor(m: ChannelMonitor) {
  suppressFormWatchers = true
  form.name = m.name
  form.logo_url = m.logo_url || ''
  form.provider = m.provider
  form.api_mode = normalizeAPIMode(m.api_mode)
  form.endpoint = m.endpoint
  form.api_key = ''
  form.primary_model = m.primary_model
  form.extra_models = [...(m.extra_models || [])]
  form.group_name = m.group_name || ''
  form.interval_seconds = m.interval_seconds || systemDefaultInterval.value
  form.jitter_seconds = m.jitter_seconds || 0
  form.enabled = m.enabled
  form.account_ids = normalizeAccountIDs((m.account_ids && m.account_ids.length > 0) ? m.account_ids : (m.account_id != null ? [m.account_id] : []))
  accountBindingTouched.value = true
  form.template_id = m.template_id ?? null
  form.extra_headers = { ...(m.extra_headers || {}) }
  form.body_override_mode = m.body_override_mode || 'off'
  form.body_override = m.body_override ? { ...m.body_override } : null
  suppressFormWatchers = false
}

// Re-sync form whenever the dialog is opened or the target monitor changes.
// 同时拉取模板列表（cache 过的话一次性返回）。
watch(
  () => [props.show, props.monitor] as const,
  ([show, m]) => {
    if (!show) return
    void loadTemplates()
    if (m) loadFromMonitor(m)
    else resetForm()
    void loadAccountsForBinding()
  },
  { immediate: true },
)

watch(
  () => form.name,
  () => {
    applyCreateAccountBindingSuggestion()
  },
)

function useCurrentDomain() {
  form.endpoint = window.location.origin
}

async function openMyKeyPicker() {
  showKeyPicker.value = true
  if (myActiveKeys.value.length > 0) return
  myKeysLoading.value = true
  try {
    const [res, rates] = await Promise.all([
      keysAPI.list(1, 100, { status: 'active' }),
      userGroupsAPI.getUserGroupRates(),
    ])
    const items = res.items || []
    const now = Date.now()
    myActiveKeys.value = items.filter(k => {
      if (k.status !== 'active') return false
      if (!k.expires_at) return true
      return new Date(k.expires_at).getTime() > now
    })
    userGroupRates.value = rates
  } catch (err: unknown) {
    appStore.showError(extractApiErrorMessage(err, t('admin.channelMonitor.form.noActiveKey')))
  } finally {
    myKeysLoading.value = false
  }
}

function pickMyKey(k: ApiKey) {
  form.api_key = k.key
  showKeyPicker.value = false
}

function buildPayload(): CreateParams {
  const accountIDs = normalizeAccountIDs(form.account_ids)
  const payload: CreateParams = {
    name: form.name.trim(),
    logo_url: form.logo_url.trim(),
    provider: form.provider,
    api_mode: form.provider === PROVIDER_OPENAI ? form.api_mode : API_MODE_CHAT_COMPLETIONS,
    endpoint: form.endpoint.trim(),
    api_key: form.api_key.trim(),
    primary_model: form.primary_model.trim(),
    extra_models: form.extra_models,
    group_name: form.group_name.trim(),
    enabled: form.enabled,
    interval_seconds: form.interval_seconds,
    jitter_seconds: form.jitter_seconds || 0,
    template_id: form.template_id,
    extra_headers: form.extra_headers,
    body_override_mode: form.body_override_mode,
    body_override: form.body_override,
  }
  if (accountIDs.length > 0 || accountBindingTouched.value) {
    payload.account_ids = accountIDs
  }
  return payload
}

async function handleSubmit() {
  if (submitting.value) return
  if (!form.name.trim()) {
    appStore.showError(t('admin.channelMonitor.nameRequired'))
    return
  }
  if (!form.primary_model.trim()) {
    appStore.showError(t('admin.channelMonitor.primaryModelRequired'))
    return
  }

  submitting.value = true
  try {
    const target = editing.value
    if (target) {
      const { api_key, ...rest } = buildPayload()
      const req: UpdateParams = { ...rest }
      // Only send api_key if user typed a new value
      if (api_key) req.api_key = api_key
      // template_id=null 用 clear_template=true 明确告诉后端清空（pointer 语义）
      if (form.template_id == null) {
        req.clear_template = true
        delete req.template_id
      }
      if (form.account_ids.length === 0) {
        req.clear_account = true
        delete req.account_id
        delete req.account_ids
      }
      await adminAPI.channelMonitor.update(target.id, req)
      appStore.showSuccess(t('admin.channelMonitor.updateSuccess'))
    } else {
      await adminAPI.channelMonitor.create(buildPayload())
      appStore.showSuccess(t('admin.channelMonitor.createSuccess'))
    }
    emit('saved')
    emit('close')
  } catch (err: unknown) {
    appStore.showError(extractApiErrorMessage(err, t('common.error')))
  } finally {
    submitting.value = false
  }
}
</script>

<style scoped>
.channel-monitor-account-binding-list {
  display: grid;
  gap: 0.5rem;
  grid-template-columns: repeat(auto-fit, minmax(10rem, 1fr));
}

.channel-monitor-account-binding-option {
  align-items: center;
  background: var(--atelier-ui-surface, #ffffff);
  border: 1px solid var(--atelier-line, rgba(17, 24, 39, 0.12));
  border-radius: 0.5rem;
  color: var(--atelier-muted, #4b5563);
  display: flex;
  gap: 0.5rem;
  justify-content: space-between;
  min-height: 2.5rem;
  min-width: 0;
  padding: 0.5rem 0.75rem;
  text-align: left;
  transition: border-color 0.16s ease, color 0.16s ease, background-color 0.16s ease;
}

.channel-monitor-account-binding-option:hover,
.channel-monitor-account-binding-option--active {
  background: color-mix(in srgb, var(--atelier-terracotta-action, #c96442) 8%, transparent);
  border-color: color-mix(in srgb, var(--atelier-terracotta-action, #c96442) 45%, transparent);
  color: var(--atelier-ink, #141413);
}
</style>
