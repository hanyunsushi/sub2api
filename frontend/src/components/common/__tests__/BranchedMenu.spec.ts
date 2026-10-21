import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import BranchedMenu from '../BranchedMenu.vue'

const items = [
  { label: 'Site', children: [{ value: 'general', label: 'General' }] },
  { label: 'Services', children: [{ value: 'backup', label: 'Backup' }] }
]

describe('settings secondary navigation', () => {
  it('opens only the first group and excludes folded items from keyboard order', async () => {
    const wrapper = mount(BranchedMenu, { props: { items, defaultActive: 'general' } })
    const buttons = wrapper.findAll('button')
    expect(buttons.map(button => button.attributes('type'))).toEqual(Array(4).fill('button'))
    expect(buttons[0].attributes('aria-expanded')).toBe('true')
    expect(buttons[1].attributes('aria-current')).toBe('true')
    expect(buttons[2].attributes('aria-expanded')).toBe('false')
    expect(buttons[3].attributes('tabindex')).toBe('-1')

    await buttons[2].trigger('click')
    expect(wrapper.emitted('select')).toBeUndefined()
    expect(wrapper.emitted('toggle')).toEqual([[1, true]])
    expect(buttons[3].attributes('tabindex')).toBe('0')

    await buttons[3].trigger('click')
    expect(wrapper.emitted('select')?.[0]?.[0]).toBe('backup')
    expect(buttons[3].attributes('aria-current')).toBe('true')
    expect(buttons[1].attributes('aria-current')).toBeUndefined()
    await buttons[2].trigger('click')
    expect(buttons[3].attributes('tabindex')).toBe('-1')
    wrapper.unmount()
  })

  it('supports an externally selected section using the existing default props', () => {
    const wrapper = mount(BranchedMenu, {
      props: { items, defaultActive: 'backup', defaultOpen: 1 }
    })
    const buttons = wrapper.findAll('button')
    expect(buttons[0].attributes('aria-expanded')).toBe('false')
    expect(buttons[2].attributes('aria-expanded')).toBe('true')
    expect(buttons[3].attributes('aria-current')).toBe('true')
    expect(buttons[3].attributes('tabindex')).toBe('0')
    wrapper.unmount()
  })
})
