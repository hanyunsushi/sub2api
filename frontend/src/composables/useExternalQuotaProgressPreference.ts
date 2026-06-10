import { computed, ref } from 'vue'

const STORAGE_KEY = 'sub2api.externalSubscriptionQuotaProgress.enabled'

const readInitialValue = () => {
  if (typeof localStorage === 'undefined') return true
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved === null) return true
    return saved !== 'false'
  } catch {
    return true
  }
}

const enabled = ref(readInitialValue())
let storageListenerRegistered = false

const persist = (value: boolean) => {
  enabled.value = value
  if (typeof localStorage === 'undefined') return
  try {
    localStorage.setItem(STORAGE_KEY, value ? 'true' : 'false')
  } catch {
    // Browser storage can fail in private modes; the in-memory value still applies.
  }
}

const ensureStorageListener = () => {
  if (storageListenerRegistered || typeof window === 'undefined') return
  storageListenerRegistered = true
  window.addEventListener('storage', (event) => {
    if (event.key !== STORAGE_KEY) return
    enabled.value = event.newValue !== 'false'
  })
}

export function useExternalQuotaProgressPreference() {
  ensureStorageListener()
  const externalQuotaProgressEnabled = computed({
    get: () => enabled.value,
    set: persist,
  })

  return {
    externalQuotaProgressEnabled,
    setExternalQuotaProgressEnabled: persist,
  }
}
