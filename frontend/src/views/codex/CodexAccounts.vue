<template>
  <AppLayout>
    <div class="codex-admin">
      <section class="codex-shell">
        <header class="codex-topbar">
          <div>
            <h1 class="codex-title">{{ t('admin.codex.accounts.title') }}</h1>
            <p class="codex-subtitle">{{ t('admin.codex.accounts.description') }}</p>
          </div>
          <button
            type="button"
            class="codex-button codex-button--primary"
            :disabled="codexStore.loading || !managementKeyDraft.trim()"
            @click="refreshAccounts"
          >
            <Icon name="refresh" size="sm" :class="{ 'animate-spin': codexStore.loading }" />
            {{ t('admin.codex.accounts.refreshQuotaStatus') }}
          </button>
        </header>

        <div class="codex-grid">
          <main class="codex-main">
            <section class="codex-panel">
              <div class="codex-toolbar">
                <label class="codex-field">
                  <span class="codex-label">{{ t('admin.codex.accounts.cpaBaseUrl') }}</span>
                  <input
                    v-model="baseUrlDraft"
                    class="codex-input"
                    type="text"
                    autocomplete="off"
                    :placeholder="DEFAULT_CPA_MANAGEMENT_BASE"
                  />
                </label>
                <label class="codex-field">
                  <span class="codex-label">{{ t('admin.codex.accounts.managementKey') }}</span>
                  <input
                    v-model="managementKeyDraft"
                    class="codex-input"
                    type="password"
                    autocomplete="off"
                    :placeholder="t('admin.codex.accounts.managementKeyPlaceholder')"
                  />
                </label>
                <label class="codex-remember">
                  <input
                    v-model="rememberConnectionDraft"
                    class="codex-checkbox"
                    type="checkbox"
                  />
                  <span>
                    <strong>{{ t('admin.codex.accounts.rememberConnection') }}</strong>
                    <small>{{ t('admin.codex.accounts.rememberConnectionHint') }}</small>
                  </span>
                </label>
                <button
                  type="button"
                  class="codex-button codex-button--primary"
                  :disabled="codexStore.loading"
                  @click="connectAndLoad"
                >
                  <Icon name="key" size="sm" />
                  {{ t('admin.codex.accounts.connect') }}
                </button>
              </div>

              <div class="codex-metrics">
                <div class="codex-metric">
                  <span class="codex-metric-value">{{ codexStore.accounts.length }}</span>
                  <span class="codex-metric-label">{{ t('admin.codex.accounts.metrics.total') }}</span>
                </div>
                <div class="codex-metric">
                  <span class="codex-metric-value">{{ activeCount }}</span>
                  <span class="codex-metric-label">{{ t('admin.codex.accounts.metrics.active') }}</span>
                </div>
                <div class="codex-metric">
                  <span class="codex-metric-value">{{ failedCount }}</span>
                  <span class="codex-metric-label">{{ t('admin.codex.accounts.metrics.failed') }}</span>
                </div>
                <div class="codex-metric">
                  <span class="codex-metric-value">{{ codexStore.orphanMetadata.length }}</span>
                  <span class="codex-metric-label">{{ t('admin.codex.accounts.metrics.orphan') }}</span>
                </div>
              </div>
            </section>

            <section class="codex-panel">
              <div class="codex-panel-header">
                <h2 class="codex-panel-title">{{ t('admin.codex.accounts.accountList') }}</h2>
                <div class="codex-list-actions">
                  <div class="codex-list-actions__primary">
                    <button
                      type="button"
                      class="codex-button codex-button--primary"
                      :disabled="codexStore.loading || !managementKeyDraft.trim()"
                      @click="refreshAccounts"
                    >
                      <Icon name="refresh" size="sm" :class="{ 'animate-spin': codexStore.loading }" />
                      {{ t('admin.codex.accounts.refreshQuotaStatus') }}
                    </button>
                    <input
                      ref="authFileInput"
                      class="sr-only"
                      type="file"
                      accept="application/json,.json"
                      @change="handleAuthFileChange"
                    />
                    <button
                      type="button"
                      class="codex-button"
                      :disabled="uploadingAuthFile || !managementKeyDraft.trim()"
                      @click="openAuthFilePicker"
                    >
                      <Icon name="upload" size="sm" />
                      {{
                        uploadingAuthFile
                          ? t('admin.codex.accounts.uploadingAuthFile')
                          : t('admin.codex.accounts.uploadAuthFile')
                      }}
                    </button>
                    <button
                      type="button"
                      class="codex-button"
                      :disabled="oauthLoading || !managementKeyDraft.trim()"
                      @click="openCodexOAuth"
                    >
                      <Icon name="externalLink" size="sm" />
                      {{ oauthLoading ? t('admin.codex.accounts.openingOAuth') : t('admin.codex.accounts.codexOAuth') }}
                    </button>
                  </div>
                  <div class="codex-list-actions__filters">
                    <input
                      v-model="searchQuery"
                      class="codex-input !min-h-9 !w-56"
                      type="search"
                      :placeholder="t('admin.codex.accounts.search')"
                    />
                    <select v-model="statusFilter" class="codex-select !min-h-9 !w-36">
                      <option v-for="option in statusOptions" :key="option.value" :value="option.value">
                        {{ option.label }}
                      </option>
                    </select>
                  </div>
                </div>
              </div>

              <div v-if="codexStore.error" class="codex-error">
                {{ codexStore.error }}
              </div>
              <div v-else-if="!codexStore.loading && filteredAccounts.length === 0" class="codex-empty">
                {{ t('admin.codex.accounts.empty') }}
              </div>
              <div v-else class="codex-account-grid">
                <article
                  v-for="account in filteredAccounts"
                  :key="account.key"
                  class="codex-account-card"
                  :class="{ 'is-selected': account.name === selectedAuthName }"
                  @click="selectAccount(account.name)"
                >
                  <div class="codex-account-card__top">
                    <div class="min-w-0">
                      <div class="codex-account-name">{{ accountCardTitle(account) }}</div>
                    </div>
                    <div class="codex-account-actions">
                      <span
                        class="codex-status-light"
                        :class="`codex-status-light--${account.status}`"
                        :title="account.statusMessage || statusLabel(account.status)"
                        :aria-label="statusLabel(account.status)"
                      ></span>
                      <button
                        type="button"
                        class="codex-icon-button codex-icon-button--tight"
                        :class="{ 'codex-icon-button--success': account.status === 'disabled' }"
                        :disabled="!account.canToggleDisabled || togglingAuthName === account.name"
                        :title="toggleDisabledTitle(account)"
                        :aria-label="toggleDisabledTitle(account)"
                        @click.stop="toggleAccountDisabled(account)"
                      >
                        <Icon
                          :name="account.status === 'disabled' ? 'play' : 'ban'"
                          size="xs"
                        />
                      </button>
                      <button
                        type="button"
                        class="codex-icon-button codex-icon-button--tight codex-icon-button--danger"
                        :disabled="!account.canDelete || deletingAuthName === account.name"
                        :title="account.canDelete ? t('admin.codex.accounts.deleteAuthFile') : t('admin.codex.accounts.deleteDisabled')"
                        :aria-label="account.canDelete
                          ? t('admin.codex.accounts.deleteAuthFileNamed', { name: account.name })
                          : t('admin.codex.accounts.deleteDisabled')"
                        @click.stop="requestDeleteAccount(account.name)"
                      >
                        <Icon name="trash" size="xs" />
                      </button>
                    </div>
                  </div>

                  <div class="codex-account-card__body">
                    <div class="codex-account-card__row">
                      <span class="codex-account-card__label">{{ t('admin.codex.accounts.columns.balance') }}</span>
                      <span class="codex-balance-value">{{ accountBalanceLabel(account) }}</span>
                    </div>
                    <div class="codex-account-card__row">
                      <span class="codex-account-card__label">{{ t('admin.codex.accounts.columns.group') }}</span>
                      <span v-if="account.group" class="codex-group-chip">
                        <span class="codex-group-swatch" :style="{ '--group-color': account.group.color }"></span>
                        <span class="codex-group-chip__name">{{ account.group.name }}</span>
                      </span>
                      <span v-else class="codex-account-card__value text-[var(--codex-muted)]">
                        {{ t('admin.codex.accounts.noGroup') }}
                      </span>
                    </div>
                    <div class="codex-account-card__row">
                      <span class="codex-account-card__label">{{ t('admin.codex.accounts.columns.modifiedAt') }}</span>
                      <span class="codex-account-card__value">
                        {{ account.modifiedAt ? formatDate(account.modifiedAt) : '-' }}
                      </span>
                    </div>
                  </div>

                  <div
                    class="codex-quota-progress"
                    :class="quotaProgressClass(account)"
                    :title="quotaProgressLabel(account)"
                    :aria-label="quotaProgressLabel(account)"
                  >
                    <span
                      class="codex-quota-progress__bar"
                      :style="{ width: `${quotaProgressPercent(account)}%` }"
                    ></span>
                  </div>

                </article>
              </div>
              <div v-if="operationError" class="codex-error codex-error--compact">
                {{ operationError }}
              </div>
              <div v-if="oauthFallbackUrl" class="codex-inline-action">
                <span>{{ t('admin.codex.accounts.popupBlocked') }}</span>
                <a class="codex-link-button" :href="oauthFallbackUrl" target="_blank" rel="noopener noreferrer">
                  {{ t('admin.codex.accounts.openOAuthLink') }}
                </a>
              </div>
              <div v-if="operationNotice" class="codex-notice">
                {{ operationNotice }}
              </div>
            </section>
          </main>

          <aside class="codex-side">
            <section class="codex-panel">
              <div class="codex-panel-header">
                <h2 class="codex-panel-title">{{ t('admin.codex.accounts.metadataEditor') }}</h2>
              </div>

              <form v-if="selectedAccount" class="codex-detail-form" @submit.prevent="saveMetadata">
                <label class="codex-field">
                  <span class="codex-label">{{ t('admin.codex.accounts.displayName') }}</span>
                  <input v-model="metadataDraft.displayName" class="codex-input" type="text" />
                </label>
                <label class="codex-field">
                  <span class="codex-label">{{ t('admin.codex.accounts.group') }}</span>
                  <select v-model="metadataDraft.groupId" class="codex-select">
                    <option value="">{{ t('admin.codex.accounts.noGroup') }}</option>
                    <option v-for="group in codexStore.groups" :key="group.id" :value="String(group.id)">
                      {{ group.name }}
                    </option>
                  </select>
                </label>
                <label class="codex-field">
                  <span class="codex-label">{{ t('admin.codex.accounts.tags') }}</span>
                  <input
                    v-model="metadataDraft.tags"
                    class="codex-input"
                    type="text"
                    :placeholder="t('admin.codex.accounts.tagsPlaceholder')"
                  />
                </label>
                <label class="codex-field">
                  <span class="codex-label">{{ t('admin.codex.accounts.sortOrder') }}</span>
                  <input v-model.number="metadataDraft.sortOrder" class="codex-input" type="number" />
                </label>
                <label class="codex-field">
                  <span class="codex-label">{{ t('admin.codex.accounts.note') }}</span>
                  <textarea v-model="metadataDraft.note" class="codex-textarea"></textarea>
                </label>
                <button type="submit" class="codex-button codex-button--primary" :disabled="savingMetadata">
                  <Icon name="database" size="sm" />
                  {{ savingMetadata ? t('common.saving') : t('common.save') }}
                </button>
              </form>

              <div v-else class="codex-empty">
                {{ t('admin.codex.accounts.selectAccount') }}
              </div>
            </section>

            <section class="codex-panel">
              <div class="codex-panel-header">
                <h2 class="codex-panel-title">{{ t('admin.codex.accounts.groups') }}</h2>
              </div>
              <form class="codex-detail-form" @submit.prevent="createGroup">
                <label class="codex-field">
                  <span class="codex-label">{{ t('admin.codex.accounts.newGroup') }}</span>
                  <input v-model="newGroupName" class="codex-input" type="text" />
                </label>
                <button type="submit" class="codex-button" :disabled="creatingGroup || !newGroupName.trim()">
                  <Icon name="plus" size="sm" />
                  {{ t('admin.codex.accounts.createGroup') }}
                </button>
              </form>
              <div v-for="group in codexStore.groups" :key="group.id" class="codex-group-row">
                <div class="codex-group-row__head">
                  <span class="codex-group-chip">
                    <span class="codex-group-swatch" :style="{ '--group-color': group.color }"></span>
                    {{ group.name }}
                  </span>
                  <span class="font-mono text-xs text-[var(--codex-muted)]">#{{ group.id }}</span>
                </div>
                <div class="codex-group-key-tools">
                  <select
                    v-model="selectedSub2GroupByCodexGroup[group.id]"
                    class="codex-select !min-h-9"
                    :aria-label="t('admin.codex.accounts.sub2GroupForKey')"
                  >
                    <option value="">{{ t('admin.codex.accounts.selectSub2Group') }}</option>
                    <option v-for="nativeGroup in nativeGroups" :key="nativeGroup.id" :value="String(nativeGroup.id)">
                      {{ nativeGroup.name }} · {{ nativeGroup.platform }}
                    </option>
                  </select>
                  <button
                    type="button"
                    class="codex-button codex-button--compact"
                    :disabled="generatingGroupKeyId === group.id || !selectedSub2GroupByCodexGroup[group.id]"
                    @click="generateGroupApiKey(group.id)"
                  >
                    <Icon name="key" size="sm" />
                    {{ generatingGroupKeyId === group.id ? t('admin.codex.accounts.generatingApiKey') : t('admin.codex.accounts.generateApiKey') }}
                  </button>
                  <div v-if="generatedKeys[group.id]" class="codex-generated-key">
                    <span>{{ generatedKeys[group.id]?.key }}</span>
                    <button type="button" class="codex-link-button" @click="copyGeneratedKey(group.id)">
                      {{ t('common.copy') }}
                    </button>
                  </div>
                </div>
              </div>
              <div v-if="apiKeyOperationError" class="codex-error codex-error--compact">
                {{ apiKeyOperationError }}
              </div>
            </section>
          </aside>
        </div>

        <div
          v-if="deleteTargetAuthName"
          class="codex-modal-backdrop"
          role="presentation"
          @click.self="cancelDeleteAccount"
        >
          <section
            class="codex-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="codex-delete-title"
          >
            <h2 id="codex-delete-title" class="codex-modal-title">
              {{ t('admin.codex.accounts.deleteAuthFile') }}
            </h2>
            <p class="codex-modal-copy">
              {{ t('admin.codex.accounts.deleteConfirm', { name: deleteTargetAuthName }) }}
            </p>
            <div class="codex-modal-actions">
              <button type="button" class="codex-button" @click="cancelDeleteAccount">
                {{ t('common.cancel') }}
              </button>
              <button
                type="button"
                class="codex-button codex-button--danger"
                :disabled="deletingAuthName === deleteTargetAuthName"
                @click="confirmDeleteAccount"
              >
                <Icon name="trash" size="sm" />
                {{ t('common.delete') }}
              </button>
            </div>
          </section>
        </div>
      </section>
    </div>
  </AppLayout>
