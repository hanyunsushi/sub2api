import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import {
  DEFAULT_CPA_MANAGEMENT_BASE,
  deleteAuthFile as deleteCpaAuthFile,
  getCodexAuthUrl as fetchCodexAuthUrl,
  listAuthFiles,
  mapCpaAuthFileToView,
  refreshCodexQuotas,
  uploadAuthFile as uploadCpaAuthFile,
} from '@/api/codex'
import * as codexMetadataAPI from '@/api/codexMetadata'
import type {
  CodexAccountMerged,
  CodexAccountMetadata,
  CodexGroup,
  CpaAuthFileRaw,
  UpdateCodexAccountMetadataRequest,
} from '@/types/codex'

const MANAGEMENT_KEY_SESSION_KEY = 'codex.managementKey'
const MANAGEMENT_KEY_LOCAL_KEY = 'codex.rememberedManagementKey'
const MANAGEMENT_BASE_LOCAL_KEY = 'codex.cpaManagementBaseUrl'
const REMEMBER_CONNECTION_LOCAL_KEY = 'codex.rememberConnection'

function readSessionManagementKey(): string {
  const sessionKey = sessionStorage.getItem(MANAGEMENT_KEY_SESSION_KEY)
  if (sessionKey) return sessionKey
  if (localStorage.getItem(REMEMBER_CONNECTION_LOCAL_KEY) === 'true') {
    return localStorage.getItem(MANAGEMENT_KEY_LOCAL_KEY) || ''
  }
  return ''
}

function readManagementBaseUrl(): string {
  return localStorage.getItem(MANAGEMENT_BASE_LOCAL_KEY) || DEFAULT_CPA_MANAGEMENT_BASE
}

function readRememberConnection(): boolean {
  return localStorage.getItem(REMEMBER_CONNECTION_LOCAL_KEY) === 'true'
}

function mergeAccounts(
  rawAccounts: CpaAuthFileRaw[],
  metadataItems: CodexAccountMetadata[],
  groups: CodexGroup[]
): CodexAccountMerged[] {
  const metadataByName = new Map(metadataItems.map((item) => [item.auth_name, item]))
  const groupByID = new Map(groups.map((group) => [group.id, group]))

  return rawAccounts
    .map((raw) => {
      const view = mapCpaAuthFileToView(raw)
      const metadata = metadataByName.get(view.name)
      const group = metadata?.group_id ? groupByID.get(metadata.group_id) : undefined
      return {
        ...view,
        label: metadata?.display_name || view.label,
        metadata,
        group,
      }
    })
    .sort((a, b) => {
      const sortA = a.metadata?.sort_order ?? 0
      const sortB = b.metadata?.sort_order ?? 0
      if (sortA !== sortB) return sortA - sortB
      return a.name.localeCompare(b.name)
    })
}

