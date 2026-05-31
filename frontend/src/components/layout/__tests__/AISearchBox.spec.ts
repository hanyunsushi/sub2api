import { mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { nextTick } from 'vue'

import AISearchBox from '../AISearchBox.vue'

vi.mock('@cloudflare/ai-search-snippet', () => ({}))

const getSnippetConfig = vi.hoisted(() => vi.fn())
vi.mock('@/api/aiSearch', () => ({
  default: { getSnippetConfig },
}))

describe('AISearchBox chat panel interactions', () => {
  beforeEach(() => {
    getSnippetConfig.mockReset()
    getSnippetConfig.mockResolvedValue({
      configured: true,
      api_url: '/api/v1/ai-search/public',
      instance_id: 'ai-search',
      namespace: 'default',
    })
  })

  afterEach(() => {
    document.body.classList.remove('ai-search-locked')
  })

  it('opens a centered chat panel only after clicking the resident trigger', async () => {
    const wrapper = mount(AISearchBox, { attachTo: document.body })
    await nextTick()

    expect(document.querySelector('[data-testid="ai-search-overlay"]')).toBeNull()

    await wrapper.get('[data-testid="ai-search-trigger"]').trigger('click')
    await nextTick()

    expect(document.querySelector('[data-testid="ai-search-overlay"]')).not.toBeNull()
    expect(document.querySelector('chat-page-snippet')).not.toBeNull()
    expect(document.body.classList.contains('ai-search-locked')).toBe(true)
    wrapper.unmount()
  })

  it('closes when clicking the overlay backdrop outside the panel', async () => {
    const wrapper = mount(AISearchBox, { attachTo: document.body })
    await nextTick()
    await wrapper.get('[data-testid="ai-search-trigger"]').trigger('click')
    await nextTick()

    const overlay = document.querySelector('[data-testid="ai-search-overlay"]') as HTMLElement
    overlay.dispatchEvent(new Event('pointerdown', { bubbles: true }))
    await nextTick()

    expect(document.querySelector('[data-testid="ai-search-overlay"]')).toBeNull()
    expect(document.body.classList.contains('ai-search-locked')).toBe(false)
    wrapper.unmount()
  })

  it('closes on Escape and via the close button', async () => {
    const wrapper = mount(AISearchBox, { attachTo: document.body })
    await nextTick()

    await wrapper.get('[data-testid="ai-search-trigger"]').trigger('click')
    await nextTick()
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))
    await nextTick()
    expect(document.querySelector('[data-testid="ai-search-overlay"]')).toBeNull()

    await wrapper.get('[data-testid="ai-search-trigger"]').trigger('click')
    await nextTick()
    const closeButton = document.querySelector('.ai-search-panel-close') as HTMLElement
    closeButton.click()
    await nextTick()
    expect(document.querySelector('[data-testid="ai-search-overlay"]')).toBeNull()
    wrapper.unmount()
  })

  it('swallows Enter on the chat snippet while an IME composition is active', async () => {
    const wrapper = mount(AISearchBox, { attachTo: document.body })
    await nextTick()
    await wrapper.get('[data-testid="ai-search-trigger"]').trigger('click')
    await nextTick()
    await nextTick()

    const chat = document.querySelector('[data-testid="ai-search-chat"]') as HTMLElement
    expect(chat).not.toBeNull()

    // Enter pressed while composing (isComposing) must not reach the snippet's
    // own keydown handler, so it cannot submit the half-typed input.
    const composing = new KeyboardEvent('keydown', {
      key: 'Enter',
      bubbles: true,
      cancelable: true,
    })
    Object.defineProperty(composing, 'isComposing', { value: true })
    const composingStop = vi.spyOn(composing, 'stopImmediatePropagation')
    chat.dispatchEvent(composing)
    expect(composingStop).toHaveBeenCalledTimes(1)

    // A normal Enter (composition finished) is left untouched so the snippet
    // can send the message as usual.
    const committed = new KeyboardEvent('keydown', {
      key: 'Enter',
      bubbles: true,
      cancelable: true,
    })
    const committedStop = vi.spyOn(committed, 'stopImmediatePropagation')
    chat.dispatchEvent(committed)
    expect(committedStop).not.toHaveBeenCalled()

    wrapper.unmount()
  })
})