</template>

<script setup lang="ts">
import '@/styles/codex-theme.css'
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import AppLayout from '@/components/layout/AppLayout.vue'
import Icon from '@/components/icons/Icon.vue'
import { DEFAULT_CPA_MANAGEMENT_BASE } from '@/api/codex'
import { createGroup as createCodexGroup } from '@/api/codexMetadata'
import { keysAPI } from '@/api/keys'
import { apiKeysAPI } from '@/api/admin/apiKeys'
import { groupsAPI } from '@/api/admin/groups'
import { useCodexStore } from '@/stores'
import type { CodexAccountMerged } from '@/types/codex'
import type { AdminGroup, ApiKey } from '@/types'

const { t } = useI18n()
const codexStore = useCodexStore()

const baseUrlDraft = ref(codexStore.managementBaseUrl)
const managementKeyDraft = ref(codexStore.managementKey)
const rememberConnectionDraft = ref(codexStore.rememberConnection)
const searchQuery = ref('')
const statusFilter = ref('all')
const selectedAuthName = ref('')
const savingMetadata = ref(false)
const creatingGroup = ref(false)
const uploadingAuthFile = ref(false)
const oauthLoading = ref(false)
const deletingAuthName = ref('')
const togglingAuthName = ref('')
const operationError = ref('')
const operationNotice = ref('')
const oauthFallbackUrl = ref('')
const deleteTargetAuthName = ref('')
const newGroupName = ref('')
const authFileInput = ref<HTMLInputElement | null>(null)
const nativeGroups = ref<AdminGroup[]>([])
const selectedSub2GroupByCodexGroup = reactive<Record<number, string>>({})
const generatedKeys = reactive<Record<number, ApiKey | undefined>>({})
const generatingGroupKeyId = ref<number | null>(null)
const apiKeyOperationError = ref('')

