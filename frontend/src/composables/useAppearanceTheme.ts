import { computed, ref } from 'vue'

export type AppearanceThemeId = 'newspaper' | 'cloudflare'

export interface AppearanceThemeOption {
  id: AppearanceThemeId
  label: string
}

const STORAGE_KEY = 'appearance_theme'

export const appearanceThemeOptions: AppearanceThemeOption[] = [
  { id: 'newspaper', label: 'Newspaper' },
  { id: 'cloudflare', label: 'Cloudflare' },
]

const activeTheme = ref<AppearanceThemeId>('newspaper')

function normalizeTheme(value: string | null): AppearanceThemeId {
  return appearanceThemeOptions.some((theme) => theme.id === value)
    ? value as AppearanceThemeId
    : 'newspaper'
}

function applyTheme(theme: AppearanceThemeId) {
  activeTheme.value = theme
  document.documentElement.dataset.theme = theme
  document.documentElement.classList.toggle('theme-newspaper', theme === 'newspaper')
  document.documentElement.classList.toggle('theme-cloudflare', theme === 'cloudflare')
  document.documentElement.classList.remove('dark')
  localStorage.setItem(STORAGE_KEY, theme)
}

export function initAppearanceTheme() {
  applyTheme(normalizeTheme(localStorage.getItem(STORAGE_KEY)))
}

export function setAppearanceTheme(theme: AppearanceThemeId) {
  applyTheme(theme)
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
  }
}
