import { computed, ref } from 'vue'

export type AppearanceThemeId = 'newspaper' | 'cloudflare' | 'anthropic'

export interface AppearanceThemeOption {
  id: AppearanceThemeId
  label: string
}

const STORAGE_KEY = 'appearance_theme'
const DEFAULT_THEME_STORAGE_KEY = 'appearance_theme_default'

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

function applyTheme(theme: AppearanceThemeId, persist = true) {
  activeTheme.value = theme
  document.documentElement.dataset.theme = theme
  document.documentElement.classList.toggle('theme-newspaper', theme === 'newspaper')
  document.documentElement.classList.toggle('theme-cloudflare', theme === 'cloudflare')
  document.documentElement.classList.toggle('theme-anthropic', theme === 'anthropic')
  document.documentElement.classList.remove('dark')
  if (persist) {
    localStorage.setItem(STORAGE_KEY, theme)
  }
}

export function initAppearanceTheme() {
  const localTheme = localStorage.getItem(STORAGE_KEY)
  applyTheme(localTheme ? normalizeTheme(localTheme) : getInjectedAppearanceThemeDefault(), Boolean(localTheme))
}

export function setAppearanceTheme(theme: AppearanceThemeId) {
  applyTheme(theme)
}

export function updateAppearanceThemeDefault(theme: AppearanceThemeId) {
  const normalized = normalizeTheme(theme)
  localStorage.setItem(DEFAULT_THEME_STORAGE_KEY, normalized)
  if (window.__APP_CONFIG__) {
    window.__APP_CONFIG__.appearance_theme_default = normalized
  }
  const localTheme = localStorage.getItem(STORAGE_KEY)
  applyTheme(localTheme ? normalizeTheme(localTheme) : normalized, false)
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
