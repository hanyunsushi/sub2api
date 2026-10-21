import { describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import AccountTableActions from '../AccountTableActions.vue'
import RefreshButton from '@/components/common/RefreshButton.vue'

vi.mock('vue-i18n', () => ({ useI18n: () => ({ t: (key: string) => key }) }))
vi.mock('@/runtime/environment', () => ({ isMicrofrontend: () => true }))

describe('account page actions in Console', () => {
  it('keeps refresh, create and tool slots in the page and ties refresh loading to the real request', async () => {
    const wrapper = mount(AccountTableActions, { props: { loading: false }, slots: { after: '<span>page tools</span>' } })
    expect(wrapper.text()).toContain('page tools')
    expect(wrapper.text()).toContain('admin.accounts.createAccount')
    const refresh = wrapper.getComponent(RefreshButton)
    await refresh.get('button').trigger('click')
    expect(wrapper.emitted('refresh')).toHaveLength(1)
    await wrapper.get('.btn-primary').trigger('click')
    expect(wrapper.emitted('create')).toHaveLength(1)
    await wrapper.setProps({ loading: true })
    expect(refresh.get('button').attributes('aria-busy')).toBe('true')
    expect(refresh.get<HTMLButtonElement>('button').element.disabled).toBe(true)
    await refresh.get('button').trigger('click')
    expect(wrapper.emitted('refresh')).toHaveLength(1)
  })
})
