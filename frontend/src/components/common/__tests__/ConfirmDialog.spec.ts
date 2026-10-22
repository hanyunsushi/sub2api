import { afterEach, describe, expect, it, vi } from 'vitest'
import { enableAutoUnmount, mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import ConfirmDialog from '../ConfirmDialog.vue'
import BaseDialog from '../BaseDialog.vue'
import FeedbackSurface from '../feedback/FeedbackSurface.vue'

const motionPreference = vi.hoisted(() => ({ reduced: false }))
vi.mock('motion/react', async importOriginal => ({
  ...await importOriginal<typeof import('motion/react')>(),
  useReducedMotion: () => motionPreference.reduced
}))
vi.mock('vue-i18n', () => ({ useI18n: () => ({ t: (key: string) => key }) }))

enableAutoUnmount(afterEach)
afterEach(() => { motionPreference.reduced = false })

function openConfirm(props = {}) {
  return mount(ConfirmDialog, {
    attachTo: document.body,
    props: { show: true, title: 'Confirm removal', message: 'Keep the original warning.', ...props },
    slots: { default: '<p data-confirm-detail>Original slot detail</p>' }
  })
}

const panel = () => document.body.querySelector<HTMLElement>('[data-slot="dialog-panel"]')!
const click = (selector: string) => document.body.querySelector<HTMLButtonElement>(selector)!.click()
const escape = () => document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true }))

describe('real ConfirmDialog feedback integration', () => {
  it('passes fade-scale through both shared components and renders no flip or blur', async () => {
    const wrapper = openConfirm()
    await nextTick()
    expect(wrapper.getComponent(BaseDialog).props()).toMatchObject({ width: 'narrow', animation: 'fade-scale' })
    expect(wrapper.getComponent(FeedbackSurface).props('animation')).toBe('fade-scale')
    expect(panel().style.transform).toBe('scale(0.95)')
    expect(panel().style.filter).toBe('none')
    expect(document.body.querySelector<HTMLElement>('[data-slot="dialog-backdrop"]')!.style.filter).toBe('none')
    expect(panel().textContent).toContain('Keep the original warning.')
    expect(panel().querySelector('[data-confirm-detail]')?.textContent).toBe('Original slot detail')
  })

  it('keeps ordinary BaseDialog on the original source animation', () => {
    const wrapper = mount(BaseDialog, { props: { show: true, title: 'Original modal' } })
    expect(wrapper.props('animation')).toBe('source')
    expect(wrapper.getComponent(FeedbackSurface).props('animation')).toBe('source')
    expect(panel().style.transform).toBe('perspective(500px) rotateX(-20deg) scale(0.8)')
    expect(panel().style.filter).toBe('blur(4px)')
  })

  it('keeps translated labels and emits confirm once without changing the owner show state', async () => {
    const wrapper = openConfirm()
    await nextTick()
    expect(panel().querySelector('.kreepai-confirm-primary')?.textContent?.trim()).toBe('common.confirm')
    expect(panel().querySelector('.kreepai-confirm-cancel')?.textContent?.trim()).toBe('common.cancel')
    click('.kreepai-confirm-primary')
    expect(wrapper.emitted('confirm')).toHaveLength(1)
    expect(wrapper.emitted('cancel')).toBeUndefined()
    expect(wrapper.props('show')).toBe(true)
  })

  it('preserves custom risk labels, danger styling and the original cancel action', async () => {
    const wrapper = openConfirm({ danger: true, confirmText: 'Delete permanently', cancelText: 'Keep account' })
    await nextTick()
    expect(panel().querySelector('.kreepai-confirm-primary')?.textContent?.trim()).toBe('Delete permanently')
    expect(panel().querySelector('.kreepai-confirm-primary')?.classList.contains('bg-red-600')).toBe(true)
    expect(panel().querySelector('.kreepai-confirm-cancel')?.textContent?.trim()).toBe('Keep account')
    click('.kreepai-confirm-cancel')
    expect(wrapper.emitted('cancel')).toHaveLength(1)
    expect(wrapper.emitted('confirm')).toBeUndefined()
  })

  it('retains the close control, accessible title and modal semantics', async () => {
    const wrapper = openConfirm()
    await nextTick()
    const dialog = document.body.querySelector<HTMLElement>('[role="dialog"]')!
    expect(dialog.getAttribute('aria-modal')).toBe('true')
    expect(document.getElementById(dialog.getAttribute('aria-labelledby')!)?.textContent).toBe('Confirm removal')
    click('[aria-label="Close modal"]')
    expect(wrapper.emitted('cancel')).toHaveLength(1)
  })

  it('keeps Escape on the topmost confirmation and protects the underlying modal', async () => {
    const parent = mount(BaseDialog, { props: { show: true, title: 'Parent modal' } })
    const wrapper = openConfirm()
    escape()
    await vi.waitFor(() => expect(wrapper.emitted('cancel')).toHaveLength(1))
    expect(parent.emitted('close')).toBeUndefined()
    await wrapper.setProps({ show: false })
    await vi.waitFor(() => expect(document.body.querySelectorAll('[role="dialog"]')).toHaveLength(1))
    escape()
    await vi.waitFor(() => expect(parent.emitted('close')).toHaveLength(1))
  })

  it('does not show a panel until the owning page opens it', async () => {
    const wrapper = openConfirm({ show: false })
    expect(document.body.querySelector('[role="dialog"]')).toBeNull()
    await wrapper.setProps({ show: true })
    expect(panel().style.transform).toBe('scale(0.95)')
  })

  it('removes scale, blur and perspective under reduced motion', async () => {
    motionPreference.reduced = true
    openConfirm()
    await nextTick()
    expect(panel().style.transform).toBe('none')
    expect(panel().style.filter).toBe('none')
    expect(panel().style.opacity).toBe('1')
    expect(document.body.querySelector<HTMLElement>('[data-slot="dialog-backdrop"]')!.style.filter).toBe('none')
  })
})
