import { ref } from 'vue'
import externalSubscriptionsAPI, { type ExternalSubscriptionStatus } from '@/api/admin/externalSubscriptions'
import type { Account } from '@/types'
import type {
  AccountExternalQuotaProgressPreference,
  ExternalQuotaProgressMode,
} from '@/utils/externalSubscriptionQuotaProgress'

const STORAGE_KEY = 'sub2api.accountExternalQuotaProgress.v1'

type AccountExternalQuotaProgressSettings = Record<string, AccountExternalQuotaProgressPreference>

const DEFAULT_PREFERENCE: AccountExternalQuotaProgressPreference = {
  enabled: true,
  mode: 'status_total',
  customTotal: null,
  tokenTotal: null,
  tokenResetAt: null,
}

const normalizeMode = (value: unknown): ExternalQuotaProgressMode => (
  value === 'custom_total' || value === 'token_total' ? value : 'status_total'
)

const normalizeCustomTotal = (value: unknown): number | null => {
  const numeric = typeof value === 'number' ? value : Number(value)
  return Number.isFinite(numeric) && numeric > 0 ? numeric : null
}

const normalizeTokenResetAt = (value: unknown): string | null => {
  if (typeof value !== 'string') return null
  const trimmed = value.trim()
  if (!trimmed) return null
  const parsed = new Date(trimmed)
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString()
}

const normalizePreference = (
  preference?: Partial<AccountExternalQuotaProgressPreference> | null,
): AccountExternalQuotaProgressPreference => {
  const mode = normalizeMode(preference?.mode)
  const normalized: AccountExternalQuotaProgressPreference = {
    enabled: preference?.enabled ?? DEFAULT_PREFERENCE.enabled,
    mode,
    customTotal: normalizeCustomTotal(preference?.customTotal),
  }
  if (mode === 'token_total') {
    normalized.tokenTotal = normalizeCustomTotal(preference?.tokenTotal)
    normalized.tokenResetAt = normalizeTokenResetAt(preference?.tokenResetAt)
  }
  return normalized
}

const readInitialSettings = (): AccountExternalQuotaProgressSettings => {
  if (typeof localStorage === 'undefined') return {}
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return {}
    const parsed = JSON.parse(raw) as Record<string, Partial<AccountExternalQuotaProgressPreference>>
    if (!parsed || typeof parsed !== 'object') return {}
    return Object.fromEntries(
      Object.entries(parsed).map(([key, value]) => [key, normalizePreference(value)]),
    )
  } catch {
    return {}
  }
}

const settings = ref<AccountExternalQuotaProgressSettings>(readInitialSettings())
let storageListenerRegistered = false
let loadedFromBackend = false
let loadRequest: Promise<AccountExternalQuotaProgressSettings> | null = null

export const buildAccountExternalQuotaProgressPreferenceKey = (
  account: Pick<Account, 'id'>,
  status?: Pick<ExternalSubscriptionStatus, 'provider' | 'template' | 'name'> | null,
) => {
  if (!status) return `${account.id}:account`

  const providerKey = [
    status?.provider,
    status?.template,
    status?.name,
  ]
    .filter((part): part is string => typeof part === 'string' && part.trim() !== '')
    .join(':')
    .toLowerCase()

  return `${account.id}:${providerKey || 'external'}`
}

const persist = () => {
  if (typeof localStorage === 'undefined') return
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings.value))
  } catch {
    // Keep the in-memory setting for the current tab when browser storage is unavailable.
  }
}

const saveRemoteSettings = async (nextSettings: AccountExternalQuotaProgressSettings) => {
  const saved = await externalSubscriptionsAPI.updateAccountQuotaProgressSettings(nextSettings)
  settings.value = normalizeSettings(saved)
  persist()
  return settings.value
}

const saveRemotePatch = async (patch: AccountExternalQuotaProgressSettings) => {
  const remote = normalizeSettings(await externalSubscriptionsAPI.getAccountQuotaProgressSettings())
  return saveRemoteSettings({
    ...remote,
    ...patch,
  })
}

const normalizeSettings = (
  input?: Record<string, Partial<AccountExternalQuotaProgressPreference>> | null,
): AccountExternalQuotaProgressSettings => {
  if (!input || typeof input !== 'object') return {}
  return Object.fromEntries(
    Object.entries(input).map(([key, value]) => [key.toLowerCase(), normalizePreference(value)]),
  )
}

const ensureStorageListener = () => {
  if (storageListenerRegistered || typeof window === 'undefined') return
  storageListenerRegistered = true
  window.addEventListener('storage', (event) => {
    if (event.key !== STORAGE_KEY) return
    settings.value = readInitialSettings()
  })
}

export function useAccountExternalQuotaProgressSettings() {
  ensureStorageListener()

  const loadAccountExternalQuotaProgressSettings = async () => {
    if (loadedFromBackend) return settings.value
    if (loadRequest) return loadRequest
    loadRequest = externalSubscriptionsAPI.getAccountQuotaProgressSettings()
      .then(async (remote) => {
        const normalizedRemote = normalizeSettings(remote)
        const local = readInitialSettings()
        if (Object.keys(normalizedRemote).length > 0) {
          settings.value = normalizedRemote
          persist()
          return settings.value
        }
        if (Object.keys(local).length > 0) {
          settings.value = local
          await saveRemoteSettings(settings.value)
          return settings.value
        }
        settings.value = {}
        persist()
        return settings.value
      })
      .then((value) => {
        loadedFromBackend = true
        return value
      })
      .catch(() => {
        return settings.value
      })
      .finally(() => {
        loadRequest = null
      })
    return loadRequest
  }

  const getAccountExternalQuotaProgressPreference = (
    account: Pick<Account, 'id'>,
    status?: ExternalSubscriptionStatus | null,
  ) => {
    const key = buildAccountExternalQuotaProgressPreferenceKey(account, status)
    return normalizePreference(settings.value[key])
  }

  const setAccountExternalQuotaProgressPreference = async (
    account: Pick<Account, 'id'>,
    status: ExternalSubscriptionStatus | null,
    preference: AccountExternalQuotaProgressPreference,
  ) => {
    const key = buildAccountExternalQuotaProgressPreferenceKey(account, status)
    const normalizedPreference = normalizePreference(preference)
    settings.value = {
      ...settings.value,
      [key]: normalizedPreference,
    }
    persist()
    try {
      await saveRemotePatch({ [key]: normalizedPreference })
    } catch {
      // Keep the local setting visible in the current browser if the backend is briefly unavailable.
    }
  }

  return {
    accountExternalQuotaProgressSettings: settings,
    loadAccountExternalQuotaProgressSettings,
    getAccountExternalQuotaProgressPreference,
    setAccountExternalQuotaProgressPreference,
  }
}
