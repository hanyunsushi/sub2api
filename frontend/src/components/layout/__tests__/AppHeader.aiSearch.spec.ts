import { mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { nextTick } from 'vue'

import AppHeader from '../AppHeader.vue'
import buzzBalanceAPI from '@/api/admin/buzzBalance'
import tcdmxSubscriptionAPI from '@/api/admin/tcdmxSubscription'

const authState = vi.hoisted(() => ({
  user: {
    id: 1,
    username: 'admin',
    email: 'admin@example.com',
    role: 'admin',
    balance: 42.5,
  },
  isAdmin: true,
  isSimpleMode: false,
  logout: vi.fn(),
}))

vi.mock('@/api/admin/buzzBalance', () => ({
  default: {
    getBalance: vi.fn(),
  },
}))

vi.mock('@/api/admin/tcdmxSubscription', () => ({
  default: {
    getStatus: vi.fn(),
  },
}))

vi.mock('@/stores', () => ({
  useAuthStore: () => ({
    get user() {
      return authState.user
    },
    get isAdmin() {
      return authState.isAdmin
    },
    get isSimpleMode() {
      return authState.isSimpleMode
    },
    logout: authState.logout,
  }),
  useAppStore: () => ({
    contactInfo: '',
    docUrl: '',
    cachedPublicSettings: { custom_menu_items: [] },
    toggleMobileSidebar: vi.fn(),
  }),
  useOnboardingStore: () => ({
    replay: vi.fn(),
  }),
}))

vi.mock('@/stores/adminSettings', () => ({
  useAdminSettingsStore: () => ({
    customMenuItems: [],
  }),
}))

vi.mock('vue-router', () => ({
  useRouter: () => ({ push: vi.fn() }),
  useRoute: () => ({
    path: '/admin/ops',
    name: 'Ops',
    params: {},
    meta: { title: '运维监控', description: '请求与系统运行状态' },
  }),
  RouterLink: {
    props: ['to'],
    template: '<a><slot /></a>',
  },
}))

vi.mock('vue-i18n', async () => {
  const actual = await vi.importActual<typeof import('vue-i18n')>('vue-i18n')
  return {
    ...actual,
    useI18n: () => ({
      t: (key: string) => key,
    }),
  }
})

describe('AppHeader AI Search placement', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(buzzBalanceAPI.getBalance).mockResolvedValue({
      enabled: false,
      configured: false,
      currency: 'USD',
      total: 0,
      used: 0,
      remaining: 0,
    })
    vi.mocked(tcdmxSubscriptionAPI.getStatus).mockResolvedValue({
      provider: 'tcdmx',
      enabled: false,
      configured: false,
      currency: 'USD',
      site_url: 'https://tcdmx.com/subscriptions',
      used_usd: 0,
      active_count: 0,
      subscriptions: [],
    })
  })

  it('places AI Search immediately before the announcement bell in the right header controls', async () => {
    const wrapper = mount(AppHeader, {
      attachTo: document.body,
      global: {
        stubs: {
          Icon: { template: '<span />' },
          LocaleSwitcher: { template: '<div />' },
          SubscriptionProgressMini: { template: '<div />' },
          AISearchBox: { template: '<div data-testid="ai-search-box">AI Search</div>' },
          AnnouncementBell: { template: '<div data-testid="announcement-bell" />' },
          FloatingDropdown: {
            props: ['show', 'triggerEl', 'panelClass'],
            template: '<div v-if="show" class="floating-dropdown-portal" :class="panelClass"><slot /></div>',
          },
          RouterLink: { template: '<a><slot /></a>' },
        },
      },
    })
    await nextTick()

    const aiSearch = wrapper.get('[data-testid="ai-search-box"]').element
    const bell = wrapper.get('[data-testid="announcement-bell"]').element
    expect(aiSearch.compareDocumentPosition(bell) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
    expect(aiSearch.nextElementSibling).toBe(bell)
    expect(wrapper.text()).toContain('AI Search')
    expect(wrapper.text()).not.toContain('help')
  })
})