const metadataDraft = reactive({
  displayName: '',
  groupId: '',
  tags: '',
  sortOrder: 0,
  note: '',
})

const activeCount = computed(() => codexStore.accounts.filter((item) => item.status === 'active').length)
const failedCount = computed(() => codexStore.accounts.filter((item) => item.status === 'failed').length)
const statusOptions = computed(() => [
  { value: 'all', label: t('admin.codex.accounts.allStatus') },
  { value: 'active', label: t('admin.codex.accounts.status.active') },
  { value: 'expiring', label: t('admin.codex.accounts.status.expiring') },
  { value: 'failed', label: t('admin.codex.accounts.status.failed') },
  { value: 'disabled', label: t('admin.codex.accounts.status.disabled') },
  { value: 'unknown', label: t('admin.codex.accounts.status.unknown') },
])

const filteredAccounts = computed(() => {
  const query = searchQuery.value.trim().toLowerCase()
  return codexStore.accounts.filter((account) => {
    const matchesStatus = statusFilter.value === 'all' || account.status === statusFilter.value
    if (!matchesStatus) return false
    if (!query) return true
    const haystack = [
      account.name,
      account.label,
      account.email,
      account.group?.name,
      account.metadata?.note,
      ...(account.metadata?.local_tags ?? []),
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase()
    return haystack.includes(query)
  })
})

const selectedAccount = computed(() => {
  return codexStore.accounts.find((account) => account.name === selectedAuthName.value)
})

function applyDraftFromSelected(): void {
  const account = selectedAccount.value
  if (!account) {
    metadataDraft.displayName = ''
    metadataDraft.groupId = ''
    metadataDraft.tags = ''
    metadataDraft.sortOrder = 0
    metadataDraft.note = ''
    return
  }
  metadataDraft.displayName = account.metadata?.display_name || account.label
  metadataDraft.groupId = account.metadata?.group_id ? String(account.metadata.group_id) : ''
  metadataDraft.tags = account.metadata?.local_tags?.join(', ') || ''
  metadataDraft.sortOrder = account.metadata?.sort_order ?? 0
  metadataDraft.note = account.metadata?.note || ''
}

function selectAccount(authName: string): void {
  selectedAuthName.value = authName
}

function parseTags(value: string): string[] {
  return value
    .split(',')
    .map((tag) => tag.trim())
    .filter(Boolean)
}

async function connectAndLoad(): Promise<void> {
  codexStore.setManagementBaseUrl(baseUrlDraft.value)
  codexStore.setRememberConnection(rememberConnectionDraft.value)
  codexStore.setManagementKey(managementKeyDraft.value)
  await codexStore.loadAll()
  if (!selectedAuthName.value && codexStore.accounts[0]) {
    selectedAuthName.value = codexStore.accounts[0].name
  }
}

async function refreshAccounts(): Promise<void> {
  syncConnectionDraft()
  operationError.value = ''
  operationNotice.value = ''
  oauthFallbackUrl.value = ''
  await codexStore.refreshQuotaStatus()
  operationNotice.value = t('admin.codex.accounts.refreshSucceeded')
}

function syncConnectionDraft(): void {
  codexStore.setManagementBaseUrl(baseUrlDraft.value)
  codexStore.setRememberConnection(rememberConnectionDraft.value)
  codexStore.setManagementKey(managementKeyDraft.value)
}

function openAuthFilePicker(): void {
  operationError.value = ''
  operationNotice.value = ''
  oauthFallbackUrl.value = ''
  authFileInput.value?.click()
}

async function handleAuthFileChange(event: Event): Promise<void> {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  input.value = ''
  if (!file) return
  if (!file.name.toLowerCase().endsWith('.json')) {
    operationError.value = t('admin.codex.accounts.invalidAuthFile')
    return
  }

  syncConnectionDraft()
  uploadingAuthFile.value = true
  operationError.value = ''
  operationNotice.value = ''
  oauthFallbackUrl.value = ''
  try {
    await codexStore.uploadAuthFile(file)
    operationNotice.value = t('admin.codex.accounts.uploadSucceeded', { name: file.name })
    if (!selectedAuthName.value && codexStore.accounts[0]) {
      selectedAuthName.value = codexStore.accounts[0].name
    }
  } catch (err) {
    operationError.value = err instanceof Error ? err.message : t('admin.codex.accounts.uploadFailed')
  } finally {
    uploadingAuthFile.value = false
  }
}

async function openCodexOAuth(): Promise<void> {
  syncConnectionDraft()
  oauthLoading.value = true
  operationError.value = ''
  operationNotice.value = ''
  oauthFallbackUrl.value = ''
  const popup = window.open('about:blank', '_blank')
  try {
    const url = await codexStore.getCodexAuthUrl()
    if (popup) {
      popup.opener = null
      popup.location.href = url
    } else {
      oauthFallbackUrl.value = url
      operationError.value = t('admin.codex.accounts.popupBlocked')
    }
  } catch (err) {
    popup?.close()
    operationError.value = err instanceof Error ? err.message : t('admin.codex.accounts.oauthFailed')
  } finally {
    oauthLoading.value = false
  }
}

function requestDeleteAccount(authName: string): void {
  operationError.value = ''
  operationNotice.value = ''
  oauthFallbackUrl.value = ''
  deleteTargetAuthName.value = authName
}

function cancelDeleteAccount(): void {
  if (deletingAuthName.value) return
  deleteTargetAuthName.value = ''
}

async function confirmDeleteAccount(): Promise<void> {
  const authName = deleteTargetAuthName.value
  if (!authName) return

  syncConnectionDraft()
  deletingAuthName.value = authName
  operationError.value = ''
  operationNotice.value = ''
  const previousFilteredNames = filteredAccounts.value.map((account) => account.name)
  const deletedIndex = previousFilteredNames.indexOf(authName)
  try {
    await codexStore.deleteAuthFile(authName)
    operationNotice.value = t('admin.codex.accounts.deleteSucceeded', { name: authName })
    deleteTargetAuthName.value = ''
    if (selectedAuthName.value === authName) {
      const remainingNames = filteredAccounts.value.map((account) => account.name)
      selectedAuthName.value =
        remainingNames[deletedIndex] ||
        remainingNames[Math.max(deletedIndex - 1, 0)] ||
        ''
    }
  } catch (err) {
    operationError.value = err instanceof Error ? err.message : t('admin.codex.accounts.deleteFailed')
  } finally {
    deletingAuthName.value = ''
  }
}

async function toggleAccountDisabled(account: CodexAccountMerged): Promise<void> {
  syncConnectionDraft()
  togglingAuthName.value = account.name
  operationError.value = ''
  operationNotice.value = ''
  oauthFallbackUrl.value = ''
  const disabled = account.status !== 'disabled'
  try {
    await codexStore.setAuthFileDisabled(account.name, disabled)
    operationNotice.value = disabled
      ? t('admin.codex.accounts.disableSucceeded', { name: account.name })
      : t('admin.codex.accounts.enableSucceeded', { name: account.name })
  } catch (err) {
    operationError.value = err instanceof Error ? err.message : t('admin.codex.accounts.toggleDisabledFailed')
  } finally {
    togglingAuthName.value = ''
  }
}

async function saveMetadata(): Promise<void> {
  const account = selectedAccount.value
  if (!account) return

  savingMetadata.value = true
  try {
    await codexStore.updateAccountMetadata(account.name, {
      display_name: metadataDraft.displayName,
      note: metadataDraft.note,
      local_tags: parseTags(metadataDraft.tags),
      sort_order: Number(metadataDraft.sortOrder) || 0,
      group_id: metadataDraft.groupId ? Number(metadataDraft.groupId) : null,
      clear_group_id: !metadataDraft.groupId,
    })
  } finally {
    savingMetadata.value = false
  }
}

async function createGroup(): Promise<void> {
  const name = newGroupName.value.trim()
  if (!name) return

  creatingGroup.value = true
  try {
    await createCodexGroup({
      name,
      color: '#d97757',
      sort_order: codexStore.groups.length + 1,
    })
    newGroupName.value = ''
    await codexStore.loadAll()
  } finally {
    creatingGroup.value = false
  }
}

async function loadNativeGroups(): Promise<void> {
  try {
    nativeGroups.value = await groupsAPI.getAll()
  } catch (err) {
    apiKeyOperationError.value = err instanceof Error ? err.message : t('admin.codex.accounts.loadSub2GroupsFailed')
  }
}

async function generateGroupApiKey(codexGroupId: number): Promise<void> {
  const codexGroup = codexStore.groups.find((group) => group.id === codexGroupId)
  const sub2GroupId = Number(selectedSub2GroupByCodexGroup[codexGroupId])
  if (!codexGroup || !sub2GroupId) return

  generatingGroupKeyId.value = codexGroupId
  apiKeyOperationError.value = ''
  try {
    const key = await keysAPI.create(`CPA:${codexGroup.id}:${codexGroup.name}`, null)
    const updated = await apiKeysAPI.updateApiKeyGroup(key.id, sub2GroupId)
    generatedKeys[codexGroupId] = updated.api_key || key
    operationNotice.value = t('admin.codex.accounts.apiKeyGenerated', { name: codexGroup.name })
  } catch (err) {
    apiKeyOperationError.value = err instanceof Error ? err.message : t('admin.codex.accounts.apiKeyGenerateFailed')
  } finally {
    generatingGroupKeyId.value = null
  }
}

async function copyGeneratedKey(codexGroupId: number): Promise<void> {
  const key = generatedKeys[codexGroupId]?.key
  if (!key) return
  await navigator.clipboard.writeText(key)
  operationNotice.value = t('admin.codex.accounts.apiKeyCopied')
}

function formatDate(value: string): string {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleString()
}

function accountBalanceLabel(account: CodexAccountMerged): string {
  if (account.balanceText) return account.balanceText
  if (typeof account.balance === 'number') {
    return Number.isInteger(account.balance) ? String(account.balance) : account.balance.toFixed(2)
  }
  return t('admin.codex.accounts.balanceUnavailable')
}

function accountCardTitle(account: CodexAccountMerged): string {
  const rawName = (account.name || account.label).replace(/\.json$/i, '')
  if (!rawName) return 'codex'
  return rawName.toLowerCase().startsWith('codex-') ? rawName : `codex-${rawName}`
}

function quotaProgressPercent(account: CodexAccountMerged): number {
  return account.quotaRemainingPercent ?? 0
}

function quotaProgressClass(account: CodexAccountMerged): string {
  const percent = account.quotaRemainingPercent
  if (percent === undefined) return 'codex-quota-progress--unknown'
  if (percent <= 20) return 'codex-quota-progress--low'
  if (percent <= 45) return 'codex-quota-progress--medium'
  return 'codex-quota-progress--healthy'
}

function quotaProgressLabel(account: CodexAccountMerged): string {
  const value = account.quotaRemainingPercent === undefined
    ? t('admin.codex.accounts.balanceUnavailable')
    : `${account.quotaRemainingPercent}%`
  return `${t('admin.codex.accounts.quotaRemaining')}: ${value}`
}

function toggleDisabledTitle(account: CodexAccountMerged): string {
  if (!account.canToggleDisabled) return t('admin.codex.accounts.toggleDisabledUnavailable')
  return account.status === 'disabled'
    ? t('admin.codex.accounts.enableAuthFile')
    : t('admin.codex.accounts.disableAuthFile')
}

function statusLabel(status: string): string {
  return t(`admin.codex.accounts.status.${status}`)
}

watch(selectedAccount, applyDraftFromSelected, { immediate: true })

onMounted(() => {
  void loadNativeGroups()
  if (codexStore.managementKey) {
    void codexStore.loadAll().then(() => {
      if (!selectedAuthName.value && codexStore.accounts[0]) {
        selectedAuthName.value = codexStore.accounts[0].name
      }
    })
  }
})
</script>
