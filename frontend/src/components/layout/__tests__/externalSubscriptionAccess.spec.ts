import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, shallowMount, type VueWrapper } from '@vue/test-utils'
import { reactive, ref } from 'vue'
import AppHeader from '../AppHeader.vue'
import MonitorCardGrid from '@/components/user/monitor/MonitorCardGrid.vue'

const { getDisplayStatuses, subscribeDisplayStatuses, clearCache, unsubscribe } = vi.hoisted(() => ({
  getDisplayStatuses: vi.fn(), subscribeDisplayStatuses: vi.fn(), clearCache: vi.fn(), unsubscribe: vi.fn(),
}))
const auth = reactive({ isAdmin: false, isSimpleMode: false, user: { id: 1, email: 'user@example.com', role: 'user' } })
vi.mock('@/stores/auth', () => ({ useAuthStore: () => auth }))
vi.mock('@/stores/app', () => ({ useAppStore: () => ({ cachedPublicSettings: {}, docUrl: '', contactInfo: '' }) }))
vi.mock('@/stores', () => ({
  useAuthStore: () => auth,
  useAppStore: () => ({ cachedPublicSettings: {}, docUrl: '', contactInfo: '' }),
  useOnboardingStore: () => ({ replay: vi.fn() }),
}))
vi.mock('@/stores/adminSettings', () => ({ useAdminSettingsStore: () => ({ customMenuItems: [] }) }))
vi.mock('vue-router', () => ({
  useRoute: () => ({ path: '/monitor', name: 'ChannelStatus', params: {}, meta: {} }),
  useRouter: () => ({ push: vi.fn() }),
}))
vi.mock('vue-i18n', async importOriginal => ({
  ...await importOriginal<typeof import('vue-i18n')>(),
  useI18n: () => ({ t: (key: string) => key, locale: ref('en') }),
}))
vi.mock('@/api/admin/externalSubscriptions', () => ({ default: {
  getDisplayStatuses, subscribeDisplayStatuses, clearStoredDisplayStatusesCache: clearCache,
} }))

const statuses = [{
  provider: 'pixel', name: 'Pixel', enabled: true, configured: true, currency: 'CNY',
  site_url: 'https://example.com', remaining_usd: 20, match_keywords: [], subscriptions: [],
}]
let wrapper: VueWrapper | undefined
afterEach(() => { wrapper?.unmount(); wrapper = undefined })
beforeEach(() => {
  vi.clearAllMocks()
  auth.isAdmin = false
  auth.user = { id: 1, email: 'user@example.com', role: 'user' }
  getDisplayStatuses.mockResolvedValue(statuses)
  subscribeDisplayStatuses.mockReturnValue(unsubscribe)
})

function mountSurface(surface: 'header' | 'grid') {
  return surface === 'header'
    ? shallowMount(AppHeader, { global: { stubs: { RouterLink: true } } })
    : shallowMount(MonitorCardGrid, { props: { items: [], loading: false, window: '7d', countdownSeconds: 0, detailCache: {} } })
}

describe.each(['header', 'grid'] as const)('external subscription access on %s', surface => {
  it('does not call admin APIs as a regular user', async () => {
    wrapper = mountSurface(surface)
    await flushPromises()
    expect(getDisplayStatuses).not.toHaveBeenCalled()
    expect(wrapper.find('[data-testid="header-external-subscriptions"]').exists()).toBe(false)
    expect(wrapper.findComponent({ name: 'MonitorCapacityOverview' }).exists()).toBe(false)
  })

  it('does not fetch or subscribe to balances even for admins', async () => {
    auth.isAdmin = true
    auth.user.role = 'admin'
    wrapper = mountSurface(surface)
    await flushPromises()
    expect(getDisplayStatuses).not.toHaveBeenCalled()
    expect(subscribeDisplayStatuses).not.toHaveBeenCalled()
    expect(wrapper.find('[data-testid="header-external-subscriptions"]').exists()).toBe(false)
    expect(wrapper.findComponent({ name: 'MonitorCapacityOverview' }).exists()).toBe(false)
    auth.isAdmin = false
    auth.user = { id: 2, email: 'next@example.com', role: 'user' }
    await flushPromises()
    expect(getDisplayStatuses).not.toHaveBeenCalled()
  })
})
