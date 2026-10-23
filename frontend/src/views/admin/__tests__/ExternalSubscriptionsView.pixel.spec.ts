import { beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, shallowMount } from '@vue/test-utils'
import ExternalSubscriptionsView from '../ExternalSubscriptionsView.vue'

const api = vi.hoisted(() => ({
  listProviders: vi.fn().mockResolvedValue([]),
  getDisplayStatuses: vi.fn().mockResolvedValue([]),
  createProvider: vi.fn().mockResolvedValue({}),
  subscribeDisplayStatuses: vi.fn(() => () => {}),
}))

vi.mock('@/api/admin/externalSubscriptions', () => ({ default: api }))
vi.mock('@/stores/app', () => ({ useAppStore: () => ({ showError: vi.fn(), showSuccess: vi.fn() }) }))
vi.mock('vue-i18n', async importOriginal => {
  const actual = await importOriginal<typeof import('vue-i18n')>()
  const { ref } = await import('vue')
  return { ...actual, useI18n: () => ({ t: (key: string) => key, locale: ref('zh-CN') }) }
})

describe('Pixel access token form', () => {
  beforeEach(() => { vi.clearAllMocks() })

  it('submits the Pixel preset with an access token and no refresh token or user id', async () => {
    const wrapper = shallowMount(ExternalSubscriptionsView, {
      global: {
        stubs: {
          AppLayout: { template: '<div><slot /></div>' },
          TablePageLayout: { template: '<div><slot name="filters" /><slot name="table" /></div>' },
          BaseDialog: { props: ['show'], template: '<div v-if="show"><slot /><slot name="footer" /></div>' },
        },
      },
    })
    await flushPromises()
    await wrapper.get('[data-testid="admin-external-subscriptions-button-open-create-dialog"]').trigger('click')
    await wrapper.get('[data-testid="admin-external-subscriptions-button-apply-preset-pixel-access-token"]').trigger('click')
    expect(wrapper.text()).toContain('访问令牌')
    expect(wrapper.find('[data-testid="admin-external-subscriptions-input-form-refresh-token"]').exists()).toBe(false)
    expect(wrapper.find('[data-testid="admin-external-subscriptions-input-form-user-id"]').exists()).toBe(false)
    expect(wrapper.get<HTMLInputElement>('[data-testid="admin-external-subscriptions-input-form-api-base-url"]').element.value).toBe('https://api.ai-pixel.online')
    await wrapper.get('[data-testid="admin-external-subscriptions-input-form-api-token"]').setValue('pat-pixel-test')
    await wrapper.get('#external-subscription-form').trigger('submit')
    await flushPromises()
    expect(api.createProvider).toHaveBeenCalledWith(expect.objectContaining({
      id: 'pixel', name: 'PixelAPI', scheme: 'pixel_access_token',
      api_base_url: 'https://api.ai-pixel.online', api_token: 'pat-pixel-test', refresh_token: '', user_id: '',
    }))
    expect(api.createProvider.mock.calls[0][0]).not.toHaveProperty('template')
    expect(api.createProvider.mock.calls[0][0]).not.toHaveProperty('balance_strategy')
    wrapper.unmount()
  })

  it('submits the ModelFlare preset with browser Cookie and User ID quota credentials', async () => {
    const wrapper = shallowMount(ExternalSubscriptionsView, {
      global: {
        stubs: {
          AppLayout: { template: '<div><slot /></div>' },
          TablePageLayout: { template: '<div><slot name="filters" /><slot name="table" /></div>' },
          BaseDialog: { props: ['show'], template: '<div v-if="show"><slot /><slot name="footer" /></div>' },
        },
      },
    })
    await flushPromises()
    await wrapper.get('[data-testid="admin-external-subscriptions-button-open-create-dialog"]').trigger('click')
    await wrapper.get('[data-testid="admin-external-subscriptions-button-apply-preset-modelflare"]').trigger('click')
    expect(wrapper.text()).toContain('ModelFlare')
    expect(wrapper.text()).toContain('浏览器登录 Cookie')
    expect(wrapper.find('[data-testid="admin-external-subscriptions-input-form-refresh-token"]').exists()).toBe(false)
    expect(wrapper.find('[data-testid="admin-external-subscriptions-input-form-user-id"]').exists()).toBe(true)
    expect(wrapper.get<HTMLInputElement>('[data-testid="admin-external-subscriptions-input-form-user-id"]').element.required).toBe(true)
    expect(wrapper.get<HTMLInputElement>('[data-testid="admin-external-subscriptions-input-form-api-base-url"]').element.value).toBe('https://modelflare.dev')
    await wrapper.get('[data-testid="admin-external-subscriptions-input-form-api-token"]').setValue('session=modelflare-session')
    await wrapper.get('[data-testid="admin-external-subscriptions-input-form-user-id"]').setValue('mf-user-123')
    await wrapper.get('#external-subscription-form').trigger('submit')
    await flushPromises()
    expect(api.createProvider).toHaveBeenCalledWith(expect.objectContaining({
      id: 'modelflare', name: 'ModelFlare', scheme: 'modelflare_cookie_user',
      api_base_url: 'https://modelflare.dev', api_token: 'session=modelflare-session', user_id: 'mf-user-123', refresh_token: '',
    }))
    expect(api.createProvider.mock.calls[0][0]).not.toHaveProperty('template')
    expect(api.createProvider.mock.calls[0][0]).not.toHaveProperty('balance_strategy')
    wrapper.unmount()
  })
})


