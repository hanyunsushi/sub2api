import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import CodexStatusBadge from '@/components/codex/CodexStatusBadge.vue'

describe('CodexStatusBadge', () => {
  it('renders the active status with the scoped status class', () => {
    const wrapper = mount(CodexStatusBadge, {
      props: {
        status: 'active',
      },
    })

    expect(wrapper.text()).toContain('Active')
    expect(wrapper.classes()).toContain('codex-status-badge--active')
  })

  it('renders failed status details when a message is provided', () => {
    const wrapper = mount(CodexStatusBadge, {
      props: {
        status: 'failed',
        message: 'refresh token rejected',
      },
    })

    expect(wrapper.text()).toContain('Failed')
    expect(wrapper.attributes('title')).toBe('refresh token rejected')
    expect(wrapper.classes()).toContain('codex-status-badge--failed')
  })

  it('allows callers to provide localized labels', () => {
    const wrapper = mount(CodexStatusBadge, {
      props: {
        status: 'active',
        label: '活跃',
      },
    })

    expect(wrapper.text()).toContain('活跃')
  })

  it('falls back to unknown for unsupported values', () => {
    const wrapper = mount(CodexStatusBadge, {
      props: {
        status: 'paused' as never,
      },
    })

    expect(wrapper.text()).toContain('Unknown')
    expect(wrapper.classes()).toContain('codex-status-badge--unknown')
  })
})
