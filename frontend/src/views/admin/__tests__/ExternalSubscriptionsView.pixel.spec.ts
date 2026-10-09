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
      id: 'pixel', name: 'Pixel', template: 'pixel_access_token', balance_strategy: 'pixel_user_quota',
      api_base_url: 'https://api.ai-pixel.online', api_token: 'pat-pixel-test', refresh_token: '', user_id: '',
    }))
    wrapper.unmount()
  })
})
