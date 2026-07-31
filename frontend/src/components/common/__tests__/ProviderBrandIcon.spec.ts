import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'

import ProviderBrandIcon from '../ProviderBrandIcon.vue'

describe('ProviderBrandIcon', () => {
  it('uses the current A6 logo for the legacy custom URL', () => {
    const wrapper = mount(ProviderBrandIcon, {
      props: {
        provider: 'openai',
        logoUrl: 'https://a6api.com/brand/a6-logo-large-transparent-512.png',
      },
    })

    expect(wrapper.get('img.provider-brand-image-custom').attributes('src')).toBe(
      'https://a6api.com/logo.png',
    )
  })

  it('falls back to the provider icon when a custom logo fails', async () => {
    const wrapper = mount(ProviderBrandIcon, {
      props: {
        provider: 'openai',
        logoUrl: 'https://cdn.example.com/broken.png',
      },
    })

    await wrapper.get('img.provider-brand-image-custom').trigger('error')

    expect(wrapper.find('img.provider-brand-image-custom').exists()).toBe(false)
    expect(wrapper.find('img.provider-brand-image-system').exists()).toBe(true)
  })

  it('retries custom rendering when the logo URL changes', async () => {
    const wrapper = mount(ProviderBrandIcon, {
      props: {
        provider: 'openai',
        logoUrl: 'https://cdn.example.com/broken.png',
      },
    })

    await wrapper.get('img.provider-brand-image-custom').trigger('error')
    await wrapper.setProps({ logoUrl: 'https://cdn.example.com/replacement.png' })

    expect(wrapper.get('img.provider-brand-image-custom').attributes('src')).toBe(
      'https://cdn.example.com/replacement.png',
    )
  })
})
