import { beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, shallowMount } from '@vue/test-utils'
import AccountsView from '@/views/admin/AccountsView.vue'

const { getById, list, consoleActions } = vi.hoisted(() => ({ getById: vi.fn(), list: vi.fn(), consoleActions: vi.fn() }))
vi.mock('@/runtime/console-actions', () => ({ useConsoleActions: consoleActions }))
vi.mock('@/stores/app', () => ({ useAppStore: () => ({ showError: vi.fn(), showSuccess: vi.fn(), showInfo: vi.fn() }) }))
vi.mock('@/stores/auth', () => ({ useAuthStore: () => ({ isAdmin: false, user: { id: 1 } }) }))
vi.mock('vue-i18n', async () => ({ ...await vi.importActual<typeof import('vue-i18n')>('vue-i18n'), useI18n: () => ({ t: (key: string) => key }) }))
vi.mock('@/api/admin', () => ({ adminAPI: {
  accounts: {
    list, getById,
    getBatchTodayStats: vi.fn().mockResolvedValue({ stats: {} }),
    getUpstreamBillingProbeSettings: vi.fn().mockResolvedValue({ enabled: false }),
    getUpstreamBillingRatesWithEtag: vi.fn().mockResolvedValue({ notModified: true, data: null }),
    listWithEtag: vi.fn().mockResolvedValue({ notModified: true, data: null })
  },
  proxies: { getAll: vi.fn().mockResolvedValue([]) }, groups: { getAll: vi.fn().mockResolvedValue([]) }
} }))
vi.mock('@/api/admin/externalSubscriptions', () => ({ default: {
  getDisplayStatuses: vi.fn().mockResolvedValue([]), subscribeDisplayStatuses: () => () => {}
} }))
vi.mock('@/composables/useAccountExternalQuotaProgressSettings', () => ({
  buildAccountExternalQuotaProgressPreferenceKey: () => '',
  useAccountExternalQuotaProgressSettings: () => ({
    loadAccountExternalQuotaProgressSettings: vi.fn().mockResolvedValue({}),
    getAccountExternalQuotaProgressPreference: () => ({ enabled: false }),
    setAccountExternalQuotaProgressPreference: vi.fn()
  })
}))

const account = {
  id: 101, name: 'Original provider', platform: 'openai', type: 'apikey', credentials: {},
  extra: { custom_logo_url: 'https://example.com/original.png' }, status: 'active', group_ids: [], concurrency: 1, priority: 1
}

function mountPage() {
  return shallowMount(AccountsView, { global: { stubs: {
    AppLayout: { template: '<div><slot /></div>' },
    TablePageLayout: { template: '<div><slot name="filters" /><slot name="table" /></div>' },
    AccountTableActions: { template: '<div><slot name="after" /></div>' },
    DataTable: { inheritAttrs: false, props: ['data'], template: '<div v-for="row in data" :key="row.id"><slot name="cell-name" :row="row" :value="row.name" /><slot name="cell-actions" :row="row" /></div>' }
  } } })
}

beforeEach(() => {
  localStorage.clear()
  list.mockReset().mockResolvedValue({ items: [account], total: 1, page: 1, page_size: 20, pages: 1 })
  getById.mockReset().mockResolvedValue(account)
  consoleActions.mockClear()
})

describe('account page control integration', () => {
  it('keeps original branding and opens the editor from the logo icon and original edit action without registering Console actions', async () => {
    const wrapper = mountPage()
    await flushPromises()
    expect(consoleActions).not.toHaveBeenCalled()
    expect(wrapper.findComponent({ name: 'ProviderBrandIcon' }).props('logoUrl')).toBe(account.extra.custom_logo_url)
    await wrapper.get('[data-testid="account-logo-action"]').trigger('click')
    await flushPromises()
    expect(getById).toHaveBeenCalledWith(101)
    const edit = wrapper.findComponent({ name: 'EditAccountModal' })
    expect(edit.props('show')).toBe(true)
    edit.vm.$emit('close')
    await flushPromises()
    expect(edit.props('show')).toBe(false)
    await wrapper.findAll('button').find(button => button.text() === 'common.edit')!.trigger('click')
    await flushPromises()
    expect(edit.props('show')).toBe(true)
    expect(edit.props('account')).toEqual(account)
    wrapper.unmount()
  })

  it('treats auto refresh as configuration, preserving its dropdown and saved interval without fake loading', async () => {
    localStorage.setItem('account-auto-refresh', JSON.stringify({ enabled: true, interval_seconds: 15 }))
    const wrapper = mountPage()
    await flushPromises()
    const control = wrapper.get('[title="admin.accounts.autoRefresh"]')
    expect(control.find('.animate-spin').exists()).toBe(false)
    expect(control.attributes('aria-expanded')).toBe('false')
    await control.trigger('click')
    expect(control.attributes('aria-expanded')).toBe('true')
    const interval = wrapper.findAll('.dropdown-item').find(button => button.text() === 'admin.accounts.refreshInterval30s')!
    await interval.trigger('click')
    expect(JSON.parse(localStorage.getItem('account-auto-refresh')!)).toEqual({ enabled: true, interval_seconds: 30 })
    await control.trigger('keydown', { key: 'Escape' })
    expect(control.attributes('aria-expanded')).toBe('false')
    wrapper.unmount()
  })
})
