import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import RouteSwitch from '../RouteSwitch.vue'

describe('RouteSwitch keyboard navigation', () => {
  it('selects original values, wraps focus and releases its observer', async () => {
    const disconnect = vi.fn()
    vi.stubGlobal('ResizeObserver', class { observe() {} disconnect = disconnect })
    const scroll = vi.fn()
    const previous = HTMLElement.prototype.scrollIntoView
    HTMLElement.prototype.scrollIntoView = scroll
    const wrapper = mount(RouteSwitch, {
      attachTo: document.body,
      props: { modelValue: 'v2', label: '监控管理', options: [{ value: 'v2', label: 'V2 数据监控配置' }, { value: 'legacy', label: 'V1 主动探测' }] },
    })
    try {
      const tabs = wrapper.findAll('button')
      tabs[0].element.focus()
      await tabs[0].trigger('keydown', { key: 'ArrowRight' })
      expect(document.activeElement).toBe(tabs[1].element)
      expect(wrapper.emitted('update:modelValue')?.at(-1)).toEqual(['legacy'])
      await wrapper.setProps({ modelValue: 'legacy' })
      expect(tabs[1].attributes('aria-selected')).toBe('true')
      expect(tabs[1].attributes('tabindex')).toBe('0')
      await tabs[1].trigger('keydown', { key: 'ArrowRight' })
      expect(document.activeElement).toBe(tabs[0].element)
      expect(wrapper.emitted('update:modelValue')?.at(-1)).toEqual(['v2'])
      await tabs[0].trigger('keydown', { key: 'End' })
      expect(document.activeElement).toBe(tabs[1].element)
      expect(scroll).toHaveBeenCalled()
    } finally {
      wrapper.unmount()
      HTMLElement.prototype.scrollIntoView = previous
      vi.unstubAllGlobals()
    }
    expect(disconnect).toHaveBeenCalledOnce()
  })
})
