import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'

import type { AccountPlatform } from '@/types'
import PlatformTypeBadge from '../PlatformTypeBadge.vue'

vi.mock('vue-i18n', async () => {
  const actual = await vi.importActual<typeof import('vue-i18n')>('vue-i18n')
  return {
    ...actual,
    useI18n: () => ({ t: (key: string) => key }),
  }
})

function mountPlan(platform: AccountPlatform, planType: string) {
  return mount(PlatformTypeBadge, {
    props: { platform, type: 'oauth', planType },
  })
}

describe('PlatformTypeBadge ChatGPT plan tiers', () => {
  it('labels pro / chatgptpro as Pro 200 as information', () => {
    for (const planType of ['pro', 'chatgptpro', 'PRO']) {
      const wrapper = mountPlan('openai', planType)

      expect(wrapper.text()).toContain('Pro 200')
      expect(wrapper.html()).toContain('badge-primary')
    }
  })

  it('labels prolite as Pro 100 as information', () => {
    for (const planType of ['prolite', 'PROLITE', 'pro_lite']) {
      const wrapper = mountPlan('openai', planType)

      expect(wrapper.text()).toContain('Pro 100')
      expect(wrapper.html()).toContain('badge-primary')
      expect(wrapper.text()).not.toContain('Pro 200')
    }
  })

  it('labels team as Business as information', () => {
    const wrapper = mountPlan('openai', 'team')

    expect(wrapper.text()).toContain('Business')
    expect(wrapper.html()).toContain('badge-primary')
  })

  it('labels self_serve_business_prolite as Business Premium as information', () => {
    for (const planType of ['self_serve_business_prolite', 'selfservebusinessprolite']) {
      const wrapper = mountPlan('openai', planType)

      expect(wrapper.text()).toContain('Business Premium')
      expect(wrapper.html()).toContain('badge-primary')
      expect(wrapper.text()).not.toContain('self_serve_business_prolite')
    }
  })

  it('keeps plus, free and abnormal labels unchanged', () => {
    const plus = mountPlan('openai', 'plus')
    expect(plus.text()).toContain('Plus')
    expect(plus.html()).toContain('badge-primary')

    const free = mountPlan('openai', 'free')
    expect(free.text()).toContain('Free')
    expect(free.html()).toContain('badge-primary')

    const abnormal = mountPlan('openai', 'abnormal')
    expect(abnormal.text()).toContain('admin.accounts.subscriptionAbnormal')
    expect(abnormal.html()).toContain('badge-danger')
  })

  it('falls back to the raw value for unknown plans', () => {
    const wrapper = mountPlan('openai', 'future_sku')

    expect(wrapper.text()).toContain('future_sku')
  })

  it('does not apply the ChatGPT tier naming to other platforms', () => {
    // Antigravity 的 Pro 与 Grok 的 pro 是各自产品线的档位，不能显示成 Pro 200。
    for (const platform of ['antigravity', 'grok'] as AccountPlatform[]) {
      const wrapper = mountPlan(platform, 'pro')

      expect(wrapper.text()).toContain('Pro')
      expect(wrapper.text()).not.toContain('Pro 200')
    }

    const antigravityTeam = mountPlan('antigravity', 'team')
    expect(antigravityTeam.text()).toContain('Team')
    expect(antigravityTeam.text()).not.toContain('Business')
  })
})

describe('new Codex subscription labels', () => {
  it.each([
    ['promax', 'Pro 500', 'badge-primary'],
    ['go', 'Go', ''],
    ['ent26', 'Enterprise', 'badge-primary'],
    ['enterprise_cbp_automation', 'Enterprise (Automation)', 'badge-primary'],
    ['self_serve_business_usage_based', 'Business', 'badge-primary'],
    ['business', 'Enterprise', 'badge-primary'],
    ['edu_plus', 'Edu Plus', 'badge-primary'],
    ['edu_pro', 'Edu Pro', 'badge-primary']
  ])('displays %s', (sku, label, color) => {
    const wrapper = mountPlan('openai', sku)
    expect(wrapper.text()).toContain(label)
    if (color) expect(wrapper.html()).toContain(color)
  })
})
