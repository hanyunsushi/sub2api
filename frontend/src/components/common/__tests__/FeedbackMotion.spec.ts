import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { enableAutoUnmount, mount } from '@vue/test-utils'
import FeedbackSurface from '../feedback/FeedbackSurface.vue'

const observed = vi.hoisted(() => ({
  reduced: false,
  panel: {} as Record<string, unknown>,
  backdrop: {} as Record<string, unknown>
}))
vi.mock('motion/react', async importOriginal => ({
  ...await importOriginal<typeof import('motion/react')>(),
  useReducedMotion: () => observed.reduced
}))
vi.mock('../feedback/feedback-dialog-primitives', async importOriginal => {
  const original = await importOriginal<typeof import('../feedback/feedback-dialog-primitives')>()
  const { createElement } = await import('react')
  return {
    ...original,
    DialogPanel: (props: Parameters<typeof original.DialogPanel>[0]) => {
      observed.panel = props
      return createElement(original.DialogPanel, props)
    },
    DialogBackdrop: (props: Parameters<typeof original.DialogBackdrop>[0]) => {
      observed.backdrop = props
      return createElement(original.DialogBackdrop, props)
    }
  }
})

enableAutoUnmount(afterEach)
beforeEach(() => { observed.panel = {}; observed.backdrop = {} })
afterEach(() => { observed.reduced = false })

describe('feedback animation selection', () => {
  it('uses only opacity and .95 scale with 250ms easeOut entry and 200ms easeIn exit', async () => {
    mount(FeedbackSurface, { props: { show: true, modal: true, animation: 'fade-scale', label: 'Confirm' } })
    await vi.waitFor(() => expect(observed.panel.initial).toEqual({ opacity: 0, filter: 'none', transform: 'scale(0.95)' }))
    expect(observed.panel.animate).toEqual({ opacity: 1, filter: 'none', transform: 'scale(1)', transition: { duration: .25, ease: 'easeOut' } })
    expect(observed.panel.exit).toEqual({ opacity: 0, filter: 'none', transform: 'scale(0.95)', transition: { duration: .2, ease: 'easeIn' } })
    expect(observed.backdrop.initial).toEqual({ opacity: 0, filter: 'none' })
    expect(observed.backdrop.animate).toEqual({ opacity: 1, filter: 'none', transition: { duration: .25, ease: 'easeOut' } })
    expect(observed.backdrop.exit).toEqual({ opacity: 0, filter: 'none', transition: { duration: .2, ease: 'easeIn' } })
  })

  it('restores ordinary modal motion even when a historical caller requests source animation', async () => {
    mount(FeedbackSurface, { props: { show: true, modal: true, animation: 'source', label: 'Edit account' } })
    await vi.waitFor(() => expect(observed.panel.initial).toEqual({ opacity: 0, filter: 'none', transform: 'scale(0.95)' }))
    expect(observed.backdrop.initial).toEqual({ opacity: 0, filter: 'none' })
    expect(observed.panel.animate).not.toHaveProperty('rotateX')
  })

  it.each(['source', 'fade-scale'] as const)('makes %s immediate and flat under reduced motion', async animation => {
    observed.reduced = true
    mount(FeedbackSurface, { props: { show: true, modal: true, animation, label: 'Reduced motion' } })
    await vi.waitFor(() => expect(observed.panel.initial).toBe(false))
    expect(observed.panel.animate).toEqual({ opacity: 1, filter: 'none', transform: 'none' })
    expect(observed.panel.transition).toEqual({ duration: 0 })
    expect(observed.panel.exit).toEqual({ opacity: 0 })
    expect(observed.backdrop.initial).toBe(false)
    expect(observed.backdrop.transition).toEqual({ duration: 0 })
  })
})
