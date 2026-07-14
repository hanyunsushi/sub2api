import { computed, ref } from 'vue'

export type AppearanceThemeId = 'anthropic'

export interface AppearanceThemeOption {
  id: AppearanceThemeId
  label: string
}

const DEFAULT_THEME_STORAGE_KEY = 'appearance_theme_default'
const LEGACY_LOCAL_THEME_STORAGE_KEY = 'appearance_theme'

export const appearanceThemeOptions: AppearanceThemeOption[] = [
  { id: 'anthropic', label: 'Anthropic' },
]

const activeTheme = ref<AppearanceThemeId>('anthropic')

function normalizeTheme(): AppearanceThemeId {
  return 'anthropic'
}

function clearLegacyLocalThemeOverride() {
  try {
    localStorage.removeItem(LEGACY_LOCAL_THEME_STORAGE_KEY)
  } catch {
    // Ignore storage failures; runtime theme still follows public settings.
  }
}

function applyTheme() {
  activeTheme.value = 'anthropic'
  document.documentElement.dataset.theme = 'anthropic'
  document.documentElement.classList.add('theme-anthropic')
  document.documentElement.classList.remove('dark')
}

export function initAppearanceTheme() {
  clearLegacyLocalThemeOverride()
  applyTheme()
}

export function setAppearanceTheme(_theme: AppearanceThemeId) {
  clearLegacyLocalThemeOverride()
  applyTheme()
}

export function updateAppearanceThemeDefault(_theme: AppearanceThemeId) {
  const normalized = normalizeTheme()
  try {
    localStorage.setItem(DEFAULT_THEME_STORAGE_KEY, normalized)
  } catch {
    // Ignore storage failures; the live DOM theme and public settings still win.
  }
  if (window.__APP_CONFIG__) {
    window.__APP_CONFIG__.appearance_theme_default = normalized
  }
  clearLegacyLocalThemeOverride()
  applyTheme()
}

export function useAppearanceTheme() {
  const currentTheme = computed(() => activeTheme.value)
  const currentThemeOption = computed(() =>
    appearanceThemeOptions.find((theme) => theme.id === activeTheme.value) ?? appearanceThemeOptions[0]
  )

  return {
    currentTheme,
    currentThemeOption,
    themes: appearanceThemeOptions,
    setAppearanceTheme,
    updateAppearanceThemeDefault,
  }
}
