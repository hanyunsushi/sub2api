import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import ThemeSwitcher from '../ThemeSwitcher.vue'
import { setAppearanceTheme, updateAppearanceThemeDefault } from '@/composables/useAppearanceTheme'
import { adminAPI } from '@/api/admin'
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
    updateAppearanceThemeDefault('cloudflare')
    vi.mocked(adminAPI.settings.updateAppearanceThemeDefault).mockResolvedValue({
      appearance_theme_default: 'cloudflare',
    })
  })

  it('does not render theme choices for ordinary users', () => {
    const authStore = useAuthStore()
    authStore.user = { id: 2, email: 'user@example.com', username: 'user', role: 'user' } as any

    const wrapper = mount(ThemeSwitcher, {
      global: {
        stubs: { FloatingDropdown: { template: '<div><slot /></div>' } },
      },
    })

    expect(wrapper.find('button.theme-switcher-trigger').exists()).toBe(false)
    expect(wrapper.findAll('button.theme-switcher-option')).toHaveLength(0)
    expect(localStorage.getItem('appearance_theme')).toBeNull()
  })

  it('renders the current Cloudflare theme logo on the trigger', () => {
    const authStore = useAuthStore()
    authStore.user = { id: 1, email: 'admin@example.com', username: 'admin', role: 'admin' } as any
    setAppearanceTheme('cloudflare')

    const wrapper = mount(ThemeSwitcher, {
      global: {
        stubs: { FloatingDropdown: { template: '<div><slot /></div>' } },
      },
    })

    const trigger = wrapper.find('button.theme-switcher-trigger')
    expect(trigger.find('[data-theme-logo="cloudflare"]').exists()).toBe(true)
  })

  it('renders the Anthropic logo when Anthropic is selected', () => {
    const authStore = useAuthStore()
    authStore.user = { id: 1, email: 'admin@example.com', username: 'admin', role: 'admin' } as any
    setAppearanceTheme('anthropic')

    const wrapper = mount(ThemeSwitcher, {
      global: {
        stubs: { FloatingDropdown: { template: '<div><slot /></div>' } },
      },
    })

    const trigger = wrapper.find('button.theme-switcher-trigger')
    expect(trigger.find('[data-theme-logo="anthropic"]').exists()).toBe(true)
    expect(trigger.find('[data-theme-logo="cloudflare"]').exists()).toBe(false)
  })

  it('does not render the old global visibility control for admins', async () => {
    const authStore = useAuthStore()
    authStore.user = { id: 1, email: 'admin@example.com', username: 'admin', role: 'admin' } as any

    const wrapper = mount(ThemeSwitcher, {
      global: {
        stubs: { FloatingDropdown: { template: '<div><slot /></div>' } },
      },
    })

    await wrapper.find('button.theme-switcher-trigger').trigger('click')

    expect(wrapper.text()).not.toContain('所有人可见')
    expect(wrapper.find('input[type="checkbox"]').exists()).toBe(false)
  })

  it('admins publish the global theme from the sidebar switcher', async () => {
    const authStore = useAuthStore()
    authStore.user = { id: 1, email: 'admin@example.com', username: 'admin', role: 'admin' } as any
    window.__APP_CONFIG__ = { site_name: 'Sub2API', appearance_theme_default: 'anthropic' } as any

    const wrapper = mount(ThemeSwitcher, {
      global: {
        stubs: { FloatingDropdown: { template: '<div><slot /></div>' } },
      },
    })

    await wrapper.find('button.theme-switcher-trigger').trigger('click')
    await wrapper.findAll('button.theme-switcher-option').find((button) => button.text().includes('Cloudflare'))!.trigger('click')

    expect(adminAPI.settings.updateAppearanceThemeDefault).toHaveBeenCalledWith('cloudflare')
    expect(localStorage.getItem('appearance_theme')).toBeNull()
    expect(document.documentElement.dataset.theme).toBe('cloudflare')
    expect(window.__APP_CONFIG__?.appearance_theme_default).toBe('cloudflare')
  })
})
