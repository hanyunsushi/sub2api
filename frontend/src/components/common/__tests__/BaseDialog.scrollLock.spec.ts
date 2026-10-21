import { afterEach, describe, expect, it, vi } from 'vitest'
import { enableAutoUnmount, mount } from '@vue/test-utils'
import BaseDialog from '../BaseDialog.vue'

enableAutoUnmount(afterEach)

function dialog(show = true) {
  return mount(BaseDialog, { props: { show, title: 'Details' }, global: { stubs: { Icon: true } } })
}

const locked = () => document.documentElement.style.overflow === 'hidden'

describe('dialog body scroll lock', async () => {
  it('keeps the body locked when a hidden sibling mounts or unmounts', async () => {
    dialog()
    const hidden = dialog(false)
    await vi.waitFor(() => expect(locked()).toBe(true))
    hidden.unmount()
    await vi.waitFor(() => expect(locked()).toBe(true))
  })

  it('keeps the lock until the last visible dialog closes', async () => {
    const first = dialog()
    const second = dialog()
    await second.setProps({ show: false })
    await vi.waitFor(() => expect(locked()).toBe(true))
    await first.setProps({ show: false })
    await vi.waitFor(() => expect(locked()).toBe(false))
  })

  it('keeps the lock until the last visible dialog unmounts', async () => {
    const first = dialog()
    const second = dialog()
    second.unmount()
    await vi.waitFor(() => expect(locked()).toBe(true))
    first.unmount()
    await vi.waitFor(() => expect(locked()).toBe(false))
  })

  it('releases the lock after repeated open and close cycles', async () => {
    const wrapper = dialog(false)
    await vi.waitFor(() => expect(locked()).toBe(false))
    await wrapper.setProps({ show: true })
    await vi.waitFor(() => expect(locked()).toBe(true))
    await wrapper.setProps({ show: false })
    await vi.waitFor(() => expect(locked()).toBe(false))
    await wrapper.setProps({ show: true })
    wrapper.unmount()
    await vi.waitFor(() => expect(locked()).toBe(false))
  })
})