export const useCodexStore = defineStore('codex', () => {
  const managementBaseUrl = ref(readManagementBaseUrl())
  const managementKey = ref(readSessionManagementKey())
  const rememberConnection = ref(readRememberConnection())
  const rawAccounts = ref<CpaAuthFileRaw[]>([])
  const groups = ref<CodexGroup[]>([])
  const accountMetadata = ref<CodexAccountMetadata[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)
  const lastLoadedAt = ref<number | null>(null)

  const accounts = computed(() => mergeAccounts(rawAccounts.value, accountMetadata.value, groups.value))

  const orphanMetadata = computed(() => {
    const accountNames = new Set(rawAccounts.value.map((raw) => mapCpaAuthFileToView(raw).name))
    return accountMetadata.value.filter((item) => !accountNames.has(item.auth_name))
  })

  function setManagementKey(key: string): void {
    managementKey.value = key
    if (key) {
      sessionStorage.setItem(MANAGEMENT_KEY_SESSION_KEY, key)
      if (rememberConnection.value) {
        localStorage.setItem(MANAGEMENT_KEY_LOCAL_KEY, key)
      }
    } else {
      sessionStorage.removeItem(MANAGEMENT_KEY_SESSION_KEY)
      localStorage.removeItem(MANAGEMENT_KEY_LOCAL_KEY)
    }
  }

  function setRememberConnection(remember: boolean): void {
    rememberConnection.value = remember
    if (remember) {
      localStorage.setItem(REMEMBER_CONNECTION_LOCAL_KEY, 'true')
      if (managementKey.value) {
        localStorage.setItem(MANAGEMENT_KEY_LOCAL_KEY, managementKey.value)
      }
    } else {
      localStorage.removeItem(REMEMBER_CONNECTION_LOCAL_KEY)
      localStorage.removeItem(MANAGEMENT_KEY_LOCAL_KEY)
    }
  }

  function setManagementBaseUrl(baseUrl: string): void {
    const normalized = baseUrl.trim() || DEFAULT_CPA_MANAGEMENT_BASE
    managementBaseUrl.value = normalized
    localStorage.setItem(MANAGEMENT_BASE_LOCAL_KEY, normalized)
  }

  function cpaOptions() {
    return {
      baseUrl: managementBaseUrl.value,
      managementKey: managementKey.value,
    }
  }

  async function loadAll(): Promise<void> {
    loading.value = true
    error.value = null
    try {
      const [cpaAccounts, codexGroups, metadataItems] = await Promise.all([
        listAuthFiles({
          baseUrl: managementBaseUrl.value,
          managementKey: managementKey.value,
        }),
        codexMetadataAPI.listGroups(),
        codexMetadataAPI.listAccountMetadata(),
      ])
      rawAccounts.value = cpaAccounts
      groups.value = codexGroups
      accountMetadata.value = metadataItems
      lastLoadedAt.value = Date.now()
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to load Codex accounts'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function refreshQuotaStatus(): Promise<void> {
    loading.value = true
    error.value = null
    try {
      const [cpaAccounts, codexGroups, metadataItems] = await Promise.all([
        listAuthFiles({
          baseUrl: managementBaseUrl.value,
          managementKey: managementKey.value,
        }).then((items) => refreshCodexQuotas(items, cpaOptions())),
        codexMetadataAPI.listGroups(),
        codexMetadataAPI.listAccountMetadata(),
      ])
      rawAccounts.value = cpaAccounts
      groups.value = codexGroups
      accountMetadata.value = metadataItems
      lastLoadedAt.value = Date.now()
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to refresh Codex quota status'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function updateAccountMetadata(
    authName: string,
    request: UpdateCodexAccountMetadataRequest
  ): Promise<CodexAccountMetadata> {
    const updated = await codexMetadataAPI.updateAccountMetadata(authName, request)
    const index = accountMetadata.value.findIndex((item) => item.auth_name === updated.auth_name)
    if (index >= 0) {
      accountMetadata.value[index] = updated
    } else {
      accountMetadata.value.push(updated)
    }
    return updated
  }

  async function uploadAuthFile(file: File): Promise<void> {
    await uploadCpaAuthFile(file, cpaOptions())
    await loadAll()
  }

  async function deleteAuthFile(authName: string): Promise<void> {
    const account = accounts.value.find((item) => item.name === authName)
    if (!account?.canDelete) {
      throw new Error('Only CPA file accounts can be deleted')
    }

    await deleteCpaAuthFile(authName, cpaOptions())
    if (account.metadata) {
      try {
        await codexMetadataAPI.deleteAccountMetadata(authName)
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to remove Sub2 metadata'
        error.value = `Deleted CPA auth file, but failed to remove Sub2 metadata: ${message}`
        console.warn('[Codex] Failed to remove metadata after CPA auth deletion', err)
      }
    }
    rawAccounts.value = rawAccounts.value.filter((raw) => mapCpaAuthFileToView(raw).name !== authName)
    accountMetadata.value = accountMetadata.value.filter((item) => item.auth_name !== authName)
    lastLoadedAt.value = Date.now()
  }

  async function getCodexAuthUrl(): Promise<string> {
    return fetchCodexAuthUrl(cpaOptions())
  }

  return {
    managementBaseUrl,
    managementKey,
    rememberConnection,
    rawAccounts,
    groups,
    accountMetadata,
    loading,
    error,
    lastLoadedAt,
    accounts,
    orphanMetadata,
    setManagementKey,
    setRememberConnection,
    setManagementBaseUrl,
    loadAll,
    refreshQuotaStatus,
    updateAccountMetadata,
    uploadAuthFile,
    deleteAuthFile,
    getCodexAuthUrl,
  }
})
