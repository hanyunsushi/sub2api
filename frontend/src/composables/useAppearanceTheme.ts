import { computed, ref } from 'vue'

export type AppearanceThemeId = 'newspaper' | 'cloudflare' | 'anthropic'

export interface AppearanceThemeOption {
  id: AppearanceThemeId
  label: string
}

const DEFAULT_THEME_STORAGE_KEY = 'appearance_theme_default'
const LEGACY_LOCAL_THEME_STORAGE_KEY = 'appearance_theme'

export const appearanceThemeOptions: AppearanceThemeOption[] = [
  { id: 'newspaper', label: 'Newspaper' },
  { id: 'cloudflare', label: 'Cloudflare' },
  { id: 'anthropic', label: 'Anthropic' },
]

const activeTheme = ref<AppearanceThemeId>('newspaper')

function normalizeTheme(value: string | null | undefined): AppearanceThemeId {
  return appearanceThemeOptions.some((theme) => theme.id === value)
    ? value as AppearanceThemeId
    : 'newspaper'
}

function getInjectedAppearanceThemeDefault(): AppearanceThemeId {
  return normalizeTheme(window.__APP_CONFIG__?.appearance_theme_default)
}

function clearLegacyLocalThemeOverride() {
  try {
    localStorage.removeItem(LEGACY_LOCAL_THEME_STORAGE_KEY)
  } catch {
    // Ignore storage failures; runtime theme still follows public settings.
  }
}

function applyTheme(theme: AppearanceThemeId) {
  activeTheme.value = theme
  document.documentElement.dataset.theme = theme
  document.documentElement.classList.toggle('theme-newspaper', theme === 'newspaper')
  document.documentElement.classList.toggle('theme-cloudflare', theme === 'cloudflare')
  document.documentElement.classList.toggle('theme-anthropic', theme === 'anthropic')
  document.documentElement.classList.remove('dark')
}

export function initAppearanceTheme() {
  clearLegacyLocalThemeOverride()
  applyTheme(getInjectedAppearanceThemeDefault())
}

export function setAppearanceTheme(theme: AppearanceThemeId) {
  clearLegacyLocalThemeOverride()
  applyTheme(normalizeTheme(theme))
}

export function updateAppearanceThemeDefault(theme: AppearanceThemeId) {
  const normalized = normalizeTheme(theme)
  try {
    localStorage.setItem(DEFAULT_THEME_STORAGE_KEY, normalized)
  } catch {
    // Ignore storage failures; the live DOM theme and public settings still win.
  }
  if (window.__APP_CONFIG__) {
    window.__APP_CONFIG__.appearance_theme_default = normalized
  }
  clearLegacyLocalThemeOverride()
  applyTheme(normalized)
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
