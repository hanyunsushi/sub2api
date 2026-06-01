import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import ThemeSwitcher from '../ThemeSwitcher.vue'
import { adminAPI } from '@/api/admin'
import { setAppearanceTheme } from '@/composables/useAppearanceTheme'
import { useAppStore } from '@/stores/app'
import { useAuthStore } from '@/stores/auth'

vi.mock('@/api/admin', () => ({
  adminAPI: {
    settings: {
      updateSettings: vi.fn(),
      updateAppearanceThemeDefault: vi.fn(),
    },
  },
}))

describe('ThemeSwitcher', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    localStorage.clear()
    document.documentElement.dataset.theme = ''
    document.documentElement.className = ''
    delete window.__APP_CONFIG__
    setAppearanceTheme('newspaper')
    vi.mocked(adminAPI.settings.updateSettings).mockReset()
    vi.mocked(adminAPI.settings.updateAppearanceThemeDefault).mockReset()
  })

  it('ordinary users only change their own local view', async () => {
    const authStore = useAuthStore()
    authStore.user = { id: 2, email: 'user@example.com', username: 'user', role: 'user' } as any

    const wrapper = mount(ThemeSwitcher, {
      global: {
        stubs: { FloatingDropdown: { template: '<div><slot /></div>' } },
      },
    })

    await wrapper.find('button.theme-switcher-trigger').trigger('click')
    await wrapper.findAll('button.theme-switcher-option').find((button) => button.text().includes('Cloudflare'))!.trigger('click')

    expect(localStorage.getItem('appearance_theme')).toBe('cloudflare')
    expect(adminAPI.settings.updateSettings).not.toHaveBeenCalled()
    expect(adminAPI.settings.updateAppearanceThemeDefault).not.toHaveBeenCalled()
  })

  it('admins can publish the selected theme as the public default', async () => {
    const authStore = useAuthStore()
    authStore.user = { id: 1, email: 'admin@example.com', username: 'admin', role: 'admin' } as any
    const appStore = useAppStore()
    appStore.cachedPublicSettings = { site_name: 'Sub2API', appearance_theme_default: 'newspaper' } as any
    window.__APP_CONFIG__ = appStore.cachedPublicSettings as any
    vi.mocked(adminAPI.settings.updateAppearanceThemeDefault).mockResolvedValue({ appearance_theme_default: 'cloudflare' } as any)

    const wrapper = mount(ThemeSwitcher, {
      global: {
        stubs: { FloatingDropdown: { template: '<div><slot /></div>' } },
      },
    })

    await wrapper.find('button.theme-switcher-trigger').trigger('click')
    await wrapper.find('input[type="checkbox"]').setValue(true)
    await wrapper.findAll('button.theme-switcher-option').find((button) => button.text().includes('Cloudflare'))!.trigger('click')

    expect(adminAPI.settings.updateSettings).not.toHaveBeenCalled()
    expect(adminAPI.settings.updateAppearanceThemeDefault).toHaveBeenCalledWith('cloudflare')
    expect(window.__APP_CONFIG__?.appearance_theme_default).toBe('cloudflare')
  })

  it('rolls back the local theme if publishing the public default fails', async () => {
    const authStore = useAuthStore()
    authStore.user = { id: 1, email: 'admin@example.com', username: 'admin', role: 'admin' } as any
    const appStore = useAppStore()
    const showError = vi.spyOn(appStore, 'showError')
    localStorage.setItem('appearance_theme', 'newspaper')
    vi.mocked(adminAPI.settings.updateAppearanceThemeDefault).mockRejectedValue(new Error('publish failed'))

    const wrapper = mount(ThemeSwitcher, {
      global: {
        stubs: { FloatingDropdown: { template: '<div><slot /></div>' } },
      },
    })

    await wrapper.find('button.theme-switcher-trigger').trigger('click')
    await wrapper.find('input[type="checkbox"]').setValue(true)
    await wrapper.findAll('button.theme-switcher-option').find((button) => button.text().includes('Cloudflare'))!.trigger('click')

    expect(localStorage.getItem('appearance_theme')).toBe('newspaper')
    expect(document.documentElement.dataset.theme).toBe('newspaper')
    expect(showError).toHaveBeenCalledWith('publish failed')
  })
})
