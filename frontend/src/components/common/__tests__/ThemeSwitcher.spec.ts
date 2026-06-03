import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import ThemeSwitcher from '../ThemeSwitcher.vue'
import { setAppearanceTheme } from '@/composables/useAppearanceTheme'
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
  })

  it('renders the current theme logo on the trigger instead of always showing Cloudflare', () => {
    const authStore = useAuthStore()
    authStore.user = { id: 2, email: 'user@example.com', username: 'user', role: 'user' } as any
    setAppearanceTheme('newspaper')

    const wrapper = mount(ThemeSwitcher, {
      global: {
        stubs: { FloatingDropdown: { template: '<div><slot /></div>' } },
      },
    })

    const trigger = wrapper.find('button.theme-switcher-trigger')
    expect(trigger.find('[data-theme-logo="newspaper"]').exists()).toBe(true)
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

  it('admins only change their own local view from the theme switcher', async () => {
    const authStore = useAuthStore()
    authStore.user = { id: 1, email: 'admin@example.com', username: 'admin', role: 'admin' } as any
    window.__APP_CONFIG__ = { site_name: 'Sub2API', appearance_theme_default: 'newspaper' } as any

    const wrapper = mount(ThemeSwitcher, {
      global: {
        stubs: { FloatingDropdown: { template: '<div><slot /></div>' } },
      },
    })

    await wrapper.find('button.theme-switcher-trigger').trigger('click')
    await wrapper.findAll('button.theme-switcher-option').find((button) => button.text().includes('Cloudflare'))!.trigger('click')

    expect(localStorage.getItem('appearance_theme')).toBe('cloudflare')
    expect(document.documentElement.dataset.theme).toBe('cloudflare')
    expect(window.__APP_CONFIG__?.appearance_theme_default).toBe('newspaper')
  })
})
