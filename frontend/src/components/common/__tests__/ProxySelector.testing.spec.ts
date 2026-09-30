import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { enableAutoUnmount, flushPromises, mount } from '@vue/test-utils'
import ProxySelector from '../ProxySelector.vue'
import type { Proxy } from '@/types'

const testProxy = vi.hoisted(() => vi.fn())
vi.mock('@/api/admin', () => ({ adminAPI: { proxies: { testProxy } } }))
vi.mock('vue-i18n', () => ({ useI18n: () => ({ t: (key: string) => key }) }))
enableAutoUnmount(afterEach)
beforeEach(() => { vi.clearAllMocks() })

async function openSelector() {
  const wrapper = mount(ProxySelector, {
    props: { modelValue: null, proxies: [1, 2].map(id => ({
      id, name: `Proxy ${id}`, host: 'localhost', port: 8080, protocol: 'http'
    } as Proxy)) },
    global: { stubs: { Icon: true }, attachTo: document.body }
  })
  await wrapper.get('.select-trigger').trigger('click')
  return wrapper
}

function portalButton(selector: string) {
  const element = document.body.querySelector<HTMLButtonElement>(selector)
  if (!element) throw new Error(`Missing portal button: ${selector}`)
  return element
}

describe('proxy connection tests', () => {
  it('does not restart an individual test when a batch is started', async () => {
    let finish!: (result: object) => void
    testProxy.mockImplementation((id: number) => id === 1
      ? new Promise(resolve => { finish = resolve })
      : Promise.resolve({ success: true, country: 'GB' }))
    const wrapper = await openSelector()
    portalButton('[data-testid="common-proxy-selector-button-handle-test-proxy-proxy"]').click()
    portalButton('[data-testid="common-proxy-selector-button-handle-batch-test"]').click()
    await flushPromises()
    expect(testProxy.mock.calls.map(([id]) => id)).toEqual([1, 2])
    expect(portalButton('[data-testid="common-proxy-selector-button-handle-test-proxy-proxy"]').disabled).toBe(true)
    finish({ success: true, country: 'US' })
    await flushPromises()
    expect(document.body.textContent).toContain('US')
    expect(portalButton('[data-testid="common-proxy-selector-button-handle-test-proxy-proxy"]').disabled).toBe(false)
  })

  it('shows per-proxy outcomes and allows another batch after a failure', async () => {
    testProxy.mockImplementation((id: number) => id === 1
      ? Promise.reject(new Error('offline'))
      : Promise.resolve({ success: true, country: 'GB' }))
    const wrapper = await openSelector()
    portalButton('[data-testid="common-proxy-selector-button-handle-batch-test"]').click()
    await flushPromises()
    expect(testProxy).toHaveBeenCalledTimes(2)
    expect(document.body.textContent).toContain('admin.proxies.testFailed')
    expect(document.body.textContent).toContain('GB')
    expect(portalButton('[data-testid="common-proxy-selector-button-handle-batch-test"]').disabled).toBe(false)
    portalButton('[data-testid="common-proxy-selector-button-handle-batch-test"]').click()
    await flushPromises()
    expect(testProxy).toHaveBeenCalledTimes(4)
  })
})