describe('Heju API key setup', () => {
  it('submits a model key without account management credentials', async () => {
    api.listProviders.mockResolvedValue([])
    api.getDisplayStatuses.mockResolvedValue([])
    const wrapper = shallowMount(ExternalSubscriptionsView, {
      global: { stubs: {
        AppLayout: { template: '<div><slot /></div>' },
        TablePageLayout: { template: '<div><slot name="filters" /><slot name="table" /></div>' },
        BaseDialog: { props: ['show'], template: '<div v-if="show"><slot /><slot name="footer" /></div>' },
      } },
    })
    await flushPromises()
    await wrapper.get('[data-testid="admin-external-subscriptions-button-open-create-dialog"]').trigger('click')
    await wrapper.get('[data-testid="admin-external-subscriptions-button-apply-preset-heju-api-key"]').trigger('click')
    expect(wrapper.find('[data-testid="admin-external-subscriptions-input-form-refresh-token"]').exists()).toBe(false)
    expect(wrapper.find('[data-testid="admin-external-subscriptions-input-form-user-id"]').exists()).toBe(false)
    await wrapper.get('[data-testid="admin-external-subscriptions-input-form-api-token"]').setValue('sk-heju-test')
    await wrapper.get('#external-subscription-form').trigger('submit')
    await flushPromises()
    expect(api.createProvider).toHaveBeenCalledWith(expect.objectContaining({
      id: 'hejuapi', scheme: 'heju_api_key', api_base_url: 'https://www.hejuapi.com',
      api_token: 'sk-heju-test', user_id: '', refresh_token: '',
    }))
    wrapper.unmount()
  })
})


it('renders an unlimited Heju key separately from the account wallet', async () => {
  api.listProviders.mockResolvedValue([])
  api.getDisplayStatuses.mockResolvedValue([{
    provider: 'heju', name: '合聚 API', scheme: 'heju_api_key', template: 'heju_api_key',
    balance_strategy: 'auto', enabled: true, configured: true, api_token_configured: true,
    refresh_token_configured: false, match_keywords: ['heju'], sort_order: 66,
    currency: 'USD', site_url: 'https://www.hejuapi.com', remaining_usd: 29.032322,
    used_usd: 0, active_count: 0, subscriptions: [],
    token_quota: { unlimited: true, used_usd: 30.960016 },
  }])
  const wrapper = shallowMount(ExternalSubscriptionsView, {
    global: { stubs: {
      AppLayout: { template: '<div><slot /></div>' },
      TablePageLayout: { template: '<div><slot name="filters" /><slot name="table" /></div>' },
    } },
  })
  await flushPromises()
  expect(wrapper.text()).toContain('账号余额')
  expect(wrapper.text()).toContain('$29.03')
  expect(wrapper.text()).toContain('Key 累计消耗')
  expect(wrapper.text()).toContain('$30.96')
  expect(wrapper.get('[data-testid="heju-key-quota"]').text()).toBe('不限额')
  expect(wrapper.find('[data-testid="external-subscription-quota-progress"]').exists()).toBe(false)
  wrapper.unmount()
  api.getDisplayStatuses.mockResolvedValue([])
})
