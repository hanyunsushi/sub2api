import { mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { nextTick } from 'vue'

import AISearchBox from '../AISearchBox.vue'

vi.mock('@cloudflare/ai-search-snippet', () => {
  if (!customElements.get('chat-page-snippet')) {
    customElements.define(
      'chat-page-snippet',
      class ChatPageSnippetStub extends HTMLElement {
        connectedCallback() {
          if (!this.shadowRoot) this.attachShadow({ mode: 'open' })
        }
      },
    )
  }
  return {}
})

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
    document.body.classList.remove('ai-search-panel-open')
  })

  it('opens a right-side Creepee workspace that pushes the page layout', async () => {
    const wrapper = mount(AISearchBox, { attachTo: document.body })
    await nextTick()

    expect(document.querySelector('[data-testid="ai-search-panel"]')).toBeNull()
    expect(wrapper.get('[data-testid="ai-search-trigger"]').attributes('aria-label')).toBe('Creepee')
    expect(wrapper.get('[data-testid="ai-search-trigger"]').text()).toContain('Creepee')
    expect(wrapper.get('[data-testid="ai-search-trigger"]').text()).not.toContain('.ai')

    await wrapper.get('[data-testid="ai-search-trigger"]').trigger('click')
    await nextTick()

    expect(document.querySelector('[data-testid="ai-search-sidecar"]')).not.toBeNull()
    expect(document.querySelector('[data-testid="ai-search-panel"]')).not.toBeNull()
    expect(document.querySelector('chat-page-snippet')).not.toBeNull()
    expect(document.querySelector('.ai-search-panel-title')?.textContent).toContain('Creepee')
    expect(document.querySelector('.ai-search-panel-title')?.textContent).not.toContain('.ai')
    expect(document.querySelector('.ai-search-panel-subtitle')?.textContent).toContain('智能助手')
    expect(document.querySelector<HTMLImageElement>('.ai-search-panel-avatar')?.getAttribute('src')).toBe('/brand/claudecode-color.png')
    expect(document.body.classList.contains('ai-search-panel-open')).toBe(true)
    expect(document.body.classList.contains('ai-search-locked')).toBe(false)
    wrapper.unmount()
  })

  it('injects Claude Code avatar and orange loading styles into the snippet shadow DOM', async () => {
    const wrapper = mount(AISearchBox, { attachTo: document.body })
    await nextTick()
    await wrapper.get('[data-testid="ai-search-trigger"]').trigger('click')
    await nextTick()
    await nextTick()

    const chat = document.querySelector('[data-testid="ai-search-chat"]') as HTMLElement
    const shadow = chat.shadowRoot
    await nextTick()

    const style = shadow?.querySelector('style[data-creepee-brand-style]')
    expect(style?.textContent).toContain('/brand/claudecode-color.png')
    expect(style?.textContent).toContain('.chat-message-assistant .chat-message-avatar')
    expect(style?.textContent).toContain('.chat-streaming .loading-text')
    expect(style?.textContent).toContain('#f6821f')
    wrapper.unmount()
  })

  it('does not use an overlay backdrop for the docked sidecar', async () => {
    const wrapper = mount(AISearchBox, { attachTo: document.body })
    await nextTick()
    await wrapper.get('[data-testid="ai-search-trigger"]').trigger('click')
    await nextTick()

    expect(document.querySelector('[data-testid="ai-search-overlay"]')).toBeNull()
    expect(document.querySelector('[data-testid="ai-search-sidecar"]')).not.toBeNull()
    expect(document.body.classList.contains('ai-search-panel-open')).toBe(true)
    wrapper.unmount()
  })

  it('closes on Escape and via the close button', async () => {
    const wrapper = mount(AISearchBox, { attachTo: document.body })
    await nextTick()

    await wrapper.get('[data-testid="ai-search-trigger"]').trigger('click')
    await nextTick()
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))
    await nextTick()
    expect(document.querySelector('[data-testid="ai-search-sidecar"]')).toBeNull()
    expect(document.body.classList.contains('ai-search-panel-open')).toBe(false)

    await wrapper.get('[data-testid="ai-search-trigger"]').trigger('click')
    await nextTick()
    const closeButton = document.querySelector('.ai-search-panel-close') as HTMLElement
    closeButton.click()
    await nextTick()
    expect(document.querySelector('[data-testid="ai-search-sidecar"]')).toBeNull()
    expect(document.body.classList.contains('ai-search-panel-open')).toBe(false)
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
