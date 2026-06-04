import { mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia, type Pinia } from 'pinia'
import { nextTick } from 'vue'

import AISearchBox from '../AISearchBox.vue'
import AISearchPanel from '../AISearchPanel.vue'

vi.mock('@cloudflare/ai-search-snippet', () => {
  if (!customElements.get('chat-page-snippet')) {
    customElements.define(
      'chat-page-snippet',
      class ChatPageSnippetStub extends HTMLElement {
        connectedCallback() {
          if (!this.shadowRoot) this.attachShadow({ mode: 'open' })
          if (!this.shadowRoot || this.shadowRoot.querySelector('.chat-page-container')) return
          this.shadowRoot.innerHTML = `
            <div class="chat-page-container">
              <div class="chat-sidebar"></div>
              <div class="chat-main">
                <div class="chat-page-header-left">
                  <button class="toggle-sidebar-button" type="button"></button>
                </div>
                <div class="chat-page-content">
                  <div class="container"></div>
                </div>
              </div>
            </div>
          `
          const sidebar = this.shadowRoot.querySelector('.chat-sidebar')
          const toggleButton = this.shadowRoot.querySelector('.toggle-sidebar-button')
          toggleButton?.addEventListener('click', () => {
            sidebar?.classList.toggle('collapsed')
          })
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
  let pinia: Pinia

  beforeEach(() => {
    pinia = createPinia()
    setActivePinia(pinia)
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
    const mountOptions = { attachTo: document.body, global: { plugins: [pinia] } }
    const triggerWrapper = mount(AISearchBox, mountOptions)
    const panelWrapper = mount(AISearchPanel, mountOptions)
    await nextTick()

    expect(document.querySelector('[data-testid="ai-search-panel"]')).toBeNull()
    expect(triggerWrapper.get('[data-testid="ai-search-trigger"]').attributes('aria-label')).toBe('Creepee')
    expect(triggerWrapper.get('[data-testid="ai-search-trigger"]').text()).toContain('Creepee')
    expect(triggerWrapper.get('[data-testid="ai-search-trigger"]').text()).not.toContain('.ai')

    await triggerWrapper.get('[data-testid="ai-search-trigger"]').trigger('click')
    await nextTick()
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
    triggerWrapper.unmount()
    panelWrapper.unmount()
  })

  it('keeps the panel open when the header trigger unmounts during internal route changes', async () => {
    const mountOptions = { attachTo: document.body, global: { plugins: [pinia] } }
    const triggerWrapper = mount(AISearchBox, mountOptions)
    const panelWrapper = mount(AISearchPanel, mountOptions)
    await nextTick()

    await triggerWrapper.get('[data-testid="ai-search-trigger"]').trigger('click')
    await nextTick()
    await nextTick()

    expect(document.querySelector('[data-testid="ai-search-sidecar"]')).not.toBeNull()
    triggerWrapper.unmount()
    await nextTick()

    expect(document.querySelector('[data-testid="ai-search-sidecar"]')).not.toBeNull()
    expect(document.body.classList.contains('ai-search-panel-open')).toBe(true)
    panelWrapper.unmount()
  })

  it('injects Claude Code avatar and orange loading styles into the snippet shadow DOM', async () => {
    const mountOptions = { attachTo: document.body, global: { plugins: [pinia] } }
    const triggerWrapper = mount(AISearchBox, mountOptions)
    const panelWrapper = mount(AISearchPanel, mountOptions)
    await nextTick()
    await triggerWrapper.get('[data-testid="ai-search-trigger"]').trigger('click')
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
    triggerWrapper.unmount()
    panelWrapper.unmount()
  })

  it('collapses Cloudflare history into the built-in top-left button so chat keeps the panel width', async () => {
    const mountOptions = { attachTo: document.body, global: { plugins: [pinia] } }
    const triggerWrapper = mount(AISearchBox, mountOptions)
    const panelWrapper = mount(AISearchPanel, mountOptions)
    await nextTick()
    await triggerWrapper.get('[data-testid="ai-search-trigger"]').trigger('click')
    await nextTick()
    await nextTick()

    const chat = document.querySelector('[data-testid="ai-search-chat"]') as HTMLElement
    const shadow = chat.shadowRoot
    const sidebar = shadow?.querySelector('.chat-sidebar')
    const style = shadow?.querySelector('style[data-creepee-brand-style]')

    expect(sidebar?.classList.contains('collapsed')).toBe(true)
    expect(style?.textContent).toContain('.chat-sidebar')
    expect(style?.textContent).toContain('position: absolute !important;')
    expect(style?.textContent).toContain('.chat-main')
    expect(style?.textContent).toContain('width: 100% !important;')
    triggerWrapper.unmount()
    panelWrapper.unmount()
  })

  it('does not use an overlay backdrop for the docked sidecar', async () => {
    const mountOptions = { attachTo: document.body, global: { plugins: [pinia] } }
    const triggerWrapper = mount(AISearchBox, mountOptions)
    const panelWrapper = mount(AISearchPanel, mountOptions)
    await nextTick()
    await triggerWrapper.get('[data-testid="ai-search-trigger"]').trigger('click')
    await nextTick()

    expect(document.querySelector('[data-testid="ai-search-overlay"]')).toBeNull()
    expect(document.querySelector('[data-testid="ai-search-sidecar"]')).not.toBeNull()
    expect(document.body.classList.contains('ai-search-panel-open')).toBe(true)
    triggerWrapper.unmount()
    panelWrapper.unmount()
  })

  it('closes on Escape and via the close button', async () => {
    const mountOptions = { attachTo: document.body, global: { plugins: [pinia] } }
    const triggerWrapper = mount(AISearchBox, mountOptions)
    const panelWrapper = mount(AISearchPanel, mountOptions)
    await nextTick()

    await triggerWrapper.get('[data-testid="ai-search-trigger"]').trigger('click')
    await nextTick()
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))
    await nextTick()
    expect(document.querySelector('[data-testid="ai-search-sidecar"]')).toBeNull()
    expect(document.body.classList.contains('ai-search-panel-open')).toBe(false)

    await triggerWrapper.get('[data-testid="ai-search-trigger"]').trigger('click')
    await nextTick()
    const closeButton = document.querySelector('.ai-search-panel-close') as HTMLElement
    closeButton.click()
    await nextTick()
    expect(document.querySelector('[data-testid="ai-search-sidecar"]')).toBeNull()
    expect(document.body.classList.contains('ai-search-panel-open')).toBe(false)
    triggerWrapper.unmount()
    panelWrapper.unmount()
  })

  it('swallows Enter on the chat snippet while an IME composition is active', async () => {
    const mountOptions = { attachTo: document.body, global: { plugins: [pinia] } }
    const triggerWrapper = mount(AISearchBox, mountOptions)
    const panelWrapper = mount(AISearchPanel, mountOptions)
    await nextTick()
    await triggerWrapper.get('[data-testid="ai-search-trigger"]').trigger('click')
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

    triggerWrapper.unmount()
    panelWrapper.unmount()
  })
})
