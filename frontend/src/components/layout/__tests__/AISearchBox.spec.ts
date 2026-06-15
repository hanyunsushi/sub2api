import { flushPromises, mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia, type Pinia } from 'pinia'
import { nextTick } from 'vue'

import AISearchBox from '../AISearchBox.vue'
import AISearchPanel from '../AISearchPanel.vue'

const authMocks = vi.hoisted(() => ({
  issueCreepeeSSOTicket: vi.fn()
}))

vi.mock('@/api/auth', () => ({
  authAPI: {
    issueCreepeeSSOTicket: authMocks.issueCreepeeSSOTicket
  }
}))

describe('Creepee Obsidian bridge panel interactions', () => {
  let pinia: Pinia

  beforeEach(() => {
    pinia = createPinia()
    setActivePinia(pinia)
    authMocks.issueCreepeeSSOTicket.mockResolvedValue({
      ticket: 'cpsso_test_ticket',
      expires_in: 90
    })
  })

  afterEach(() => {
    vi.restoreAllMocks()
    document.body.classList.remove('ai-search-panel-open')
    document.querySelectorAll('[data-testid="ai-search-sidecar"]').forEach((node) => node.remove())
  })

  it('opens a right-side Creepee workspace with the Obsidian bridge iframe', async () => {
    const mountOptions = { attachTo: document.body, global: { plugins: [pinia] } }
    const triggerWrapper = mount(AISearchBox, mountOptions)
    const panelWrapper = mount(AISearchPanel, mountOptions)
    await nextTick()
    await flushPromises()

    const closedSidecar = document.querySelector('[data-testid="ai-search-sidecar"]') as HTMLElement
    expect(closedSidecar).not.toBeNull()
    expect(closedSidecar.dataset.open).toBe('false')
    expect(closedSidecar.getAttribute('aria-hidden')).toBe('true')
    expect(document.body.classList.contains('ai-search-panel-open')).toBe(false)
    expect(triggerWrapper.get('[data-testid="ai-search-trigger"]').attributes('aria-label')).toBe('Ask Creepee')
    expect(triggerWrapper.get('[data-testid="ai-search-trigger"]').text()).toContain('Ask Creepee')

    await triggerWrapper.get('[data-testid="ai-search-trigger"]').trigger('click')
    await nextTick()

    expect((document.querySelector('[data-testid="ai-search-sidecar"]') as HTMLElement).dataset.open).toBe('true')
    expect(document.querySelector('[data-testid="ai-search-sidecar"]')?.getAttribute('aria-hidden')).toBe('false')
    expect(document.querySelector('[data-testid="ai-search-panel"]')).not.toBeNull()
    expect(document.querySelector('[data-testid="creepee-avatar-canvas"]')).not.toBeNull()
    expect(document.querySelector('.ai-search-trigger-avatar')).not.toBeNull()
    expect(document.querySelector('chat-page-snippet')).toBeNull()
    const frame = document.querySelector<HTMLIFrameElement>('[data-testid="obsidian-bridge-frame"]')
    expect(frame).not.toBeNull()
    expect(frame?.getAttribute('src')).toBe('http://127.0.0.1:43110/')
    expect(frame?.getAttribute('title')).toBe('Creepee Obsidian Codex Bridge')
    expect(document.querySelector('.ai-search-panel-title')?.textContent).toContain('Creepee')
    expect(document.querySelector('.ai-search-panel-subtitle')?.textContent).toContain('Obsidian Codex Bridge')
    expect(document.querySelector<HTMLImageElement>('.ai-search-panel-avatar')?.getAttribute('src')).toBe('/brand/claudecode-color.png')
    expect(document.body.classList.contains('ai-search-panel-open')).toBe(true)
    triggerWrapper.unmount()
    panelWrapper.unmount()
  })

  it('sends a one-time Sub2 SSO ticket to the bridge iframe with postMessage only', async () => {
    const mountOptions = { attachTo: document.body, global: { plugins: [pinia] } }
    const triggerWrapper = mount(AISearchBox, mountOptions)
    const panelWrapper = mount(AISearchPanel, mountOptions)
    await nextTick()

    const frame = document.querySelector<HTMLIFrameElement>('[data-testid="obsidian-bridge-frame"]')
    expect(frame).not.toBeNull()
    const bridgeWindow = { postMessage: vi.fn() }
    Object.defineProperty(frame, 'contentWindow', {
      configurable: true,
      value: bridgeWindow
    })

    await triggerWrapper.get('[data-testid="ai-search-trigger"]').trigger('click')
    await frame?.dispatchEvent(new Event('load'))
    await flushPromises()

    expect(authMocks.issueCreepeeSSOTicket).toHaveBeenCalledTimes(1)
    expect(bridgeWindow.postMessage).toHaveBeenCalledWith({
      type: 'sub2api:creepee-sso',
      ticket: 'cpsso_test_ticket'
    }, 'http://127.0.0.1:43110')
    expect(frame?.getAttribute('src')).toBe('http://127.0.0.1:43110/')
    expect(frame?.getAttribute('src')).not.toContain('cpsso_test_ticket')

    window.dispatchEvent(new MessageEvent('message', {
      origin: 'http://127.0.0.1:43110',
      data: { type: 'obsidian-bridge:sso-complete' }
    }))
    await flushPromises()
    expect(authMocks.issueCreepeeSSOTicket).toHaveBeenCalledTimes(1)

    triggerWrapper.unmount()
    panelWrapper.unmount()
  })

  it('waits for the bridge ready message before issuing SSO when the frame loads early', async () => {
    const mountOptions = { attachTo: document.body, global: { plugins: [pinia] } }
    const triggerWrapper = mount(AISearchBox, mountOptions)
    const panelWrapper = mount(AISearchPanel, mountOptions)
    await nextTick()

    const frame = document.querySelector<HTMLIFrameElement>('[data-testid="obsidian-bridge-frame"]')
    expect(frame).not.toBeNull()
    const bridgeWindow = { postMessage: vi.fn() }
    Object.defineProperty(frame, 'contentWindow', {
      configurable: true,
      value: bridgeWindow
    })

    await triggerWrapper.get('[data-testid="ai-search-trigger"]').trigger('click')
    await nextTick()
    expect(authMocks.issueCreepeeSSOTicket).not.toHaveBeenCalled()

    window.dispatchEvent(new MessageEvent('message', {
      origin: 'http://127.0.0.1:43110',
      data: { type: 'obsidian-bridge:ready' }
    }))
    await flushPromises()

    expect(authMocks.issueCreepeeSSOTicket).toHaveBeenCalledTimes(1)
    expect(bridgeWindow.postMessage).toHaveBeenCalledWith({
      type: 'sub2api:creepee-sso',
      ticket: 'cpsso_test_ticket'
    }, 'http://127.0.0.1:43110')

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

    expect(document.querySelector('[data-testid="ai-search-sidecar"]')).not.toBeNull()
    triggerWrapper.unmount()
    await nextTick()

    expect(document.querySelector('[data-testid="ai-search-sidecar"]')).not.toBeNull()
    expect(document.body.classList.contains('ai-search-panel-open')).toBe(true)
    panelWrapper.unmount()
  })

  it('keeps the Obsidian bridge iframe resident across close and reopen cycles', async () => {
    const mountOptions = { attachTo: document.body, global: { plugins: [pinia] } }
    const triggerWrapper = mount(AISearchBox, mountOptions)
    const panelWrapper = mount(AISearchPanel, mountOptions)
    await nextTick()

    const initialFrame = document.querySelector('[data-testid="obsidian-bridge-frame"]')
    expect(initialFrame).not.toBeNull()

    await triggerWrapper.get('[data-testid="ai-search-trigger"]').trigger('click')
    await nextTick()
    document.querySelector<HTMLButtonElement>('.ai-search-panel-close')?.click()
    await nextTick()

    const closedSidecar = document.querySelector('[data-testid="ai-search-sidecar"]') as HTMLElement
    expect(closedSidecar).not.toBeNull()
    expect(closedSidecar.dataset.open).toBe('false')
    expect(document.querySelector('[data-testid="obsidian-bridge-frame"]')).toBe(initialFrame)

    await triggerWrapper.get('[data-testid="ai-search-trigger"]').trigger('click')
    await nextTick()
    expect(document.querySelector('[data-testid="obsidian-bridge-frame"]')).toBe(initialFrame)
    expect((document.querySelector('[data-testid="ai-search-sidecar"]') as HTMLElement).dataset.open).toBe('true')

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
    expect((document.querySelector('[data-testid="ai-search-sidecar"]') as HTMLElement).dataset.open).toBe('false')
    expect(document.querySelector('[data-testid="ai-search-sidecar"]')?.getAttribute('aria-hidden')).toBe('true')
    expect(document.body.classList.contains('ai-search-panel-open')).toBe(false)

    await triggerWrapper.get('[data-testid="ai-search-trigger"]').trigger('click')
    await nextTick()
    document.querySelector<HTMLButtonElement>('.ai-search-panel-close')?.click()
    await nextTick()
    expect((document.querySelector('[data-testid="ai-search-sidecar"]') as HTMLElement).dataset.open).toBe('false')
    expect(document.querySelector('[data-testid="ai-search-sidecar"]')?.getAttribute('aria-hidden')).toBe('true')
    expect(document.body.classList.contains('ai-search-panel-open')).toBe(false)
    triggerWrapper.unmount()
    panelWrapper.unmount()
  })
})
