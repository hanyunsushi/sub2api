import { ref } from 'vue'
import type { ExternalSubscriptionStatus } from '@/api/admin/externalSubscriptions'
import type { Account } from '@/types'
import type {
  AccountExternalQuotaProgressPreference,
  ExternalQuotaProgressMode,
} from '@/utils/externalSubscriptionQuotaProgress'

const STORAGE_KEY = 'sub2api.accountExternalQuotaProgress.v1'

type AccountExternalQuotaProgressSettings = Record<string, AccountExternalQuotaProgressPreference>

const DEFAULT_PREFERENCE: AccountExternalQuotaProgressPreference = {
  enabled: false,
  mode: 'status_total',
  customTotal: null,
}

const normalizeMode = (value: unknown): ExternalQuotaProgressMode => (
  value === 'custom_total' ? 'custom_total' : 'status_total'
)

const normalizeCustomTotal = (value: unknown): number | null => {
  const numeric = typeof value === 'number' ? value : Number(value)
  return Number.isFinite(numeric) && numeric > 0 ? numeric : null
}

const normalizePreference = (
  preference?: Partial<AccountExternalQuotaProgressPreference> | null,
): AccountExternalQuotaProgressPreference => ({
  enabled: preference?.enabled === true,
  mode: normalizeMode(preference?.mode),
  customTotal: normalizeCustomTotal(preference?.customTotal),
})

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

export const buildAccountExternalQuotaProgressPreferenceKey = (
  account: Pick<Account, 'id'>,
  status?: Pick<ExternalSubscriptionStatus, 'provider' | 'template' | 'name'> | null,
) => {
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

  const getAccountExternalQuotaProgressPreference = (
    account: Pick<Account, 'id'>,
    status?: ExternalSubscriptionStatus | null,
  ) => {
    if (!status) return { ...DEFAULT_PREFERENCE }
    const key = buildAccountExternalQuotaProgressPreferenceKey(account, status)
    return normalizePreference(settings.value[key])
  }

  const setAccountExternalQuotaProgressPreference = (
    account: Pick<Account, 'id'>,
    status: ExternalSubscriptionStatus,
    preference: AccountExternalQuotaProgressPreference,
  ) => {
    const key = buildAccountExternalQuotaProgressPreferenceKey(account, status)
    settings.value = {
      ...settings.value,
      [key]: normalizePreference(preference),
    }
    persist()
  }

  return {
    accountExternalQuotaProgressSettings: settings,
    getAccountExternalQuotaProgressPreference,
    setAccountExternalQuotaProgressPreference,
  }
}
