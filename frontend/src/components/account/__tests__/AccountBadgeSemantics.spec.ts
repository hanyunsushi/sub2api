import { describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import GroupBadge from '@/components/common/GroupBadge.vue'
import PlatformTypeBadge from '@/components/common/PlatformTypeBadge.vue'
import AccountGroupsCell from '../AccountGroupsCell.vue'

vi.mock('vue-i18n', () => ({ useI18n: () => ({ t: (key: string) => key }) }))
vi.mock('@/stores/app', () => ({ useAppStore: () => ({ cachedPublicSettings: {} }) }))

const stubs = { ProviderBrandIcon: true, PlatformIcon: true, Icon: true }

describe('account identity, information and status boundaries', () => {
  it('uses information badges for OpenAI and Key, retaining the actual platform icon', () => {
    const wrapper = mount(PlatformTypeBadge, { props: { platform: 'openai', type: 'apikey' }, global: { stubs } })
    expect(wrapper.findAll('.badge-primary').map(badge => badge.text())).toEqual(['OpenAI', 'Key'])
    expect(wrapper.findComponent({ name: 'PlatformIcon' }).props('platform')).toBe('openai')
    expect(wrapper.find('.badge-success').exists()).toBe(false)
  })

  it('keeps privacy success, warning and failure distinct from provider and plan information', async () => {
    const wrapper = mount(PlatformTypeBadge, { props: { platform: 'openai', type: 'oauth', planType: 'plus', privacyMode: 'training_off' }, global: { stubs } })
    expect(wrapper.get('.badge-success').text()).toBe('Private')
    expect(wrapper.findAll('.badge-primary').map(badge => badge.text())).toEqual(['OpenAI', 'OAuth', 'Plus'])
    await wrapper.setProps({ privacyMode: 'training_set_cf_blocked' })
    expect(wrapper.get('.badge-warning').text()).toBe('CF')
    await wrapper.setProps({ privacyMode: 'training_set_failed', planType: 'abnormal' })
    expect(wrapper.findAll('.badge-danger').map(badge => badge.text())).toEqual(['admin.accounts.subscriptionAbnormal', 'Fail'])
  })

  it('preserves custom group branding, rates and expiration warnings independently of the information surface', async () => {
    const wrapper = mount(GroupBadge, { props: { name: 'OpenAI group', platform: 'openai', logoUrl: 'https://example.com/group.png', subscriptionType: 'subscription', rateMultiplier: 2, daysRemaining: 10 }, global: { stubs } })
    expect(wrapper.get('span.badge').classes()).toContain('badge-primary')
    expect(wrapper.findComponent({ name: 'ProviderBrandIcon' }).props('logoUrl')).toBe('https://example.com/group.png')
    expect(wrapper.find('.badge-warning').exists()).toBe(false)
    await wrapper.setProps({ daysRemaining: 5 })
    expect(wrapper.get('.badge-warning').text()).toBe('admin.users.daysRemaining')
    await wrapper.setProps({ daysRemaining: 0 })
    expect(wrapper.get('.badge-danger').text()).toBe('admin.users.expired')
    await wrapper.setProps({ alwaysShowRate: true, userRateMultiplier: 1.5 })
    expect(wrapper.text()).toContain('2x')
    expect(wrapper.text()).toContain('1.5x')
    expect(wrapper.find('.badge-danger').exists()).toBe(false)
  })

  it('passes original group logos in both the card and its complete list', async () => {
    const groups = Array.from({ length: 5 }, (_, index) => ({ id: index + 1, name: `Group ${index}`, platform: 'openai', logo_url: `https://example.com/${index}.png` }))
    const wrapper = mount(AccountGroupsCell, { props: { groups: groups as any }, global: { stubs: { GroupBadge: true, Teleport: true, Transition: false } } })
    expect(wrapper.findAllComponents(GroupBadge)).toHaveLength(3)
    await wrapper.get('button').trigger('click')
    expect(wrapper.findAllComponents(GroupBadge)).toHaveLength(8)
    expect(wrapper.findAllComponents(GroupBadge).slice(3).map(badge => badge.props('logoUrl'))).toEqual(groups.map(group => group.logo_url))
    wrapper.unmount()
  })
})
